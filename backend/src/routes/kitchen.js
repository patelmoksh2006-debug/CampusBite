import express from 'express';
import { db, memoryDb } from '../db/connection.js';
import { orderWsServer } from '../websocket/server.js';

const router = express.Router();

// GET /api/kitchen/kot-board (Partitioned into 4 Kanban columns)
router.get('/kot-board', async (req, res) => {
  try {
    let ordersWithItems = [];

    if (db.isMysqlActive()) {
      const [orders] = await db.query(`
        SELECT o.*, u.full_name as student_name, u.phone as student_phone, p.slot_label
        FROM orders o
        JOIN users u ON o.user_id = u.id
        LEFT JOIN pickup_slots p ON o.pickup_slot_id = p.id
        ORDER BY o.created_at ASC
      `);

      for (const order of orders) {
        const [items] = await db.query(`
          SELECT oi.*, f.name, f.station_name, f.is_veg, f.is_jain
          FROM order_items oi
          JOIN food_items f ON oi.food_item_id = f.id
          WHERE oi.order_id = ?
        `, [order.id]);
        ordersWithItems.push({
          ...order,
          subtotal_amount: Number(order.subtotal_amount),
          final_amount: Number(order.final_amount),
          items
        });
      }
    } else {
      ordersWithItems = memoryDb.orders.map(order => {
        const user = memoryDb.users.find(u => u.id === order.user_id);
        const slot = memoryDb.pickup_slots.find(s => s.id === order.pickup_slot_id);
        const items = memoryDb.order_items
          .filter(oi => oi.order_id === order.id)
          .map(oi => {
            const f = memoryDb.food_items.find(item => item.id === oi.food_item_id) || {};
            return {
              ...oi,
              name: f.name,
              station_name: f.station_name,
              is_veg: f.is_veg,
              is_jain: f.is_jain
            };
          });

        return {
          ...order,
          student_name: user ? user.full_name : 'Student',
          student_phone: user ? user.phone : '',
          slot_label: slot ? slot.slot_label : 'Standard Lunch',
          items
        };
      });
    }

    // Partition into 4 Kanban Columns
    const kanban = {
      incoming: ordersWithItems.filter(o => o.status === 'PLACED'),
      cooking: ordersWithItems.filter(o => o.status === 'ACCEPTED' || o.status === 'PREPARING'),
      at_counter: ordersWithItems.filter(o => o.status === 'READY'),
      archived: ordersWithItems.filter(o => o.status === 'COMPLETED' || o.status === 'CANCELLED')
    };

    res.json({
      success: true,
      kanban,
      stats: {
        incomingCount: kanban.incoming.length,
        cookingCount: kanban.cooking.length,
        atCounterCount: kanban.at_counter.length,
        archivedCount: kanban.archived.length
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/kitchen/orders/:id/status
router.patch('/orders/:id/status', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const { status, chef_note = '' } = req.body;

    const validStatuses = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid order status' });
    }

    let order = null;

    if (db.isMysqlActive()) {
      const [orders] = await db.query('SELECT * FROM orders WHERE id = ?', [orderId]);
      if (orders.length === 0) return res.status(404).json({ success: false, message: 'Order not found' });
      order = orders[0];

      await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
    } else {
      order = memoryDb.orders.find(o => o.id === orderId);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
      order.status = status;
      order.updated_at = new Date();
    }

    // Formulate custom chef message
    let broadcastNote = chef_note;
    let notificationTitle = `Order Status: ${status}`;
    let notificationMsg = `Your order ${order.order_token} is now ${status}.`;

    if (!broadcastNote) {
      if (status === 'ACCEPTED') {
        broadcastNote = 'Chef Vikram has received your ticket. Stations prep started!';
        notificationTitle = 'Order Accepted by Kitchen!';
        notificationMsg = `Chef Vikram Sharma accepted your ticket for ${order.order_token}. Prep commenced.`;
      } else if (status === 'PREPARING') {
        broadcastNote = 'Tawa & Steam stations sizzling! Food is cooking.';
        notificationTitle = 'Order Cooking at Stations!';
        notificationMsg = `Your dishes for ${order.order_token} are sizzling at the counter.`;
      } else if (status === 'READY') {
        broadcastNote = `HOT & READY! Please approach ${order.counter_assigned} and display PIN ${order.security_pin}.`;
        notificationTitle = '🔔 Your Canteen Order is READY for Pickup!';
        notificationMsg = `Piping hot & packaged at ${order.counter_assigned}! Flash verification PIN ${order.security_pin}.`;
      } else if (status === 'COMPLETED') {
        broadcastNote = 'Tray handed over. Enjoy your campus meal!';
        notificationTitle = 'Order Picked Up!';
        notificationMsg = `Order ${order.order_token} collected. Don't forget to rate your meal for +25 Karma points!`;
      }
    }

    // Persist notification for the student
    if (db.isMysqlActive()) {
      try {
        await db.query(`
          INSERT INTO notifications (user_id, title, message, channel, is_read)
          VALUES (?, ?, ?, 'IN_APP', FALSE)
        `, [order.user_id, notificationTitle, notificationMsg]);
      } catch (e) {
        console.warn('Notification insert warning:', e.message);
      }
    } else {
      memoryDb.notifications.unshift({
        id: memoryDb.notifications.length + 1,
        user_id: order.user_id,
        title: notificationTitle,
        message: notificationMsg,
        channel: 'IN_APP',
        is_read: 0,
        created_at: new Date()
      });
    }

    // Broadcast WebSocket update to student device
    orderWsServer.broadcastOrderUpdate(order.order_token, {
      status,
      chefNote: broadcastNote,
      securityPin: order.security_pin,
      counter: order.counter_assigned,
      isReadyAlert: status === 'READY', // signals frontend to sound buzzer
      notification: {
        title: notificationTitle,
        message: notificationMsg
      }
    });

    res.json({
      success: true,
      message: `Order ${order.order_token} progressed to ${status}. Notification dispatched to student.`,
      status
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/kitchen/products (Add new food item to menu)
router.post('/products', async (req, res) => {
  try {
    const {
      name,
      category_id = 1,
      description = '',
      price,
      is_veg = true,
      is_jain = false,
      prep_time_mins = 10,
      calories = 350,
      spice_level = 1,
      station_name = 'Main Kitchen',
      image_url = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
      initial_stock = 50
    } = req.body;

    if (!name || !price) {
      return res.status(400).json({ success: false, message: 'Dish name and price are required' });
    }

    let newDishId = null;

    if (db.isMysqlActive()) {
      const [dishRes] = await db.query(`
        INSERT INTO food_items (category_id, name, description, price, is_veg, is_jain, prep_time_mins, calories, spice_level, current_stock, station_name, image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [category_id, name, description, price, is_veg ? 1 : 0, is_jain ? 1 : 0, prep_time_mins, calories, spice_level, initial_stock, station_name, image_url]);
      newDishId = dishRes.insertId;

      await db.query(`
        INSERT INTO inventory (food_item_id, current_stock, low_stock_threshold, is_86_killed)
        VALUES (?, ?, 5, FALSE)
      `, [newDishId, initial_stock]);
    } else {
      newDishId = memoryDb.food_items.length > 0 ? Math.max(...memoryDb.food_items.map(f => f.id)) + 1 : 1;
      const newDish = {
        id: newDishId,
        category_id: parseInt(category_id, 10),
        name,
        description,
        price: parseFloat(price),
        is_veg: is_veg ? 1 : 0,
        is_jain: is_jain ? 1 : 0,
        prep_time_mins: parseInt(prep_time_mins, 10),
        calories: parseInt(calories, 10),
        spice_level: parseInt(spice_level, 10),
        current_stock: parseInt(initial_stock, 10),
        is_available: 1,
        station_name,
        image_url
      };
      memoryDb.food_items.push(newDish);
      memoryDb.inventory.push({
        id: memoryDb.inventory.length + 1,
        food_item_id: newDishId,
        current_stock: parseInt(initial_stock, 10),
        low_stock_threshold: 5,
        is_86_killed: 0,
        last_restocked: new Date()
      });
    }

    res.status(201).json({
      success: true,
      message: `Dish "${name}" added to menu catalog successfully!`,
      dishId: newDishId
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/kitchen/products/:id (Delete food item)
router.delete('/products/:id', async (req, res) => {
  try {
    const dishId = parseInt(req.params.id, 10);

    if (db.isMysqlActive()) {
      await db.query('DELETE FROM inventory WHERE food_item_id = ?', [dishId]);
      await db.query('DELETE FROM food_items WHERE id = ?', [dishId]);
    } else {
      memoryDb.food_items = memoryDb.food_items.filter(f => f.id !== dishId);
      memoryDb.inventory = memoryDb.inventory.filter(i => i.food_item_id !== dishId);
    }

    res.json({ success: true, message: `Dish #${dishId} removed from menu catalog` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/kitchen/inventory
router.get('/inventory', async (req, res) => {
  try {
    let inventory = [];

    if (db.isMysqlActive()) {
      const [rows] = await db.query(`
        SELECT i.*, f.name as food_name, f.price, f.station_name, f.image_url, c.name as category_name
        FROM inventory i
        JOIN food_items f ON i.food_item_id = f.id
        LEFT JOIN categories c ON f.category_id = c.id
        ORDER BY f.id ASC
      `);
      inventory = rows.map(r => ({
        ...r,
        is_86_killed: Boolean(r.is_86_killed)
      }));
    } else {
      inventory = memoryDb.inventory.map(inv => {
        const f = memoryDb.food_items.find(item => item.id === inv.food_item_id) || {};
        const c = memoryDb.categories.find(cat => cat.id === f.category_id);
        return {
          ...inv,
          food_name: f.name,
          price: f.price,
          station_name: f.station_name,
          image_url: f.image_url,
          category_name: c ? c.name : 'General',
          is_86_killed: Boolean(inv.is_86_killed)
        };
      });
    }

    res.json({ success: true, inventory });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/kitchen/inventory/86-toggle (Instant out-of-stock kill switch)
router.post('/inventory/86-toggle', async (req, res) => {
  try {
    const { food_item_id, is_86_killed } = req.body;
    if (!food_item_id) {
      return res.status(400).json({ success: false, message: 'food_item_id is required' });
    }

    let updated = null;
    if (db.isMysqlActive()) {
      await db.query(`
        INSERT INTO inventory (food_item_id, current_stock, is_86_killed)
        VALUES (?, 0, ?)
        ON DUPLICATE KEY UPDATE is_86_killed = VALUES(is_86_killed)
      `, [food_item_id, is_86_killed ? 1 : 0]);

      const [rows] = await db.query('SELECT * FROM inventory WHERE food_item_id = ?', [food_item_id]);
      updated = rows[0];
    } else {
      let inv = memoryDb.inventory.find(i => i.food_item_id === food_item_id);
      if (!inv) {
        inv = { id: getNextId('inventory'), food_item_id, current_stock: 0, low_stock_threshold: 5, is_86_killed: is_86_killed ? 1 : 0 };
        memoryDb.inventory.push(inv);
      } else {
        inv.is_86_killed = is_86_killed ? 1 : 0;
        inv.last_restocked = new Date();
      }
      updated = inv;
    }

    // Broadcast inventory 86 state to all connected clients
    orderWsServer.broadcastKitchenEvent({
      type: 'INVENTORY_86_TOGGLED',
      food_item_id,
      is_86_killed: Boolean(is_86_killed)
    });

    res.json({
      success: true,
      message: `Dish status updated: ${is_86_killed ? '86 Killed (Out of Stock)' : 'Restored Available'}`,
      is_86_killed: Boolean(is_86_killed)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/kitchen/throttle (Throttles incoming order flow with delay notification)
router.post('/throttle', async (req, res) => {
  try {
    const { delayMins = 5, reason = 'Heavy lunch rush load on Tawa 2' } = req.body;

    orderWsServer.broadcastKitchenEvent({
      type: 'KITCHEN_THROTTLED',
      delayMins,
      reason,
      announcement: `Kitchen Rush Throttle: Average prep times extended by +${delayMins} mins due to high queue load.`
    });

    res.json({
      success: true,
      message: `Kitchen queue throttled by +${delayMins} mins. Alert sent to student screens.`,
      delayMins
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

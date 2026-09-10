import express from 'express';
import { db, memoryDb, getNextId } from '../db/connection.js';
import { authenticateToken } from './auth.js';
import { calculateBilling } from '../services/billing.js';

const router = express.Router();

// Helper to get or create cart for user
async function getOrCreateCart(userId) {
  if (db.isMysqlActive()) {
    let [carts] = await db.query('SELECT * FROM carts WHERE user_id = ?', [userId]);
    if (carts.length === 0) {
      const [res] = await db.query('INSERT INTO carts (user_id) VALUES (?)', [userId]);
      return { id: res.insertId, user_id: userId };
    }
    return carts[0];
  } else {
    let cart = memoryDb.carts.find(c => c.user_id === userId);
    if (!cart) {
      cart = { id: getNextId('carts'), user_id: userId, updated_at: new Date() };
      memoryDb.carts.push(cart);
    }
    return cart;
  }
}

// GET /api/cart
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await getOrCreateCart(userId);

    let items = [];

    if (db.isMysqlActive()) {
      const [rows] = await db.query(`
        SELECT ci.id as cart_item_id, ci.quantity, ci.special_notes,
               f.id as food_item_id, f.name, f.price, f.image_url, f.is_veg, f.is_jain, f.prep_time_mins, f.station_name,
               COALESCE(inv.is_86_killed, FALSE) as is_86_killed
        FROM cart_items ci
        JOIN food_items f ON ci.food_item_id = f.id
        LEFT JOIN inventory inv ON f.id = inv.food_item_id
        WHERE ci.cart_id = ?
      `, [cart.id]);

      items = rows.map(r => ({
        ...r,
        price: Number(r.price),
        subtotal: Number((r.price * r.quantity).toFixed(2)),
        is_veg: Boolean(r.is_veg),
        is_jain: Boolean(r.is_jain),
        is_86_killed: Boolean(r.is_86_killed)
      }));
    } else {
      const cartLineItems = memoryDb.cart_items.filter(ci => ci.cart_id === cart.id);
      items = cartLineItems.map(ci => {
        const food = memoryDb.food_items.find(f => f.id === ci.food_item_id) || {};
        const inv = memoryDb.inventory.find(i => i.food_item_id === food.id);
        const price = Number(food.price || 0);
        return {
          cart_item_id: ci.id,
          food_item_id: food.id,
          name: food.name,
          price,
          quantity: ci.quantity,
          special_notes: ci.special_notes || '',
          subtotal: Number((price * ci.quantity).toFixed(2)),
          image_url: food.image_url,
          is_veg: Boolean(food.is_veg),
          is_jain: Boolean(food.is_jain),
          prep_time_mins: food.prep_time_mins,
          station_name: food.station_name,
          is_86_killed: inv ? Boolean(inv.is_86_killed) : false
        };
      });
    }

    // Run statutory billing calculations
    const billing = calculateBilling({ items, discountCode: req.query.discount || null, isStudent: req.user.role === 'student' });

    res.json({
      success: true,
      cartId: cart.id,
      items,
      itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
      billing
    });
  } catch (err) {
    console.error('Cart fetch error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/cart/items (Add or update item quantity and special notes)
router.post('/items', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { food_item_id, quantity = 1, special_notes = '' } = req.body;

    if (!food_item_id) {
      return res.status(400).json({ success: false, message: 'food_item_id is required' });
    }

    const cart = await getOrCreateCart(userId);

    if (db.isMysqlActive()) {
      // Check 86 status in inventory
      const [inv] = await db.query('SELECT is_86_killed FROM inventory WHERE food_item_id = ?', [food_item_id]);
      if (inv.length > 0 && inv[0].is_86_killed) {
        return res.status(400).json({ success: false, message: 'This dish is currently 86’d (out-of-stock) by the kitchen.' });
      }

      const [existing] = await db.query('SELECT * FROM cart_items WHERE cart_id = ? AND food_item_id = ?', [cart.id, food_item_id]);
      if (existing.length > 0) {
        const newQty = Math.max(0, quantity === 0 ? 0 : (existing[0].quantity + (quantity || 1)));
        if (newQty === 0) {
          await db.query('DELETE FROM cart_items WHERE id = ?', [existing[0].id]);
        } else {
          await db.query('UPDATE cart_items SET quantity = ?, special_notes = ? WHERE id = ?', [newQty, special_notes || existing[0].special_notes, existing[0].id]);
        }
      } else if (quantity > 0) {
        await db.query('INSERT INTO cart_items (cart_id, food_item_id, quantity, special_notes) VALUES (?, ?, ?, ?)', [cart.id, food_item_id, quantity, special_notes]);
      }
    } else {
      const inv = memoryDb.inventory.find(i => i.food_item_id === food_item_id);
      if (inv && inv.is_86_killed) {
        return res.status(400).json({ success: false, message: 'This dish is currently 86’d (out-of-stock) by the kitchen.' });
      }

      const existingIndex = memoryDb.cart_items.findIndex(ci => ci.cart_id === cart.id && ci.food_item_id === food_item_id);
      if (existingIndex > -1) {
        const current = memoryDb.cart_items[existingIndex];
        const newQty = Math.max(0, current.quantity + (quantity || 1));
        if (newQty === 0) {
          memoryDb.cart_items.splice(existingIndex, 1);
        } else {
          current.quantity = newQty;
          if (special_notes) current.special_notes = special_notes;
        }
      } else if (quantity > 0) {
        memoryDb.cart_items.push({
          id: getNextId('cart_items'),
          cart_id: cart.id,
          food_item_id,
          quantity,
          special_notes: special_notes || ''
        });
      }
    }

    res.json({ success: true, message: 'Cart updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/cart/items/:id (Remove item or update specific item)
router.delete('/items/:id', authenticateToken, async (req, res) => {
  try {
    const cartItemId = parseInt(req.params.id, 10);
    if (db.isMysqlActive()) {
      await db.query('DELETE FROM cart_items WHERE id = ?', [cartItemId]);
    } else {
      const index = memoryDb.cart_items.findIndex(ci => ci.id === cartItemId);
      if (index > -1) memoryDb.cart_items.splice(index, 1);
    }
    res.json({ success: true, message: 'Item removed from cart' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/cart (Clear entire cart)
router.delete('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await getOrCreateCart(userId);
    if (db.isMysqlActive()) {
      await db.query('DELETE FROM cart_items WHERE cart_id = ?', [cart.id]);
    } else {
      memoryDb.cart_items = memoryDb.cart_items.filter(ci => ci.cart_id !== cart.id);
    }
    res.json({ success: true, message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

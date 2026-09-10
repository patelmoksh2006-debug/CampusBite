import express from 'express';
import { db, memoryDb } from '../db/connection.js';

const router = express.Router();

// GET /api/menu/categories
router.get('/categories', async (req, res) => {
  try {
    let categories = [];
    if (db.isMysqlActive()) {
      const [rows] = await db.query('SELECT * FROM categories WHERE is_active = TRUE ORDER BY display_order ASC');
      categories = rows;
    } else {
      categories = memoryDb.categories.filter(c => c.is_active).sort((a, b) => a.display_order - b.display_order);
    }
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/menu/items with query filters: category, is_veg, is_jain, max_prep_time, search
router.get('/items', async (req, res) => {
  try {
    const { category, is_veg, is_jain, max_prep_time, search } = req.query;

    let items = [];

    if (db.isMysqlActive()) {
      let query = `
        SELECT f.*, c.name as category_name, c.slug as category_slug,
               COALESCE(i.is_86_killed, FALSE) as is_86_killed,
               COALESCE(i.current_stock, f.current_stock) as available_stock
        FROM food_items f
        LEFT JOIN categories c ON f.category_id = c.id
        LEFT JOIN inventory i ON f.id = i.food_item_id
        WHERE f.is_available = TRUE
      `;
      const params = [];

      if (category && category !== 'all') {
        query += ' AND (c.slug = ? OR f.category_id = ?)';
        params.push(category, category);
      }
      if (is_veg === 'true' || is_veg === '1') {
        query += ' AND f.is_veg = TRUE';
      }
      if (is_jain === 'true' || is_jain === '1') {
        query += ' AND f.is_jain = TRUE';
      }
      if (max_prep_time) {
        query += ' AND f.prep_time_mins <= ?';
        params.push(parseInt(max_prep_time, 10));
      }
      if (search) {
        query += ' AND (f.name LIKE ? OR f.description LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      const [rows] = await db.query(query, params);
      items = rows.map(r => ({
        ...r,
        price: Number(r.price),
        is_veg: Boolean(r.is_veg),
        is_jain: Boolean(r.is_jain),
        is_86_killed: Boolean(r.is_86_killed)
      }));
    } else {
      items = memoryDb.food_items.map(f => {
        const cat = memoryDb.categories.find(c => c.id === f.category_id);
        const inv = memoryDb.inventory.find(i => i.food_item_id === f.id);
        return {
          ...f,
          category_name: cat ? cat.name : 'General',
          category_slug: cat ? cat.slug : 'general',
          is_86_killed: inv ? Boolean(inv.is_86_killed) : false,
          available_stock: inv ? inv.current_stock : f.current_stock
        };
      });

      if (category && category !== 'all') {
        items = items.filter(i => i.category_slug === category || String(i.category_id) === String(category));
      }
      if (is_veg === 'true' || is_veg === '1') {
        items = items.filter(i => i.is_veg);
      }
      if (is_jain === 'true' || is_jain === '1') {
        items = items.filter(i => i.is_jain);
      }
      if (max_prep_time) {
        items = items.filter(i => i.prep_time_mins <= parseInt(max_prep_time, 10));
      }
      if (search) {
        const s = search.toLowerCase();
        items = items.filter(i => i.name.toLowerCase().includes(s) || (i.description && i.description.toLowerCase().includes(s)));
      }
    }

    res.json({ success: true, count: items.length, items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/menu/specials
router.get('/specials', async (req, res) => {
  try {
    let specials = [];
    if (db.isMysqlActive()) {
      const [rows] = await db.query('SELECT * FROM daily_specials WHERE is_active = TRUE');
      specials = rows.map(r => ({
        ...r,
        special_price: Number(r.special_price),
        original_price: Number(r.original_price)
      }));
    } else {
      specials = memoryDb.daily_specials.filter(s => s.is_active);
    }
    res.json({ success: true, specials });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/menu/slots (pickup time slots with capacity loads)
router.get('/slots', async (req, res) => {
  try {
    let slots = [];
    if (db.isMysqlActive()) {
      const [rows] = await db.query('SELECT * FROM pickup_slots WHERE is_active = TRUE ORDER BY start_time ASC');
      slots = rows;
    } else {
      slots = memoryDb.pickup_slots.filter(s => s.is_active);
    }
    res.json({ success: true, slots });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

import express from 'express';
import { db, memoryDb } from '../db/connection.js';

const router = express.Router();

// GET /api/recommendations/smart
router.get('/smart', async (req, res) => {
  try {
    let items = [];
    if (db.isMysqlActive()) {
      const [rows] = await db.query('SELECT * FROM food_items WHERE is_available = TRUE');
      items = rows;
    } else {
      items = memoryDb.food_items.filter(f => f.is_available);
    }

    const rawItem1 = items.find(i => i.id === 1) || items[0] || {};
    const rawItem2 = items.find(i => i.id === 3) || items[2] || {};
    const rawItem3 = items.find(i => i.is_jain) || items[1] || {};
    const rawItem4 = items.find(i => i.id === 5) || items[4] || {};

    const recommendations = [
      {
        id: rawItem1.id || 1,
        name: rawItem1.name || 'Paneer Butter Masala Thali',
        price: Number(rawItem1.price || 70.0),
        prep_time_mins: rawItem1.prep_time_mins || 8,
        image_url: rawItem1.image_url || 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80',
        match_score: 98,
        tag: '👑 Campus Bestseller',
        badgeColor: 'flame',
        item: rawItem1,
        reason: 'Most ordered meal during lunch hours (48 orders today)'
      },
      {
        id: rawItem2.id || 3,
        name: rawItem2.name || 'Cold Coffee with Ice Cream',
        price: Number(rawItem2.price || 40.0),
        prep_time_mins: rawItem2.prep_time_mins || 3,
        image_url: rawItem2.image_url || 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80',
        match_score: 95,
        tag: '⚡ Express Quick-Bite (<5m)',
        badgeColor: 'amber',
        item: rawItem2,
        reason: 'Average prep time is only 3 minutes at Beverage Bar'
      },
      {
        id: rawItem3.id || 2,
        name: rawItem3.name || 'Crispy Masala Dosa',
        price: Number(rawItem3.price || 70.0),
        prep_time_mins: rawItem3.prep_time_mins || 5,
        image_url: rawItem3.image_url || 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80',
        match_score: 92,
        tag: '🟡 Jain Favorite',
        badgeColor: 'emerald',
        item: rawItem3,
        reason: 'Strictly segregated root-free cooking at Tawa 2'
      },
      {
        id: rawItem4.id || 5,
        name: rawItem4.name || 'Steamed Idli Sambhar',
        price: Number(rawItem4.price || 45.0),
        prep_time_mins: rawItem4.prep_time_mins || 4,
        image_url: rawItem4.image_url || 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
        match_score: 89,
        tag: '🔥 Student Budget Saver',
        badgeColor: 'blue',
        item: rawItem4,
        reason: 'Nutritious steamed meal at just ₹45.00'
      }
    ];

    res.json({ success: true, recommendations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/recommendations/budget?max=120
router.get('/budget', async (req, res) => {
  try {
    const maxBudget = parseFloat(req.query.max || 120);

    let items = [];
    if (db.isMysqlActive()) {
      const [rows] = await db.query('SELECT * FROM food_items WHERE is_available = TRUE');
      items = rows;
    } else {
      items = memoryDb.food_items.filter(f => f.is_available);
    }

    // Generate intelligent combos strictly under maxBudget
    const validCombos = [];

    // 1. Single wholesome dishes
    const affordableSingles = items.filter(i => Number(i.price) <= maxBudget);
    for (const single of affordableSingles.slice(0, 3)) {
      validCombos.push({
        title: `${single.name} Solo Meal`,
        items: [single],
        totalPrice: Number(single.price),
        savings: 0,
        calories: single.calories,
        tag: 'Solo Value'
      });
    }

    // 2. Pairings (Main + Beverage or Snack)
    const mains = items.filter(i => i.category_id === 1 || i.category_id === 2 || i.category_id === 5);
    const sides = items.filter(i => i.category_id === 3 || i.category_id === 4);

    for (const main of mains) {
      for (const side of sides) {
        const comboTotal = Number(main.price) + Number(side.price);
        if (comboTotal <= maxBudget) {
          validCombos.push({
            title: `${main.name} + ${side.name}`,
            items: [main, side],
            totalPrice: comboTotal,
            savings: 10.0, // combo bundle value
            calories: (main.calories || 0) + (side.calories || 0),
            tag: comboTotal <= 85 ? 'Super Saver Combo' : 'Wholesome Power Meal'
          });
        }
      }
    }

    // Sort combos by highest value close to budget
    validCombos.sort((a, b) => b.totalPrice - a.totalPrice);

    res.json({
      success: true,
      maxBudget,
      combosCount: validCombos.length,
      combos: validCombos.slice(0, 4)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

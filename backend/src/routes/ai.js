import express from 'express';
import { db, memoryDb } from '../db/connection.js';

const router = express.Router();

// Knowledge-based AI Canteen Assistant
router.post('/chat', async (req, res) => {
  try {
    const { message = '', token = null } = req.body;
    const query = message.toLowerCase().trim();

    // Get current menu state
    let items = [];
    if (db.isMysqlActive()) {
      const [rows] = await db.query('SELECT * FROM food_items WHERE is_available = TRUE');
      items = rows;
    } else {
      items = memoryDb.food_items;
    }

    let reply = '';
    let suggestions = [];
    let whatsappText = encodeURIComponent(`Hi CampusBite Support, I have a query: "${message}"`);
    const whatsappLink = `https://wa.me/919876543210?text=${whatsappText}`;

    // Intelligent query analysis
    if (query.includes('jain') || query.includes('no onion') || query.includes('no garlic')) {
      const jainItems = items.filter(i => Boolean(i.is_jain));
      reply = `We have strict Jain-compliant segregation at Tawa 2 and Steam counters! Current Jain dishes:\n` +
        jainItems.map(i => `• ${i.name} (₹${Number(i.price).toFixed(2)}) — ${i.station_name}`).join('\n') +
        `\n\nAll prepared with separate utensils and zero root vegetables.`;
      suggestions = ['How fast is Masala Dosa?', 'Apply HACK50 Coupon', 'Track my order'];
    } else if (query.includes('veg') || query.includes('vegetarian')) {
      const vegItems = items.filter(i => Boolean(i.is_veg));
      reply = `Our entire North Canteen is 100% Pure Vegetarian certified by FSSAI Grade A+! Customer favorites include:\n` +
        vegItems.slice(0, 4).map(i => `• ${i.name} (₹${Number(i.price).toFixed(2)}) — ${i.calories} kcal`).join('\n') +
        `\n\nCheck out the full catalog on the Menu page.`;
      suggestions = ['Show Jain items', 'What is HACK50?', 'Can I pay with UPI?'];
    } else if (query.includes('hack50') || query.includes('discount') || query.includes('coupon') || query.includes('offer')) {
      reply = `🎉 Coupon **HACK50** gives you an instant flat ₹50.00 OFF whenever your tray subtotal reaches ₹199 or more!\n\n` +
        `Plus, enrolled university students automatically receive the **₹8.00 Welfare Subsidy** funded by the Student Union. Add dishes to reach ₹199 to unlock both!`;
      suggestions = ['Show recommended combo for ₹199', 'What are pickup slots?', 'Order Thali'];
    } else if (query.includes('cancel') || query.includes('refund') || query.includes('money back')) {
      reply = `CampusBite provides a guaranteed **2-Minute Instant 100% Wallet Refund Window** while your ticket is in the 'PLACED' stage.\n\n` +
        `If your food is cold or delayed after pickup, log a 1-click claim under the **15-Minute Dining Guarantee SLA** on the Feedback desk for instant automated refund.`;
      suggestions = ['How to check wallet balance?', 'Track my order', 'Connect on WhatsApp'];
    } else if (query.includes('track') || query.includes('status') || query.includes('token') || query.includes('ready')) {
      reply = `You can track your live ticket progression on the **Live Tracking** page (` +
        `/tracking). Our kitchen broadcasts 4 stages: PLACED → ACCEPTED → PREPARING → READY. When Chef Vikram marks it READY, an audible synthesizer buzzer will alert your phone! Show your 4-digit PIN at the assigned counter.`;
      suggestions = ['Track #TOKEN-412', 'Show Menu', 'Connect on WhatsApp'];
    } else if (query.includes('whatsapp') || query.includes('human') || query.includes('help') || query.includes('contact') || query.includes('chef')) {
      reply = `You can reach our live student dining helpdesk on WhatsApp at **+91 98765 43210** or Chef Vikram at Tawa Station 2. Click the button below to start a simulated WhatsApp chat.`;
      suggestions = ['What is today\'s special?', 'Show Thali details', 'Check wallet'];
    } else if (query.includes('thali') || query.includes('lunch') || query.includes('meal')) {
      reply = `Our bestselling lunch is the **Paneer Butter Masala Thali (₹70.00)** with 3 Butter Rotis, Jeera Rice, Dal Tadka, Salad & Gulab Jamun (520 kcal). Prepared fresh at Tawa 2 in ~8 minutes!`;
      suggestions = ['Add Thali to tray', 'Show Jain food', 'Apply HACK50'];
    } else if (query.includes('calorie') || query.includes('diet') || query.includes('healthy')) {
      reply = `Here are low-calorie and nutritious options:\n` +
        `• Steamed Idli Sambhar (2 Pcs) — 180 kcal (Steam Station)\n` +
        `• Crispy Masala Dosa — 310 kcal (Tawa 2)\n` +
        `• Kadak Masala Chai — 75 kcal\n` +
        `All items display exact calorie counts and spice meters on their 3D cards!`;
      suggestions = ['Show Steamed Idli', 'What is HACK50?', 'Check pickup slots'];
    } else {
      reply = `Hello! I am **ChefBot**, your CampusBite AI Dining Assistant. I can help you with today's canteen menu, Jain/Pure Veg dishes, the HACK50 ₹50 discount, live prep queue status, or connecting to WhatsApp support. What would you like to know?`;
      suggestions = ['Show Pure Veg dishes', 'What are Jain options?', 'How does HACK50 work?', 'Connect on WhatsApp'];
    }

    res.json({
      success: true,
      reply,
      suggestions,
      whatsappLink,
      supportPhone: '+91 98765 43210',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

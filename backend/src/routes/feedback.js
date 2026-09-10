import express from 'express';
import { db, memoryDb, getNextId } from '../db/connection.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// POST /api/orders/:token/feedback (4-star rubric + 25 karma points)
router.post('/orders/:token/feedback', authenticateToken, async (req, res) => {
  try {
    const rawToken = req.params.token;
    const token = rawToken.startsWith('#') ? rawToken : `#${rawToken}`;
    const userId = req.user.id;
    const {
      taste_rating = 5,
      speed_rating = 5,
      hygiene_rating = 5,
      courtesy_rating = 5,
      dietary_honored = true,
      comment = '',
      photo_attached = false
    } = req.body;

    let order = null;
    if (db.isMysqlActive()) {
      const [orders] = await db.query('SELECT * FROM orders WHERE order_token = ?', [token]);
      if (orders.length === 0) return res.status(404).json({ success: false, message: 'Order not found' });
      order = orders[0];
    } else {
      order = memoryDb.orders.find(o => o.order_token.toUpperCase() === token.toUpperCase());
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const karmaPointsAwarded = photo_attached ? 35 : 25; // Bonus +10 karma for tray photo upload

    if (db.isMysqlActive()) {
      await db.query(`
        INSERT INTO feedback (order_id, user_id, taste_rating, speed_rating, hygiene_rating, courtesy_rating, dietary_honored, comment, karma_points_awarded)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          taste_rating = VALUES(taste_rating),
          speed_rating = VALUES(speed_rating),
          hygiene_rating = VALUES(hygiene_rating),
          courtesy_rating = VALUES(courtesy_rating),
          dietary_honored = VALUES(dietary_honored),
          comment = VALUES(comment),
          karma_points_awarded = VALUES(karma_points_awarded)
      `, [order.id, userId, taste_rating, speed_rating, hygiene_rating, courtesy_rating, dietary_honored ? 1 : 0, comment, karmaPointsAwarded]);
    } else {
      const existingIdx = memoryDb.feedback.findIndex(f => f.order_id === order.id);
      const entry = {
        id: getNextId('feedback'),
        order_id: order.id,
        user_id: userId,
        taste_rating: Number(taste_rating),
        speed_rating: Number(speed_rating),
        hygiene_rating: Number(hygiene_rating),
        courtesy_rating: Number(courtesy_rating),
        dietary_honored: Boolean(dietary_honored),
        comment,
        karma_points_awarded: karmaPointsAwarded,
        created_at: new Date()
      };
      if (existingIdx > -1) {
        memoryDb.feedback[existingIdx] = entry;
      } else {
        memoryDb.feedback.push(entry);
      }
    }

    res.json({
      success: true,
      message: `Feedback recorded! +${karmaPointsAwarded} Campus Karma points added to your dining profile.`,
      karmaPointsAwarded,
      dietaryHonored: Boolean(dietary_honored)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders/:token/feedback
router.get('/orders/:token/feedback', authenticateToken, async (req, res) => {
  try {
    const rawToken = req.params.token;
    const token = rawToken.startsWith('#') ? rawToken : `#${rawToken}`;

    let order = null;
    let feedback = null;

    if (db.isMysqlActive()) {
      const [orders] = await db.query('SELECT id FROM orders WHERE order_token = ?', [token]);
      if (orders.length === 0) return res.json({ success: true, feedback: null });
      order = orders[0];

      const [rows] = await db.query('SELECT * FROM feedback WHERE order_id = ?', [order.id]);
      feedback = rows[0] || null;
    } else {
      order = memoryDb.orders.find(o => o.order_token.toUpperCase() === token.toUpperCase());
      if (order) {
        feedback = memoryDb.feedback.find(f => f.order_id === order.id) || null;
      }
    }

    res.json({ success: true, feedback });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/grievances/create (1-click issue reporting with 15-minute refund guarantee SLA)
router.post('/grievances/create', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { order_token, issue_type = 'COLD_FOOD', description = '' } = req.body;

    let order = null;
    let wallet = null;

    if (db.isMysqlActive()) {
      const [orders] = await db.query('SELECT * FROM orders WHERE order_token = ?', [order_token]);
      if (orders.length === 0) return res.status(404).json({ success: false, message: 'Order not found' });
      order = orders[0];
      const [wallets] = await db.query('SELECT * FROM wallets WHERE user_id = ?', [userId]);
      wallet = wallets[0] || null;
    } else {
      order = memoryDb.orders.find(o => o.order_token.toUpperCase() === order_token.toUpperCase());
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
      wallet = memoryDb.wallets.find(w => w.user_id === userId) || null;
    }

    // Auto-approve 50% or 100% refund under university canteen 15-minute guarantee SLA
    const refundAmount = Number((Number(order.final_amount) * (issue_type === 'MISSING_ITEM' ? 1.0 : 0.5)).toFixed(2));
    let postBalance = 0;

    if (db.isMysqlActive()) {
      await db.query(`
        INSERT INTO grievances (order_id, user_id, issue_type, description, status, refund_amount, resolved_at)
        VALUES (?, ?, ?, ?, 'REFUNDED', ?, NOW())
      `, [order.id, userId, issue_type, description, refundAmount]);

      if (wallet) {
        postBalance = Number(wallet.balance) + refundAmount;
        await db.query('UPDATE wallets SET balance = ? WHERE id = ?', [postBalance, wallet.id]);
        await db.query(`
          INSERT INTO wallet_transactions (wallet_id, order_id, amount, transaction_type, category, reference_note, post_balance)
          VALUES (?, ?, ?, 'REFUND', 'REFUND', ?, ?)
        `, [wallet.id, order.id, refundAmount, `15-Min Guarantee Refund: ${issue_type}`, postBalance]);
      }
    } else {
      const gId = getNextId('grievances');
      memoryDb.grievances.push({
        id: gId,
        order_id: order.id,
        user_id: userId,
        issue_type,
        description,
        status: 'REFUNDED',
        refund_amount: refundAmount,
        resolved_at: new Date(),
        created_at: new Date()
      });

      if (wallet) {
        postBalance = Number(wallet.balance) + refundAmount;
        wallet.balance = postBalance;
        memoryDb.wallet_transactions.unshift({
          id: getNextId('wallet_transactions'),
          wallet_id: wallet.id,
          order_id: order.id,
          amount: refundAmount,
          transaction_type: 'REFUND',
          category: 'REFUND',
          reference_note: `15-Min Guarantee SLA Refund: ${issue_type}`,
          post_balance: postBalance,
          created_at: new Date()
        });
      }
    }

    res.json({
      success: true,
      message: `Grievance registered. Under the 15-Minute Campus Dining Guarantee, ₹${refundAmount.toFixed(2)} has been credited back to your Campus Wallet immediately.`,
      refundAmount,
      ticketStatus: 'REFUNDED',
      newWalletBalance: Number(postBalance.toFixed(2))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/grievances/my
router.get('/grievances/my', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    let list = [];

    if (db.isMysqlActive()) {
      const [rows] = await db.query(`
        SELECT g.*, o.order_token
        FROM grievances g
        JOIN orders o ON g.order_id = o.id
        WHERE g.user_id = ?
        ORDER BY g.created_at DESC
      `, [userId]);
      list = rows;
    } else {
      list = memoryDb.grievances
        .filter(g => g.user_id === userId)
        .map(g => {
          const ord = memoryDb.orders.find(o => o.id === g.order_id);
          return {
            ...g,
            order_token: ord ? ord.order_token : 'N/A'
          };
        });
    }

    res.json({ success: true, grievances: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

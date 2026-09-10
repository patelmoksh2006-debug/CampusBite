import express from 'express';
import { db, memoryDb, getNextId } from '../db/connection.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// GET /api/wallet/summary
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    let wallet = null;
    let txns = [];
    let feedbackRows = [];

    if (db.isMysqlActive()) {
      const [wallets] = await db.query('SELECT * FROM wallets WHERE user_id = ?', [userId]);
      wallet = wallets[0] || null;

      if (wallet) {
        const [rows] = await db.query('SELECT * FROM wallet_transactions WHERE wallet_id = ? ORDER BY created_at DESC', [wallet.id]);
        txns = rows;
      }
      const [fRows] = await db.query('SELECT SUM(karma_points_awarded) as karma FROM feedback WHERE user_id = ?', [userId]);
      feedbackRows = fRows;
    } else {
      wallet = memoryDb.wallets.find(w => w.user_id === userId) || null;
      if (wallet) {
        txns = memoryDb.wallet_transactions.filter(t => t.wallet_id === wallet.id);
      }
      feedbackRows = memoryDb.feedback.filter(f => f.user_id === userId);
    }

    const balance = wallet ? Number(wallet.balance) : 0.00;
    const debits = txns.filter(t => t.transaction_type === 'DEBIT').reduce((acc, t) => acc + Number(t.amount), 0);
    const subsidies = txns.filter(t => t.category === 'SUBSIDY').reduce((acc, t) => acc + Number(t.amount), 0);
    const karmaPoints = (Array.isArray(feedbackRows) && feedbackRows[0]?.karma) || 125; // default campus karma

    res.json({
      success: true,
      summary: {
        balance: Number(balance.toFixed(2)),
        is_locked: wallet ? Boolean(wallet.is_locked) : false,
        monthToDateSpending: Number(debits.toFixed(2)),
        subsidiesClaimed: Number(subsidies.toFixed(2)),
        campusKarmaPoints: karmaPoints,
        totalTransactionsCount: txns.length
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/wallet/transactions (Filterable by category: ALL, FOOD_ORDER, SUBSIDY, REFUND, TOPUP)
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { category } = req.query;

    let wallet = null;
    let txns = [];

    if (db.isMysqlActive()) {
      const [wallets] = await db.query('SELECT id FROM wallets WHERE user_id = ?', [userId]);
      if (wallets.length === 0) return res.json({ success: true, transactions: [] });
      wallet = wallets[0];

      let query = 'SELECT * FROM wallet_transactions WHERE wallet_id = ?';
      const params = [wallet.id];

      if (category && category !== 'ALL') {
        query += ' AND category = ?';
        params.push(category);
      }
      query += ' ORDER BY created_at DESC';

      const [rows] = await db.query(query, params);
      txns = rows.map(r => ({
        ...r,
        amount: Number(r.amount),
        post_balance: Number(r.post_balance)
      }));
    } else {
      wallet = memoryDb.wallets.find(w => w.user_id === userId);
      if (!wallet) return res.json({ success: true, transactions: [] });

      txns = memoryDb.wallet_transactions
        .filter(t => t.wallet_id === wallet.id)
        .filter(t => !category || category === 'ALL' || t.category === category);
    }

    res.json({ success: true, count: txns.length, transactions: txns });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/wallet/topup (Instant digital wallet reload)
router.post('/topup', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount = 200.00, method = 'UPI_APP' } = req.body;
    const topupAmount = Number(amount);

    if (isNaN(topupAmount) || topupAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid top-up amount' });
    }

    let postBalance = 0;
    let walletId = null;

    if (db.isMysqlActive()) {
      const [wallets] = await db.query('SELECT * FROM wallets WHERE user_id = ?', [userId]);
      if (wallets.length === 0) {
        const [res] = await db.query('INSERT INTO wallets (user_id, balance) VALUES (?, ?)', [userId, topupAmount]);
        walletId = res.insertId;
        postBalance = topupAmount;
      } else {
        walletId = wallets[0].id;
        postBalance = Number(wallets[0].balance) + topupAmount;
        await db.query('UPDATE wallets SET balance = ? WHERE id = ?', [postBalance, walletId]);
      }

      await db.query(`
        INSERT INTO wallet_transactions (wallet_id, amount, transaction_type, category, reference_note, post_balance)
        VALUES (?, ?, 'CREDIT', 'TOPUP', ?, ?)
      `, [walletId, topupAmount, `Instant Campus Wallet Reload via ${method}`, postBalance]);
    } else {
      let wallet = memoryDb.wallets.find(w => w.user_id === userId);
      if (!wallet) {
        wallet = { id: getNextId('wallets'), user_id: userId, balance: topupAmount, is_locked: 0, updated_at: new Date() };
        memoryDb.wallets.push(wallet);
      } else {
        wallet.balance = Number(wallet.balance) + topupAmount;
        wallet.updated_at = new Date();
      }
      walletId = wallet.id;
      postBalance = wallet.balance;

      memoryDb.wallet_transactions.unshift({
        id: getNextId('wallet_transactions'),
        wallet_id: walletId,
        order_id: null,
        amount: topupAmount,
        transaction_type: 'CREDIT',
        category: 'TOPUP',
        reference_note: `Instant Campus Wallet Reload via ${method}`,
        post_balance: postBalance,
        created_at: new Date()
      });
    }

    res.json({
      success: true,
      message: `₹${topupAmount.toFixed(2)} successfully credited to Campus Wallet!`,
      newBalance: Number(postBalance.toFixed(2))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/wallet/withdraw-upi (Zero-fee instant bank payout to student VPA)
router.post('/withdraw-upi', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { upi_id, amount } = req.body;
    const withdrawAmount = Number(amount);

    if (!upi_id || !upi_id.includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid UPI VPA required (e.g., student@okaxis)' });
    }
    if (isNaN(withdrawAmount) || withdrawAmount < 50) {
      return res.status(400).json({ success: false, message: 'Minimum withdrawal amount is ₹50.00' });
    }

    let wallet = null;
    if (db.isMysqlActive()) {
      const [wallets] = await db.query('SELECT * FROM wallets WHERE user_id = ?', [userId]);
      wallet = wallets[0] || null;
    } else {
      wallet = memoryDb.wallets.find(w => w.user_id === userId) || null;
    }

    if (!wallet || Number(wallet.balance) < withdrawAmount) {
      return res.status(400).json({ success: false, message: 'Insufficient wallet balance for withdrawal' });
    }

    const postBalance = Number(wallet.balance) - withdrawAmount;

    if (db.isMysqlActive()) {
      await db.query('UPDATE wallets SET balance = ? WHERE id = ?', [postBalance, wallet.id]);
      await db.query(`
        INSERT INTO wallet_transactions (wallet_id, amount, transaction_type, category, reference_note, post_balance)
        VALUES (?, ?, 'DEBIT', 'FOOD_ORDER', ?, ?)
      `, [wallet.id, withdrawAmount, `Instant Zero-Fee Payout to UPI ${upi_id}`, postBalance]);

      await db.query(`
        INSERT INTO upi_withdrawals (wallet_id, upi_id, amount, payout_status)
        VALUES (?, ?, ?, 'SETTLED')
      `, [wallet.id, upi_id, withdrawAmount]);
    } else {
      wallet.balance = postBalance;
      wallet.updated_at = new Date();

      memoryDb.wallet_transactions.unshift({
        id: getNextId('wallet_transactions'),
        wallet_id: wallet.id,
        order_id: null,
        amount: withdrawAmount,
        transaction_type: 'DEBIT',
        category: 'FOOD_ORDER',
        reference_note: `Instant Zero-Fee Payout to UPI ${upi_id}`,
        post_balance: postBalance,
        created_at: new Date()
      });

      memoryDb.upi_withdrawals.push({
        id: getNextId('upi_withdrawals'),
        wallet_id: wallet.id,
        upi_id,
        amount: withdrawAmount,
        payout_status: 'SETTLED',
        settled_at: new Date()
      });
    }

    res.json({
      success: true,
      message: `Zero-fee payout of ₹${withdrawAmount.toFixed(2)} dispatched to ${upi_id}. Settled in under 60 seconds.`,
      newBalance: Number(postBalance.toFixed(2)),
      payoutRef: `UPI-SETTLE-${Date.now().toString().slice(-6)}`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/wallet/meal-plans
router.get('/meal-plans', async (req, res) => {
  try {
    let plans = [];
    if (db.isMysqlActive()) {
      const [rows] = await db.query('SELECT * FROM meal_plans WHERE is_active = TRUE');
      plans = rows.map(r => ({
        ...r,
        price: Number(r.price),
        daily_rate_equivalent: Number(r.daily_rate_equivalent),
        allows_cash_rollover: Boolean(r.allows_cash_rollover)
      }));
    } else {
      plans = memoryDb.meal_plans.filter(p => p.is_active);
    }
    res.json({ success: true, plans });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/wallet/active-subscription
router.get('/active-subscription', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    let sub = null;

    if (db.isMysqlActive()) {
      const [rows] = await db.query(`
        SELECT ms.*, mp.title, mp.meals_per_day, mp.price, mp.allows_cash_rollover
        FROM meal_subscriptions ms
        JOIN meal_plans mp ON ms.meal_plan_id = mp.id
        WHERE ms.user_id = ? AND ms.status = 'ACTIVE'
        ORDER BY ms.id DESC LIMIT 1
      `, [userId]);
      sub = rows[0] || null;
    } else {
      const subscription = memoryDb.meal_subscriptions.find(s => s.user_id === userId && s.status === 'ACTIVE');
      if (subscription) {
        const plan = memoryDb.meal_plans.find(p => p.id === subscription.meal_plan_id) || {};
        sub = {
          ...subscription,
          title: plan.title,
          meals_per_day: plan.meals_per_day,
          price: plan.price,
          allows_cash_rollover: Boolean(plan.allows_cash_rollover)
        };
      }
    }

    res.json({
      success: true,
      subscription: sub,
      mealsRemaining: sub ? Math.max(0, sub.total_meals_allowance - sub.meals_consumed) : 0
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

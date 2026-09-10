import express from 'express';
import { db, memoryDb, getNextId } from '../db/connection.js';
import { authenticateToken } from './auth.js';
import {
  calculateBilling,
  generateOrderToken,
  generateSecurityPin,
  generateTransactionRef,
  STATUTORY_CONFIG
} from '../services/billing.js';
import { orderWsServer } from '../websocket/server.js';

const router = express.Router();

// Helper to calculate progress % and remaining seconds based on status and created_at
function computeOrderTelemetry(order) {
  const status = order.status;
  const createdAt = new Date(order.created_at).getTime();
  const now = Date.now();
  const elapsedSeconds = Math.max(0, Math.floor((now - createdAt) / 1000));
  const estimatedTotalSeconds = 8 * 60; // 8 minutes default average
  const remainingSeconds = Math.max(0, estimatedTotalSeconds - elapsedSeconds);

  let progressPercent = 15;
  let stageIndex = 0; // 0: PLACED, 1: ACCEPTED, 2: PREPARING, 3: READY, 4: COMPLETED
  let chefNote = 'Order received by North Canteen desk. Awaiting kitchen counter acceptance.';

  if (status === 'ACCEPTED') {
    progressPercent = 40;
    stageIndex = 1;
    chefNote = 'Chef Vikram Sharma has accepted ticket. Ingredients staged at Counter 2.';
  } else if (status === 'PREPARING') {
    progressPercent = 75;
    stageIndex = 2;
    chefNote = 'Tawa 2 sizzle active! Rotis on flame & Paneer simmering in cashew gravy.';
  } else if (status === 'READY') {
    progressPercent = 100;
    stageIndex = 3;
    chefNote = 'Your tray is packaged and steaming hot at Counter 2 (Express)! Flash PIN 8942.';
  } else if (status === 'COMPLETED') {
    progressPercent = 100;
    stageIndex = 4;
    chefNote = 'Order picked up successfully. Bon Appétit! Don’t forget to leave feedback.';
  } else if (status === 'CANCELLED') {
    progressPercent = 0;
    stageIndex = -1;
    chefNote = `Order was cancelled. Reason: ${order.cancellation_reason || 'Student requested 2-min auto-refund'}.`;
  }

  // Check 2-minute cancellation refund window (120 seconds)
  const canCancelRefund = (now - createdAt) <= (120 * 1000) && status === 'PLACED';
  const cancelSecondsRemaining = Math.max(0, 120 - elapsedSeconds);

  return {
    progressPercent,
    stageIndex,
    chefNote,
    remainingSeconds: status === 'READY' || status === 'COMPLETED' ? 0 : remainingSeconds,
    canCancelRefund,
    cancelSecondsRemaining
  };
}

// POST /api/orders/checkout
router.post('/checkout', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      pickup_slot_id,
      payment_method = 'WALLET',
      special_instructions = '',
      discount_code = null,
      opt_in_whatsapp = false
    } = req.body;

    // Retrieve items from cart
    let cartItems = [];
    if (db.isMysqlActive()) {
      const [carts] = await db.query('SELECT id FROM carts WHERE user_id = ?', [userId]);
      if (carts.length === 0) {
        return res.status(400).json({ success: false, message: 'Cart is empty' });
      }
      const [rows] = await db.query(`
        SELECT ci.food_item_id, ci.quantity, ci.special_notes, f.name, f.price
        FROM cart_items ci
        JOIN food_items f ON ci.food_item_id = f.id
        WHERE ci.cart_id = ?
      `, [carts[0].id]);
      cartItems = rows;
    } else {
      const cart = memoryDb.carts.find(c => c.user_id === userId);
      if (!cart) {
        return res.status(400).json({ success: false, message: 'Cart is empty' });
      }
      cartItems = memoryDb.cart_items
        .filter(ci => ci.cart_id === cart.id)
        .map(ci => {
          const f = memoryDb.food_items.find(item => item.id === ci.food_item_id) || {};
          return {
            food_item_id: ci.food_item_id,
            quantity: ci.quantity,
            special_notes: ci.special_notes,
            name: f.name,
            price: f.price
          };
        });
    }

    if (cartItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Your dining cart is empty' });
    }

    // 1. Validate pickup slot capacity
    let slot = null;
    const slotId = pickup_slot_id ? parseInt(pickup_slot_id, 10) : 2; // Default Lunch Break slot

    if (db.isMysqlActive()) {
      const [slots] = await db.query('SELECT * FROM pickup_slots WHERE id = ?', [slotId]);
      if (slots.length > 0) {
        slot = slots[0];
        if (slot.current_load >= slot.max_capacity) {
          return res.status(400).json({ success: false, message: `Slot ${slot.slot_label} is at 100% capacity. Please select an adjacent window.` });
        }
      }
    } else {
      slot = memoryDb.pickup_slots.find(s => s.id === slotId) || memoryDb.pickup_slots[1];
      if (slot && slot.current_load >= slot.max_capacity) {
        return res.status(400).json({ success: false, message: `Slot ${slot.slot_label} is at 100% capacity. Please select an adjacent window.` });
      }
    }

    // 2. Calculate Statutory Billing with HACK50 and Subsidy
    const billing = calculateBilling({
      items: cartItems,
      discountCode: discount_code,
      isStudent: req.user.role === 'student'
    });

    // 3. Validate Student Wallet balance if paying via WALLET or RFID_CARD
    let wallet = null;
    if (payment_method === 'WALLET' || payment_method === 'RFID_CARD') {
      if (db.isMysqlActive()) {
        const [wallets] = await db.query('SELECT * FROM wallets WHERE user_id = ?', [userId]);
        wallet = wallets[0];
      } else {
        wallet = memoryDb.wallets.find(w => w.user_id === userId);
      }

      if (payment_method === 'WALLET' && (!wallet || Number(wallet.balance) < billing.finalAmount)) {
        const currentBal = wallet ? Number(wallet.balance).toFixed(2) : '0.00';
        return res.status(400).json({
          success: false,
          message: `Insufficient Campus Wallet balance (Current: ₹${currentBal}, Required: ₹${billing.finalAmount.toFixed(2)}). Please top up or choose UPI/Cash.`,
          balance: currentBal,
          required: billing.finalAmount
        });
      }
    }


    // 4. Generate unique order token e.g. #TOKEN-412 and 4-digit PIN e.g. 8942
    const orderToken = generateOrderToken();
    const securityPin = generateSecurityPin();
    const txnRef = generateTransactionRef();
    const counterAssigned = 'Counter 2 (Express)';

    let newOrderId = null;
    let postBalance = wallet ? (Number(wallet.balance) - billing.finalAmount) : 0;

    if (db.isMysqlActive()) {
      // Insert order
      const [orderRes] = await db.query(`
        INSERT INTO orders (
          order_token, security_pin, user_id, pickup_slot_id, counter_assigned,
          subtotal_amount, discount_amount, subsidy_amount, cgst_amount, sgst_amount, packaging_fee, final_amount,
          status, special_instructions
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PLACED', ?)
      `, [
        orderToken, securityPin, userId, slot ? slot.id : null, counterAssigned,
        billing.subtotalAmount, billing.discountAmount, billing.subsidyAmount, billing.cgstAmount, billing.sgstAmount, billing.packagingFee, billing.finalAmount,
        special_instructions
      ]);
      newOrderId = orderRes.insertId;

      // Insert order items
      for (const item of cartItems) {
        const itemSubtotal = Number((item.price * item.quantity).toFixed(2));
        await db.query(
          'INSERT INTO order_items (order_id, food_item_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
          [newOrderId, item.food_item_id, item.quantity, item.price, itemSubtotal]
        );
      }

      // Record payment
      await db.query(
        'INSERT INTO payments (order_id, payment_method, transaction_ref, amount, payment_status) VALUES (?, ?, ?, ?, ?)',
        [newOrderId, payment_method, txnRef, billing.finalAmount, 'SUCCESS']
      );

      // Debit wallet if WALLET or RFID_CARD payment
      if ((payment_method === 'WALLET' || payment_method === 'RFID_CARD') && wallet) {
        const debitAmount = Math.min(Number(wallet.balance), billing.finalAmount);
        const newBal = Math.max(0, Number(wallet.balance) - debitAmount);
        await db.query('UPDATE wallets SET balance = ? WHERE id = ?', [newBal, wallet.id]);
        await db.query(`
          INSERT INTO wallet_transactions (wallet_id, order_id, amount, transaction_type, category, reference_note, post_balance)
          VALUES (?, ?, ?, 'DEBIT', 'FOOD_ORDER', ?, ?)
        `, [wallet.id, newOrderId, debitAmount, `Order ${orderToken} Payment (${payment_method === 'RFID_CARD' ? 'NFC RFID Smart Card Tap #882194' : (billing.appliedDiscountCode ? billing.appliedDiscountCode + ' applied' : 'Campus Dining Wallet')})`, newBal]);
      }


      // Increment slot load
      if (slot) {
        await db.query('UPDATE pickup_slots SET current_load = current_load + 1 WHERE id = ?', [slot.id]);
      }

      // Clear cart
      const [carts] = await db.query('SELECT id FROM carts WHERE user_id = ?', [userId]);
      if (carts.length > 0) {
        await db.query('DELETE FROM cart_items WHERE cart_id = ?', [carts[0].id]);
      }
    } else {
      newOrderId = getNextId('orders');
      const newOrder = {
        id: newOrderId,
        order_token: orderToken,
        security_pin: securityPin,
        user_id: userId,
        pickup_slot_id: slot ? slot.id : 2,
        counter_assigned: counterAssigned,
        subtotal_amount: billing.subtotalAmount,
        discount_amount: billing.discountAmount,
        subsidy_amount: billing.subsidyAmount,
        cgst_amount: billing.cgstAmount,
        sgst_amount: billing.sgstAmount,
        packaging_fee: billing.packagingFee,
        final_amount: billing.finalAmount,
        status: 'PLACED',
        special_instructions,
        cancellation_reason: null,
        created_at: new Date(),
        updated_at: new Date()
      };
      memoryDb.orders.unshift(newOrder);

      // Order items
      for (const item of cartItems) {
        memoryDb.order_items.push({
          id: getNextId('order_items'),
          order_id: newOrderId,
          food_item_id: item.food_item_id,
          quantity: item.quantity,
          unit_price: Number(item.price),
          subtotal: Number((item.price * item.quantity).toFixed(2))
        });
      }

      // Payment
      memoryDb.payments.push({
        id: getNextId('payments'),
        order_id: newOrderId,
        payment_method,
        transaction_ref: txnRef,
        amount: billing.finalAmount,
        payment_status: 'SUCCESS',
        settled_at: new Date()
      });

      // Wallet deduction & transaction log
      if ((payment_method === 'WALLET' || payment_method === 'RFID_CARD') && wallet) {
        const debitAmount = Math.min(Number(wallet.balance), billing.finalAmount);
        wallet.balance = Math.max(0, Number(wallet.balance) - debitAmount);
        wallet.updated_at = new Date();
        postBalance = wallet.balance;
        memoryDb.wallet_transactions.unshift({
          id: getNextId('wallet_transactions'),
          wallet_id: wallet.id,
          order_id: newOrderId,
          amount: debitAmount,
          transaction_type: 'DEBIT',
          category: 'FOOD_ORDER',
          reference_note: `Order ${orderToken} Payment (${payment_method === 'RFID_CARD' ? 'NFC RFID Smart Card Tap #882194' : (billing.appliedDiscountCode || 'GST Taxed')})`,
          post_balance: wallet.balance,
          created_at: new Date()
        });
      }


      // Increment slot load
      if (slot) slot.current_load = (slot.current_load || 0) + 1;

      // Clear user cart
      const cart = memoryDb.carts.find(c => c.user_id === userId);
      if (cart) {
        memoryDb.cart_items = memoryDb.cart_items.filter(ci => ci.cart_id !== cart.id);
      }
    }

    // 5. Broadcast to kitchen queue via WebSocket
    orderWsServer.broadcastKitchenEvent({
      type: 'NEW_ORDER_PLACED',
      order: {
        id: newOrderId,
        order_token: orderToken,
        security_pin: securityPin,
        user_name: req.user.full_name,
        final_amount: billing.finalAmount,
        item_count: cartItems.length,
        items: cartItems.map(i => ({ name: i.name, quantity: i.quantity, notes: i.special_notes })),
        counter: counterAssigned,
        status: 'PLACED',
        slot_label: slot ? slot.slot_label : 'Standard Lunch'
      }
    });

    res.status(201).json({
      success: true,
      message: `Order ${orderToken} confirmed! Verification PIN is ${securityPin}.`,
      orderToken,
      securityPin,
      orderId: newOrderId,
      counterAssigned,
      finalAmount: billing.finalAmount,
      walletBalanceRemaining: Number(postBalance.toFixed(2)),
      billing,
      whatsappSimulated: opt_in_whatsapp ? `Simulated WhatsApp dispatch to ${req.user.phone || '+91 98765 43210'}` : null
    });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders/:token/status
router.get('/:token/status', async (req, res) => {
  try {
    const rawToken = req.params.token;
    const token = rawToken.startsWith('#') ? rawToken : `#${rawToken}`;

    let order = null;
    let items = [];
    let slot = null;
    let user = null;

    if (db.isMysqlActive()) {
      const [orders] = await db.query('SELECT * FROM orders WHERE order_token = ?', [token]);
      if (orders.length === 0) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
      order = orders[0];

      const [itemRows] = await db.query(`
        SELECT oi.*, f.name, f.image_url, f.is_veg, f.is_jain, f.station_name
        FROM order_items oi
        JOIN food_items f ON oi.food_item_id = f.id
        WHERE oi.order_id = ?
      `, [order.id]);
      items = itemRows;

      if (order.pickup_slot_id) {
        const [slots] = await db.query('SELECT * FROM pickup_slots WHERE id = ?', [order.pickup_slot_id]);
        slot = slots[0] || null;
      }

      const [users] = await db.query('SELECT id, full_name, email, phone FROM users WHERE id = ?', [order.user_id]);
      user = users[0] || null;
    } else {
      order = memoryDb.orders.find(o => o.order_token.toUpperCase() === token.toUpperCase());
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      items = memoryDb.order_items
        .filter(oi => oi.order_id === order.id)
        .map(oi => {
          const f = memoryDb.food_items.find(item => item.id === oi.food_item_id) || {};
          return {
            ...oi,
            name: f.name,
            image_url: f.image_url,
            is_veg: f.is_veg,
            is_jain: f.is_jain,
            station_name: f.station_name
          };
        });

      slot = memoryDb.pickup_slots.find(s => s.id === order.pickup_slot_id) || null;
      user = memoryDb.users.find(u => u.id === order.user_id) || null;
    }

    const telemetry = computeOrderTelemetry(order);

    res.json({
      success: true,
      order: {
        ...order,
        subtotal_amount: Number(order.subtotal_amount),
        discount_amount: Number(order.discount_amount),
        subsidy_amount: Number(order.subsidy_amount),
        cgst_amount: Number(order.cgst_amount),
        sgst_amount: Number(order.sgst_amount),
        packaging_fee: Number(order.packaging_fee),
        final_amount: Number(order.final_amount),
        pickup_slot: slot,
        customer_name: user ? user.full_name : 'Student',
        items
      },
      telemetry
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/orders/:token/cancel (2-minute cancellation window with instant 100% wallet credit refund)
router.delete('/:token/cancel', authenticateToken, async (req, res) => {
  try {
    const rawToken = req.params.token;
    const token = rawToken.startsWith('#') ? rawToken : `#${rawToken}`;

    let order = null;
    let wallet = null;

    if (db.isMysqlActive()) {
      const [orders] = await db.query('SELECT * FROM orders WHERE order_token = ?', [token]);
      if (orders.length === 0) return res.status(404).json({ success: false, message: 'Order not found' });
      order = orders[0];

      const [wallets] = await db.query('SELECT * FROM wallets WHERE user_id = ?', [order.user_id]);
      wallet = wallets[0] || null;
    } else {
      order = memoryDb.orders.find(o => o.order_token.toUpperCase() === token.toUpperCase());
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
      wallet = memoryDb.wallets.find(w => w.user_id === order.user_id) || null;
    }

    // Check user authorization
    if (order.user_id !== req.user.id && req.user.role === 'student') {
      return res.status(403).json({ success: false, message: 'Unauthorized to cancel this order' });
    }

    if (order.status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Order has already been cancelled' });
    }

    // Validate 2-minute cancellation SLA
    const createdAt = new Date(order.created_at).getTime();
    const elapsedSeconds = Math.floor((Date.now() - createdAt) / 1000);

    if (elapsedSeconds > 120 && req.user.role === 'student') {
      return res.status(400).json({
        success: false,
        message: `Cancellation window of 2 minutes has expired (${elapsedSeconds}s elapsed). The kitchen has already begun prep.`
      });
    }

    const refundAmount = Number(order.final_amount);
    let postBalance = 0;

    if (db.isMysqlActive()) {
      await db.query('UPDATE orders SET status = "CANCELLED", cancellation_reason = ? WHERE id = ?', [
        'Student cancelled within 2-minute instant refund window',
        order.id
      ]);

      if (wallet) {
        postBalance = Number(wallet.balance) + refundAmount;
        await db.query('UPDATE wallets SET balance = ? WHERE id = ?', [postBalance, wallet.id]);
        await db.query(`
          INSERT INTO wallet_transactions (wallet_id, order_id, amount, transaction_type, category, reference_note, post_balance)
          VALUES (?, ?, ?, 'REFUND', 'REFUND', ?, ?)
        `, [wallet.id, order.id, refundAmount, `100% Automated Instant Refund for ${order.order_token}`, postBalance]);
      }
    } else {
      order.status = 'CANCELLED';
      order.cancellation_reason = 'Student cancelled within 2-minute instant refund window';
      order.updated_at = new Date();

      if (wallet) {
        postBalance = Number(wallet.balance) + refundAmount;
        wallet.balance = postBalance;
        wallet.updated_at = new Date();
        memoryDb.wallet_transactions.unshift({
          id: getNextId('wallet_transactions'),
          wallet_id: wallet.id,
          order_id: order.id,
          amount: refundAmount,
          transaction_type: 'REFUND',
          category: 'REFUND',
          reference_note: `100% Automated Instant Refund for ${order.order_token}`,
          post_balance: postBalance,
          created_at: new Date()
        });
      }
    }

    // Notify student and kitchen via WebSocket
    orderWsServer.broadcastOrderUpdate(token, {
      status: 'CANCELLED',
      progressPercent: 0,
      stageIndex: -1,
      chefNote: 'Order cancelled by student. 100% refund credited instantly to Campus Wallet.'
    });

    res.json({
      success: true,
      message: `Order ${token} cancelled successfully. ₹${refundAmount.toFixed(2)} refunded instantly to your Campus Wallet.`,
      refundAmount,
      newWalletBalance: Number(postBalance.toFixed(2))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders/:token/invoice (Statutory Tax Invoice complying with Section 31 CGST Act)
router.get('/:token/invoice', async (req, res) => {
  try {
    const rawToken = req.params.token;
    const token = rawToken.startsWith('#') ? rawToken : `#${rawToken}`;

    let order = null;
    let items = [];
    let user = null;
    let profile = null;
    let payment = null;
    let wallet = null;

    if (db.isMysqlActive()) {
      const [orders] = await db.query('SELECT * FROM orders WHERE order_token = ?', [token]);
      if (orders.length === 0) return res.status(404).json({ success: false, message: 'Invoice not found' });
      order = orders[0];

      const [itemRows] = await db.query(`
        SELECT oi.*, f.name, f.station_name, f.is_veg
        FROM order_items oi
        JOIN food_items f ON oi.food_item_id = f.id
        WHERE oi.order_id = ?
      `, [order.id]);
      items = itemRows;

      const [users] = await db.query('SELECT * FROM users WHERE id = ?', [order.user_id]);
      user = users[0] || null;

      if (user) {
        const [profiles] = await db.query('SELECT * FROM student_profiles WHERE user_id = ?', [user.id]);
        profile = profiles[0] || null;
        const [wallets] = await db.query('SELECT * FROM wallets WHERE user_id = ?', [user.id]);
        wallet = wallets[0] || null;
      }

      const [payments] = await db.query('SELECT * FROM payments WHERE order_id = ?', [order.id]);
      payment = payments[0] || null;
    } else {
      order = memoryDb.orders.find(o => o.order_token.toUpperCase() === token.toUpperCase());
      if (!order) return res.status(404).json({ success: false, message: 'Invoice not found' });

      items = memoryDb.order_items
        .filter(oi => oi.order_id === order.id)
        .map(oi => {
          const f = memoryDb.food_items.find(item => item.id === oi.food_item_id) || {};
          return {
            ...oi,
            name: f.name,
            station_name: f.station_name,
            is_veg: f.is_veg
          };
        });

      user = memoryDb.users.find(u => u.id === order.user_id) || null;
      if (user) {
        profile = memoryDb.student_profiles.find(p => p.user_id === user.id) || null;
        wallet = memoryDb.wallets.find(w => w.user_id === user.id) || null;
      }
      payment = memoryDb.payments.find(p => p.order_id === order.id) || null;
    }

    const subtotal = Number(order.subtotal_amount);
    const discount = Number(order.discount_amount);
    const subsidy = Number(order.subsidy_amount);
    const cgst = Number(order.cgst_amount);
    const sgst = Number(order.sgst_amount);
    const packaging = Number(order.packaging_fee);
    const grandTotal = Number(order.final_amount);
    const walletBalance = wallet ? Number(wallet.balance) : 175.00;

    const invoiceData = {
      invoiceNumber: `INV-2026-${String(order.id).padStart(5, '0')}`,
      invoiceDate: new Date(order.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      statutoryHeader: {
        institution: STATUTORY_CONFIG.UNIVERSITY_NAME,
        canteenName: STATUTORY_CONFIG.CANTEEN_NAME,
        gstin: STATUTORY_CONFIG.GSTIN,
        fssaiLic: STATUTORY_CONFIG.FSSAI_LIC,
        actReference: 'Section 31 of CGST Act, 2017 & Food Safety Standards Act'
      },
      customer: {
        name: user ? user.full_name : 'Aarav Patel',
        email: user ? user.email : 'student.demo@campusbite.edu',
        rollNumber: profile ? profile.roll_number : '2022CS8942',
        department: profile ? profile.department : 'Computer Science & Engineering',
        hostel: profile ? `${profile.hostel_block} (Room ${profile.room_number})` : 'Hostel Block 4'
      },
      orderMetadata: {
        orderToken: order.order_token,
        securityPin: order.security_pin,
        counterAssigned: order.counter_assigned,
        status: order.status,
        specialInstructions: order.special_instructions
      },
      lineItems: items.map(item => ({
        name: item.name,
        station: item.station_name,
        quantity: item.quantity,
        unitPrice: Number(item.unit_price).toFixed(2),
        subtotal: Number(item.subtotal).toFixed(2),
        hsnSac: '996331' // Restaurant / Canteen food services SAC code
      })),
      taxComputation: {
        subtotalAmount: subtotal.toFixed(2),
        hack50Discount: discount.toFixed(2),
        welfareSubsidy: subsidy.toFixed(2),
        taxableValue: Math.max(0, subtotal - discount - subsidy).toFixed(2),
        cgstRate: '2.5%',
        cgstAmount: cgst.toFixed(2),
        sgstRate: '2.5%',
        sgstAmount: sgst.toFixed(2),
        packagingFee: packaging.toFixed(2),
        grandTotal: grandTotal.toFixed(2)
      },
      paymentDetails: {
        method: payment ? payment.payment_method : 'WALLET',
        status: payment ? payment.payment_status : 'SUCCESS',
        transactionRef: payment ? payment.transaction_ref : 'CB-TXN-9842019',
        walletTxnId: '#STU-9821',
        settledAt: payment ? payment.settled_at : new Date(order.created_at).toISOString(),
        remainingWalletBalance: walletBalance.toFixed(2)
      }
    };

    res.json({ success: true, invoice: invoiceData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders/my-orders (List user order history)
router.get('/my-orders', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    let orders = [];

    if (db.isMysqlActive()) {
      const [rows] = await db.query(`
        SELECT o.*, p.slot_label
        FROM orders o
        LEFT JOIN pickup_slots p ON o.pickup_slot_id = p.id
        WHERE o.user_id = ?
        ORDER BY o.created_at DESC
      `, [userId]);
      orders = rows;
    } else {
      orders = memoryDb.orders
        .filter(o => o.user_id === userId)
        .map(o => {
          const s = memoryDb.pickup_slots.find(slot => slot.id === o.pickup_slot_id);
          return {
            ...o,
            slot_label: s ? s.slot_label : 'Standard Pickup'
          };
        });
    }

    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

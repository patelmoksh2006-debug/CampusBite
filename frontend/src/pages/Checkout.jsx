import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Clock,
  ShieldCheck,
  Wallet,
  CreditCard,
  Banknote,
  QrCode,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Trash2,
  MessageSquare,
  AlertCircle,
  Receipt,
  Copy,
  Check,
  X,
  Wifi,
  Radio,
  CheckCircle
} from 'lucide-react';

// Deterministic Authentic SVG QR Code Component
function UpiQrSvg({ amount, size = 180 }) {
  const gridSize = 23;
  const cells = [];

  const isFinder = (r, c) => {
    if (r <= 6 && c <= 6) return true;
    if (r <= 6 && c >= gridSize - 7) return true;
    if (r >= gridSize - 7 && c <= 6) return true;
    return false;
  };

  const isFinderBlack = (r, c) => {
    if (r <= 6 && c <= 6) {
      if (r === 0 || r === 6 || c === 0 || c === 6) return true;
      if (r >= 2 && r <= 4 && c >= 2 && c <= 4) return true;
      return false;
    }
    if (r <= 6 && c >= gridSize - 7) {
      const col = c - (gridSize - 7);
      if (r === 0 || r === 6 || col === 0 || col === 6) return true;
      if (r >= 2 && r <= 4 && col >= 2 && col <= 4) return true;
      return false;
    }
    if (r >= gridSize - 7 && c <= 6) {
      const row = r - (gridSize - 7);
      if (row === 0 || row === 6 || c === 0 || c === 6) return true;
      if (row >= 2 && row <= 4 && c >= 2 && c <= 4) return true;
      return false;
    }
    return false;
  };

  const isCenterLogo = (r, c) => {
    return r >= 9 && r <= 13 && c >= 9 && c <= 13;
  };

  const seed = String(amount).split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 42);

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (isFinder(r, c)) {
        if (isFinderBlack(r, c)) cells.push({ r, c });
      } else if (isCenterLogo(r, c)) {
        // Leave clear for center logo
      } else {
        if (r === 6 || c === 6) {
          if ((r + c) % 2 === 0) cells.push({ r, c });
        } else {
          const val = (r * 17 + c * 31 + seed) % 7;
          if (val === 0 || val === 2 || val === 5) {
            cells.push({ r, c });
          }
        }
      }
    }
  }

  const cellSize = size / gridSize;

  return (
    <div className="relative inline-block bg-white p-3 rounded-2xl shadow-inner border border-slate-200">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <rect width={size} height={size} fill="white" rx="8" />
        {cells.map((cell, idx) => (
          <rect
            key={idx}
            x={cell.c * cellSize}
            y={cell.r * cellSize}
            width={cellSize * 0.96}
            height={cellSize * 0.96}
            fill="#0f172a"
            rx={cellSize * 0.18}
          />
        ))}
      </svg>
      {/* Centered UPI badge */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-10 h-10 rounded-xl bg-white border-2 border-flame-600 shadow-md flex flex-col items-center justify-center p-0.5">
          <span className="text-[9px] font-black text-flame-600 leading-none">UPI</span>
          <span className="text-[8px] font-extrabold text-slate-800 leading-none mt-0.5">₹ PAY</span>
        </div>
      </div>
    </div>
  );
}

export default function Checkout() {
  const { user, wallet, refreshWallet } = useAuth();
  const { items, removeItem, updateQuantity, billing, clearCart, discountCode, setDiscountCode } = useCart();
  const navigate = useNavigate();

  const [slots, setSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState(2); // Default 1:15 PM - 1:30 PM (Lunch Break)
  const [paymentMethod, setPaymentMethod] = useState('WALLET');
  const [specialInstructions, setSpecialInstructions] = useState('Extra green chutney and less oil on roti please');
  const [optInWhatsapp, setOptInWhatsapp] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [processingOrder, setProcessingOrder] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Interactive Payment Modals State
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [upiTimer, setUpiTimer] = useState(300); // 5 mins
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isVerifyingUpi, setIsVerifyingUpi] = useState(false);
  const [upiPaymentDone, setUpiPaymentDone] = useState(false);

  const [showRfidModal, setShowRfidModal] = useState(false);
  const [rfidTapping, setRfidTapping] = useState(false);
  const [rfidSuccess, setRfidSuccess] = useState(false);

  // Fetch pickup slots
  useEffect(() => {
    axios.get('/api/menu/slots').then((res) => {
      if (res.data.success) {
        setSlots(res.data.slots || []);
      }
    }).catch(() => {}).finally(() => setLoadingSlots(false));
  }, []);

  // UPI Countdown Timer
  useEffect(() => {
    let interval = null;
    if (showUpiModal && upiTimer > 0 && !upiPaymentDone) {
      interval = setInterval(() => {
        setUpiTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showUpiModal, upiTimer, upiPaymentDone]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText('campusbite@icici');
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // Submit checkout order to backend API
  const submitCheckoutOrder = async (methodToUse = paymentMethod) => {
    setErrorMessage('');
    setProcessingOrder(true);

    try {
      const res = await axios.post('/api/orders/checkout', {
        pickup_slot_id: selectedSlotId,
        payment_method: methodToUse,
        special_instructions: specialInstructions,
        discount_code: discountCode,
        opt_in_whatsapp: optInWhatsapp
      });

      if (res.data.success) {
        await refreshWallet();
        await clearCart();
        return res.data;
      } else {
        throw new Error(res.data.message || 'Checkout failed');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Checkout failed. Please try again.';
      setErrorMessage(msg);
      throw err;
    } finally {
      setProcessingOrder(false);
    }
  };

  // Main CTA Button Click
  const handleInitiatePayment = async () => {
    if (items.length === 0) {
      setErrorMessage('Your dining tray is empty. Please select food items from the menu first.');
      return;
    }

    setErrorMessage('');

    if (paymentMethod === 'UPI') {
      setShowUpiModal(true);
      setUpiTimer(300);
      setUpiPaymentDone(false);
      setIsVerifyingUpi(false);
    } else if (paymentMethod === 'RFID_CARD') {
      setShowRfidModal(true);
      setRfidTapping(false);
      setRfidSuccess(false);
    } else {
      // WALLET or CASH
      try {
        const orderData = await submitCheckoutOrder(paymentMethod);
        setOrderConfirmed(orderData);
      } catch (err) {
        // Error is set in submitCheckoutOrder
      }
    }
  };

  // UPI Payment Verification -> Redirects directly to /tracking
  const handleUpiPaymentConfirm = async () => {
    setIsVerifyingUpi(true);
    try {
      await new Promise((r) => setTimeout(r, 700));
      const orderData = await submitCheckoutOrder('UPI');
      setUpiPaymentDone(true);
      setTimeout(() => {
        setShowUpiModal(false);
        navigate(`/tracking?token=${encodeURIComponent(orderData.orderToken)}`);
      }, 1000);
    } catch (err) {
      setIsVerifyingUpi(false);
    }
  };

  // RFID Tap Simulation -> Redirects directly to /tracking
  const handleRfidCardTap = async () => {
    setRfidTapping(true);
    try {
      await new Promise((r) => setTimeout(r, 900));
      setRfidSuccess(true);
      const orderData = await submitCheckoutOrder('RFID_CARD');
      setTimeout(() => {
        setShowRfidModal(false);
        navigate(`/tracking?token=${encodeURIComponent(orderData.orderToken)}`);
      }, 1000);
    } catch (err) {
      setRfidTapping(false);
      setRfidSuccess(false);
    }
  };

  // Fallback confirmation view for Wallet / Cash
  if (orderConfirmed) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-indigo-50/50 to-slate-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-2xl p-8 text-center animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-inner">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight font-sans">
            Order Dispatched to Kitchen!
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Statutory tax receipt generated and broadcasted to kitchen telemetry queue.
          </p>

          {/* Token & PIN Card */}
          <div className="my-6 p-5 rounded-2xl bg-gradient-to-br from-flame-600 to-violet-800 text-white shadow-xl shadow-flame-600/30">
            <div className="text-[11px] font-bold uppercase tracking-widest text-indigo-100">
              Canteen Pickup Pass
            </div>
            <div className="text-4xl font-black tracking-tight my-2 font-mono">
              {orderConfirmed.orderToken}
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-bold">
              <span>Counter PIN:</span>
              <span className="font-mono text-sm tracking-wider font-extrabold">{orderConfirmed.securityPin}</span>
            </div>
            <div className="mt-3 text-xs text-indigo-100 font-medium">
              Assigned: {orderConfirmed.counterAssigned}
            </div>
          </div>


          {/* Financial summary */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1.5 mb-6 text-left">
            <div className="flex justify-between font-medium">
              <span>Billed Amount:</span>
              <span className="font-bold text-slate-900">₹{orderConfirmed.finalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Remaining Dining Balance:</span>
              <span className="font-bold text-emerald-600">₹{orderConfirmed.walletBalanceRemaining.toFixed(2)}</span>
            </div>
            {orderConfirmed.whatsappSimulated && (
              <div className="pt-2 border-t border-slate-200 text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                {orderConfirmed.whatsappSimulated}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Link
              to={`/tracking?token=${encodeURIComponent(orderConfirmed.orderToken)}`}
              className="w-full py-3.5 bg-flame-600 hover:bg-flame-700 text-white rounded-xl font-extrabold text-sm shadow-md shadow-flame-600/30 transition-all flex items-center justify-center gap-2"
            >
              <Clock className="w-4 h-4" />
              Go to Live Order Tracking & Timer
            </Link>

            <Link
              to={`/invoice?token=${encodeURIComponent(orderConfirmed.orderToken)}`}
              className="w-full py-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <Receipt className="w-4 h-4 text-slate-600" />
              Print Statutory GST Invoice
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-x-hidden">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight font-sans">
          Scheduled Tray Checkout
        </h1>
        <p className="text-slate-500 text-xs mt-1">
          Lock in your pickup time window, apply welfare subsidies, and pay securely via UPI, RFID, or Wallet.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Pickup Slot Selection & Preferences */}
        <div className="lg:col-span-7 space-y-6">
          {/* Pickup Window Selector */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-flame-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Select Pickup Time Window</h3>
              </div>
              <span className="text-[11px] font-bold text-slate-400">Live Counter Capacity</span>
            </div>

            <div className="space-y-3">
              {slots.map((slot) => {
                const loadPercent = Math.round((slot.current_load / slot.max_capacity) * 100);
                const isSelected = selectedSlotId === slot.id;
                const isFull = slot.current_load >= slot.max_capacity;

                return (
                  <label
                    key={slot.id}
                    className={`block p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-flame-600 bg-flame-50/50 shadow-xs ring-1 ring-flame-600'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    } ${isFull ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="pickup_slot"
                          disabled={isFull}
                          checked={isSelected}
                          onChange={() => setSelectedSlotId(slot.id)}
                          className="w-4 h-4 text-flame-600 accent-flame-600 cursor-pointer"
                        />
                        <div>
                          <div className="text-sm font-extrabold text-slate-900">{slot.slot_label}</div>
                          <div className="text-xs text-slate-500 font-medium">
                            Window: {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-700">
                          {slot.current_load} / {slot.max_capacity} Slots
                        </div>
                        <div className="w-24 bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              loadPercent > 80 ? 'bg-rose-500' : loadPercent > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, loadPercent)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Special Instructions & WhatsApp Opt-In */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-slate-500" />
                Special Chef Instructions (Optional)
              </label>
              <textarea
                rows={2}
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="E.g. Extra coconut chutney, make dosa crisp, less sugar in coffee..."
                className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-flame-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
              <input
                type="checkbox"
                id="whatsappOpt"
                checked={optInWhatsapp}
                onChange={(e) => setOptInWhatsapp(e.target.checked)}
                className="w-4 h-4 text-emerald-600 accent-emerald-600 rounded cursor-pointer"
              />
              <label htmlFor="whatsappOpt" className="text-xs text-slate-700 font-medium cursor-pointer">
                Send live WhatsApp order status buzzer simulation to <span className="font-bold">{user?.phone || '+91 98765 43210'}</span>
              </label>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card">
            <h3 className="font-extrabold text-slate-900 text-base mb-4">Select Payment Method</h3>
            <div className="grid grid-cols-2 gap-3">
              {/* UPI QR Code */}
              <button
                type="button"
                onClick={() => setPaymentMethod('UPI')}
                className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
                  paymentMethod === 'UPI'
                    ? 'border-flame-600 bg-flame-50/70 ring-2 ring-flame-600 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="p-2 rounded-xl bg-flame-100 text-flame-700">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-flame-100 text-flame-800">
                    QR CODE
                  </span>
                </div>
                <div className="text-sm font-extrabold text-slate-900 mt-2">UPI / QR Code</div>
                <div className="text-xs text-slate-500">Scan via GPay, PhonePe, Paytm</div>
              </button>

              {/* Student RFID Smart Card */}
              <button
                type="button"
                onClick={() => setPaymentMethod('RFID_CARD')}
                className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
                  paymentMethod === 'RFID_CARD'
                    ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-600 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">
                    NFC TAP
                  </span>
                </div>
                <div className="text-sm font-extrabold text-slate-900 mt-2">Student RFID Card</div>
                <div className="text-xs text-slate-500">Tap contactless smart card</div>
              </button>

              {/* Campus Wallet */}
              <button
                type="button"
                onClick={() => setPaymentMethod('WALLET')}
                className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
                  paymentMethod === 'WALLET'
                    ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-600 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    1-TAP FAST
                  </span>
                </div>
                <div className="text-sm font-extrabold text-slate-900 mt-2">Campus Dining Wallet</div>
                <div className="text-xs text-emerald-700 font-bold mt-0.5">
                  Balance: ₹{wallet ? Number(wallet.balance).toFixed(2) : '340.00'}
                </div>
              </button>

              {/* Cash on Token */}
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
                  paymentMethod === 'CASH'
                    ? 'border-amber-600 bg-amber-50/70 ring-2 ring-amber-600 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">REGISTER</span>
                </div>
                <div className="text-sm font-extrabold text-slate-900 mt-2">Cash on Token</div>
                <div className="text-xs text-slate-500">Pay at Counter 1 Billing Desk</div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Tray Items & Statutory CGST Tax Breakdown */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="font-extrabold text-slate-900 text-base">Tray Line Items</h3>
              <span className="text-xs font-bold text-flame-600">{items.length} items</span>
            </div>

            {items.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs">
                Your tray is currently empty. Add dishes from the menu!
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.cart_item_id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="text-slate-500 font-medium">
                        ₹{item.price.toFixed(2)} × {item.quantity}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-slate-900">₹{item.subtotal.toFixed(2)}</span>
                      <button
                        onClick={() => removeItem(item.cart_item_id)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Coupon Code Input */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
              <input
                type="text"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                placeholder="PROMO CODE (e.g. HACK50)"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold uppercase focus:ring-2 focus:ring-flame-500 focus:outline-none"
              />
              <button
                type="button"
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Apply
              </button>
            </div>

            {/* Statutory Billing Breakdown */}
            <div className="mt-5 pt-4 border-t border-slate-200 space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-bold text-slate-900">₹{billing.subtotalAmount.toFixed(2)}</span>
              </div>

              {billing.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>HACK50 Promotional Discount</span>
                  <span>- ₹{billing.discountAmount.toFixed(2)}</span>
                </div>
              )}

              {billing.subsidyAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Student Welfare Food Subsidy</span>
                  <span>- ₹{billing.subsidyAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-500">
                <span>CGST (2.5% Sec 31 Act)</span>
                <span>+ ₹{billing.cgstAmount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-slate-500">
                <span>SGST (2.5% Sec 31 Act)</span>
                <span>+ ₹{billing.sgstAmount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-slate-500">
                <span>Eco-Friendly Bio Packaging</span>
                <span>+ ₹{billing.packagingFee.toFixed(2)}</span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                <div>
                  <div className="text-sm font-black text-slate-900">Grand Total</div>
                  <div className="text-[10px] text-slate-400">Statutory GST Inclusive</div>
                </div>
                <div className="text-2xl font-black text-flame-600">
                  ₹{billing.finalAmount.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Checkout CTA */}
            <button
              onClick={handleInitiatePayment}
              disabled={processingOrder || items.length === 0}
              className="w-full mt-6 py-3.5 bg-flame-600 hover:bg-flame-700 disabled:opacity-50 text-white rounded-2xl font-extrabold text-sm shadow-lg shadow-flame-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {processingOrder
                ? 'Authorizing Payment & Booking...'
                : paymentMethod === 'UPI'
                ? `Pay ₹${billing.finalAmount.toFixed(2)} via UPI QR Code`
                : paymentMethod === 'RFID_CARD'
                ? `Pay ₹${billing.finalAmount.toFixed(2)} via RFID Card`
                : `Pay ₹${billing.finalAmount.toFixed(2)} & Get Token`}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================= */}
      {/* 📱 INTERACTIVE UPI PAYMENT QR CODE MODAL                */}
      {/* ======================================================= */}
      {showUpiModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => !isVerifyingUpi && setShowUpiModal(false)}
        >
          <div
            className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 my-auto text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-left">
                <div className="w-9 h-9 rounded-xl bg-flame-50 text-flame-600 flex items-center justify-center font-bold">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    UPI Payment Gateway
                  </h3>
                  <p className="text-[11px] text-slate-500">Scan & Pay via any UPI application</p>
                </div>
              </div>

              {!isVerifyingUpi && (
                <button
                  onClick={() => setShowUpiModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Payable Amount & Timer Banner */}
            <div className="my-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="text-left">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  Amount Payable
                </span>
                <div className="text-2xl font-black text-slate-900 font-mono">
                  ₹{billing.finalAmount.toFixed(2)}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 justify-end">
                  <Clock className="w-3 h-3 text-flame-600" />
                  Expires In
                </span>
                <div className="text-sm font-mono font-black text-flame-600">
                  {formatTimer(upiTimer)}
                </div>
              </div>
            </div>

            {/* QR Code Presentation */}
            <div className="py-2 flex flex-col items-center justify-center">
              <UpiQrSvg amount={billing.finalAmount.toFixed(2)} />

              {/* UPI ID copy pill */}
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-slate-800">
                <span>campusbite@icici</span>
                <button
                  onClick={handleCopyUpi}
                  className="text-flame-600 hover:text-flame-700 flex items-center gap-1 font-sans text-[11px] font-bold"
                  title="Copy UPI ID"
                >
                  {copiedUpi ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedUpi ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Supported Payment App Logos */}
            <div className="my-3 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-600 flex-wrap">
              <span className="px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 flex items-center gap-1">
                🟢 GPay
              </span>
              <span className="px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 flex items-center gap-1">
                🟣 PhonePe
              </span>
              <span className="px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 flex items-center gap-1">
                🔵 Paytm
              </span>
              <span className="px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 flex items-center gap-1">
                🟠 BHIM UPI
              </span>
            </div>

            {/* Verification Status */}
            {upiPaymentDone ? (
              <div className="my-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Payment Confirmed via ICICI UPI! Redirecting to tracking...</span>
              </div>
            ) : isVerifyingUpi ? (
              <div className="my-3 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center justify-center gap-2 animate-pulse">
                <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                <span>Verifying UPI transaction with ICICI bank gateway...</span>
              </div>
            ) : (
              <div className="text-[11px] text-slate-500 my-2">
                Open any UPI app on your phone, scan the QR code above, and authorize payment of <strong className="text-slate-800">₹{billing.finalAmount.toFixed(2)}</strong>.
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={isVerifyingUpi || upiPaymentDone}
                onClick={() => setShowUpiModal(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isVerifyingUpi || upiPaymentDone}
                onClick={handleUpiPaymentConfirm}
                className="flex-2 py-3 bg-flame-600 hover:bg-flame-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold shadow-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {isVerifyingUpi ? (
                  <span>Checking Bank Status...</span>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>I Have Paid / Verify Payment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* 💳 INTERACTIVE STUDENT RFID SMART CARD MODAL           */}
      {/* ======================================================= */}
      {showRfidModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => !rfidTapping && setShowRfidModal(false)}
        >
          <div
            className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 my-auto text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-left">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Student RFID Contactless Pass
                  </h3>
                  <p className="text-[11px] text-slate-500">Tap your campus smart card at the terminal</p>
                </div>
              </div>

              {!rfidTapping && (
                <button
                  onClick={() => setShowRfidModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Digital RFID Smart Card Graphic */}
            <div className="my-5 p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl text-left relative overflow-hidden border border-indigo-900/50">
              {/* Card Hologram Ring */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10" />

              <div className="flex items-center justify-between">
                <div className="text-[10px] font-black uppercase tracking-widest text-indigo-300">
                  Campus Dining • RFID Smart Pass
                </div>
                <Wifi className="w-5 h-5 text-indigo-400 rotate-90" />
              </div>

              {/* Gold Chip Graphic */}
              <div className="my-4 flex items-center gap-3">
                <div className="w-10 h-7 rounded-md bg-gradient-to-tr from-amber-400 to-amber-200 border border-amber-500 flex items-center justify-center shadow-xs">
                  <div className="w-7 h-4 border border-amber-600/50 rounded-xs" />
                </div>
                <div className="text-[11px] font-mono text-indigo-200 font-bold">
                  NFC-ISO14443A
                </div>
              </div>

              {/* Student Details */}
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <div className="text-[10px] uppercase text-indigo-300 font-medium">Cardholder</div>
                  <div className="text-sm font-extrabold text-white tracking-wide">
                    {user?.full_name || 'Aarav Patel'}
                  </div>
                  <div className="text-[10px] font-mono text-indigo-200 mt-0.5">
                    Roll: 2024CS1092 • UID: 88:21:94:FE
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[9px] uppercase text-indigo-300 font-medium">Meal Account</div>
                  <div className="text-xs font-mono font-bold text-emerald-400">
                    ₹{wallet ? Number(wallet.balance).toFixed(2) : '340.00'}
                  </div>
                </div>
              </div>
            </div>

            {/* Terminal Contactless Animation */}
            {rfidSuccess ? (
              <div className="my-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>BEEP! Card Read: #882194FE Authenticated • Debited ₹{billing.finalAmount.toFixed(2)}</span>
              </div>
            ) : rfidTapping ? (
              <div className="my-4 p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold flex items-center justify-center gap-2 animate-pulse">
                <Radio className="w-4 h-4 text-indigo-600 animate-spin" />
                <span>Reading Student RFID Card from Terminal Reader...</span>
              </div>
            ) : (
              <div className="my-3 text-xs text-slate-500">
                Place your physical student RFID identity card on the counter contactless sensor, or click below to simulate the tap.
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={rfidTapping || rfidSuccess}
                onClick={() => setShowRfidModal(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={rfidTapping || rfidSuccess}
                onClick={handleRfidCardTap}
                className="flex-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold shadow-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {rfidTapping ? (
                  <span>Contactless Sensor Reading...</span>
                ) : (
                  <>
                    <Wifi className="w-4 h-4 rotate-90" />
                    <span>Tap RFID Card to Pay ₹{billing.finalAmount.toFixed(2)}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useOrderTelemetry } from '../context/WebSocketContext';
import { useAuth } from '../context/AuthContext';
import { Barcode, QRCode } from '../components/BarcodeQR';
import {
  Clock,
  CheckCircle2,
  ChefHat,
  Volume2,
  VolumeX,
  RotateCcw,
  Receipt,
  Star,
  Sparkles,
  AlertCircle,
  Timer,
  ShoppingBag,
  ArrowRight
} from 'lucide-react';

export default function Tracking() {
  const [searchParams] = useSearchParams();
  const tokenQuery = searchParams.get('token') || '#TOKEN-412';
  const { user, refreshWallet } = useAuth();
  const { isConnected, buzzerEnabled, setBuzzerEnabled, subscribeOrder, playChime } = useOrderTelemetry();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelCountdown, setCancelCountdown] = useState(120);
  const [cancelling, setCancelling] = useState(false);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState('');
  const [searchTokenInput, setSearchTokenInput] = useState(tokenQuery);

  const fetchOrder = async (token) => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/orders/${encodeURIComponent(token)}/status`);
      if (res.data.success) {
        setOrder(res.data.order);
        setTelemetry(res.data.telemetry);
        if (res.data.telemetry?.cancelSecondsRemaining !== undefined) {
          setCancelCountdown(res.data.telemetry.cancelSecondsRemaining);
        }
      }
    } catch (err) {
      console.warn('Failed to load order status:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder(tokenQuery);

    // Subscribe to live WebSocket order updates
    const unsubscribe = subscribeOrder(tokenQuery, (data) => {
      if (data.status) {
        setOrder((prev) => (prev ? { ...prev, status: data.status } : prev));
        setTelemetry((prev) => ({
          ...(prev || {}),
          stageIndex: data.status === 'COMPLETED' ? 4 : data.status === 'READY' ? 3 : data.status === 'PREPARING' ? 2 : data.status === 'ACCEPTED' ? 1 : 0,
          chefNote: data.chefNote || prev?.chefNote
        }));
      }
    });

    return () => unsubscribe();
  }, [tokenQuery]);

  // Live seconds countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCancelCountdown((prev) => Math.max(0, prev - 1));
      setTelemetry((prev) => {
        if (!prev || prev.remainingSeconds <= 0) return prev;
        return { ...prev, remainingSeconds: Math.max(0, prev.remainingSeconds - 1) };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Cancel order within 2-minute SLA
  const handleCancelOrder = async () => {
    if (!order) return;
    if (!window.confirm(`Are you sure you want to cancel ${order.order_token}? 100% of ₹${order.final_amount.toFixed(2)} will be refunded instantly to your Campus Wallet.`)) {
      return;
    }

    setCancelling(true);
    try {
      const res = await axios.delete(`/api/orders/${encodeURIComponent(order.order_token)}/cancel`);
      if (res.data.success) {
        setCancelSuccessMsg(res.data.message);
        await refreshWallet();
        await fetchOrder(order.order_token);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Cancellation failed');
    } finally {
      setCancelling(false);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Pipeline Stage Config
  const stages = [
    { key: 'PLACED', label: 'Ticket Placed', desc: 'Order sent to counter' },
    { key: 'ACCEPTED', label: 'Accepted', desc: 'Chef reviewing ticket' },
    { key: 'PREPARING', label: 'Cooking Hot', desc: 'Sizzling at kitchen stations' },
    { key: 'READY', label: 'Ready for Pickup', desc: 'Waiting at express counter' }
  ];

  const currentStageIndex = telemetry ? telemetry.stageIndex : 0;
  const isCancelled = order?.status === 'CANCELLED';

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Search Order Token Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live Order Telemetry</span>
          <h2 className="text-xl font-black text-slate-900 font-sans">Kitchen Queue Pipeline</h2>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigate(`/tracking?token=${encodeURIComponent(searchTokenInput)}`);
          }}
          className="flex items-center gap-2 w-full sm:w-auto"
        >
          <input
            type="text"
            value={searchTokenInput}
            onChange={(e) => setSearchTokenInput(e.target.value)}
            placeholder="Token (e.g. #TOKEN-412)"
            className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold font-mono uppercase focus:ring-2 focus:ring-flame-500 focus:outline-none"
          />
          <button
            type="submit"
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Track
          </button>
        </form>
      </div>

      {cancelSuccessMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{cancelSuccessMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-flame-600 border-t-transparent"></div>
          <p className="mt-2 text-xs text-slate-500 font-medium">Fetching kitchen telemetry...</p>
        </div>
      ) : !order ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">Order {tokenQuery} not found</h3>
          <p className="text-xs text-slate-500 mt-1">Please check your token or place an order from the menu.</p>
          <Link
            to="/menu"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-flame-600 text-white rounded-xl text-xs font-bold"
          >
            Browse Menu
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Hero Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                    {order.order_token}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
                      isCancelled
                        ? 'bg-rose-100 text-rose-800'
                        : order.status === 'READY'
                        ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                        : 'bg-flame-100 text-flame-800'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                  <span>Assigned: <strong className="text-slate-800">{order.counter_assigned}</strong></span>
                  <span>•</span>
                  <span>Pickup Slot: <strong className="text-slate-800">{order.pickup_slot?.slot_label || 'Lunch Break'}</strong></span>
                </div>
              </div>

              {/* Security PIN Box */}
              <div className="bg-slate-900 text-white p-4 rounded-2xl text-center sm:text-right shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pickup Security PIN</div>
                <div className="text-3xl font-mono font-black tracking-widest text-amber-400 mt-0.5">
                  {order.security_pin}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Show PIN to staff at counter</div>
              </div>
            </div>

            {/* Live Countdown & Audio Buzzer Toggle */}
            <div className="my-6 p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xl shadow-xs">
                  <Timer className="w-6 h-6 animate-spin-slow" />
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-900">Estimated Prep Time Remaining</div>
                  <div className="text-2xl font-black font-mono text-amber-950">
                    {order.status === 'READY' ? '00:00 (READY NOW)' : formatTimer(telemetry?.remainingSeconds || 218)}
                  </div>
                </div>
              </div>

              {/* Buzzer Sound Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBuzzerEnabled(!buzzerEnabled)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                    buzzerEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                  title="Toggle automatic buzzer sound when ready"
                >
                  {buzzerEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  {buzzerEnabled ? 'Buzzer Armed' : 'Buzzer Muted'}
                </button>

                <button
                  type="button"
                  onClick={playChime}
                  className="px-3 py-2 bg-white text-slate-700 border border-slate-300 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors shadow-xs"
                >
                  Test Buzzer 🔔
                </button>
              </div>
            </div>

            {/* 4-Stage Visual Pipeline Tracker */}
            <div className="my-8">
              <div className="relative overflow-hidden py-2">
                {/* Horizontal Progress bar behind steps - perfectly centered from 1st circle to 4th circle */}
                <div className="absolute top-[26px] left-[12.5%] right-[12.5%] -translate-y-1/2 h-1 bg-slate-200 rounded-full overflow-hidden z-0">
                  <div
                    className={`h-full transition-all duration-700 rounded-full ${
                      currentStageIndex >= 3 ? 'bg-emerald-500' : 'bg-flame-600'
                    }`}
                    style={{
                      width: isCancelled
                        ? '0%'
                        : `${Math.min(100, Math.max(0, (currentStageIndex / (stages.length - 1)) * 100))}%`
                    }}
                  />
                </div>

                {/* 4 Steps */}
                <div className="grid grid-cols-4 relative z-10">
                  {stages.map((stage, idx) => {
                    const isCompleted = !isCancelled && currentStageIndex > idx;
                    const isCurrent = !isCancelled && currentStageIndex === idx;

                    return (
                      <div key={stage.key} className="flex flex-col items-center text-center px-1">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-md ${
                            isCompleted
                              ? 'bg-emerald-500 text-white shadow-emerald-500/25 ring-4 ring-white'
                              : isCurrent
                              ? 'bg-flame-600 text-white ring-4 ring-flame-100 scale-110 shadow-flame-600/30'
                              : 'bg-white border-2 border-slate-300 text-slate-400 ring-4 ring-white'
                          }`}
                        >
                          {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                        </div>
                        <div className="mt-3 font-extrabold text-xs text-slate-900">{stage.label}</div>
                        <div className="text-[10px] text-slate-400 hidden sm:block mt-0.5 max-w-[130px] leading-tight">
                          {stage.desc}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>


            {/* Chef Vikram Live Note Callout */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center flex-shrink-0">
                <ChefHat className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-slate-800">
                  Chef Vikram Sharma <span className="text-slate-400 font-normal">• Live Kitchen Station Feed</span>
                </div>
                <p className="text-xs text-slate-600 mt-1 italic leading-relaxed font-medium">
                  "{telemetry?.chefNote || 'Preparing ingredients and queueing order ticket.'}"
                </p>
              </div>
            </div>

            {/* 2-Minute Cancellation SLA Window */}
            {!isCancelled && order.status === 'PLACED' && (
              <div className="mt-6 p-4 rounded-2xl bg-rose-50/70 border border-rose-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                    <RotateCcw className="w-4 h-4 text-rose-600" />
                    2-Minute Instant Automated Wallet Refund Window
                  </div>
                  <div className="text-xs text-rose-700 mt-0.5">
                    {cancelCountdown > 0 ? (
                      <span>
                        You have <strong className="font-mono font-bold">{cancelCountdown}s</strong> remaining to cancel with 100% immediate wallet refund.
                      </span>
                    ) : (
                      <span>Cancellation window closed as cooking has commenced.</span>
                    )}
                  </div>
                </div>

                {cancelCountdown > 0 && (
                  <button
                    onClick={handleCancelOrder}
                    disabled={cancelling}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors whitespace-nowrap"
                  >
                    {cancelling ? 'Refunding...' : `Cancel & Refund ₹${order.final_amount.toFixed(2)}`}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Bottom Grid: Pickup Barcode/QR and Quick Action Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Express Counter Barcode Pass */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Digital Pickup Barcode Pass
              </h4>
              <div className="py-2">
                <Barcode value={order.order_token} width={260} height={60} />
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Scan barcode at Counter 2 scanner or tell staff token <strong className="text-slate-700">{order.order_token}</strong>
              </p>
            </div>

            {/* Fast Action Links */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Invoice & Feedback Desk
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Access Section 31 CGST Act tax invoice or submit 4-category star ratings to claim <strong className="text-flame-600">+25 Campus Karma points</strong>.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Link
                  to={`/invoice?token=${encodeURIComponent(order.order_token)}`}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Receipt className="w-4 h-4 text-slate-600" />
                  Tax Invoice
                </Link>

                <Link
                  to={`/feedback?token=${encodeURIComponent(order.order_token)}`}
                  className="px-4 py-3 bg-flame-50 hover:bg-flame-100 text-flame-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-flame-200"
                >
                  <Star className="w-4 h-4 text-flame-600" />
                  Rate Food (+25★)
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

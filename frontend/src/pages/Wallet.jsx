import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Wallet as WalletIcon,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Plus,
  Send,
  Zap,
  TrendingDown,
  ShieldCheck,
  Award
} from 'lucide-react';

export default function Wallet() {
  const { user, wallet, refreshWallet } = useAuth();

  const [summary, setSummary] = useState({
    balance: 340.0,
    monthToDateSpending: 350.2,
    subsidiesClaimed: 16.0,
    campusKarmaPoints: 125
  });
  const [transactions, setTransactions] = useState([]);
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [mealPlans, setMealPlans] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState(200);
  const [topupProcessing, setTopupProcessing] = useState(false);

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawUpi, setWithdrawUpi] = useState('aarav.patel@okhdfcbank');
  const [withdrawAmount, setWithdrawAmount] = useState(100);
  const [withdrawProcessing, setWithdrawProcessing] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState('');

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const [sumRes, txnRes, subRes, planRes] = await Promise.all([
        axios.get('/api/wallet/summary'),
        axios.get(`/api/wallet/transactions?category=${selectedFilter}`),
        axios.get('/api/wallet/active-subscription'),
        axios.get('/api/wallet/meal-plans')
      ]);

      if (sumRes.data.success) setSummary(sumRes.data.summary);
      if (txnRes.data.success) setTransactions(txnRes.data.transactions || []);
      if (subRes.data.success) setActiveSubscription(subRes.data);
      if (planRes.data.success) setMealPlans(planRes.data.plans || []);
    } catch (err) {
      console.warn('Failed to fetch wallet info:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, [selectedFilter]);

  // Handle Wallet Top-up
  const handleTopup = async (e) => {
    e.preventDefault();
    setTopupProcessing(true);
    try {
      await axios.post('/api/wallet/topup', { amount: topupAmount, method: 'UPI Instant' });
      await refreshWallet();
      await fetchWalletData();
      setShowTopupModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Top-up failed');
    } finally {
      setTopupProcessing(false);
    }
  };

  // Handle Zero-Fee UPI Withdrawal
  const handleWithdrawUpi = async (e) => {
    e.preventDefault();
    setWithdrawProcessing(true);
    setWithdrawSuccess('');
    try {
      const res = await axios.post('/api/wallet/withdraw-upi', {
        upi_id: withdrawUpi,
        amount: withdrawAmount
      });
      if (res.data.success) {
        setWithdrawSuccess(res.data.message);
        await refreshWallet();
        await fetchWalletData();
        setTimeout(() => {
          setShowWithdrawModal(false);
          setWithdrawSuccess('');
        }, 3000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Withdrawal failed');
    } finally {
      setWithdrawProcessing(false);
    }
  };

  const currentBalance = wallet ? Number(wallet.balance) : summary.balance;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Top Banner & Balance Metrics */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-flame-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
          {/* Main Balance */}
          <div className="lg:col-span-1 space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <WalletIcon className="w-4 h-4 text-emerald-400" />
              Student Digital Wallet
            </span>
            <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white">
              ₹{currentBalance.toFixed(2)}
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Enrolled ID: <strong className="text-slate-200">2022CS8942</strong> • Linked to Hostel Block 4
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowTopupModal(true)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add Money
              </button>
              <button
                onClick={() => setShowWithdrawModal(true)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <ArrowUpRight className="w-4 h-4" />
                UPI Payout
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t lg:border-t-0 lg:border-l border-slate-700/80 pt-6 lg:pt-0 lg:pl-8">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Month Spending</span>
                <TrendingDown className="w-4 h-4 text-flame-400" />
              </div>
              <div className="text-2xl font-black font-mono">₹{summary.monthToDateSpending.toFixed(2)}</div>
              <div className="text-[10px] text-slate-400 mt-1">Direct Canteen Debits</div>
            </div>

            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Welfare Subsidy</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black font-mono text-emerald-400">₹{summary.subsidiesClaimed.toFixed(2)}</div>
              <div className="text-[10px] text-slate-400 mt-1">Govt & Univ Food Grants</div>
            </div>

            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Campus Karma</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black font-mono text-amber-400">{summary.campusKarmaPoints} pts</div>
              <div className="text-[10px] text-slate-400 mt-1">Level 2 Canteen VIP</div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Subscription & Semester Pass Progress */}
      {activeSubscription?.subscription && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-flame-100 text-flame-800 text-xs font-black mb-2">
                <Calendar className="w-3.5 h-3.5 text-flame-600" />
                ACTIVE SEMESTER PASS TIER
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight font-sans">
                {activeSubscription.subscription.title}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Valid until {activeSubscription.subscription.end_date} • {activeSubscription.subscription.meals_per_day} meals daily allowance
              </p>
            </div>

            <div className="text-right">
              <div className="text-xs font-bold text-slate-400">Meals Remaining</div>
              <div className="text-3xl font-black text-flame-600 font-mono">
                {activeSubscription.mealsRemaining} / {activeSubscription.subscription.total_meals_allowance}
              </div>
            </div>
          </div>

          {/* Consumption Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
              <span>{activeSubscription.subscription.meals_consumed} Meals Consumed</span>
              <span>{Math.round((activeSubscription.subscription.meals_consumed / activeSubscription.subscription.total_meals_allowance) * 100)}% Used</span>
            </div>
            <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-flame-600 h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(activeSubscription.subscription.meals_consumed / activeSubscription.subscription.total_meals_allowance) * 100}%`
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Available Meal Plan Tiers */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-slate-900 font-sans">University Meal Subscription Tiers</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mealPlans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between hover:border-flame-300 transition-colors"
            >
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded bg-slate-100 text-slate-700">
                  {plan.duration_days} Days Plan
                </span>
                <h4 className="text-base font-extrabold text-slate-900 mt-3">{plan.title}</h4>
                <div className="text-2xl font-black text-slate-900 font-mono my-2">
                  ₹{Number(plan.price).toFixed(2)}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Equivalent to ₹{Number(plan.daily_rate_equivalent).toFixed(2)}/day for {plan.meals_per_day} wholesome meals.
                </p>
              </div>

              <button
                disabled
                className="w-full mt-4 py-2.5 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold"
              >
                {plan.id === 1 ? 'Currently Active' : 'Upgrade Plan'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Itemized Audit Ledger */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h3 className="text-lg font-black text-slate-900">Itemized Financial Ledger</h3>
            <p className="text-xs text-slate-500 mt-0.5">Real-time audit log of debits, credits, subsidies & refunds</p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {['ALL', 'FOOD_ORDER', 'SUBSIDY', 'REFUND', 'TOPUP'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  selectedFilter === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Ledger Table */}
        <div className="divide-y divide-slate-100 mt-2">
          {transactions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">No transactions in this category</div>
          ) : (
            transactions.map((txn) => {
              const isCredit = txn.transaction_type === 'CREDIT' || txn.transaction_type === 'REFUND' || txn.transaction_type === 'SUBSIDY';
              return (
                <div key={txn.id} className="py-3.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold ${
                        isCredit ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {isCredit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900">{txn.reference_note}</div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(txn.created_at).toLocaleString('en-IN')} • Category: {txn.category}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`font-black font-mono text-sm ${
                        isCredit ? 'text-emerald-600' : 'text-slate-900'
                      }`}
                    >
                      {isCredit ? '+' : '-'} ₹{Number(txn.amount).toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Post Bal: ₹{Number(txn.post_balance).toFixed(2)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Top-Up Modal */}
      {showTopupModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-sm w-full p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-black text-slate-900 mb-2">Recharge Campus Wallet</h3>
            <p className="text-xs text-slate-500 mb-4">Instant zero-fee reload via UPI, NetBanking or Debit Card.</p>

            <form onSubmit={handleTopup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Amount to Add (₹)
                </label>
                <input
                  type="number"
                  min="50"
                  max="5000"
                  step="50"
                  required
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[100, 200, 500].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setTopupAmount(val)}
                    className="py-1.5 rounded-lg border border-slate-200 text-xs font-bold hover:bg-slate-50"
                  >
                    +₹{val}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTopupModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={topupProcessing}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  {topupProcessing ? 'Recharging...' : `Add ₹${topupAmount}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Instant Zero-Fee UPI Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-black text-slate-900">Instant UPI Payout</h3>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black">
                Zero Fees • &lt;60s SLA
              </span>
            </div>

            {withdrawSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold space-y-2 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p>{withdrawSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleWithdrawUpi} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Student Verified UPI ID (VPA)
                  </label>
                  <input
                    type="text"
                    required
                    value={withdrawUpi}
                    onChange={(e) => setWithdrawUpi(e.target.value)}
                    placeholder="student@okhdfcbank"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs font-bold focus:ring-2 focus:ring-flame-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Withdrawal Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="50"
                    max={currentBalance}
                    required
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-lg focus:ring-2 focus:ring-flame-500 focus:outline-none"
                  />
                  <div className="text-[11px] text-slate-500 mt-1">
                    Available for withdrawal: <strong className="text-slate-800">₹{currentBalance.toFixed(2)}</strong>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowWithdrawModal(false)}
                    className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={withdrawProcessing || withdrawAmount > currentBalance}
                    className="flex-1 py-2.5 bg-flame-600 hover:bg-flame-700 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    {withdrawProcessing ? 'Dispatching Payout...' : `Withdraw ₹${withdrawAmount}`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

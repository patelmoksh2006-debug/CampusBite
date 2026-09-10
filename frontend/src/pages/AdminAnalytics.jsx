import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Clock,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  BarChart3,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Recycle,
  ChefHat
} from 'lucide-react';

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/analytics/dashboard').then((res) => {
      if (res.data.success) {
        setData(res.data);
      }
    }).catch((err) => {
      console.warn('Analytics fetch error:', err.message);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen py-20 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-flame-600 border-t-transparent"></div>
        <p className="mt-2 text-xs text-slate-500 font-medium">Computing demand predictions & analytics...</p>
      </div>
    );
  }

  if (!data) return null;

  const { metrics, itemPopularity, peakHours, demandPrediction, foodWasteReduction } = data;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-flame-50 text-flame-700 text-xs font-black mb-2 border border-flame-200">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>CENTRAL CANTEEN TELEMETRY & AI FORECASTING</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-sans">
            Executive Analytics & Operations Intelligence
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time revenue monitoring, rush hour velocity, demand predictions, and food-waste reduction KPIs.
          </p>
        </div>

        {/* Live Rush Indicator */}
        <div className="flex items-center gap-3 bg-slate-900 text-white p-3.5 rounded-2xl shadow-md">
          <div className="w-3 h-3 rounded-full bg-amber-400 animate-ping"></div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Live Rush Status
            </div>
            <div className="text-xs font-black text-amber-300">
              🟡 {metrics.liveRush.level} Rush ({metrics.liveRush.occupancyPercent}% load)
            </div>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-2">
            <span>Today's Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono">
            ₹{metrics.totalRevenue.toFixed(2)}
          </div>
          <div className="text-[11px] text-emerald-600 font-bold mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+14.2% vs yesterday</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-2">
            <span>Total Orders Settled</span>
            <ShoppingBag className="w-4 h-4 text-flame-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono">
            {metrics.totalOrdersCount} tickets
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            Avg Order: <strong>₹{metrics.avgOrderValue.toFixed(2)}</strong>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-2">
            <span>Avg Customer Wait</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono">
            {metrics.liveRush.estimatedWaitTimeMins} mins
          </div>
          <div className="text-[11px] text-emerald-600 font-bold mt-2">
            Express Counter 2: &lt;5 mins
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-2">
            <span>Food Waste Saved</span>
            <Recycle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-600 font-mono">
            {foodWasteReduction.wastePreventedKg} kg
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            ₹{foodWasteReduction.costSavedRupees} saved via demand caps
          </div>
        </div>
      </div>

      {/* Grid: Peak Rush Hours Bar Distribution & Top Dishes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Peak Rush Hours Breakdown */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Peak Rush Hours Telemetry</h3>
              <p className="text-xs text-slate-500 mt-0.5">Order distribution by dining service window</p>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              Live Queue Data
            </span>
          </div>

          <div className="space-y-4 pt-2">
            {peakHours.map((h, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-800">{h.window} ({h.label})</span>
                  <span className="text-slate-500 font-mono">{h.orders} orders ({h.loadPercent}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      h.rushLevel === 'PEAK'
                        ? 'bg-rose-500'
                        : h.rushLevel === 'HIGH'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${h.loadPercent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Dishes Leaderboard */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Top Selling Dishes Today</h3>
              <p className="text-xs text-slate-500 mt-0.5">Revenue and order counts per station</p>
            </div>
            <span className="text-xs font-bold text-flame-600">Leaderboard</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {itemPopularity.map((dish, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-black flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="font-extrabold text-slate-900">{dish.name}</div>
                    <div className="text-[10px] text-slate-400">{dish.station} • {dish.prepMins}m prep</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-black text-slate-900">₹{dish.revenue}</div>
                  <div className="text-[10px] text-slate-400">{dish.ordersToday} orders</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 📊 Demand Prediction Table & 🗑️ Food Waste Reduction */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-flame-600" />
              <h3 className="text-base font-extrabold text-slate-900">
                AI Demand Prediction & Food-Waste Prevention Caps (Tomorrow)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Machine-learning projections calculate exact ingredient batch quantities to prevent kitchen over-preparation.
            </p>
          </div>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-black">
            18.5% Waste Cut
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                <th className="pb-3">Menu Dish</th>
                <th className="pb-3 text-center">Predicted Tomorrow</th>
                <th className="pb-3 text-center">Recommended Batch Cap</th>
                <th className="pb-3 text-center">AI Confidence</th>
                <th className="pb-3 text-right">Trend Indicator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {demandPrediction.map((pred, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-3 font-bold text-slate-900">{pred.dish}</td>
                  <td className="py-3 text-center font-mono font-bold text-slate-800">{pred.predictedUnits} units</td>
                  <td className="py-3 text-center font-mono font-black text-flame-600">{pred.recommendedPrepBatch} portions</td>
                  <td className="py-3 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                      {pred.confidence}
                    </span>
                  </td>
                  <td className="py-3 text-right font-bold text-emerald-700">{pred.trend}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Waste Reduction Strategy Banner */}
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-3">
          <Recycle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-extrabold">Active Kitchen Waste Reduction Protocol:</div>
            <p className="mt-0.5 text-emerald-800">
              {foodWasteReduction.activePrepCapRecommendation} Estimated savings: <strong>{foodWasteReduction.wastePreventedKg} kg</strong> per day across Tawa & Steam counters.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import {
  Wallet,
  Sparkles,
  Plus,
  CheckCircle2,
  Sliders,
  Utensils,
  ArrowRight
} from 'lucide-react';

export default function BudgetFinder() {
  const [budget, setBudget] = useState(120);
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addedComboIdx, setAddedComboIdx] = useState(null);
  const { addToCart } = useCart();

  useEffect(() => {
    let timeout = setTimeout(() => {
      setLoading(true);
      axios.get(`/api/recommendations/budget?max=${budget}`).then((res) => {
        if (res.data.success) {
          setCombos(res.data.combos || []);
        }
      }).catch(() => {}).finally(() => setLoading(false));
    }, 250);

    return () => clearTimeout(timeout);
  }, [budget]);

  const handleAddCombo = async (combo, idx) => {
    setAddedComboIdx(idx);
    for (const item of combo.items) {
      await addToCart(item.id, 1, 'Budget Combo Deal');
    }
    setTimeout(() => setAddedComboIdx(null), 1200);
  };

  return (
    <div className="bg-gradient-to-br from-amber-500/10 via-flame-500/5 to-orange-500/10 rounded-3xl border border-amber-200/80 p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-amber-200/60">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black mb-2">
            <Wallet className="w-3.5 h-3.5 text-amber-700" />
            <span>AI STUDENT BUDGET-BASED MEAL FINDER</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-sans">
            Find the Best Meal Under Your Budget
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Slide to your desired budget and get curated nutritious combinations (Main + Beverage/Snack) within your pocket limit.
          </p>
        </div>

        {/* Live Budget Counter */}
        <div className="text-center sm:text-right bg-white p-3.5 rounded-2xl border border-amber-200 shadow-sm min-w-32">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Your Budget Cap</div>
          <div className="text-3xl font-black font-mono text-flame-600">₹{budget}</div>
        </div>
      </div>

      {/* Slider Bar */}
      <div className="my-6">
        <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
          <span>₹40 (Snack/Tea)</span>
          <span>₹100 (Standard Lunch)</span>
          <span>₹150 (Executive Combo)</span>
          <span>₹250 (Feast)</span>
        </div>
        <input
          type="range"
          min="40"
          max="250"
          step="10"
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-flame-600"
        />
      </div>

      {/* Combos Grid */}
      {loading ? (
        <div className="py-8 text-center text-xs text-slate-400 font-medium">
          Calculating best food pairings under ₹{budget}...
        </div>
      ) : combos.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500">
          No complete combos under ₹{budget}. Try increasing the slider to at least ₹60.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {combos.map((combo, idx) => (
            <div
              key={idx}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-flame-400 transition-all hover:-translate-y-1"
            >
              <div>
                <span className="px-2 py-0.5 bg-flame-50 text-flame-700 rounded-lg text-[10px] font-black uppercase">
                  {combo.tag}
                </span>
                <h4 className="font-extrabold text-slate-900 text-sm mt-2 line-clamp-2">
                  {combo.title}
                </h4>

                <div className="text-[11px] text-slate-500 mt-1">
                  {combo.items.length} items • {combo.calories} kcal
                </div>

                <div className="text-2xl font-black font-mono text-slate-900 my-2">
                  ₹{combo.totalPrice.toFixed(2)}
                </div>
              </div>

              <button
                onClick={() => handleAddCombo(combo, idx)}
                className="w-full mt-3 py-2 bg-slate-900 hover:bg-flame-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                {addedComboIdx === idx ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Added Combo!</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Combo</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

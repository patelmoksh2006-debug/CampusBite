import React, { useState } from 'react';
import {
  X,
  Flame,
  Clock,
  ChefHat,
  Plus,
  Minus,
  Sparkles,
  ShieldCheck,
  Award,
  CheckCircle2,
  Utensils
} from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function ProductModal3D({ food, onClose }) {
  const { addToCart, updateQuantity, items: cartItems } = useCart();
  const [specialNote, setSpecialNote] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('overview'); // 'overview' | 'nutrition' | 'origin'
  const [isAddedAnim, setIsAddedAnim] = useState(false);

  if (!food) return null;

  // Find quantity in cart
  const cartItem = cartItems.find((ci) => ci.food_item_id === food.id);
  const qtyInCart = cartItem ? cartItem.quantity : 0;

  const handleAdd = async () => {
    setIsAddedAnim(true);
    await addToCart(food.id, 1, specialNote);
    setTimeout(() => setIsAddedAnim(false), 800);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative max-w-2xl w-full bg-white rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden transition-all duration-300 transform perspective-1000 animate-in fade-in zoom-in-95"
        style={{
          boxShadow: '0 25px 50px -12px rgba(234, 88, 12, 0.25), 0 0 40px rgba(0, 0, 0, 0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-md flex items-center justify-center transition-all hover:rotate-90"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 3D Realistic Hero Image Container with Parallax Perspective */}
        <div className="relative h-64 sm:h-72 w-full bg-slate-900 overflow-hidden group">
          <img
            src={food.image_url}
            alt={food.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

          {/* 3D Floating Dietary Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
            {food.is_veg && (
              <span className="px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-xs font-black text-emerald-800 border border-emerald-300 shadow-lg flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                🟢 100% Pure Veg
              </span>
            )}
            {food.is_jain && (
              <span className="px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-xs font-black text-amber-800 border border-amber-300 shadow-lg flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                🟡 Jain Segregated
              </span>
            )}
          </div>

          {/* Station Badge */}
          <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-slate-900/90 text-white backdrop-blur-md text-xs font-black border border-slate-700 flex items-center gap-1.5 shadow-md">
              <ChefHat className="w-4 h-4 text-amber-400" />
              Station: {food.station_name}
            </span>
          </div>

          {/* 3D Price Tag */}
          <div className="absolute bottom-4 right-4 z-10 bg-gradient-to-tr from-flame-600 to-amber-500 text-white px-4 py-1.5 rounded-2xl font-mono text-2xl font-black shadow-xl shadow-flame-600/40">
            ₹{Number(food.price).toFixed(2)}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div>
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-sans">
                {food.name}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              {food.description}
            </p>
          </div>

          {/* 3D Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-orange-50/60 p-3 rounded-2xl border border-orange-200/80 text-center">
              <div className="flex items-center justify-center gap-1 text-flame-600 text-xs font-bold mb-0.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Prep Speed</span>
              </div>
              <div className="text-base font-black text-slate-900">{food.prep_time_mins} mins</div>
            </div>

            <div className="bg-amber-50/60 p-3 rounded-2xl border border-amber-200/80 text-center">
              <div className="flex items-center justify-center gap-1 text-amber-600 text-xs font-bold mb-0.5">
                <Flame className="w-3.5 h-3.5" />
                <span>Energy</span>
              </div>
              <div className="text-base font-black text-slate-900">{food.calories} kcal</div>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
              <div className="text-slate-500 text-xs font-bold mb-0.5">
                Spice Intensity
              </div>
              <div className="text-sm font-black text-slate-900">
                {Array.from({ length: Math.max(1, food.spice_level || 1) }).map((_, i) => (
                  <span key={i}>🌶️</span>
                ))}
              </div>
            </div>
          </div>

          {/* Subtabs for realistic canteen immersion */}
          <div className="border-b border-slate-200">
            <div className="flex gap-4 text-xs font-bold">
              <button
                onClick={() => setActiveSubTab('overview')}
                className={`pb-2 transition-all ${
                  activeSubTab === 'overview'
                    ? 'border-b-2 border-flame-600 text-flame-600 font-black'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Chef Notes & Prep
              </button>
              <button
                onClick={() => setActiveSubTab('nutrition')}
                className={`pb-2 transition-all ${
                  activeSubTab === 'nutrition'
                    ? 'border-b-2 border-flame-600 text-flame-600 font-black'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Nutritional Profile
              </button>
              <button
                onClick={() => setActiveSubTab('origin')}
                className={`pb-2 transition-all ${
                  activeSubTab === 'origin'
                    ? 'border-b-2 border-flame-600 text-flame-600 font-black'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                FSSAI & Hygiene Safety
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeSubTab === 'overview' && (
            <div className="space-y-3 text-xs text-slate-600">
              <p>
                Freshly prepared on order at <strong className="text-slate-900">{food.station_name}</strong> using pure Desi Ghee and cold-pressed mustard oil. Served steaming hot on stainless steel partitioned trays.
              </p>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Customization Instructions for Chef
                </label>
                <input
                  type="text"
                  value={specialNote}
                  onChange={(e) => setSpecialNote(e.target.value)}
                  placeholder="E.g. Extra chutney, less spicy, no coriander..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-flame-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {activeSubTab === 'nutrition' && (
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-400 text-[10px]">PROTEIN</div>
                <div className="text-sm font-black text-slate-900">14.2g</div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-400 text-[10px]">CARBS</div>
                <div className="text-sm font-black text-slate-900">48.5g</div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-400 text-[10px]">HEALTHY FATS</div>
                <div className="text-sm font-black text-slate-900">11.0g</div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-400 text-[10px]">FIBER</div>
                <div className="text-sm font-black text-slate-900">6.4g</div>
              </div>
            </div>
          )}

          {activeSubTab === 'origin' && (
            <div className="p-3 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                FSSAI Grade A+ Central Campus Canteen Verified
              </div>
              <div className="text-[11px] text-emerald-700">
                License #1001902200987. Zero artificial food colorings, unadulterated dairy from campus gaushala.
              </div>
            </div>
          )}

          {/* Actions: Add to Tray */}
          <div className="pt-2 flex items-center justify-between gap-4">
            {qtyInCart > 0 ? (
              <div className="flex items-center gap-3 bg-flame-50 border border-flame-200 rounded-2xl p-2">
                <button
                  onClick={() => updateQuantity(food.id, -1)}
                  className="w-9 h-9 rounded-xl bg-white text-flame-700 shadow-xs flex items-center justify-center font-black hover:bg-flame-100 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-black text-flame-900 text-sm px-2">
                  {qtyInCart} in Tray
                </span>
                <button
                  onClick={() => updateQuantity(food.id, 1)}
                  className="w-9 h-9 rounded-xl bg-flame-600 text-white shadow-xs flex items-center justify-center font-black hover:bg-flame-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ) : null}

            <button
              onClick={handleAdd}
              disabled={food.is_86_killed}
              className={`flex-1 py-3.5 rounded-2xl font-black text-sm shadow-xl transition-all flex items-center justify-center gap-2 ${
                food.is_86_killed
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-flame-600 hover:bg-flame-700 text-white shadow-flame-600/30 hover:scale-[1.02]'
              }`}
            >
              {isAddedAnim ? (
                <>
                  <CheckCircle2 className="w-5 h-5 animate-bounce" />
                  <span>Added to Tray!</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span>Add to Tray • ₹{Number(food.price).toFixed(2)}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

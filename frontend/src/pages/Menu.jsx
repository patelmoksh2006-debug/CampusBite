import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  SlidersHorizontal,
  Clock,
  Flame,
  CheckCircle2,
  Plus,
  Minus,
  ShoppingBag,
  Sparkles,
  AlertCircle,
  Tag,
  ChefHat,
  Eye,
  QrCode,
  TrendingDown,
  Leaf,
  Zap,
  Award,
  Wallet,
  Coins
} from 'lucide-react';
import ProductModal3D from '../components/ProductModal3D';
import BudgetFinder from '../components/BudgetFinder';
import QRPickupModal from '../components/QRPickupModal';

export default function Menu() {
  const { user } = useAuth();
  const { items: cartItems, addToCart, updateQuantity, totalQuantity, billing } = useCart();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isVegOnly, setIsVegOnly] = useState(false);
  const [isJainOnly, setIsJainOnly] = useState(false);
  const [isVeganOnly, setIsVeganOnly] = useState(false);
  const [isGlutenFreeOnly, setIsGlutenFreeOnly] = useState(false);
  const [maxPrepTime, setMaxPrepTime] = useState(15);
  const [loading, setLoading] = useState(true);
  const [modalFood, setModalFood] = useState(null); // 3D Pop-up Modal State
  const [recommendations, setRecommendations] = useState([]);
  const [showBudgetFinder, setShowBudgetFinder] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const searchInputRef = useRef(null);

  // Fetch Smart Recommendations on mount
  useEffect(() => {
    axios.get('/api/recommendations/smart').then((res) => {
      if (res.data.success) {
        setRecommendations(res.data.recommendations || []);
      }
    }).catch(() => {});
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch categories & menu items
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        const [catRes, itemRes] = await Promise.all([
          axios.get('/api/menu/categories'),
          axios.get('/api/menu/items', {
            params: {
              category: selectedCategory,
              is_veg: isVegOnly ? 'true' : undefined,
              is_jain: isJainOnly ? 'true' : undefined,
              max_prep_time: maxPrepTime < 15 ? maxPrepTime : undefined,
              search: searchQuery || undefined
            }
          })
        ]);

        if (catRes.data.success) setCategories(catRes.data.categories || []);
        if (itemRes.data.success) setItems(itemRes.data.items || []);
      } catch (err) {
        console.error('Menu load error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [selectedCategory, isVegOnly, isJainOnly, maxPrepTime, searchQuery]);

  // Find item quantity in current cart
  const getItemCartQty = (foodId) => {
    const found = cartItems.find((ci) => ci.food_item_id === foodId);
    return found ? found.quantity : 0;
  };

  // Calculate HACK50 progress
  const rawSubtotal = cartItems.reduce((acc, ci) => acc + ci.subtotal, 0);
  const hack50Remaining = Math.max(0, 199.0 - rawSubtotal);

  // Dietary filters (Pure Veg, Jain, Vegan, Gluten-Free)
  const displayedItems = items.filter((food) => {
    if (isVeganOnly) {
      if (!food.is_veg) return false;
      const lower = food.name.toLowerCase();
      if (lower.includes('paneer') || lower.includes('butter') || lower.includes('curd') || lower.includes('lassi') || lower.includes('cheese')) return false;
    }
    if (isGlutenFreeOnly) {
      const lower = food.name.toLowerCase();
      if (lower.includes('roti') || lower.includes('naan') || lower.includes('kulcha') || lower.includes('burger') || lower.includes('noodles') || lower.includes('bhature')) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen pb-32">
      {/* Top Banner & Search */}
      <div className="bg-gradient-to-r from-flame-700 via-flame-600 to-amber-600 text-white py-10 px-4 sm:px-6 lg:px-8 shadow-md">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold bg-white/20 backdrop-blur-md px-3 py-1 rounded-full w-fit mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Express Canteen Ordering • Counter 2 Open</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
                CampusBite Food Catalog
              </h1>
              <p className="text-orange-100 text-sm mt-1 max-w-xl">
                Freshly prepared university canteen dishes. Apply <span className="font-bold underline">HACK50</span> on orders above ₹199 for ₹50 instant discount!
              </p>
            </div>

            {/* Quick Search with Ctrl+K */}
            <div className="relative w-full md:w-80">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dishes (e.g. Dosa, Thali)..."
                className="w-full pl-10 pr-16 py-3 rounded-2xl bg-white text-slate-900 placeholder-slate-400 text-sm font-medium shadow-inner focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <div className="absolute right-3 top-3 text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">
                Ctrl K
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* Quick Smart Actions Bar: Pre-Ordering Slot, Budget Finder, QR Pickup */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            {/* ⚡ Smart Pre-Ordering Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
              <Zap className="w-4 h-4 text-amber-600" />
              <span>⚡ Pre-Order Slot: <strong>1:15 PM – 1:30 PM</strong> (Lunch Break)</span>
            </div>

            {/* 🗑️ Food Waste Reduction Tag */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
              <Leaf className="w-3.5 h-3.5 text-emerald-600" />
              <span>Food Waste Saver: <strong>20% Off</strong> Surplus Snacks</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* 💰 Budget Meal Finder Button */}
            <button
              onClick={() => setShowBudgetFinder(!showBudgetFinder)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all shadow-xs ${
                showBudgetFinder
                  ? 'bg-amber-500 text-white shadow-amber-500/20'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300'
              }`}
            >
              <Coins className="w-4 h-4 text-amber-600" />
              <span>{showBudgetFinder ? 'Close Budget Finder' : '💰 Budget Meal Finder'}</span>
            </button>

            {/* 📱 QR Code Pickup Pass Trigger */}
            <button
              onClick={() => setShowQRModal(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-sm transition-all"
            >
              <QrCode className="w-4 h-4 text-amber-400" />
              <span>📱 QR Pickup Pass</span>
            </button>
          </div>
        </div>

        {/* Embedded Budget Finder Section */}
        {showBudgetFinder && (
          <div className="animate-in fade-in zoom-in-95 duration-200">
            <BudgetFinder />
          </div>
        )}

        {/* 🤖 Smart Food Recommendations Carousel */}
        {recommendations.length > 0 && (
          <div className="bg-gradient-to-r from-orange-50/80 to-amber-50/80 p-6 rounded-3xl border border-orange-200/80 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-flame-500 text-white shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900 font-sans">
                    🤖 Smart Food Recommendations
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    AI-powered meal suggestions based on student order patterns & dietary preferences
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-flame-100 text-flame-800 px-2.5 py-1 rounded-full">
                AI Telemetry Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recommendations.map((rec, index) => {
                const item = rec.item || rec;
                const recId = item.id || rec.id || index + 1;
                const recName = item.name || rec.name || 'Canteen Special';
                const recPrice = Number(item.price || rec.price || 60);
                const recImg = item.image_url || rec.image_url || 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80';
                const matchScore = rec.match_score || 95;

                return (
                  <div
                    key={recId}
                    className="bg-white p-3.5 rounded-2xl border border-orange-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="relative h-32 rounded-xl overflow-hidden mb-2.5 bg-slate-100">
                        <img
                          src={recImg}
                          alt={recName}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&auto=format&fit=crop&q=80';
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-emerald-600/90 text-white font-black text-[9px] backdrop-blur-xs">
                          {matchScore}% MATCH
                        </span>
                        {rec.tag && (
                          <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-slate-900/80 text-white text-[9px] font-bold">
                            {rec.tag}
                          </span>
                        )}
                      </div>
                      <div className="font-extrabold text-xs text-slate-900 leading-snug">{recName}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 italic line-clamp-1">{rec.reason}</div>
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100">
                      <span className="text-xs font-black text-flame-600 font-mono">₹{recPrice.toFixed(2)}</span>
                      <button
                        onClick={() => addToCart(recId, 1)}
                        className="px-2.5 py-1 bg-flame-600 hover:bg-flame-700 text-white rounded-lg text-[10px] font-extrabold shadow-2xs transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Category Tabs & Dietary Filter Pills */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === 'all'
                  ? 'bg-flame-600 text-white shadow-sm shadow-flame-600/30'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All Items
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat.slug
                    ? 'bg-flame-600 text-white shadow-sm shadow-flame-600/30'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Dietary & Speed Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsVegOnly(!isVegOnly)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border transition-all ${
                isVegOnly
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              🟢 Pure Veg
            </button>

            <button
              onClick={() => setIsJainOnly(!isJainOnly)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border transition-all ${
                isJainOnly
                  ? 'bg-amber-50 border-amber-500 text-amber-800'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              🟡 Jain Available
            </button>

            <button
              onClick={() => setIsVeganOnly(!isVeganOnly)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border transition-all ${
                isVeganOnly
                  ? 'bg-lime-50 border-lime-500 text-lime-800'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-lime-600"></span>
              🌱 Vegan
            </button>

            <button
              onClick={() => setIsGlutenFreeOnly(!isGlutenFreeOnly)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border transition-all ${
                isGlutenFreeOnly
                  ? 'bg-sky-50 border-sky-500 text-sky-800'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-sky-600"></span>
              🌾 Gluten-Free
            </button>

            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 text-xs font-bold text-slate-600">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>≤ {maxPrepTime}m</span>
              <input
                type="range"
                min="3"
                max="15"
                step="1"
                value={maxPrepTime}
                onChange={(e) => setMaxPrepTime(parseInt(e.target.value, 10))}
                className="w-16 accent-flame-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Food Items Grid */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-flame-600 border-t-transparent"></div>
            <p className="mt-2 text-sm text-slate-500 font-medium">Loading Canteen Dishes...</p>
          </div>
        ) : displayedItems.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-300 mt-6">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-800">No dishes matching your criteria</h3>
            <p className="text-xs text-slate-500 mt-1">Try clearing filters or searching another dish.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {displayedItems.map((food) => {
              const qtyInCart = getItemCartQty(food.id);
              const isKilled = food.is_86_killed;

              return (
                <div
                  key={food.id}
                  className={`bg-white rounded-3xl border overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl flex flex-col justify-between group cursor-pointer ${
                    isKilled ? 'border-rose-200 opacity-60 bg-rose-50/10' : 'border-slate-200/80 hover:border-flame-400'
                  }`}
                  style={{
                    transformStyle: 'preserve-3d',
                    perspective: '1000px'
                  }}
                  onClick={() => setModalFood(food)}
                >
                  {/* Card Header & Image */}
                  <div>
                    <div className="relative h-48 w-full bg-slate-900 overflow-hidden">
                      <img
                        src={food.image_url}
                        alt={food.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                      {/* 3D Pop-Up Prompt Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950/40 backdrop-blur-xs">
                        <span className="px-3.5 py-1.5 rounded-full bg-white/95 text-slate-900 font-extrabold text-xs shadow-xl flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                          <Eye className="w-3.5 h-3.5 text-flame-600" />
                          <span>Interactive 3D View</span>
                        </span>
                      </div>

                      {/* Dietary Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                        {food.is_veg && (
                          <span className="px-2 py-0.5 rounded-full bg-white/95 backdrop-blur text-[10px] font-extrabold text-emerald-800 border border-emerald-300 shadow-xs flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Pure Veg
                          </span>
                        )}
                        {food.is_jain && (
                          <span className="px-2 py-0.5 rounded-full bg-white/95 backdrop-blur text-[10px] font-extrabold text-amber-800 border border-amber-300 shadow-xs flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Jain Available
                          </span>
                        )}
                      </div>

                      {/* Station Tag */}
                      <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-slate-900/80 backdrop-blur text-[10px] font-bold text-white flex items-center gap-1 z-10">
                        <ChefHat className="w-3 h-3 text-amber-400" />
                        {food.station_name}
                      </div>

                      {/* 86 Killed Out of Stock Overlay */}
                      {isKilled && (
                        <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center z-20">
                          <div className="text-center px-4 py-2 bg-rose-600 text-white rounded-xl font-black text-sm tracking-wider uppercase shadow-lg">
                            86'd (Kitchen Sold Out)
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-extrabold text-slate-900 text-base leading-snug group-hover:text-flame-600 transition-colors">
                          {food.name}
                        </h3>
                        <span className="text-lg font-black text-flame-600 whitespace-nowrap">
                          ₹{food.price.toFixed(2)}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                        {food.description}
                      </p>

                      {/* Metadata Row: Prep Time, Calories, Spice */}
                      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 font-semibold">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>{food.prep_time_mins}m</span>
                        </div>
                        {food.calories > 0 && (
                          <div className="flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5 text-flame-500" />
                            <span>{food.calories} kcal</span>
                          </div>
                        )}
                        <div className="flex items-center gap-0.5" title={`Spice level: ${food.spice_level}/3`}>
                          {Array.from({ length: food.spice_level }).map((_, i) => (
                            <span key={i} className="text-xs">🌶️</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions: Add to Tray */}
                  <div className="p-5 pt-0" onClick={(e) => e.stopPropagation()}>
                    {isKilled ? (
                      <button
                        disabled
                        className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold cursor-not-allowed"
                      >
                        Unavailable
                      </button>
                    ) : qtyInCart > 0 ? (
                      <div className="flex items-center justify-between bg-flame-50 border border-flame-200 rounded-2xl p-1.5">
                        <button
                          onClick={() => updateQuantity(food.id, -1)}
                          className="w-8 h-8 rounded-xl bg-white text-flame-700 shadow-xs flex items-center justify-center font-black hover:bg-flame-100 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-extrabold text-flame-900 text-sm">
                          {qtyInCart} in Tray
                        </span>
                        <button
                          onClick={() => updateQuantity(food.id, 1)}
                          className="w-8 h-8 rounded-xl bg-flame-600 text-white shadow-xs flex items-center justify-center font-black hover:bg-flame-700 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(food.id, 1)}
                        className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-flame-600 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 group"
                      >
                        <Plus className="w-3.5 h-3.5 group-hover:scale-125 transition-transform" />
                        Add to Tray
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sticky Bottom Tray Bar (with HACK50 Savings Progress) */}
      {totalQuantity > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-2xl p-4 transition-all">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Left: Tray Summary & HACK50 Banner */}
            <div>
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-lg bg-flame-100 text-flame-800 text-xs font-extrabold">
                  {totalQuantity} {totalQuantity === 1 ? 'dish' : 'dishes'} in tray
                </span>
                <span className="text-xl font-black text-slate-900">
                  ₹{billing.finalAmount.toFixed(2)}
                </span>
                <span className="text-xs text-slate-400">
                  (incl. CGST/SGST & Subsidy)
                </span>
              </div>

              {/* HACK50 Dynamic Progress */}
              <div className="text-xs mt-1.5 flex items-center gap-2">
                {hack50Remaining > 0 ? (
                  <span className="text-slate-600">
                    Add <span className="font-extrabold text-flame-600">₹{hack50Remaining.toFixed(2)}</span> more to unlock <span className="font-bold bg-amber-100 px-1 rounded">₹50 OFF (HACK50)</span>!
                  </span>
                ) : (
                  <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Coupon HACK50 Auto-Applied! Saved ₹50.00
                  </span>
                )}
              </div>
            </div>

            {/* Right: CTA Checkout */}
            <div className="flex items-center gap-3">
              <Link
                to="/checkout"
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-flame-600 hover:bg-flame-700 text-white font-extrabold text-sm shadow-lg shadow-flame-600/30 flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Review Tray & Checkout</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Interactive 3D Product Catalog Pop-Up Modal */}
      {modalFood && (
        <ProductModal3D food={modalFood} onClose={() => setModalFood(null)} />
      )}

      {/* Express QR Pickup Pass Modal */}
      <QRPickupModal
        order={{
          id: 1,
          order_token: '#TOKEN-412',
          security_pin: '8841',
          counter_assigned: 'Counter 2 (Express Food)'
        }}
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
      />
    </div>
  );
}

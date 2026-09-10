import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useOrderTelemetry } from '../context/WebSocketContext';
import { useAuth } from '../context/AuthContext';
import {
  ChefHat,
  Flame,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Sliders,
  RefreshCw,
  Utensils,
  ArrowRight,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  BellRing,
  Plus,
  Trash2,
  Package,
  Layers,
  Search,
  Eye,
  Send,
  Upload,
  Image as ImageIcon,
  BarChart3,
  ArrowUpDown
} from 'lucide-react';

export default function KitchenKOT() {
  const { user, quickLoginDemo } = useAuth();
  const { subscribeKitchen } = useOrderTelemetry();

  // Active View Tab: 'kot' (Orders Kanban) | 'products' (Product Management CRUD)
  const [activeTab, setActiveTab] = useState('kot');

  const [kanban, setKanban] = useState({
    incoming: [],
    cooking: [],
    at_counter: [],
    archived: []
  });
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [throttleNotice, setThrottleNotice] = useState('');
  const [readyNotificationToast, setReadyNotificationToast] = useState('');

  // Add Product Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDish, setNewDish] = useState({
    name: '',
    category_id: 1,
    description: '',
    price: 60,
    is_veg: true,
    is_jain: false,
    prep_time_mins: 8,
    calories: 320,
    spice_level: 1,
    station_name: 'Tawa 2',
    image_url: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&auto=format&fit=crop&q=80',
    initial_stock: 30
  });
  const [addingDish, setAddingDish] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [smartQueueActive, setSmartQueueActive] = useState(true);

  const samplePresets = [
    { name: 'Chole Bhature', emoji: '🍛', url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80' },
    { name: 'Masala Dosa', emoji: '🥞', url: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80' },
    { name: 'Paneer Butter Masala', emoji: '🍲', url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80' },
    { name: 'Veg Burger', emoji: '🍔', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80' },
    { name: 'Cold Coffee', emoji: '☕', url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80' },
    { name: 'Hakka Noodles', emoji: '🍜', url: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&auto=format&fit=crop&q=80' },
  ];

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      alert('File size exceeds 8MB. Please select a smaller image.');
      return;
    }
    setUploadingImage(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewDish((prev) => ({ ...prev, image_url: reader.result }));
      setUploadingImage(false);
    };
    reader.onerror = () => {
      alert('Failed to read image file');
      setUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  // Fetch KOT board orders and inventory
  const fetchKitchenData = async () => {
    try {
      setLoading(true);
      const [kotRes, invRes] = await Promise.all([
        axios.get('/api/kitchen/kot-board'),
        axios.get('/api/kitchen/inventory')
      ]);

      if (kotRes.data.success) {
        setKanban(kotRes.data.kanban);
      }
      if (invRes.data.success) {
        setInventory(invRes.data.inventory || []);
      }
    } catch (err) {
      console.warn('Failed to load kitchen data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKitchenData();

    // Subscribe to real-time kitchen WebSocket broadcasts
    const unsubscribe = subscribeKitchen((event) => {
      if (event.type === 'NEW_ORDER_PLACED' || event.type === 'ORDER_STATUS_CHANGED') {
        fetchKitchenData();
      } else if (event.type === 'KITCHEN_THROTTLED') {
        setThrottleNotice(event.announcement);
      } else if (event.type === 'INVENTORY_86_TOGGLED') {
        setInventory((prev) =>
          prev.map((i) => (i.food_item_id === event.food_item_id ? { ...i, is_86_killed: event.is_86_killed } : i))
        );
      }
    });

    return () => unsubscribe();
  }, []);

  // Update order status progression & trigger push notification to student
  const handleUpdateStatus = async (orderId, newStatus, token = '') => {
    try {
      setUpdatingId(orderId);
      const res = await axios.patch(`/api/kitchen/orders/${orderId}/status`, { status: newStatus });
      await fetchKitchenData();

      if (newStatus === 'READY') {
        setReadyNotificationToast(`🔔 Order ${token || '#' + orderId} marked READY! Push notification sent to student.`);
        setTimeout(() => setReadyNotificationToast(''), 7000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdatingId(null);
    }
  };

  // Toggle 86 Out-of-Stock Kill Switch
  const handleToggle86 = async (foodItemId, currentState) => {
    try {
      const newState = !currentState;
      await axios.post('/api/kitchen/inventory/86-toggle', {
        food_item_id: foodItemId,
        is_86_killed: newState
      });
      setInventory((prev) =>
        prev.map((i) => (i.food_item_id === foodItemId ? { ...i, is_86_killed: newState } : i))
      );
    } catch (err) {
      alert('Failed to toggle item stock');
    }
  };

  // Delete Dish from Menu
  const handleDeleteProduct = async (foodItemId, foodName) => {
    if (!window.confirm(`Are you sure you want to permanently remove "${foodName}" from the menu?`)) {
      return;
    }
    try {
      await axios.delete(`/api/kitchen/products/${foodItemId}`);
      setInventory((prev) => prev.filter((i) => i.food_item_id !== foodItemId));
      alert(`"${foodName}" was removed from the canteen catalog.`);
    } catch (err) {
      alert('Failed to delete dish');
    }
  };

  // Add New Dish to Menu
  const handleAddProduct = async (e) => {
    e.preventDefault();
    setAddingDish(true);
    try {
      const res = await axios.post('/api/kitchen/products', newDish);
      if (res.data.success) {
        await fetchKitchenData();
        setShowAddModal(false);
        setNewDish({
          name: '',
          category_id: 1,
          description: '',
          price: 60,
          is_veg: true,
          is_jain: false,
          prep_time_mins: 8,
          calories: 320,
          spice_level: 1,
          station_name: 'Tawa 2',
          image_url: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&auto=format&fit=crop&q=80',
          initial_stock: 30
        });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add dish');
    } finally {
      setAddingDish(false);
    }
  };

  // Rush load throttle (+5m delay announcement)
  const handleThrottleRush = async () => {
    try {
      const res = await axios.post('/api/kitchen/throttle', {
        delayMins: 5,
        reason: 'Heavy peak rush on Tawa & Steam counters'
      });
      setThrottleNotice(res.data.message);
      setTimeout(() => setThrottleNotice(''), 8000);
    } catch (err) {
      alert('Failed to throttle rush');
    }
  };

  const filteredInventory = inventory.filter((i) =>
    i.food_name?.toLowerCase().includes(productSearch.toLowerCase()) ||
    i.station_name?.toLowerCase().includes(productSearch.toLowerCase())
  );

  // 👨‍🍳 Smart Kitchen Queue - Prioritize incoming orders by workload & urgency
  const sortedIncoming = [...kanban.incoming].sort((a, b) => {
    if (!smartQueueActive) return 0;
    const countA = (a.items?.length || 1) + (a.special_instructions ? 2 : 0);
    const countB = (b.items?.length || 1) + (b.special_instructions ? 2 : 0);
    return countB - countA;
  });

  const sortedCooking = [...kanban.cooking].sort((a, b) => {
    if (!smartQueueActive) return 0;
    if (a.status === 'PREPARING' && b.status !== 'PREPARING') return -1;
    if (b.status === 'PREPARING' && a.status !== 'PREPARING') return 1;
    return 0;
  });

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Top Operations Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-black uppercase tracking-wider text-amber-700">
              Kitchen Hub • Tawa Station 1 & 2 • Chef Vikram Sharma
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-sans">
            Operations & Product Dashboard
          </h1>
        </div>

        {/* Top Controls & Navigation Switcher */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-slate-100 p-1 rounded-2xl flex border border-slate-200 text-xs font-black">
            <button
              onClick={() => setActiveTab('kot')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'kot'
                  ? 'bg-white shadow text-flame-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Live KOT Orders ({kanban.incoming.length + kanban.cooking.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'products'
                  ? 'bg-white shadow text-flame-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Product Dashboard ({inventory.length})</span>
            </button>
          </div>

          <Link
            to="/admin/analytics"
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
            title="Open Admin Analytics Dashboard"
          >
            <BarChart3 className="w-4 h-4 text-amber-400" />
            <span>📈 Admin Analytics</span>
          </Link>

          {activeTab === 'kot' && (
            <button
              onClick={() => setSmartQueueActive(!smartQueueActive)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                smartQueueActive
                  ? 'bg-purple-50 border-purple-300 text-purple-800 font-extrabold shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
              title="Smart Kitchen Queue prioritizes tickets by prep SLA and items"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-purple-600" />
              <span>{smartQueueActive ? '👨‍🍳 Smart Queue (Active)' : 'Queue (FIFO)'}</span>
            </button>
          )}

          <button
            onClick={handleThrottleRush}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
            title="Broadcast +5m delay to all students"
          >
            <Zap className="w-4 h-4" />
            Rush (+5m Delay)
          </button>

          <button
            onClick={fetchKitchenData}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Ready Notification Toast Banner */}
      {readyNotificationToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs font-black flex items-center justify-between shadow-md animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{readyNotificationToast}</span>
          </div>
          <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
            STUDENT NOTIFIED VIA WEBSOCKET
          </span>
        </div>
      )}

      {/* Throttle Announcement Banner */}
      {throttleNotice && (
        <div className="p-4 rounded-2xl bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <BellRing className="w-5 h-5 text-amber-700 flex-shrink-0" />
          <span>{throttleNotice}</span>
        </div>
      )}

      {/* TAB 1: LIVE KOT KANBAN ORDERS & STATE PROGRESSION */}
      {activeTab === 'kot' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Column 1: Incoming (PLACED) */}
          <div className="bg-slate-100/70 p-4 rounded-3xl border border-slate-200 flex flex-col">
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                <h3 className="font-extrabold text-slate-800 text-sm">Incoming Tickets</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-extrabold text-xs">
                {kanban.incoming.length}
              </span>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto max-h-[calc(100vh-18rem)]">
              {sortedIncoming.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">No pending incoming tickets</div>
              ) : (
                sortedIncoming.map((order, idx) => (
                  <div key={order.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 font-mono text-base">{order.order_token}</span>
                          {smartQueueActive && (
                            <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded font-extrabold text-[9px]">
                              #{idx + 1} PRIORITY
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">{order.student_name}</div>
                      </div>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-bold">
                        PIN {order.security_pin}
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 text-xs text-slate-700">
                      {order.items?.map((item) => (
                        <div key={item.id} className="py-1 flex justify-between">
                          <span>{item.quantity}× {item.name}</span>
                          <span className="text-slate-400 text-[10px]">{item.station_name}</span>
                        </div>
                      ))}
                    </div>

                    {order.special_instructions && (
                      <div className="p-2 bg-amber-50 rounded-xl text-[11px] text-amber-900 italic">
                        Note: {order.special_instructions}
                      </div>
                    )}

                    <button
                      onClick={() => handleUpdateStatus(order.id, 'ACCEPTED', order.order_token)}
                      disabled={updatingId === order.id}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <span>Accept Ticket & Stage</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 2: Cooking (ACCEPTED / PREPARING) */}
          <div className="bg-amber-50/50 p-4 rounded-3xl border border-amber-200 flex flex-col">
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse"></span>
                <h3 className="font-extrabold text-amber-950 text-sm">Cooking Hot</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-extrabold text-xs">
                {kanban.cooking.length}
              </span>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto max-h-[calc(100vh-18rem)]">
              {sortedCooking.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">Stations idle</div>
              ) : (
                sortedCooking.map((order) => (
                  <div key={order.id} className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-black text-slate-900 font-mono text-base">{order.order_token}</div>
                        <div className="text-[11px] text-slate-500">{order.student_name}</div>
                      </div>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-lg text-[10px] font-extrabold">
                        {order.status}
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 text-xs text-slate-700">
                      {order.items?.map((item) => (
                        <div key={item.id} className="py-1 flex justify-between">
                          <span className="font-bold">{item.quantity}× {item.name}</span>
                          <span className="text-amber-700 text-[10px] font-bold">{item.station_name}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col gap-2">
                      {order.status === 'ACCEPTED' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'PREPARING', order.order_token)}
                          disabled={updatingId === order.id}
                          className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-xs"
                        >
                          <Flame className="w-3.5 h-3.5" />
                          <span>Start Sizzling at Stations</span>
                        </button>
                      )}

                      {/* Prominent Button to control when food is READY for pickup & notify student */}
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'READY', order.order_token)}
                        disabled={updatingId === order.id}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 shadow-md hover:scale-[1.02]"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Mark READY & Send Notification 🔔</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 3: At Counter (READY) */}
          <div className="bg-emerald-50/50 p-4 rounded-3xl border border-emerald-200 flex flex-col">
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <h3 className="font-extrabold text-emerald-950 text-sm">At Counter (Ready)</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs">
                {kanban.at_counter.length}
              </span>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto max-h-[calc(100vh-18rem)]">
              {kanban.at_counter.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">No trays waiting at counter</div>
              ) : (
                kanban.at_counter.map((order) => (
                  <div key={order.id} className="bg-white p-4 rounded-2xl border border-emerald-300 shadow-md space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-black text-slate-900 font-mono text-base">{order.order_token}</div>
                        <div className="text-[11px] text-slate-500">{order.student_name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-bold text-slate-400">VERIFY PIN</div>
                        <div className="text-base font-black font-mono text-emerald-600">{order.security_pin}</div>
                      </div>
                    </div>

                    <div className="p-2 bg-emerald-50 rounded-xl text-xs font-bold text-emerald-900 text-center">
                      Packaged at {order.counter_assigned}
                    </div>

                    <button
                      onClick={() => handleUpdateStatus(order.id, 'COMPLETED', order.order_token)}
                      disabled={updatingId === order.id}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-xs"
                    >
                      <span>Verify PIN & Hand Over Tray</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 4: Archived (COMPLETED / CANCELLED) */}
          <div className="bg-slate-100/50 p-4 rounded-3xl border border-slate-200 flex flex-col">
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-400"></span>
                <h3 className="font-extrabold text-slate-700 text-sm">Archived Tickets</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-extrabold text-xs">
                {kanban.archived.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-18rem)]">
              {kanban.archived.slice(0, 10).map((order) => (
                <div key={order.id} className="bg-white/80 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-800 font-mono">{order.order_token}</span>
                    <span
                      className={`font-black text-[10px] ${
                        order.status === 'CANCELLED' ? 'text-rose-600' : 'text-slate-500'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    ₹{order.final_amount.toFixed(2)} • {order.items?.length || 1} items
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCT MANAGEMENT DASHBOARD (ADD, DELETE, EDIT PRODUCTS & 86 TOGGLE) */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <h2 className="text-xl font-black text-slate-900 font-sans">
                Canteen Food Catalog & Stock Management
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Add new seasonal dishes, remove outdated items, or toggle 86 out-of-stock switches.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Filter dishes..."
                  className="pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-flame-500 focus:outline-none"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-flame-600 hover:bg-flame-700 text-white rounded-xl text-xs font-bold shadow-md shadow-flame-600/30 flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Dish</span>
              </button>
            </div>
          </div>

          {/* Dishes Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-3">Dish</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Station</th>
                  <th className="pb-3">Price</th>
                  <th className="pb-3">Dietary</th>
                  <th className="pb-3">86 Kill Switch</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 font-bold text-slate-900 flex items-center gap-3">
                      <img
                        src={item.image_url}
                        alt={item.food_name}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                      />
                      <div>
                        <div>{item.food_name}</div>
                        <div className="text-[10px] text-slate-400 font-normal">Stock: {item.current_stock}</div>
                      </div>
                    </td>
                    <td className="py-3 text-slate-600 font-medium">{item.category_name}</td>
                    <td className="py-3 text-slate-600 font-medium">{item.station_name}</td>
                    <td className="py-3 font-mono font-black text-slate-900">₹{Number(item.price).toFixed(2)}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-extrabold border border-emerald-200">
                        Pure Veg
                      </span>
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => handleToggle86(item.food_item_id, item.is_86_killed)}
                        className={`px-3 py-1 rounded-xl text-[11px] font-black transition-all ${
                          item.is_86_killed
                            ? 'bg-rose-600 text-white'
                            : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        }`}
                      >
                        {item.is_86_killed ? '86’d (OUT)' : 'ACTIVE (IN)'}
                      </button>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleDeleteProduct(item.food_item_id, item.food_name)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        title="Delete this dish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add New Dish Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-black text-slate-900 font-sans mb-1">
              Add New Dish to Canteen Catalog
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Specify station, price, dietary tags and prep time. It will immediately show on student menus.
            </p>

            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Dish Title
                </label>
                <input
                  type="text"
                  required
                  value={newDish.name}
                  onChange={(e) => setNewDish({ ...newDish, name: e.target.value })}
                  placeholder="E.g. Amritsari Chole Kulche"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-flame-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={newDish.price}
                    onChange={(e) => setNewDish({ ...newDish, price: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={newDish.category_id}
                    onChange={(e) => setNewDish({ ...newDish, category_id: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-white"
                  >
                    <option value="1">Thali & Meals</option>
                    <option value="2">South Indian Express</option>
                    <option value="3">Breakfast & Snacks</option>
                    <option value="4">Beverages</option>
                    <option value="5">Chinese & Wok</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Station
                  </label>
                  <select
                    value={newDish.station_name}
                    onChange={(e) => setNewDish({ ...newDish, station_name: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-white"
                  >
                    <option value="Tawa 1">Tawa 1</option>
                    <option value="Tawa 2">Tawa 2</option>
                    <option value="Steam Station">Steam Station</option>
                    <option value="Snack Counter">Snack Counter</option>
                    <option value="Wok Express">Wok Express</option>
                    <option value="Beverages / Bar">Beverages / Bar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Prep Time (m)
                  </label>
                  <input
                    type="number"
                    value={newDish.prep_time_mins}
                    onChange={(e) => setNewDish({ ...newDish, prep_time_mins: parseInt(e.target.value, 10) })}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Initial Stock
                  </label>
                  <input
                    type="number"
                    value={newDish.initial_stock}
                    onChange={(e) => setNewDish({ ...newDish, initial_stock: parseInt(e.target.value, 10) })}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>
              </div>

              {/* Chef Dish Image Upload & Presets */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Chef Dish Image Upload
                  </label>
                  <span className="text-[10px] text-slate-500 font-semibold">JPG, PNG, WebP (up to 8MB)</span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Instant Image Preview */}
                  <div className="w-16 h-16 rounded-xl bg-white border border-slate-300 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-xs">
                    {newDish.image_url ? (
                      <img src={newDish.image_url} alt="Dish Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    {/* File Upload Button */}
                    <label className="flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl cursor-pointer text-xs font-bold text-slate-700 transition-colors shadow-xs">
                      <Upload className="w-3.5 h-3.5 text-flame-600" />
                      <span>{uploadingImage ? 'Loading Image...' : 'Choose Image File from Computer'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </label>

                    {/* Or URL input */}
                    <input
                      type="url"
                      value={newDish.image_url}
                      onChange={(e) => setNewDish({ ...newDish, image_url: e.target.value })}
                      placeholder="Or paste web image URL (https://...)"
                      className="w-full px-2.5 py-1 rounded-lg border border-slate-300 text-[11px] bg-white"
                    />
                  </div>
                </div>

                {/* Fast Presets */}
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Or select high-res food preset:
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {samplePresets.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setNewDish({ ...newDish, image_url: preset.url, name: newDish.name || preset.name })}
                        className="px-2 py-1 rounded-lg bg-white hover:bg-flame-50 hover:text-flame-700 hover:border-flame-300 border border-slate-200 text-[10px] font-bold text-slate-700 transition-all shadow-2xs flex items-center gap-1"
                      >
                        <span>{preset.emoji}</span>
                        <span>{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newDish.description}
                  onChange={(e) => setNewDish({ ...newDish, description: e.target.value })}
                  placeholder="Ingredients, gravy details, side accompaniments..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-flame-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newDish.is_veg}
                    onChange={(e) => setNewDish({ ...newDish, is_veg: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  🟢 Pure Vegetarian
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newDish.is_jain}
                    onChange={(e) => setNewDish({ ...newDish, is_jain: e.target.checked })}
                    className="w-4 h-4 text-amber-600 rounded"
                  />
                  🟡 Jain Friendly
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingDish}
                  className="flex-1 py-3 bg-flame-600 hover:bg-flame-700 text-white font-black rounded-xl text-xs shadow-md transition-colors"
                >
                  {addingDish ? 'Adding Dish...' : 'Publish to Student Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

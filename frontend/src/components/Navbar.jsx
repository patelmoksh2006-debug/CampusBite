import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useOrderTelemetry } from '../context/WebSocketContext';
import NotificationCenter from './NotificationCenter';
import GroupOrderModal from './GroupOrderModal';
import {
  Utensils,
  Flame,
  Wallet as WalletIcon,
  ChefHat,
  ShoppingBag,
  Clock,
  User,
  LogOut,
  RefreshCw,
  FileText,
  Users,
  BarChart3,
  Activity
} from 'lucide-react';

export default function Navbar() {
  const { user, wallet, quickLoginDemo, logout } = useAuth();
  const { totalQuantity, billing } = useCart();
  const { isConnected } = useOrderTelemetry();
  const location = useLocation();
  const navigate = useNavigate();
  const [showGroupModal, setShowGroupModal] = useState(false);

  const isKitchenMode =
    user?.role === 'kitchen_staff' ||
    user?.role === 'admin' ||
    location.pathname === '/kitchen-login' ||
    location.pathname.startsWith('/admin');

  const isCurrent = (path) => location.pathname === path;

  return (
    <nav className="bg-white/95 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200 shadow-xs transition-all w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 lg:gap-5 flex-shrink-0">
            <Link to="/menu" className="flex items-center gap-2 group whitespace-nowrap flex-shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-flame-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-flame-600/30 group-hover:scale-105 transition-transform flex-shrink-0">
                <Flame className="w-5 h-5 animate-pulse" />
              </div>

              <div className="whitespace-nowrap">
                <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 font-sans">
                  Campus<span className="text-flame-600">Bite</span>
                </span>
                <span className="hidden xl:inline-block ml-1.5 px-1.5 py-0.5 text-[9px] font-extrabold bg-amber-100 text-amber-900 rounded tracking-wide uppercase whitespace-nowrap">
                  North Canteen
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links (Strictly Single Line) */}
            <div className="hidden md:flex items-center gap-1 flex-nowrap whitespace-nowrap flex-shrink-0">
              <Link
                to="/menu"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-colors ${
                  isCurrent('/menu')
                    ? 'bg-flame-50 text-flame-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>Food Menu</span>
              </Link>

              {/* Live Tracking ONLY for Students */}
              {!isKitchenMode && (
                <Link
                  to="/tracking"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-colors ${
                    isCurrent('/tracking')
                      ? 'bg-flame-50 text-flame-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Live Tracking</span>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </Link>
              )}

              {/* If Kitchen Staff: Show Product & KOT Operations */}
              {isKitchenMode ? (
                <>
                  <Link
                    to="/admin/kitchen"
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap flex-shrink-0 transition-colors ${
                      isCurrent('/admin/kitchen')
                        ? 'bg-amber-100 text-amber-900 ring-1 ring-amber-300'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <ChefHat className="w-3.5 h-3.5 text-amber-600" />
                    <span>Kitchen Hub</span>
                  </Link>

                  <Link
                    to="/admin/analytics"
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap flex-shrink-0 transition-colors ${
                      isCurrent('/admin/analytics')
                        ? 'bg-amber-100 text-amber-900 ring-1 ring-amber-300'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-amber-600" />
                    <span>Analytics</span>
                  </Link>
                </>
              ) : (
                /* For Student: Kitchen KOT is edited to Kitchen Staff Login */
                <Link
                  to="/kitchen-login"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 whitespace-nowrap flex-shrink-0 transition-colors"
                >
                  <ChefHat className="w-3.5 h-3.5 text-amber-600" />
                  <span>Kitchen Staff Login</span>
                </Link>
              )}

              {/* Wallet & Pass for students only */}
              {!isKitchenMode && (
                <Link
                  to="/wallet"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-colors ${
                    isCurrent('/wallet')
                      ? 'bg-flame-50 text-flame-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <WalletIcon className="w-3.5 h-3.5" />
                  <span>Wallet & Pass</span>
                </Link>
              )}
            </div>
          </div>

          {/* Right Action Bar (Strictly Single Line) */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-nowrap whitespace-nowrap flex-shrink-0">
            {/* 🟢🟡🔴 Cafeteria Rush Indicator (shown on wide screens) */}
            <div
              className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800 shadow-xs cursor-default whitespace-nowrap flex-shrink-0"
              title="Live Cafeteria Rush: Low wait times (4-8m)"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></span>
              <span className="whitespace-nowrap">🟢 Rush: LOW (6m wait)</span>
            </div>

            {/* 👥 Group Order Trigger (Student only) */}
            {!isKitchenMode && (
              <button
                onClick={() => setShowGroupModal(true)}
                className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 text-xs font-bold transition-all shadow-xs whitespace-nowrap flex-shrink-0"
                title="Order food with friends/roommates"
              >
                <Users className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                <span className="whitespace-nowrap">Group Tray</span>
              </button>
            )}

            {/* Quick Demo Persona Switcher */}
            <div className="hidden lg:flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-[11px] font-semibold whitespace-nowrap flex-shrink-0">
              <button
                onClick={() => {
                  quickLoginDemo('student');
                  navigate('/menu');
                }}
                className={`px-2 py-1 rounded-lg transition-all whitespace-nowrap ${
                  user?.role === 'student'
                    ? 'bg-white shadow-xs text-flame-600 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Switch to Student Aarav Patel"
              >
                👨‍🎓 Student
              </button>
              <button
                onClick={() => {
                  quickLoginDemo('kitchen');
                  navigate('/admin/kitchen');
                }}
                className={`px-2 py-1 rounded-lg transition-all whitespace-nowrap ${
                  user?.role === 'kitchen_staff' || user?.role === 'admin'
                    ? 'bg-white shadow-xs text-amber-700 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Switch to Kitchen Chef Vikram"
              >
                👨‍🍳 Kitchen
              </button>
            </div>

            {/* 🔔 Smart Notification Center Bell */}
            <div className="flex-shrink-0">
              <NotificationCenter />
            </div>

            {/* Wallet Balance Pill (REMOVED IN KITCHEN LOGIN / KITCHEN MODE) */}
            {!isKitchenMode && user && (
              <Link
                to="/wallet"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-colors shadow-xs whitespace-nowrap flex-shrink-0"
                title="Campus Wallet Balance"
              >
                <WalletIcon className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span className="whitespace-nowrap">₹{wallet ? Number(wallet.balance).toFixed(2) : '340.00'}</span>
              </Link>
            )}

            {/* Cart Trigger (REMOVED IN KITCHEN LOGIN / KITCHEN MODE) */}
            {!isKitchenMode && (
              <Link
                to="/checkout"
                className="relative px-3 py-1.5 rounded-xl bg-flame-600 text-white hover:bg-flame-700 transition-all shadow-md shadow-flame-600/25 flex items-center gap-1.5 font-bold text-xs whitespace-nowrap flex-shrink-0"
              >
                <ShoppingBag className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap">Tray</span>
                {totalQuantity > 0 && (
                  <span className="bg-white text-flame-600 font-black px-1.5 py-0.2 rounded-full text-[10px] leading-tight flex-shrink-0">
                    {totalQuantity}
                  </span>
                )}
              </Link>
            )}

            {/* WebSocket Pulse Dot */}
            <div
              className="flex items-center gap-1 text-[11px] text-slate-500"
              title={isConnected ? 'Real-time WebSocket Live' : 'Reconnecting WebSocket...'}
            >
              <span
                className={`w-2 h-2 rounded-full transition-colors ${
                  isConnected ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50' : 'bg-rose-500 animate-ping'
                }`}
              />
            </div>

            {/* User Profile / Logout */}
            {user ? (
              <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-200">
                <span className="hidden xl:inline text-xs font-bold text-slate-700">
                  {user.full_name?.split(' ')[0]}
                </span>
                <button
                  onClick={logout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="text-xs font-bold text-flame-600 hover:underline px-2 py-1"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>


      {/* Group Ordering Modal */}
      <GroupOrderModal isOpen={showGroupModal} onClose={() => setShowGroupModal(false)} />
    </nav>
  );
}

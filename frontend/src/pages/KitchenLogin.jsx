import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ChefHat,
  ShieldCheck,
  Flame,
  ArrowRight,
  AlertCircle,
  KeyRound,
  UtensilsCrossed,
  ArrowLeft
} from 'lucide-react';

export default function KitchenLogin() {
  const { user, login, quickLoginDemo } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin.kitchen@campusbite.edu');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && (user.role === 'kitchen_staff' || user.role === 'admin')) {
      navigate('/admin/kitchen');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/admin/kitchen');
    } catch (err) {
      setError(err.message || 'Kitchen authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickChefFill = async () => {
    setError('');
    setSubmitting(true);
    try {
      await quickLoginDemo('kitchen');
      navigate('/admin/kitchen');
    } catch (err) {
      setError(err.message || 'Quick login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950">
      <div className="max-w-md w-full bg-slate-900/90 border border-slate-700/80 rounded-3xl p-8 shadow-2xl backdrop-blur-md text-white">
        {/* Kitchen Badge Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto mb-4 shadow-inner">
            <ChefHat className="w-9 h-9 animate-bounce" />
          </div>
          <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
            STAFF ACCESS PORTAL
          </span>
          <h1 className="text-2xl font-black tracking-tight font-sans mt-3">
            CampusBite Kitchen Hub
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Authorized Executive Chef & Line Staff Access for KOT Telemetry and Dish Management
          </p>
        </div>

        {/* 1-Tap Demo Chef Button */}
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
          <div className="text-xs font-bold text-amber-300 mb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            1-Tap Demo Staff Pass
          </div>
          <button
            type="button"
            onClick={handleQuickChefFill}
            disabled={submitting}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2"
          >
            <span>Sign In as Chef Vikram Sharma (Tawa 2)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs font-bold text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Staff Email ID
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin.kitchen@campusbite.edu"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Station Security PIN / Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-flame-600 hover:bg-flame-700 text-white font-extrabold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            {submitting ? 'Authenticating Staff...' : 'Enter Kitchen Operations'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-amber-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Return to University Student Login
          </Link>
        </div>
      </div>
    </div>
  );
}

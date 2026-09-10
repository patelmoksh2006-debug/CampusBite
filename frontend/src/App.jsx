import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import KitchenLogin from './pages/KitchenLogin';
import Menu from './pages/Menu';
import Checkout from './pages/Checkout';
import Tracking from './pages/Tracking';
import KitchenKOT from './pages/KitchenKOT';
import Invoice from './pages/Invoice';
import FeedbackGrievance from './pages/FeedbackGrievance';
import Wallet from './pages/Wallet';
import AdminAnalytics from './pages/AdminAnalytics';
import AIChatbot from './components/AIChatbot';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-flame-500 selection:text-white">
        <Navbar />

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Navigate to="/menu" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/kitchen-login" element={<KitchenLogin />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/tracking" element={<Tracking />} />
            <Route path="/admin/kitchen" element={<KitchenKOT />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/invoice" element={<Invoice />} />
            <Route path="/feedback" element={<FeedbackGrievance />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="*" element={<Navigate to="/menu" replace />} />
          </Routes>
        </main>

        {/* Global Floating AI Canteen Assistant & WhatsApp Integration */}
        <AIChatbot />

        <footer className="no-print bg-white border-t border-slate-200 py-6 px-4 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-800">CampusBite</span>
              <span>— Automated University Dining & Telemetry Platform</span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span>GSTIN: <strong>07AAATC9012E1Z8</strong></span>
              <span>•</span>
              <span>FSSAI Lic: <strong>#1001902200987</strong></span>
              <span>•</span>
              <span className="text-emerald-700 font-bold">Sec 31 CGST Act Compliant</span>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

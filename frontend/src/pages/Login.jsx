import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  Flame,
  ShieldCheck,
  Award,
  Clock,
  Sparkles,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  Users,
  AlertCircle
} from 'lucide-react';

export default function Login() {
  const { user, login, register, quickLoginDemo } = useAuth();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('student.demo@campusbite.edu');
  const [password, setPassword] = useState('password123');
  const [fullName, setFullName] = useState('Aarav Patel');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [rollNumber, setRollNumber] = useState('2022CS8942');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [hostelBlock, setHostelBlock] = useState('Hostel Block 4');
  const [roomNumber, setRoomNumber] = useState('302');
  const [specials, setSpecials] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // If already logged in, redirect to menu
    if (user) {
      if (user.role === 'kitchen_staff') navigate('/admin/kitchen');
      else navigate('/menu');
    }

    // Fetch daily specials
    axios.get('/api/menu/specials').then(res => {
      if (res.data.success) setSpecials(res.data.specials || []);
    }).catch(() => {});
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (isRegister) {
        await register({
          email,
          password,
          full_name: fullName,
          phone,
          roll_number: rollNumber,
          department,
          hostel_block: hostelBlock,
          room_number: roomNumber
        });
      } else {
        await login(email, password);
      }
      navigate('/menu');
    } catch (err) {
      setError(err.message || 'Authentication error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickFill = async (role) => {
    setError('');
    setSubmitting(true);
    try {
      await quickLoginDemo(role);
      if (role === 'kitchen') navigate('/admin/kitchen');
      else navigate('/menu');
    } catch (err) {
      setError(err.message || 'Quick login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/20">
      {/* Left Column: University Telemetry & Specials Callout */}
      <div className="lg:w-1/2 p-8 lg:p-14 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-flame-100 text-flame-800 text-xs font-bold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-flame-600" />
            University Smart Dining & Telemetry System
          </div>

          <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight font-sans mb-4">
            Zero-Wait Canteen Dining for <span className="text-flame-600">Smart Campuses</span>.
          </h1>

          <p className="text-slate-600 text-base leading-relaxed mb-8 max-w-xl">
            Skip long lunch queues with scheduled time-slot pre-orders, real-time kitchen queue telemetry, Section 31 CGST statutory billing, and integrated student dining passes.
          </p>

          {/* North Canteen Rush Gauge */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">North Canteen Live Rush Gauge</span>
              </div>
              <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                Peak Window Active
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center mb-3">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div className="text-xl font-black text-flame-600">78%</div>
                <div className="text-[11px] text-slate-500 font-medium">Capacity Used</div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div className="text-xl font-black text-slate-900">08m</div>
                <div className="text-[11px] text-slate-500 font-medium">Avg Prep Time</div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div className="text-xl font-black text-emerald-600">Counter 2</div>
                <div className="text-[11px] text-slate-500 font-medium">Express Line</div>
              </div>
            </div>

            {/* Capacity Progress Bar */}
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 via-amber-500 to-flame-600 h-full rounded-full transition-all duration-1000" style={{ width: '78%' }} />
            </div>
          </div>

          {/* Daily Specials Showcase */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Campus Specials</span>
              <span className="text-xs text-flame-600 font-bold">HACK50 Applied</span>
            </div>
            {specials.slice(0, 2).map((item) => (
              <div key={item.id} className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-flame-50 text-flame-700">
                      {item.banner_tag}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{item.description}</p>
                </div>
                <div className="text-right pl-4">
                  <div className="text-base font-extrabold text-flame-600">₹{Number(item.special_price).toFixed(2)}</div>
                  <div className="text-xs text-slate-400 line-through">₹{Number(item.original_price).toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FSSAI Badge & Statutory Certification */}
        <div className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-600" />
            <div>
              <div className="font-bold text-slate-800">FSSAI Certified Grade A+</div>
              <div className="text-[10px]">Licence No. 1001902200987</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
            <div>
              <div className="font-bold text-slate-800">GSTIN Registered</div>
              <div className="text-[10px]">07AAATC9012E1Z8</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Split Layout Form & 1-Click Quick Fill */}
      <div className="lg:w-1/2 p-8 lg:p-14 flex flex-col justify-center">
        <div className="max-w-md w-full mx-auto bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50">
          {/* Quick Demo Login Triggers */}
          <div className="mb-6 p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80">
            <div className="text-xs font-extrabold text-amber-900 mb-2 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-amber-600" />
              1-Tap Student Demo Access
            </div>
            <button
              type="button"
              onClick={() => handleQuickFill('student')}
              disabled={submitting}
              className="w-full px-4 py-2.5 bg-white text-flame-600 border border-flame-300 rounded-xl text-xs font-bold hover:bg-flame-50 transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <span>👨‍🎓 Sign In as Aarav Patel (Student Demo)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <div className="text-[10px] text-amber-700/80 mt-2 text-center">
              CSE Department • Hostel Block 4 • ₹340 Campus Wallet
            </div>
          </div>

          {/* Kitchen Staff Dedicated Link */}
          <div className="mb-6 p-3 rounded-2xl bg-slate-900 text-white flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-base">👨‍🍳</span>
              <div>
                <div className="font-bold">Canteen Staff & Chefs</div>
                <div className="text-[10px] text-slate-400">Manage KOT, stations & menu</div>
              </div>
            </div>
            <Link
              to="/kitchen-login"
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-lg text-xs transition-colors"
            >
              Staff Portal →
            </Link>
          </div>

          {/* Form Tabs */}
          <div className="flex border-b border-slate-200 mb-6">
            <button
              onClick={() => { setIsRegister(false); setError(''); }}
              className={`pb-3 font-bold text-sm flex-1 text-center transition-all ${
                !isRegister ? 'border-b-2 border-flame-600 text-flame-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Institutional Login
            </button>
            <button
              onClick={() => { setIsRegister(true); setError(''); }}
              className={`pb-3 font-bold text-sm flex-1 text-center transition-all ${
                isRegister ? 'border-b-2 border-flame-600 text-flame-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              New Student Onboarding
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Institutional Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="roll_no@campusbite.edu"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-flame-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-flame-500 focus:border-transparent"
              />
            </div>

            {isRegister && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Aarav Patel"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-flame-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Roll Number
                    </label>
                    <input
                      type="text"
                      required
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      placeholder="2022CS8942"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-flame-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Hostel Block
                    </label>
                    <input
                      type="text"
                      value={hostelBlock}
                      onChange={(e) => setHostelBlock(e.target.value)}
                      placeholder="Hostel Block 4"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-flame-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Room No.
                    </label>
                    <input
                      type="text"
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      placeholder="302"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-flame-500"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-3 bg-flame-600 hover:bg-flame-700 text-white rounded-xl font-bold text-sm shadow-md shadow-flame-600/30 hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {submitting ? 'Connecting...' : (isRegister ? 'Complete Onboarding (+ ₹100 Bonus)' : 'Sign In to CampusBite')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

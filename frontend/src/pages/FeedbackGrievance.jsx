import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Star,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  ShieldCheck,
  Upload,
  ArrowRight,
  MessageSquare
} from 'lucide-react';

export default function FeedbackGrievance() {
  const [searchParams] = useSearchParams();
  const tokenQuery = searchParams.get('token') || '#TOKEN-412';
  const { user, refreshWallet } = useAuth();

  const [activeTab, setActiveTab] = useState('feedback'); // 'feedback' | 'grievance'

  // Feedback State
  const [tasteRating, setTasteRating] = useState(5);
  const [speedRating, setSpeedRating] = useState(4);
  const [hygieneRating, setHygieneRating] = useState(5);
  const [courtesyRating, setCourtesyRating] = useState(5);
  const [dietaryHonored, setDietaryHonored] = useState(true);
  const [chefComment, setChefComment] = useState('Paneer gravy was rich, warm rotis served on time!');
  const [photoAttached, setPhotoAttached] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState('');

  // Grievance Desk State
  const [issueType, setIssueType] = useState('COLD_FOOD');
  const [issueDesc, setIssueDesc] = useState('');
  const [submittingGrievance, setSubmittingGrievance] = useState(false);
  const [grievanceResult, setGrievanceResult] = useState(null);
  const [myGrievances, setMyGrievances] = useState([]);

  useEffect(() => {
    // Check if feedback already submitted
    axios.get(`/api/feedback/orders/${encodeURIComponent(tokenQuery)}/feedback`).then((res) => {
      if (res.data.success && res.data.feedback) {
        const fb = res.data.feedback;
        setTasteRating(fb.taste_rating);
        setSpeedRating(fb.speed_rating);
        setHygieneRating(fb.hygiene_rating);
        setCourtesyRating(fb.courtesy_rating);
        setDietaryHonored(Boolean(fb.dietary_honored));
        setChefComment(fb.comment || '');
      }
    }).catch(() => {});

    // Fetch student's past grievances
    axios.get('/api/feedback/grievances/my').then((res) => {
      if (res.data.success) {
        setMyGrievances(res.data.grievances || []);
      }
    }).catch(() => {});
  }, [tokenQuery]);

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    setSubmittingFeedback(true);
    try {
      const res = await axios.post(`/api/feedback/orders/${encodeURIComponent(tokenQuery)}/feedback`, {
        taste_rating: tasteRating,
        speed_rating: speedRating,
        hygiene_rating: hygieneRating,
        courtesy_rating: courtesyRating,
        dietary_honored: dietaryHonored,
        comment: chefComment,
        photo_attached: photoAttached
      });

      if (res.data.success) {
        setFeedbackSuccess(res.data.message);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleRegisterGrievance = async (e) => {
    e.preventDefault();
    setSubmittingGrievance(true);
    try {
      const res = await axios.post('/api/feedback/grievances/create', {
        order_token: tokenQuery,
        issue_type: issueType,
        description: issueDesc
      });

      if (res.data.success) {
        setGrievanceResult(res.data);
        await refreshWallet();
        // Refresh grievance list
        const gRes = await axios.get('/api/feedback/grievances/my');
        if (gRes.data.success) setMyGrievances(gRes.data.grievances || []);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to register grievance');
    } finally {
      setSubmittingGrievance(false);
    }
  };

  // Helper Star Rating Component
  const StarRatingPicker = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 text-xs">
      <span className="font-bold text-slate-700">{label}</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-1 text-slate-300 hover:text-amber-400 focus:outline-none transition-colors"
          >
            <Star
              className={`w-5 h-5 ${
                star <= value ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Dining Experience & Dispute Desk
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight font-sans">
            Feedback & 15-Min Grievance SLA
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Order Reference: <strong className="font-mono text-slate-800">{tokenQuery}</strong>
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-200/80 p-1 rounded-2xl flex text-xs font-extrabold w-fit">
          <button
            onClick={() => setActiveTab('feedback')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'feedback'
                ? 'bg-white shadow text-flame-600 font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            4-Star Rubric (+25★)
          </button>
          <button
            onClick={() => setActiveTab('grievance')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'grievance'
                ? 'bg-white shadow text-rose-600 font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            15-Min Refund Desk
          </button>
        </div>
      </div>

      {/* Tab 1: 4-Star Feedback Evaluation */}
      {activeTab === 'feedback' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
          {feedbackSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{feedbackSuccess}</span>
            </div>
          )}

          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-900">Post-Pickup Quality Evaluation</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Your ratings train Chef Vikram's station staff and reward you with Campus Karma.
              </p>
            </div>
            <div className="text-center px-3 py-1.5 rounded-2xl bg-amber-50 border border-amber-200">
              <div className="text-[10px] font-bold text-amber-800">REWARD</div>
              <div className="text-sm font-black text-amber-600">+25 Karma</div>
            </div>
          </div>

          <form onSubmit={handleSubmitFeedback} className="space-y-4">
            <StarRatingPicker label="Taste & Flavor Profile" value={tasteRating} onChange={setTasteRating} />
            <StarRatingPicker label="Preparation & Counter Speed" value={speedRating} onChange={setSpeedRating} />
            <StarRatingPicker label="Hygiene, Packaging & Cleanliness" value={hygieneRating} onChange={setHygieneRating} />
            <StarRatingPicker label="Staff Courtesy & Service" value={courtesyRating} onChange={setCourtesyRating} />

            {/* Pure Veg / Jain Compliance Checklist */}
            <div className="py-3 border-b border-slate-100 flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-slate-700">Pure Veg & Dietary Preference Honored?</div>
                <div className="text-[11px] text-slate-400">Strict vegetarian and Jain segregation protocol</div>
              </div>
              <input
                type="checkbox"
                checked={dietaryHonored}
                onChange={(e) => setDietaryHonored(e.target.checked)}
                className="w-5 h-5 text-emerald-600 accent-emerald-600 rounded cursor-pointer"
              />
            </div>

            {/* Chef Shoutout Comment */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Chef Shoutout & Notes
              </label>
              <textarea
                rows={3}
                value={chefComment}
                onChange={(e) => setChefComment(e.target.value)}
                placeholder="Give feedback on crispiness, salt, packaging quality..."
                className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-flame-500 focus:outline-none"
              />
            </div>

            {/* Photo Upload Simulation */}
            <div className="p-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Upload className="w-5 h-5 text-slate-400" />
                <div>
                  <div className="text-xs font-bold text-slate-700">Attach Tray Photo (Bonus +10 Karma)</div>
                  <div className="text-[10px] text-slate-400">Verified photo proof of served dish</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPhotoAttached(!photoAttached)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                  photoAttached
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                {photoAttached ? '✓ Photo Attached' : 'Attach Photo'}
              </button>
            </div>

            <button
              type="submit"
              disabled={submittingFeedback}
              className="w-full py-3.5 bg-flame-600 hover:bg-flame-700 text-white font-extrabold text-sm rounded-2xl shadow-md shadow-flame-600/30 transition-all flex items-center justify-center gap-2"
            >
              {submittingFeedback ? 'Submitting Ratings...' : 'Submit Review & Claim +25 Karma'}
              <Sparkles className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: 1-Click Grievance & Instant Refund Desk */}
      {activeTab === 'grievance' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  15-Minute University Dining Guarantee
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated instant credit to Campus Wallet if food is cold, items missing, or delay exceeds SLA.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] uppercase">
                Zero Human Delay
              </span>
            </div>

            {grievanceResult && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold space-y-1 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span>{grievanceResult.message}</span>
                </div>
                <div className="text-emerald-700 pl-7">
                  Refund Credited: <strong>₹{grievanceResult.refundAmount.toFixed(2)}</strong> • New Balance: <strong>₹{grievanceResult.newWalletBalance.toFixed(2)}</strong>
                </div>
              </div>
            )}

            <form onSubmit={handleRegisterGrievance} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Nature of Dispute / Grievance
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: 'COLD_FOOD', label: 'Cold / Lukewarm' },
                    { key: 'MISSING_ITEM', label: 'Missing Dish/Item' },
                    { key: 'EXCESSIVE_DELAY', label: 'Excess Delay (>15m)' },
                    { key: 'BILLING_ERROR', label: 'Billing Dispute' }
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setIssueType(item.key)}
                      className={`p-3 rounded-2xl border text-xs font-bold text-center transition-all ${
                        issueType === item.key
                          ? 'border-rose-600 bg-rose-50 text-rose-800 ring-1 ring-rose-600'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Issue Description
                </label>
                <textarea
                  rows={3}
                  required
                  value={issueDesc}
                  onChange={(e) => setIssueDesc(e.target.value)}
                  placeholder="Describe what occurred (e.g. Samosa was cold, gulab jamun was missing from thali)..."
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                <strong>Statutory SLA Guarantee:</strong> Under university canteen policy, complaints logged within 24 hours receive 50% to 100% automated instantaneous refund back to the student's digital wallet without manager approval.
              </div>

              <button
                type="submit"
                disabled={submittingGrievance}
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm rounded-2xl shadow-md shadow-rose-600/30 transition-all flex items-center justify-center gap-2"
              >
                {submittingGrievance ? 'Processing SLA Refund...' : 'Claim 15-Min Automated Refund Guarantee'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Past Grievances History */}
          {myGrievances.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Your Grievance Desk Tickets</h3>
              <div className="divide-y divide-slate-100 text-xs">
                {myGrievances.map((g) => (
                  <div key={g.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800">{g.issue_type} ({g.order_token})</div>
                      <div className="text-slate-500 text-[11px]">{g.description}</div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                        {g.status} (+₹{Number(g.refund_amount).toFixed(2)})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

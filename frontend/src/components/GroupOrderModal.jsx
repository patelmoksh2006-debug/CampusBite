import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Users,
  X,
  Share2,
  Copy,
  CheckCircle2,
  Plus,
  ShoppingBag,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function GroupOrderModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('view'); // 'view' | 'join' | 'create'
  const [roomCode, setRoomCode] = useState('HOSTEL-402');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [groupData, setGroupData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchGroup = (code) => {
    setLoading(true);
    axios.get(`/api/group/${code}`).then((res) => {
      if (res.data.success) {
        setGroupData(res.data.group);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen && roomCode) {
      fetchGroup(roomCode);
    }
  }, [isOpen, roomCode]);

  const handleCreateRoom = async () => {
    try {
      const res = await axios.post('/api/group/create', {
        hostName: user?.full_name || 'Aarav Patel',
        hostelBlock: 'Hostel Block 4'
      });
      if (res.data.success) {
        setRoomCode(res.data.group.code);
        setGroupData(res.data.group);
        setMode('view');
      }
    } catch (err) {
      alert('Failed to create room');
    }
  };

  const handleJoinRoom = async () => {
    if (!joinCodeInput.trim()) return;
    try {
      const res = await axios.post('/api/group/join', {
        code: joinCodeInput,
        memberName: user?.full_name || 'Student'
      });
      if (res.data.success) {
        setRoomCode(joinCodeInput.toUpperCase());
        setGroupData(res.data.group);
        setMode('view');
      }
    } catch (err) {
      alert('Room not found');
    }
  };

  const copyInvite = () => {
    navigator.clipboard.writeText(`Join my CampusBite hostel canteen group order! Room Code: ${roomCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg font-sans">
                Hostel Group Ordering
              </h3>
              <p className="text-[11px] text-slate-500">
                Combine orders with roommates into one single pickup pass.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Room Code Badge */}
        {mode === 'view' && groupData && (
          <div className="my-5 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-700">
                Active Group Room
              </span>
              <div className="font-mono text-xl font-black text-indigo-950">
                {groupData.code}
              </div>
              <div className="text-xs text-indigo-800 mt-0.5">
                Host: {groupData.hostName}
              </div>
            </div>

            <button
              onClick={copyInvite}
              className="px-3 py-2 bg-white text-indigo-700 border border-indigo-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs hover:bg-indigo-50"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Link!' : 'Invite Roommates'}</span>
            </button>
          </div>
        )}

        {/* Mode Navigation */}
        {mode === 'view' ? (
          <div className="space-y-4">
            {/* Members Pill List */}
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Room Members ({groupData?.members?.length || 1})
              </span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {groupData?.members?.map((m, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-bold"
                  >
                    👤 {m}
                  </span>
                ))}
              </div>
            </div>

            {/* Shared Tray Items */}
            <div className="pt-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Shared Group Tray Items ({groupData?.items?.length || 0})
              </span>

              <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto mt-2 text-xs">
                {groupData?.items?.length === 0 ? (
                  <div className="py-6 text-center text-slate-400">
                    No items in group tray yet. Pick from the menu!
                  </div>
                ) : (
                  groupData?.items?.map((it, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900">{it.quantity}× {it.name}</div>
                        <div className="text-[10px] text-indigo-600 font-medium">Added by {it.addedBy}</div>
                      </div>
                      <div className="font-mono font-bold text-slate-900">
                        ₹{(it.price * it.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Total */}
            <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-600">Combined Group Subtotal:</span>
              <span className="text-xl font-mono font-black text-slate-900">
                ₹{groupData?.subtotalAmount?.toFixed(2) || '0.00'}
              </span>
            </div>

            <div className="flex items-center gap-2.5 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setMode('join')}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Join Room
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/checkout');
                }}
                className="flex-1 py-2.5 bg-flame-600 hover:bg-flame-700 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Checkout Tray</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Enter Room Code
              </label>
              <input
                type="text"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value)}
                placeholder="E.g. HOSTEL-402"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-sm uppercase focus:ring-2 focus:ring-flame-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setMode('view')}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Back to Tray
              </button>
              <button
                type="button"
                onClick={handleJoinRoom}
                className="flex-1 py-2.5 bg-flame-600 hover:bg-flame-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Join Room
              </button>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleCreateRoom}
                className="text-xs font-bold text-flame-600 hover:underline"
              >
                + Or Create a New Group Order Room
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

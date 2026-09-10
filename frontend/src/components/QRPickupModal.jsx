import React, { useState } from 'react';
import axios from 'axios';
import { QRCode } from './BarcodeQR';
import { QrCode, X, CheckCircle2, ShieldCheck, Sparkles, Scan, ArrowRight } from 'lucide-react';

export default function QRPickupModal({ order, isOpen, onClose, onOrderVerified }) {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedSuccess, setScannedSuccess] = useState(false);

  if (!isOpen || !order) return null;

  const handleSimulateScan = async () => {
    setIsScanning(true);
    setTimeout(async () => {
      try {
        // Call status update if order is not completed
        if (order.id) {
          await axios.patch(`/api/kitchen/orders/${order.id}/status`, { status: 'COMPLETED' });
        }
        setScannedSuccess(true);
        if (onOrderVerified) onOrderVerified();
      } catch (err) {
        console.warn('Scan simulation update error:', err.message);
        setScannedSuccess(true);
      } finally {
        setIsScanning(false);
      }
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 max-w-sm w-full p-6 shadow-2xl animate-in zoom-in-95 text-center relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-flame-100 text-flame-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
          <QrCode className="w-6 h-6" />
        </div>

        <h3 className="text-xl font-black text-slate-900 font-sans">
          Express QR Pickup Pass
        </h3>
        <p className="text-xs text-slate-500 mt-0.5 mb-5">
          Present this QR code at Counter 2 scanner for contactless tray pickup.
        </p>

        {/* QR Code Canvas */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block shadow-inner mb-4 relative">
          <QRCode value={order.order_token || '#TOKEN-412'} size={180} />
          {scannedSuccess && (
            <div className="absolute inset-0 bg-emerald-600/90 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center text-white p-4 animate-in fade-in">
              <CheckCircle2 className="w-12 h-12 mb-1 animate-bounce" />
              <div className="font-black text-sm uppercase tracking-wider">VERIFIED & COLLECTED</div>
              <div className="text-[11px] opacity-90">PIN Confirmed by Chef Vikram</div>
            </div>
          )}
        </div>

        {/* Token and Security PIN */}
        <div className="bg-slate-900 text-white rounded-2xl p-3.5 mb-4 space-y-1">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Order Token</span>
            <span className="font-mono font-black text-amber-400 text-sm">{order.order_token}</span>
          </div>
          <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-800">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Security PIN</span>
            <span className="font-mono font-black text-white text-lg tracking-widest">{order.security_pin || '8841'}</span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
            <span>Counter Assigned</span>
            <span className="text-slate-200 font-bold">{order.counter_assigned || 'Counter 2 (Express Food)'}</span>
          </div>
        </div>

        {/* Staff Scanner Simulator Button */}
        {!scannedSuccess ? (
          <button
            onClick={handleSimulateScan}
            disabled={isScanning}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md hover:scale-[1.02]"
          >
            <Scan className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning QR Pass...' : '📱 Simulate Counter Staff Scan'}</span>
          </button>
        ) : (
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all"
          >
            Close Pickup Pass
          </button>
        )}
      </div>
    </div>
  );
}

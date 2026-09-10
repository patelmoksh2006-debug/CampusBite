import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Barcode, QRCode } from '../components/BarcodeQR';
import {
  Printer,
  ShieldCheck,
  Award,
  ArrowLeft,
  FileCheck2,
  Calendar,
  CreditCard,
  Building2,
  Receipt
} from 'lucide-react';

export default function Invoice() {
  const [searchParams] = useSearchParams();
  const tokenQuery = searchParams.get('token') || '#TOKEN-412';

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/orders/${encodeURIComponent(tokenQuery)}/invoice`).then((res) => {
      if (res.data.success) {
        setInvoice(res.data.invoice);
      }
    }).catch((err) => {
      console.warn('Invoice fetch failed:', err.message);
    }).finally(() => {
      setLoading(false);
    });
  }, [tokenQuery]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen py-20 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-flame-600 border-t-transparent"></div>
        <p className="mt-2 text-xs text-slate-500 font-medium">Generating statutory tax invoice...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen py-20 text-center">
        <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-2" />
        <h3 className="text-base font-bold text-slate-800">Invoice not found for {tokenQuery}</h3>
        <Link to="/menu" className="mt-4 inline-block text-xs font-bold text-flame-600 underline">
          Return to Menu
        </Link>
      </div>
    );
  }

  const { statutoryHeader, customer, orderMetadata, lineItems, taxComputation, paymentDetails } = invoice;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Non-printable action bar */}
      <div className="no-print flex items-center justify-between mb-6">
        <Link
          to={`/tracking?token=${encodeURIComponent(tokenQuery)}`}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Order Tracking
        </Link>

        <button
          onClick={handlePrint}
          className="px-5 py-2.5 bg-flame-600 hover:bg-flame-700 text-white rounded-xl text-xs font-bold shadow-md shadow-flame-600/30 flex items-center gap-2 transition-transform hover:scale-[1.02]"
        >
          <Printer className="w-4 h-4" />
          Print / Save PDF Bill
        </button>
      </div>

      {/* Official Tax Invoice Document */}
      <div className="printable-invoice bg-white rounded-3xl border border-slate-300 shadow-xl p-8 sm:p-10 font-sans text-slate-800">
        {/* Statutory Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-6 border-b-2 border-slate-900 gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase text-flame-600 tracking-wider">
              <Building2 className="w-4 h-4" />
              <span>University Dining Services</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              {statutoryHeader.canteenName}
            </h1>
            <p className="text-xs text-slate-500 font-medium max-w-md mt-0.5">
              {statutoryHeader.institution}
            </p>
            <div className="mt-2 text-[11px] text-slate-600 space-y-0.5 font-mono">
              <div><strong>GSTIN:</strong> {statutoryHeader.gstin}</div>
              <div><strong>FSSAI Lic No:</strong> {statutoryHeader.fssaiLic} (Grade A+)</div>
              <div className="text-[10px] text-slate-400">{statutoryHeader.actReference}</div>
            </div>
          </div>

          <div className="text-right sm:text-right">
            <div className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-extrabold rounded-lg uppercase tracking-wider mb-2">
              TAX INVOICE
            </div>
            <div className="font-mono text-xs font-bold text-slate-900">
              Invoice #{invoice.invoiceNumber}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {invoice.invoiceDate}
            </div>
            <div className="text-xs font-mono font-bold text-flame-600 mt-1">
              Token: {orderMetadata.orderToken}
            </div>
          </div>
        </div>

        {/* Billed To / Student Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-200 text-xs">
          <div>
            <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">
              Billed To (Student Profile)
            </div>
            <div className="font-black text-slate-900 text-sm">{customer.name}</div>
            <div className="text-slate-600 font-mono mt-0.5">Roll No: {customer.rollNumber}</div>
            <div className="text-slate-600">{customer.department}</div>
            <div className="text-slate-500">{customer.hostel}</div>
          </div>

          <div className="sm:text-right">
            <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">
              Counter Pickup Verification
            </div>
            <div className="font-mono text-sm font-black text-slate-900">
              Station: {orderMetadata.counterAssigned}
            </div>
            <div className="text-slate-600 font-mono mt-0.5">
              Pickup Security PIN: <strong className="text-amber-700 font-black">{orderMetadata.securityPin}</strong>
            </div>
            <div className="text-emerald-700 font-bold mt-1 flex items-center sm:justify-end gap-1">
              <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
              Settled via Campus Wallet
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="py-6">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 border-slate-200 text-slate-500 text-left font-bold uppercase text-[10px] tracking-wider">
                <th className="py-2">Item Description</th>
                <th className="py-2 text-center">HSN/SAC</th>
                <th className="py-2 text-center">Qty</th>
                <th className="py-2 text-right">Rate</th>
                <th className="py-2 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lineItems.map((item, idx) => (
                <tr key={idx} className="py-2 font-medium">
                  <td className="py-2.5 font-bold text-slate-900">
                    {item.name}
                    <span className="block text-[10px] text-slate-400 font-normal">Kitchen Prep: {item.station}</span>
                  </td>
                  <td className="py-2.5 text-center font-mono text-slate-500">{item.hsnSac}</td>
                  <td className="py-2.5 text-center font-bold">{item.quantity}</td>
                  <td className="py-2.5 text-right font-mono">₹{item.unitPrice}</td>
                  <td className="py-2.5 text-right font-mono font-bold text-slate-900">₹{item.subtotal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Itemized Statutory Calculations */}
        <div className="border-t-2 border-slate-200 pt-4 flex flex-col sm:flex-row justify-between gap-6 text-xs">
          {/* Barcode & QR Stamp for Counter Scanner */}
          <div className="sm:w-1/2 flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <QRCode value={`CAMPUSBITE:${orderMetadata.orderToken}:${orderMetadata.securityPin}`} size={80} />
            <div className="flex-1">
              <div className="font-extrabold text-slate-900 text-xs">Express Counter Pass</div>
              <div className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                Scan at counter scanner or verify with PIN <strong className="font-mono">{orderMetadata.securityPin}</strong>.
              </div>
              <div className="mt-2">
                <Barcode value={orderMetadata.orderToken} width={150} height={35} />
              </div>
            </div>
          </div>

          {/* Financials Breakdown */}
          <div className="sm:w-1/2 space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>Item Subtotal</span>
              <span className="font-mono font-bold text-slate-900">₹{taxComputation.subtotalAmount}</span>
            </div>

            {Number(taxComputation.hack50Discount) > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>HACK50 Promo Discount</span>
                <span className="font-mono">- ₹{taxComputation.hack50Discount}</span>
              </div>
            )}

            {Number(taxComputation.welfareSubsidy) > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Univ Student Welfare Subsidy</span>
                <span className="font-mono">- ₹{taxComputation.welfareSubsidy}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-500 pt-1 border-t border-slate-100">
              <span>CGST @ {taxComputation.cgstRate} (Sec 31)</span>
              <span className="font-mono">+ ₹{taxComputation.cgstAmount}</span>
            </div>

            <div className="flex justify-between text-slate-500">
              <span>SGST @ {taxComputation.sgstRate} (Sec 31)</span>
              <span className="font-mono">+ ₹{taxComputation.sgstAmount}</span>
            </div>

            <div className="flex justify-between text-slate-500">
              <span>Eco-Bio Packaging Charge</span>
              <span className="font-mono">+ ₹{taxComputation.packagingFee}</span>
            </div>

            <div className="pt-3 border-t-2 border-slate-900 flex justify-between items-center text-sm font-black">
              <span>Grand Total</span>
              <span className="text-xl text-flame-600 font-mono">₹{taxComputation.grandTotal}</span>
            </div>
          </div>
        </div>

        {/* Audit & Wallet Settlement Footer */}
        <div className="mt-8 pt-4 border-t border-slate-200 text-[11px] text-slate-500 flex flex-col sm:flex-row justify-between gap-2">
          <div>
            <span>Paid via: <strong>{paymentDetails.method}</strong></span>
            <span className="mx-2">•</span>
            <span>Txn Ref: <strong className="font-mono">{paymentDetails.transactionRef}</strong></span>
            <span className="mx-2">•</span>
            <span>Wallet Txn ID: <strong className="font-mono">{paymentDetails.walletTxnId}</strong></span>
          </div>
          <div className="font-bold text-slate-700">
            Remaining Campus Wallet Balance: <span className="text-emerald-600 font-mono">₹{paymentDetails.remainingWalletBalance}</span>
          </div>
        </div>

        {/* Statutory Disclaimer */}
        <div className="mt-4 pt-4 border-t border-slate-100 text-[10px] text-slate-400 text-center">
          This is a computer generated invoice authorized under Section 31 of CGST Act, 2017. Registered FSSAI Central License #1001902200987. No physical signature required.
        </div>
      </div>
    </div>
  );
}

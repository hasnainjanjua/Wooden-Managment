import React, { useRef } from 'react';
import { X, Printer, CheckCircle2 } from 'lucide-react';
import { useWorkshopStore } from '../../store/useWorkshopStore';
import { formatPKR, formatDate } from '../../utils/currency';

export const PrintInvoiceModal: React.FC = () => {
  const printInvoiceData = useWorkshopStore((state) => state.printInvoiceData);
  const setPrintInvoiceData = useWorkshopStore((state) => state.setPrintInvoiceData);
  const shopSettings = useWorkshopStore((state) => state.shopSettings);
  const printRef = useRef<HTMLDivElement>(null);

  if (!printInvoiceData) return null;

  const { invoice, items } = printInvoiceData;

  const handlePrint = () => {
    window.print();
  };

  const handleClose = () => {
    setPrintInvoiceData(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-100 border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden my-auto">
        {/* Top Control Bar (Hidden during print) */}
        <div className="no-print bg-slate-50 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-700 font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Bill Mehfooz Ho Gaya (Sale Saved)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-sm flex items-center gap-1.5 shadow-sm transition active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print (80mm / A4)</span>
            </button>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* The Printable Slip (Optimized for 80mm POS Thermal Slip and A4) */}
        <div className="p-6 bg-white text-black font-mono text-sm max-w-sm mx-auto my-4 shadow-lg rounded-sm" id="printable-area">
          {/* Header */}
          <div className="text-center border-b-2 border-dashed border-gray-400 pb-3 mb-3">
            <h2 className="text-base font-extrabold tracking-tight uppercase">{shopSettings.shop_name}</h2>
            <p className="text-xs font-serif font-bold text-gray-800 mt-0.5 font-urdu">{shopSettings.urdu_title}</p>
            <p className="text-[11px] text-gray-700 mt-1">{shopSettings.tagline}</p>
            <p className="text-[11px] text-gray-800 font-bold">Ph: {shopSettings.phone1} {shopSettings.phone2 ? `/ ${shopSettings.phone2}` : ''}</p>
            <p className="text-[10px] text-gray-600">{shopSettings.address}</p>
          </div>

          {/* Invoice Info */}
          <div className="text-xs space-y-1 mb-3 border-b border-dashed border-gray-300 pb-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Bill No:</span>
              <span className="font-bold">{invoice.invoice_no}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tareekh (Date):</span>
              <span>{formatDate(invoice.invoice_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Customer:</span>
              <span className="font-bold">{invoice.customer_name || 'Walk-in Cash Customer'}</span>
            </div>
            {invoice.customer_phone && (
              <div className="flex justify-between">
                <span className="text-gray-600">Phone:</span>
                <span>{invoice.customer_phone}</span>
              </div>
            )}
          </div>

          {/* Item Table */}
          <table className="w-full text-xs mb-3">
            <thead>
              <tr className="border-b-2 border-gray-900 text-left">
                <th className="py-1">Item</th>
                <th className="py-1 text-center">Qty</th>
                <th className="py-1 text-right">Rate</th>
                <th className="py-1 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-1 font-sans pr-1">
                    <div className="font-bold text-black">{item.item_name}</div>
                  </td>
                  <td className="py-1 text-center">{item.quantity}</td>
                  <td className="py-1 text-right">{item.rate.toLocaleString()}</td>
                  <td className="py-1 text-right font-bold">{item.line_total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Calculation */}
          <div className="border-t-2 border-dashed border-gray-400 pt-2 space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>Rs. {invoice.total_amount.toLocaleString()}</span>
            </div>
            {invoice.discount_amount > 0 && (
              <div className="flex justify-between text-gray-700">
                <span>Riait (Discount):</span>
                <span>- Rs. {invoice.discount_amount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm border-t border-gray-400 pt-1">
              <span>Kul Bill (Net):</span>
              <span>Rs. {(invoice.total_amount - invoice.discount_amount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-emerald-800">
              <span>Naqad Wasool (Paid):</span>
              <span>Rs. {invoice.cash_received.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-extrabold text-sm border-t-2 border-gray-900 pt-1">
              <span>Baqaya Rakam (Balance):</span>
              <span className={invoice.balance_amount > 0 ? 'text-rose-700' : 'text-gray-900'}>
                Rs. {invoice.balance_amount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center border-t border-dashed border-gray-300 mt-4 pt-3 text-[10px] text-gray-600">
            <p className="font-bold text-gray-800 font-urdu">{shopSettings.receipt_footer}</p>
            <p className="mt-0.5">Software by Antigravity Local-First POS</p>
            <p className="font-bold mt-1">Shukriya / تشکر</p>
          </div>
        </div>

        {/* Bottom Actions (Hidden during print) */}
        <div className="no-print bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-sm transition flex items-center gap-1.5 active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print 80mm Slip</span>
          </button>
        </div>
      </div>
    </div>
  );
};

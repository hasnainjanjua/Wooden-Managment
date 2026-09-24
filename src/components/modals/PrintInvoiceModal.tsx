import React, { useState } from 'react';
import { X, Printer, CheckCircle2, Receipt, FileText } from 'lucide-react';
import { useWorkshopStore } from '../../store/useWorkshopStore';
import { formatPKR, formatDate } from '../../utils/currency';

export const PrintInvoiceModal: React.FC = () => {
  const printInvoiceData = useWorkshopStore((state) => state.printInvoiceData);
  const setPrintInvoiceData = useWorkshopStore((state) => state.setPrintInvoiceData);
  const shopSettings = useWorkshopStore((state) => state.shopSettings);

  const [paperFormat, setPaperFormat] = useState<'80mm' | 'a4'>('80mm');

  if (!printInvoiceData) return null;

  const { invoice, items } = printInvoiceData;

  const handlePrint = () => {
    window.print();
  };

  const handleClose = () => {
    setPrintInvoiceData(null);
  };

  const isFullyPaid = (invoice.balance_amount || 0) <= 0;
  const isPartial = (invoice.cash_received || 0) > 0 && (invoice.balance_amount || 0) > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto print:static print:inset-auto print:p-0 print:m-0 print:bg-white print:overflow-visible print:block">
      <div
        className={`bg-slate-100 border border-slate-200 rounded-2xl shadow-2xl w-full ${
          paperFormat === 'a4' ? 'max-w-4xl' : 'max-w-lg'
        } overflow-hidden my-auto print:border-none print:shadow-none print:bg-white print:w-full print:max-w-none print:m-0 print:p-0 print:rounded-none transition-all duration-200`}
      >
        {/* Top Control Bar (Hidden during print) */}
        <div className="no-print bg-slate-50 px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Bill Mehfooz Ho Gaya (Sale Saved)</span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Format Switcher */}
            <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg border border-slate-300 text-xs font-bold">
              <button
                type="button"
                onClick={() => setPaperFormat('80mm')}
                className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${
                  paperFormat === '80mm'
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>80mm Thermal</span>
              </button>
              <button
                type="button"
                onClick={() => setPaperFormat('a4')}
                className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${
                  paperFormat === 'a4'
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>A4 Full Page</span>
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-sm flex items-center gap-1.5 shadow-sm transition active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print ({paperFormat === '80mm' ? '80mm Slip' : 'A4 Invoice'})</span>
            </button>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Printable Area: 80mm Thermal Slip OR A4 Full Invoice                      */}
        {/* ========================================================================= */}
        <div id="printable-area" className="w-full bg-white print:m-0 print:p-0">
          {paperFormat === '80mm' ? (
            /* ----------------------------------------------------------------------- */
            /* 80mm POS Thermal Slip                                                  */
            /* ----------------------------------------------------------------------- */
            <div className="p-6 bg-white text-black font-mono text-xs max-w-[80mm] w-full mx-auto my-4 shadow-lg rounded-sm border border-gray-200 print:border-none print:shadow-none print:my-0 print:mx-auto print:p-3">
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
                {shopSettings.phone1 && (
                  <p className="mt-0.5 text-gray-500">Helpline: {shopSettings.phone1}</p>
                )}
                <p className="font-bold mt-1">Shukriya / تشکر</p>
              </div>
            </div>
          ) : (
            /* ----------------------------------------------------------------------- */
            /* A4 Full Page Invoice Layout                                            */
            /* ----------------------------------------------------------------------- */
            <div className="p-8 bg-white text-slate-900 font-sans text-xs max-w-3xl w-full mx-auto my-4 shadow-lg rounded-xl border border-slate-200 print:border-none print:shadow-none print:my-0 print:mx-auto print:p-6 print:max-w-none">
              {/* Top Business Letterhead */}
              <div className="flex justify-between items-start border-b-2 border-slate-800 pb-5 mb-5">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                    {shopSettings.shop_name}
                  </h1>
                  <p className="text-base font-serif font-bold text-amber-800 mt-0.5 font-urdu">
                    {shopSettings.urdu_title}
                  </p>
                  <p className="text-xs text-slate-600 mt-1 font-medium">{shopSettings.tagline}</p>
                  <div className="text-xs text-slate-600 mt-2 space-y-0.5">
                    <p>📍 {shopSettings.address}</p>
                    <p>📞 Phone: {shopSettings.phone1} {shopSettings.phone2 ? `| ${shopSettings.phone2}` : ''}</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="inline-block bg-slate-900 text-white font-extrabold text-sm uppercase px-4 py-1.5 rounded-lg tracking-wider mb-2">
                    SALE INVOICE / بل
                  </div>
                  <div className="text-xs space-y-1">
                    <div>
                      <span className="text-slate-500">Invoice No: </span>
                      <strong className="font-mono text-sm text-slate-900">{invoice.invoice_no}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Date: </span>
                      <span className="font-semibold">{formatDate(invoice.invoice_date)}</span>
                    </div>
                    <div>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase mt-1 border ${
                          isFullyPaid
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : isPartial
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-rose-50 text-rose-700 border-rose-300'
                        }`}
                      >
                        {isFullyPaid ? 'Wasool Shuda (PAID)' : isPartial ? 'Juzwi Wasool (PARTIAL)' : 'Udhaar (CREDIT)'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Info Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Billed To / Mohtaram Customer (گاہک کا نام)
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      {invoice.customer_name || 'Walk-in Cash Customer'}
                    </h3>
                    {invoice.customer_phone && (
                      <p className="text-xs text-slate-600 font-mono mt-0.5">📞 {invoice.customer_phone}</p>
                    )}
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <p>Khata Type: <strong className="text-slate-800">{invoice.customer_id ? 'Registered Account' : 'Counter Sale'}</strong></p>
                    <p className="mt-0.5">Invoice Type: <strong className="text-slate-800">Direct Retail & Woodwork</strong></p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full border-collapse mb-6">
                <thead>
                  <tr className="bg-slate-800 text-white text-[11px] uppercase tracking-wider text-left">
                    <th className="py-2.5 px-3 rounded-l-lg w-12 text-center">#</th>
                    <th className="py-2.5 px-3">Tafseel Maal (Item Description)</th>
                    <th className="py-2.5 px-3 text-center w-20">Tadad (Qty)</th>
                    <th className="py-2.5 px-3 text-right w-28">Rate (PKR)</th>
                    <th className="py-2.5 px-3 text-right rounded-r-lg w-32">Total (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {items.map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                      <td className="py-2 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900">{item.item_name}</td>
                      <td className="py-2 px-3 text-center font-bold text-slate-800">{item.quantity}</td>
                      <td className="py-2 px-3 text-right font-mono">{formatPKR(item.rate)}</td>
                      <td className="py-2 px-3 text-right font-bold font-mono text-slate-950">
                        {formatPKR(item.line_total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Bottom Summary Section */}
              <div className="grid grid-cols-2 gap-6 items-start pt-2 border-t-2 border-slate-200 mb-8">
                {/* Terms and Shop Policy */}
                <div className="space-y-2">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600">
                    <span className="font-bold text-slate-800 block mb-1">Zaroori Hidayat (Terms & Policy):</span>
                    <p className="font-urdu leading-relaxed font-semibold text-slate-800">
                      {shopSettings.receipt_footer || 'خریدا ہوا مال واپس یا تبدیل نہیں ہوگا۔ مال وصولی کے وقت تسلی فرما لیں۔'}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-500">
                      Payment due on receipt. All goods inspected before delivery.
                    </p>
                  </div>
                </div>

                {/* Totals Table */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Kul Subtotal:</span>
                    <span className="font-mono font-semibold">{formatPKR(invoice.total_amount)}</span>
                  </div>
                  {invoice.discount_amount > 0 && (
                    <div className="flex justify-between text-rose-600 font-semibold">
                      <span>Riait (Discount):</span>
                      <span className="font-mono">- {formatPKR(invoice.discount_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-slate-900 border-t border-slate-300 pt-2">
                    <span>Net Total Payable:</span>
                    <span className="font-mono text-amber-700">
                      {formatPKR(invoice.total_amount - invoice.discount_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-800 font-bold border-t border-dashed border-slate-300 pt-1.5">
                    <span>Naqad Wasool (Paid):</span>
                    <span className="font-mono">{formatPKR(invoice.cash_received)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black border-t-2 border-slate-900 pt-2">
                    <span>Baqaya Rakam (Balance):</span>
                    <span className={`font-mono ${invoice.balance_amount > 0 ? 'text-rose-700 font-black' : 'text-slate-900'}`}>
                      {formatPKR(invoice.balance_amount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-dashed border-slate-300 text-center text-xs font-bold text-slate-700">
                <div>
                  <div className="w-48 mx-auto border-b border-slate-400 pb-1 mb-1"></div>
                  <span>Gāhak Ke Dastakhat (Customer Signature)</span>
                </div>
                <div>
                  <div className="w-48 mx-auto border-b border-slate-400 pb-1 mb-1"></div>
                  <span>Majaz Dastakhat o Muhar (Authorized Stamp)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions Bar (Hidden during print) */}
        <div className="no-print bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium">
            Format: <strong className="text-slate-800">{paperFormat === '80mm' ? '80mm Thermal Receipt' : 'A4 Standard Invoice'}</strong>
          </div>
          <div className="flex items-center gap-2">
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
              <span>Print {paperFormat === '80mm' ? '80mm Slip' : 'A4 Invoice'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

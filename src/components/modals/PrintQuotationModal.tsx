import React from 'react';
import { X, Printer, Share2, Send, CheckCircle, FileText } from 'lucide-react';
import { Quotation } from '../../types';
import { formatPKR, formatDate } from '../../utils/currency';
import { useWorkshopStore } from '../../store/useWorkshopStore';
import { sendWhatsAppMessage } from '../../utils/whatsapp';

interface PrintQuotationModalProps {
  quotation: Quotation | null;
  onClose: () => void;
  onConvert?: (quoteId: number) => void;
}

export const PrintQuotationModal: React.FC<PrintQuotationModalProps> = ({
  quotation,
  onClose,
  onConvert,
}) => {
  const shopSettings = useWorkshopStore((state) => state.shopSettings);

  if (!quotation) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    const lines = [
      `🪵 *${shopSettings.shop_name}*`,
      `📄 *QUOTATION / کچا تخمینہ بل*`,
      `━━━━━━━━━━━━━━━━━━`,
      `Quote No: *#${quotation.quote_no}*`,
      `Date: ${formatDate(quotation.quote_date)}`,
      `Customer: *${quotation.customer_name}*`,
      quotation.customer_phone ? `Phone: ${quotation.customer_phone}` : '',
      `━━━━━━━━━━━━━━━━━━`,
      `*ITEMS DETAIL:*`,
    ];

    (quotation.items || []).forEach((it, idx) => {
      lines.push(`${idx + 1}. ${it.item_name} × ${it.quantity} @ Rs.${it.rate} = *Rs.${it.line_total.toLocaleString()}*`);
    });

    lines.push(`━━━━━━━━━━━━━━━━━━`);
    lines.push(`*Estimated Total: ${formatPKR(quotation.total_amount)}*`);
    if (quotation.discount_amount > 0) {
      lines.push(`Discount: Rs. ${quotation.discount_amount.toLocaleString()}`);
    }
    lines.push(`━━━━━━━━━━━━━━━━━━`);
    lines.push(`_Note: Yeh sirf takhmeena (estimate) hai. Rates 15 din ke liye qabil-e-amal hain._`);
    lines.push(`Shukriya! 📞 ${shopSettings.phone1}`);

    const message = lines.filter(Boolean).join('\n');
    sendWhatsAppMessage(quotation.customer_phone || '', message);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto print:static print:inset-auto print:p-0 print:m-0 print:bg-white print:overflow-visible print:block">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col my-auto border border-slate-200 print:border-none print:shadow-none print:w-full print:max-w-none print:m-0 print:p-0">
        {/* Modal Controls (No Print) */}
        <div className="no-print bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm">Quotation Slip (کچا تخمینہ بل)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print (پرنٹ)</span>
            </button>
            <button
              onClick={handleWhatsApp}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Quotation Content */}
        <div className="p-6 bg-white printable-area text-slate-800">
          {/* Header */}
          <div className="text-center border-b border-slate-200 pb-4 mb-4">
            <h1 className="text-xl font-black text-slate-900 tracking-wide uppercase">
              {shopSettings.shop_name}
            </h1>
            <p className="text-sm font-bold text-amber-700 font-urdu mt-0.5">
              {shopSettings.urdu_title}
            </p>
            <p className="text-xs text-slate-500 mt-1">{shopSettings.address}</p>
            <p className="text-xs font-semibold text-slate-600">
              📞 {shopSettings.phone1} {shopSettings.phone2 ? `| ${shopSettings.phone2}` : ''}
            </p>

            <div className="mt-3 inline-block bg-amber-100 text-amber-900 border border-amber-300 font-black text-xs px-4 py-1 rounded-full uppercase tracking-widest">
              ESTIMATE / کچا تخمینہ بل
            </div>
          </div>

          {/* Quotation & Customer Details */}
          <div className="grid grid-cols-2 text-xs border border-slate-200 rounded-xl p-3 bg-slate-50 mb-4 gap-2">
            <div>
              <div className="text-slate-500">Estimate No:</div>
              <div className="font-mono font-black text-slate-900">{quotation.quote_no}</div>
              <div className="text-slate-500 mt-1">Date (تاریخ):</div>
              <div className="font-semibold text-slate-800">{formatDate(quotation.quote_date)}</div>
            </div>
            <div className="text-right">
              <div className="text-slate-500">Mohtaram Customer:</div>
              <div className="font-extrabold text-slate-900 text-sm">{quotation.customer_name}</div>
              {quotation.customer_phone && (
                <div className="font-mono text-slate-600 mt-0.5">{quotation.customer_phone}</div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-xs text-left mb-4">
            <thead>
              <tr className="border-b-2 border-slate-300 bg-slate-100 text-slate-700">
                <th className="py-2 px-2 text-center w-8">#</th>
                <th className="py-2 px-2">Item / Service Details</th>
                <th className="py-2 px-2 text-center w-14">Qty</th>
                <th className="py-2 px-2 text-right w-20">Rate</th>
                <th className="py-2 px-2 text-right w-24">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(quotation.items || []).map((it, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-2 px-2 text-center text-slate-500">{idx + 1}</td>
                  <td className="py-2 px-2 font-medium text-slate-800">{it.item_name}</td>
                  <td className="py-2 px-2 text-center font-bold text-slate-700">{it.quantity}</td>
                  <td className="py-2 px-2 text-right text-slate-600">{it.rate.toLocaleString()}</td>
                  <td className="py-2 px-2 text-right font-black text-slate-900">
                    {it.line_total.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="border-t border-slate-200 pt-3 flex flex-col items-end text-xs space-y-1">
            <div className="flex justify-between w-64 text-slate-600 font-medium">
              <span>Gross Total:</span>
              <span className="font-bold text-slate-800">{formatPKR(quotation.total_amount + (quotation.discount_amount || 0))}</span>
            </div>
            {quotation.discount_amount > 0 && (
              <div className="flex justify-between w-64 text-emerald-700 font-bold">
                <span>Discount:</span>
                <span>-{formatPKR(quotation.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between w-64 text-sm font-black border-t-2 border-slate-900 pt-1.5 text-slate-900">
              <span>Estimated Bill:</span>
              <span className="text-base text-amber-700">{formatPKR(quotation.total_amount)}</span>
            </div>
          </div>

          {/* Notes & Terms */}
          <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-500 space-y-1">
            {quotation.notes && (
              <p className="italic font-medium text-slate-700">
                <span className="font-bold text-slate-800">Notes:</span> {quotation.notes}
              </p>
            )}
            <p className="font-urdu text-[11px] text-slate-500">
              * نوٹ: یہ صرف کچا تخمینہ بل ہے۔ لکڑی اور میٹریل کے ریٹس میں مارکیٹ کی بنیاد پر رد و بدل ہو سکتا ہے۔
            </p>
            <p className="text-[10px] text-slate-400">
              Token advance jamah karwane par kaam shuru kiya jaye ga.
            </p>
          </div>

          {/* Signature Lines */}
          <div className="mt-8 pt-4 flex justify-between text-[11px] text-slate-500">
            <div className="text-center border-t border-slate-300 w-36 pt-1">
              Customer Signature
            </div>
            <div className="text-center border-t border-slate-300 w-36 pt-1 font-bold text-slate-700">
              For {shopSettings.shop_name}
            </div>
          </div>
        </div>

        {/* Bottom Actions (No Print) */}
        {quotation.status !== 'CONVERTED' && onConvert && (
          <div className="no-print bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              Status: <span className="text-amber-600 font-black">{quotation.status}</span>
            </span>
            <button
              onClick={() => {
                onConvert(quotation.id);
                onClose();
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-md active:scale-95"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Convert to Final Bill (پکا بل بنائیں)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

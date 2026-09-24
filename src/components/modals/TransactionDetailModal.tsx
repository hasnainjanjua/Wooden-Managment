import React, { useEffect, useState } from 'react';
import {
  X,
  ShoppingBag,
  Cpu,
  HandCoins,
  BookOpen,
  Printer,
  MessageCircle,
  Calendar,
  User,
  Phone,
  FileText,
  Clock,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react';
import { Customer, CustomerLedgerEntry, SalesInvoice, SalesInvoiceItem, CncJob } from '../../types';
import { invoiceRepo } from '../../db/repositories/invoiceRepo';
import { cncRepo } from '../../db/repositories/cncRepo';
import { formatPKR, formatDate } from '../../utils/currency';
import { generateWhatsAppInvoiceLink, generateWhatsAppCncJobLink } from '../../utils/whatsapp';
import { useWorkshopStore } from '../../store/useWorkshopStore';
import { PrintCncJobModal } from './PrintCncJobModal';

interface TransactionDetailModalProps {
  entry: (CustomerLedgerEntry & { running_balance?: number }) | null;
  customer: Customer | null;
  onClose: () => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  entry,
  customer,
  onClose,
}) => {
  const shopSettings = useWorkshopStore((state) => state.shopSettings);
  const setPrintInvoiceData = useWorkshopStore((state) => state.setPrintInvoiceData);

  const [invoice, setInvoice] = useState<SalesInvoice | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<SalesInvoiceItem[]>([]);
  const [cncJob, setCncJob] = useState<CncJob | null>(null);
  const [isPrintCncOpen, setIsPrintCncOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!entry) {
      setInvoice(null);
      setInvoiceItems([]);
      setCncJob(null);
      return;
    }

    setLoading(true);
    try {
      if (entry.ref_type === 'SALE_INVOICE' && entry.ref_id) {
        const inv = invoiceRepo.getById(entry.ref_id);
        const items = invoiceRepo.getItems(entry.ref_id);
        setInvoice(inv);
        setInvoiceItems(items);
        setCncJob(null);
      } else if (entry.ref_type === 'CNC_JOB' && entry.ref_id) {
        const job = cncRepo.getById(entry.ref_id);
        setCncJob(job);
        setInvoice(null);
        setInvoiceItems([]);
      } else {
        setInvoice(null);
        setInvoiceItems([]);
        setCncJob(null);
      }
    } catch (e) {
      console.error('Error fetching transaction detail:', e);
    } finally {
      setLoading(false);
    }
  }, [entry]);

  if (!entry) return null;

  const isVoid = entry.is_void === 1;

  // Header Icon & Styling based on Ref Type
  const getHeaderBadge = () => {
    switch (entry.ref_type) {
      case 'SALE_INVOICE':
        return {
          icon: <ShoppingBag className="w-5 h-5 text-amber-700" />,
          title: 'Khareedari Ka Bill (Sale Invoice Details)',
          subtitle: `Bill Tafseel #${entry.ref_id || entry.id}`,
          bg: 'bg-amber-100 text-amber-900 border-amber-200',
        };
      case 'CNC_JOB':
        return {
          icon: <Cpu className="w-5 h-5 text-cyan-700" />,
          title: 'CNC Order Tafseel (CNC Job Details)',
          subtitle: `Job Token #${entry.ref_id || entry.id}`,
          bg: 'bg-cyan-100 text-cyan-900 border-cyan-200',
        };
      case 'WASOOLI':
        return {
          icon: <HandCoins className="w-5 h-5 text-emerald-700" />,
          title: 'Naqad Wasooli (Cash Recovery Receipt)',
          subtitle: `Wasooli Entry #${entry.id}`,
          bg: 'bg-emerald-100 text-emerald-900 border-emerald-200',
        };
      default:
        return {
          icon: <BookOpen className="w-5 h-5 text-slate-700" />,
          title: 'Khata Entry Tafseel (Ledger Details)',
          subtitle: `Ref: ${entry.ref_type}`,
          bg: 'bg-slate-100 text-slate-800 border-slate-200',
        };
    }
  };

  const badge = getHeaderBadge();

  // Print Invoice
  const handlePrintInvoice = () => {
    if (invoice && invoiceItems.length > 0) {
      setPrintInvoiceData({ invoice, items: invoiceItems });
    }
  };

  // WhatsApp Share Invoice
  const handleWhatsAppInvoice = () => {
    if (invoice && invoiceItems.length > 0) {
      const link = generateWhatsAppInvoiceLink(customer, invoice, invoiceItems, shopSettings.shop_name);
      window.open(link, '_blank');
    }
  };

  // WhatsApp Share CNC Job
  const handleWhatsAppCnc = () => {
    if (cncJob) {
      const link = generateWhatsAppCncJobLink(customer, cncJob, shopSettings.shop_name);
      window.open(link, '_blank');
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150 print:bg-transparent print:p-0 print:m-0 print:static">
        <div className="no-print bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl border ${badge.bg}`}>
                {badge.icon}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <span>{badge.title}</span>
                  {isVoid && (
                    <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                      Mansookh (Void)
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {badge.subtitle} • {formatDate(entry.entry_date)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-200/60 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-5">
            {/* Customer & Transaction Overview Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px] font-medium">Gāhak (Customer)</span>
                <p className="font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>{customer?.name || 'Walk-in / Unknown'}</span>
                </p>
                {customer?.phone && (
                  <p className="text-slate-500 text-[11px] font-mono mt-0.5 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{customer.phone}</span>
                  </p>
                )}
              </div>

              <div>
                <span className="text-slate-400 block text-[11px] font-medium">Tareekh (Date)</span>
                <p className="font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>{formatDate(entry.entry_date)}</span>
                </p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 mt-1 inline-block">
                  {entry.ref_type}
                </span>
              </div>

              <div className="col-span-2 sm:col-span-1 bg-white p-2.5 rounded-xl border border-slate-200 flex flex-col justify-center">
                <span className="text-slate-400 block text-[10px] font-medium uppercase tracking-wider">
                  Is Len Den Ka Asar
                </span>
                {entry.debit > 0 ? (
                  <p className="text-sm font-black font-mono text-rose-700 flex items-center gap-1 mt-0.5">
                    <ArrowDownRight className="w-4 h-4 text-rose-600" />
                    <span>+ {formatPKR(entry.debit)} (Udhaar)</span>
                  </p>
                ) : (
                  <p className="text-sm font-black font-mono text-emerald-700 flex items-center gap-1 mt-0.5">
                    <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                    <span>- {formatPKR(entry.credit)} (Wasool)</span>
                  </p>
                )}
                {entry.running_balance !== undefined && (
                  <span className="text-[10px] text-slate-500 mt-0.5 font-medium">
                    Kul Baqaya Baad: <strong>{formatPKR(entry.running_balance)}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Void Notice (if void) */}
            {isVoid && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Yeh entry mansookh (void) kar di gayi hai</p>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    Wajah: <em>{entry.void_reason || 'Mansookhi ki wajah darj nahi'}</em>
                  </p>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* VIEW A: SALE INVOICE DETAIL (Itemized List of what was bought) */}
            {/* ============================================================= */}
            {entry.ref_type === 'SALE_INVOICE' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-amber-600" />
                    <h4 className="font-bold text-slate-900 text-sm">
                      Khareeda Gaya Saman ({invoiceItems.length} Items)
                    </h4>
                  </div>
                  {invoice && (
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-200">
                      {invoice.invoice_no}
                    </span>
                  )}
                </div>

                {invoiceItems.length > 0 ? (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 pl-3 pr-2 w-8">#</th>
                          <th className="py-2.5 px-2">Saman (Item Name)</th>
                          <th className="py-2.5 px-2 text-center w-20">Tadad (Qty)</th>
                          <th className="py-2.5 px-2 text-right w-24">Rate (فی قیمت)</th>
                          <th className="py-2.5 pr-3 pl-2 text-right w-28">Total (کل رقم)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {invoiceItems.map((itm, index) => (
                          <tr key={itm.id || index} className="hover:bg-slate-50 transition">
                            <td className="py-2.5 pl-3 pr-2 font-mono text-slate-400 text-[11px]">
                              {index + 1}
                            </td>
                            <td className="py-2.5 px-2">
                              <span className="font-bold text-slate-900 block">{itm.item_name}</span>
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              <span className="font-black font-mono px-2 py-0.5 bg-slate-100 rounded-md text-slate-800 text-xs">
                                {itm.quantity}
                              </span>
                            </td>
                            <td className="py-2.5 px-2 text-right font-mono text-slate-700">
                              {formatPKR(itm.rate)}
                            </td>
                            <td className="py-2.5 pr-3 pl-2 text-right font-black font-mono text-slate-900">
                              {formatPKR(itm.line_total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                    Is bill ke individual items ka record nahi mila. (Description: {entry.description})
                  </div>
                )}

                {/* Financial Summary Calculation Breakdown */}
                {invoice && (
                  <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Kul Bill Amount (Subtotal):</span>
                      <span className="font-mono font-bold text-slate-900">{formatPKR(invoice.total_amount)}</span>
                    </div>

                    {invoice.discount_amount > 0 && (
                      <div className="flex justify-between text-rose-600 font-medium">
                        <span>Discount (رعایت):</span>
                        <span className="font-mono font-bold">- {formatPKR(invoice.discount_amount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-2 text-sm">
                      <span>Net Bill (صافی رقم):</span>
                      <span className="font-mono font-black text-slate-900">
                        {formatPKR(invoice.total_amount - (invoice.discount_amount || 0))}
                      </span>
                    </div>

                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Naqad Ada Kiya (Cash Received):</span>
                      <span className="font-mono font-black">{formatPKR(invoice.cash_received)}</span>
                    </div>

                    <div className="flex justify-between text-rose-700 font-black border-t border-dashed border-slate-300 pt-2 text-sm">
                      <span>Baqaya Udhaar (Khate Mein Shamil):</span>
                      <span className="font-mono font-black text-rose-700">
                        {formatPKR(invoice.balance_amount)}
                      </span>
                    </div>

                    {invoice.notes && (
                      <div className="mt-2 pt-2 border-t border-slate-200 text-slate-500 italic text-[11px]">
                        <strong>Notes:</strong> {invoice.notes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ============================================================= */}
            {/* VIEW B: CNC JOB DETAIL (Carving, 2D Jali, Sheet Dimensions)    */}
            {/* ============================================================= */}
            {entry.ref_type === 'CNC_JOB' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-cyan-600" />
                    <h4 className="font-bold text-slate-900 text-sm">
                      CNC Job / Cutting Tafseel
                    </h4>
                  </div>
                  {cncJob && (
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-cyan-100 text-cyan-900 border border-cyan-200">
                      {cncJob.job_no}
                    </span>
                  )}
                </div>

                {cncJob ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3.5 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Kaam Ki Tafseel (Description)</span>
                        <p className="font-bold text-slate-900 text-sm mt-0.5">{cncJob.job_description}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Size / Sheet Specification</span>
                        <p className="font-bold text-slate-900 text-sm mt-0.5">
                          {cncJob.size_specification || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                      <span className="text-slate-500">Status:</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                          cncJob.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : cncJob.status === 'In Progress'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {cncJob.status}
                      </span>
                    </div>

                    {/* Financials for CNC */}
                    <div className="grid grid-cols-3 gap-2 bg-white p-3 rounded-xl border border-slate-200 text-center">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Kul Tay Raqam</span>
                        <p className="text-sm font-black font-mono text-slate-900 mt-0.5">
                          {formatPKR(cncJob.total_amount)}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-emerald-600 uppercase font-semibold">Advance Mila</span>
                        <p className="text-sm font-black font-mono text-emerald-700 mt-0.5">
                          {formatPKR(cncJob.paid_amount)}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-rose-600 uppercase font-semibold">Baqaya Rakam</span>
                        <p className="text-sm font-black font-mono text-rose-700 mt-0.5">
                          {formatPKR(cncJob.remaining_amount)}
                        </p>
                      </div>
                    </div>

                    {cncJob.notes && (
                      <div className="pt-2 border-t border-slate-200 text-slate-500 text-[11px]">
                        <strong>Notes:</strong> {cncJob.notes}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                    CNC Job record nahi mila. (Description: {entry.description})
                  </div>
                )}
              </div>
            )}

            {/* ============================================================= */}
            {/* VIEW C: WASOOLI / CASH PAYMENT RECOVERY                        */}
            {/* ============================================================= */}
            {entry.ref_type === 'WASOOLI' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <HandCoins className="w-4 h-4 text-emerald-600" />
                  <h4 className="font-bold text-slate-900 text-sm">
                    Wasooli Ki Tafseel (Payment Receipt)
                  </h4>
                </div>

                <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-5 text-center space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Raqam Jama Shuda (Amount Received)
                  </span>
                  <div className="text-3xl font-black font-mono text-emerald-700">
                    {formatPKR(entry.credit)}
                  </div>
                  <p className="text-xs text-emerald-900 font-medium">
                    {entry.description || 'Naqad Wasooli ba-khata'}
                  </p>
                  <div className="inline-block mt-2 px-3 py-1 bg-white rounded-lg border border-emerald-200 text-xs text-slate-600 font-mono">
                    Tareekh: <strong>{formatDate(entry.entry_date)}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* VIEW D: OPENING BALANCE / OTHER LEDGER ENTRY                   */}
            {/* ============================================================= */}
            {entry.ref_type !== 'SALE_INVOICE' && entry.ref_type !== 'CNC_JOB' && entry.ref_type !== 'WASOOLI' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <BookOpen className="w-4 h-4 text-slate-600" />
                  <h4 className="font-bold text-slate-900 text-sm">
                    Khata Entry Details
                  </h4>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ref Type:</span>
                    <span className="font-bold text-slate-900">{entry.ref_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Description:</span>
                    <span className="font-bold text-slate-900">{entry.description}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Raqam:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {entry.debit > 0 ? `Debit: ${formatPKR(entry.debit)}` : `Credit: ${formatPKR(entry.credit)}`}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition shadow-sm"
            >
              Band Karein (Close)
            </button>

            <div className="flex items-center gap-2">
              {/* WhatsApp Share Button */}
              {entry.ref_type === 'SALE_INVOICE' && invoice && invoiceItems.length > 0 && customer?.phone && (
                <button
                  type="button"
                  onClick={handleWhatsAppInvoice}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm active:scale-95"
                  title="Gāhak Ko WhatsApp Par Itemized Bill Bhejein"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp Bill</span>
                </button>
              )}

              {entry.ref_type === 'CNC_JOB' && cncJob && customer?.phone && (
                <button
                  type="button"
                  onClick={handleWhatsAppCnc}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm active:scale-95"
                  title="Gāhak Ko WhatsApp Par CNC Job Details Bhejein"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp Token</span>
                </button>
              )}

              {/* Print Button */}
              {entry.ref_type === 'SALE_INVOICE' && invoice && invoiceItems.length > 0 && (
                <button
                  type="button"
                  onClick={handlePrintInvoice}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt Slip</span>
                </button>
              )}

              {entry.ref_type === 'CNC_JOB' && cncJob && (
                <button
                  type="button"
                  onClick={() => setIsPrintCncOpen(true)}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print CNC Token</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CNC Print Slip Modal when triggered */}
      {isPrintCncOpen && cncJob && (
        <PrintCncJobModal
          isOpen={isPrintCncOpen}
          job={cncJob}
          settings={shopSettings}
          onClose={() => setIsPrintCncOpen(false)}
        />
      )}
    </>
  );
};

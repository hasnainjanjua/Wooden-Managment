import React from 'react';
import {
  X,
  Truck,
  ShoppingCart,
  HandCoins,
  Printer,
  MessageCircle,
  Calendar,
  Building,
  Phone,
  FileText,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react';
import { Supplier, SupplierLedgerEntry } from '../../types';
import { formatPKR, formatDate } from '../../utils/currency';
import { generateWhatsAppSupplierTransactionLink } from '../../utils/whatsapp';
import { useWorkshopStore } from '../../store/useWorkshopStore';

interface SupplierTransactionDetailModalProps {
  entry: SupplierLedgerEntry | null;
  supplier: Supplier | null;
  onClose: () => void;
}

export const SupplierTransactionDetailModal: React.FC<SupplierTransactionDetailModalProps> = ({
  entry,
  supplier,
  onClose,
}) => {
  const shopSettings = useWorkshopStore((state) => state.shopSettings);

  if (!entry) return null;

  const isPurchase = entry.ref_type === 'PURCHASE';
  const isPayment = entry.ref_type === 'PAYMENT';
  const isVoid = entry.is_void === 1;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    if (supplier) {
      const link = generateWhatsAppSupplierTransactionLink(supplier, entry, shopSettings.shop_name);
      window.open(link, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border ${
                isPurchase
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              {isPurchase ? <ShoppingCart className="w-5 h-5" /> : <HandCoins className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <span>
                  {isPurchase
                    ? 'Maal Khareedari Bill (Supplier Purchase)'
                    : isPayment
                    ? 'Vendor Adaiki Voucher (Payment Made)'
                    : 'Supplier Ledger Entry'}
                </span>
                {isVoid && (
                  <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                    Mansookh (Void)
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {entry.bill_no ? `Bill #${entry.bill_no} • ` : ''}
                {formatDate(entry.entry_date)}
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

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5" id="supplier-voucher-printable">
          {/* Vendor Overview Banner */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px] font-medium">Supplier / Vendor</span>
              <p className="font-bold text-slate-900 mt-0.5 text-sm">{supplier?.name || 'Unknown Vendor'}</p>
              {supplier?.company_name && (
                <p className="text-slate-600 text-xs mt-0.5 flex items-center gap-1">
                  <Building className="w-3 h-3 text-slate-400" />
                  <span>{supplier.company_name}</span>
                </p>
              )}
              {supplier?.phone && (
                <p className="text-slate-500 text-xs font-mono mt-0.5 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{supplier.phone}</span>
                </p>
              )}
            </div>

            <div className="text-right">
              <span className="text-slate-400 block text-[11px] font-medium">Tareekh (Date)</span>
              <p className="font-bold text-slate-900 mt-0.5 flex items-center justify-end gap-1.5 text-sm">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>{formatDate(entry.entry_date)}</span>
              </p>
              {entry.bill_no && (
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800 mt-1 inline-block">
                  Bill #{entry.bill_no}
                </span>
              )}
            </div>
          </div>

          {/* Void Alert */}
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

          {/* Transaction Amount Card */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                {isPurchase ? 'Khareeda Gaya Maal (Bill Total)' : 'Adaiki Rakam (Amount Paid)'}
              </span>
              <span
                className={`text-2xl font-black font-mono ${
                  isPurchase ? 'text-rose-700' : 'text-emerald-700'
                }`}
              >
                {isPurchase ? formatPKR(entry.credit) : formatPKR(entry.debit)}
              </span>
            </div>

            {/* Description details */}
            <div className="pt-3 border-t border-slate-200 text-xs">
              <span className="text-slate-400 block text-[11px] mb-1">Tafseel / Saman Ki Maloomat:</span>
              <p className="font-semibold text-slate-800 bg-white p-3 rounded-xl border border-slate-200">
                {entry.description || 'Koi wazahat darj nahi'}
              </p>
            </div>

            {/* Financial balance breakdown */}
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs text-slate-600">
              <span>Is entry ke baad kul baqaya dena:</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {formatPKR(entry.running_balance || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition shadow-sm"
          >
            Band Karein
          </button>

          <div className="flex items-center gap-2">
            {supplier?.phone && (
              <button
                type="button"
                onClick={handleWhatsApp}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm active:scale-95"
                title="Vendor Ko WhatsApp Par Voucher Bhejein"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp Voucher</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip / PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

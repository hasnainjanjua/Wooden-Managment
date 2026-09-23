import React, { useState, useMemo } from 'react';
import {
  Truck,
  Search,
  Plus,
  ShoppingCart,
  HandCoins,
  Printer,
  Calendar,
  Phone,
  MapPin,
  Building,
  FileSpreadsheet,
  MessageCircle,
  Trash2,
  Eye,
  ArrowLeft,
} from 'lucide-react';
import { useWorkshopStore } from '../../store/useWorkshopStore';
import { formatPKR, formatDate } from '../../utils/currency';
import { SupplierLedgerEntry } from '../../types';
import { QuickSupplierModal } from '../modals/QuickSupplierModal';
import { SupplierPurchaseModal } from '../modals/SupplierPurchaseModal';
import { SupplierPaymentModal } from '../modals/SupplierPaymentModal';
import { SupplierTransactionDetailModal } from '../modals/SupplierTransactionDetailModal';

export const SupplierKhata: React.FC = () => {
  const suppliers = useWorkshopStore((state) => state.suppliers);
  const selectedSupplierId = useWorkshopStore((state) => state.selectedSupplierId);
  const selectSupplier = useWorkshopStore((state) => state.selectSupplier);
  const deleteSupplier = useWorkshopStore((state) => state.deleteSupplier);
  const supplierLedgerEntries = useWorkshopStore((state) => state.supplierLedgerEntries);
  const shopSettings = useWorkshopStore((state) => state.shopSettings);

  const [searchQuery, setSearchQuery] = useState('');
  const [isQuickSupplierOpen, setIsQuickSupplierOpen] = useState(false);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedDetailEntry, setSelectedDetailEntry] = useState<SupplierLedgerEntry | null>(null);
  const [mobileSupplierView, setMobileSupplierView] = useState<'LIST' | 'STATEMENT'>('LIST');

  // Date Range Filter
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const activeSupplier = useMemo(
    () => suppliers.find((s) => s.id === selectedSupplierId) || null,
    [suppliers, selectedSupplierId]
  );

  const filteredSuppliers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return suppliers.filter((s) => {
      return (
        q === '' ||
        s.name.toLowerCase().includes(q) ||
        (s.company_name && s.company_name.toLowerCase().includes(q)) ||
        (s.phone && s.phone.includes(q))
      );
    });
  }, [suppliers, searchQuery]);

  const filteredLedgerEntries = useMemo(() => {
    return supplierLedgerEntries.filter((entry) => {
      if (fromDate && entry.entry_date < fromDate) return false;
      if (toDate && entry.entry_date > toDate) return false;
      return true;
    });
  }, [supplierLedgerEntries, fromDate, toDate]);

  const handleWhatsAppShare = () => {
    if (!activeSupplier || !activeSupplier.phone) return;
    const phoneClean = activeSupplier.phone.replace(/[^0-9]/g, '');
    const formattedPhone = phoneClean.startsWith('0') ? '92' + phoneClean.slice(1) : phoneClean;
    const bal = activeSupplier.current_balance || 0;

    let msg = `*AL MADINAH CNC AND WOOD WORKS*\n`;
    msg += `Assalam-o-Alaikum ${activeSupplier.name} bhai,\n`;
    msg += `Aapki dukan/company (${activeSupplier.company_name || 'Vendor'}) ka khata hisab:\n`;
    msg += `Tareekh: ${formatDate(new Date().toISOString())}\n\n`;
    msg += `*Hamara Baqaya Dena: Rs. ${bal.toLocaleString()}*\n\n`;
    msg += `Shukriya,\n${shopSettings.shop_name}\nPh: ${shopSettings.phone1}`;

    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="h-[calc(100vh-105px)] flex flex-col md:flex-row overflow-hidden bg-slate-100">
      {/* ========================================================================= */}
      {/* LEFT: Suppliers Directory (Fixed width on desktop, NEVER flex-1)          */}
      {/* ========================================================================= */}
      <div
        className={`no-print w-full md:w-80 lg:w-96 md:shrink-0 flex flex-col border-r border-slate-200 bg-white overflow-hidden ${
          mobileSupplierView === 'LIST' ? 'flex' : 'hidden md:flex'
        }`}
      >
        <div className="p-3 border-b border-slate-200 bg-slate-50 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
              <Truck className="w-4 h-4 text-amber-600" />
              <span>Suppliers Khata (وینڈرز فہرست)</span>
            </div>
            <button
              onClick={() => setIsQuickSupplierOpen(true)}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Naya Vendor</span>
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vendor / company / phone..."
              className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-sm"
            />
          </div>
        </div>

        {/* Suppliers List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1 bg-slate-50/40">
          {filteredSuppliers.map((supp) => {
            const isSelected = supp.id === selectedSupplierId;
            const bal = supp.current_balance || 0;

            return (
              <button
                key={supp.id}
                onClick={() => {
                  selectSupplier(supp.id);
                  if (typeof window !== 'undefined' && window.innerWidth < 768) {
                    setMobileSupplierView('STATEMENT');
                  }
                }}
                className={`w-full text-left p-3 rounded-xl transition-colors flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-amber-50 border border-amber-300 shadow-sm'
                    : 'hover:bg-slate-100 border border-transparent'
                }`}
              >
                <div>
                  <h4 className={`text-xs font-bold ${isSelected ? 'text-amber-900' : 'text-slate-900'}`}>
                    {supp.name}
                  </h4>
                  {supp.company_name && (
                    <p className="text-[11px] text-slate-500 mt-0.5">{supp.company_name}</p>
                  )}
                  <p className="text-[10px] text-slate-400">{supp.phone || 'No phone'}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs font-black font-mono ${
                      bal > 0 ? 'text-rose-600' : 'text-slate-500'
                    }`}
                  >
                    {formatPKR(bal)}
                  </span>
                  <span className="block text-[9px] font-urdu text-slate-500">
                    {bal > 0 ? 'ہم نے دینا ہے' : 'صاف'}
                  </span>
                </div>
              </button>
            );
          })}

          {filteredSuppliers.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-xs">
              Koi supplier nahi mila.
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT: Detailed Supplier Statement View                                   */}
      {/* ========================================================================= */}
      <div
        className={`flex-1 flex flex-col bg-white overflow-hidden ${
          mobileSupplierView === 'STATEMENT' ? 'flex w-full' : 'hidden md:flex'
        }`}
      >
        {/* Mobile Back Button Bar */}
        <div className="md:hidden flex items-center justify-between p-2.5 bg-slate-50 border-b border-slate-200">
          <button
            onClick={() => setMobileSupplierView('LIST')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-300 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-amber-600" />
            <span>Vendors List (واپس)</span>
          </button>
          <span className="text-xs font-bold text-slate-600 truncate max-w-[180px]">
            {activeSupplier?.name || 'Supplier Statement'}
          </span>
        </div>
        {activeSupplier ? (
          <>
            {/* Header & Quick Action Buttons */}
            <div className="no-print p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-900">{activeSupplier.name}</h2>
                  {activeSupplier.company_name && (
                    <span className="text-xs bg-slate-100 text-slate-800 font-semibold px-2 py-0.5 rounded-md border border-slate-200">
                      {activeSupplier.company_name}
                    </span>
                  )}
                  <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full border bg-rose-50 text-rose-700 border-rose-200">
                    Hamara Baqaya Dena: {formatPKR(activeSupplier.current_balance || 0)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                  {activeSupplier.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {activeSupplier.phone}
                    </span>
                  )}
                  {activeSupplier.address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {activeSupplier.address}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPurchaseOpen(true)}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm active:scale-[0.98]"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>+ Khareedari Bill (Purchase)</span>
                </button>

                <button
                  onClick={() => setIsPaymentOpen(true)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm active:scale-[0.98]"
                >
                  <HandCoins className="w-4 h-4" />
                  <span>Adaigi Karein (Pay)</span>
                </button>

                <button
                  onClick={handleWhatsAppShare}
                  disabled={!activeSupplier.phone}
                  className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-40 shadow-sm"
                  title="Share on WhatsApp"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-4 h-4 text-amber-600" />
                  <span>Print</span>
                </button>

                <button
                  onClick={() => {
                    if (window.confirm(`Kya aap waqai supplier '${activeSupplier.name}' aur unka ledger delete karna chahte hain?`)) {
                      deleteSupplier(activeSupplier.id);
                    }
                  }}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                  title="Delete Supplier"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>

            {/* Date Range Filter Toolbar */}
            <div className="no-print px-4 py-2 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-slate-700 font-bold">Tareekh:</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-900 text-xs focus:ring-1 focus:ring-amber-500 shadow-sm"
                />
                <span className="text-slate-500 font-bold">se</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-900 text-xs focus:ring-1 focus:ring-amber-500 shadow-sm"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setFromDate('');
                    setToDate('');
                  }}
                  className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition ${
                    !fromDate && !toDate
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Tamam
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1)
                      .toISOString()
                      .split('T')[0];
                    setFromDate(startOfMonth);
                    setToDate(new Date().toISOString().split('T')[0]);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-[11px] transition shadow-sm"
                >
                  Is Mahine
                </button>
              </div>
            </div>

            {/* Ledger Running Balance Table */}
            <div className="flex-1 overflow-y-auto p-4" id="printable-area">
              {/* Printable Header */}
              <div className="print-only mb-6 border-b-2 border-black pb-3 text-black">
                <h1 className="text-xl font-black uppercase">{shopSettings.shop_name}</h1>
                <p className="text-xs font-urdu font-bold">{shopSettings.urdu_title} - سپلائر کھاتہ سٹیٹمنٹ</p>
                <div className="mt-3 flex justify-between text-xs">
                  <div>
                    <p><strong>Supplier:</strong> {activeSupplier.name} ({activeSupplier.company_name || 'N/A'})</p>
                    <p><strong>Phone:</strong> {activeSupplier.phone || 'N/A'}</p>
                    <p><strong>Address:</strong> {activeSupplier.address || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <p><strong>Tareekh:</strong> {formatDate(new Date().toISOString())}</p>
                    <p className="text-base font-bold">
                      <strong>Kul Baqaya Dena:</strong> {formatPKR(activeSupplier.current_balance || 0)}
                    </p>
                  </div>
                </div>
              </div>

              {filteredLedgerEntries.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-8">
                  <FileSpreadsheet className="w-12 h-12 text-slate-300 mb-2" />
                  <p className="text-sm font-bold text-slate-700">Is supplier ka koi len den nahi mila</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-100 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 pl-3 pr-2">Tareekh (تاریخ)</th>
                      <th className="py-2.5 px-2">Tafseel (Detail)</th>
                      <th className="py-2.5 px-2">Bill / Ref</th>
                      <th className="py-2.5 px-2 text-right text-emerald-700">Adaiki (Debit / ہم نے دی)</th>
                      <th className="py-2.5 px-2 text-right text-rose-700">Khareedari (Credit / ادھار آیا)</th>
                      <th className="py-2.5 pr-3 pl-2 text-right text-amber-800">Baqaya Dena (Balance)</th>
                      <th className="no-print py-2.5 px-2 text-center w-24">Tafseel</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLedgerEntries.map((entry) => {
                      const isVoid = entry.is_void === 1;

                      return (
                        <tr
                          key={entry.id}
                          onClick={() => setSelectedDetailEntry(entry)}
                          className={`hover:bg-amber-50/70 cursor-pointer transition group ${
                            isVoid ? 'opacity-40 line-through bg-rose-50' : ''
                          }`}
                          title="Tafseel dekhne ke liye click karein"
                        >
                          <td className="py-2.5 pl-3 pr-2 text-slate-600 whitespace-nowrap font-mono">
                            {formatDate(entry.entry_date)}
                          </td>
                          <td className="py-2.5 px-2 font-medium text-slate-900">
                            <div>{entry.description}</div>
                            {isVoid && entry.void_reason && (
                              <span className="text-[10px] text-rose-600 font-bold block no-underline">
                                [Mansookh: {entry.void_reason}]
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-2">
                            {entry.bill_no ? (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                                {entry.bill_no}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-right font-bold font-mono text-emerald-700">
                            {entry.debit > 0 ? formatPKR(entry.debit) : '-'}
                          </td>
                          <td className="py-2.5 px-2 text-right font-bold font-mono text-rose-700">
                            {entry.credit > 0 ? formatPKR(entry.credit) : '-'}
                          </td>
                          <td className="py-2.5 pr-3 pl-2 text-right font-black font-mono text-amber-800">
                            {formatPKR(entry.running_balance || 0)}
                          </td>
                          <td className="no-print py-2.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDetailEntry(entry);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 group-hover:bg-amber-500 group-hover:text-slate-950 font-bold text-[11px] transition shadow-xs"
                              title="Bill / Voucher Tafseel Dekhein"
                            >
                              <Eye className="w-3 h-3 text-amber-600 group-hover:text-slate-950" />
                              <span>Tafseel</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8 text-center">
            <Truck className="w-16 h-16 text-slate-300 mb-3" />
            <p className="text-base font-bold text-slate-800 mb-1">Supplier Muntakhib Karein</p>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              Bayen (Left) janib se kisi vendor ya timber market dealer par click karein taake uska khareedari bill aur adaigi ka hisab nazar aaye.
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      <QuickSupplierModal
        isOpen={isQuickSupplierOpen}
        onClose={() => setIsQuickSupplierOpen(false)}
        onSupplierCreated={(id) => selectSupplier(id)}
      />

      <SupplierPurchaseModal
        isOpen={isPurchaseOpen}
        supplier={activeSupplier}
        onClose={() => setIsPurchaseOpen(false)}
      />

      <SupplierPaymentModal
        isOpen={isPaymentOpen}
        supplier={activeSupplier}
        onClose={() => setIsPaymentOpen(false)}
      />

      {/* Supplier Transaction Detail Inspection Modal */}
      <SupplierTransactionDetailModal
        entry={selectedDetailEntry}
        supplier={activeSupplier}
        onClose={() => setSelectedDetailEntry(null)}
      />
    </div>
  );
};

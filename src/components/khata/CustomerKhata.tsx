import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  UserPlus,
  HandCoins,
  Share2,
  Printer,
  Calendar,
  AlertCircle,
  Phone,
  MapPin,
  FileSpreadsheet,
  Trash2,
  MessageCircle,
  Edit2,
  Eye,
  ArrowLeft,
} from 'lucide-react';
import { useWorkshopStore } from '../../store/useWorkshopStore';
import { Customer, CustomerLedgerEntry } from '../../types';
import { formatPKR, formatDate } from '../../utils/currency';
import { generateWhatsAppKhataLink } from '../../utils/whatsapp';
import { WasooliModal } from '../modals/WasooliModal';
import { QuickCustomerModal } from '../modals/QuickCustomerModal';
import { EditCustomerModal } from '../modals/EditCustomerModal';
import { TransactionDetailModal } from '../modals/TransactionDetailModal';

export const CustomerKhata: React.FC = () => {
  const customers = useWorkshopStore((state) => state.customers);
  const selectedKhataCustomerId = useWorkshopStore((state) => state.selectedKhataCustomerId);
  const selectKhataCustomer = useWorkshopStore((state) => state.selectKhataCustomer);
  const deleteCustomer = useWorkshopStore((state) => state.deleteCustomer);
  const customerLedgerEntries = useWorkshopStore((state) => state.customerLedgerEntries);
  const openVoidModal = useWorkshopStore((state) => state.openVoidModal);
  const shopSettings = useWorkshopStore((state) => state.shopSettings);

  // Local Search & Modals
  const [customerSearch, setCustomerSearch] = useState('');
  const [isWasooliOpen, setIsWasooliOpen] = useState(false);
  const [isQuickCustomerOpen, setIsQuickCustomerOpen] = useState(false);
  const [isEditCustomerOpen, setIsEditCustomerOpen] = useState(false);
  const [selectedDetailEntry, setSelectedDetailEntry] = useState<(CustomerLedgerEntry & { running_balance?: number }) | null>(null);
  const [mobileKhataView, setMobileKhataView] = useState<'LIST' | 'STATEMENT'>('LIST');

  // Date Range Filter State
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Active customer
  const activeCustomer = useMemo(
    () => customers.find((c) => c.id === selectedKhataCustomerId) || null,
    [customers, selectedKhataCustomerId]
  );

  // Filtered customer list (Memoized for high performance)
  const filteredCustomers = useMemo(() => {
    const q = customerSearch.toLowerCase().trim();
    return customers.filter((c) => {
      return q === '' || c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q));
    });
  }, [customers, customerSearch]);

  // Filtered Ledger Entries by Date Range (Memoized for high performance)
  const filteredLedgerEntries = useMemo(() => {
    return customerLedgerEntries.filter((entry) => {
      if (fromDate && entry.entry_date < fromDate) return false;
      if (toDate && entry.entry_date > toDate) return false;
      return true;
    });
  }, [customerLedgerEntries, fromDate, toDate]);

  const handleWhatsAppShare = () => {
    if (!activeCustomer) return;
    const link = generateWhatsAppKhataLink(activeCustomer, filteredLedgerEntries, shopSettings.shop_name);
    window.open(link, '_blank');
  };

  const handlePrintStatement = () => {
    window.print();
  };

  return (
    <div className="h-[calc(100vh-105px)] flex flex-col md:flex-row overflow-hidden bg-slate-100">
      {/* ========================================================================= */}
      {/* LEFT: Customer Accounts Directory (Fixed width on desktop, NEVER flex-1) */}
      {/* ========================================================================= */}
      <div
        className={`no-print w-full md:w-80 lg:w-96 md:shrink-0 flex flex-col border-r border-slate-200 bg-white overflow-hidden ${
          mobileKhataView === 'LIST' ? 'flex' : 'hidden md:flex'
        }`}
      >
        {/* Customer Directory Header */}
        <div className="p-3 border-b border-slate-200 bg-slate-50 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
              <BookOpen className="w-4 h-4 text-amber-600" />
              <span>Gāhak Khata List (کھاتہ داران)</span>
            </div>
            <button
              onClick={() => setIsQuickCustomerOpen(true)}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Naya Khata</span>
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              placeholder="Search by name / phone..."
              className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-sm"
            />
          </div>
        </div>

        {/* Customer List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1 bg-slate-50/40">
          {filteredCustomers.map((cust) => {
            const isSelected = cust.id === selectedKhataCustomerId;
            const bal = cust.current_balance || 0;

            return (
              <div
                key={cust.id}
                onClick={() => {
                  selectKhataCustomer(cust.id);
                  if (typeof window !== 'undefined' && window.innerWidth < 768) {
                    setMobileKhataView('STATEMENT');
                  }
                }}
                className={`w-full text-left p-3 rounded-xl transition-colors flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-amber-50 border border-amber-300 shadow-sm'
                    : 'hover:bg-slate-100 border border-transparent'
                }`}
              >
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className={`text-xs font-bold truncate ${isSelected ? 'text-amber-900' : 'text-slate-900'}`}>
                      {cust.name}
                    </h4>
                    {bal >= 20000 && (
                      <span className="text-[10px] font-black px-1.5 py-0.2 bg-rose-100 text-rose-700 border border-rose-200 rounded">
                        High Debt
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">{cust.phone || 'No phone'}</p>
                </div>
                <div className="text-right flex items-center gap-2">
                  <div>
                    <span
                      className={`text-xs font-black font-mono block ${
                        bal >= 20000 ? 'text-rose-700 font-extrabold' : bal > 0 ? 'text-rose-600' : bal < 0 ? 'text-cyan-700' : 'text-slate-500'
                      }`}
                    >
                      {formatPKR(bal)}
                    </span>
                    <span className="block text-[9px] font-urdu text-slate-500">
                      {bal > 0 ? 'بنام (واجب الادا)' : 'صاف'}
                    </span>
                  </div>
                  {cust.phone && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const phone = cust.phone;
                        if (!phone) return;
                        const text = encodeURIComponent(
                          `*${shopSettings.shop_name}* - Khata Reminder:\nMohtaram ${cust.name}, aap ka baqaya wajibul ada hisab Rs. ${bal.toLocaleString()} hai. Baraye meherbani adaigi farmaein. Shukriya!`
                        );
                        window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
                      }}
                      className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                      title="Send WhatsApp Reminder"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filteredCustomers.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-xs">
              Koi customer nahi mila.
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT: Detailed Ledger Statement View (Always flex-1 on desktop)          */}
      {/* ========================================================================= */}
      <div
        className={`flex-1 flex flex-col bg-white overflow-hidden ${
          mobileKhataView === 'STATEMENT' ? 'flex' : 'hidden md:flex'
        }`}
      >
        {/* Mobile Back Button Bar */}
        <div className="md:hidden flex items-center justify-between p-2.5 bg-slate-50 border-b border-slate-200">
          <button
            onClick={() => setMobileKhataView('LIST')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-300 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-amber-600" />
            <span>Gāhak List (واپس)</span>
          </button>
          <span className="text-xs font-bold text-slate-600 truncate max-w-[180px]">
            {activeCustomer?.name || 'Khata Statement'}
          </span>
        </div>
        {activeCustomer ? (
          <>
            {/* Customer Header & Quick Actions */}
            <div className="no-print p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-900">{activeCustomer.name}</h2>
                  <button
                    onClick={() => setIsEditCustomerOpen(true)}
                    className="p-1 text-slate-400 hover:text-amber-700 hover:bg-slate-200 rounded-lg transition"
                    title="Customer ki maloomat tabdeel karein (Edit)"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <span
                    className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${
                      (activeCustomer.current_balance || 0) > 0
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    Baqaya: {formatPKR(activeCustomer.current_balance || 0)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                  {activeCustomer.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {activeCustomer.phone}
                    </span>
                  )}
                  {activeCustomer.address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {activeCustomer.address}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsWasooliOpen(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm active:scale-[0.98]"
                >
                  <HandCoins className="w-4 h-4" />
                  <span>Wasooli Darj Karein (وصولی)</span>
                </button>

                <button
                  onClick={handleWhatsAppShare}
                  disabled={!activeCustomer.phone}
                  className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-40 shadow-sm"
                  title="Share Khata Statement on WhatsApp"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>WhatsApp Hisab</span>
                </button>

                <button
                  onClick={handlePrintStatement}
                  className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                  title="Print Ledger Statement (A4 or Thermal)"
                >
                  <Printer className="w-4 h-4 text-amber-600" />
                  <span>Print Khata</span>
                </button>

                <button
                  onClick={() => {
                    if (window.confirm(`Kya aap waqai customer '${activeCustomer.name}' aur unka khata delete karna chahte hain?`)) {
                      deleteCustomer(activeCustomer.id);
                    }
                  }}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                  title="Customer Delete Karein"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>

            {/* Date Range Filter Toolbar */}
            <div className="no-print px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-slate-700 font-bold">Tareekh Filter:</span>
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
                  Tamam (All Time)
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
                  Is Mahine (This Month)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() - 30);
                    setFromDate(d.toISOString().split('T')[0]);
                    setToDate(new Date().toISOString().split('T')[0]);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-[11px] transition shadow-sm"
                >
                  Aakhri 30 Din
                </button>
              </div>
            </div>

            {/* Ledger Running Balance Table */}
            <div className="flex-1 overflow-y-auto p-4" id="ledger-printable-area">
              {/* Print Statement Header (Visible only when printing) */}
              <div className="print-only mb-6 border-b-2 border-black pb-3 text-black">
                <h1 className="text-xl font-black uppercase">{shopSettings.shop_name}</h1>
                <p className="text-xs font-urdu font-bold">{shopSettings.urdu_title} - کھاتہ سٹیٹمنٹ</p>
                <p className="text-[11px] text-gray-700">{shopSettings.address} • Ph: {shopSettings.phone1} {shopSettings.phone2 ? `/ ${shopSettings.phone2}` : ''}</p>
                <div className="mt-3 flex justify-between text-xs">
                  <div>
                    <p><strong>Customer Name:</strong> {activeCustomer.name}</p>
                    <p><strong>Phone:</strong> {activeCustomer.phone || 'N/A'}</p>
                    <p><strong>Address:</strong> {activeCustomer.address || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <p><strong>Tareekh:</strong> {formatDate(new Date().toISOString())}</p>
                    {fromDate && toDate && (
                      <p><strong>Period:</strong> {formatDate(fromDate)} se {formatDate(toDate)}</p>
                    )}
                    <p className="text-base font-bold">
                      <strong>Kul Baqaya (Balance):</strong> {formatPKR(activeCustomer.current_balance || 0)}
                    </p>
                  </div>
                </div>
              </div>

              {filteredLedgerEntries.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-8">
                  <FileSpreadsheet className="w-12 h-12 text-slate-300 mb-2" />
                  <p className="text-sm font-bold text-slate-700">Is doran ka koi ledger record nahi mila</p>
                  <p className="text-xs text-slate-500">Tareekh ka filter hata kar check karein.</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-100 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 pl-3 pr-2">Tareekh (تاریخ)</th>
                      <th className="py-2.5 px-2">Tafseel (Detail)</th>
                      <th className="py-2.5 px-2">Type / Ref</th>
                      <th className="py-2.5 px-2 text-right text-rose-700">Banam (Debit / ادھار)</th>
                      <th className="py-2.5 px-2 text-right text-emerald-700">Jama (Credit / وصول)</th>
                      <th className="py-2.5 px-2 text-right text-amber-800">Baqaya (Balance)</th>
                      <th className="no-print py-2.5 px-2 text-center w-24">Tafseel</th>
                      <th className="no-print py-2.5 pr-3 pl-2 text-center w-12">Void</th>
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
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                              {entry.ref_type}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-right font-bold font-mono text-rose-700">
                            {entry.debit > 0 ? formatPKR(entry.debit) : '-'}
                          </td>
                          <td className="py-2.5 px-2 text-right font-bold font-mono text-emerald-700">
                            {entry.credit > 0 ? formatPKR(entry.credit) : '-'}
                          </td>
                          <td className="py-2.5 px-2 text-right font-black font-mono text-amber-800">
                            {formatPKR(entry.running_balance)}
                          </td>
                          <td className="no-print py-2.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDetailEntry(entry);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 group-hover:bg-amber-500 group-hover:text-slate-950 font-bold text-[11px] transition shadow-xs"
                              title="Mukammal Bill / Tafseel Dekhein"
                            >
                              <Eye className="w-3 h-3 text-amber-600 group-hover:text-slate-950" />
                              <span>Tafseel</span>
                            </button>
                          </td>
                          <td className="no-print py-2.5 pr-3 pl-2 text-center" onClick={(e) => e.stopPropagation()}>
                            {!isVoid && entry.ref_type !== 'OPENING_BAL' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openVoidModal('ledger', entry.id, `${entry.ref_type} #${entry.id}`);
                                }}
                                className="text-slate-400 hover:text-rose-600 p-1 rounded transition text-xs font-semibold"
                                title="Entry Mansookh (Void) Karein"
                              >
                                Void
                              </button>
                            )}
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
            <BookOpen className="w-16 h-16 text-slate-300 mb-3" />
            <p className="text-base font-bold text-slate-800 mb-1">Customer Muntakhib Karein</p>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              Bayen (Left) janib se kisi customer par click karein taake uska mukammal khata, tareekh-war len den aur running balance nazar aaye.
            </p>
          </div>
        )}
      </div>

      {/* Wasooli Modal */}
      <WasooliModal
        isOpen={isWasooliOpen}
        customer={activeCustomer}
        onClose={() => setIsWasooliOpen(false)}
      />

      {/* Quick Customer Modal */}
      <QuickCustomerModal
        isOpen={isQuickCustomerOpen}
        onClose={() => setIsQuickCustomerOpen(false)}
        onCustomerCreated={(newId) => selectKhataCustomer(newId)}
      />

      {/* Edit Customer Modal */}
      <EditCustomerModal
        isOpen={isEditCustomerOpen}
        customer={activeCustomer}
        onClose={() => setIsEditCustomerOpen(false)}
      />

      {/* Transaction Detail Breakdown Modal (Items bought, CNC job specs, Wasooli receipt) */}
      <TransactionDetailModal
        entry={selectedDetailEntry}
        customer={activeCustomer}
        onClose={() => setSelectedDetailEntry(null)}
      />
    </div>
  );
};

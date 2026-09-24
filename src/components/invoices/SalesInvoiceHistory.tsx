import React, { useState, useMemo } from 'react';
import {
  History,
  Printer,
  Search,
  Calendar,
  Filter,
  Eye,
  MessageCircle,
  TrendingUp,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Clock,
  Ban,
  FileText,
  User,
  ShoppingBag,
} from 'lucide-react';
import { useWorkshopStore } from '../../store/useWorkshopStore';
import { formatPKR, formatDate, getTodayDate } from '../../utils/currency';
import { invoiceRepo } from '../../db/repositories/invoiceRepo';
import { generateWhatsAppInvoiceLink } from '../../utils/whatsapp';
import { TransactionDetailModal } from '../modals/TransactionDetailModal';
import { CustomerLedgerEntry, Customer, SalesInvoice } from '../../types';

export const SalesInvoiceHistory: React.FC = () => {
  const invoices = useWorkshopStore((state) => state.invoices);
  const customers = useWorkshopStore((state) => state.customers);
  const shopSettings = useWorkshopStore((state) => state.shopSettings);
  const reprintInvoice = useWorkshopStore((state) => state.reprintInvoice);
  const openVoidModal = useWorkshopStore((state) => state.openVoidModal);
  const setActiveTab = useWorkshopStore((state) => state.setActiveTab);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PARTIAL' | 'CREDIT' | 'VOID'>('ALL');

  // Selected Detail Modal State
  const [selectedLedgerEntry, setSelectedLedgerEntry] = useState<CustomerLedgerEntry | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const todayStr = getTodayDate();

  // Helper date calculations
  const getFilterDateRange = () => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()).toISOString();

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    const startOf7Days = sevenDaysAgo.toISOString();

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

    return { startOfToday, startOfYesterday, startOf7Days, startOfMonth };
  };

  const { startOfToday, startOfYesterday, startOf7Days, startOfMonth } = useMemo(getFilterDateRange, []);

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // 1. Search filter
      const q = searchTerm.toLowerCase().trim();
      if (q) {
        const matchesNo = inv.invoice_no.toLowerCase().includes(q);
        const matchesName = (inv.customer_name || '').toLowerCase().includes(q);
        const matchesPhone = (inv.customer_phone || '').toLowerCase().includes(q);
        const matchesNotes = (inv.notes || '').toLowerCase().includes(q);
        if (!matchesNo && !matchesName && !matchesPhone && !matchesNotes) return false;
      }

      // 2. Date filter
      if (dateFilter === 'TODAY') {
        if (!inv.invoice_date.startsWith(todayStr)) return false;
      } else if (dateFilter === 'YESTERDAY') {
        const yDate = new Date();
        yDate.setDate(yDate.getDate() - 1);
        const yDateStr = yDate.toISOString().split('T')[0];
        if (!inv.invoice_date.startsWith(yDateStr)) return false;
      } else if (dateFilter === 'WEEK') {
        if (inv.invoice_date < startOf7Days) return false;
      } else if (dateFilter === 'MONTH') {
        if (inv.invoice_date < startOfMonth) return false;
      }

      // 3. Status filter
      const isVoid = inv.is_void === 1;
      const isPaid = !isVoid && (inv.balance_amount || 0) <= 0;
      const isPartial = !isVoid && (inv.cash_received || 0) > 0 && (inv.balance_amount || 0) > 0;
      const isCredit = !isVoid && (inv.cash_received || 0) === 0 && (inv.balance_amount || 0) > 0;

      if (statusFilter === 'VOID' && !isVoid) return false;
      if (statusFilter === 'PAID' && !isPaid) return false;
      if (statusFilter === 'PARTIAL' && !isPartial) return false;
      if (statusFilter === 'CREDIT' && !isCredit) return false;

      return true;
    });
  }, [invoices, searchTerm, dateFilter, statusFilter, todayStr, startOf7Days, startOfMonth]);

  // Aggregate Metrics for current filter
  const metrics = useMemo(() => {
    let totalSales = 0;
    let totalReceived = 0;
    let totalBalance = 0;
    let activeCount = 0;
    let voidCount = 0;

    filteredInvoices.forEach((inv) => {
      if (inv.is_void === 1) {
        voidCount++;
        return;
      }
      activeCount++;
      const net = inv.total_amount - (inv.discount_amount || 0);
      totalSales += net;
      totalReceived += inv.cash_received || 0;
      totalBalance += inv.balance_amount || 0;
    });

    return { totalSales, totalReceived, totalBalance, activeCount, voidCount };
  }, [filteredInvoices]);

  // Handle View Details
  const handleOpenDetail = (inv: SalesInvoice) => {
    const cust = customers.find((c) => c.id === inv.customer_id) || (inv.customer_name ? {
      id: 0,
      name: inv.customer_name,
      phone: inv.customer_phone || '',
      address: '',
      created_at: inv.invoice_date,
      current_balance: inv.balance_amount || 0,
    } : null);

    const entry: CustomerLedgerEntry = {
      id: inv.id,
      customer_id: inv.customer_id || 0,
      entry_date: inv.invoice_date,
      ref_type: 'SALE_INVOICE',
      ref_id: inv.id,
      debit: inv.total_amount - (inv.discount_amount || 0),
      credit: inv.cash_received || 0,
      description: inv.notes || 'Sale Invoice',
      is_void: inv.is_void || 0,
      void_reason: inv.void_reason,
      voided_at: inv.voided_at,
    };

    setSelectedCustomer(cust);
    setSelectedLedgerEntry(entry);
  };

  // Handle WhatsApp Share
  const handleWhatsApp = (inv: SalesInvoice) => {
    try {
      const items = invoiceRepo.getItems(inv.id);
      const cust = customers.find((c) => c.id === inv.customer_id) || {
        id: 0,
        name: inv.customer_name || 'Customer',
        phone: inv.customer_phone || '',
        address: '',
        created_at: inv.invoice_date,
      };

      const link = generateWhatsAppInvoiceLink(cust, inv, items, shopSettings.shop_name);
      window.open(link, '_blank');
    } catch (e) {
      console.error('WhatsApp invoice error:', e);
    }
  };

  return (
    <div className="h-[calc(100vh-105px)] overflow-y-auto bg-slate-100 p-4 md:p-6 space-y-5">
      {/* ========================================================================= */}
      {/* Top Banner & Quick Metrics                                                */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Sales & Invoices Register (سیلز ہسٹری و بلز)</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Tamam purani aur taza sales ka record, re-print slips aur wasooli status
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('pos')}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-sm transition flex items-center gap-2 active:scale-95 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Naya Bill Banayein (New POS Sale)</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Kul Bills (Total Invoices)
          </span>
          <div className="text-2xl font-black font-mono text-slate-900 mt-1">
            {metrics.activeCount} <span className="text-xs font-semibold text-slate-400">Bills</span>
          </div>
          {metrics.voidCount > 0 && (
            <span className="text-[10px] text-rose-600 font-bold mt-1 inline-block">
              {metrics.voidCount} Mansookh (Void)
            </span>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block flex items-center justify-between">
            <span>Kul Sale Volume</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </span>
          <div className="text-2xl font-black font-mono text-blue-900 mt-1">
            {formatPKR(metrics.totalSales)}
          </div>
          <span className="text-[10px] text-slate-400 font-medium mt-1 inline-block">
            Net bill amount after discount
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block flex items-center justify-between">
            <span>Naqad Wasool (Received)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </span>
          <div className="text-2xl font-black font-mono text-emerald-800 mt-1">
            {formatPKR(metrics.totalReceived)}
          </div>
          <span className="text-[10px] text-emerald-600 font-medium mt-1 inline-block">
            Direct Cash / Recovered
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block flex items-center justify-between">
            <span>Baqaya Udhaar (Balance Due)</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </span>
          <div className="text-2xl font-black font-mono text-rose-700 mt-1">
            {formatPKR(metrics.totalBalance)}
          </div>
          <span className="text-[10px] text-rose-600 font-medium mt-1 inline-block">
            Pending customer dues
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Search Bar & Filter Controls                                              */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Live Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Bill No (e.g. INV-001), Customer Name, Phone..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
            />
          </div>

          {/* Quick Date Filters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setDateFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                dateFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setDateFilter('TODAY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                dateFilter === 'TODAY'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Aaj (Today)
            </button>
            <button
              onClick={() => setDateFilter('YESTERDAY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                dateFilter === 'YESTERDAY'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Kal (Yesterday)
            </button>
            <button
              onClick={() => setDateFilter('WEEK')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                dateFilter === 'WEEK'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              7 Din
            </button>
            <button
              onClick={() => setDateFilter('MONTH')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                dateFilter === 'MONTH'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Yeh Mahina
            </button>
          </div>
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-2 border-t border-slate-100 pt-3 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </span>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                statusFilter === 'ALL'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tamam ({invoices.length})
            </button>
            <button
              onClick={() => setStatusFilter('PAID')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                statusFilter === 'PAID'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              ✓ Mukammal Wasool (Paid)
            </button>
            <button
              onClick={() => setStatusFilter('PARTIAL')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                statusFilter === 'PARTIAL'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              ◐ Juzwi Wasool (Partial)
            </button>
            <button
              onClick={() => setStatusFilter('CREDIT')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                statusFilter === 'CREDIT'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              ✕ Udhaar (Credit)
            </button>
            <button
              onClick={() => setStatusFilter('VOID')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                statusFilter === 'VOID'
                  ? 'bg-slate-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ⃠ Mansookh (Void)
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Invoices List Table                                                       */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 pl-5 pr-2">Bill No</th>
                <th className="py-3 px-3">Tareekh & Waqt</th>
                <th className="py-3 px-3">Customer / Gāhak</th>
                <th className="py-3 px-3 text-right">Net Bill</th>
                <th className="py-3 px-3 text-right">Naqad Wasool</th>
                <th className="py-3 px-3 text-right">Baqaya Rakam</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 pr-5 pl-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-bold text-slate-700">Koi invoice record nahi mila</p>
                    <p className="text-xs text-slate-500 mt-0.5">Filter tabdeel kar ke check karein.</p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const isVoid = inv.is_void === 1;
                  const net = inv.total_amount - (inv.discount_amount || 0);
                  const isPaid = !isVoid && (inv.balance_amount || 0) <= 0;
                  const isPartial = !isVoid && (inv.cash_received || 0) > 0 && (inv.balance_amount || 0) > 0;

                  return (
                    <tr
                      key={inv.id}
                      className={`hover:bg-slate-50/80 transition ${
                        isVoid ? 'opacity-40 bg-rose-50/40 line-through' : ''
                      }`}
                    >
                      {/* Bill No */}
                      <td className="py-3.5 pl-5 pr-2">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(inv)}
                          className="font-mono font-bold text-amber-700 hover:text-amber-800 hover:underline text-xs flex items-center gap-1.5"
                          title="Click to view details"
                        >
                          <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>{inv.invoice_no}</span>
                        </button>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-3 text-slate-600 font-medium">
                        <div>{formatDate(inv.invoice_date)}</div>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-3">
                        <div className="font-extrabold text-slate-900 text-xs">
                          {inv.customer_name || 'Walk-in Cash Customer'}
                        </div>
                        {inv.customer_phone && (
                          <div className="text-[11px] text-slate-500 font-mono">
                            {inv.customer_phone}
                          </div>
                        )}
                      </td>

                      {/* Net Bill */}
                      <td className="py-3.5 px-3 text-right font-black font-mono text-slate-950 text-sm">
                        {formatPKR(net)}
                        {inv.discount_amount > 0 && (
                          <div className="text-[10px] text-gray-500 font-normal">
                            Riait: -{formatPKR(inv.discount_amount)}
                          </div>
                        )}
                      </td>

                      {/* Cash Received */}
                      <td className="py-3.5 px-3 text-right font-bold font-mono text-emerald-700">
                        {formatPKR(inv.cash_received)}
                      </td>

                      {/* Balance Amount */}
                      <td className="py-3.5 px-3 text-right font-mono font-black">
                        <span className={inv.balance_amount > 0 ? 'text-rose-700 font-black' : 'text-slate-400'}>
                          {formatPKR(inv.balance_amount)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center">
                        {isVoid ? (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                            Mansookh (Void)
                          </span>
                        ) : isPaid ? (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Wasool (Paid)
                          </span>
                        ) : isPartial ? (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                            Juzwi (Partial)
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                            Udhaar (Due)
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 pr-5 pl-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Print Button */}
                          <button
                            type="button"
                            onClick={() => reprintInvoice(inv.id)}
                            className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition shadow-xs flex items-center gap-1 active:scale-95 cursor-pointer"
                            title="Print Slip (80mm / A4)"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Print</span>
                          </button>

                          {/* View Detail */}
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(inv)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition border border-slate-300 cursor-pointer"
                            title="Tafseel Dekhein (View Details)"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* WhatsApp */}
                          <button
                            type="button"
                            onClick={() => handleWhatsApp(inv)}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold transition border border-emerald-200 cursor-pointer"
                            title="WhatsApp Par Bill Bhejein"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>

                          {/* Void */}
                          {!isVoid && (
                            <button
                              type="button"
                              onClick={() => openVoidModal('invoice', inv.id, inv.invoice_no)}
                              className="px-2 py-1 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-700 border border-slate-300 hover:border-rose-300 rounded-lg text-xs font-semibold transition cursor-pointer"
                              title="Mansookh (Void) Karein"
                            >
                              Void
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Detail Modal if clicked */}
      {selectedLedgerEntry && (
        <TransactionDetailModal
          entry={selectedLedgerEntry}
          customer={selectedCustomer}
          onClose={() => {
            setSelectedLedgerEntry(null);
            setSelectedCustomer(null);
          }}
        />
      )}
    </div>
  );
};

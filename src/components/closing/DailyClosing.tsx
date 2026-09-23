import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet,
  Calendar,
  DollarSign,
  TrendingUp,
  Cpu,
  Receipt,
  ArrowDownRight,
  ArrowUpRight,
  Scale,
  Printer,
  Coins,
  CreditCard,
  Filter,
  ShoppingBag,
  Eye,
  MessageCircle,
  Calculator,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useWorkshopStore } from '../../store/useWorkshopStore';
import { summaryRepo } from '../../db/repositories/summaryRepo';
import { formatPKR, formatDate, getTodayDate } from '../../utils/currency';
import { TransactionDetailModal } from '../modals/TransactionDetailModal';
import { ExpenseDetailModal } from '../modals/ExpenseDetailModal';

export const DailyClosing: React.FC = () => {
  const today = getTodayDate();
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [activePreset, setActivePreset] = useState<'today' | 'yesterday' | 'week' | 'month' | 'custom'>('today');
  const [summary, setSummary] = useState(() => summaryRepo.getDailySummary(today, today));

  const [drillTab, setDrillTab] = useState<'sales' | 'cnc' | 'wasooli' | 'expenses' | 'profit' | 'drawings'>('sales');
  const [selectedDetailEntry, setSelectedDetailEntry] = useState<any>(null);
  const [selectedCustomerForDetail, setSelectedCustomerForDetail] = useState<any>(null);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);

  const invoices = useWorkshopStore((state) => state.invoices);
  const cncJobs = useWorkshopStore((state) => state.cncJobs);
  const expenses = useWorkshopStore((state) => state.expenses);
  const shopSettings = useWorkshopStore((state) => state.shopSettings);
  const drawings = useWorkshopStore((state) => state.drawings);
  const createDrawing = useWorkshopStore((state) => state.createDrawing);
  const deleteDrawing = useWorkshopStore((state) => state.deleteDrawing);
  const currentUser = useWorkshopStore((state) => state.currentUser);

  // Drawing Form State
  const [drawingAmount, setDrawingAmount] = useState('');
  const [drawingOwnerName, setDrawingOwnerName] = useState(currentUser?.full_name || 'Muhammad Ahmad');
  const [drawingSource, setDrawingSource] = useState<'DRAWER' | 'BANK'>('DRAWER');
  const [drawingDesc, setDrawingDesc] = useState('');

  // Cash Denomination Tally (Sham Ka Galla Counter)
  const [denominations, setDenominations] = useState<{ [key: number]: number }>({
    5000: 0,
    1000: 0,
    500: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0,
  });
  const [coinsAmount, setCoinsAmount] = useState<number>(0);
  const [isTallyExpanded, setIsTallyExpanded] = useState<boolean>(true);

  const totalCountedCash =
    Object.entries(denominations).reduce(
      (sum, [note, count]) => sum + Number(note) * (count || 0),
      0
    ) + (coinsAmount || 0);

  const cashDifference = totalCountedCash - (summary.net_drawer_cash || 0);

  const handleResetTally = () => {
    setDenominations({
      5000: 0,
      1000: 0,
      500: 0,
      100: 0,
      50: 0,
      20: 0,
      10: 0,
    });
    setCoinsAmount(0);
  };

  // Memoized period queries to eliminate main-thread freezing and lag
  const periodInvoices = useMemo(
    () => summaryRepo.getPeriodInvoices(startDate, endDate),
    [startDate, endDate, invoices]
  );
  const periodCncJobs = useMemo(
    () => summaryRepo.getPeriodCncJobs(startDate, endDate),
    [startDate, endDate, cncJobs]
  );
  const periodWasoolis = useMemo(
    () => summaryRepo.getPeriodWasoolis(startDate, endDate),
    [startDate, endDate, invoices]
  );
  const periodExpenses = useMemo(
    () => summaryRepo.getPeriodExpenses(startDate, endDate),
    [startDate, endDate, expenses]
  );

  const periodDrawings = useMemo(
    () => drawings.filter((d) => d.drawing_date >= startDate && d.drawing_date <= endDate),
    [drawings, startDate, endDate]
  );
  const totalPeriodDrawings = useMemo(
    () => periodDrawings.reduce((sum, d) => sum + d.amount, 0),
    [periodDrawings]
  );

  const totalPeriodRevenue = summary.total_sales_volume + summary.total_cnc_volume;
  const totalPeriodCosts =
    summary.total_expenses +
    (summary.total_karigar_payments || 0) +
    (summary.total_supplier_payments || 0);
  const netProfit = totalPeriodRevenue - totalPeriodCosts;

  useEffect(() => {
    try {
      const data = summaryRepo.getDailySummary(startDate, endDate);
      setSummary(data);
    } catch (e) {
      console.error('Summary fetch error:', e);
    }
  }, [startDate, endDate, invoices, cncJobs, expenses]);

  const handlePrint = () => {
    window.print();
  };

  const isRange = startDate !== endDate;

  const handleWhatsAppSummary = () => {
    let msg = `*AL MADINAH CNC AND WOOD WORKS*\n`;
    msg += `*Roznamcha & Daily Closing Report*\n`;
    msg += `Tareekh: ${formatDate(startDate)}${isRange ? ` se ${formatDate(endDate)}` : ''}\n`;
    msg += `-----------------------------\n`;
    msg += `🛒 *Kul Sales Volume:* ${formatPKR(summary.total_sales_volume)} (Cash: ${formatPKR(summary.cash_sales_received)} | Udhaar: ${formatPKR(summary.udhaar_sales)})\n`;
    msg += `⚙️ *CNC Kaam:* ${formatPKR(summary.total_cnc_volume)} (Advance: ${formatPKR(summary.cnc_cash_received)})\n`;
    msg += `💵 *Khata Wasooli:* ${formatPKR(summary.khata_wasooli_received)}\n`;
    msg += `💸 *Kul Kharajat:* ${formatPKR(summary.total_expenses)}\n`;
    msg += `-----------------------------\n`;
    msg += `💰 *NET GALLA CASH (دکان پر کیش): ${formatPKR(summary.net_drawer_cash)}*\n`;
    if (totalCountedCash > 0) {
      msg += `💵 *Fizikal Galla Cash (Ginay Huay Note):* ${formatPKR(totalCountedCash)}\n`;
      if (cashDifference === 0) {
        msg += `✅ *Farq:* Bilkul Barabar (Exact Match)\n`;
      } else if (cashDifference > 0) {
        msg += `ℹ️ *Farq:* +${formatPKR(cashDifference)} Ziada (Surplus)\n`;
      } else {
        msg += `⚠️ *Farq:* -${formatPKR(Math.abs(cashDifference))} Kam (Shortage)\n`;
      }
    }
    msg += `📌 *Market Udhaar Baqaya:* ${formatPKR(summary.total_market_receivables)}\n`;
    msg += `-----------------------------\n`;
    msg += `Shukriya! ${shopSettings.shop_name}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handlePreset = (preset: 'today' | 'yesterday' | 'week' | 'month') => {
    setActivePreset(preset);
    const now = new Date();

    if (preset === 'today') {
      const t = getTodayDate();
      setStartDate(t);
      setEndDate(t);
    } else if (preset === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split('T')[0];
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (preset === 'week') {
      const w = new Date(now);
      w.setDate(w.getDate() - 7);
      const wStr = w.toISOString().split('T')[0];
      setStartDate(wStr);
      setEndDate(today);
    } else if (preset === 'month') {
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const mStr = `${year}-${month}-01`;
      setStartDate(mStr);
      setEndDate(today);
    }
  };

  return (
    <div className="h-[calc(100vh-105px)] overflow-y-auto bg-slate-100 p-4 md:p-6 space-y-6">
      {/* Top Header & Date Filter Bar */}
      <div className="no-print bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span>Hisab Kitab & Closing Report</span>
                <span className="text-amber-700 font-urdu text-base font-semibold">(روزنامچہ و حساب)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Counter sales, CNC jobs, expenses aur cash drawer ka mukammal hisab
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              onClick={handleWhatsAppSummary}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-sm active:scale-95"
              title="Roznamcha Summary WhatsApp Par Share Karein"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Summary</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-sm active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print Hisab Report / PDF</span>
            </button>
          </div>
        </div>

        {/* Date Presets & Range Selector */}
        <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          {/* Presets */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => handlePreset('today')}
              className={`px-3 py-1.5 rounded-lg font-bold transition text-xs ${
                activePreset === 'today'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => handlePreset('yesterday')}
              className={`px-3 py-1.5 rounded-lg font-bold transition text-xs cursor-pointer ${
                activePreset === 'yesterday'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              Yesterday
            </button>
            <button
              onClick={() => handlePreset('week')}
              className={`px-3 py-1.5 rounded-lg font-bold transition text-xs cursor-pointer ${
                activePreset === 'week'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => handlePreset('month')}
              className={`px-3 py-1.5 rounded-lg font-bold transition text-xs cursor-pointer ${
                activePreset === 'month'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              This Month
            </button>
          </div>

          {/* Date Range Inputs */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 uppercase">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setActivePreset('custom');
                }}
                className="bg-transparent text-xs text-slate-900 focus:outline-none font-bold font-mono"
              />
            </div>

            <span className="text-slate-400 text-xs font-bold">➔</span>

            <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 uppercase">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setActivePreset('custom');
                }}
                className="bg-transparent text-xs text-slate-900 focus:outline-none font-bold font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Printable Area Container */}
      <div id="closing-report-area">
        {/* Printable Header */}
        <div className="print-only mb-6 border-b-2 border-black pb-3 text-black">
          <h1 className="text-xl font-black">AL MADINAH CNC AND WOOD WORKS</h1>
          <p className="text-xs font-urdu font-bold">المدینہ سی این سی اینڈ ووڈ ورکس - روزنامچہ و حساب رپورٹ</p>
          <p className="text-xs mt-1">
            <strong>Tareekh:</strong> {formatDate(startDate)}
            {isRange && <span> se {formatDate(endDate)}</span>}
          </p>
        </div>

        {/* 6 KEY SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Total Sales Volume */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-600 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">1. Total Sales Volume</span>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {formatPKR(summary.total_sales_volume)}
              </div>
              <div className="flex justify-between text-[11px] text-slate-600 mt-2 pt-2 border-t border-slate-100">
                <span>Naqad (Cash): <strong className="text-emerald-700 font-mono">{formatPKR(summary.cash_sales_received)}</strong></span>
                <span>Udhaar: <strong className="text-rose-700 font-mono">{formatPKR(summary.udhaar_sales)}</strong></span>
              </div>
            </div>
          </div>

          {/* Card 2: CNC Work Total */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-600 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">2. CNC Work Total</span>
              <Cpu className="w-4 h-4 text-cyan-600" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {formatPKR(summary.total_cnc_volume)}
              </div>
              <div className="flex justify-between text-[11px] text-slate-600 mt-2 pt-2 border-t border-slate-100">
                <span>CNC Cash Wasool: <strong className="text-emerald-700 font-mono">{formatPKR(summary.cnc_cash_received)}</strong></span>
                <span>Remaining: <strong className="text-rose-700 font-mono">{formatPKR(Math.max(0, summary.total_cnc_volume - summary.cnc_cash_received))}</strong></span>
              </div>
            </div>
          </div>

          {/* Card 3: Total Cash Inflow Breakdown */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-600 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">3. Cash Inflow (آمدن)</span>
              <ArrowDownRight className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-700 font-mono">
                {formatPKR(summary.total_cash_inflow)}
              </div>
              <div className="text-[11px] text-slate-600 mt-2 pt-2 border-t border-slate-100 space-y-0.5">
                <div className="flex justify-between">
                  <span>Counter Sales Cash:</span>
                  <span className="font-bold text-slate-900 font-mono">{formatPKR(summary.cash_sales_received)}</span>
                </div>
                <div className="flex justify-between">
                  <span>CNC Advance/Cash:</span>
                  <span className="font-bold text-slate-900 font-mono">{formatPKR(summary.cnc_cash_received)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Khata Wasooli (Recovery):</span>
                  <span className="font-bold text-emerald-700 font-mono">{formatPKR(summary.khata_wasooli_received)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Total Cash Outflow */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-600 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">4. Cash Outflow (کل خرچ و ادائیگیاں)</span>
              <ArrowUpRight className="w-4 h-4 text-rose-600" />
            </div>
            <div>
              <div className="text-2xl font-black text-rose-700 font-mono">
                {formatPKR(summary.total_cash_outflow ?? summary.total_expenses)}
              </div>
              <div className="text-[11px] text-slate-600 mt-2 pt-2 border-t border-slate-100 space-y-0.5">
                <div className="flex justify-between">
                  <span>Dukan Kharajat:</span>
                  <span className="font-bold text-slate-900 font-mono">{formatPKR(summary.total_expenses)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Suppliers Adaigi:</span>
                  <span className="font-bold text-slate-900 font-mono">{formatPKR(summary.total_supplier_payments || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Karigar Wages/Advance:</span>
                  <span className="font-bold text-slate-900 font-mono">{formatPKR(summary.total_karigar_payments || 0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 5: Net Drawer Cash (GALLA BALANCE) */}
          <div className="bg-emerald-50/70 border-2 border-emerald-500/80 rounded-2xl p-5 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between text-emerald-800 mb-2">
              <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wider">
                <Coins className="w-4 h-4" />
                <span>5. Net Galla Cash (دکان پر نقد)</span>
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                Drawer Cash
              </span>
            </div>
            <div>
              <div className="text-3xl font-black text-emerald-800 font-mono">
                {formatPKR(summary.net_drawer_cash)}
              </div>
              {totalCountedCash > 0 ? (
                <div className="mt-2 pt-2 border-t border-emerald-200 text-xs flex justify-between items-center">
                  <span className="font-bold text-slate-700">Counted: {formatPKR(totalCountedCash)}</span>
                  <span
                    className={`font-mono font-bold px-1.5 py-0.5 rounded text-[11px] ${
                      cashDifference === 0
                        ? 'bg-emerald-200 text-emerald-900'
                        : cashDifference > 0
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {cashDifference === 0
                      ? '✓ Matched'
                      : cashDifference > 0
                      ? `+${formatPKR(cashDifference)}`
                      : `-${formatPKR(Math.abs(cashDifference))}`}
                  </span>
                </div>
              ) : (
                <div className="text-xs text-slate-700 mt-2 pt-2 border-t border-emerald-200 leading-relaxed font-urdu">
                  یہ رقم اس وقت آپ کے دراز یا گلہ کے اندر فزیکل کیش کی صورت میں ہونی چاہئے۔
                </div>
              )}
            </div>
          </div>

          {/* Card 6: Market Receivables & Supplier Payables */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-600 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">6. Market Hisab (ادھار و دینداریاں)</span>
              <Scale className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-black text-amber-700 font-mono">
                {formatPKR(summary.total_market_receivables)}
              </div>
              <div className="text-[11px] text-slate-600 mt-2 pt-2 border-t border-slate-100 space-y-0.5">
                <div className="flex justify-between">
                  <span>Gāhak Udhaar (Lena):</span>
                  <span className="font-bold text-amber-800 font-mono">{formatPKR(summary.total_market_receivables)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Suppliers Dena:</span>
                  <span className="font-bold text-rose-700 font-mono">{formatPKR(summary.total_supplier_payables || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SHAM KA GALLA TALLY (Note Denomination Counter)                          */}
        {/* ========================================================================= */}
        <div className="no-print mt-6 bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm">
          <div
            className="flex items-center justify-between cursor-pointer select-none"
            onClick={() => setIsTallyExpanded(!isTallyExpanded)}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-black text-slate-900 text-sm">
                    Sham Ka Galla Tally (شام کا گلہ کاؤنٹر - نوٹ شماری)
                  </h3>
                  {totalCountedCash > 0 && (
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        cashDifference === 0
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : cashDifference > 0
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {cashDifference === 0
                        ? '✓ Exact Match'
                        : cashDifference > 0
                        ? `Surplus +${formatPKR(cashDifference)}`
                        : `Shortage -${formatPKR(Math.abs(cashDifference))}`}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Dukan band kartay waqt galla ke 5000, 1000, 500, 100 ke note gin kar milayein.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {totalCountedCash > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResetTally();
                  }}
                  className="px-2.5 py-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-slate-200"
                  title="Reset counter"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
              <div className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                {isTallyExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </div>
          </div>

          {isTallyExpanded && (
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
              {/* Denomination inputs grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                {[5000, 1000, 500, 100, 50, 20, 10].map((note) => {
                  const count = denominations[note] || 0;
                  const lineTotal = note * count;

                  return (
                    <div
                      key={note}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center flex flex-col justify-between focus-within:border-amber-400 focus-within:ring-1 focus-within:ring-amber-400"
                    >
                      <div className="text-[11px] font-black text-slate-700">
                        Rs. {note.toLocaleString()}
                      </div>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={count === 0 ? '' : count}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value) || 0);
                          setDenominations((prev) => ({ ...prev, [note]: val }));
                        }}
                        className="w-full text-center font-mono font-bold text-sm bg-white border border-slate-200 rounded-lg py-1 mt-1.5 focus:outline-none focus:border-amber-500"
                      />
                      <div className="text-[10px] font-mono text-slate-500 font-bold mt-1.5 truncate">
                        = {formatPKR(lineTotal)}
                      </div>
                    </div>
                  );
                })}

                {/* Khulla / Coins */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center flex flex-col justify-between focus-within:border-amber-400 focus-within:ring-1 focus-within:ring-amber-400">
                  <div className="text-[11px] font-black text-slate-700">
                    Sikka / Khulla
                  </div>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={coinsAmount === 0 ? '' : coinsAmount}
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value) || 0);
                      setCoinsAmount(val);
                    }}
                    className="w-full text-center font-mono font-bold text-sm bg-white border border-slate-200 rounded-lg py-1 mt-1.5 focus:outline-none focus:border-amber-500"
                  />
                  <div className="text-[10px] font-mono text-slate-500 font-bold mt-1.5 truncate">
                    = {formatPKR(coinsAmount)}
                  </div>
                </div>
              </div>

              {/* Tally Comparison Bar */}
              <div className="bg-slate-100 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 border border-slate-200">
                <div className="flex items-center gap-6 flex-wrap">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Ginay Gaye Note:</span>
                    <span className="text-lg font-black font-mono text-slate-900">{formatPKR(totalCountedCash)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">System Net Drawer Cash:</span>
                    <span className="text-lg font-black font-mono text-slate-700">{formatPKR(summary.net_drawer_cash)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className={`px-4 py-2 rounded-xl border flex items-center gap-2 ${
                      cashDifference === 0
                        ? 'bg-emerald-100/70 border-emerald-300 text-emerald-800'
                        : cashDifference > 0
                        ? 'bg-blue-100/70 border-blue-300 text-blue-800'
                        : 'bg-rose-100/70 border-rose-300 text-rose-800'
                    }`}
                  >
                    {cashDifference === 0 ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <div>
                          <div className="text-xs font-black">Galla Barabar Hai (No Farq)</div>
                          <div className="text-[10px] opacity-80">Drawer cash matches system exactly</div>
                        </div>
                      </>
                    ) : cashDifference > 0 ? (
                      <>
                        <AlertTriangle className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="text-xs font-black">+{formatPKR(cashDifference)} Ziada Cash (Surplus)</div>
                          <div className="text-[10px] opacity-80">Galla mein system se ziada cash hai</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-5 h-5 text-rose-600" />
                        <div>
                          <div className="text-xs font-black">-{formatPKR(Math.abs(cashDifference))} Cash Kam Hai (Shortage)</div>
                          <div className="text-[10px] opacity-80">Koi kharcha ya entry darj honay se reh gayi hai</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* ROZNAMCHA DETAILED ITEM-BY-ITEM DRILL-DOWN SECTION                        */}
        {/* ========================================================================= */}
        <div className="mt-8 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          {/* Header with Tabs */}
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span>Tafseeli Roznamcha (Itemized Breakdown)</span>
                <span className="text-[11px] font-normal text-slate-500 font-mono">
                  ({formatDate(startDate)} {isRange ? `se ${formatDate(endDate)}` : ''})
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Is doran ke tamam sales bills, CNC orders, wasoolian aur dukan ke kharajat ki tafseel.
              </p>
            </div>

            {/* Drill-down Tabs */}
            <div className="no-print flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setDrillTab('sales')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  drillTab === 'sales'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Sales Bills ({periodInvoices.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setDrillTab('cnc')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  drillTab === 'cnc'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>CNC Orders ({periodCncJobs.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setDrillTab('wasooli')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  drillTab === 'wasooli'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Wasooli ({periodWasoolis.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setDrillTab('expenses')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  drillTab === 'expenses'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Kharajat ({periodExpenses.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setDrillTab('profit')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  drillTab === 'profit'
                    ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Munafa / P&L (نفع و نقصان)</span>
              </button>

              <button
                type="button"
                onClick={() => setDrillTab('drawings')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  drillTab === 'drawings'
                    ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Owner Drawings ({periodDrawings.length})</span>
              </button>
            </div>
          </div>

          {/* Drill-down Table View */}
          <div className="overflow-x-auto">
            {/* Tab 1: Sales Bills */}
            {drillTab === 'sales' && (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 pl-4 pr-2">Bill No</th>
                    <th className="py-2.5 px-2">Tareekh</th>
                    <th className="py-2.5 px-2">Gāhak (Customer)</th>
                    <th className="py-2.5 px-2 text-right">Kul Bill</th>
                    <th className="py-2.5 px-2 text-right text-emerald-700">Naqad (Cash)</th>
                    <th className="py-2.5 px-2 text-right text-rose-700">Udhaar</th>
                    <th className="no-print py-2.5 pr-4 pl-2 text-center w-24">Tafseel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {periodInvoices.map((inv: any) => (
                    <tr
                      key={inv.id}
                      onClick={() => {
                        setSelectedDetailEntry({
                          id: inv.id,
                          ref_type: 'SALE_INVOICE',
                          ref_id: inv.id,
                          entry_date: inv.invoice_date,
                          debit: inv.balance_amount,
                          credit: 0,
                          description: `Sale Bill #${inv.invoice_no}`,
                          is_void: inv.is_void,
                        });
                        setSelectedCustomerForDetail({
                          id: inv.customer_id,
                          name: inv.customer_name || 'Walk-in Customer',
                          phone: inv.customer_phone,
                        });
                      }}
                      className="hover:bg-amber-50/70 transition cursor-pointer group"
                    >
                      <td className="py-2.5 pl-4 pr-2 font-mono font-bold text-amber-900">
                        {inv.invoice_no}
                      </td>
                      <td className="py-2.5 px-2 font-mono text-slate-600">{formatDate(inv.invoice_date)}</td>
                      <td className="py-2.5 px-2 font-bold text-slate-900">
                        {inv.customer_name || 'Walk-in'}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900">
                        {formatPKR(inv.total_amount - (inv.discount_amount || 0))}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-emerald-700">
                        {formatPKR(inv.cash_received)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-black text-rose-700">
                        {inv.balance_amount > 0 ? formatPKR(inv.balance_amount) : '-'}
                      </td>
                      <td className="no-print py-2.5 pr-4 pl-2 text-center">
                        <button
                          type="button"
                          className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 group-hover:bg-amber-500 group-hover:text-slate-950 font-bold text-[11px] transition shadow-xs inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3 text-amber-600 group-hover:text-slate-950" />
                          <span>Tafseel</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {periodInvoices.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400">
                        Is doran koi sales bill record nahi mila.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {/* Tab 2: CNC Orders */}
            {drillTab === 'cnc' && (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 pl-4 pr-2">Job Token</th>
                    <th className="py-2.5 px-2">Tareekh</th>
                    <th className="py-2.5 px-2">Gāhak</th>
                    <th className="py-2.5 px-2">Kaam (Description)</th>
                    <th className="py-2.5 px-2">Size / Sheet</th>
                    <th className="py-2.5 px-2 text-center">Status</th>
                    <th className="py-2.5 px-2 text-right">Tay Raqam</th>
                    <th className="py-2.5 pr-4 pl-2 text-right text-emerald-700">Advance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {periodCncJobs.map((job: any) => (
                    <tr
                      key={job.id}
                      onClick={() => {
                        setSelectedDetailEntry({
                          id: job.id,
                          ref_type: 'CNC_JOB',
                          ref_id: job.id,
                          entry_date: job.job_date,
                          debit: job.remaining_amount,
                          credit: 0,
                          description: `CNC Job #${job.job_no}: ${job.job_description}`,
                          is_void: job.is_void,
                        });
                        setSelectedCustomerForDetail({
                          id: job.customer_id,
                          name: job.customer_name || job.customer_name_manual || 'Walk-in',
                          phone: job.customer_phone,
                        });
                      }}
                      className="hover:bg-amber-50/70 transition cursor-pointer group"
                    >
                      <td className="py-2.5 pl-4 pr-2 font-mono font-bold text-cyan-800">
                        {job.job_no}
                      </td>
                      <td className="py-2.5 px-2 font-mono text-slate-600">{formatDate(job.job_date)}</td>
                      <td className="py-2.5 px-2 font-bold text-slate-900">
                        {job.customer_name || job.customer_name_manual || 'Walk-in'}
                      </td>
                      <td className="py-2.5 px-2 text-slate-800">{job.job_description}</td>
                      <td className="py-2.5 px-2 text-slate-600">{job.size_specification || '-'}</td>
                      <td className="py-2.5 px-2 text-center">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200">
                          {job.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900">
                        {formatPKR(job.total_amount)}
                      </td>
                      <td className="py-2.5 pr-4 pl-2 text-right font-mono font-bold text-emerald-700">
                        {formatPKR(job.paid_amount)}
                      </td>
                    </tr>
                  ))}
                  {periodCncJobs.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-400">
                        Is doran koi CNC order record nahi mila.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {/* Tab 3: Khata Wasooli */}
            {drillTab === 'wasooli' && (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 pl-4 pr-2">Tareekh</th>
                    <th className="py-2.5 px-2">Gāhak (Customer)</th>
                    <th className="py-2.5 px-2">Tafseel / Description</th>
                    <th className="py-2.5 pr-4 pl-2 text-right text-emerald-700">Wasool Shuda Rakam</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {periodWasoolis.map((w: any) => (
                    <tr key={w.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 pl-4 pr-2 font-mono text-slate-600">{formatDate(w.entry_date)}</td>
                      <td className="py-2.5 px-2 font-bold text-slate-900">{w.customer_name || 'Customer'}</td>
                      <td className="py-2.5 px-2 text-slate-600">{w.description}</td>
                      <td className="py-2.5 pr-4 pl-2 text-right font-mono font-black text-emerald-700 text-sm">
                        + {formatPKR(w.credit)}
                      </td>
                    </tr>
                  ))}
                  {periodWasoolis.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-slate-400">
                        Is doran koi wasooli record nahi mili.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {/* Tab 4: Kharajat */}
            {drillTab === 'expenses' && (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 pl-4 pr-2">Tareekh</th>
                    <th className="py-2.5 px-2">Category</th>
                    <th className="py-2.5 px-2">Wazahat (Description)</th>
                    <th className="py-2.5 pr-4 pl-2 text-right text-rose-700">Kharcha Rakam</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {periodExpenses.map((exp: any) => (
                    <tr
                      key={exp.id}
                      onClick={() => setSelectedExpense(exp)}
                      className="hover:bg-amber-50/70 transition cursor-pointer group"
                    >
                      <td className="py-2.5 pl-4 pr-2 font-mono text-slate-600">{formatDate(exp.expense_date)}</td>
                      <td className="py-2.5 px-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-slate-800 font-medium">{exp.description}</td>
                      <td className="py-2.5 pr-4 pl-2 text-right font-mono font-black text-rose-700">
                        - {formatPKR(exp.amount)}
                      </td>
                    </tr>
                  ))}
                  {periodExpenses.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-slate-400">
                        Is doran koi kharcha darj nahi hai.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {/* Tab 5: Munafa & Net Profit / Loss */}
            {drillTab === 'profit' && (
              <div className="p-5 space-y-5">
                {/* Main Profit Card */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest block font-mono">
                      PERIOD FINANCIAL STATEMENT ({formatDate(startDate)} {isRange ? `se ${formatDate(endDate)}` : ''})
                    </span>
                    <h4 className="text-xl font-black mt-0.5">
                      Net Profit / Munafa & Nuqsan (خالص نفع و نقصان)
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 max-w-md">
                      Aamadni (Sales + CNC) me se khareedari, karigar mazdoori aur factory kharajat nikaal kar baqi bacha hua saaf munafa.
                    </p>
                  </div>

                  <div className="bg-white/10 border border-white/10 rounded-2xl p-4 text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-300 block">
                      KHALIS MUNAFA (NET PROFIT):
                    </span>
                    <div
                      className={`text-3xl font-black font-mono mt-1 ${
                        netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {formatPKR(netProfit)}
                    </div>
                  </div>
                </div>

                {/* 2 Side-by-Side Breakdown Columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Revenue Inflow */}
                  <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                      <span className="font-black text-emerald-900 text-sm uppercase">
                        (+) Gross Revenue (کل آمدنی)
                      </span>
                      <span className="text-base font-black text-emerald-800 font-mono">
                        {formatPKR(totalPeriodRevenue)}
                      </span>
                    </div>

                    <div className="space-y-2 text-slate-700">
                      <div className="flex justify-between">
                        <span>Counter POS Sales Volume:</span>
                        <strong className="font-mono">{formatPKR(summary.total_sales_volume)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>CNC Routing & Carving Volume:</span>
                        <strong className="font-mono">{formatPKR(summary.total_cnc_volume)}</strong>
                      </div>
                      <div className="flex justify-between text-slate-500 pt-1 border-t border-emerald-100 text-[11px]">
                        <span>Naqad Wasool Hua (Cash Inflow):</span>
                        <span className="font-mono font-bold text-emerald-700">{formatPKR(summary.total_cash_inflow)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Operational Costs */}
                  <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-rose-200 pb-2">
                      <span className="font-black text-rose-900 text-sm uppercase">
                        (−) Total Costs (کل اخراجات و ادائیگیاں)
                      </span>
                      <span className="text-base font-black text-rose-800 font-mono">
                        {formatPKR(totalPeriodCosts)}
                      </span>
                    </div>

                    <div className="space-y-2 text-slate-700">
                      <div className="flex justify-between">
                        <span>Material & Supplier Purchases:</span>
                        <strong className="font-mono text-rose-700">-{formatPKR(summary.total_supplier_payments || 0)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Karigar Wages & Advances:</span>
                        <strong className="font-mono text-rose-700">-{formatPKR(summary.total_karigar_payments || 0)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Factory Kharajat (Rent, Bijli, Mess, Tools):</span>
                        <strong className="font-mono text-rose-700">-{formatPKR(summary.total_expenses)}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Market Position Balance Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs">
                  <span className="font-bold text-slate-800 uppercase block mb-2">
                    Market Net Position (مارکیٹ میں مجموعی پوزیشن):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Gāhak Udhaar (Lena Hai):</span>
                      <span className="text-base font-black text-amber-700 font-mono mt-0.5 block">{formatPKR(summary.total_market_receivables)}</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Suppliers Dues (Dena Hai):</span>
                      <span className="text-base font-black text-rose-700 font-mono mt-0.5 block">{formatPKR(summary.total_supplier_payables || 0)}</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Net Market Surplus (صاف لینا):</span>
                      <span className="text-base font-black text-emerald-700 font-mono mt-0.5 block">
                        {formatPKR(Math.max(0, summary.total_market_receivables - (summary.total_supplier_payables || 0)))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 6: Owner Drawings (Zati Kharcha) */}
            {drillTab === 'drawings' && (
              <div className="p-5 space-y-5">
                {/* Form to log new drawing */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const amt = parseFloat(drawingAmount) || 0;
                    if (amt <= 0) return;
                    createDrawing({
                      drawing_date: getTodayDate(),
                      owner_name: drawingOwnerName.trim() || 'Admin',
                      amount: amt,
                      source: drawingSource,
                      description: drawingDesc.trim() || 'Zati Zaroorat',
                    });
                    setDrawingAmount('');
                    setDrawingDesc('');
                  }}
                  className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 text-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-amber-900 text-sm flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-amber-700" />
                      <span>Record Owner Drawing (مالک کا ذاتی خرچہ)</span>
                    </span>
                    <span className="text-[11px] text-amber-800">
                      Yeh raqam dukan ke operational kharche me shamil nahi hogi
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Owner Name</label>
                      <input
                        type="text"
                        required
                        value={drawingOwnerName}
                        onChange={(e) => setDrawingOwnerName(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Amount (رقم)</label>
                      <input
                        type="number"
                        min="1"
                        required
                        placeholder="Rs."
                        value={drawingAmount}
                        onChange={(e) => setDrawingAmount(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 font-black text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Source (رقم کہاں سے لی)</label>
                      <select
                        value={drawingSource}
                        onChange={(e) => setDrawingSource(e.target.value as any)}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold text-slate-800"
                      >
                        <option value="DRAWER">Dukan Galla (Cash Till)</option>
                        <option value="BANK">Bank Account / EasyPaisa</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Description (تفصیل)</label>
                      <input
                        type="text"
                        placeholder="Ghar ka kharcha / Zati zaroorat"
                        value={drawingDesc}
                        onChange={(e) => setDrawingDesc(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 font-medium text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-4 py-2 rounded-xl text-xs shadow-md transition"
                    >
                      + Save Owner Drawing
                    </button>
                  </div>
                </form>

                {/* Drawings Table */}
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 pl-4 pr-2">Tareekh</th>
                      <th className="py-2.5 px-2">Owner Name</th>
                      <th className="py-2.5 px-2">Source</th>
                      <th className="py-2.5 px-2">Description</th>
                      <th className="py-2.5 px-2 text-right">Amount</th>
                      <th className="py-2.5 pr-4 pl-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {periodDrawings.map((dr) => (
                      <tr key={dr.id} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 pl-4 pr-2 font-mono text-slate-600">{formatDate(dr.drawing_date)}</td>
                        <td className="py-2.5 px-2 font-bold text-slate-900">{dr.owner_name}</td>
                        <td className="py-2.5 px-2 font-bold text-slate-600">
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                            {dr.source}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-slate-700">{dr.description}</td>
                        <td className="py-2.5 px-2 text-right font-mono font-black text-rose-700">
                          {formatPKR(dr.amount)}
                        </td>
                        <td className="py-2.5 pr-4 pl-2 text-right">
                          <button
                            onClick={() => {
                              if (window.confirm('Delete this drawing entry?')) {
                                deleteDrawing(dr.id);
                              }
                            }}
                            className="text-slate-400 hover:text-rose-600 font-bold p-1"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {periodDrawings.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-400">
                          Is doran koi owner drawing darj nahi hui.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transaction Detail Breakdown Modal */}
      <TransactionDetailModal
        entry={selectedDetailEntry}
        customer={selectedCustomerForDetail}
        onClose={() => {
          setSelectedDetailEntry(null);
          setSelectedCustomerForDetail(null);
        }}
      />

      {/* Expense Detail Modal */}
      <ExpenseDetailModal
        expense={selectedExpense}
        onClose={() => setSelectedExpense(null)}
      />
    </div>
  );
};

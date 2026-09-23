import React, { useState } from 'react';
import {
  Users,
  Calendar,
  Plus,
  HandCoins,
  CheckCircle2,
  Clock,
  XCircle,
  Coffee,
  DollarSign,
  Phone,
  Printer,
  Trash2,
  Eye,
  Send,
  CalendarRange,
} from 'lucide-react';
import { useWorkshopStore } from '../../store/useWorkshopStore';
import { Karigar, AttendanceStatus, WeeklyKarigarSummary } from '../../types';
import { formatPKR, formatDate, getTodayDate } from '../../utils/currency';
import { QuickKarigarModal } from '../modals/QuickKarigarModal';
import { KarigarPaymentModal } from '../modals/KarigarPaymentModal';
import { KarigarHistoryModal } from '../modals/KarigarHistoryModal';
import { sendWhatsAppMessage } from '../../utils/whatsapp';

export const KarigarRegister: React.FC = () => {
  const karigars = useWorkshopStore((state) => state.karigars);
  const karigarAttendance = useWorkshopStore((state) => state.karigarAttendance);
  const karigarPayments = useWorkshopStore((state) => state.karigarPayments);
  const saveKarigarAttendance = useWorkshopStore((state) => state.saveKarigarAttendance);
  const deleteKarigar = useWorkshopStore((state) => state.deleteKarigar);
  const shopSettings = useWorkshopStore((state) => state.shopSettings);
  const getWeeklyKarigarSummary = useWorkshopStore((state) => state.getWeeklyKarigarSummary);

  const [activeTab, setActiveTab] = useState<'DAILY' | 'WEEKLY'>('DAILY');
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [isQuickKarigarOpen, setIsQuickKarigarOpen] = useState(false);
  const [activeKarigarForPayment, setActiveKarigarForPayment] = useState<Karigar | null>(null);
  const [activeKarigarForHistory, setActiveKarigarForHistory] = useState<Karigar | null>(null);

  // Weekly Date Range (defaults to last 6 days)
  const d = new Date();
  d.setDate(d.getDate() - 6);
  const sixDaysAgo = d.toISOString().split('T')[0];
  const [weekStartDate, setWeekStartDate] = useState(sixDaysAgo);
  const [weekEndDate, setWeekEndDate] = useState(getTodayDate());

  // Map of karigar_id -> status for selected date
  const attMap: Record<number, AttendanceStatus> = {};
  for (const a of karigarAttendance) {
    if (a.att_date === selectedDate) {
      attMap[a.karigar_id] = a.status;
    }
  }

  // Weekly summary data
  const weeklySummary = getWeeklyKarigarSummary(weekStartDate, weekEndDate);
  const totalWeeklyEarned = weeklySummary.reduce((sum, k) => sum + k.earned_wages, 0);
  const totalWeeklyAdvance = weeklySummary.reduce((sum, k) => sum + k.advance_taken, 0);
  const totalWeeklyNetPayable = weeklySummary.reduce((sum, k) => sum + k.net_payable, 0);

  const handleWhatsAppWeeklySlip = (kSummary: WeeklyKarigarSummary) => {
    const k = karigars.find((x) => x.id === kSummary.karigar_id);
    const lines = [
      `🪵 *${shopSettings.shop_name}*`,
      `🗓️ *HAFTAWAAR HISAB (ہفتہ وار اجرت پرچی)*`,
      `━━━━━━━━━━━━━━━━━━`,
      `Karigar: *${kSummary.karigar_name}* (${kSummary.role})`,
      `Hafta: ${formatDate(weekStartDate)} ta ${formatDate(weekEndDate)}`,
      `Dihaari Rate: Rs. ${kSummary.daily_wage.toLocaleString()} / din`,
      `━━━━━━━━━━━━━━━━━━`,
      `*HAZRI TAFSEEL:*`,
      `• Poori Hazri (Present): ${kSummary.days_present} din`,
      kSummary.days_half > 0 ? `• Aadha Din (Half Day): ${kSummary.days_half} din` : '',
      kSummary.days_absent > 0 ? `• Chutti (Absent): ${kSummary.days_absent} din` : '',
      `━━━━━━━━━━━━━━━━━━`,
      `Kul Banne Wali Dihaari: Rs. ${kSummary.earned_wages.toLocaleString()}`,
      `Menha Advance (Kharcha): -Rs. ${kSummary.advance_taken.toLocaleString()}`,
      `━━━━━━━━━━━━━━━━━━`,
      `*SAF WAJIB-UL-ADA (NET PAYABLE): ${formatPKR(kSummary.net_payable)}*`,
      `━━━━━━━━━━━━━━━━━━`,
      `Shukriya! 📞 ${shopSettings.phone1}`,
    ];
    sendWhatsAppMessage(k?.phone || '', lines.filter(Boolean).join('\n'));
  };

  // Calculate today's summary
  let presentCount = 0;
  let halfDayCount = 0;
  let absentCount = 0;
  let totalWagesToday = 0;

  for (const k of karigars) {
    if (!k.is_active) continue;
    const status = attMap[k.id];
    if (status === 'PRESENT') {
      presentCount++;
      totalWagesToday += k.daily_wage;
    } else if (status === 'HALF_DAY') {
      halfDayCount++;
      totalWagesToday += k.daily_wage / 2;
    } else if (status === 'ABSENT') {
      absentCount++;
    }
  }

  const handleStatusChange = (karigarId: number, newStatus: AttendanceStatus) => {
    saveKarigarAttendance(karigarId, selectedDate, newStatus);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="h-[calc(100vh-105px)] overflow-y-auto bg-slate-100 p-4 md:p-6 space-y-6">
      {/* Top Header & Date Selector */}
      <div className="no-print bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900">
              Karigar Register & Wages (کاریگر حاضری و دیہاڑی)
            </h2>
            <p className="text-xs text-slate-500">
              Workshop ke karigar, mistri aur helpers ki daily hazri aur advance/dihaari ka hisab.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 shadow-sm font-mono">
            <Calendar className="w-4 h-4 text-amber-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-slate-900 focus:outline-none font-bold"
            />
          </div>

          <button
            onClick={() => setIsQuickKarigarOpen(true)}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ Naya Karigar</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-4 h-4 text-amber-600" />
            <span>Print Sheet</span>
          </button>
        </div>
      </div>

      {/* View Switcher: Daily Attendance vs Weekly Settlement */}
      <div className="no-print flex items-center gap-2 bg-slate-200/80 p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('DAILY')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
            activeTab === 'DAILY'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4 text-amber-600" />
          <span>Daily Attendance</span>
        </button>
        <button
          onClick={() => setActiveTab('WEEKLY')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
            activeTab === 'WEEKLY'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CalendarRange className="w-4 h-4 text-emerald-600" />
          <span>Weekly Settlement</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 1. DAILY ATTENDANCE VIEW */}
      {/* ============================================================== */}
      {activeTab === 'DAILY' && (
        <>
          {/* 4 Summary Cards for Today's Attendance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Hazir Karigar (Present)
                </span>
                <div className="text-2xl font-black text-emerald-700 font-mono mt-1">{presentCount} Karigar</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Aadha Din (Half Day)
                </span>
                <div className="text-2xl font-black text-cyan-700 font-mono mt-1">{halfDayCount} Karigar</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Ghair Hazir (Absent)
                </span>
                <div className="text-2xl font-black text-rose-700 font-mono mt-1">{absentCount} Karigar</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700">
                <XCircle className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Aaj Ki Kul Banne Wali Dihaari
                </span>
                <div className="text-2xl font-black text-amber-700 font-mono mt-1">
                  {formatPKR(totalWagesToday)}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Attendance Register Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm" id="printable-area">
            <div className="print-only p-4 border-b-2 border-black pb-3 text-black">
              <h1 className="text-xl font-black uppercase">{shopSettings.shop_name}</h1>
              <p className="text-xs font-urdu font-bold">{shopSettings.urdu_title} - یومیہ حاضری شیٹ</p>
              <p className="text-xs mt-1"><strong>Tareekh:</strong> {formatDate(selectedDate)}</p>
            </div>

            <div className="p-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center no-print">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Tareekh ({formatDate(selectedDate)}) Ki Hazri Sheet
              </span>
              <span className="text-xs text-slate-500">Status tabdeel karne ke liye button par click karein</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 pl-4 pr-2">#</th>
                    <th className="py-3 px-2">Karigar Ka Naam</th>
                    <th className="py-3 px-2">Role / Hunar</th>
                    <th className="py-3 px-2 text-right">Fix Rate</th>
                    <th className="py-3 px-3 text-center">Hazri Status (حاضری)</th>
                    <th className="py-3 px-2 text-right">Aaj Ka Mehntana</th>
                    <th className="no-print py-3 pr-4 pl-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {karigars.map((karigar, idx) => {
                    const status = attMap[karigar.id];
                    let earnedToday = 0;
                    if (status === 'PRESENT') earnedToday = karigar.daily_wage;
                    else if (status === 'HALF_DAY') earnedToday = karigar.daily_wage / 2;

                    return (
                      <tr key={karigar.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 pl-4 pr-2 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-3 px-2">
                          <div className="font-bold text-slate-900 text-xs">{karigar.name}</div>
                          {karigar.phone && (
                            <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Phone className="w-2.5 h-2.5 text-slate-400" />
                              <span>{karigar.phone}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-2">
                          <span className="text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {karigar.role}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right font-bold font-mono text-slate-900">
                          {formatPKR(karigar.daily_wage)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                            <button
                              type="button"
                              onClick={() => handleStatusChange(karigar.id, 'PRESENT')}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                                status === 'PRESENT'
                                  ? 'bg-emerald-600 text-white shadow-sm font-black'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                              title="Hazir (Full Day)"
                            >
                              ✓ Hazir
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStatusChange(karigar.id, 'HALF_DAY')}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                                status === 'HALF_DAY'
                                  ? 'bg-cyan-600 text-white shadow-sm font-black'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                              title="Half Day (Aadha Din)"
                            >
                              ½ Half
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStatusChange(karigar.id, 'ABSENT')}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                                status === 'ABSENT'
                                  ? 'bg-rose-600 text-white shadow-sm font-black'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                              title="Ghair Hazir"
                            >
                              ✕ Absent
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStatusChange(karigar.id, 'LEAVE')}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                                status === 'LEAVE'
                                  ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                              title="Rukhsat / Chutti"
                            >
                              Chutti
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right font-black font-mono text-amber-800 text-sm">
                          {formatPKR(earnedToday)}
                        </td>
                        <td className="no-print py-3 pr-4 pl-2 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setActiveKarigarForHistory(karigar)}
                              className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition inline-flex items-center gap-1 shadow-2xs active:scale-95"
                              title="Mukammal Hazri o Dihaari History Dekhein"
                            >
                              <Eye className="w-3.5 h-3.5 text-amber-700" />
                              <span>History</span>
                            </button>
                            <button
                              onClick={() => setActiveKarigarForPayment(karigar)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition inline-flex items-center gap-1 shadow-sm active:scale-95"
                            >
                              <HandCoins className="w-3.5 h-3.5" />
                              <span>Dihaari / Advance</span>
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Kya aap waqai '${karigar.name}' ko register se delete karna chahte hain?`)) {
                                  deleteKarigar(karigar.id);
                                }
                              }}
                              className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 transition active:scale-95 shadow-sm"
                              title="Karigar Delete Karein"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {karigars.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-500">
                        Koi karigar shamil nahi kiya gaya.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ============================================================== */}
      {/* 2. HAFTAWAAR HISAB & WAGES SETTLEMENT VIEW */}
      {/* ============================================================== */}
      {activeTab === 'WEEKLY' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Weekly Range Selector Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CalendarRange className="w-5 h-5 text-emerald-600" />
              <span className="text-xs font-black text-slate-900 uppercase">
                Select Settlement Week (ہفتہ کی تاریخیں):
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <span>From:</span>
              <input
                type="date"
                value={weekStartDate}
                onChange={(e) => setWeekStartDate(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold"
              />
              <span>To:</span>
              <input
                type="date"
                value={weekEndDate}
                onChange={(e) => setWeekEndDate(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold"
              />
            </div>
          </div>

          {/* 3 Weekly Total Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">
                Total Weekly Wages Earned (حاصل کردہ دیہاڑی)
              </span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {formatPKR(totalWeeklyEarned)}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">
                Total Advances / Kharcha Deducted (منہا کیا گیا خرچہ)
              </span>
              <div className="text-2xl font-black text-rose-700 mt-1">
                -{formatPKR(totalWeeklyAdvance)}
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-sm">
              <span className="text-[11px] font-bold text-emerald-800 uppercase block">
                Net Cash Payable (صاف واجب الادا اجرت)
              </span>
              <div className="text-2xl font-black text-emerald-700 mt-1">
                {formatPKR(totalWeeklyNetPayable)}
              </div>
            </div>
          </div>

          {/* Weekly Summary Settlement Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 pl-4 pr-2">Karigar</th>
                    <th className="py-3 px-2">Role</th>
                    <th className="py-3 px-2 text-right">Daily Rate</th>
                    <th className="py-3 px-2 text-center">Hazri Summary</th>
                    <th className="py-3 px-2 text-right">Earned Wages</th>
                    <th className="py-3 px-2 text-right text-rose-700">Advance (Kharcha)</th>
                    <th className="py-3 px-2 text-right text-emerald-700 font-black">Net Payable</th>
                    <th className="no-print py-3 pr-4 pl-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {weeklySummary.map((kSummary) => {
                    const originalKarigar = karigars.find((x) => x.id === kSummary.karigar_id);
                    return (
                      <tr key={kSummary.karigar_id} className="hover:bg-slate-50 transition">
                        <td className="py-3 pl-4 pr-2">
                          <div className="font-extrabold text-slate-900 text-sm">{kSummary.karigar_name}</div>
                        </td>
                        <td className="py-3 px-2">
                          <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {kSummary.role}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right font-mono font-bold text-slate-600">
                          Rs. {kSummary.daily_wage.toLocaleString()}
                        </td>
                        <td className="py-3 px-2 text-center font-mono">
                          <span className="text-emerald-700 font-bold">{kSummary.days_present}P</span>{' '}
                          {kSummary.days_half > 0 && <span className="text-cyan-700 font-bold">{kSummary.days_half}H </span>}
                          {kSummary.days_absent > 0 && <span className="text-rose-600 font-bold">{kSummary.days_absent}A</span>}
                        </td>
                        <td className="py-3 px-2 text-right font-mono font-bold text-slate-800">
                          {formatPKR(kSummary.earned_wages)}
                        </td>
                        <td className="py-3 px-2 text-right font-mono font-bold text-rose-700">
                          -{formatPKR(kSummary.advance_taken)}
                        </td>
                        <td className="py-3 px-2 text-right font-mono font-black text-emerald-700 text-sm">
                          {formatPKR(kSummary.net_payable)}
                        </td>
                        <td className="no-print py-3 pr-4 pl-2 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleWhatsAppWeeklySlip(kSummary)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1 shadow-sm active:scale-95"
                              title="Haftawaar Wage Slip WhatsApp Karein"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </button>

                            {originalKarigar && (
                              <button
                                onClick={() => setActiveKarigarForPayment(originalKarigar)}
                                className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black transition inline-flex items-center gap-1 shadow-sm active:scale-95"
                              >
                                <HandCoins className="w-3.5 h-3.5" />
                                <span>Pay Wage</span>
                              </button>
                            )}

                            {originalKarigar && (
                              <button
                                onClick={() => setActiveKarigarForHistory(originalKarigar)}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl"
                                title="Statement"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Recent Wages & Advance History */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
            <HandCoins className="w-4 h-4 text-amber-600" />
            <span>Taza Tareen Adaigi Record (Recent Wages & Advance Outflow)</span>
          </div>
          <span className="text-xs text-slate-500 font-bold">{karigarPayments.length} Payments</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 pl-4 pr-2">Tareekh</th>
                <th className="py-2.5 px-2">Karigar</th>
                <th className="py-2.5 px-2">Type</th>
                <th className="py-2.5 px-2">Wazahat (Notes)</th>
                <th className="py-2.5 pr-4 pl-2 text-right text-rose-700">Ada Shuda Rakam (Paid)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {karigarPayments.slice(0, 10).map((pay) => (
                <tr key={pay.id} className="hover:bg-slate-50 transition">
                  <td className="py-2.5 pl-4 pr-2 text-slate-600 font-mono">{formatDate(pay.pay_date)}</td>
                  <td className="py-2.5 px-2 font-bold text-slate-900">{pay.karigar_name}</td>
                  <td className="py-2.5 px-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        pay.pay_type === 'ADVANCE'
                          ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {pay.pay_type}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-slate-600">{pay.notes || '-'}</td>
                  <td className="py-2.5 pr-4 pl-2 text-right font-black font-mono text-emerald-700">
                    {formatPKR(pay.amount)}
                  </td>
                </tr>
              ))}

              {karigarPayments.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-slate-500">
                    Abhi tak koi payment record nahi hua.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <QuickKarigarModal
        isOpen={isQuickKarigarOpen}
        onClose={() => setIsQuickKarigarOpen(false)}
      />

      <KarigarPaymentModal
        isOpen={Boolean(activeKarigarForPayment)}
        karigar={activeKarigarForPayment}
        onClose={() => setActiveKarigarForPayment(null)}
      />

      {/* Karigar Attendance & Wage Statement History Modal */}
      <KarigarHistoryModal
        karigar={activeKarigarForHistory}
        onClose={() => setActiveKarigarForHistory(null)}
      />
    </div>
  );
};

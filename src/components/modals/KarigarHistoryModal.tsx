import React, { useState } from 'react';
import {
  X,
  Users,
  Calendar,
  HandCoins,
  CheckCircle2,
  Clock,
  XCircle,
  Coffee,
  Printer,
  MessageCircle,
  Phone,
  DollarSign,
  TrendingUp,
  FileSpreadsheet,
} from 'lucide-react';
import { Karigar, KarigarAttendance, KarigarPayment, AttendanceStatus } from '../../types';
import { formatPKR, formatDate } from '../../utils/currency';
import { generateWhatsAppKarigarWageLink } from '../../utils/whatsapp';
import { useWorkshopStore } from '../../store/useWorkshopStore';

interface KarigarHistoryModalProps {
  karigar: Karigar | null;
  onClose: () => void;
}

export const KarigarHistoryModal: React.FC<KarigarHistoryModalProps> = ({
  karigar,
  onClose,
}) => {
  const shopSettings = useWorkshopStore((state) => state.shopSettings);
  const karigarAttendance = useWorkshopStore((state) => state.karigarAttendance);
  const karigarPayments = useWorkshopStore((state) => state.karigarPayments);

  const [activeTab, setActiveTab] = useState<'attendance' | 'payments'>('attendance');

  if (!karigar) return null;

  // Filter attendance and payments for this karigar
  const historyAttendance = karigarAttendance
    .filter((a) => a.karigar_id === karigar.id)
    .sort((a, b) => b.att_date.localeCompare(a.att_date));

  const historyPayments = karigarPayments
    .filter((p) => p.karigar_id === karigar.id)
    .sort((a, b) => b.pay_date.localeCompare(a.pay_date));

  // Compute stats
  let daysWorked = 0;
  let totalEarned = 0;

  for (const a of historyAttendance) {
    if (a.status === 'PRESENT') {
      daysWorked += 1;
      totalEarned += karigar.daily_wage;
    } else if (a.status === 'HALF_DAY') {
      daysWorked += 0.5;
      totalEarned += karigar.daily_wage / 2;
    }
  }

  const totalPaid = historyPayments.reduce((sum, p) => sum + p.amount, 0);
  const netPayable = totalEarned - totalPaid;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    const link = generateWhatsAppKarigarWageLink(
      karigar,
      { totalEarned, totalPaid, netPayable, daysWorked },
      shopSettings.shop_name
    );
    window.open(link, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-100 border border-cyan-200 flex items-center justify-center text-cyan-800">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <span>{karigar.name} — Mukammal Hazri o Dihaari Khata</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium flex items-center gap-2 mt-0.5">
                <span>Dihaari Rate: <strong>{formatPKR(karigar.daily_wage)}/din</strong></span>
                {karigar.phone && <span>• Ph: {karigar.phone}</span>}
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

        {/* 4 Financial Metric Cards */}
        <div className="p-6 border-b border-slate-200 bg-white grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Hazri Din (Days)</span>
            <span className="text-lg font-black font-mono text-slate-900 mt-0.5 block">{daysWorked} din</span>
          </div>

          <div className="bg-amber-50/60 p-3 rounded-2xl border border-amber-200 text-center">
            <span className="text-[10px] uppercase font-bold text-amber-700 block">Kul Kamai (Earned)</span>
            <span className="text-lg font-black font-mono text-amber-900 mt-0.5 block">{formatPKR(totalEarned)}</span>
          </div>

          <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-200 text-center">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block">Ada Shuda (Paid)</span>
            <span className="text-lg font-black font-mono text-emerald-900 mt-0.5 block">{formatPKR(totalPaid)}</span>
          </div>

          <div className="bg-rose-50/60 p-3 rounded-2xl border border-rose-200 text-center">
            <span className="text-[10px] uppercase font-bold text-rose-700 block">Baqaya Dena (Payable)</span>
            <span className="text-lg font-black font-mono text-rose-900 mt-0.5 block">{formatPKR(netPayable)}</span>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="px-6 pt-3 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('attendance')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'attendance'
                ? 'border-amber-600 text-amber-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Hazri Record ({historyAttendance.length} Entries)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'payments'
                ? 'border-amber-600 text-amber-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HandCoins className="w-3.5 h-3.5" />
            <span>Adaigi / Advance Record ({historyPayments.length} Payments)</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4" id="karigar-history-printable">
          {activeTab === 'attendance' ? (
            historyAttendance.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p>Is karigar ka koi hazri record nahi mila.</p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 pl-4 pr-2">Tareekh (Date)</th>
                      <th className="py-2.5 px-2 text-center">Status</th>
                      <th className="py-2.5 pr-4 pl-2 text-right">Dihaari Kamai (Earned)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {historyAttendance.map((att) => {
                      let badge = 'bg-slate-100 text-slate-700';
                      let earned = 0;
                      if (att.status === 'PRESENT') {
                        badge = 'bg-emerald-100 text-emerald-800 border border-emerald-200';
                        earned = karigar.daily_wage;
                      } else if (att.status === 'HALF_DAY') {
                        badge = 'bg-blue-100 text-blue-800 border border-blue-200';
                        earned = karigar.daily_wage / 2;
                      } else if (att.status === 'ABSENT') {
                        badge = 'bg-rose-100 text-rose-800 border border-rose-200';
                      } else if (att.status === 'LEAVE') {
                        badge = 'bg-amber-100 text-amber-800 border border-amber-200';
                      }

                      return (
                        <tr key={att.id} className="hover:bg-slate-50 transition">
                          <td className="py-2.5 pl-4 pr-2 font-mono text-slate-700">
                            {formatDate(att.att_date)}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${badge}`}>
                              {att.status}
                            </span>
                          </td>
                          <td className="py-2.5 pr-4 pl-2 text-right font-black font-mono text-slate-900">
                            {earned > 0 ? formatPKR(earned) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : historyPayments.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              <HandCoins className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p>Is karigar ko abhi tak koi payment ada nahi ki gayi.</p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 pl-4 pr-2">Tareekh (Date)</th>
                    <th className="py-2.5 px-2">Type</th>
                    <th className="py-2.5 px-2">Wazahat / Notes</th>
                    <th className="py-2.5 pr-4 pl-2 text-right text-emerald-700">Ada Shuda Rakam</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {historyPayments.map((pay) => (
                    <tr key={pay.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 pl-4 pr-2 font-mono text-slate-700">
                        {formatDate(pay.pay_date)}
                      </td>
                      <td className="py-2.5 px-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            pay.pay_type === 'ADVANCE'
                              ? 'bg-cyan-100 text-cyan-800 border border-cyan-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
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
                </tbody>
              </table>
            </div>
          )}
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
            {karigar.phone && (
              <button
                type="button"
                onClick={handleWhatsApp}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm active:scale-95"
                title="Karigar Ko WhatsApp Par Hazri o Wages Slip Bhejein"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp Slip</span>
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

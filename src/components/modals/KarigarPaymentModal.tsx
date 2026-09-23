import React, { useState, useEffect } from 'react';
import { X, HandCoins, Calendar, CheckCircle } from 'lucide-react';
import { useWorkshopStore } from '../../store/useWorkshopStore';
import { Karigar } from '../../types';
import { formatPKR, getTodayDate } from '../../utils/currency';

interface KarigarPaymentModalProps {
  isOpen: boolean;
  karigar: Karigar | null;
  onClose: () => void;
}

export const KarigarPaymentModal: React.FC<KarigarPaymentModalProps> = ({
  isOpen,
  karigar,
  onClose,
}) => {
  const addKarigarPayment = useWorkshopStore((state) => state.addKarigarPayment);

  const [payType, setPayType] = useState<'DAILY_WAGE' | 'ADVANCE' | 'MONTHLY_SALARY'>('DAILY_WAGE');
  const [amount, setAmount] = useState('');
  const [payDate, setPayDate] = useState(getTodayDate());
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen && karigar) {
      setPayDate(getTodayDate());
      setNotes('');
      if (karigar.wage_type === 'DAILY' && karigar.daily_wage > 0) {
        setAmount(karigar.daily_wage.toString());
        setPayType('DAILY_WAGE');
      } else {
        setAmount('');
        setPayType('ADVANCE');
      }
    }
  }, [isOpen, karigar]);

  if (!isOpen || !karigar) return null;

  const numAmount = parseFloat(amount) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) return;

    addKarigarPayment(
      karigar.id,
      payDate,
      payType,
      numAmount,
      notes.trim() || `${karigar.name} ko ${payType === 'ADVANCE' ? 'Advance' : 'Dihaari'} ada ki`
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
        <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-base">
            <HandCoins className="w-5 h-5 text-emerald-600" />
            <span>Karigar Ko Dihaari / Advance Ada Karein</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs flex justify-between items-center">
            <div>
              <span className="text-slate-500 font-bold">Karigar:</span>
              <div className="text-sm font-bold text-slate-900 mt-0.5">{karigar.name}</div>
              <span className="text-[11px] text-amber-700 font-semibold">{karigar.role}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Fix Rate:</span>
              <div className="text-sm font-black text-slate-900">
                {formatPKR(karigar.daily_wage)} / {karigar.wage_type === 'DAILY' ? 'Dihaari' : 'Mahana'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Adaigi Ki Qisam (Type)
              </label>
              <select
                value={payType}
                onChange={(e) => setPayType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
              >
                <option value="DAILY_WAGE">Daily Wage (یومیہ دیہاڑی)</option>
                <option value="ADVANCE">Advance (خرچہ / ایڈوانس)</option>
                <option value="MONTHLY_SALARY">Monthly (ماہانہ تنخواہ)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Adaigi Rakam (Amount) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                autoFocus
                min="1"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-emerald-700 font-black text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Tareekh (Date)
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="date"
                  required
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Payment Source
              </label>
              <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-xs font-bold">
                CASH (دکان کے گلہ سے)
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Wazahat / Detail (Notes)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Sham ko dukan se kharcha diya"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900">
            یہ ادائیگی خود بخود روزانہ کے <strong>گلہ (Cash Drawer)</strong> سے مائنس ہو جائے گی تاکہ آپ کے دراز کی فزیکل کیش سے مل سکے۔
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl font-medium text-xs transition"
            >
              Mansookh
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm transition flex items-center gap-1.5 active:scale-95"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Payment Mehfooz Karein</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

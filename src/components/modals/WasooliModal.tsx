import React, { useState } from 'react';
import { X, HandCoins, Calendar, FileText } from 'lucide-react';
import { Customer } from '../../types';
import { formatPKR, getTodayDate } from '../../utils/currency';
import { useWorkshopStore } from '../../store/useWorkshopStore';

interface WasooliModalProps {
  isOpen: boolean;
  customer: Customer | null;
  onClose: () => void;
}

export const WasooliModal: React.FC<WasooliModalProps> = ({ isOpen, customer, onClose }) => {
  const submitWasooli = useWorkshopStore((state) => state.submitWasooli);

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getTodayDate());
  const [notes, setNotes] = useState('');

  if (!isOpen || !customer) return null;

  const currentBalance = customer.current_balance || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount) || 0;
    if (numAmount <= 0) return;

    submitWasooli(customer.id, numAmount, date, notes);
    setAmount('');
    setNotes('');
    onClose();
  };

  const handleFullAmount = () => {
    if (currentBalance > 0) {
      setAmount(currentBalance.toString());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
        <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-emerald-800 font-bold text-lg">
            <HandCoins className="w-6 h-6 text-emerald-600" />
            <div>
              <span>Wasooli / Naqad Jama (وصولی)</span>
              <p className="text-xs text-emerald-700 font-normal">Customer Khata Payment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-emerald-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 bg-slate-50 border-b border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-bold text-slate-900">{customer.name}</h3>
              <p className="text-xs text-slate-500">{customer.phone || 'No phone'} • {customer.address || 'Workshop'}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 uppercase tracking-wider block">Kul Baqaya:</span>
              <span className={`text-xl font-black ${currentBalance > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                {formatPKR(currentBalance)}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Wasool Shuda Rakam (Amount) <span className="text-rose-500">*</span>
              </label>
              {currentBalance > 0 && (
                <button
                  type="button"
                  onClick={handleFullAmount}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-bold underline underline-offset-2"
                >
                  Poora Baqaya ({formatPKR(currentBalance)})
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">Rs.</span>
              <input
                type="number"
                required
                autoFocus
                min="1"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-12 pr-4 py-3 text-2xl font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-400 shadow-sm"
              />
            </div>
            
            {/* Quick amount chips */}
            <div className="flex gap-2 mt-2">
              {[1000, 2000, 5000, 10000, 20000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val.toString())}
                  className="flex-1 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-slate-700 transition shadow-sm"
                >
                  +{val.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
              Tareekh (Date)
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-xs shadow-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
              Tafseel / Notes (Optional)
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Ustad Farooq ke hath bheje, ya online transfer"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs shadow-sm"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl font-medium text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm text-xs transition flex items-center gap-2 active:scale-95"
            >
              <HandCoins className="w-4 h-4" />
              <span>Wasooli Jama Karein</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

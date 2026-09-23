import React, { useState, useEffect } from 'react';
import { X, HandCoins, Calendar, FileText, CheckCircle } from 'lucide-react';
import { useWorkshopStore } from '../../store/useWorkshopStore';
import { Supplier } from '../../types';
import { formatPKR, getTodayDate } from '../../utils/currency';

interface SupplierPaymentModalProps {
  isOpen: boolean;
  supplier: Supplier | null;
  onClose: () => void;
}

export const SupplierPaymentModal: React.FC<SupplierPaymentModalProps> = ({
  isOpen,
  supplier,
  onClose,
}) => {
  const addSupplierPayment = useWorkshopStore((state) => state.addSupplierPayment);

  const [amount, setAmount] = useState('');
  const [payDate, setPayDate] = useState(getTodayDate());
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setPayDate(getTodayDate());
      setNotes('');
    }
  }, [isOpen]);

  if (!isOpen || !supplier) return null;

  const currentBal = supplier.current_balance || 0;
  const numAmount = parseFloat(amount) || 0;
  const newBal = Math.max(0, currentBal - numAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) return;

    addSupplierPayment(
      supplier.id,
      numAmount,
      payDate,
      notes.trim() || 'Naqad Adaigi (Payment to Supplier)'
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
        <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-base">
            <HandCoins className="w-5 h-5 text-emerald-600" />
            <span>Supplier Ko Adaigi Karein (Payment Out)</span>
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
              <span className="text-slate-500 font-bold">Supplier:</span>
              <div className="text-sm font-bold text-slate-900 mt-0.5">{supplier.name}</div>
              {supplier.company_name && (
                <div className="text-[11px] text-slate-500">{supplier.company_name}</div>
              )}
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Kul Baqaya Dena:</span>
              <div className="text-base font-black text-rose-700">{formatPKR(currentBal)}</div>
            </div>
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
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-emerald-700 font-black text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
            />
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap gap-1.5">
            {currentBal > 0 && (
              <button
                type="button"
                onClick={() => setAmount(currentBal.toString())}
                className="px-2.5 py-1 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-200 transition shadow-sm"
              >
                Poora Baqaya ({formatPKR(currentBal)})
              </button>
            )}
            {[5000, 10000, 25000, 50000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setAmount(val.toString())}
                className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition shadow-sm"
              >
                +{val.toLocaleString()}
              </button>
            ))}
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
                Payment Method
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
              placeholder="e.g. Haji Manzoor ko dukan par naqad ada kiye"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
            />
          </div>

          {/* New Balance Preview */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex justify-between items-center text-xs">
            <span className="text-emerald-800 font-bold">Adaigi Ke Baad Baqaya Dena:</span>
            <span className="text-base font-black text-emerald-900">{formatPKR(newBal)}</span>
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
              <span>Adaigi Mehfooz Karein</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, DollarSign, FileText } from 'lucide-react';
import { CncJob } from '../../types';
import { formatPKR } from '../../utils/currency';
import { useWorkshopStore } from '../../store/useWorkshopStore';

interface CncPaymentModalProps {
  isOpen: boolean;
  job: CncJob | null;
  onClose: () => void;
}

export const CncPaymentModal: React.FC<CncPaymentModalProps> = ({ isOpen, job, onClose }) => {
  const receiveCncPayment = useWorkshopStore((state) => state.receiveCncPayment);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen || !job) return null;

  const remaining = job.remaining_amount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount) || 0;
    if (numAmount <= 0) return;

    receiveCncPayment(job.id, numAmount, notes);
    setAmount('');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
        <div className="bg-cyan-50 border-b border-cyan-200 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-cyan-900 font-bold text-lg">
            <DollarSign className="w-6 h-6 text-cyan-700" />
            <div>
              <span>CNC Payment Wasool Karein</span>
              <p className="text-xs text-cyan-700 font-normal">Job #{job.job_no}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-cyan-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 bg-slate-50 border-b border-slate-200">
          <p className="text-sm font-semibold text-slate-900 mb-1">
            {job.customer_name || job.customer_name_manual || 'Walk-in Customer'}
          </p>
          <p className="text-xs text-slate-500 mb-3">{job.job_description} • {job.size_specification || 'N/A'}</p>
          
          <div className="grid grid-cols-3 gap-2 bg-white border border-slate-200 p-3 rounded-xl text-center shadow-sm">
            <div>
              <span className="text-[10px] uppercase text-slate-500 font-bold block">Kul Rate</span>
              <span className="text-sm font-bold text-slate-900">{formatPKR(job.total_amount)}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-500 font-bold block">Pehle Wasool</span>
              <span className="text-sm font-bold text-emerald-700">{formatPKR(job.paid_amount)}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-500 font-bold block">Baqaya Rakam</span>
              <span className="text-sm font-black text-rose-700">{formatPKR(remaining)}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Wasool Shuda Rakam <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setAmount(remaining.toString())}
                className="text-xs text-cyan-700 hover:text-cyan-800 font-semibold underline underline-offset-2"
              >
                Poora Baqaya ({formatPKR(remaining)})
              </button>
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
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-12 pr-4 py-3 text-2xl font-bold text-cyan-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-slate-400 shadow-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
              Notes (Optional)
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Delivery ke waqt final hisab"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs shadow-sm"
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
              className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow-sm text-xs transition active:scale-95"
            >
              Receive Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

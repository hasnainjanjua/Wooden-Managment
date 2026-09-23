import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useWorkshopStore } from '../../store/useWorkshopStore';

export const VoidModal: React.FC = () => {
  const voidModalData = useWorkshopStore((state) => state.voidModalData);
  const closeVoidModal = useWorkshopStore((state) => state.closeVoidModal);
  const executeVoid = useWorkshopStore((state) => state.executeVoid);

  const [reason, setReason] = useState('');

  if (!voidModalData || !voidModalData.isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    executeVoid(reason);
    setReason('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-rose-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
        <div className="bg-rose-50 border-b border-rose-200 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-rose-800 font-bold text-lg">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span>Mansookhi (Void / Reversal)</span>
          </div>
          <button
            onClick={closeVoidModal}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-rose-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3.5 text-sm text-rose-900">
            <p className="font-semibold text-rose-900 mb-1">
              Aap entry <span className="underline font-bold text-slate-900">#{voidModalData.title}</span> ko Mansookh kar rahe hain.
            </p>
            <p className="text-xs text-rose-800 leading-relaxed">
              Yeh entry database se delete nahi hogi, balke iske bar-aks ek Compensating Reversal ledger mein shamil ho kar hisab theek kar dega.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Mansookhi ki Wajah (Reason for Void) <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              autoFocus
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Ghalat rate lag gaya, customer ne order cancel kar diya, ya double entry..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm shadow-sm"
            />
          </div>

          <div className="pt-2 border-t border-slate-200 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={closeVoidModal}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl font-medium text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-sm transition flex items-center gap-1.5 active:scale-95"
            >
              <span>Confirm Void / Mansookh Karein</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

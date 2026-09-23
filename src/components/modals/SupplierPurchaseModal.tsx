import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, Calendar, FileText, DollarSign, CreditCard } from 'lucide-react';
import { useWorkshopStore } from '../../store/useWorkshopStore';
import { Supplier } from '../../types';
import { formatPKR, getTodayDate } from '../../utils/currency';

interface SupplierPurchaseModalProps {
  isOpen: boolean;
  supplier: Supplier | null;
  onClose: () => void;
}

export const SupplierPurchaseModal: React.FC<SupplierPurchaseModalProps> = ({
  isOpen,
  supplier,
  onClose,
}) => {
  const addSupplierPurchase = useWorkshopStore((state) => state.addSupplierPurchase);

  const [billNo, setBillNo] = useState('');
  const [billDate, setBillDate] = useState(getTodayDate());
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [cashPaid, setCashPaid] = useState('');

  useEffect(() => {
    if (isOpen) {
      setBillNo('');
      setBillDate(getTodayDate());
      setDescription('');
      setTotalAmount('');
      setCashPaid('');
    }
  }, [isOpen]);

  if (!isOpen || !supplier) return null;

  const numTotal = parseFloat(totalAmount) || 0;
  const numCash = parseFloat(cashPaid) || 0;
  const baqaya = Math.max(0, numTotal - numCash);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numTotal <= 0) return;

    addSupplierPurchase(
      supplier.id,
      billNo.trim() || 'BILL-' + Date.now().toString().slice(-4),
      numTotal,
      numCash,
      description.trim(),
      billDate
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
        <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-700 font-bold text-base">
            <ShoppingCart className="w-5 h-5 text-amber-600" />
            <span>Khareedari Bill Darj Karein (Purchase)</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
            <span className="text-slate-500 font-bold">Supplier:</span>
            <div className="text-sm font-bold text-slate-900 mt-0.5">
              {supplier.name} {supplier.company_name ? `(${supplier.company_name})` : ''}
            </div>
            <div className="text-rose-700 font-bold mt-1">
              Sabqa Baqaya Dena: {formatPKR(supplier.current_balance || 0)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Bill / Bilty No <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={billNo}
                  onChange={(e) => setBillNo(e.target.value)}
                  placeholder="e.g. B-1024"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Tareekh (Date)
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="date"
                  required
                  value={billDate}
                  onChange={(e) => setBillDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium shadow-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Saman Ki Tafseel (Description) <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. 50 Sheets MDF 16mm Green, 20 Pcs Handle Lock Big"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none font-medium shadow-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Kul Bill Rakam (Total) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                step="any"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-amber-700 font-black text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Mawqa Par Diya (Spot Cash)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={cashPaid}
                onChange={(e) => setCashPaid(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-emerald-700 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
              />
            </div>
          </div>

          {/* Balance Calculation Preview */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center text-xs">
            <span className="text-slate-600 font-bold">Is Bill Ka Udhaar Baqaya:</span>
            <span className="text-base font-black text-rose-700">{formatPKR(baqaya)}</span>
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
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-sm transition active:scale-95"
            >
              Bill Mehfooz Karein
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

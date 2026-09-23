import React, { useState, useEffect } from 'react';
import { X, Boxes, ArrowUpRight, ArrowDownRight, RefreshCw, CheckCircle } from 'lucide-react';
import { useWorkshopStore } from '../../store/useWorkshopStore';
import { CatalogItem } from '../../types';

interface StockAdjustModalProps {
  isOpen: boolean;
  item: CatalogItem | null;
  onClose: () => void;
}

export const StockAdjustModal: React.FC<StockAdjustModalProps> = ({
  isOpen,
  item,
  onClose,
}) => {
  const adjustStock = useWorkshopStore((state) => state.adjustStock);

  const [mode, setMode] = useState<'ADD' | 'DEDUCT' | 'SET'>('ADD');
  const [qty, setQty] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setQty('');
      setNotes('');
      setMode('ADD');
    }
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const currentStock = item.stock_qty || 0;
  const numQty = parseFloat(qty) || 0;

  let newStockPreview = currentStock;
  if (mode === 'ADD') newStockPreview = currentStock + numQty;
  else if (mode === 'DEDUCT') newStockPreview = Math.max(0, currentStock - numQty);
  else if (mode === 'SET') newStockPreview = Math.max(0, numQty);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numQty <= 0 && mode !== 'SET') return;

    let delta = numQty;
    let txType: 'IN_PURCHASE' | 'OUT_SALE' | 'ADJUSTMENT' = 'ADJUSTMENT';

    if (mode === 'ADD') {
      delta = numQty;
      txType = 'IN_PURCHASE';
    } else if (mode === 'DEDUCT') {
      delta = -numQty;
      txType = 'OUT_SALE';
    } else if (mode === 'SET') {
      delta = numQty - currentStock;
      txType = 'ADJUSTMENT';
    }

    adjustStock(item.id, delta, txType, notes.trim() || `Manual Stock ${mode}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
        <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-700 font-bold text-base">
            <Boxes className="w-5 h-5 text-amber-600" />
            <span>Stock Quantity Update Karein</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center text-xs">
            <div>
              <span className="text-slate-500 uppercase font-bold text-[10px]">Item Name:</span>
              <div className="text-sm font-bold text-slate-900 mt-0.5">{item.name}</div>
              <span className="text-[11px] text-amber-700 font-semibold">{item.category}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 uppercase font-bold text-[10px]">Mojooda Stock:</span>
              <div className="text-xl font-black text-amber-700">{currentStock} pcs</div>
            </div>
          </div>

          {/* Mode Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Action Muntakhib Karein:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMode('ADD')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 border ${
                  mode === 'ADD'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>+ Naya Aaya</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('DEDUCT')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 border ${
                  mode === 'DEDUCT'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>- Nikala / Kharab</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('SET')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 border ${
                  mode === 'SET'
                    ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>= Direct Ginti</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              {mode === 'ADD'
                ? 'Kitni Taadad Aayi (+ Qty)'
                : mode === 'DEDUCT'
                ? 'Kitni Taadad Nikali (- Qty)'
                : 'Dukan Par Kul Mojooda Taadad (New Count)'}{' '}
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              required
              autoFocus
              min="0"
              step="any"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="0"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold text-base focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Wazahat / Note
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Mandi se nayi peti aayi / Dukan ginti adjust"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
            />
          </div>

          {/* Preview */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center text-xs">
            <span className="text-slate-600 font-bold">Update Ke Baad Naya Stock:</span>
            <span className="text-base font-black text-emerald-700">{newStockPreview} pcs</span>
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
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-sm transition flex items-center gap-1.5 active:scale-95"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Stock Update Karein</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

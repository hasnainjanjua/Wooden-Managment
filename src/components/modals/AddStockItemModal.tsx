import React, { useState } from 'react';
import { X, PlusCircle, PackagePlus, ShieldAlert } from 'lucide-react';
import { useWorkshopStore } from '../../store/useWorkshopStore';
import { CatalogCategory } from '../../types';

interface AddStockItemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddStockItemModal: React.FC<AddStockItemModalProps> = ({ isOpen, onClose }) => {
  const createCatalogItem = useWorkshopStore((state) => state.createCatalogItem);

  const [category, setCategory] = useState<CatalogCategory>('HARDWARE');
  const [name, setName] = useState('');
  const [rate, setRate] = useState('');
  const [initialStock, setInitialStock] = useState('0');
  const [minAlert, setMinAlert] = useState('5');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const numRate = parseFloat(rate) || 0;
    const numStock = parseFloat(initialStock) || 0;
    const numMin = parseFloat(minAlert) || 5;

    createCatalogItem(category, name.trim(), numRate, numStock, numMin);
    setName('');
    setRate('');
    setInitialStock('0');
    setMinAlert('5');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-emerald-700 font-bold text-lg">
            <PackagePlus className="w-6 h-6 text-emerald-600" />
            <span>Naya Stock Item Shamil Karein (نیا آئٹم شامل کریں)</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Category (قسم) <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCategory('HARDWARE')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition border text-center ${
                  category === 'HARDWARE'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
              >
                Hardware (قبضہ، تالے)
              </button>
              <button
                type="button"
                onClick={() => setCategory('DOOR')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition border text-center ${
                  category === 'DOOR'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
              >
                Doors (دروازے)
              </button>
              <button
                type="button"
                onClick={() => setCategory('SERVICE')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition border text-center ${
                  category === 'SERVICE'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
              >
                Service / CNC
              </button>
            </div>
          </div>

          {/* Item Name */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
              Item Ka Naam (نام) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Godrej Main Door Lock / Hinges 4-inch / Solid Ash Wood Door"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
            />
          </div>

          {/* Rate & Initial Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                Sale Rate (فی عدد قیمت PKR)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                Mojooda Stock (شروع کی تعداد)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={initialStock}
                onChange={(e) => setInitialStock(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-emerald-700 font-black text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono shadow-sm"
              />
            </div>
          </div>

          {/* Min Stock Alert */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Kam Stock Warning Limit (Low Stock Alert)</span>
            </label>
            <input
              type="number"
              min="0"
              value={minAlert}
              onChange={(e) => setMinAlert(e.target.value)}
              placeholder="5"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-amber-800 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono shadow-sm"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Jab stock is limit se kam hoga to system alert dikhayega (Default: 5 pieces).
            </span>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl font-medium text-xs transition"
            >
              Mansookh (Cancel)
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm transition flex items-center gap-2 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Item Mehfooz Karein</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

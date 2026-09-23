import React, { useState, useId } from 'react';
import { X, Calculator, Plus, Check } from 'lucide-react';
import { formatPKR } from '../../utils/currency';

interface SqftCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (item: {
    name: string;
    sqft: number;
    rate: number;
    total: number;
    dimensionsText: string;
  }) => void;
  defaultRate?: number;
  initialName?: string;
}

export const SqftCalculatorModal: React.FC<SqftCalculatorModalProps> = ({
  isOpen,
  onClose,
  onApply,
  defaultRate = 120,
  initialName = 'CNC Jali Cutting',
}) => {
  const [itemName, setItemName] = useState(initialName);
  const [lengthFeet, setLengthFeet] = useState('8');
  const [lengthInches, setLengthInches] = useState('0');
  const [widthFeet, setWidthFeet] = useState('4');
  const [widthInches, setWidthInches] = useState('0');
  const [quantity, setQuantity] = useState('1');
  const [ratePerSqft, setRatePerSqft] = useState(defaultRate.toString());

  if (!isOpen) return null;

  const lFt = parseFloat(lengthFeet) || 0;
  const lIn = parseFloat(lengthInches) || 0;
  const wFt = parseFloat(widthFeet) || 0;
  const wIn = parseFloat(widthInches) || 0;
  const qty = parseFloat(quantity) || 1;
  const rate = parseFloat(ratePerSqft) || 0;

  const totalLengthFt = lFt + lIn / 12;
  const totalWidthFt = wFt + wIn / 12;
  const singleSqft = Math.round(totalLengthFt * totalWidthFt * 100) / 100;
  const totalSqft = Math.round(singleSqft * qty * 100) / 100;
  const totalAmount = Math.round(totalSqft * rate);

  const dimText = `${lFt}${lIn > 0 ? `.${lIn}"` : ''}ft x ${wFt}${wIn > 0 ? `.${wIn}"` : ''}ft (${singleSqft} sqft${qty > 1 ? ` x ${qty} pcs` : ''})`;

  const presets = [
    { label: '8x4 Sheet (32 sqft)', lF: '8', lI: '0', wF: '4', wI: '0' },
    { label: '3.5x7 Door (24.5 sqft)', lF: '7', lI: '0', wF: '3', wI: '6' },
    { label: '4x7 Main Door (28 sqft)', lF: '7', lI: '0', wF: '4', wI: '0' },
    { label: '2.5x7 Bath Door (17.5 sqft)', lF: '7', lI: '0', wF: '2', wI: '6' },
  ];

  const handleApply = () => {
    onApply({
      name: `${itemName} - ${dimText}`,
      sqft: totalSqft,
      rate: rate,
      total: totalAmount,
      dimensionsText: dimText,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150">
        <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-amber-700 font-extrabold text-base">
            <Calculator className="w-5 h-5 text-amber-600" />
            <span>Square Feet (Sqft) Calculator (فٹ کیلکولیٹر)</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Quick presets */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Quick Size Presets (مقبول سائز)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setLengthFeet(p.lF);
                    setLengthInches(p.lI);
                    setWidthFeet(p.wF);
                    setWidthInches(p.wI);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-left text-xs font-semibold text-slate-800 transition"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Item / Work Description
            </label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g. 16mm MDF Jali Cutting"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium shadow-sm"
            />
          </div>

          {/* Measurements grid */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            {/* Length */}
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                Lambai (Length)
              </span>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={lengthFeet}
                    onChange={(e) => setLengthFeet(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg pr-7 pl-2 py-1.5 text-xs text-slate-900 font-bold shadow-sm"
                  />
                  <span className="absolute right-2 top-2 text-[10px] text-slate-400">ft</span>
                </div>
                <div className="relative w-20">
                  <input
                    type="number"
                    min="0"
                    max="11"
                    step="any"
                    value={lengthInches}
                    onChange={(e) => setLengthInches(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg pr-7 pl-2 py-1.5 text-xs text-slate-900 font-bold shadow-sm"
                  />
                  <span className="absolute right-2 top-2 text-[10px] text-slate-400">in</span>
                </div>
              </div>
            </div>

            {/* Width */}
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                Chaurai (Width)
              </span>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={widthFeet}
                    onChange={(e) => setWidthFeet(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg pr-7 pl-2 py-1.5 text-xs text-slate-900 font-bold shadow-sm"
                  />
                  <span className="absolute right-2 top-2 text-[10px] text-slate-400">ft</span>
                </div>
                <div className="relative w-20">
                  <input
                    type="number"
                    min="0"
                    max="11"
                    step="any"
                    value={widthInches}
                    onChange={(e) => setWidthInches(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg pr-7 pl-2 py-1.5 text-xs text-slate-900 font-bold shadow-sm"
                  />
                  <span className="absolute right-2 top-2 text-[10px] text-slate-400">in</span>
                </div>
              </div>
            </div>
          </div>

          {/* Qty and Rate */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Tadad / Pieces (Qty)
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Rate Per Sq. Ft. (Rs.)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">Rs.</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={ratePerSqft}
                  onChange={(e) => setRatePerSqft(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs font-black text-amber-700 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Calculation Result Preview */}
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-600 block">Total Square Feet:</span>
              <span className="text-2xl font-black text-amber-800">
                {totalSqft} <span className="text-xs text-amber-700/80 font-normal">Sq. Ft.</span>
              </span>
              <p className="text-[10px] text-slate-500 mt-0.5">{dimText}</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-600 block">Kul Rakam (Total):</span>
              <span className="text-2xl font-black text-emerald-700">
                {formatPKR(totalAmount)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl font-semibold text-xs transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-sm transition flex items-center gap-1.5 active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Apply / Shamil Karein ({formatPKR(totalAmount)})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

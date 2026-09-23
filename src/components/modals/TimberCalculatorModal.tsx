import React, { useState } from 'react';
import { X, Calculator, Plus, Check, Trees, Layers, Ruler } from 'lucide-react';
import { formatPKR } from '../../utils/currency';
import { TimberCalcItem } from '../../types';

interface TimberCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToCart: (item: TimberCalcItem) => void;
  defaultRate?: number;
}

export const TimberCalculatorModal: React.FC<TimberCalculatorModalProps> = ({
  isOpen,
  onClose,
  onInsertToCart,
  defaultRate,
}) => {
  const [activeMode, setActiveMode] = useState<'CFT' | 'SFT' | 'RFT'>('CFT');

  // CFT State (Solid Timber)
  const [woodSpecies, setWoodSpecies] = useState('Sheesham (شیشم)');
  const [cftLengthFt, setCftLengthFt] = useState('7');
  const [cftLengthIn, setCftLengthIn] = useState('0');
  const [cftWidthIn, setCftWidthIn] = useState('4');
  const [cftThickIn, setCftThickIn] = useState('2');
  const [cftQty, setCftQty] = useState('1');
  const [cftRate, setCftRate] = useState(defaultRate ? defaultRate.toString() : '3500');

  // SFT State (Sheets / Jali / Panels)
  const [sheetMaterial, setSheetMaterial] = useState('MDF / Lasani (ایم ڈی ایف)');
  const [sftLengthFt, setSftLengthFt] = useState('8');
  const [sftLengthIn, setSftLengthIn] = useState('0');
  const [sftWidthFt, setSftWidthFt] = useState('4');
  const [sftWidthIn, setSftWidthIn] = useState('0');
  const [sftQty, setSftQty] = useState('1');
  const [sftRate, setSftRate] = useState('120');

  // RFT State (Gola / Moldings / Patti)
  const [rftName, setRftName] = useState('Wood Gola / Patti (لکڑی کا گولا)');
  const [rftLengthFt, setRftLengthFt] = useState('10');
  const [rftQty, setRftQty] = useState('1');
  const [rftRate, setRftRate] = useState('45');

  if (!isOpen) return null;

  // CFT Math: (Length_in_feet * Width_in_inches * Thick_in_inches) / 144
  const cftL = (parseFloat(cftLengthFt) || 0) + (parseFloat(cftLengthIn) || 0) / 12;
  const cftW = parseFloat(cftWidthIn) || 0;
  const cftT = parseFloat(cftThickIn) || 0;
  const cftQ = parseFloat(cftQty) || 1;
  const cftR = parseFloat(cftRate) || 0;
  const singleCft = Math.round(((cftL * cftW * cftT) / 144) * 1000) / 1000;
  const totalCft = Math.round(singleCft * cftQ * 1000) / 1000;
  const totalCftAmount = Math.round(totalCft * cftR);

  // SFT Math: Length_in_feet * Width_in_feet
  const sftL = (parseFloat(sftLengthFt) || 0) + (parseFloat(sftLengthIn) || 0) / 12;
  const sftW = (parseFloat(sftWidthFt) || 0) + (parseFloat(sftWidthIn) || 0) / 12;
  const sftQ = parseFloat(sftQty) || 1;
  const sftR = parseFloat(sftRate) || 0;
  const singleSft = Math.round(sftL * sftW * 100) / 100;
  const totalSft = Math.round(singleSft * sftQ * 100) / 100;
  const totalSftAmount = Math.round(totalSft * sftR);

  // RFT Math
  const rftL = parseFloat(rftLengthFt) || 0;
  const rftQ = parseFloat(rftQty) || 1;
  const rftR = parseFloat(rftRate) || 0;
  const totalRft = Math.round(rftL * rftQ * 100) / 100;
  const totalRftAmount = Math.round(totalRft * rftR);

  const handleInsert = () => {
    if (activeMode === 'CFT') {
      const dimDesc = `${cftLengthFt}'${cftLengthIn !== '0' ? `${cftLengthIn}"` : ''} × ${cftWidthIn}" × ${cftThickIn}" (${totalCft} CFT)`;
      onInsertToCart({
        type: 'CFT',
        title: `${woodSpecies}`,
        description: dimDesc,
        dimensions: {
          lengthFt: parseFloat(cftLengthFt) || 0,
          lengthIn: parseFloat(cftLengthIn) || 0,
          widthIn: cftW,
          thicknessIn: cftT,
        },
        quantity: cftQ,
        totalUnits: totalCft,
        unitRate: cftR,
        totalPrice: totalCftAmount,
      });
    } else if (activeMode === 'SFT') {
      const dimDesc = `${sftLengthFt}'${sftLengthIn !== '0' ? `${sftLengthIn}"` : ''} × ${sftWidthFt}'${sftWidthIn !== '0' ? `${sftWidthIn}"` : ''} (${totalSft} Sq.ft)`;
      onInsertToCart({
        type: 'SFT',
        title: `${sheetMaterial}`,
        description: dimDesc,
        dimensions: {
          lengthFt: parseFloat(sftLengthFt) || 0,
          lengthIn: parseFloat(sftLengthIn) || 0,
        },
        quantity: sftQ,
        totalUnits: totalSft,
        unitRate: sftR,
        totalPrice: totalSftAmount,
      });
    } else {
      const dimDesc = `${rftLengthFt} ft (${totalRft} RFT)`;
      onInsertToCart({
        type: 'RFT',
        title: `${rftName}`,
        description: dimDesc,
        dimensions: {
          lengthFt: rftL,
        },
        quantity: rftQ,
        totalUnits: totalRft,
        unitRate: rftR,
        totalPrice: totalRftAmount,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base tracking-wide">
                Timber & Sheet Calculator (پیمائش و ریٹ)
              </h3>
              <p className="text-[11px] text-amber-100 font-urdu">
                کیوبک فٹ (CFT) اور اسکوائر فٹ (SFT) لکڑی کیلکولیٹر
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 bg-slate-100 p-1.5 border-b border-slate-200 text-xs font-bold text-slate-700">
          <button
            onClick={() => setActiveMode('CFT')}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeMode === 'CFT'
                ? 'bg-white text-amber-700 shadow-sm font-black'
                : 'hover:text-slate-900'
            }`}
          >
            <Trees className="w-4 h-4" />
            <span>Solid Wood (CFT)</span>
          </button>
          <button
            onClick={() => setActiveMode('SFT')}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeMode === 'SFT'
                ? 'bg-white text-amber-700 shadow-sm font-black'
                : 'hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Sheet (SFT)</span>
          </button>
          <button
            onClick={() => setActiveMode('RFT')}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeMode === 'RFT'
                ? 'bg-white text-amber-700 shadow-sm font-black'
                : 'hover:text-slate-900'
            }`}
          >
            <Ruler className="w-4 h-4" />
            <span>Gola / Patti (RFT)</span>
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {/* CFT Mode Inputs */}
          {activeMode === 'CFT' && (
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Wood Species (لکڑی کی قسم)
                </label>
                <select
                  value={woodSpecies}
                  onChange={(e) => setWoodSpecies(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="Sheesham (شیشم)">Sheesham (شیشم - Rosewood)</option>
                  <option value="Diyar (دیار / چیڑ)">Diyar / Deodar (دیار)</option>
                  <option value="Partal / Pine (پڑتل)">Partal / Pine (پڑتل / پائن)</option>
                  <option value="Kikar (کیکر)">Kikar (کیکر - Acacia)</option>
                  <option value="Ash Wood (ایش ووڈ)">Ash Wood (ایش ووڈ)</option>
                  <option value="Teak / Sagwan (ساگوان)">Teak / Sagwan (ساگوان)</option>
                  <option value="Chir Wood (چیڑ)">Chir Wood (چیڑ)</option>
                </select>
              </div>

              {/* Dimensions: Length x Width x Thickness */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Length (Ft)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={cftLengthFt}
                    onChange={(e) => setCftLengthFt(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-800 text-center"
                    placeholder="Feet"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    + Length (In)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="11"
                    value={cftLengthIn}
                    onChange={(e) => setCftLengthIn(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-800 text-center"
                    placeholder="Inches"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Width (In)
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={cftWidthIn}
                    onChange={(e) => setCftWidthIn(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-800 text-center"
                    placeholder="Inches"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Thick (In)
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={cftThickIn}
                    onChange={(e) => setCftThickIn(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-800 text-center"
                    placeholder="Inches"
                  />
                </div>
              </div>

              {/* Qty & Rate */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Quantity (تعداد نگ)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={cftQty}
                    onChange={(e) => setCftQty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-800 text-center"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Rate per CFT (ریٹ فی فٹ)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={cftRate}
                    onChange={(e) => setCftRate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-800 text-center"
                  />
                </div>
              </div>

              {/* Live Result Box */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-amber-800 font-bold uppercase tracking-wider">
                    Total CFT:
                  </div>
                  <div className="text-xl font-black text-amber-900">
                    {totalCft} <span className="text-xs font-normal">CFT ({singleCft} × {cftQ} pcs)</span>
                  </div>
                  <div className="text-[10px] text-amber-700 font-mono mt-0.5">
                    Formula: (L' × W" × T") ÷ 144
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-amber-800 font-bold uppercase tracking-wider">
                    Kul Raqam (کل رقم):
                  </div>
                  <div className="text-2xl font-black text-emerald-700">
                    {formatPKR(totalCftAmount)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SFT Mode Inputs */}
          {activeMode === 'SFT' && (
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Sheet / Material (شیٹ کی قسم)
                </label>
                <select
                  value={sheetMaterial}
                  onChange={(e) => setSheetMaterial(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="MDF / Lasani (ایم ڈی ایف)">MDF / Lasani Sheet</option>
                  <option value="Commercial Plywood (پلائی ووڈ)">Commercial Plywood</option>
                  <option value="CNC Jali Carving (جالی کٹنگ)">CNC 2D/3D Jali Carving</option>
                  <option value="Acrylic / PVC Sheet (ایکریلک)">Acrylic / PVC Sheet</option>
                  <option value="Solid Door Panel (ڈور پینل)">Solid Door Panel</option>
                </select>
              </div>

              {/* Presets */}
              <div>
                <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Popular Presets:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => { setSftLengthFt('8'); setSftLengthIn('0'); setSftWidthFt('4'); setSftWidthIn('0'); }}
                    className="p-1.5 text-[11px] font-bold bg-slate-100 hover:bg-amber-100 rounded-lg text-slate-700 border border-slate-200 transition"
                  >
                    8×4 Sheet (32 Sq.ft)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSftLengthFt('7'); setSftLengthIn('0'); setSftWidthFt('3'); setSftWidthIn('6'); }}
                    className="p-1.5 text-[11px] font-bold bg-slate-100 hover:bg-amber-100 rounded-lg text-slate-700 border border-slate-200 transition"
                  >
                    3.5×7 Door (24.5 Sq.ft)
                  </button>
                </div>
              </div>

              {/* Dimensions */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Length (Ft)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={sftLengthFt}
                    onChange={(e) => setSftLengthFt(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-800 text-center"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">+ Length (In)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="11"
                    value={sftLengthIn}
                    onChange={(e) => setSftLengthIn(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-800 text-center"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Width (Ft)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={sftWidthFt}
                    onChange={(e) => setSftWidthFt(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-800 text-center"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">+ Width (In)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="11"
                    value={sftWidthIn}
                    onChange={(e) => setSftWidthIn(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-800 text-center"
                  />
                </div>
              </div>

              {/* Qty & Rate */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Quantity (تعداد)</label>
                  <input
                    type="number"
                    min="1"
                    value={sftQty}
                    onChange={(e) => setSftQty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-800 text-center"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Rate per SFT (ریٹ فی اسکوائر فٹ)</label>
                  <input
                    type="number"
                    min="0"
                    value={sftRate}
                    onChange={(e) => setSftRate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-800 text-center"
                  />
                </div>
              </div>

              {/* Live Result Box */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-amber-800 font-bold uppercase tracking-wider">
                    Total Sq.ft:
                  </div>
                  <div className="text-xl font-black text-amber-900">
                    {totalSft} <span className="text-xs font-normal">Sq.ft</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-amber-800 font-bold uppercase tracking-wider">
                    Kul Raqam (کل رقم):
                  </div>
                  <div className="text-2xl font-black text-emerald-700">
                    {formatPKR(totalSftAmount)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* RFT Mode Inputs */}
          {activeMode === 'RFT' && (
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Item Name (گولا / پٹی نام)
                </label>
                <input
                  type="text"
                  value={rftName}
                  onChange={(e) => setRftName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Length (Feet)</label>
                  <input
                    type="number"
                    min="1"
                    value={rftLengthFt}
                    onChange={(e) => setRftLengthFt(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-800 text-center"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Quantity (نگ)</label>
                  <input
                    type="number"
                    min="1"
                    value={rftQty}
                    onChange={(e) => setRftQty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-800 text-center"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Rate / RFT (ریٹ)</label>
                  <input
                    type="number"
                    min="0"
                    value={rftRate}
                    onChange={(e) => setRftRate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-800 text-center"
                  />
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-amber-800 font-bold uppercase tracking-wider">
                    Total Running Feet:
                  </div>
                  <div className="text-xl font-black text-amber-900">
                    {totalRft} <span className="text-xs font-normal">RFT</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-amber-800 font-bold uppercase tracking-wider">
                    Kul Raqam:
                  </div>
                  <div className="text-2xl font-black text-emerald-700">
                    {formatPKR(totalRftAmount)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition"
          >
            Cancel (کینسل)
          </button>
          <button
            type="button"
            onClick={handleInsert}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>➕ Insert into Bill (بل میں شامل کریں)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

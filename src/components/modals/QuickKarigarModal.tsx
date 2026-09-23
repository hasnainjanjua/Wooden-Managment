import React, { useState } from 'react';
import { X, UserPlus, Phone, Wrench, DollarSign } from 'lucide-react';
import { useWorkshopStore } from '../../store/useWorkshopStore';
import { KarigarWageType } from '../../types';

interface QuickKarigarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKarigarCreated?: (karigarId: number) => void;
}

export const QuickKarigarModal: React.FC<QuickKarigarModalProps> = ({
  isOpen,
  onClose,
  onKarigarCreated,
}) => {
  const createKarigar = useWorkshopStore((state) => state.createKarigar);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('CNC Router Master');
  const [wageType, setWageType] = useState<KarigarWageType>('DAILY');
  const [dailyWage, setDailyWage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const wage = parseFloat(dailyWage) || 0;
    const k = createKarigar(name.trim(), phone.trim(), role.trim(), wageType, wage);
    if (onKarigarCreated) {
      onKarigarCreated(k.id);
    }
    setName('');
    setPhone('');
    setDailyWage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
        <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-700 font-bold text-base">
            <UserPlus className="w-5 h-5 text-amber-600" />
            <span>Naya Karigar / Mistri Shamil Karein</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Karigar Ka Naam <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ustad Rashid / Akram Mistri"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-xs shadow-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Hunar / Kaam (Role) <span className="text-rose-500">*</span>
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs font-semibold shadow-sm"
            >
              <option value="CNC Router Master">CNC Router Master (سی این سی آپریٹر)</option>
              <option value="Wood Carver & Mistri">Wood Carver & Mistri (لکڑی کاریگر)</option>
              <option value="Door Polish Master">Door Polish Master (پالش کاریگر)</option>
              <option value="Cutter Master">Cutter Master (آرا کٹنگ ماسٹر)</option>
              <option value="Workshop Helper">Workshop Helper (ہیلپر / شاگرد)</option>
              <option value="Other Worker">Other Worker (دیگر)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Phone Number / Mobile
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="03001234567"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Hisab Ka Tareeqa
              </label>
              <select
                value={wageType}
                onChange={(e) => setWageType(e.target.value as KarigarWageType)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
              >
                <option value="DAILY">Daily (یومیہ دیہاڑی)</option>
                <option value="MONTHLY">Monthly (ماہانہ تنخواہ)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                {wageType === 'DAILY' ? 'Yomiya Dihaari (Rs.)' : 'Mahana Tankhwah (Rs.)'}{' '}
                <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={dailyWage}
                  onChange={(e) => setDailyWage(e.target.value)}
                  placeholder="2000"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-amber-700 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs shadow-sm"
                />
              </div>
            </div>
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
              Save Karigar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

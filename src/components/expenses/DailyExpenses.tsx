import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  Trash2,
  Calendar,
  Zap,
  Coffee,
  Users,
  Wrench,
  Home,
  FileText,
  DollarSign,
  Eye,
} from 'lucide-react';
import { useWorkshopStore } from '../../store/useWorkshopStore';
import { ExpenseCategory, Expense } from '../../types';
import { formatPKR, formatDate, getTodayDate } from '../../utils/currency';
import { ExpenseDetailModal } from '../modals/ExpenseDetailModal';

export const DailyExpenses: React.FC = () => {
  const expenses = useWorkshopStore((state) => state.expenses);
  const addExpense = useWorkshopStore((state) => state.addExpense);
  const deleteExpense = useWorkshopStore((state) => state.deleteExpense);

  const [date, setDate] = useState(getTodayDate());
  const [category, setCategory] = useState<ExpenseCategory>('Chai/Khana');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const categoryPresets: { id: ExpenseCategory; label: string; icon: any; color: string }[] = [
    { id: 'Chai/Khana', label: 'Chai / Khana', icon: Coffee, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
    { id: 'Mazdoori', label: 'Mazdoori (Labor)', icon: Users, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
    { id: 'Tooling/CNC Bits', label: 'Tooling / CNC Bits', icon: Wrench, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
    { id: 'Bijli', label: 'Bijli / Generator', icon: Zap, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' },
    { id: 'Kiraya', label: 'Kiraya (Shop Rent)', icon: Home, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
    { id: 'Other', label: 'Other / Mutafarriq', icon: FileText, color: 'text-slate-400 bg-slate-500/10 border-slate-500/30' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount) || 0;
    if (numAmount <= 0 || !description.trim()) return;

    addExpense(date, category, description, numAmount);
    setDescription('');
    setAmount('');
  };

  const totalExpenseToday = expenses.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="h-[calc(100vh-105px)] flex flex-col md:flex-row overflow-hidden bg-slate-100 p-4 gap-4">
      {/* ========================================================================= */}
      {/* LEFT: Expense Form                                                        */}
      {/* ========================================================================= */}
      <div className="md:w-96 flex flex-col bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-rose-700 font-extrabold text-sm border-b border-slate-200 pb-3">
          <Receipt className="w-5 h-5 text-rose-600" />
          <span>Naya Kharcha Darj Karein (نیا خرچہ)</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Kharcha Tareekh (Date)
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium shadow-sm font-mono"
              />
            </div>
          </div>

          {/* Category Selector Chips */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Category (خرچہ کی قسم)
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {categoryPresets.map((cat) => {
                const isSelected = category === cat.id;
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`p-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border text-left ${
                      isSelected
                        ? 'bg-rose-50 border-rose-400 text-rose-700 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Tafseel (Description) <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Ustad Farooq Dihari / CNC 6mm Bit"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium shadow-sm"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Rakam (Amount in Rs.) <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">Rs.</span>
              <input
                type="number"
                required
                min="1"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-12 pr-3 py-2.5 text-lg font-black text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono shadow-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            <Plus className="w-4 h-4" />
            <span>Kharcha Darj Karein (Save Expense)</span>
          </button>
        </form>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600">
          <p className="font-semibold text-slate-800 mb-0.5">💡 Note:</p>
          <p className="text-[11px] leading-relaxed">
            Yeh kharcha foran aaj ke physical cash drawer (گلہ) se deduct ho jayega aur closing tally mein show hoga.
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT: Today's Expenses List                                              */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Aaj Ke Kul Kharajat (Today's Expenses)</h3>
            <p className="text-xs text-slate-500 mt-0.5">Tareekh: {formatDate(date)}</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500 uppercase tracking-wider block font-bold">Kul Kharcha:</span>
            <span className="text-xl font-black text-rose-700 font-mono">{formatPKR(totalExpenseToday)}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {expenses.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-8">
              <Receipt className="w-12 h-12 text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-700">Aaj koi kharcha darj nahi hai</p>
              <p className="text-xs text-slate-500">Bayen taraf se kharcha shamil karein.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {expenses.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedExpense(item)}
                  className="bg-slate-50/70 border border-slate-200 rounded-xl p-3 flex items-center justify-between hover:bg-amber-50/70 transition shadow-xs cursor-pointer group"
                  title="Kharcha Voucher dekhne ke liye click karein"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold px-2 py-1 rounded-lg bg-white text-slate-700 border border-slate-200 shadow-xs">
                      {item.category}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{item.description}</h4>
                      <p className="text-[11px] text-slate-500 font-mono">{formatDate(item.expense_date)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-sm font-black font-mono text-rose-700">
                      - {formatPKR(item.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedExpense(item);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-bold text-[11px] transition shadow-xs inline-flex items-center gap-1"
                      title="Voucher Dekhein / Print Karein"
                    >
                      <Eye className="w-3 h-3 text-slate-500" />
                      <span>Voucher</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteExpense(item.id);
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                      title="Delete expense"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Expense Voucher Inspection Modal */}
      <ExpenseDetailModal
        expense={selectedExpense}
        onClose={() => setSelectedExpense(null)}
      />
    </div>
  );
};

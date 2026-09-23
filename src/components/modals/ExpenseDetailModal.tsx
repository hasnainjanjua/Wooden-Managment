import React from 'react';
import {
  X,
  Receipt,
  Calendar,
  DollarSign,
  Printer,
  FileText,
  Zap,
  Coffee,
  Users,
  Wrench,
  Home,
  Wallet,
} from 'lucide-react';
import { Expense, ExpenseCategory } from '../../types';
import { formatPKR, formatDate } from '../../utils/currency';
import { useWorkshopStore } from '../../store/useWorkshopStore';

interface ExpenseDetailModalProps {
  expense: Expense | null;
  onClose: () => void;
}

export const ExpenseDetailModal: React.FC<ExpenseDetailModalProps> = ({
  expense,
  onClose,
}) => {
  const shopSettings = useWorkshopStore((state) => state.shopSettings);

  if (!expense) return null;

  const getCategoryInfo = (cat: ExpenseCategory) => {
    switch (cat) {
      case 'Chai/Khana':
        return { icon: Coffee, color: 'text-amber-700 bg-amber-100 border-amber-200' };
      case 'Mazdoori':
        return { icon: Users, color: 'text-blue-700 bg-blue-100 border-blue-200' };
      case 'Tooling/CNC Bits':
        return { icon: Wrench, color: 'text-cyan-700 bg-cyan-100 border-cyan-200' };
      case 'Bijli':
        return { icon: Zap, color: 'text-yellow-700 bg-yellow-100 border-yellow-200' };
      case 'Kiraya':
        return { icon: Home, color: 'text-emerald-700 bg-emerald-100 border-emerald-200' };
      default:
        return { icon: FileText, color: 'text-slate-700 bg-slate-100 border-slate-200' };
    }
  };

  const catInfo = getCategoryInfo(expense.category);
  const Icon = catInfo.icon;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden my-auto flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${catInfo.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Kharcha Voucher (Expense Details)</h3>
              <p className="text-xs text-slate-500 font-medium">
                Voucher #EXP-{expense.id} • {formatDate(expense.expense_date)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4" id="expense-voucher-printable">
          {/* Amount Hero */}
          <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-1">
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
              Kharcha Rakam (Amount Spent)
            </span>
            <div className="text-3xl font-black font-mono text-rose-700">
              {formatPKR(expense.amount)}
            </div>
            <span className="inline-block text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-white border border-rose-200 text-rose-800 mt-1">
              {expense.category}
            </span>
          </div>

          {/* Details Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Tareekh (Date):</span>
              <span className="font-bold text-slate-900 font-mono">{formatDate(expense.expense_date)}</span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Category:</span>
              <span className="font-bold text-slate-900">{expense.category}</span>
            </div>

            <div>
              <span className="text-slate-500 font-medium block mb-1">Wazahat / Description:</span>
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-800 font-semibold leading-relaxed">
                {expense.description}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center gap-2 text-slate-500 text-[11px]">
              <Wallet className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Yeh raqam aaj ke dukan ke galle (cash drawer) se deduct ho chuki hai.</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition shadow-sm"
          >
            Band Karein
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Voucher / PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { X, Printer, CheckCircle2, Cpu } from 'lucide-react';
import { CncJob, ShopSettings } from '../../types';
import { formatPKR, formatDate } from '../../utils/currency';

interface PrintCncJobModalProps {
  isOpen: boolean;
  job: CncJob | null;
  settings: ShopSettings;
  onClose: () => void;
}

export const PrintCncJobModal: React.FC<PrintCncJobModalProps> = ({
  isOpen,
  job,
  settings,
  onClose,
}) => {
  if (!isOpen || !job) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto print:static print:inset-auto print:p-0 print:m-0 print:bg-white print:overflow-visible print:block">
      <div className="bg-slate-100 border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden my-auto animate-in fade-in zoom-in duration-150 print:border-none print:shadow-none print:bg-white print:w-full print:max-w-none print:m-0 print:p-0 print:rounded-none">
        {/* Top Control Bar (Hidden during print) */}
        <div className="no-print bg-slate-50 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-900 font-bold text-sm">
            <Cpu className="w-4 h-4 text-cyan-700" />
            <span>CNC Karkhana Slip / Token</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print (80mm)</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* The Printable Slip (80mm Thermal Slip format) */}
        <div
          className="p-6 bg-white text-black font-mono text-xs max-w-[80mm] w-full mx-auto my-4 shadow-lg rounded-sm print:border-none print:shadow-none print:my-0 print:mx-auto print:p-3"
          id="cnc-printable-area"
        >
          {/* Header */}
          <div className="text-center border-b-2 border-dashed border-gray-400 pb-3 mb-3">
            <h2 className="text-base font-extrabold tracking-tight uppercase">
              {settings.shop_name}
            </h2>
            <p className="text-xs font-serif font-bold text-gray-800 mt-0.5 font-urdu">
              {settings.urdu_title}
            </p>
            <p className="text-[11px] text-gray-700 mt-0.5">{settings.tagline}</p>
            <p className="text-[11px] text-gray-800 font-bold mt-1">
              Ph: {settings.phone1} {settings.phone2 ? `/ ${settings.phone2}` : ''}
            </p>
            <p className="text-[10px] text-gray-600">{settings.address}</p>
            <div className="mt-2 inline-block bg-black text-white text-[11px] font-bold px-3 py-0.5 rounded">
              CNC WORK ORDER / TOKEN SLIP
            </div>
          </div>

          {/* Job & Customer Details */}
          <div className="text-xs space-y-1.5 mb-3 border-b border-dashed border-gray-300 pb-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Token No:</span>
              <span className="font-extrabold text-sm">{job.job_no}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Order Tareekh:</span>
              <span>{formatDate(job.job_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Customer:</span>
              <span className="font-bold">
                {job.customer_name || job.customer_name_manual || 'Walk-in Customer'}
              </span>
            </div>
            {job.customer_phone && (
              <div className="flex justify-between">
                <span className="text-gray-600">Phone:</span>
                <span>{job.customer_phone}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Current Status:</span>
              <span className="font-bold uppercase text-[11px]">{job.status}</span>
            </div>
          </div>

          {/* Specification Box */}
          <div className="bg-gray-100 p-2.5 rounded border border-gray-300 text-xs mb-3 space-y-1">
            <div>
              <span className="text-gray-600 font-bold block text-[10px] uppercase">
                Kaam Ki Tafseel (Description):
              </span>
              <span className="font-bold text-black">{job.job_description}</span>
            </div>
            {job.size_specification && (
              <div className="pt-1 border-t border-gray-200">
                <span className="text-gray-600 font-bold block text-[10px] uppercase">
                  Size / Sheet Spec (سائز):
                </span>
                <span className="font-bold text-black font-sans">
                  📐 {job.size_specification}
                </span>
              </div>
            )}
            {job.notes && (
              <div className="pt-1 border-t border-gray-200">
                <span className="text-gray-600 text-[10px] uppercase block">Notes:</span>
                <span className="text-gray-800">{job.notes}</span>
              </div>
            )}
          </div>

          {/* Financials */}
          <div className="border-t-2 border-dashed border-gray-400 pt-2 space-y-1.5 text-xs">
            <div className="flex justify-between font-bold">
              <span>Kul Rate (Agreed Total):</span>
              <span>Rs. {job.total_amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-emerald-800 font-bold">
              <span>Advance Paid (پیشگی وصول):</span>
              <span>Rs. {job.paid_amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-black text-sm border-t-2 border-gray-900 pt-1.5">
              <span>Baqaya at Delivery:</span>
              <span className={job.remaining_amount > 0 ? 'text-rose-700' : 'text-gray-900'}>
                Rs. {job.remaining_amount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Signatures & Footer Notice */}
          <div className="mt-6 pt-3 border-t border-dashed border-gray-300 text-[10px] text-gray-700 text-center space-y-3">
            <div className="flex justify-between pt-4 font-bold text-[10px]">
              <span>Customer Signature</span>
              <span>Workshop Stamp</span>
            </div>
            <p className="font-bold font-urdu text-[11px] mt-2">
              نوٹ: مال وصول کرتے وقت یہ پرچی دکھانا لازمی ہے۔
            </p>
            <p className="text-[9px] text-gray-500">{settings.shop_name}</p>
          </div>
        </div>

        {/* Bottom Bar (Hidden during print) */}
        <div className="no-print bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl text-xs shadow-sm transition flex items-center gap-1.5 active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print 80mm Token Slip</span>
          </button>
        </div>
      </div>
    </div>
  );
};

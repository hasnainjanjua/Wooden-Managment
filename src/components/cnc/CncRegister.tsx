import React, { useState } from 'react';
import {
  Cpu,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  PlayCircle,
  AlertTriangle,
  DollarSign,
  Calendar,
  Layers,
  FileText,
  User,
  Calculator,
  Printer,
  Truck,
} from 'lucide-react';
import { useWorkshopStore } from '../../store/useWorkshopStore';
import { CncJob, CncStatus } from '../../types';
import { formatPKR, formatDate, getTodayDate } from '../../utils/currency';
import { CncPaymentModal } from '../modals/CncPaymentModal';
import { PrintCncJobModal } from '../modals/PrintCncJobModal';
import { SqftCalculatorModal } from '../modals/SqftCalculatorModal';
import { GatePassModal } from '../modals/GatePassModal';

export const CncRegister: React.FC = () => {
  const cncJobs = useWorkshopStore((state) => state.cncJobs);
  const customers = useWorkshopStore((state) => state.customers);
  const createCncJob = useWorkshopStore((state) => state.createCncJob);
  const updateCncStatus = useWorkshopStore((state) => state.updateCncStatus);
  const openVoidModal = useWorkshopStore((state) => state.openVoidModal);
  const shopSettings = useWorkshopStore((state) => state.shopSettings);

  // Form State
  const [customerId, setCustomerId] = useState<number | ''>('');
  const [customerNameManual, setCustomerNameManual] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [sizeSpecification, setSizeSpecification] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [status, setStatus] = useState<CncStatus>('Pending');
  const [notes, setNotes] = useState('');
  const [jobDate, setJobDate] = useState(getTodayDate());

  // Table Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CncStatus>('ALL');

  // Modals State
  const [paymentTargetJob, setPaymentTargetJob] = useState<CncJob | null>(null);
  const [printTargetJob, setPrintTargetJob] = useState<CncJob | null>(null);
  const [gatePassJob, setGatePassJob] = useState<CncJob | null>(null);
  const [isSqftModalOpen, setIsSqftModalOpen] = useState(false);

  // Calculations for form
  const total = parseFloat(totalAmount) || 0;
  const advance = parseFloat(paidAmount) || 0;
  const remaining = Math.max(0, total - advance);

  const handleApplySqft = (item: {
    name: string;
    sqft: number;
    rate: number;
    total: number;
    dimensionsText: string;
  }) => {
    setSizeSpecification(item.dimensionsText);
    setTotalAmount(item.total.toString());
    if (!jobDescription.trim()) {
      setJobDescription(item.name.split(' - ')[0] || 'CNC Jali Cutting');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDescription.trim() || total <= 0) return;

    createCncJob({
      customer_id: customerId !== '' ? Number(customerId) : null,
      customer_name_manual: customerNameManual || undefined,
      job_description: jobDescription,
      size_specification: sizeSpecification,
      total_amount: total,
      paid_amount: advance,
      remaining_amount: remaining,
      status,
      notes,
      job_date: jobDate,
    });

    // Reset form
    setCustomerId('');
    setCustomerNameManual('');
    setJobDescription('');
    setSizeSpecification('');
    setTotalAmount('');
    setPaidAmount('');
    setStatus('Pending');
    setNotes('');
  };

  const filteredJobs = cncJobs.filter((job) => {
    const matchesStatus = statusFilter === 'ALL' || job.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const custName = (job.customer_name || job.customer_name_manual || '').toLowerCase();
    const desc = job.job_description.toLowerCase();
    const jobNo = job.job_no.toLowerCase();
    const matchesQuery = q === '' || custName.includes(q) || desc.includes(q) || jobNo.includes(q);
    return matchesStatus && matchesQuery;
  });

  const nextStatusMap: Record<CncStatus, CncStatus> = {
    Pending: 'In Progress',
    'In Progress': 'Completed',
    Completed: 'Pending',
  };

  return (
    <div className="h-[calc(100vh-105px)] flex flex-col overflow-hidden bg-slate-100 p-4 space-y-4">
      {/* ========================================================================= */}
      {/* TOP: New CNC Job Entry Form                                               */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3 text-cyan-800 font-extrabold text-sm">
          <Cpu className="w-4 h-4 text-cyan-600" />
          <span>Naya CNC Cutting / Carving Order (نیا سی این سی جاب)</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Row 1: Customer Selection or Manual Input */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Customer (Muntakhib Karein)
              </label>
              <select
                value={customerId}
                onChange={(e) => {
                  setCustomerId(e.target.value ? Number(e.target.value) : '');
                  if (e.target.value) setCustomerNameManual('');
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium shadow-sm"
              >
                <option value="">-- Manual / Walk-in Name Likhain --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {customerId === '' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Manual Customer Name
                </label>
                <input
                  type="text"
                  value={customerNameManual}
                  onChange={(e) => setCustomerNameManual(e.target.value)}
                  placeholder="e.g. Asif Carpenter"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Order Tareekh (Date)
              </label>
              <input
                type="date"
                required
                value={jobDate}
                onChange={(e) => setJobDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-sm font-mono"
              />
            </div>
          </div>

          {/* Row 2: Job Description, Size, Status */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Job Description (کام کی تفصیل) <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="e.g. 16mm MDF Jali Cutting / Ash Solid Door 3D Relief"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium shadow-sm"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Size / Spec (سائز)
                </label>
                <button
                  type="button"
                  onClick={() => setIsSqftModalOpen(true)}
                  className="text-[10px] text-cyan-700 hover:text-cyan-800 font-bold flex items-center gap-1 underline underline-offset-2"
                >
                  <Calculator className="w-3 h-3" />
                  <span>فٹ کیلکولیٹر</span>
                </button>
              </div>
              <input
                type="text"
                value={sizeSpecification}
                onChange={(e) => setSizeSpecification(e.target.value)}
                placeholder="e.g. 8x4 Sheet / 3.5x7 Door"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CncStatus)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-semibold shadow-sm"
              >
                <option value="Pending">Pending (زیر التواء)</option>
                <option value="In Progress">In Progress (جاری ہے)</option>
                <option value="Completed">Completed (مکمل)</option>
              </select>
            </div>
          </div>

          {/* Row 3: Financials & Submit */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end pt-1">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Agreed Amount (کل رقم) <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs">Rs.</span>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-cyan-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Advance Paid (پیشگی وصول)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs">Rs.</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Baqaya (Remaining)
              </label>
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-rose-600 font-mono">
                {formatPKR(remaining)}
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-black rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.99]"
              >
                <Plus className="w-4 h-4" />
                <span>Save CNC Job (آرڈر محفوظ کریں)</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM: Filterable Active CNC Jobs Table                                  */}
      {/* ========================================================================= */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden shadow-sm">
        {/* Table Controls */}
        <div className="p-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-bold text-slate-900">CNC Register Jobs</h3>
            <span className="text-xs bg-cyan-50 text-cyan-800 px-2.5 py-0.5 rounded-full font-bold border border-cyan-200">
              {filteredJobs.length} Orders
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Status Filter buttons */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              {(['ALL', 'Pending', 'In Progress', 'Completed'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg font-bold transition text-[11px] ${
                    statusFilter === st
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search job / customer..."
                className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Jobs List Table */}
        <div className="flex-1 overflow-y-auto">
          {filteredJobs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8 text-center">
              <Cpu className="w-12 h-12 text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-700">Koi CNC Order nahi mila</p>
              <p className="text-xs text-slate-500">Upar دیے gaye form se naya order shamil karein.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-100 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 pl-4 pr-2">Job No</th>
                  <th className="py-2.5 px-2">Tareekh</th>
                  <th className="py-2.5 px-2">Customer</th>
                  <th className="py-2.5 px-2">Job Description & Size</th>
                  <th className="py-2.5 px-2 text-right">Agreed Rate</th>
                  <th className="py-2.5 px-2 text-right">Advance Paid</th>
                  <th className="py-2.5 px-2 text-right">Baqaya</th>
                  <th className="py-2.5 px-2 text-center">Status</th>
                  <th className="py-2.5 pr-4 pl-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredJobs.map((job) => {
                  const isCompleted = job.status === 'Completed';
                  const isVoid = job.is_void === 1;

                  return (
                    <tr
                      key={job.id}
                      className={`hover:bg-slate-50 transition ${
                        isVoid ? 'opacity-40 line-through bg-rose-50' : ''
                      }`}
                    >
                      <td className="py-3 pl-4 pr-2 font-mono font-bold text-cyan-700">
                        {job.job_no}
                      </td>
                      <td className="py-3 px-2 text-slate-600 font-mono">
                        {formatDate(job.job_date)}
                      </td>
                      <td className="py-3 px-2 font-semibold text-slate-900">
                        {job.customer_name || job.customer_name_manual || 'Walk-in'}
                        {job.customer_phone && (
                          <span className="block text-[10px] font-normal text-slate-400">
                            {job.customer_phone}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <div className="font-semibold text-slate-800">{job.job_description}</div>
                        {job.size_specification && (
                          <span className="text-[11px] text-cyan-700 font-mono">
                            📐 {job.size_specification}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right font-bold text-slate-900 font-mono">
                        {formatPKR(job.total_amount)}
                      </td>
                      <td className="py-3 px-2 text-right font-bold text-emerald-700 font-mono">
                        {formatPKR(job.paid_amount)}
                      </td>
                      <td className="py-3 px-2 text-right font-black text-rose-700 font-mono">
                        {formatPKR(job.remaining_amount)}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <button
                          disabled={isVoid}
                          onClick={() => updateCncStatus(job.id, nextStatusMap[job.status])}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition ${
                            job.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : job.status === 'In Progress'
                              ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                          }`}
                          title="Click to toggle status"
                        >
                          {job.status === 'Completed' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {job.status === 'In Progress' && <PlayCircle className="w-3 h-3 text-amber-600" />}
                          {job.status === 'Pending' && <Clock className="w-3 h-3 text-slate-500" />}
                          <span>{job.status}</span>
                        </button>
                      </td>
                      <td className="py-3 pr-4 pl-2 text-right space-x-1.5">
                        <button
                          onClick={() => setPrintTargetJob(job)}
                          className="px-2.5 py-1 bg-cyan-50 hover:bg-cyan-600 text-cyan-800 hover:text-white font-bold rounded-lg border border-cyan-200 text-[11px] transition inline-flex items-center gap-1 shadow-sm"
                          title="Print 80mm Karkhana Slip / Token"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Token</span>
                        </button>

                        {!isVoid && (
                          <button
                            onClick={() => setGatePassJob(job)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg border border-slate-300 text-[11px] transition inline-flex items-center gap-1 shadow-sm"
                            title="Gate Pass / Delivery Challan"
                          >
                            <Truck className="w-3 h-3 text-blue-600" />
                            <span>Gate Pass</span>
                          </button>
                        )}

                        {job.remaining_amount > 0 && !isVoid && (
                          <button
                            onClick={() => setPaymentTargetJob(job)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white font-bold rounded-lg border border-emerald-200 text-[11px] transition inline-flex items-center gap-1 shadow-sm"
                          >
                            <DollarSign className="w-3 h-3" />
                            <span>Wasool</span>
                          </button>
                        )}
                        {!isVoid && (
                          <button
                            onClick={() => openVoidModal('cnc', job.id, job.job_no)}
                            className="px-2 py-1 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 rounded-lg text-[11px] transition font-medium"
                            title="Mansookh (Void)"
                          >
                            Void
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* CNC Payment Modal */}
      <CncPaymentModal
        isOpen={!!paymentTargetJob}
        job={paymentTargetJob}
        onClose={() => setPaymentTargetJob(null)}
      />

      {/* Print CNC Job Token Modal */}
      <PrintCncJobModal
        isOpen={!!printTargetJob}
        job={printTargetJob}
        settings={shopSettings}
        onClose={() => setPrintTargetJob(null)}
      />

      {/* Sqft Calculator Modal */}
      <SqftCalculatorModal
        isOpen={isSqftModalOpen}
        onClose={() => setIsSqftModalOpen(false)}
        onApply={handleApplySqft}
        defaultRate={120}
        initialName="CNC Jali Cut / Wood Work"
      />

      {/* Gate Pass Modal */}
      <GatePassModal
        isOpen={Boolean(gatePassJob)}
        defaultData={
          gatePassJob
            ? {
                cncJobId: gatePassJob.id,
                customerName: gatePassJob.customer_name || gatePassJob.customer_name_manual || 'Walk-in Customer',
                customerPhone: gatePassJob.customer_phone || '',
                itemsSummary: `CNC Job #${gatePassJob.job_no}: ${gatePassJob.job_description} (${gatePassJob.size_specification || 'Custom'})`,
                totalAmount: gatePassJob.total_amount,
                advancePaid: gatePassJob.paid_amount,
                remainingBalance: gatePassJob.remaining_amount,
              }
            : undefined
        }
        onClose={() => setGatePassJob(null)}
      />
    </div>
  );
};

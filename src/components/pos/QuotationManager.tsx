import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Trash2,
  Printer,
  CheckCircle,
  Clock,
  ArrowRight,
  Calculator,
  UserPlus,
  Send,
} from 'lucide-react';
import { useWorkshopStore } from '../../store/useWorkshopStore';
import { Quotation, QuotationItem } from '../../types';
import { formatPKR, formatDate, getTodayDate } from '../../utils/currency';
import { PrintQuotationModal } from '../modals/PrintQuotationModal';
import { TimberCalculatorModal } from '../modals/TimberCalculatorModal';

export const QuotationManager: React.FC = () => {
  const quotations = useWorkshopStore((state) => state.quotations);
  const customers = useWorkshopStore((state) => state.customers);
  const catalogItems = useWorkshopStore((state) => state.catalogItems);
  const createQuotation = useWorkshopStore((state) => state.createQuotation);
  const convertQuotationToInvoice = useWorkshopStore((state) => state.convertQuotationToInvoice);
  const deleteQuotation = useWorkshopStore((state) => state.deleteQuotation);
  const showToast = useWorkshopStore((state) => state.showToast);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // New Quotation Creation Drawer/State
  const [isCreating, setIsCreating] = useState(false);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [manualCustomerName, setManualCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [quoteDate, setQuoteDate] = useState(getTodayDate());
  const [quoteNotes, setQuoteNotes] = useState('');
  const [quoteDiscount, setQuoteDiscount] = useState('0');
  const [items, setItems] = useState<Array<{
    item_id?: number | null;
    item_name: string;
    quantity: number;
    rate: number;
    line_total: number;
  }>>([
    { item_name: '', quantity: 1, rate: 0, line_total: 0 },
  ]);

  // Timber modal in Quote mode
  const [isTimberModalOpen, setIsTimberModalOpen] = useState(false);

  // Active Print/View Quote
  const [activePrintQuote, setActivePrintQuote] = useState<Quotation | null>(null);

  // Convert Modal State
  const [convertModalQuoteId, setConvertModalQuoteId] = useState<number | null>(null);
  const [advanceCash, setAdvanceCash] = useState('');

  // Handle Customer Selection
  const handleCustomerChange = (idStr: string) => {
    if (!idStr) {
      setCustomerId(null);
      return;
    }
    const id = parseInt(idStr, 10);
    setCustomerId(id);
    const c = customers.find((cust) => cust.id === id);
    if (c) {
      setManualCustomerName(c.name);
      setCustomerPhone(c.phone || '');
    }
  };

  const handleAddItemRow = () => {
    setItems([...items, { item_name: '', quantity: 1, rate: 0, line_total: 0 }]);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    const row = { ...updated[index], [field]: value };
    if (field === 'quantity' || field === 'rate') {
      const q = parseFloat(field === 'quantity' ? value : row.quantity.toString()) || 0;
      const r = parseFloat(field === 'rate' ? value : row.rate.toString()) || 0;
      row.line_total = Math.round(q * r);
    }
    updated[index] = row;
    setItems(updated);
  };

  const handlePickCatalogItem = (index: number, itemIdStr: string) => {
    if (!itemIdStr) return;
    const catId = parseInt(itemIdStr, 10);
    const catItem = catalogItems.find((c) => c.id === catId);
    if (catItem) {
      const updated = [...items];
      updated[index] = {
        item_id: catItem.id,
        item_name: catItem.name,
        quantity: 1,
        rate: catItem.default_rate,
        line_total: catItem.default_rate,
      };
      setItems(updated);
    }
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleTimberApply = (timberItem: any) => {
    const newItem = {
      item_name: `${timberItem.title} - ${timberItem.description}`,
      quantity: timberItem.quantity,
      rate: Math.round(timberItem.totalPrice / (timberItem.quantity || 1)),
      line_total: timberItem.totalPrice,
    };
    // Replace first empty or append
    if (items.length === 1 && !items[0].item_name) {
      setItems([newItem]);
    } else {
      setItems([...items, newItem]);
    }
  };

  const calculateSubtotal = () => items.reduce((sum, it) => sum + (it.line_total || 0), 0);
  const discountVal = parseFloat(quoteDiscount) || 0;
  const quoteTotal = Math.max(0, calculateSubtotal() - discountVal);

  const handleSaveQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCustName = manualCustomerName.trim() || 'Walk-in Customer';
    const validItems = items.filter((it) => it.item_name.trim().length > 0 && it.quantity > 0);

    if (validItems.length === 0) {
      showToast('Kam az kam aik item ka naam aur tadad darj karein!', 'error');
      return;
    }

    const created = createQuotation({
      customer_id: customerId,
      customer_name: finalCustName,
      customer_phone: customerPhone.trim(),
      quote_date: quoteDate,
      total_amount: quoteTotal,
      discount_amount: discountVal,
      notes: quoteNotes,
      items: validItems,
    });

    setIsCreating(false);
    // Reset form
    setItems([{ item_name: '', quantity: 1, rate: 0, line_total: 0 }]);
    setManualCustomerName('');
    setCustomerPhone('');
    setCustomerId(null);
    setQuoteNotes('');
    setQuoteDiscount('0');

    // Open print preview
    setActivePrintQuote(created);
  };

  const handleExecuteConvert = async () => {
    if (!convertModalQuoteId) return;
    const cash = parseFloat(advanceCash) || 0;
    const res = await convertQuotationToInvoice(convertModalQuoteId, cash);
    if (res.success) {
      setConvertModalQuoteId(null);
      setAdvanceCash('');
    }
  };

  // Filtered Quotations
  const filteredQuotations = quotations.filter((q) => {
    const matchesSearch =
      q.quote_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.customer_phone && q.customer_phone.includes(searchQuery));
    const matchesStatus = filterStatus === 'ALL' || q.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5">
      {/* Top Header Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Quotations & Estimates
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Create estimates for clients, share via WhatsApp or print, and convert to Final Bill in 1-click
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black px-4 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 text-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ New Quotation</span>
        </button>
      </div>

      {/* Create Quotation Drawer / Card */}
      {isCreating && (
        <form
          onSubmit={handleSaveQuotation}
          className="bg-white border-2 border-amber-400 rounded-2xl p-5 shadow-lg space-y-4 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600" />
              <span>Naya Estimate / Kacha Bill Form</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-xs font-bold text-slate-400 hover:text-slate-700"
            >
              Cancel (بند کریں)
            </button>
          </div>

          {/* Customer & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Select Customer (گاہک کا انتخاب)
              </label>
              <select
                value={customerId || ''}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="">-- Manual Walk-in / New Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Customer Name (نام)
              </label>
              <input
                type="text"
                required
                value={manualCustomerName}
                onChange={(e) => setManualCustomerName(e.target.value)}
                placeholder="Gaahek ka naam"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                WhatsApp Phone (موبائل نمبر)
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="03001234567"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Estimate Date (تاریخ)
              </label>
              <input
                type="date"
                required
                value={quoteDate}
                onChange={(e) => setQuoteDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
              />
            </div>
          </div>

          {/* Quick Dimension Calculator Button */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-bold text-slate-700">
              Items Detail (اشیاء اور ریٹس کی تفصیل):
            </span>
            <button
              type="button"
              onClick={() => setIsTimberModalOpen(true)}
              className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Calculator className="w-3.5 h-3.5 text-amber-700" />
              <span>CFT / SFT Calculator (پیمائش شامل کریں)</span>
            </button>
          </div>

          {/* Item Rows */}
          <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
            {items.map((row, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-3 sm:col-span-3">
                  <select
                    onChange={(e) => handlePickCatalogItem(idx, e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs text-slate-700 font-medium"
                    defaultValue=""
                  >
                    <option value="" disabled>-- Pick from Stock --</option>
                    {catalogItems.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} (Rs. {cat.default_rate})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-4 sm:col-span-4">
                  <input
                    type="text"
                    required
                    placeholder="Item description (e.g. 8x4 MDF Sheet or Polish)"
                    value={row.item_name}
                    onChange={(e) => handleItemChange(idx, 'item_name', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-bold text-slate-800"
                  />
                </div>

                <div className="col-span-2 sm:col-span-2">
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    required
                    placeholder="Qty"
                    value={row.quantity || ''}
                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-bold text-slate-800 text-center"
                  />
                </div>

                <div className="col-span-2 sm:col-span-2">
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="Rate"
                    value={row.rate || ''}
                    onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-bold text-slate-800 text-right"
                  />
                </div>

                <div className="col-span-1 text-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveItemRow(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddItemRow}
              className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 mt-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Another Row (ایک اور آئٹم شامل کریں)</span>
            </button>
          </div>

          {/* Notes & Discount & Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Terms / Notes (شرائط یا تفصیل)
              </label>
              <input
                type="text"
                placeholder="e.g. 15 din me delivery, fitting shamil hai"
                value={quoteNotes}
                onChange={(e) => setQuoteNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Discount Amount (ڈسکاؤنٹ)
              </label>
              <input
                type="number"
                min="0"
                value={quoteDiscount}
                onChange={(e) => setQuoteDiscount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-800 block">
                  Estimated Total:
                </span>
                <span className="text-xl font-black text-amber-900">
                  {formatPKR(quoteTotal)}
                </span>
              </div>
              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-4 py-2 rounded-xl text-xs shadow-md transition"
              >
                Save & Preview Slip
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Quote # or Customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-800 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
          {['ALL', 'PENDING', 'CONVERTED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterStatus === st
                  ? 'bg-white text-slate-900 shadow-sm font-black'
                  : 'hover:text-slate-900'
              }`}
            >
              {st === 'ALL' ? 'Tamam (All)' : st === 'PENDING' ? 'Pending (کچا)' : 'Converted (پکا بل)'}
            </button>
          ))}
        </div>
      </div>

      {/* Quotations List */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {filteredQuotations.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-bold text-slate-600">Koi Quotation nahi mila</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Naya estimate banane ke liye upar "+ New Quotation" ka button dabayein
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Quote No</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items Summary</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQuotations.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono font-black text-amber-700">
                      {q.quote_no}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {formatDate(q.quote_date)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{q.customer_name}</div>
                      {q.customer_phone && (
                        <div className="text-[11px] font-mono text-slate-500">{q.customer_phone}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-600">
                      {(q.items || []).map((it) => `${it.item_name} (×${it.quantity})`).join(', ') || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-slate-900 text-sm">
                      {formatPKR(q.total_amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          q.status === 'CONVERTED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {q.status === 'CONVERTED' ? '✓ Converted (پکا بل)' : '⏳ Pending (کچا)'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setActivePrintQuote(q)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                          title="View / Print / WhatsApp"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {q.status !== 'CONVERTED' && (
                          <button
                            onClick={() => {
                              setConvertModalQuoteId(q.id);
                              setAdvanceCash('');
                            }}
                            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1.5 rounded-lg text-[11px] transition shadow-sm active:scale-95"
                            title="Convert to Final Bill"
                          >
                            <CheckCircle className="w-3 h-3" />
                            <span>Convert</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            if (window.confirm(`Kya aap Quotation #${q.quote_no} delete karna chahte hain?`)) {
                              deleteQuotation(q.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Timber Calculator Modal */}
      <TimberCalculatorModal
        isOpen={isTimberModalOpen}
        onClose={() => setIsTimberModalOpen(false)}
        onInsertToCart={handleTimberApply}
      />

      {/* Print / WhatsApp Preview Modal */}
      {activePrintQuote && (
        <PrintQuotationModal
          quotation={activePrintQuote}
          onClose={() => setActivePrintQuote(null)}
          onConvert={(qId) => {
            setConvertModalQuoteId(qId);
            setAdvanceCash('');
          }}
        />
      )}

      {/* Convert to Bill Confirmation Modal */}
      {convertModalQuoteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-5 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-base">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span>Convert to Final Bill (پکا بل بنائیں)</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Yeh quotation direct <strong>Sales Invoice (کاؤنٹر بل)</strong> me tabdeel ho jayega aur stock se items deduct ho jayenge.
            </p>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Advance Cash Received (پیشگی نقد رقم):
              </label>
              <input
                type="number"
                min="0"
                placeholder="Rs. 0 (Agar advance mila hai)"
                value={advanceCash}
                onChange={(e) => setAdvanceCash(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConvertModalQuoteId(null)}
                className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteConvert}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Confirm & Create Bill</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

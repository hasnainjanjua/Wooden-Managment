import React, { useState } from 'react';
import { X, Truck, Printer, Send, CheckCircle } from 'lucide-react';
import { useWorkshopStore } from '../../store/useWorkshopStore';
import { formatPKR, formatDate, getTodayDate } from '../../utils/currency';
import { sendWhatsAppMessage } from '../../utils/whatsapp';

interface GatePassModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultData?: {
    invoiceId?: number;
    cncJobId?: number;
    customerName: string;
    customerPhone?: string;
    itemsSummary: string;
    totalAmount: number;
    advancePaid: number;
    remainingBalance: number;
  };
}

export const GatePassModal: React.FC<GatePassModalProps> = ({
  isOpen,
  onClose,
  defaultData,
}) => {
  const shopSettings = useWorkshopStore((state) => state.shopSettings);
  const createChallan = useWorkshopStore((state) => state.createChallan);

  const [customerName, setCustomerName] = useState(defaultData?.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(defaultData?.customerPhone || '');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [itemsSummary, setItemsSummary] = useState(defaultData?.itemsSummary || '');
  const [totalBillAmount, setTotalBillAmount] = useState(defaultData?.totalAmount?.toString() || '0');
  const [advancePaid, setAdvancePaid] = useState(defaultData?.advancePaid?.toString() || '0');
  const [challanDate, setChallanDate] = useState(getTodayDate());

  const [savedChallan, setSavedChallan] = useState<any>(null);

  if (!isOpen) return null;

  const total = parseFloat(totalBillAmount) || 0;
  const advance = parseFloat(advancePaid) || 0;
  const codDue = Math.max(0, total - advance);

  const handleSaveAndPrint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !itemsSummary.trim()) {
      alert('Gaahek ka naam aur maal ki tafseel likhein!');
      return;
    }

    const challan = createChallan({
      invoice_id: defaultData?.invoiceId,
      cnc_job_id: defaultData?.cncJobId,
      customer_name: customerName,
      customer_phone: customerPhone,
      destination_address: destinationAddress,
      driver_name: driverName,
      driver_phone: driverPhone,
      vehicle_no: vehicleNo,
      items_summary: itemsSummary,
      total_bill_amount: total,
      advance_paid: advance,
      cod_balance_due: codDue,
      challan_date: challanDate,
    });

    setSavedChallan(challan);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    const lines = [
      `🪵 *${shopSettings.shop_name}*`,
      `🚚 *DELIVERY CHALLAN & GATE PASS (مال برداری پرچی)*`,
      `━━━━━━━━━━━━━━━━━━`,
      `Gate Pass No: *#${savedChallan?.challan_no || 'GP'}*`,
      `Date: ${formatDate(challanDate)}`,
      `Customer: *${customerName}*`,
      destinationAddress ? `Address: ${destinationAddress}` : '',
      `Driver: *${driverName || 'N/A'}* (${vehicleNo || 'N/A'})`,
      driverPhone ? `Driver Phone: ${driverPhone}` : '',
      `━━━━━━━━━━━━━━━━━━`,
      `*DISPATCHED ITEMS (مال کی تفصیل):*`,
      `${itemsSummary}`,
      `━━━━━━━━━━━━━━━━━━`,
      `Total Bill: Rs. ${total.toLocaleString()}`,
      `Advance Paid: Rs. ${advance.toLocaleString()}`,
      `*CASH ON DELIVERY (ڈرائیور نے وصول کرنا ہے): ${formatPKR(codDue)}*`,
      `━━━━━━━━━━━━━━━━━━`,
      `_Baraye meherbani maal check karke receipt par dastakhat karein._`,
      `📞 ${shopSettings.phone1}`,
    ];

    sendWhatsAppMessage(customerPhone || driverPhone || '', lines.filter(Boolean).join('\n'));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto print:static print:inset-auto print:p-0 print:m-0 print:bg-white print:overflow-visible print:block">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150 my-auto print:border-none print:shadow-none print:w-full print:max-w-none print:m-0 print:p-0">
        {/* Header */}
        <div className="no-print bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-400" />
            <span className="font-extrabold text-sm">
              {savedChallan ? 'Gate Pass Slip (پرنٹ / شیئر)' : 'Generate Gate Pass / Delivery Challan'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!savedChallan ? (
          /* Input Form */
          <form onSubmit={handleSaveAndPrint} className="p-5 space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Customer Phone</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="03001234567"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Destination Address (پتہ / منزل)</label>
              <input
                type="text"
                value={destinationAddress}
                onChange={(e) => setDestinationAddress(e.target.value)}
                placeholder="e.g. House 45, Street 4, Model Town"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-800"
              />
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Driver Name</label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="e.g. Aslam Khan"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Driver Phone</label>
                <input
                  type="text"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  placeholder="0300..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Vehicle / Suzuki No</label>
                <input
                  type="text"
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value)}
                  placeholder="e.g. LES-4820"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 font-bold text-slate-800 uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Dispatched Items (مال کی تفصیل و تعداد)
              </label>
              <textarea
                rows={2}
                required
                value={itemsSummary}
                onChange={(e) => setItemsSummary(e.target.value)}
                placeholder="e.g. 6 Solid Doors (Sheesham), 2 Bed frames, 4 CNC Panels"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800"
              />
            </div>

            {/* Financials / COD */}
            <div className="grid grid-cols-3 gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3">
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-600">Total Bill:</span>
                <input
                  type="number"
                  value={totalBillAmount}
                  onChange={(e) => setTotalBillAmount(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-1.5 font-bold text-slate-800"
                />
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-600">Advance Paid:</span>
                <input
                  type="number"
                  value={advancePaid}
                  onChange={(e) => setAdvancePaid(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-1.5 font-bold text-slate-800"
                />
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-amber-800">COD Due (ڈرائیور نے لینا ہے):</span>
                <div className="text-base font-black text-rose-700 pt-1.5">
                  {formatPKR(codDue)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <Truck className="w-4 h-4" />
                <span>Save & Generate Gate Pass</span>
              </button>
            </div>
          </form>
        ) : (
          /* Printable Slip View */
          <div className="p-6 bg-white">
            <div className="printable-area text-slate-800 text-xs">
              <div className="text-center border-b border-slate-300 pb-3 mb-3">
                <h2 className="text-base font-black uppercase text-slate-900">
                  {shopSettings.shop_name}
                </h2>
                <p className="text-xs font-bold text-amber-700 font-urdu">{shopSettings.urdu_title}</p>
                <p className="text-[10px] text-slate-500">{shopSettings.address} | 📞 {shopSettings.phone1}</p>
                <div className="mt-2 inline-block bg-slate-900 text-white font-black text-[10px] px-3 py-0.5 rounded-full uppercase tracking-wider">
                  GATE PASS & DELIVERY CHALLAN (گیٹ پاس)
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 border border-slate-200 rounded-lg p-2.5 bg-slate-50 mb-3 text-[11px]">
                <div>
                  <div>Challan No: <strong className="font-mono text-slate-900">{savedChallan.challan_no}</strong></div>
                  <div>Date: <strong>{formatDate(savedChallan.challan_date)}</strong></div>
                  <div>Vehicle No: <strong className="uppercase">{savedChallan.vehicle_no || 'N/A'}</strong></div>
                  <div>Driver: <strong>{savedChallan.driver_name || 'N/A'}</strong> ({savedChallan.driver_phone || 'N/A'})</div>
                </div>
                <div className="text-right">
                  <div>Customer: <strong className="text-slate-900 font-bold">{savedChallan.customer_name}</strong></div>
                  <div>Phone: {savedChallan.customer_phone || 'N/A'}</div>
                  {savedChallan.destination_address && (
                    <div className="text-slate-600 mt-1">Dest: {savedChallan.destination_address}</div>
                  )}
                </div>
              </div>

              {/* Items loaded */}
              <div className="border border-slate-200 rounded-lg p-3 mb-3">
                <div className="font-bold text-slate-700 uppercase text-[10px] mb-1">
                  Loaded Items Checklist (لوڈ کیا گیا مال):
                </div>
                <p className="font-bold text-slate-900 whitespace-pre-line text-xs">
                  {savedChallan.items_summary}
                </p>
              </div>

              {/* Financial Box */}
              <div className="bg-slate-100 border border-slate-300 rounded-lg p-3 flex justify-between items-center mb-6">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Total: Rs. {savedChallan.total_bill_amount.toLocaleString()}</div>
                  <div className="text-[10px] text-emerald-700 font-bold">Advance: Rs. {savedChallan.advance_paid.toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-slate-600">Balance to Collect (COD):</div>
                  <div className="text-base font-black text-rose-700">
                    {formatPKR(savedChallan.cod_balance_due)}
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-3 text-center text-[10px] text-slate-500 pt-3 border-t border-slate-300">
                <div>
                  <div className="border-t border-slate-400 mx-2 pt-1 font-medium">Gate Guard / Checker</div>
                </div>
                <div>
                  <div className="border-t border-slate-400 mx-2 pt-1 font-medium">Driver Signature</div>
                </div>
                <div>
                  <div className="border-t border-slate-400 mx-2 pt-1 font-bold text-slate-800">Receiver Signature</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="no-print mt-6 pt-3 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => setSavedChallan(null)}
                className="text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                ← Create Another
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleWhatsApp}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip (پرنٹ کریں)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

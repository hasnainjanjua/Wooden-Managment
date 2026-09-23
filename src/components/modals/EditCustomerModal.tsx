import React, { useState, useEffect } from 'react';
import { X, UserCheck, Phone, MapPin } from 'lucide-react';
import { useWorkshopStore } from '../../store/useWorkshopStore';
import { Customer } from '../../types';

interface EditCustomerModalProps {
  isOpen: boolean;
  customer: Customer | null;
  onClose: () => void;
}

export const EditCustomerModal: React.FC<EditCustomerModalProps> = ({
  isOpen,
  customer,
  onClose,
}) => {
  const updateCustomer = useWorkshopStore((state) => state.updateCustomer);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setPhone(customer.phone || '');
      setAddress(customer.address || '');
    }
  }, [customer]);

  if (!isOpen || !customer) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    updateCustomer(customer.id, name.trim(), phone.trim(), address.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
        <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-700 font-bold text-base">
            <UserCheck className="w-5 h-5 text-amber-600" />
            <span>Customer Maloomat Update Karein</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Customer Name / Naam <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-xs shadow-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Phone Number / Mobile
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="03001234567"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Address / Workshop / Pata
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Timber Market, Shop #4"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl font-medium text-xs transition"
            >
              Mansookh (Cancel)
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-sm transition active:scale-95"
            >
              Update Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Printer,
  Save,
  UserPlus,
  DoorClosed,
  Wrench,
  Cpu,
  AlertCircle,
  Calendar,
  X,
  Calculator,
  History,
  PackagePlus,
  Truck,
  CreditCard,
  Trees,
  Zap,
  ArrowLeft,
  ShoppingBag,
} from 'lucide-react';
import { useWorkshopStore } from '../../store/useWorkshopStore';
import { CatalogCategory } from '../../types';
import { formatPKR, formatNumber, formatDate } from '../../utils/currency';
import { QuickCustomerModal } from '../modals/QuickCustomerModal';
import { SqftCalculatorModal } from '../modals/SqftCalculatorModal';
import { AddStockItemModal } from '../modals/AddStockItemModal';
import { TimberCalculatorModal } from '../modals/TimberCalculatorModal';
import { GatePassModal } from '../modals/GatePassModal';

export const PosBilling: React.FC = () => {
  const catalogItems = useWorkshopStore((state) => state.catalogItems);
  const customers = useWorkshopStore((state) => state.customers);
  const cart = useWorkshopStore((state) => state.cart);
  const selectedCustomerId = useWorkshopStore((state) => state.selectedCustomerId);
  const discountAmount = useWorkshopStore((state) => state.discountAmount);
  const cashReceived = useWorkshopStore((state) => state.cashReceived);
  const invoiceDate = useWorkshopStore((state) => state.invoiceDate);
  const invoiceNotes = useWorkshopStore((state) => state.invoiceNotes);
  const setActiveTab = useWorkshopStore((state) => state.setActiveTab);

  const addToCart = useWorkshopStore((state) => state.addToCart);
  const updateCartItem = useWorkshopStore((state) => state.updateCartItem);
  const removeFromCart = useWorkshopStore((state) => state.removeFromCart);
  const clearCart = useWorkshopStore((state) => state.clearCart);
  const setSelectedCustomerId = useWorkshopStore((state) => state.setSelectedCustomerId);
  const setDiscountAmount = useWorkshopStore((state) => state.setDiscountAmount);
  const setCashReceived = useWorkshopStore((state) => state.setCashReceived);
  const setInvoiceDate = useWorkshopStore((state) => state.setInvoiceDate);
  const setInvoiceNotes = useWorkshopStore((state) => state.setInvoiceNotes);
  const checkout = useWorkshopStore((state) => state.checkout);
  const invoices = useWorkshopStore((state) => state.invoices);
  const reprintInvoice = useWorkshopStore((state) => state.reprintInvoice);
  const addTimberItemToCart = useWorkshopStore((state) => state.addTimberItemToCart);

  // Local UI State
  const [selectedCategory, setSelectedCategory] = useState<CatalogCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isQuickCustomerOpen, setIsQuickCustomerOpen] = useState(false);
  const [isSqftModalOpen, setIsSqftModalOpen] = useState(false);
  const [isTimberModalOpen, setIsTimberModalOpen] = useState(false);
  const [gatePassData, setGatePassData] = useState<any>(null);
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [splitBankAmount, setSplitBankAmount] = useState('');
  const [splitBankName, setSplitBankName] = useState('Meezan Bank / EasyPaisa');
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const [isRecentBillsOpen, setIsRecentBillsOpen] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemRate, setCustomItemRate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileTab, setMobileTab] = useState<'ITEMS' | 'CART'>('ITEMS');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const cashInputRef = useRef<HTMLInputElement>(null);

  // Calculations (Memoized for high performance)
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.line_total, 0), [cart]);
  const netTotal = Math.max(0, subtotal - discountAmount);
  const baqaya = Math.max(0, netTotal - cashReceived);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId) || null,
    [customers, selectedCustomerId]
  );

  // Filter Catalog Items (Memoized for high performance)
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return catalogItems.filter((item) => {
      if (item.is_active !== 1) return false;
      const matchesCat = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchesSearch = q === '' || item.name.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [catalogItems, selectedCategory, searchQuery]);

  // Keyboard shortcut listener for F-keys and Alt+N
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'F3') {
        e.preventDefault();
        cashInputRef.current?.focus();
      } else if (e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        setIsQuickCustomerOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customItemName.trim()) return;
    const rate = parseFloat(customItemRate) || 0;
    addToCart(
      {
        name: customItemName.trim(),
        default_rate: rate,
        category: 'SERVICE',
      },
      rate
    );
    setCustomItemName('');
    setCustomItemRate('');
  };

  const handleApplySqft = (item: {
    name: string;
    sqft: number;
    rate: number;
    total: number;
  }) => {
    addToCart(
      {
        name: item.name,
        default_rate: item.rate,
        category: 'SERVICE',
      },
      item.rate
    );
    setTimeout(() => {
      const currentCart = useWorkshopStore.getState().cart;
      const idx = currentCart.length - 1;
      if (idx >= 0) {
        updateCartItem(idx, { quantity: item.sqft });
      }
    }, 50);
  };

  const handleCheckout = async (printReceipt = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (isSplitPayment) {
        const bankAmt = parseFloat(splitBankAmount) || 0;
        if (bankAmt > 0) {
          const combinedCash = cashReceived + bankAmt;
          setCashReceived(combinedCash);
          setInvoiceNotes(
            `${invoiceNotes ? invoiceNotes + ' | ' : ''}[Split: Cash Rs.${cashReceived} + Online Rs.${bankAmt} via ${splitBankName}]`
          );
        }
      }
      const res = await checkout(printReceipt);
      if (res.success) {
        setIsSplitPayment(false);
        setSplitBankAmount('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-[calc(100vh-105px)] flex flex-col lg:flex-row overflow-hidden bg-slate-100">
      {/* ========================================================================= */}
      {/* COLUMN 1: LEFT - Category & Quick-Tap Catalog Items Grid (Fixed ~600px on Desktop) */}
      {/* ========================================================================= */}
      <div
        className={`w-full lg:w-[520px] xl:w-[600px] 2xl:w-[640px] lg:shrink-0 flex flex-col border-r border-slate-200 bg-white overflow-hidden ${
          mobileTab === 'ITEMS' ? 'flex' : 'hidden lg:flex'
        }`}
      >
        {/* Category Tabs, Direct Item & Search Bar */}
        <div className="p-3 border-b border-slate-200 space-y-2.5 bg-slate-50">
          {/* Quick Actions Header: Add Stock Item & Timber Calculator & Invoices */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddStockModalOpen(true)}
              className="flex-1 py-2 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95 border border-emerald-600 cursor-pointer"
              title="Add a new item to Catalog/Stock"
            >
              <PackagePlus className="w-4 h-4" />
              <span>+ Item</span>
            </button>
            <button
              type="button"
              onClick={() => setIsTimberModalOpen(true)}
              className="py-2 px-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95 border border-amber-600 cursor-pointer"
              title="Timber CFT & Sheet SFT Dimension Calculator"
            >
              <Trees className="w-4 h-4 text-amber-200" />
              <span>Timber / SFT</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('invoices')}
              className="py-2 px-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
              title="Open Recent Sales & Invoices Register"
            >
              <History className="w-4 h-4 text-amber-400" />
              <span>Recent Bills</span>
            </button>
          </div>

          {/* Quick Direct Item Entry Bar (MOVED TO TOP FOR INSTANT ACCESS) */}
          <div className="p-2.5 bg-amber-50/90 border border-amber-200 rounded-xl shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-black text-amber-900 uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 fill-current text-amber-600" />
                <span>Direct Item Entry (فوری اینٹری):</span>
              </span>
              <span className="text-[10px] text-amber-800/80 font-medium">Polish, Fitting, Labour etc.</span>
            </div>
            <form onSubmit={handleAddCustomItem} className="flex gap-1.5">
              <input
                type="text"
                value={customItemName}
                onChange={(e) => setCustomItemName(e.target.value)}
                placeholder="Item name (e.g. Polish, Fitting, Custom Door)..."
                className="flex-1 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium shadow-xs"
              />
              <input
                type="number"
                value={customItemRate}
                onChange={(e) => setCustomItemRate(e.target.value)}
                placeholder="Rate Rs."
                className="w-24 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-amber-800 font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono shadow-xs"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-1 shadow-sm active:scale-95 whitespace-nowrap cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add</span>
              </button>
            </form>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search door, lock, qabza (F1)..."
              className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id: 'ALL', label: 'All', icon: null },
              { id: 'DOOR', label: 'Doors', icon: DoorClosed },
              { id: 'HARDWARE', label: 'Hardware', icon: Wrench },
              { id: 'SERVICE', label: 'Services', icon: Cpu },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Catalog Items Grid */}
        <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2.5 content-start bg-slate-50/50">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              onClick={() => addToCart(item)}
              className="group relative text-left bg-white hover:bg-amber-50/50 border border-slate-200 hover:border-amber-400 rounded-xl p-2.5 transition shadow-sm hover:shadow-md flex flex-col justify-between active:scale-[0.98]"
            >
              <div>
                <div className="flex justify-between items-start mb-1">
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      item.category === 'DOOR'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : item.category === 'HARDWARE'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {item.category}
                  </span>

                  {item.stock_qty !== undefined && item.category !== 'SERVICE' && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                        item.stock_qty <= 0
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : item.stock_qty <= (item.min_stock_alert || 5)
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {item.stock_qty <= 0 ? 'Out of stock' : `${item.stock_qty} pcs`}
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition leading-snug line-clamp-2">
                  {item.name}
                </h4>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-black text-amber-700">
                  {formatPKR(item.default_rate)}
                </span>
                <span className="w-5 h-5 rounded-full bg-slate-100 group-hover:bg-amber-500 group-hover:text-slate-950 flex items-center justify-center text-slate-600 transition text-xs font-bold">
                  +
                </span>
              </div>
            </button>
          ))}

          {filteredItems.length === 0 && (
            <div className="col-span-2 sm:col-span-2 md:col-span-3 lg:col-span-2 xl:col-span-3 text-center py-8 text-slate-500 text-xs">
              Koi item nahi mila. Uper direct item se shamil karein.
            </div>
          )}
        </div>

        {/* Mobile Floating Cart Dock (Only visible on mobile screens < 1024px when on ITEMS view) */}
        {cart.length > 0 && (
          <div className="lg:hidden p-3 bg-white border-t border-slate-200 shadow-2xl flex items-center justify-between z-20 shrink-0">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block tracking-wider">Cart Total</span>
              <span className="text-base font-black text-amber-700 font-mono">
                {formatPKR(netTotal)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setMobileTab('CART')}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black rounded-xl text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Checkout ({cart.length}) ➔</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* COLUMN 2 & 3 WRAPPER: Center Cart Table & Right Checkout Form             */}
      {/* ========================================================================= */}
      <div
        className={`flex-1 flex flex-col lg:flex-row overflow-hidden ${
          mobileTab === 'CART' ? 'flex' : 'hidden lg:flex'
        }`}
      >
        {/* Mobile Header to Switch Back to Items */}
        <div className="lg:hidden px-3.5 py-2.5 bg-slate-900 text-white font-bold text-xs flex items-center justify-between shrink-0 shadow-sm">
          <button
            type="button"
            onClick={() => setMobileTab('ITEMS')}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg active:scale-95 cursor-pointer text-xs font-bold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← Add More Items</span>
          </button>
          <span className="font-mono text-xs text-amber-400">
            {cart.length} items | {formatPKR(netTotal)}
          </span>
        </div>

        {/* ========================================================================= */}
        {/* COLUMN 2: CENTER - Active Cart Table with Fast Inline Overrides           */}
        {/* ========================================================================= */}
        <div className="flex-1 flex flex-col border-r border-slate-200 bg-white overflow-hidden min-h-[260px] lg:min-h-0">
          {/* Cart Top Bar */}
          <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">Active Sale Items</h2>
            <span className="bg-amber-100 text-amber-900 font-extrabold text-xs px-2 py-0.5 rounded-full border border-amber-200">
              {cart.length} items
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsTimberModalOpen(true)}
              className="text-xs text-amber-900 hover:text-amber-950 font-bold bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2.5 py-1 rounded-lg transition flex items-center gap-1.5 shadow-sm active:scale-95"
              title="Timber CFT & Sheet SFT Dimension Calculator"
            >
              <Trees className="w-3.5 h-3.5 text-amber-700" />
              <span>Timber / SFT Calc</span>
            </button>

            <button
              type="button"
              onClick={() => setIsRecentBillsOpen(true)}
              className="text-xs text-slate-700 hover:text-slate-900 font-bold bg-white hover:bg-slate-100 border border-slate-300 px-2.5 py-1 rounded-lg transition flex items-center gap-1.5 shadow-sm"
              title="Recent bills reprint"
            >
              <History className="w-3.5 h-3.5 text-amber-600" />
              <span>Recent Bills</span>
            </button>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-slate-500 hover:text-rose-600 font-medium transition flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Khali Karein (Clear)</span>
              </button>
            )}
          </div>
        </div>

        {/* Cart Table Container */}
        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 p-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
                <DoorClosed className="w-8 h-8" />
              </div>
              <p className="text-sm font-bold text-slate-800 mb-1">Cart khali hai</p>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                Bayen (Left) taraf se door, hardware ya custom item par click karein. Item direct cart mein shamil ho jayega.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-100 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 pl-4 pr-2">#</th>
                  <th className="py-2.5 px-2">Item Name</th>
                  <th className="py-2.5 px-2 text-center w-24">Tadad (Qty)</th>
                  <th className="py-2.5 px-2 text-right w-28">Rate (Manual)</th>
                  <th className="py-2.5 px-2 text-right w-28">Total</th>
                  <th className="py-2.5 pr-4 pl-2 text-center w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cart.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50 group transition">
                    <td className="py-2.5 pl-4 pr-2 text-slate-400 font-mono text-[11px]">
                      {index + 1}
                    </td>
                    <td className="py-2.5 px-2">
                      <input
                        type="text"
                        value={item.item_name}
                        onChange={(e) => updateCartItem(index, { item_name: e.target.value })}
                        className="w-full bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-amber-500 rounded px-1.5 py-1 text-xs font-semibold text-slate-900 focus:outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-2">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            updateCartItem(index, {
                              quantity: Math.max(1, item.quantity - 1),
                            })
                          }
                          className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          step="any"
                          value={item.quantity}
                          onChange={(e) =>
                            updateCartItem(index, {
                              quantity: Math.max(0.1, parseFloat(e.target.value) || 1),
                            })
                          }
                          className="w-12 bg-white border border-slate-300 rounded text-center py-1 font-bold text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updateCartItem(index, {
                              quantity: item.quantity + 1,
                            })
                          }
                          className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.rate}
                        onChange={(e) =>
                          updateCartItem(index, {
                            rate: Math.max(0, parseFloat(e.target.value) || 0),
                          })
                        }
                        className="w-24 bg-white border border-slate-300 rounded text-right py-1 px-2 font-bold text-amber-700 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                      />
                    </td>
                    <td className="py-2.5 px-2 text-right font-black text-slate-900 text-xs">
                      {formatPKR(item.line_total)}
                    </td>
                    <td className="py-2.5 pr-4 pl-2 text-center">
                      <button
                        onClick={() => removeFromCart(index)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded transition opacity-60 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* COLUMN 3: RIGHT - Customer Selection, Payment & Baqaya Totals (Fixed on Desktop) */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-[340px] xl:w-[380px] lg:shrink-0 flex flex-col bg-slate-50 overflow-y-auto p-4 space-y-4">
        {/* Customer Selector / Dropdown */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Customer / Gāhak (گاہک)
            </label>
            <button
              type="button"
              onClick={() => setIsQuickCustomerOpen(true)}
              className="text-xs text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1"
              title="Add new customer (Alt+N)"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Naya Customer</span>
            </button>
          </div>

          <select
            value={selectedCustomerId || ''}
            onChange={(e) => setSelectedCustomerId(e.target.value ? Number(e.target.value) : null)}
            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold shadow-sm"
          >
            <option value="">Naqad Gāhak (Walk-in Cash Customer)</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.phone ? `(${c.phone})` : ''} - Baqaya: Rs. {formatNumber(c.current_balance || 0)}
              </option>
            ))}
          </select>

          {/* Customer previous balance badge */}
          {selectedCustomer && (
            <div className="bg-white border border-slate-200 rounded-xl p-2.5 flex items-center justify-between text-xs shadow-sm">
              <div>
                <span className="text-slate-600 font-medium">Sabqa Khata Baqaya:</span>
                <p className="text-[11px] text-slate-500">{selectedCustomer.phone || 'No phone'}</p>
              </div>
              <span
                className={`text-sm font-black ${
                  (selectedCustomer.current_balance || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {formatPKR(selectedCustomer.current_balance || 0)}
              </span>
            </div>
          )}
        </div>

        {/* Date and Notes */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Tareekh (Date)
            </label>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Notes / Detail
            </label>
            <input
              type="text"
              value={invoiceNotes}
              onChange={(e) => setInvoiceNotes(e.target.value)}
              placeholder="e.g. Polish pending..."
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-sm"
            />
          </div>
        </div>

        {/* Billing Calculations Box */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
          <div className="flex justify-between items-center text-xs text-slate-600">
            <span>Subtotal (Kul Rakam):</span>
            <span className="font-bold text-slate-950">{formatPKR(subtotal)}</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-600">Riait / Discount (Rs.):</span>
            <div className="w-28">
              <input
                type="number"
                min="0"
                value={discountAmount || ''}
                onChange={(e) => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="0"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-right text-xs font-bold text-amber-700 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
              />
            </div>
          </div>

          {/* Net Total */}
          <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
            <div>
              <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block">
                Net Bill (صافی رقم)
              </span>
              <span className="text-[10px] text-slate-500">Total payable</span>
            </div>
            <span className="text-2xl font-black text-amber-600 tracking-tight font-mono">
              {formatPKR(netTotal)}
            </span>
          </div>

          {/* Cash Received Input */}
          <div className="pt-2 border-t border-slate-200 space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                <span>Naqad Wasool (Cash Paid)</span>
                <span className="text-[10px] font-mono text-slate-500">(F3)</span>
              </label>
              <button
                type="button"
                onClick={() => setCashReceived(netTotal)}
                className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold underline"
              >
                Poora Cash
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">Rs.</span>
              <input
                ref={cashInputRef}
                type="number"
                min="0"
                step="any"
                value={cashReceived || ''}
                onChange={(e) => setCashReceived(Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="0"
                className="w-full bg-emerald-50/50 border border-emerald-300 rounded-xl pl-9 pr-3 py-2.5 text-lg font-black text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono shadow-sm"
              />
            </div>
          </div>

          {/* Split Payment Toggle */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
              <input
                type="checkbox"
                checked={isSplitPayment}
                onChange={(e) => setIsSplitPayment(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
              />
              <CreditCard className="w-3.5 h-3.5 text-blue-600" />
              <span>Split Payment (کیش + آن لائن بینک)</span>
            </label>
          </div>

          {/* If Split Payment Active */}
          {isSplitPayment && (
            <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-2.5 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Online / Bank Rs.</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Rs. Bank"
                    value={splitBankAmount}
                    onChange={(e) => setSplitBankAmount(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-1.5 font-bold font-mono text-blue-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Bank / Account</label>
                  <input
                    type="text"
                    placeholder="Meezan / EasyPaisa"
                    value={splitBankName}
                    onChange={(e) => setSplitBankName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-1.5 font-medium text-slate-800"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Baqaya / Udhaar Balance Display */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between transition ${
              baqaya > 0
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <div>
              <span className="text-xs font-bold uppercase tracking-wider block">
                {baqaya > 0 ? 'Baqaya / Udhaar (بقیہ ادھار)' : 'Mukammal Ada (Paid)'}
              </span>
              {baqaya > 0 && !selectedCustomerId && (
                <span className="text-[10px] text-rose-600 font-semibold flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3 h-3" />
                  Customer select karna lazmi hai!
                </span>
              )}
            </div>
            <span
              className={`text-xl font-black font-mono ${
                baqaya > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {formatPKR(baqaya)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 space-y-2 mt-auto">
          <button
            type="button"
            disabled={isSubmitting || cart.length === 0}
            onClick={() => handleCheckout(false)}
            className="w-full py-3 bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-slate-800 font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 border border-slate-300 shadow-sm active:scale-[0.99]"
          >
            <Save className="w-4 h-4 text-amber-600" />
            <span>Save Entry (بل محفوظ کریں)</span>
          </button>

          <button
            type="button"
            disabled={isSubmitting || cart.length === 0}
            onClick={() => handleCheckout(true)}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 active:scale-[0.99]"
          >
            <Printer className="w-4 h-4" />
            <span>Save & Print 80mm Slip (پرنٹ سلپ)</span>
          </button>
        </div>
      </div>
    </div>

      {/* Quick Customer Modal */}
      <QuickCustomerModal
        isOpen={isQuickCustomerOpen}
        onClose={() => setIsQuickCustomerOpen(false)}
        onCustomerCreated={(newId) => setSelectedCustomerId(newId)}
      />

      {/* Sqft Calculator Modal */}
      <SqftCalculatorModal
        isOpen={isSqftModalOpen}
        onClose={() => setIsSqftModalOpen(false)}
        onApply={handleApplySqft}
        defaultRate={120}
        initialName="CNC Jali Cut / Wood Work"
      />

      {/* Recent Bills Reprint Modal */}
      {isRecentBillsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                <History className="w-4 h-4 text-amber-600" />
                <span>Recent Invoices (حالیہ بل اور ری پرنٹ)</span>
              </div>
              <button
                onClick={() => setIsRecentBillsOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto divide-y divide-slate-100">
              {invoices.slice(0, 15).map((inv) => (
                <div key={inv.id} className="py-2.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded-xl transition">
                  <div>
                    <span className="font-mono font-bold text-amber-700 text-xs mr-2">{inv.invoice_no}</span>
                    <span className="text-slate-900 font-semibold text-xs">{inv.customer_name || 'Walk-in Cash'}</span>
                    <span className="block text-[10px] text-slate-500 mt-0.5">{formatDate(inv.invoice_date)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs font-black text-slate-900 block">{formatPKR(inv.total_amount - inv.discount_amount)}</span>
                      <span className="text-[10px] text-emerald-700 font-bold">Wasool: {formatPKR(inv.cash_received)}</span>
                    </div>
                    <button
                      onClick={() => {
                        reprintInvoice(inv.id);
                        setIsRecentBillsOpen(false);
                      }}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-500 text-amber-800 hover:text-slate-950 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-amber-300 shadow-sm"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print</span>
                    </button>

                    <button
                      onClick={() => {
                        setGatePassData({
                          invoiceId: inv.id,
                          customerName: inv.customer_name || 'Walk-in Customer',
                          customerPhone: inv.customer_phone || '',
                          itemsSummary: `Invoice #${inv.invoice_no}`,
                          totalAmount: inv.total_amount - (inv.discount_amount || 0),
                          advancePaid: inv.cash_received,
                          remainingBalance: inv.balance_amount,
                        });
                        setIsRecentBillsOpen(false);
                      }}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-slate-300 shadow-sm"
                      title="Gate Pass / Delivery Challan"
                    >
                      <Truck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Gate Pass</span>
                    </button>
                  </div>
                </div>
              ))}
              {invoices.length === 0 && (
                <div className="text-center py-6 text-slate-500 text-xs">
                  Abhi tak koi bill generate nahi hua.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Stock Item Modal */}
      <AddStockItemModal
        isOpen={isAddStockModalOpen}
        onClose={() => setIsAddStockModalOpen(false)}
      />

      {/* Timber & Sheet Calculator Modal */}
      <TimberCalculatorModal
        isOpen={isTimberModalOpen}
        onClose={() => setIsTimberModalOpen(false)}
        onInsertToCart={addTimberItemToCart}
      />

      {/* Gate Pass & Delivery Challan Modal */}
      <GatePassModal
        isOpen={Boolean(gatePassData)}
        defaultData={gatePassData}
        onClose={() => setGatePassData(null)}
      />
    </div>
  );
};

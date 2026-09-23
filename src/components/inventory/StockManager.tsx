import React, { useState, useRef } from 'react';
import {
  Boxes,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Layers,
  ArrowUpDown,
  Plus,
  Trash2,
  Zap,
  Save,
  RotateCcw,
  Check,
  PackagePlus,
  FileSpreadsheet,
  X,
  Sparkles,
} from 'lucide-react';
import { useWorkshopStore } from '../../store/useWorkshopStore';
import { CatalogCategory, CatalogItem } from '../../types';
import { formatPKR } from '../../utils/currency';
import { StockAdjustModal } from '../modals/StockAdjustModal';
import { AddStockItemModal } from '../modals/AddStockItemModal';

interface StagedInwardItem {
  itemId: number;
  name: string;
  category: CatalogCategory;
  currentStock: number;
  addQty: number;
}

export const StockManager: React.FC = () => {
  const catalogItems = useWorkshopStore((state) => state.catalogItems);
  const lowStockItems = useWorkshopStore((state) => state.lowStockItems);
  const deleteCatalogItem = useWorkshopStore((state) => state.deleteCatalogItem);
  const adjustStock = useWorkshopStore((state) => state.adjustStock);
  const adjustMultipleStock = useWorkshopStore((state) => state.adjustMultipleStock);
  const showToast = useWorkshopStore((state) => state.showToast);

  const [activeCategory, setActiveCategory] = useState<CatalogCategory | 'ALL' | 'LOW_STOCK'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemForAdjust, setSelectedItemForAdjust] = useState<CatalogItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // 1. Instant Multi-Item Inward Pad state
  const [isBulkInwardOpen, setIsBulkInwardOpen] = useState(false);
  const [stagedItems, setStagedItems] = useState<StagedInwardItem[]>([]);
  const [selectedInwardId, setSelectedInwardId] = useState<number | ''>('');
  const [inwardQtyInput, setInwardQtyInput] = useState<string>('');
  const [inwardNotes, setInwardNotes] = useState<string>('');
  const itemSelectRef = useRef<HTMLSelectElement>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);

  // 2. Table-wide Bulk Sheet Edit Mode state
  const [isBulkGridMode, setIsBulkGridMode] = useState(false);
  const [gridQuantities, setGridQuantities] = useState<Record<number, number>>({});

  // 3. Inline Quick-Add in standard row state
  const [rowInputs, setRowInputs] = useState<Record<number, string>>({});
  const [justUpdatedId, setJustUpdatedId] = useState<number | null>(null);

  // Metrics
  const totalItems = catalogItems.length;
  const hardwareStock = catalogItems
    .filter((i) => i.category === 'HARDWARE')
    .reduce((sum, i) => sum + (i.stock_qty || 0), 0);
  const doorStock = catalogItems
    .filter((i) => i.category === 'DOOR')
    .reduce((sum, i) => sum + (i.stock_qty || 0), 0);
  const lowStockCount = lowStockItems.length;

  // Filter items
  const filteredItems = catalogItems.filter((item) => {
    if (activeCategory === 'LOW_STOCK') {
      const isLow = (item.stock_qty || 0) <= (item.min_stock_alert || 5);
      if (!isLow) return false;
    } else if (activeCategory !== 'ALL') {
      if (item.category !== activeCategory) return false;
    }

    const q = searchQuery.toLowerCase().trim();
    if (q && !item.name.toLowerCase().includes(q)) return false;

    return true;
  });

  // --- Handlers for Instant Multi-Item Inward Pad ---
  const handleStageInwardItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedInwardId) {
      showToast('Baraye meherbani item muntakhib karein', 'error');
      return;
    }
    const qty = parseInt(inwardQtyInput, 10);
    if (isNaN(qty) || qty <= 0) {
      showToast('Durust tadad (Quantity) darj karein', 'error');
      return;
    }

    const item = catalogItems.find((i) => i.id === selectedInwardId);
    if (!item) return;

    setStagedItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.itemId === item.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx].addQty += qty;
        return updated;
      }
      return [
        ...prev,
        {
          itemId: item.id,
          name: item.name,
          category: item.category,
          currentStock: item.stock_qty || 0,
          addQty: qty,
        },
      ];
    });

    setInwardQtyInput('');
    // Auto-focus back to item select for rapid entry
    if (itemSelectRef.current) itemSelectRef.current.focus();
  };

  const handleUpdateStagedQty = (itemId: number, newQty: number) => {
    if (newQty <= 0) {
      setStagedItems((prev) => prev.filter((i) => i.itemId !== itemId));
    } else {
      setStagedItems((prev) =>
        prev.map((i) => (i.itemId === itemId ? { ...i, addQty: newQty } : i))
      );
    }
  };

  const handleRemoveStagedItem = (itemId: number) => {
    setStagedItems((prev) => prev.filter((i) => i.itemId !== itemId));
  };

  const handleSaveStagedBatch = () => {
    if (stagedItems.length === 0) {
      showToast('Koi item shamil nahi kiya gaya', 'error');
      return;
    }

    adjustMultipleStock(
      stagedItems.map((i) => ({
        itemId: i.itemId,
        quantityChange: i.addQty,
        notes: inwardNotes.trim() || 'Multi-Item Stock Inward',
      }))
    );

    setStagedItems([]);
    setInwardNotes('');
    setIsBulkInwardOpen(false);
  };

  // --- Handlers for Table-wide Bulk Sheet Edit Mode ---
  const handleGridQtyChange = (itemId: number, val: string) => {
    const parsed = parseInt(val, 10);
    setGridQuantities((prev) => {
      const next = { ...prev };
      if (isNaN(parsed) || parsed === 0) {
        delete next[itemId];
      } else {
        next[itemId] = parsed;
      }
      return next;
    });
  };

  const handleGridPresetAdd = (itemId: number, delta: number) => {
    setGridQuantities((prev) => {
      const current = prev[itemId] || 0;
      const next = { ...prev, [itemId]: current + delta };
      return next;
    });
  };

  const pendingGridItemsCount = Object.keys(gridQuantities).length;
  const pendingGridTotalPieces = Object.values(gridQuantities).reduce((sum, v) => sum + v, 0);

  const handleSaveBulkGrid = () => {
    const entries = Object.entries(gridQuantities)
      .map(([idStr, qty]) => ({
        itemId: Number(idStr),
        quantityChange: qty,
        notes: 'Bulk Grid Sheet Entry',
      }))
      .filter((e) => e.quantityChange !== 0 && !isNaN(e.quantityChange));

    if (entries.length === 0) {
      showToast('Koi tadad darj nahi ki gayi', 'error');
      return;
    }

    adjustMultipleStock(entries);
    setGridQuantities({});
    setIsBulkGridMode(false);
  };

  // --- Handlers for In-Row Quick Add (Zero popup) ---
  const handleQuickRowAdd = (itemId: number, qtyToAdd: number) => {
    if (isNaN(qtyToAdd) || qtyToAdd <= 0) {
      showToast('Durust tadad darj karein', 'error');
      return;
    }

    adjustStock(itemId, qtyToAdd, 'IN_PURCHASE', 'Inline Quick Add');
    setRowInputs((prev) => ({ ...prev, [itemId]: '' }));
    setJustUpdatedId(itemId);
    setTimeout(() => setJustUpdatedId(null), 2500);
  };

  return (
    <div className="h-[calc(100vh-105px)] overflow-y-auto bg-slate-100 p-4 md:p-6 space-y-5">
      {/* Top Action Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shadow-sm">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-black text-slate-900 flex items-center gap-2">
              <span>Stock & Inventory Management</span>
              <span className="text-amber-700 font-urdu text-base font-semibold">(اسٹاک کنٹرول)</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Dukan ke Hardware, Doors, Locks aur fittings ki ginti aur rapid stock entry
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Button 1: Instant Multi-Item Inward */}
          <button
            onClick={() => setIsBulkInwardOpen((prev) => !prev)}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-black shadow-sm transition flex items-center justify-center gap-2 active:scale-95 border cursor-pointer ${
              isBulkInwardOpen
                ? 'bg-amber-600 text-white border-amber-700 ring-2 ring-amber-400'
                : 'bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-500'
            }`}
            title="Batch stock entry for multiple items at once"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>{isBulkInwardOpen ? '✕ Close Inward Pad' : '⚡ Multi-Item Stock Inward'}</span>
          </button>

          {/* Button 2: Excel-Style Bulk Sheet Mode */}
          <button
            onClick={() => {
              setIsBulkGridMode((prev) => !prev);
              if (isBulkGridMode) setGridQuantities({});
            }}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-black shadow-sm transition flex items-center justify-center gap-2 active:scale-95 border cursor-pointer ${
              isBulkGridMode
                ? 'bg-cyan-700 text-white border-cyan-800 ring-2 ring-cyan-400'
                : 'bg-slate-100 hover:bg-slate-200 text-cyan-900 border-slate-300'
            }`}
            title="Interactive spreadsheet mode to update quantities"
          >
            <FileSpreadsheet className="w-4 h-4 text-cyan-600" />
            <span>{isBulkGridMode ? 'Normal View' : '📊 Bulk Sheet Mode'}</span>
          </button>

          {/* Button 3: Add New Catalog Item Definition */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-sm transition flex items-center justify-center gap-1.5 active:scale-95 border border-emerald-600 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Item</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ⚡ INSTANT MULTI-ITEM INWARD PAD (NO POPUPS, MULTI-ROW BATCH ADDITION)     */}
      {/* ========================================================================= */}
      {isBulkInwardOpen && (
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white border-2 border-amber-500/40 rounded-2xl p-4 md:p-5 shadow-md space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-amber-200 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <span>Instant Multi-Item Stock Inward</span>
                  <span className="text-amber-800 font-urdu font-bold">(اکٹھی مال اینٹری)</span>
                </h3>
                <p className="text-[11px] text-slate-600">
                  Item select karein, quantity likh kar Enter dabayein, aur aik sath 10-20 items ka stock save karein
                </p>
              </div>
            </div>

            {/* Optional Supplier / Chalan Reference */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={inwardNotes}
                onChange={(e) => setInwardNotes(e.target.value)}
                placeholder="Chalan / Bill Ref (e.g. Babar Hardware #102)..."
                className="bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm w-full sm:w-64 font-medium"
              />
              <button
                onClick={() => setIsBulkInwardOpen(false)}
                className="p-1.5 rounded-lg hover:bg-amber-200 text-slate-600 hover:text-slate-900 transition"
                title="Band Karein"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Selection Form Bar */}
          <form onSubmit={handleStageInwardItem} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-white p-3 rounded-xl border border-amber-200 shadow-sm">
            <div className="sm:col-span-6">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Item Muntakhib Karein (Select Product)
              </label>
              <select
                ref={itemSelectRef}
                value={selectedInwardId}
                onChange={(e) => {
                  setSelectedInwardId(e.target.value ? Number(e.target.value) : '');
                  if (qtyInputRef.current) qtyInputRef.current.focus();
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
              >
                <option value="">-- Item Select Karein (یا نام ڈھونڈیں) --</option>
                {catalogItems
                  .filter((i) => i.is_active !== 0)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      [{item.category}] {item.name} — (Mojooda: {item.stock_qty || 0} pcs)
                    </option>
                  ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Aamad Tadad (+ Pieces)
              </label>
              <input
                ref={qtyInputRef}
                type="number"
                min="1"
                step="1"
                value={inwardQtyInput}
                onChange={(e) => setInwardQtyInput(e.target.value)}
                placeholder="e.g. 50"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono shadow-sm"
              />
            </div>

            <div className="sm:col-span-3">
              <button
                type="submit"
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95 border border-amber-600"
              >
                <Plus className="w-4 h-4" />
                <span>List Mein Shamil Karein</span>
              </button>
            </div>
          </form>

          {/* Staged Items List Table */}
          {stagedItems.length > 0 ? (
            <div className="bg-white border border-amber-200 rounded-xl overflow-hidden shadow-sm">
              <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-amber-50 text-amber-900 uppercase text-[10px] tracking-wider border-b border-amber-200 sticky top-0">
                    <tr>
                      <th className="py-2.5 pl-4 pr-2">#</th>
                      <th className="py-2.5 px-2">Item Name</th>
                      <th className="py-2.5 px-2 text-center">Mojooda Stock</th>
                      <th className="py-2.5 px-3 text-center">Naya Izafa (+ Qty)</th>
                      <th className="py-2.5 px-3 text-center">Total Bad Mein</th>
                      <th className="py-2.5 pr-4 pl-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stagedItems.map((item, idx) => {
                      const finalQty = item.currentStock + item.addQty;
                      return (
                        <tr key={item.itemId} className="hover:bg-amber-50/40 transition">
                          <td className="py-2.5 pl-4 pr-2 font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 px-2 font-bold text-slate-900">
                            <span>{item.name}</span>
                            <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                              {item.category}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-500">
                            {item.currentStock} pcs
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="number"
                              min="1"
                              value={item.addQty}
                              onChange={(e) => handleUpdateStagedQty(item.itemId, parseInt(e.target.value, 10) || 0)}
                              className="w-20 text-center font-black text-amber-700 bg-amber-50 border border-amber-300 rounded-lg py-1 px-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono">
                            <span className="font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                              {finalQty} pcs (+{item.addQty})
                            </span>
                          </td>
                          <td className="py-2.5 pr-4 pl-2 text-right">
                            <button
                              onClick={() => handleRemoveStagedItem(item.itemId)}
                              className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Batch Action Footer */}
              <div className="p-3 bg-amber-50/70 border-t border-amber-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-xs font-bold text-slate-700">
                  <span className="bg-amber-100 text-amber-900 px-2.5 py-1 rounded-lg border border-amber-300 font-mono">
                    {stagedItems.length} Items
                  </span>
                  <span>
                    Kul Izafa:{' '}
                    <strong className="text-emerald-700 font-mono">
                      +{stagedItems.reduce((sum, i) => sum + i.addQty, 0)} pieces
                    </strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setStagedItems([])}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                  >
                    Clear List
                  </button>
                  <button
                    onClick={handleSaveStagedBatch}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-md transition flex items-center gap-2 active:scale-95 border border-emerald-700"
                  >
                    <Check className="w-4 h-4" />
                    <span>یکدم تمام اسٹاک محفوظ کریں ({stagedItems.length} Items)</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-white/70 border border-dashed border-amber-300 rounded-xl text-center text-xs text-slate-500 font-medium">
              Upar diye gaye form se items aur unki tadad shamil karein, list yahan ban jaye gi.
            </div>
          )}
        </div>
      )}

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Catalog Items
            </span>
            <div className="text-2xl font-black text-slate-900 font-mono mt-1">{totalItems}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Hardware Total Stock
            </span>
            <div className="text-2xl font-black text-cyan-700 font-mono mt-1">{hardwareStock} pcs</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Doors in Stock
            </span>
            <div className="text-2xl font-black text-emerald-700 font-mono mt-1">{doorStock} pcs</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => setActiveCategory('LOW_STOCK')}
          className="cursor-pointer bg-white border border-rose-200 hover:border-rose-400 rounded-2xl p-4 shadow-sm flex items-center justify-between transition"
        >
          <div>
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">
              Kam Stock Alaram (Low Stock)
            </span>
            <div className="text-2xl font-black text-rose-700 font-mono mt-1">{lowStockCount} Items</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control Bar: Categories & Search */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        {/* Category Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs">
          {(['ALL', 'HARDWARE', 'DOOR', 'LOW_STOCK'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveCategory(tab)}
              className={`px-3 py-1.5 rounded-lg font-bold transition text-xs flex items-center gap-1.5 ${
                activeCategory === tab
                  ? tab === 'LOW_STOCK'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {tab === 'LOW_STOCK' && <AlertTriangle className="w-3.5 h-3.5" />}
              <span>
                {tab === 'ALL'
                  ? 'Tamam Items'
                  : tab === 'HARDWARE'
                  ? 'Hardware (قفل، قبضہ، اسکرو)'
                  : tab === 'DOOR'
                  ? 'Doors (دروازے)'
                  : `Kam Stock (${lowStockCount})`}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search item name (e.g. Qabza, Lock)..."
            className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium shadow-sm"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MAIN STOCK TABLE                                                          */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 pl-4 pr-2">#</th>
                <th className="py-3 px-2">Category</th>
                <th className="py-3 px-2">Item Name (نام)</th>
                <th className="py-3 px-2 text-right">Default Rate</th>
                <th className="py-3 px-3 text-center">Mojooda Stock</th>
                <th className="py-3 px-2 text-center">Status</th>

                {/* Conditional Column: Bulk Grid or Instant Quick-Add */}
                {isBulkGridMode ? (
                  <th className="py-3 px-4 text-center bg-cyan-50 text-cyan-900 font-black border-l border-r border-cyan-200">
                    ⚡ Naya Stock (+ / -) Sheet Entry
                  </th>
                ) : (
                  <th className="py-3 px-3 text-center bg-amber-50/50 text-amber-900 font-bold border-l border-slate-200">
                    ⚡ Instant Quick Add (+ Pieces)
                  </th>
                )}

                <th className="py-3 pr-4 pl-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item, idx) => {
                const stock = item.stock_qty || 0;
                const minAlert = item.min_stock_alert || 5;
                const isOutOfStock = stock <= 0;
                const isLow = stock > 0 && stock <= minAlert;
                const isJustUpdated = justUpdatedId === item.id;
                const gridPending = gridQuantities[item.id] || 0;
                const rowInputVal = rowInputs[item.id] || '';

                return (
                  <tr
                    key={item.id}
                    className={`transition ${
                      isJustUpdated
                        ? 'bg-emerald-100/70'
                        : gridPending !== 0
                        ? 'bg-cyan-50/60'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 pl-4 pr-2 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-3 px-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          item.category === 'DOOR'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : item.category === 'HARDWARE'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-2 font-bold text-slate-900 text-xs">{item.name}</td>
                    <td className="py-3 px-2 text-right font-black font-mono text-slate-900">
                      {formatPKR(item.default_rate)}
                    </td>

                    {/* Stock Display */}
                    <td className="py-3 px-3 text-center font-mono">
                      <span
                        className={`text-sm font-black px-3 py-1 rounded-xl inline-block ${
                          isOutOfStock
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : isLow
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {stock} pcs
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-2 text-center">
                      {isOutOfStock ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          <XCircle className="w-3 h-3" />
                          <span>Khatam (Out)</span>
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Kam Stock</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Mojood Hai</span>
                        </span>
                      )}
                    </td>

                    {/* CONDITIONAL COLUMN: 1. Bulk Grid Mode OR 2. Instant Quick-Add Stepper */}
                    {isBulkGridMode ? (
                      <td className="py-3 px-4 bg-cyan-50/30 border-l border-r border-cyan-100">
                        <div className="flex items-center justify-center gap-2">
                          <input
                            type="number"
                            placeholder="+0"
                            value={gridPending !== 0 ? gridPending : ''}
                            onChange={(e) => handleGridQtyChange(item.id, e.target.value)}
                            className="w-24 text-center font-mono font-black text-cyan-900 bg-white border border-cyan-300 rounded-xl px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-sm"
                          />
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleGridPresetAdd(item.id, 5)}
                              className="px-1.5 py-0.5 rounded bg-cyan-100 hover:bg-cyan-200 text-cyan-900 text-[10px] font-bold font-mono transition"
                            >
                              +5
                            </button>
                            <button
                              onClick={() => handleGridPresetAdd(item.id, 10)}
                              className="px-1.5 py-0.5 rounded bg-cyan-100 hover:bg-cyan-200 text-cyan-900 text-[10px] font-bold font-mono transition"
                            >
                              +10
                            </button>
                            <button
                              onClick={() => handleGridPresetAdd(item.id, 50)}
                              className="px-1.5 py-0.5 rounded bg-cyan-100 hover:bg-cyan-200 text-cyan-900 text-[10px] font-bold font-mono transition"
                            >
                              +50
                            </button>
                          </div>
                          {gridPending !== 0 && (
                            <span className="text-[11px] font-mono font-bold text-emerald-700">
                              ➔ {stock + gridPending} pcs
                            </span>
                          )}
                        </div>
                      </td>
                    ) : (
                      <td className="py-3 px-3 border-l border-slate-100 bg-amber-50/20">
                        <div className="flex items-center justify-center gap-1.5">
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleQuickRowAdd(item.id, parseInt(rowInputVal, 10));
                            }}
                            className="flex items-center gap-1"
                          >
                            <input
                              type="number"
                              min="1"
                              step="1"
                              placeholder="+Qty"
                              value={rowInputVal}
                              onChange={(e) =>
                                setRowInputs((prev) => ({ ...prev, [item.id]: e.target.value }))
                              }
                              className="w-16 text-center font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-lg py-1 px-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-sm"
                            />
                            <button
                              type="submit"
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm active:scale-95"
                              title="Stock foran shamil karein (Enter)"
                            >
                              +Add
                            </button>
                          </form>

                          {/* Fast Chips */}
                          <div className="hidden sm:flex items-center gap-1">
                            <button
                              onClick={() => handleQuickRowAdd(item.id, 5)}
                              className="px-1.5 py-1 rounded bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 text-[10px] font-mono font-bold transition border border-slate-200"
                              title="+5 add karein"
                            >
                              +5
                            </button>
                            <button
                              onClick={() => handleQuickRowAdd(item.id, 10)}
                              className="px-1.5 py-1 rounded bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 text-[10px] font-mono font-bold transition border border-slate-200"
                              title="+10 add karein"
                            >
                              +10
                            </button>
                            <button
                              onClick={() => handleQuickRowAdd(item.id, 50)}
                              className="px-1.5 py-1 rounded bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 text-[10px] font-mono font-bold transition border border-slate-200"
                              title="+50 add karein"
                            >
                              +50
                            </button>
                          </div>

                          {isJustUpdated && (
                            <span className="text-emerald-700 text-[10px] font-bold flex items-center gap-0.5 animate-in fade-in">
                              <Check className="w-3 h-3" />
                              Added!
                            </span>
                          )}
                        </div>
                      </td>
                    )}

                    {/* Standard Actions */}
                    <td className="py-3 pr-4 pl-2 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedItemForAdjust(item)}
                          className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold transition flex items-center gap-1 border border-slate-300 active:scale-95 shadow-sm"
                          title="Detailed Adjustment / Recount Modal"
                        >
                          <ArrowUpDown className="w-3 h-3 text-amber-600" />
                          <span className="hidden md:inline">Detail</span>
                        </button>
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                `Kya aap waqai '${item.name}' ko catalog aur stock se delete karna chahte hain?`
                              )
                            ) {
                              deleteCatalogItem(item.id);
                            }
                          }}
                          className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 transition active:scale-95 shadow-sm"
                          title="Item Delete Karein"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={isBulkGridMode ? 8 : 8} className="text-center py-10 text-slate-500">
                    Koi item nahi mila.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FLOATING ACTION DOCK FOR BULK SHEET EDIT MODE                             */}
      {/* ========================================================================= */}
      {isBulkGridMode && pendingGridItemsCount > 0 && (
        <div className="sticky bottom-4 z-40 bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-4 animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500 text-slate-950 flex items-center justify-center font-black">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-black text-white flex items-center gap-2">
                <span>{pendingGridItemsCount} Items Selected For Stock Update</span>
                <span className="bg-cyan-400/20 text-cyan-300 text-xs px-2 py-0.5 rounded-full border border-cyan-400/30 font-mono">
                  +{pendingGridTotalPieces} Pieces Total
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Changes abhi pending hain. Foran database mein save karne ke liye 'Apply All' dabayein.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setGridQuantities({})}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear / Cancel</span>
            </button>

            <button
              onClick={handleSaveBulkGrid}
              className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-cyan-500/20 transition flex items-center gap-2 active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>یکدم تمام تبدیلی محفوظ کریں ({pendingGridItemsCount} Items)</span>
            </button>
          </div>
        </div>
      )}

      {/* Add Stock Item Modal (For New Catalog Items) */}
      <AddStockItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Stock Adjust Modal (For In-Depth Audit/Recounts) */}
      <StockAdjustModal
        isOpen={Boolean(selectedItemForAdjust)}
        item={selectedItemForAdjust}
        onClose={() => setSelectedItemForAdjust(null)}
      />
    </div>
  );
};

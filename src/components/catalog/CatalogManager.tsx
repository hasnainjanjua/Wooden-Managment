import React, { useState } from 'react';
import { Layers, Plus, Edit2, Check, X, DoorClosed, Wrench, Cpu, Trash2 } from 'lucide-react';
import { useWorkshopStore } from '../../store/useWorkshopStore';
import { CatalogCategory, CatalogItem } from '../../types';
import { formatPKR } from '../../utils/currency';

export const CatalogManager: React.FC = () => {
  const catalogItems = useWorkshopStore((state) => state.catalogItems);
  const createCatalogItem = useWorkshopStore((state) => state.createCatalogItem);
  const updateCatalogItem = useWorkshopStore((state) => state.updateCatalogItem);
  const deleteCatalogItem = useWorkshopStore((state) => state.deleteCatalogItem);

  const [activeTab, setActiveTab] = useState<CatalogCategory | 'ALL'>('ALL');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editRate, setEditRate] = useState('');
  const [editActive, setEditActive] = useState(1);

  // New Item Form
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<CatalogCategory>('DOOR');
  const [newRate, setNewRate] = useState('');

  const handleStartEdit = (item: CatalogItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditRate(item.default_rate.toString());
    setEditActive(item.is_active);
  };

  const handleSaveEdit = (id: number) => {
    const rate = parseFloat(editRate) || 0;
    if (!editName.trim()) return;
    updateCatalogItem(id, editName, rate, editActive);
    setEditingId(null);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const rate = parseFloat(newRate) || 0;
    createCatalogItem(newCategory, newName, rate);
    setNewName('');
    setNewRate('');
  };

  const filtered = catalogItems.filter((i) => activeTab === 'ALL' || i.category === activeTab);

  return (
    <div className="h-[calc(100vh-105px)] overflow-y-auto bg-slate-100 p-4 md:p-6 space-y-6">
      {/* Header & Add Item */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-amber-800 font-extrabold text-sm">
          <Layers className="w-5 h-5 text-amber-600" />
          <span>Catalog & Rate List (دروازے اور ہارڈویئر کی ریٹ لسٹ)</span>
        </div>

        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as CatalogCategory)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold shadow-sm"
            >
              <option value="DOOR">DOOR (دروازہ)</option>
              <option value="HARDWARE">HARDWARE (ہارڈویئر)</option>
              <option value="SERVICE">SERVICE (سی این سی / سروس)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Item Name <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Malaysian Door / Handle Lock Big"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium shadow-sm"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Default Rate (Rs.)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                step="any"
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-amber-800 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono shadow-sm"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition flex items-center gap-1 shadow-sm shrink-0 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Catalog Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            {(['ALL', 'DOOR', 'HARDWARE', 'SERVICE'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-lg font-bold transition text-[11px] ${
                  activeTab === tab
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-500 font-bold">{filtered.length} Items</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 pl-4 pr-2">#</th>
                <th className="py-2.5 px-2">Category</th>
                <th className="py-2.5 px-2">Item Name</th>
                <th className="py-2.5 px-2 text-right">Default Rate</th>
                <th className="py-2.5 px-2 text-center">Active</th>
                <th className="py-2.5 pr-4 pl-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item, idx) => {
                const isEditing = editingId === item.id;

                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
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
                    <td className="py-3 px-2 font-bold text-slate-900">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900 shadow-sm"
                        />
                      ) : (
                        item.name
                      )}
                    </td>
                    <td className="py-3 px-2 text-right font-black font-mono text-slate-900">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editRate}
                          onChange={(e) => setEditRate(e.target.value)}
                          className="w-24 bg-white border border-slate-300 rounded px-2 py-1 text-xs text-amber-800 text-right font-bold font-mono shadow-sm"
                        />
                      ) : (
                        formatPKR(item.default_rate)
                      )}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {isEditing ? (
                        <input
                          type="checkbox"
                          checked={editActive === 1}
                          onChange={(e) => setEditActive(e.target.checked ? 1 : 0)}
                          className="rounded text-amber-500 focus:ring-0"
                        />
                      ) : item.is_active ? (
                        <span className="text-emerald-700 text-xs font-bold">✓ Active</span>
                      ) : (
                        <span className="text-slate-400 text-xs">Inactive</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 pl-2 text-right">
                      {isEditing ? (
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleSaveEdit(item.id)}
                            className="p-1 bg-emerald-100 hover:bg-emerald-600 text-emerald-800 hover:text-white rounded transition shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition border border-slate-200"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-lg transition border border-slate-300 shadow-sm"
                            title="Edit item"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Kya aap waqai '${item.name}' ko catalog se delete karna chahte hain?`)) {
                                deleteCatalogItem(item.id);
                              }
                            }}
                            className="p-1.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white rounded-lg transition border border-rose-200 shadow-sm"
                            title="Delete item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

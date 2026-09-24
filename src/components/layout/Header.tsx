import React from 'react';
import {
  ShoppingBag,
  History,
  Cpu,
  BookOpen,
  Receipt,
  Wallet,
  Settings,
  Truck,
  Users,
  Boxes,
  Lock,
  LogOut,
  FileText,
} from 'lucide-react';
import { useWorkshopStore, AppTab } from '../../store/useWorkshopStore';
import { formatPKR } from '../../utils/currency';

export const Header: React.FC = () => {
  const activeTab = useWorkshopStore((state) => state.activeTab);
  const setActiveTab = useWorkshopStore((state) => state.setActiveTab);
  const netDrawerCash = useWorkshopStore((state) => state.dailySummary.net_drawer_cash);
  const lockApp = useWorkshopStore((state) => state.lockApp);
  const shopSettings = useWorkshopStore((state) => state.shopSettings);
  const currentUser = useWorkshopStore((state) => state.currentUser);
  const logout = useWorkshopStore((state) => state.logout);
  const lowStockCount = useWorkshopStore((state) => state.lowStockItems.length);

  const navItems = React.useMemo<{ id: AppTab; label: string; icon: any; shortcut?: string; badge?: number }[]>(
    () => [
      { id: 'pos', label: 'POS Billing', icon: ShoppingBag, shortcut: 'F1' },
      { id: 'invoices', label: 'Sales & Bills', icon: History, shortcut: 'F6' },
      { id: 'quotations', label: 'Quotations', icon: FileText },
      { id: 'cnc', label: 'CNC Register', icon: Cpu, shortcut: 'F2' },
      { id: 'khata', label: 'Customer Khata', icon: BookOpen, shortcut: 'F3' },
      { id: 'stock', label: 'Stock & Inventory', icon: Boxes, badge: lowStockCount },
      { id: 'suppliers', label: 'Suppliers Khata', icon: Truck },
      { id: 'karigar', label: 'Karigar & Wages', icon: Users },
      { id: 'expenses', label: 'Daily Expenses', icon: Receipt, shortcut: 'F4' },
      { id: 'closing', label: 'Daily Closing', icon: Wallet, shortcut: 'F5' },
      { id: 'settings', label: 'Shop Settings', icon: Settings },
    ],
    [lowStockCount]
  );

  return (
    <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      {/* Top Brand Bar */}
      <div className="px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/20 text-white font-black text-xl">
            🪵
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-slate-900 tracking-wide">
                {shopSettings.shop_name}
              </h1>
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                ONLINE (AUTO-SYNC)
              </span>
            </div>
            <p className="text-xs text-amber-700 font-bold font-urdu">
              {shopSettings.urdu_title}
            </p>
          </div>
        </div>

        {/* Quick Stats & User Profile in Header */}
        <div className="flex items-center gap-2.5">
          {/* Active Logged-in User Badge */}
          {currentUser && (
            <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-800 shadow-sm">
              <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-black text-[11px]">
                👑
              </div>
              <div className="flex flex-col text-left leading-tight">
                <span className="text-slate-900 font-bold text-[11px] truncate max-w-[140px]">
                  {currentUser.full_name}
                </span>
                <span className="text-[9px] font-mono text-emerald-700 uppercase font-black">
                  ADMIN SESSION
                </span>
              </div>
            </div>
          )}

          {/* Cash Drawer Widget */}
          <div 
            onClick={() => setActiveTab('closing')}
            className="cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 flex items-center gap-2.5 transition shadow-sm"
            title="Click to view Cash Drawer / Aaj Ka Hisab"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">
                Drawer Cash
              </span>
              <span className="text-sm font-black text-emerald-700">
                {formatPKR(netDrawerCash)}
              </span>
            </div>
          </div>

          {/* PIN Lock Button */}
          {(shopSettings.pin_enabled ?? 1) === 1 && (
            <button
              onClick={lockApp}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-300 hover:border-rose-300 px-2.5 py-2 rounded-xl text-xs font-bold transition shadow-sm active:scale-95"
              title="Screen Lock Karein (Alt+L)"
            >
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden lg:inline">Lock</span>
            </button>
          )}

          {/* Logout Button */}
          <button
            onClick={() => {
              if (window.confirm('Kya aap waqai portal se Log out hona chahte hain?')) {
                logout();
              }
            }}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-300 hover:border-rose-300 px-3 py-2 rounded-xl text-xs font-bold transition shadow-sm active:scale-95 cursor-pointer"
            title="Logout"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <nav className="px-3 sm:px-4 flex gap-1.5 overflow-x-auto scrollbar-none touch-pan-x py-2 bg-slate-50 border-b border-slate-200">
        {navItems.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-500'}`} />
              <span className="flex items-center gap-1.5">
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      isActive ? 'bg-rose-700 text-white' : 'bg-rose-500 text-white'
                    }`}
                    title={`${tab.badge} items low stock`}
                  >
                    {tab.badge}
                  </span>
                )}
                {tab.shortcut && (
                  <span
                    className={`text-[9px] px-1 py-0.5 rounded font-mono ${
                      isActive ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {tab.shortcut}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};

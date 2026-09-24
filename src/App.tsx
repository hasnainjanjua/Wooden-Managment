import React, { useEffect } from 'react';
import { useWorkshopStore } from './store/useWorkshopStore';
import { Header } from './components/layout/Header';
import { PosBilling } from './components/pos/PosBilling';
import { CncRegister } from './components/cnc/CncRegister';
import { CustomerKhata } from './components/khata/CustomerKhata';
import { DailyExpenses } from './components/expenses/DailyExpenses';
import { DailyClosing } from './components/closing/DailyClosing';
import { CatalogManager } from './components/catalog/CatalogManager';
import { SettingsBackup } from './components/catalog/SettingsBackup';
import { SupplierKhata } from './components/suppliers/SupplierKhata';
import { KarigarRegister } from './components/karigar/KarigarRegister';
import { StockManager } from './components/inventory/StockManager';
import { QuotationManager } from './components/pos/QuotationManager';
import { SalesInvoiceHistory } from './components/invoices/SalesInvoiceHistory';
import { VoidModal } from './components/modals/VoidModal';
import { PrintInvoiceModal } from './components/modals/PrintInvoiceModal';
import { PinLockScreen } from './components/security/PinLockScreen';
import { LoginScreen } from './components/security/LoginScreen';
import { supabaseSyncService } from './services/supabaseSyncService';
import { Loader2, CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export const App: React.FC = () => {
  const isDbReady = useWorkshopStore((state) => state.isDbReady);
  const isAuthenticated = useWorkshopStore((state) => state.isAuthenticated);
  const isLocked = useWorkshopStore((state) => state.isLocked);
  const lockApp = useWorkshopStore((state) => state.lockApp);
  const shopSettings = useWorkshopStore((state) => state.shopSettings);
  const activeTab = useWorkshopStore((state) => state.activeTab);
  const setActiveTab = useWorkshopStore((state) => state.setActiveTab);
  const init = useWorkshopStore((state) => state.init);
  const toast = useWorkshopStore((state) => state.toast);
  const clearToast = useWorkshopStore((state) => state.clearToast);
  const printInvoiceData = useWorkshopStore((state) => state.printInvoiceData);

  useEffect(() => {
    init();
    supabaseSyncService.initAutoSync();
  }, [init]);

  // Global F-key tab navigation shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        // POS Billing (PosBilling also focuses search input)
        setActiveTab('pos');
      } else if (e.key === 'F2') {
        e.preventDefault();
        setActiveTab('cnc');
      } else if (e.key === 'F3') {
        // In POS, F3 focuses Cash Received. If not on POS, F3 switches to Khata
        if (useWorkshopStore.getState().activeTab !== 'pos') {
          e.preventDefault();
          setActiveTab('khata');
        }
      } else if (e.key === 'F4') {
        e.preventDefault();
        setActiveTab('expenses');
      } else if (e.key === 'F5') {
        e.preventDefault();
        setActiveTab('closing');
      } else if (e.key === 'F6') {
        e.preventDefault();
        setActiveTab('invoices');
      } else if (e.altKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        lockApp();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [setActiveTab, lockApp]);

  if (!isDbReady) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-100 text-slate-900 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-xl text-slate-950 font-black text-3xl animate-pulse">
          🪵
        </div>
        <div className="text-center">
          <h2 className="text-lg font-black tracking-wide text-slate-900">
            AL MADINAH CNC AND WOOD WORKS
          </h2>
          <p className="text-xs text-amber-700 font-urdu font-bold mt-1">
            المدینہ سی این سی اینڈ ووڈ ورکس
          </p>
          <div className="flex items-center justify-center gap-2 mt-4 text-xs text-slate-500 font-mono">
            <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
            <span>System load ho raha hai...</span>
          </div>
        </div>
      </div>
    );
  }

  // Web Login Screen Guard
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // PIN Protection Screen
  if (isLocked && (shopSettings.pin_enabled ?? 1) === 1) {
    return <PinLockScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans select-none">
      <Header />

      <main className={`flex-1 overflow-hidden relative ${printInvoiceData ? 'print:hidden' : ''}`}>
        {activeTab === 'pos' && <PosBilling />}
        {activeTab === 'invoices' && <SalesInvoiceHistory />}
        {activeTab === 'quotations' && <QuotationManager />}
        {activeTab === 'cnc' && <CncRegister />}
        {activeTab === 'khata' && <CustomerKhata />}
        {activeTab === 'suppliers' && <SupplierKhata />}
        {activeTab === 'karigar' && <KarigarRegister />}
        {activeTab === 'stock' && <StockManager />}
        {activeTab === 'expenses' && <DailyExpenses />}
        {activeTab === 'closing' && <DailyClosing />}
        {activeTab === 'catalog' && <CatalogManager />}
        {(activeTab === 'settings' || activeTab === 'backup') && <SettingsBackup />}
      </main>

      {/* Global Modals */}
      <VoidModal />
      <PrintInvoiceModal />

      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div
            className={`px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-2.5 text-xs font-bold ${
              toast.type === 'error'
                ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-rose-900/10'
                : toast.type === 'info'
                ? 'bg-cyan-50 border-cyan-300 text-cyan-900 shadow-cyan-900/10'
                : 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-emerald-900/10'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : toast.type === 'info' ? (
              <Info className="w-4 h-4 text-cyan-600 shrink-0" />
            ) : (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button
              onClick={clearToast}
              className="ml-2 text-slate-500 hover:text-slate-900 p-0.5 rounded transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

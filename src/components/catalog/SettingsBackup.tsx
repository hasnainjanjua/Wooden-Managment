import React, { useState } from 'react';
import {
  History,
  Printer,
  ShieldCheck,
  FileText,
  Store,
  Phone,
  MapPin,
  Save,
  Check,
  Lock,
  KeyRound,
  Shield,
  Settings,
  Cloud,
  RefreshCw,
  Download,
  Upload,
  Laptop,
  Smartphone,
  AlertTriangle,
  Globe,
  Database,
  ExternalLink,
  Copy,
} from 'lucide-react';
import { useWorkshopStore } from '../../store/useWorkshopStore';
import { formatPKR, formatDate } from '../../utils/currency';
import { ShopSettings } from '../../types';
import {
  getSupabaseAnonKey,
  setSupabaseAnonKey,
  isSupabaseConfigured,
  SUPABASE_URL,
} from '../../services/supabaseClient';
import { supabaseSyncService } from '../../services/supabaseSyncService';

export const SettingsBackup: React.FC = () => {
  const invoices = useWorkshopStore((state) => state.invoices);
  const openVoidModal = useWorkshopStore((state) => state.openVoidModal);
  const reprintInvoice = useWorkshopStore((state) => state.reprintInvoice);
  const shopSettings = useWorkshopStore((state) => state.shopSettings);
  const updateShopSettings = useWorkshopStore((state) => state.updateShopSettings);
  const updatePinSettings = useWorkshopStore((state) => state.updatePinSettings);
  const showToast = useWorkshopStore((state) => state.showToast);
  const currentUser = useWorkshopStore((state) => state.currentUser);
  const changeUserPassword = useWorkshopStore((state) => state.changeUserPassword);
  const logout = useWorkshopStore((state) => state.logout);

  // Cloud Sync & Multi-Device
  const cloudSyncStatus = useWorkshopStore((state) => state.cloudSyncStatus);
  const syncWithCloud = useWorkshopStore((state) => state.syncWithCloud);
  const saveCloudConfig = useWorkshopStore((state) => state.saveCloudConfig);
  const exportDatabaseFile = useWorkshopStore((state) => state.exportDatabaseFile);
  const importDatabaseFile = useWorkshopStore((state) => state.importDatabaseFile);

  const [cloudEndpoint, setCloudEndpoint] = useState(cloudSyncStatus?.cloudEndpoint || '');
  const [isCloudEnabled, setIsCloudEnabled] = useState(cloudSyncStatus?.isEnabled ?? false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cloudNotice, setCloudNotice] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Supabase State
  const [supabaseAnonKeyInput, setSupabaseAnonKeyInput] = useState(() => getSupabaseAnonKey());
  const [isSupabaseTesting, setIsSupabaseTesting] = useState(false);
  const [isSupabaseSyncing, setIsSupabaseSyncing] = useState(false);
  const [supabaseNotice, setSupabaseNotice] = useState<{ text: string; isError: boolean } | null>(null);

  // Shop Settings Form
  const [formData, setFormData] = useState<ShopSettings>({ ...shopSettings });
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // Invoice Search Filter
  const [invoiceSearch, setInvoiceSearch] = useState('');

  // Security PIN Form
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinNotice, setPinNotice] = useState('');

  // User Password Change Form
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordNotice, setPasswordNotice] = useState('');

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (newPassword !== confirmPassword) {
      showToast('Naya Password aur Confirm Password match nahi kar rahay!', 'error');
      return;
    }
    const res = changeUserPassword(currentUser.id, oldPassword, newPassword);
    if (res.success) {
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordNotice('Password kamyabi se tabdeel ho gaya!');
      setTimeout(() => setPasswordNotice(''), 4000);
    } else {
      showToast(res.error || 'Password update failed', 'error');
    }
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    const currentCorrect = shopSettings.app_pin || '1234';

    if (oldPin.trim() !== currentCorrect.trim()) {
      showToast('Purana PIN ghalt hai! Dobara check karein.', 'error');
      return;
    }

    if (!/^\d{4}$/.test(newPin.trim())) {
      showToast('Naya PIN sirf 4 hindsay (digits) par mushtamil hona chahiye (e.g. 5678)', 'error');
      return;
    }

    if (newPin.trim() !== confirmPin.trim()) {
      showToast('Naya PIN aur Confirm PIN aapas mein match nahi kar rahay!', 'error');
      return;
    }

    updatePinSettings(newPin.trim(), (shopSettings.pin_enabled ?? 1) === 1);
    setOldPin('');
    setNewPin('');
    setConfirmPin('');
    setPinNotice('Security PIN kamyabi se tabdeel ho gaya!');
    setTimeout(() => setPinNotice(''), 4000);
  };

  const handleTogglePinEnabled = () => {
    const isCurrentlyEnabled = (shopSettings.pin_enabled ?? 1) === 1;
    if (isCurrentlyEnabled) {
      const promptPin = window.prompt('PIN protection band karne ke liye apna mojooda PIN darj karein:');
      if (!promptPin) return;
      if (promptPin.trim() !== (shopSettings.app_pin || '1234').trim()) {
        showToast('Ghalt PIN! Protection band nahi ki ja sakti.', 'error');
        return;
      }
      updatePinSettings(shopSettings.app_pin || '1234', false);
    } else {
      updatePinSettings(shopSettings.app_pin || '1234', true);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateShopSettings(formData);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
  };

  const handleSaveCloudConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveCloudConfig(cloudEndpoint, isCloudEnabled);
    setCloudNotice('Cloud sync settings mehfooz ho gayin!');
    setTimeout(() => setCloudNotice(''), 3500);
  };

  const handleSyncNow = async () => {
    if (!cloudEndpoint.trim()) {
      showToast('Pehle Cloud Webhook / API URL darj karein!', 'error');
      return;
    }
    setIsSyncing(true);
    await syncWithCloud();
    setIsSyncing(false);
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (
      window.confirm(
        'Khabardar! File import karne se aapka mojooda sara data is backup file se replace ho jayega.\n\nKya aap waqai continue karna chahte hain?'
      )
    ) {
      await importDatabaseFile(file);
    }
    e.target.value = '';
  };

  const handleSaveSupabaseKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseAnonKeyInput.trim()) {
      showToast('Baraye meherbani Supabase Anon Key darj karein', 'error');
      return;
    }
    setSupabaseAnonKey(supabaseAnonKeyInput.trim());
    setSupabaseNotice({ text: 'Supabase Anon Key kamyabi se save ho gayi!', isError: false });
    showToast('Supabase Key Save Ho Gayi!', 'success');
  };

  const handleTestSupabase = async () => {
    setIsSupabaseTesting(true);
    setSupabaseNotice(null);
    try {
      const res = await supabaseSyncService.testConnection();
      setSupabaseNotice({ text: res.message, isError: !res.success });
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        showToast(res.message, 'error');
      }
    } finally {
      setIsSupabaseTesting(false);
    }
  };

  const handlePushSupabase = async () => {
    setIsSupabaseSyncing(true);
    setSupabaseNotice(null);
    try {
      const res = await supabaseSyncService.pushAllToSupabase();
      setSupabaseNotice({ text: res.message, isError: !res.success });
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        showToast(res.message, 'error');
      }
    } finally {
      setIsSupabaseSyncing(false);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const q = invoiceSearch.toLowerCase().trim();
    return (
      q === '' ||
      inv.invoice_no.toLowerCase().includes(q) ||
      (inv.customer_name && inv.customer_name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="h-[calc(100vh-105px)] overflow-y-auto bg-slate-100 p-4 md:p-6 space-y-6">
      {/* ========================================================================= */}
      {/* 1. SHOP PROFILE & CONTACT SETTINGS (For Prints & WhatsApp)               */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
          <div className="flex items-center gap-2.5 text-amber-700 font-extrabold text-sm">
            <Store className="w-5 h-5 text-amber-600" />
            <span>Dukan Ka Profile & Raabta (Shop Contact & Print Settings)</span>
          </div>
          {isSavedNotice && (
            <span className="text-emerald-700 text-xs font-bold flex items-center gap-1">
              <Check className="w-4 h-4" />
              Settings Save Ho Gayin!
            </span>
          )}
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Shop Name (English)
              </label>
              <input
                type="text"
                required
                value={formData.shop_name}
                onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Shop Title (Urdu / اردو نام)
              </label>
              <input
                type="text"
                required
                value={formData.urdu_title}
                onChange={(e) => setFormData({ ...formData, urdu_title: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-urdu font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 text-right shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Primary Phone / Mobile (WhatsApp)
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={formData.phone1}
                  onChange={(e) => setFormData({ ...formData, phone1: e.target.value })}
                  placeholder="0300-1234567"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Secondary Phone (Optional)
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={formData.phone2}
                  onChange={(e) => setFormData({ ...formData, phone2: e.target.value })}
                  placeholder="0321-9876543"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Tagline / Work Subtitle
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="Wooden Doors, Hardware, Polish & Jali"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Workshop Address (Print پر آئے گا)
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Main Timber Market, G.T Road"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Receipt Footer Terms / Sharaait (شراٸط)
              </label>
              <input
                type="text"
                value={formData.receipt_footer}
                onChange={(e) => setFormData({ ...formData, receipt_footer: e.target.value })}
                placeholder="سامان چیک کر کے وصول کریں۔ خریدا ہوا مال واپس نہیں ہوگا۔"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-urdu shadow-sm"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Save Shop Profile (سیٹنگز محفوظ کریں)</span>
            </button>
          </div>
        </form>
      </div>

      {/* ========================================================================= */}
      {/* 2. ACTIVE USER SESSION & ACCOUNT SECURITY                                 */}
      {/* ========================================================================= */}
      {currentUser && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-3">
            <div className="flex items-center gap-2.5 text-amber-700 font-extrabold text-sm">
              <ShieldCheck className="w-5 h-5 text-amber-600" />
              <span>Active User Account & Login Password (موجودہ سیشن و لاگ ان)</span>
            </div>
            {passwordNotice && (
              <span className="text-emerald-700 text-xs font-bold flex items-center gap-1">
                <Check className="w-4 h-4" />
                <span>{passwordNotice}</span>
              </span>
            )}
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center font-black text-lg">
                {currentUser.role === 'ADMIN' ? '👑' : '🛒'}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <span>{currentUser.full_name}</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                    {currentUser.role}
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Username: <strong className="font-mono text-slate-700">@{currentUser.username}</strong> | Web Session Active
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (window.confirm('Kya aap waqai portal se Log out hona chahte hain?')) {
                  logout();
                }
              }}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <span>Logout (لاگ آؤٹ)</span>
            </button>
          </div>

          {/* Change Account Password Form */}
          <form onSubmit={handleChangePassword} className="pt-2 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <KeyRound className="w-4 h-4 text-amber-600" />
              <span>Apna Web Login Password Tabdeel Karein (Change Password):</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Purana Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Current password"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Naya Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Confirm Naya Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-sm transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Naya Password Save Karein</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SECURITY PIN CODE SETTINGS (سیکیورٹی پن لاک)                           */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-3">
          <div className="flex items-center gap-2.5 text-amber-700 font-extrabold text-sm">
            <Lock className="w-5 h-5 text-amber-600" />
            <span>App Security & PIN Lock Settings (سیکیورٹی پن کوڈ)</span>
          </div>
          {pinNotice && (
            <span className="text-emerald-700 text-xs font-bold flex items-center gap-1">
              <Check className="w-4 h-4" />
              <span>{pinNotice}</span>
            </span>
          )}
        </div>

        {/* PIN Enable / Disable Status */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
              (shopSettings.pin_enabled ?? 1) === 1
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                : 'bg-slate-200 text-slate-500 border border-slate-300'
            }`}>
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">
                App PIN Protection: {(shopSettings.pin_enabled ?? 1) === 1 ? (
                  <span className="text-emerald-700 font-extrabold">Active (آن ہے)</span>
                ) : (
                  <span className="text-rose-700 font-extrabold">Disabled (بند ہے)</span>
                )}
              </h4>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {(shopSettings.pin_enabled ?? 1) === 1
                  ? 'App open karne par aur "Lock Screen" dabane par 4-digit PIN required hoga.'
                  : 'PIN protection filhal band hai; koi bhi user bina PIN ke software open kar sakta hai.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTogglePinEnabled}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition border self-start sm:self-auto ${
              (shopSettings.pin_enabled ?? 1) === 1
                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                : 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-700 shadow-sm'
            }`}
          >
            {(shopSettings.pin_enabled ?? 1) === 1 ? 'PIN Lock Band Karein' : 'PIN Lock Shuru Karein'}
          </button>
        </div>

        {/* Change PIN Form */}
        <form onSubmit={handleChangePin} className="pt-2 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <KeyRound className="w-4 h-4 text-amber-600" />
            <span>Naya 4-Digit Security PIN Set Karein:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Purana PIN (Current PIN) <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                maxLength={6}
                required
                value={oldPin}
                onChange={(e) => setOldPin(e.target.value)}
                placeholder="Default: 1234"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-center tracking-widest text-sm shadow-sm"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Naya PIN (4 Digits) <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                maxLength={4}
                required
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="e.g. 5678"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-emerald-700 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-center tracking-widest text-sm shadow-sm"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Confirm Naya PIN <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                maxLength={4}
                required
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="e.g. 5678"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-emerald-700 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-center tracking-widest text-sm shadow-sm"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-sm transition flex items-center gap-1.5 active:scale-95"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>PIN Code Tabdeel Karein</span>
            </button>
          </div>
        </form>
      </div>

      {/* ========================================================================= */}
      {/* 4. MULTI-DEVICE ACCESS & CLOUD SYNC                                       */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-3">
          <div className="flex items-center gap-2.5 text-amber-700 font-extrabold text-sm">
            <Cloud className="w-5 h-5 text-amber-600" />
            <span>Multi-Device Access & Cloud Sync (ملٹی ڈیوائس ڈیٹا اور کلاؤڈ سنک)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-lg border border-slate-200">
              Device ID: <strong className="text-amber-700">{cloudSyncStatus.deviceId}</strong>
            </span>
            {cloudNotice && (
              <span className="text-emerald-700 text-xs font-bold flex items-center gap-1">
                <Check className="w-4 h-4" />
                <span>{cloudNotice}</span>
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Agar aap dukan ke computer ke ilawa apne <strong>Mobile Phone</strong> ya <strong>Ghar ke Laptop</strong> par bhi hisab kitab dekhna ya chalana chahein, toh yeh 2 sahooliyat istemal karein:
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Option A: Portable SQLite Snapshot File */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900 mb-1">
                <Download className="w-4 h-4 text-amber-600" />
                <span>1. Portable Data File (موبائل / لیپ ٹاپ پر فائل ٹرانسفر)</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Dukan ke computer se mukammal database file download karein aur WhatsApp ya USB ke zariye apne mobile ya doosre computer par le ja kar Restore karein.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={exportDatabaseFile}
                  className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-sm transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Data File (.sqlite)</span>
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileImport}
                  accept=".sqlite,.db"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-slate-600" />
                  <span>Import Data File</span>
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-medium pt-1">
                <Laptop className="w-3.5 h-3.5 text-slate-400" />
                <span>Shop PC</span>
                <span>⇄</span>
                <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                <span>Mobile Phone</span>
                <span>⇄</span>
                <Laptop className="w-3.5 h-3.5 text-slate-400" />
                <span>Home Laptop</span>
              </div>
            </div>
          </div>

          {/* Option B: Online Webhook / Cloud Sync */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900">
                  <Globe className="w-4 h-4 text-emerald-600" />
                  <span>2. Remote Cloud Sync (آن لائن کلاؤڈ سرور سنک)</span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    cloudSyncStatus.status === 'SUCCESS'
                      ? 'bg-emerald-100 text-emerald-700'
                      : cloudSyncStatus.status === 'ERROR'
                      ? 'bg-rose-100 text-rose-700'
                      : cloudSyncStatus.status === 'SYNCING'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {cloudSyncStatus.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Agar aap ke paas koi remote cloud webhook (e.g. Supabase, N8N, custom API) mojood hai toh uska URL enter karein.
              </p>
            </div>

            <form onSubmit={handleSaveCloudConfig} className="space-y-3 pt-1">
              <div>
                <input
                  type="url"
                  value={cloudEndpoint}
                  onChange={(e) => setCloudEndpoint(e.target.value)}
                  placeholder="https://your-cloud-api.com/api/sync"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-semibold">
                  <input
                    type="checkbox"
                    checked={isCloudEnabled}
                    onChange={(e) => setIsCloudEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Enable Cloud Sync</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    Save Link
                  </button>

                  <button
                    type="button"
                    onClick={handleSyncNow}
                    disabled={isSyncing}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                  </button>
                </div>
              </div>

              {cloudSyncStatus.lastSyncedAt && (
                <div className="text-[10px] text-slate-500 font-mono">
                  Aakhri martaba sync hua: {formatDate(cloudSyncStatus.lastSyncedAt)}
                </div>
              )}
              {cloudSyncStatus.errorMessage && (
                <div className="text-[10px] text-rose-600 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{cloudSyncStatus.errorMessage}</span>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. SUPABASE CLOUD DATABASE INTEGRATION                                    */}
      {/* ========================================================================= */}
      <div className="bg-white border-2 border-emerald-500/50 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-3">
          <div className="flex items-center gap-2.5 text-emerald-800 font-extrabold text-sm">
            <Database className="w-5 h-5 text-emerald-600" />
            <span>Supabase Cloud Database (آن لائن کلاؤڈ ڈیٹا بیس)</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                isSupabaseConfigured()
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}
            >
              {isSupabaseConfigured() ? '✓ Connected' : '⚠️ Anon Key Required'}
            </span>
          </div>
        </div>

        {/* Supabase URL & Anon Key */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Supabase Project URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={SUPABASE_URL}
                  className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 font-mono shadow-xs select-all"
                />
                <a
                  href="https://supabase.com/dashboard/project/anqzmsmknttmfqkgzihz"
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 border border-slate-300 transition shrink-0"
                  title="Open Supabase Dashboard"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Supabase Anon Key (Project API Key)
              </label>
              <form onSubmit={handleSaveSupabaseKey} className="flex gap-2">
                <input
                  type="password"
                  value={supabaseAnonKeyInput}
                  onChange={(e) => setSupabaseAnonKeyInput(e.target.value)}
                  placeholder="Paste anon key (eyJhbGci...)"
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer whitespace-nowrap"
                >
                  Save Key
                </button>
              </form>
            </div>
          </div>

          {/* Action buttons: Test Connection & Push Data */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleTestSupabase}
                disabled={isSupabaseTesting}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition border border-slate-300 flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSupabaseTesting ? 'animate-spin' : ''}`} />
                <span>{isSupabaseTesting ? 'Testing...' : 'Test Connection'}</span>
              </button>

              <button
                type="button"
                onClick={handlePushSupabase}
                disabled={isSupabaseSyncing}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Cloud className={`w-3.5 h-3.5 ${isSupabaseSyncing ? 'animate-spin' : ''}`} />
                <span>{isSupabaseSyncing ? 'Uploading to Supabase...' : 'Push All Local Data to Supabase'}</span>
              </button>
            </div>

            <a
              href="https://supabase.com/dashboard/project/anqzmsmknttmfqkgzihz/sql/new"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
            >
              <span>Open Supabase SQL Editor</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {supabaseNotice && (
            <div
              className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                supabaseNotice.isError
                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}
            >
              {supabaseNotice.isError ? (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              ) : (
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
              <span>{supabaseNotice.text}</span>
            </div>
          )}

          {/* Quick Setup Guide banner */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-1">
            <span className="font-black uppercase tracking-wider block text-[10px]">
              📋 Supabase Setup Guide:
            </span>
            <p className="text-[11px] leading-relaxed">
              1. Project root mein <code className="bg-white px-1.5 py-0.5 rounded border border-amber-300 font-bold">supabase-schema.sql</code> file tayyar hai.
              Uska content copy kar ke apne <a href="https://supabase.com/dashboard/project/anqzmsmknttmfqkgzihz/sql/new" target="_blank" rel="noreferrer" className="underline font-bold text-emerald-700">Supabase SQL Editor</a> mein paste karein aur <strong>Run</strong> karein.
              <br />
              2. Supabase Dashboard se <strong>Project Settings ➔ API ➔ anon key</strong> copy kar ke upar save karein.
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. SALES INVOICES AUDIT LOG & RE-PRINT SLIPS                               */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <History className="w-4 h-4 text-amber-600" />
            <span>Recent Sales Invoices & Re-Print (پرانے بل ری پرنٹ کریں)</span>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              value={invoiceSearch}
              onChange={(e) => setInvoiceSearch(e.target.value)}
              placeholder="Search bill no / customer..."
              className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
            />
            <span className="text-xs text-slate-500 font-medium">
              Total {filteredInvoices.length} Bills
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 pl-4 pr-2">Bill No</th>
                <th className="py-2.5 px-2">Tareekh</th>
                <th className="py-2.5 px-2">Customer</th>
                <th className="py-2.5 px-2 text-right">Net Bill</th>
                <th className="py-2.5 px-2 text-right">Naqad Wasool</th>
                <th className="py-2.5 px-2 text-right">Baqaya</th>
                <th className="py-2.5 px-2 text-center">Status</th>
                <th className="py-2.5 pr-4 pl-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map((inv) => {
                const isVoid = inv.is_void === 1;
                const net = inv.total_amount - inv.discount_amount;

                return (
                  <tr
                    key={inv.id}
                    className={`hover:bg-slate-50 transition ${
                      isVoid ? 'opacity-40 line-through bg-rose-50/50' : ''
                    }`}
                  >
                    <td className="py-3 pl-4 pr-2 font-mono font-bold text-amber-700">
                      {inv.invoice_no}
                    </td>
                    <td className="py-3 px-2 text-slate-600">{formatDate(inv.invoice_date)}</td>
                    <td className="py-3 px-2 font-bold text-slate-900">
                      {inv.customer_name || 'Walk-in Cash'}
                    </td>
                    <td className="py-3 px-2 text-right font-black text-slate-900">
                      {formatPKR(net)}
                    </td>
                    <td className="py-3 px-2 text-right font-bold text-emerald-700">
                      {formatPKR(inv.cash_received)}
                    </td>
                    <td className="py-3 px-2 text-right font-black text-rose-700">
                      {formatPKR(inv.balance_amount)}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {isVoid ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200">
                          Mansookh (Void)
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 pl-2 text-right space-x-1.5">
                      <button
                        onClick={() => reprintInvoice(inv.id)}
                        className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-bold transition inline-flex items-center gap-1 border border-amber-300"
                        title="Print 80mm Slip"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Print Slip</span>
                      </button>

                      {!isVoid && (
                        <button
                          onClick={() => openVoidModal('invoice', inv.id, inv.invoice_no)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-300 hover:border-rose-300 rounded-lg text-xs font-semibold transition"
                          title="Mansookh (Void) Karein"
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
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Store,
  Phone,
  MapPin,
  Save,
  Check,
  Lock,
  KeyRound,
  Shield,
  Settings,
  Download,
  Upload,
  Laptop,
  Smartphone,
  Cloud,
  RefreshCw,
  User,
  ShieldCheck,
} from 'lucide-react';
import { useWorkshopStore } from '../../store/useWorkshopStore';
import { ShopSettings } from '../../types';
import { supabaseSyncService } from '../../services/supabaseSyncService';

export const SettingsBackup: React.FC = () => {
  const shopSettings = useWorkshopStore((state) => state.shopSettings);
  const updateShopSettings = useWorkshopStore((state) => state.updateShopSettings);
  const updatePinSettings = useWorkshopStore((state) => state.updatePinSettings);
  const showToast = useWorkshopStore((state) => state.showToast);
  const currentUser = useWorkshopStore((state) => state.currentUser);
  const changeUserPassword = useWorkshopStore((state) => state.changeUserPassword);

  // Portable Backup & Restore
  const exportDatabaseFile = useWorkshopStore((state) => state.exportDatabaseFile);
  const importDatabaseFile = useWorkshopStore((state) => state.importDatabaseFile);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Shop Settings Form
  const [formData, setFormData] = useState<ShopSettings>({ ...shopSettings });
  const [isSavedNotice, setIsSavedNotice] = useState(false);

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

  // Auto-sync status
  const [isSyncingNow, setIsSyncingNow] = useState(false);
  const [syncStatusNotice, setSyncStatusNotice] = useState('');

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

  const handleManualSync = async () => {
    setIsSyncingNow(true);
    setSyncStatusNotice('');
    try {
      const res = await supabaseSyncService.pushAllToSupabase();
      if (res.success) {
        setSyncStatusNotice('Tamam data cloud par kamyabi se sync ho gaya!');
        showToast('Cloud Database Sync Mukammal!', 'success');
      } else {
        setSyncStatusNotice(res.message);
        showToast(res.message, 'info');
      }
    } finally {
      setIsSyncingNow(false);
      setTimeout(() => setSyncStatusNotice(''), 5000);
    }
  };

  return (
    <div className="h-[calc(100vh-105px)] overflow-y-auto bg-slate-100 p-4 md:p-6 space-y-6">
      {/* ========================================================================= */}
      {/* 1. SHOP PROFILE & CONTACT SETTINGS (For Prints & WhatsApp)               */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-5">
          <div className="flex items-center gap-3 text-amber-800 font-extrabold text-sm">
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base text-slate-900 font-black">Dukan Ka Profile & Raabta (Shop Contact & Print Details)</span>
              <p className="text-xs text-slate-500 font-medium">Invoices, Print Slips aur WhatsApp messages par yehi maloomat print hogi</p>
            </div>
          </div>
          {isSavedNotice && (
            <span className="text-emerald-700 text-xs font-bold flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 animate-in fade-in">
              <Check className="w-4 h-4" />
              Settings Save Ho Gayin!
            </span>
          )}
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Shop Name (English Name) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.shop_name}
                onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Shop Title (Urdu Calligraphy / اردو نام) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.urdu_title}
                onChange={(e) => setFormData({ ...formData, urdu_title: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-urdu font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs text-right"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Primary Phone / Mobile (پرائمری فون) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.phone1}
                onChange={(e) => setFormData({ ...formData, phone1: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Secondary Phone / PTCL (دوسرا فون)
              </label>
              <input
                type="text"
                value={formData.phone2 || ''}
                onChange={(e) => setFormData({ ...formData, phone2: e.target.value })}
                placeholder="Optional"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Tagline / Karobar Ki Wazahath
              </label>
              <input
                type="text"
                value={formData.tagline || ''}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Workshop / Showroom Address (مکمل پتہ) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Receipt Footer Note / Return Policy (رسید کے نیچے اردو نوٹ)
            </label>
            <input
              type="text"
              value={formData.receipt_footer || ''}
              onChange={(e) => setFormData({ ...formData, receipt_footer: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-urdu font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs text-right"
            />
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-sm transition flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Dukan Ki Settings Mehfooz Karein</span>
            </button>
          </div>
        </form>
      </div>

      {/* ========================================================================= */}
      {/* 2. USER ACCOUNT & PASSWORD MANAGEMENT                                    */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3 text-slate-900 font-bold">
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700">
              <User className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-black">User Account & Security Settings (یوزر اکاونٹ و پاس ورڈ)</span>
              <p className="text-xs text-slate-500 font-medium">
                Mojooda User: <strong className="text-slate-800">{currentUser?.full_name || 'Admin'}</strong> ({currentUser?.role || 'ADMIN'})
              </p>
            </div>
          </div>
          {passwordNotice && (
            <span className="text-emerald-700 text-xs font-bold flex items-center gap-1 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
              <Check className="w-3.5 h-3.5" />
              {passwordNotice}
            </span>
          )}
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Mojooda Password <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Current password"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
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
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
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
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Password Tabdeel Karein</span>
            </button>
          </div>
        </form>
      </div>

      {/* ========================================================================= */}
      {/* 3. SCREEN LOCK & 4-DIGIT SECURITY PIN                                    */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3 text-slate-900 font-bold">
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-black">Security PIN Lock (سکرین لاک پن کوڈ)</span>
              <p className="text-xs text-slate-500 font-medium">
                Counter chore kar jatay waqt quick screen lock lagane ke liye 4-digit PIN
              </p>
            </div>
          </div>
          {pinNotice && (
            <span className="text-emerald-700 text-xs font-bold flex items-center gap-1 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
              <Check className="w-3.5 h-3.5" />
              {pinNotice}
            </span>
          )}
        </div>

        {/* PIN Enable / Disable Toggle */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-3.5 h-3.5 rounded-full ${
                (shopSettings.pin_enabled ?? 1) === 1 ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-slate-300'
              }`}
            />
            <div>
              <span className="text-xs font-bold text-slate-800">
                PIN Protection Status: {(shopSettings.pin_enabled ?? 1) === 1 ? 'ACTIVE (شروع ہے)' : 'DISABLED (بند ہے)'}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {(shopSettings.pin_enabled ?? 1) === 1
                  ? 'App open hone par aur "Lock Screen" dabane par 4-digit PIN darj karna hoga.'
                  : 'PIN protection filhal band hai.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTogglePinEnabled}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition border self-start sm:self-auto cursor-pointer ${
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
                Mojooda PIN <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                maxLength={6}
                required
                value={oldPin}
                onChange={(e) => setOldPin(e.target.value)}
                placeholder="Current PIN"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-center tracking-widest text-sm shadow-xs"
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
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-emerald-700 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-center tracking-widest text-sm shadow-xs"
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
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-emerald-700 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-center tracking-widest text-sm shadow-xs"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-sm transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>PIN Code Tabdeel Karein</span>
            </button>
          </div>
        </form>
      </div>

      {/* ========================================================================= */}
      {/* 4. PORTABLE DATABASE BACKUP & RESTORE (.sqlite)                           */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-3">
          <div className="flex items-center gap-3 text-slate-900 font-bold">
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-black">Portable Database Backup & Restore (پورٹ ایبل ڈیٹا فائل)</span>
              <p className="text-xs text-slate-500 font-medium">
                Offline backup file download karein ya USB / PC se purana data restore karein
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 self-start sm:self-auto">
            Format: <strong className="text-amber-700">.sqlite / .db</strong>
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={exportDatabaseFile}
              className="flex-1 min-w-[200px] px-5 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-sm transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Portable Database (.sqlite)</span>
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
              className="flex-1 min-w-[200px] px-5 py-3 bg-white hover:bg-slate-100 text-slate-800 font-black rounded-xl text-xs transition flex items-center justify-center gap-2 active:scale-95 border border-slate-300 cursor-pointer shadow-xs"
            >
              <Upload className="w-4 h-4 text-slate-600" />
              <span>Import Data File (.sqlite)</span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-3 text-[11px] text-slate-500 font-medium pt-1">
            <span className="flex items-center gap-1">
              <Laptop className="w-3.5 h-3.5 text-slate-400" />
              Shop Counter PC
            </span>
            <span className="text-slate-300">⇄</span>
            <span className="flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-slate-400" />
              Mobile / Tablet
            </span>
            <span className="text-slate-300">⇄</span>
            <span className="flex items-center gap-1">
              <Laptop className="w-3.5 h-3.5 text-slate-400" />
              Home Laptop
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. CLOUD AUTO-SYNC STATUS & HEALTH                                        */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-emerald-950">
                  Automatic Cloud Database Sync (خودکار آن لائن ہم آہنگی)
                </h3>
                <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  Auto-Active
                </span>
              </div>
              <p className="text-xs text-emerald-800/80 font-medium mt-0.5">
                Har sale, payment aur khata entry background mein automatically cloud database se sync ho rahi hai.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncingNow}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingNow ? 'animate-spin' : ''}`} />
              <span>{isSyncingNow ? 'Syncing...' : 'Sync Now (ابھی ہم آہنگ کریں)'}</span>
            </button>
          </div>
        </div>

        {syncStatusNotice && (
          <div className="mt-3 p-3 bg-white/90 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{syncStatusNotice}</span>
          </div>
        )}
      </div>
    </div>
  );
};

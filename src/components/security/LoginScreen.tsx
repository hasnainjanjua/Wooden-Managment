import React, { useState } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  LogIn,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useWorkshopStore } from '../../store/useWorkshopStore';

export const LoginScreen: React.FC = () => {
  const login = useWorkshopStore((state) => state.login);
  const shopSettings = useWorkshopStore((state) => state.shopSettings);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Username aur Password likhna lazmi hai');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    setTimeout(() => {
      const res = login(username, password, rememberMe);
      setIsLoading(false);
      if (!res.success) {
        setErrorMessage(res.error || 'Ghalt credentials! Dobara check karein.');
      }
    }, 200);
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setErrorMessage('');
    const res = login(u, p, rememberMe);
    if (!res.success) {
      setErrorMessage(res.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 p-4 relative overflow-hidden select-none">
      {/* Background Decorative Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-xl shadow-amber-500/20 text-white font-black text-3xl">
            🪵
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-wide">
              {shopSettings.shop_name || 'AL MADINAH CNC AND WOOD WORKS'}
            </h1>
            <p className="text-xs text-amber-700 font-urdu font-bold mt-0.5">
              {shopSettings.urdu_title || 'المدینہ سی این سی اینڈ ووڈ ورکس'}
            </p>
          </div>
          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Online Workshop Portal Login
          </span>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl animate-shake">
            {errorMessage}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Username (صارف کا نام)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                autoFocus
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="e.g. admin or admin2"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Password (پاس ورڈ)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="Enter your password..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="p-1 text-slate-400 hover:text-slate-600 absolute right-3 top-2.5"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-semibold">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 border-slate-300"
              />
              <span>Remember Session (سیشن محفوظ رکھیں)</span>
            </label>
            <span className="text-[10px] text-emerald-700 font-bold">Auto-Save</span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 border border-amber-600 cursor-pointer disabled:opacity-70"
          >
            <LogIn className="w-4 h-4" />
            <span>{isLoading ? 'Checking...' : 'Login Karein (پورٹل میں داخل ہوں)'}</span>
          </button>
        </form>

        {/* 1-Click Fast Login Chips */}
        <div className="pt-2 border-t border-slate-100 space-y-2.5">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider text-center">
            Admin Quick Login (فوری ایڈمن لاگ ان)
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('admin', 'admin')}
              className="p-2.5 bg-slate-50 hover:bg-amber-50 text-slate-800 hover:text-amber-900 border border-slate-200 hover:border-amber-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
            >
              <span>👑 Admin 1 (admin)</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('admin2', 'admin123')}
              className="p-2.5 bg-slate-50 hover:bg-amber-50 text-slate-800 hover:text-amber-900 border border-slate-200 hover:border-amber-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
            >
              <span>👑 Admin 2 (admin2)</span>
            </button>
          </div>
        </div>

        {/* Security / Persistence Assurance Footer */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-center">
          <p className="text-[11px] text-slate-500 leading-relaxed">
            🔒 <strong>Web Session:</strong> Login hone ke baad aap ka session is browser mein hamesha save rahay ga. Page refresh karne se data ya session khatam nahi hoga.
          </p>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Lock, AlertCircle, Delete } from 'lucide-react';
import { useWorkshopStore } from '../../store/useWorkshopStore';

export const PinLockScreen: React.FC = () => {
  const unlockApp = useWorkshopStore((state) => state.unlockApp);

  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  const handleDigit = (digit: string) => {
    if (pin.length >= 6) return;
    const newPin = pin + digit;
    setPin(newPin);
    setErrorMsg('');

    // If 4 digits reached, attempt unlock
    if (newPin.length === 4) {
      verifyPin(newPin);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    setPin('');
    setErrorMsg('');
  };

  const verifyPin = (candidatePin: string) => {
    const success = unlockApp(candidatePin);
    if (!success) {
      setIsShaking(true);
      setErrorMsg('Ghalt PIN Code! Dobara koshish karein (غلط پن کوڈ)');
      setTimeout(() => {
        setIsShaking(false);
        setPin('');
      }, 600);
    }
  };

  // Keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleClear();
      } else if (e.key === 'Enter') {
        if (pin.length >= 4) {
          verifyPin(pin);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 select-none">
      {/* Background Decorative Rings */}
      <div className="absolute w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute w-[350px] h-[350px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center">
        {/* Brand Header */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30 text-white font-black text-2xl mb-3">
          🪵
        </div>

        <h1 className="text-base font-extrabold text-slate-900 text-center tracking-wide">
          AL MADINAH CNC AND WOOD WORKS
        </h1>
        <p className="text-xs text-amber-700 font-urdu font-bold text-center mt-0.5">
          المدینہ سی این سی اینڈ ووڈ ورکس
        </p>

        <div className="flex items-center gap-1.5 mt-3 mb-6 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full text-[11px] font-bold text-slate-700">
          <Lock className="w-3.5 h-3.5 text-amber-600" />
          <span>سیکیورٹی پن لاک (Security PIN Lock)</span>
        </div>

        {/* PIN Indicators */}
        <div className={`flex items-center gap-3.5 mb-6 ${isShaking ? 'animate-bounce text-rose-600' : ''}`}>
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isFilled
                    ? 'bg-amber-500 shadow-md shadow-amber-500/50 scale-110'
                    : 'border-2 border-slate-300 bg-slate-100'
                }`}
              />
            );
          })}
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="mb-4 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 animate-in fade-in duration-150">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Keypad Grid */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[260px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigit(num)}
              className="h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-amber-500 active:text-slate-950 text-slate-800 font-bold text-xl transition-all duration-100 flex items-center justify-center border border-slate-200 shadow-sm active:scale-95"
            >
              {num}
            </button>
          ))}

          {/* Clear Button */}
          <button
            type="button"
            onClick={handleClear}
            className="h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 font-semibold text-xs transition border border-slate-200 flex items-center justify-center active:scale-95"
            title="Clear PIN"
          >
            Clear
          </button>

          {/* Zero Button */}
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-amber-500 active:text-slate-950 text-slate-800 font-bold text-xl transition-all duration-100 flex items-center justify-center border border-slate-200 shadow-sm active:scale-95"
          >
            0
          </button>

          {/* Backspace Button */}
          <button
            type="button"
            onClick={handleBackspace}
            className="h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition border border-slate-200 flex items-center justify-center active:scale-95"
            title="Backspace"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

      </div>
    </div>
  );
};

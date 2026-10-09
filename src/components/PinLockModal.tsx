import React, { useState, useEffect, useCallback } from 'react';
import { 
  Lock, 
  Unlock, 
  KeyRound, 
  Truck, 
  AlertCircle, 
  Copy, 
  Check, 
  Loader2, 
  ShieldCheck, 
  Delete,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { verifyPinWithServer, saveAuthSession, AuthStatusResponse } from '../lib/authService';

interface PinLockModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onGoToDriverPortal: () => void;
  authStatus?: AuthStatusResponse | null;
}

const SQL_MIGRATION_SNIPPET = `-- Jalankan di Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS public.app_auth (
  id TEXT PRIMARY KEY DEFAULT 'app_admin_pin',
  key_name TEXT NOT NULL UNIQUE DEFAULT 'admin_pin',
  pin_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  description TEXT DEFAULT 'Master Auth PIN untuk akses Halaman Utama & Akuntansi',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.app_auth ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon select app_auth" ON public.app_auth FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow anon all app_auth" ON public.app_auth FOR ALL TO anon, authenticated USING (true);

-- Masukkan PIN pilihan Anda di sini (Contoh: '123456'):
INSERT INTO public.app_auth (id, key_name, pin_hash, role, description)
VALUES ('app_admin_pin', 'admin_pin', '123456', 'admin', 'Master PIN Halaman Utama')
ON CONFLICT (id) DO UPDATE SET pin_hash = EXCLUDED.pin_hash, updated_at = NOW();

ALTER TABLE public.pesanan DROP CONSTRAINT IF EXISTS pesanan_status_pengiriman_check;
ALTER TABLE public.pesanan ADD CONSTRAINT pesanan_status_pengiriman_check 
  CHECK (status_pengiriman IN ('PENDING', 'DONE', 'DRIVER', 'PEMASOK'));`;

export const PinLockModal: React.FC<PinLockModalProps> = ({
  isOpen,
  onSuccess,
  onGoToDriverPortal,
  authStatus,
}) => {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [shake, setShake] = useState(false);

  // Reset state saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setPin('');
      setErrorMsg(null);
      setIsVerifying(false);
    }
  }, [isOpen]);

  const handleVerify = useCallback(async (pinToVerify: string) => {
    if (isVerifying || !pinToVerify) return;
    setIsVerifying(true);
    setErrorMsg(null);

    try {
      const res = await verifyPinWithServer(pinToVerify);
      if (res.success && res.token) {
        saveAuthSession(res.token, res.role || 'admin');
        onSuccess();
      } else {
        setShake(true);
        setErrorMsg(res.message || 'PIN salah. Silakan coba lagi.');
        setTimeout(() => setShake(false), 500);
        setPin('');
      }
    } catch (err: any) {
      setShake(true);
      setErrorMsg(err?.message || 'Gagal memverifikasi PIN.');
      setTimeout(() => setShake(false), 500);
      setPin('');
    } finally {
      setIsVerifying(false);
    }
  }, [isVerifying, onSuccess]);

  const handleDigitPress = (digit: string) => {
    if (isVerifying) return;
    setErrorMsg(null);
    if (pin.length < 8) {
      const nextPin = pin + digit;
      setPin(nextPin);
      // Auto verify jika panjang mencapai 6 digit
      if (nextPin.length === 6) {
        handleVerify(nextPin);
      }
    }
  };

  const handleDelete = () => {
    if (isVerifying) return;
    setErrorMsg(null);
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (isVerifying) return;
    setErrorMsg(null);
    setPin('');
  };

  // Keyboard navigation listener (Angka 0-9, Backspace, Enter)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Enter') {
        if (pin.length > 0) {
          handleVerify(pin);
        }
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pin, handleVerify]);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_MIGRATION_SNIPPET);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  if (!isOpen) return null;

  const isTableNotConfigured = authStatus?.configured === false;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md transition-all font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          y: 0,
          x: shake ? [-10, 10, -8, 8, -4, 4, 0] : 0 
        }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-sm sm:max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 overflow-hidden relative"
      >
        {/* Glow ambient background effect */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-3xl pointer-events-none -ml-16 -mb-16" />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Lock Icon Emblem */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 mb-3 sm:mb-4">
            <Lock className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Autentikasi PIN
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
            Masukkan Auth Key PIN untuk mengakses Halaman Utama & Data Akuntansi
          </p>

          {/* Database Security Badge */}
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/60 dark:border-indigo-800/60 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Terverifikasi Aman di Database Supabase</span>
          </div>

          {/* Masked PIN Indicators */}
          <div className="my-5 flex items-center justify-center gap-2.5 sm:gap-3">
            {[0, 1, 2, 3, 4, 5].map((idx) => {
              const isFilled = idx < pin.length;
              return (
                <motion.div
                  key={idx}
                  animate={{ scale: isFilled ? 1.15 : 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full transition-all duration-150 ${
                    isFilled
                      ? 'bg-indigo-600 dark:bg-indigo-500 shadow-md shadow-indigo-500/30'
                      : 'bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600'
                  }`}
                />
              );
            })}
          </div>

          {/* Error Message Notice */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="w-full mb-3 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 text-left"
              >
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="flex-1">{errorMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Notice status konfigurasi Supabase */}
          {isTableNotConfigured ? (
            <div className="w-full mb-3 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-200 text-xs text-left space-y-1.5">
              <div className="font-bold flex items-center justify-between">
                <span>🔐 PIN Akses Web Aktif</span>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-2 py-0.5 rounded-md bg-amber-200 dark:bg-amber-800/60 text-amber-900 dark:text-amber-100 hover:bg-amber-300 text-[10.5px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{isCopied ? 'Tersalin!' : 'Salin SQL'}</span>
                </button>
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
                PIN default awal: <strong className="font-mono bg-amber-200/80 dark:bg-amber-900/80 px-1 py-0.5 rounded text-amber-900 dark:text-amber-100">123456</strong>. Untuk menentukan PIN rahasia Anda sendiri, salin &amp; jalankan skrip SQL di Supabase SQL Editor.
              </p>
            </div>
          ) : (
            <div className="w-full mb-3 p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200 text-xs text-center font-medium">
              <span>Masukkan PIN yang telah Anda tentukan di Supabase untuk membuka akses web.</span>
            </div>
          )}

          {/* Numeric Touch Keypad (1 to 9, C, 0, Backspace) */}
          <div className="w-full max-w-[280px] grid grid-cols-3 gap-2.5 sm:gap-3 mb-4">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                disabled={isVerifying}
                onClick={() => handleDigitPress(digit)}
                className="h-12 sm:h-14 rounded-2xl bg-slate-100 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-800 dark:text-slate-100 font-bold text-lg sm:text-xl active:scale-95 transition-all shadow-xs border border-slate-200/50 dark:border-slate-700/50 cursor-pointer disabled:opacity-50"
              >
                {digit}
              </button>
            ))}

            <button
              type="button"
              disabled={isVerifying}
              onClick={handleClear}
              className="h-12 sm:h-14 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase active:scale-95 transition-all border border-slate-200/50 dark:border-slate-700/50 cursor-pointer disabled:opacity-50"
            >
              Hapus
            </button>

            <button
              type="button"
              disabled={isVerifying}
              onClick={() => handleDigitPress('0')}
              className="h-12 sm:h-14 rounded-2xl bg-slate-100 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-800 dark:text-slate-100 font-bold text-lg sm:text-xl active:scale-95 transition-all shadow-xs border border-slate-200/50 dark:border-slate-700/50 cursor-pointer disabled:opacity-50"
            >
              0
            </button>

            <button
              type="button"
              disabled={isVerifying}
              onClick={handleDelete}
              className="h-12 sm:h-14 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold flex items-center justify-center active:scale-95 transition-all border border-slate-200/50 dark:border-slate-700/50 cursor-pointer disabled:opacity-50"
              title="Hapus Satu Digit"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {/* Submit Action Button */}
          <button
            type="button"
            disabled={isVerifying || pin.length === 0}
            onClick={() => handleVerify(pin)}
            className="w-full py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-sm shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed mb-3"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memverifikasi PIN ke Supabase...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Buka Kunci Halaman Utama</span>
              </>
            )}
          </button>

          {/* Quick Access to Driver Portal Without PIN */}
          <div className="w-full pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={onGoToDriverPortal}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-blue-200/40 dark:border-blue-800/30"
            >
              <Truck className="w-4 h-4 text-blue-500" />
              <span>Khusus Driver? Langsung Buka Portal Driver Tanpa PIN</span>
              <ArrowRight className="w-3.5 h-3.5 ml-auto text-blue-400" />
            </button>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              Driver tidak memerlukan PIN dan hanya melihat daftar pengiriman driver.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

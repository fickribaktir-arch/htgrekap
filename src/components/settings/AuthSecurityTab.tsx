import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  ShieldCheck, 
  Copy, 
  Check, 
  Lock, 
  ExternalLink, 
  AlertCircle,
  Database,
  RefreshCw,
  Terminal
} from 'lucide-react';
import { fetchAuthStatus, clearAuthSession, AuthStatusResponse } from '../../lib/authService';

interface AuthSecurityTabProps {
  onLockApp?: () => void;
}

const SQL_MIGRATION_TEXT = `-- =============================================================================
-- SQL MIGRATION: AUTH KEY / PIN KEAMANAN & STATUS PENGIRIMAN (HTG ACCOUNTING)
-- Jalankan skrip ini langsung di Supabase SQL Editor:
-- =============================================================================

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

DROP POLICY IF EXISTS "Allow anon select app_auth" ON public.app_auth;
CREATE POLICY "Allow anon select app_auth" ON public.app_auth
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow anon all app_auth" ON public.app_auth;
CREATE POLICY "Allow anon all app_auth" ON public.app_auth
  FOR ALL TO anon, authenticated
  USING (true);

-- INPUT / UPDATE PIN PILIHAN ANDA DI SINI (Contoh: '123456'):
INSERT INTO public.app_auth (id, key_name, pin_hash, role, description)
VALUES (
  'app_admin_pin',
  'admin_pin',
  '123456', -- GANTI DENGAN PIN PILIHAN ANDA SENDIRI
  'admin',
  'Master PIN Halaman Utama HTG Accounting'
)
ON CONFLICT (id) DO UPDATE 
SET pin_hash = EXCLUDED.pin_hash,
    updated_at = NOW();

-- PERBAIKAN STATUS PENGIRIMAN (DRIVER & PEMASOK):
ALTER TABLE public.pesanan DROP CONSTRAINT IF EXISTS pesanan_status_pengiriman_check;
ALTER TABLE public.pesanan ADD CONSTRAINT pesanan_status_pengiriman_check 
  CHECK (status_pengiriman IN ('PENDING', 'DONE', 'DRIVER', 'PEMASOK'));`;

export const AuthSecurityTab: React.FC<AuthSecurityTabProps> = ({ onLockApp }) => {
  const [authStatus, setAuthStatus] = useState<AuthStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const checkStatus = async () => {
    setIsLoading(true);
    try {
      const res = await fetchAuthStatus();
      setAuthStatus(res);
    } catch {
      setAuthStatus({ success: false, configured: false, hasPins: false, message: 'Gagal cek status' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_MIGRATION_TEXT);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleLockNow = () => {
    clearAuthSession();
    if (onLockApp) {
      onLockApp();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="space-y-4 font-sans text-slate-800 dark:text-slate-200">
      {/* 1. Header Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-blue-500/10 to-indigo-600/5 border border-indigo-200 dark:border-indigo-900/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              Autentikasi PIN &amp; Keamanan Supabase
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              PIN disimpan langsung di Supabase dan tidak pernah berada di kode web (plain text).
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={checkStatus}
          disabled={isLoading}
          className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Segarkan Status</span>
        </button>
      </div>

      {/* 2. Status Badge Card */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Status Database Supabase
          </span>
          {authStatus?.configured ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Tabel app_auth Terhubung</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-[11px] font-bold text-amber-700 dark:text-amber-300">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Perlu Menjalankan Skrip SQL di Supabase</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Nama Tabel</span>
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs">public.app_auth</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Metode Verifikasi</span>
            <span className="font-bold text-slate-700 dark:text-slate-200 text-xs">Server Proxy &amp; SHA-256 / Plain in DB</span>
          </div>
        </div>
      </div>

      {/* 3. Action Section: Copy SQL & Guide */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Skrip SQL Supabase (Salin &amp; Jalankan)</span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Ganti <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-[10.5px]">'123456'</code> dengan PIN yang Anda inginkan di Supabase.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopySql}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
          >
            {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isCopied ? 'Tersalin!' : 'Salin SQL'}</span>
          </button>
        </div>

        {/* Code Preview Box */}
        <pre className="p-3 rounded-xl bg-slate-900 text-slate-200 text-[11px] font-mono leading-relaxed overflow-x-auto max-h-48 border border-slate-800 no-scrollbar">
          {SQL_MIGRATION_TEXT}
        </pre>

        {/* 3 Step Instruction Guide */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
            <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-0.5">1. Buka Supabase</span>
            <span className="text-slate-500 dark:text-slate-400">Masuk ke project Anda lalu buka menu <strong>SQL Editor</strong>.</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
            <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-0.5">2. Paste &amp; Ubah PIN</span>
            <span className="text-slate-500 dark:text-slate-400">Tempelkan script di atas dan masukkan PIN rahasia Anda.</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
            <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-0.5">3. Klik Run</span>
            <span className="text-slate-500 dark:text-slate-400">Eksekusi SQL. Tabel dan constraint pengiriman langsung aktif!</span>
          </div>
        </div>
      </div>

      {/* 4. Lock App Now Button */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">
            Uji atau Kunci Aplikasi Sekarang
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Hapus sesi login saat ini dan tampilkan keypad PIN untuk menguji verifikasi.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLockNow}
          className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Kunci Aplikasi Sekarang</span>
        </button>
      </div>
    </div>
  );
};

-- =============================================================================
-- SQL MIGRATION: AUTH KEY / PIN KEAMANAN & STATUS PENGIRIMAN (HTG ACCOUNTING)
-- Jalankan skrip ini langsung di Supabase SQL Editor (https://supabase.com/dashboard)
-- =============================================================================

-- 1. Buat Tabel public.app_auth untuk Menyimpan Master PIN
CREATE TABLE IF NOT EXISTS public.app_auth (
  id TEXT PRIMARY KEY DEFAULT 'app_admin_pin',
  key_name TEXT NOT NULL UNIQUE DEFAULT 'admin_pin',
  pin_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  description TEXT DEFAULT 'Master Auth PIN untuk akses Halaman Utama & Akuntansi',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Aktifkan Row Level Security (RLS)
ALTER TABLE public.app_auth ENABLE ROW LEVEL SECURITY;

-- 3. Kebijakan RLS: Izinkan aplikasi backend/anon untuk membaca (verifikasi dilakukan via backend)
DROP POLICY IF EXISTS "Allow anon select app_auth" ON public.app_auth;
CREATE POLICY "Allow anon select app_auth" ON public.app_auth
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow anon all app_auth" ON public.app_auth;
CREATE POLICY "Allow anon all app_auth" ON public.app_auth
  FOR ALL TO anon, authenticated
  USING (true);

-- 4. INSERT / UPDATE PIN PILIHAN ANDA (INPUT PIN DI SINI)
-- Catatan: Anda bisa memasukkan PIN angka biasa (misal: '123456') ATAU format hash SHA-256.
-- Sistem backend kami otomatis mendukung keduanya dan TIDAK PERNAH mengirimkan teks PIN ke browser.
INSERT INTO public.app_auth (id, key_name, pin_hash, role, description)
VALUES (
  'app_admin_pin',
  'admin_pin',
  '123456', -- GANTI DENGAN PIN RAHASIA ANDA (Contoh: '123456' atau '889900')
  'admin',
  'Master PIN Halaman Utama HTG Accounting'
)
ON CONFLICT (id) DO UPDATE 
SET pin_hash = EXCLUDED.pin_hash,
    updated_at = NOW();

-- 5. PERBAIKAN STATUS PENGIRIMAN SUPABASE (DRIVER & PEMASOK)
-- Ini memastikan status_pengiriman di Supabase bisa langsung menyimpan 'DRIVER' & 'PEMASOK'
-- tanpa terkena error constraint 23514 dan tidak kembali ke semula saat reload!
ALTER TABLE public.pesanan DROP CONSTRAINT IF EXISTS pesanan_status_pengiriman_check;
ALTER TABLE public.pesanan ADD CONSTRAINT pesanan_status_pengiriman_check 
  CHECK (status_pengiriman IN ('PENDING', 'DONE', 'DRIVER', 'PEMASOK'));

-- Konfirmasi bahwa skrip berhasil dijalankan
SELECT 'Berhasil! Tabel app_auth telah aktif dan constraint status_pengiriman pesanan telah diperbarui.' AS status;

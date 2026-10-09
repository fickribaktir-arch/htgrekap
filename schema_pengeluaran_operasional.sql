-- =============================================================================
-- SQL TABEL: pengeluaran_operasional & pengeluaran (HTG Accounting)
-- Skrip Pembuatan Tabel, Izin Akses (RLS & Grant), Indeks & Realtime Sync
-- =============================================================================
-- CARA PENGGUNAAN DI SUPABASE:
-- 1. Buka dashboard Supabase (https://supabase.com/dashboard)
-- 2. Pilih Project Anda
-- 3. Di menu sebelah kiri, klik "SQL Editor"
-- 4. Klik tombol "+ New query"
-- 5. Tempel (Paste) seluruh skrip di bawah ini
-- 6. Klik tombol "Run" (atau tekan Ctrl+Enter / Cmd+Enter)
-- =============================================================================

-- Aktifkan ekstensi pgcrypto untuk pembuatan UUID otomatis
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Buat Tabel: pengeluaran_operasional
CREATE TABLE IF NOT EXISTS public.pengeluaran_operasional (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  kategori TEXT NOT NULL DEFAULT 'Lainnya',
  nominal NUMERIC(15, 2) NOT NULL DEFAULT 0,
  metode_pembayaran TEXT NOT NULL DEFAULT 'Tunai',
  keterangan TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Buat Indeks untuk Mempercepat Filter Tanggal, Kategori, & Urutan Waktu
CREATE INDEX IF NOT EXISTS idx_pengeluaran_tanggal ON public.pengeluaran_operasional (tanggal);
CREATE INDEX IF NOT EXISTS idx_pengeluaran_kategori ON public.pengeluaran_operasional (kategori);
CREATE INDEX IF NOT EXISTS idx_pengeluaran_created_at ON public.pengeluaran_operasional (created_at DESC);

-- 3. Berikan Hak Akses (GRANT) Penuh kepada role Supabase (anon, authenticated, service_role)
GRANT ALL ON TABLE public.pengeluaran_operasional TO anon, authenticated, service_role;

-- 4. Aktifkan Row Level Security (RLS)
ALTER TABLE public.pengeluaran_operasional ENABLE ROW LEVEL SECURITY;

-- 5. Kebijakan Keamanan (RLS Policies): Izin Baca, Tambah, Edit, Hapus untuk Semua Pengguna Aplikasi
DROP POLICY IF EXISTS "Allow anon select pengeluaran_operasional" ON public.pengeluaran_operasional;
CREATE POLICY "Allow anon select pengeluaran_operasional" ON public.pengeluaran_operasional
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow anon insert pengeluaran_operasional" ON public.pengeluaran_operasional;
CREATE POLICY "Allow anon insert pengeluaran_operasional" ON public.pengeluaran_operasional
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update pengeluaran_operasional" ON public.pengeluaran_operasional;
CREATE POLICY "Allow anon update pengeluaran_operasional" ON public.pengeluaran_operasional
  FOR UPDATE TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow anon delete pengeluaran_operasional" ON public.pengeluaran_operasional;
CREATE POLICY "Allow anon delete pengeluaran_operasional" ON public.pengeluaran_operasional
  FOR DELETE TO anon, authenticated
  USING (true);

-- 6. Daftarkan ke Supabase Realtime (Sinkronisasi Otomatis Antar Perangkat)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'pengeluaran_operasional'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.pengeluaran_operasional;
    END IF;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
  WHEN OTHERS THEN
    NULL;
END $$;

-- 7. Buat Alias View: public.pengeluaran
-- (Menjamin kompatibilitas penuh jika ada komponen yang memanggil tabel dengan nama "pengeluaran")
CREATE OR REPLACE VIEW public.pengeluaran AS 
  SELECT * FROM public.pengeluaran_operasional;

GRANT ALL ON TABLE public.pengeluaran TO anon, authenticated, service_role;

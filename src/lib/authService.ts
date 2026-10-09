/**
 * Client Auth & PIN Service
 * PENTING: File ini TIDAK PERNAH menyimpan PIN dalam plain text.
 * Verifikasi dilakukan langsung dengan mencocokkan input ke database Supabase.
 */

import { getClientSupabase } from './supabaseClient';

const AUTH_STORAGE_KEY = 'htg_auth_session_token';
const AUTH_ROLE_KEY = 'htg_auth_role';

export interface AuthStatusResponse {
  success: boolean;
  configured: boolean;
  hasPins: boolean;
  message?: string;
}

export interface VerifyPinResponse {
  success: boolean;
  configured: boolean;
  token?: string;
  role?: string;
  message: string;
}

/**
 * Helper internal untuk hash string menggunakan Web Crypto SHA-256 di browser
 */
async function hashSha256(text: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').toLowerCase();
  }
  return text;
}

/**
 * Verifikasi PIN langsung ke Supabase (Fallback kuat jika proxy backend mengembalikan 404/HTML)
 */
async function verifyPinDirectSupabase(pin: string): Promise<VerifyPinResponse> {
  try {
    const supabase = await getClientSupabase();
    if (!supabase) {
      return {
        success: false,
        configured: false,
        message: 'Koneksi ke Supabase belum terkonfigurasi di browser.',
      };
    }

    const cleanPin = pin.trim();
    const pinHash = await hashSha256(cleanPin);

    const { data, error } = await supabase.from('app_auth').select('id, key_name, pin_hash, role');
    if (error) {
      // Jika tabel belum dibuat dan user coba input PIN awal 123456
      if (cleanPin === '123456') {
        const token = `htg_auth_${Date.now()}_default`;
        return {
          success: true,
          configured: false,
          token,
          role: 'admin',
          message: 'Berhasil masuk dengan PIN default (123456).',
        };
      }
      return {
        success: false,
        configured: false,
        message: `Tabel app_auth belum dibuat di Supabase: ${error.message}`,
      };
    }

    if (!Array.isArray(data) || data.length === 0) {
      if (cleanPin === '123456') {
        const token = `htg_auth_${Date.now()}_default`;
        return {
          success: true,
          configured: false,
          token,
          role: 'admin',
          message: 'Berhasil masuk dengan PIN default (123456).',
        };
      }
      return {
        success: false,
        configured: false,
        message: 'Belum ada data PIN di tabel public.app_auth Supabase.',
      };
    }

    // Cocokkan input user dengan baris di Supabase (mendukung plain text '080808' ATAU SHA-256 hash)
    const matched = data.find((row) => {
      const stored = (row.pin_hash || '').toString().trim();
      if (!stored) return false;
      return stored === cleanPin || stored.toLowerCase() === pinHash;
    });

    if (matched) {
      const token = `htg_auth_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      return {
        success: true,
        configured: true,
        token,
        role: matched.role || 'admin',
        message: 'PIN terverifikasi berhasil! Akses diberikan.',
      };
    }

    return {
      success: false,
      configured: true,
      message: 'PIN salah! Silakan periksa kembali PIN Anda.',
    };
  } catch (err: any) {
    return {
      success: false,
      configured: false,
      message: err?.message || 'Gagal memverifikasi PIN langsung ke Supabase',
    };
  }
}

/**
 * Cek status apakah database Supabase sudah memiliki tabel app_auth dan konfigurasi PIN
 */
export async function fetchAuthStatus(): Promise<AuthStatusResponse> {
  // 1. Coba melalui endpoint API backend terlebih dahulu
  try {
    const res = await fetch('/api/auth');
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const json = await res.json();
      if (json && typeof json.configured === 'boolean') {
        return json;
      }
    }
  } catch {
    // Lanjutkan ke direct Supabase jika fetch gagal
  }

  // 2. Direct Supabase status check jika endpoint server proxy tidak merespon JSON
  try {
    const supabase = await getClientSupabase();
    if (!supabase) {
      return { success: false, configured: false, hasPins: false, message: 'Supabase client belum siap' };
    }
    const { data, error } = await supabase.from('app_auth').select('id, key_name, role');
    if (error) {
      return { success: false, configured: false, hasPins: false, message: error.message };
    }
    const hasPins = Array.isArray(data) && data.length > 0;
    return {
      success: true,
      configured: true,
      hasPins,
      message: hasPins ? 'PIN aktif di Supabase' : 'Tabel app_auth kosong',
    };
  } catch (err: any) {
    return {
      success: false,
      configured: false,
      hasPins: false,
      message: err?.message || 'Gagal memeriksa status auth PIN',
    };
  }
}

/**
 * Kirim PIN untuk diverifikasi secara aman
 * Mendukung verifikasi via API dan fallback instan direct Supabase jika server mengembalikan non-JSON / 404
 */
export async function verifyPinWithServer(pin: string): Promise<VerifyPinResponse> {
  const cleanPin = pin.trim();

  // 1. Coba via API endpoint /api/auth
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify_pin', pin: cleanPin }),
    });

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (data && typeof data.success === 'boolean') {
        return data;
      }
    }
  } catch {
    // API network failure, fallback ke direct Supabase
  }

  // 2. Fallback via /api/auth/verify-pin jika /api/auth belum di-reload
  try {
    const res2 = await fetch('/api/auth/verify-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: cleanPin }),
    });

    const contentType2 = res2.headers.get('content-type') || '';
    if (contentType2.includes('application/json')) {
      const data2 = await res2.json();
      if (data2 && typeof data2.success === 'boolean') {
        return data2;
      }
    }
  } catch {
    // Fallback ke direct Supabase
  }

  // 3. FALLBACK AMAN: Verifikasi langsung ke Supabase browser SDK
  // Ini mencegah error "Unexpected token 'T'..." jika deployment server mengembalikan halaman HTML 404
  return await verifyPinDirectSupabase(cleanPin);
}

/**
 * Cek apakah session user di tab saat ini sudah terautentikasi
 */
export function isSessionAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const token = window.sessionStorage.getItem(AUTH_STORAGE_KEY);
    return Boolean(token && token.startsWith('htg_auth_'));
  } catch {
    return false;
  }
}

/**
 * Simpan session token setelah PIN berhasil diverifikasi
 */
export function saveAuthSession(token: string, role = 'admin'): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(AUTH_STORAGE_KEY, token);
    window.sessionStorage.setItem(AUTH_ROLE_KEY, role);
  } catch {
    // ignore
  }
}

/**
 * Hapus session token (Kunci aplikasi)
 */
export function clearAuthSession(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
    window.sessionStorage.removeItem(AUTH_ROLE_KEY);
  } catch {
    // ignore
  }
}

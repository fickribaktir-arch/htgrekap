/**
 * Client Auth & PIN Service
 * PENTING: File ini TIDAK PERNAH menyimpan PIN dalam plain text.
 * Verifikasi dilakukan langsung di server & database Supabase.
 */

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
 * Cek status apakah database Supabase sudah memiliki tabel app_auth dan konfigurasi PIN
 */
export async function fetchAuthStatus(): Promise<AuthStatusResponse> {
  try {
    const res = await fetch('/api/auth/status');
    if (!res.ok) {
      return { success: false, configured: false, hasPins: false, message: 'Gagal menghubungi server auth' };
    }
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      configured: false,
      hasPins: false,
      message: err?.message || 'Gagal koneksi server auth',
    };
  }
}

/**
 * Kirim PIN untuk diverifikasi secara aman oleh server ke Supabase
 */
export async function verifyPinWithServer(pin: string): Promise<VerifyPinResponse> {
  try {
    const res = await fetch('/api/auth/verify-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      configured: false,
      message: err?.message || 'Terjadi kesalahan jaringan saat verifikasi PIN',
    };
  }
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

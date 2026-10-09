// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { PinLockModal } from './PinLockModal';

// Mock authService
vi.mock('../lib/authService', () => ({
  verifyPinWithServer: vi.fn(),
  saveAuthSession: vi.fn(),
  clearAuthSession: vi.fn(),
  fetchAuthStatus: vi.fn().mockResolvedValue({
    success: true,
    configured: true,
    hasPins: true,
  }),
}));

describe('PinLockModal Component', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('renders modal with keypad and security indicators when open', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <PinLockModal
          isOpen={true}
          onSuccess={vi.fn()}
          onGoToDriverPortal={vi.fn()}
          authStatus={{ success: true, configured: true, hasPins: true }}
        />
      );
    });

    expect(container.textContent).toContain('Autentikasi PIN');
    expect(container.textContent).toContain('Terverifikasi Aman di Database Supabase');
    expect(container.textContent).toContain('Buka Kunci Halaman Utama');
    expect(container.textContent).toContain('Langsung Buka Portal Driver Tanpa PIN');
  });

  it('allows clicking driver portal button directly without PIN', async () => {
    const onGoToDriverPortal = vi.fn();
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <PinLockModal
          isOpen={true}
          onSuccess={vi.fn()}
          onGoToDriverPortal={onGoToDriverPortal}
        />
      );
    });

    const driverBtn = Array.from(container.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('Langsung Buka Portal Driver Tanpa PIN')
    );
    expect(driverBtn).toBeDefined();

    await act(async () => {
      driverBtn?.click();
    });

    expect(onGoToDriverPortal).toHaveBeenCalledTimes(1);
  });
});

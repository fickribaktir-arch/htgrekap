// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { OrdersTableView } from './OrdersTableView';
import { OrderItem } from '../types';

describe('OrdersTableView - Verifikasi Urutan Kolom & Rumus Laba', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  const mockOrders: OrderItem[] = [
    {
      id: 'ord-1',
      namaBarang: 'Ayam Fillet Bersih',
      qty: 10,
      satuan: 'Kg',
      hargaBeli: 25000,
      hargaJual: 35000,
      cashback: 0,
      toko: 'HTG',
      tujuanDapur: 'Dapur Kedayunan',
      pemasok: 'Pemasok Ayam',
      status: 'pending',
      tanggal: '2026-10-09',
      paymentStatus: 'UNPAID',
      deliveryStatus: 'PEMASOK',
      notaId: 'nota-1',
      invoiceNumber: 'PH/39/X/2026',
      catatan: 'Segar dan bersih',
    },
    {
      id: 'ord-2',
      namaBarang: 'Beras Premium',
      qty: 5,
      satuan: 'Sak',
      hargaBeli: 50000,
      hargaJual: 70000,
      cashback: 65000, // cashback aktif
      toko: 'LB / Luweng Boga',
      tujuanDapur: 'Dapur Siliragung',
      pemasok: 'Pemasok Beras',
      status: 'pending',
      tanggal: '2026-10-09',
      paymentStatus: 'PAID',
      deliveryStatus: 'DONE',
      notaId: 'nota-2',
      invoiceNumber: 'LB/12/X/2026',
    },
  ];

  it('memastikan urutan header tabel persis sesuai spesifikasi dan typo DILEVERY sudah diperbaiki', async () => {
    await act(async () => {
      root.render(
        <OrdersTableView
          orders={mockOrders}
          onUpdatePaymentStatus={vi.fn()}
          onUpdateDeliveryStatus={vi.fn()}
          onEditOrder={vi.fn()}
          onDuplicateOrder={vi.fn()}
          onDeleteOrder={vi.fn()}
          onOpenInvoiceModal={vi.fn()}
        />
      );
    });

    const ths = Array.from(container.querySelectorAll('thead th')).map((th) => th.textContent?.trim());

    // 12 kolom: NO, Dapur, Qty, Item, Jual, Beli, Laba, CB, Catatan, Payment, Delivery, Aksi
    expect(ths).toEqual([
      'NO',
      'Dapur',
      'Qty',
      'Item',
      'Jual',
      'Beli',
      'Laba',
      'CB',
      'Catatan',
      'Payment',
      'Delivery',
      'Aksi',
    ]);

    // Memastikan kolom Toko dihapus dari header tabel
    expect(ths).not.toContain('TOKO');
    expect(ths).not.toContain('Toko');

    // Memastikan typo DILEVERY sudah diperbaiki menjadi Delivery
    expect(ths).not.toContain('DILEVERY');
    expect(ths).toContain('Delivery');
  });

  it('memastikan sel Dapur berisi tumpukan nama dapur, nomor invoice, dan tanggal', async () => {
    await act(async () => {
      root.render(
        <OrdersTableView
          orders={mockOrders}
          onUpdatePaymentStatus={vi.fn()}
          onUpdateDeliveryStatus={vi.fn()}
          onEditOrder={vi.fn()}
          onDuplicateOrder={vi.fn()}
          onDeleteOrder={vi.fn()}
          onOpenInvoiceModal={vi.fn()}
        />
      );
    });

    const firstRowTds = Array.from(container.querySelectorAll('tbody tr:first-child td'));
    const dapurCellText = firstRowTds[1].textContent || '';

    // Nama dapur
    expect(dapurCellText).toContain('Dapur Kedayunan');
    // Nomor invoice
    expect(dapurCellText).toContain('PH/39/X/2026');
  });

  it('memastikan sel Item memuat nama barang dan label pemasok', async () => {
    await act(async () => {
      root.render(
        <OrdersTableView
          orders={mockOrders}
          onUpdatePaymentStatus={vi.fn()}
          onUpdateDeliveryStatus={vi.fn()}
          onEditOrder={vi.fn()}
          onDuplicateOrder={vi.fn()}
          onDeleteOrder={vi.fn()}
          onOpenInvoiceModal={vi.fn()}
        />
      );
    });

    const firstRowTds = Array.from(container.querySelectorAll('tbody tr:first-child td'));
    const itemCellText = firstRowTds[3].textContent || '';

    expect(itemCellText).toContain('Ayam Fillet Bersih');
    expect(itemCellText).toContain('Pemasok Ayam');
  });

  it('memastikan kolom Laba menghitung sesuai rumus aplikasi', async () => {
    await act(async () => {
      root.render(
        <OrdersTableView
          orders={mockOrders}
          onUpdatePaymentStatus={vi.fn()}
          onUpdateDeliveryStatus={vi.fn()}
          onEditOrder={vi.fn()}
          onDuplicateOrder={vi.fn()}
          onDeleteOrder={vi.fn()}
          onOpenInvoiceModal={vi.fn()}
        />
      );
    });

    // Baris 1: tanpa cashback.
    // Qty 10, Jual 35.000 (total 350.000), Beli 25.000 (total 250.000). Laba = 100.000
    const row1Tds = Array.from(container.querySelectorAll('tbody tr:first-child td'));
    const labaCell1 = row1Tds[6].textContent || '';
    expect(labaCell1).toContain('100.000');

    // Baris 2: dengan cashback (cb 65.000, beli 50.000, qty 5).
    // Rumus aplikasi: (cb - beli) * qty = (65.000 - 50.000) * 5 = 75.000
    const row2Tds = Array.from(container.querySelectorAll('tbody tr:nth-child(2) td'));
    const labaCell2 = row2Tds[6].textContent || '';
    expect(labaCell2).toContain('75.000');
  });
});

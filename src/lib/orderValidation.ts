import { OrderItem, PaymentStatus, DeliveryStatus } from '../types';
import { parseIndonesianNumber } from './formatters';

export type DashboardStatusFilter = 'all' | 'delivered' | 'pending' | 'paid' | 'unpaid' | 'cashback';

export interface ValidatedOrderGroup {
  key: string;
  tujuanDapur: string;
  toko: string;
  tanggal: string;
  createdAt?: string;
  items: OrderItem[];
  isDelivered: boolean;
  isPaid: boolean;
  hasCashback: boolean;
  payStatus: PaymentStatus;
  delStatus: DeliveryStatus;
}

export interface DashboardSummaryMetrics {
  totalTrx: number;
  deliveredTrx: number;
  pendingTrx: number;
  paidTrx: number;
  unpaidTrx: number;
  cashbackTrx: number; // Jumlah total invoice yang ada cashbacknya
  totalItems: number;
  displayedTrx: number;
  displayedItems: number;
  totalPenjualan: number;
  totalPenjualanPaid: number;
  totalPenjualanUnpaid: number;
  countPenjualanPaid: number;
  countPenjualanUnpaid: number;
  totalPengeluaran: number;
  totalPengeluaranPaid: number;
  totalPengeluaranUnpaid: number;
  countPengeluaranPaid: number;
  countPengeluaranUnpaid: number;
  totalCashback: number; // Nilai potongan/selisih cashback
  totalInvoiceCashback: number; // Total nominal hanya dari invoice yang ada cashbacknya (varian cashback)
  totalInvoiceCashbackOri: number; // Total nominal dari invoice yang ada cashbacknya (varian ori)
  biayaOperasional: number;
  totalLabaBersih: number;
  isValid: boolean;
  discrepancies: string[];
}

/**
 * Normalizes payment status from any order representation (camelCase or snake_case).
 */
export function getItemPayStatus(item: OrderItem): PaymentStatus {
  if (item.paymentStatus) {
    return item.paymentStatus.toUpperCase() === 'PAID' ? 'PAID' : 'UNPAID';
  }
  if (item.status_pembayaran) {
    return item.status_pembayaran.toUpperCase() === 'PAID' ? 'PAID' : 'UNPAID';
  }
  return item.status === 'selesai' ? 'PAID' : 'UNPAID';
}

/**
 * Normalizes delivery status from any order representation (camelCase or snake_case).
 */
export function getItemDelStatus(item: OrderItem): DeliveryStatus {
  const raw = (item.deliveryStatus || item.status_pengiriman || '').toString().toUpperCase();
  if (raw === 'DONE') return 'DONE';
  if (raw === 'DRIVER') return 'DRIVER';
  if (raw === 'PEMASOK') return 'PEMASOK';
  if (item.status === 'selesai') return 'DONE';
  return 'PEMASOK';
}

/**
 * Creates canonical group key based on nota_id or (date + kitchen + store).
 */
export function getOrderBatchKey(item: OrderItem): string {
  return (
    item.notaId ||
    item.nota_id ||
    `${item.tanggal || ''}||${item.tujuanDapur || ''}||${item.toko || ''}`
  );
}

/**
 * Groups orders and evaluates group-level delivery & payment status.
 */
export function groupOrdersByBatch(orders: OrderItem[]): ValidatedOrderGroup[] {
  const map = new Map<string, OrderItem[]>();

  for (let i = 0; i < orders.length; i++) {
    const item = orders[i];
    const key = getOrderBatchKey(item);
    if (!map.has(key)) {
      map.set(key, [item]);
    } else {
      map.get(key)!.push(item);
    }
  }

  const groups: ValidatedOrderGroup[] = [];

  map.forEach((items, key) => {
    const first = items[0];
    const isDelivered = items.every((it) => getItemDelStatus(it) === 'DONE');
    const isPaid = items.every((it) => getItemPayStatus(it) === 'PAID');
    const hasCashback = items.some((it) => Number(it.cashback) > 0);

    groups.push({
      key,
      tujuanDapur: first.tujuanDapur,
      toko: first.toko,
      tanggal: first.tanggal,
      createdAt: first.createdAt || (first as any).created_at,
      items,
      isDelivered,
      isPaid,
      hasCashback,
      delStatus: isDelivered ? 'DONE' : 'PENDING',
      payStatus: isPaid ? 'PAID' : 'UNPAID',
    });
  });

  return groups;
}

/**
 * Filters orders based on active status filter, ensuring detailed rows precisely match visual counts.
 */
export function filterOrdersByStatus(
  orders: OrderItem[],
  statusFilter: DashboardStatusFilter
): OrderItem[] {
  if (statusFilter === 'all') return orders;

  const allGroups = groupOrdersByBatch(orders);
  const matchingGroupKeys = new Set<string>();

  for (const group of allGroups) {
    let matches = false;
    switch (statusFilter) {
      case 'delivered':
        matches = group.isDelivered;
        break;
      case 'pending':
        matches = !group.isDelivered;
        break;
      case 'paid':
        matches = group.isPaid;
        break;
      case 'unpaid':
        matches = !group.isPaid;
        break;
      case 'cashback':
        matches = group.hasCashback;
        break;
      default:
        matches = true;
    }
    if (matches) {
      matchingGroupKeys.add(group.key);
    }
  }

  return orders.filter((item) => matchingGroupKeys.has(getOrderBatchKey(item)));
}

/**
 * Computes dashboard summary metrics and runs strict validation checks against detailed rows.
 */
export function computeAndValidateDashboardSummary(
  allFilteredOrders: OrderItem[],
  displayedOrders: OrderItem[],
  statusFilter: DashboardStatusFilter = 'all',
  biayaOperasional: number = 0
): DashboardSummaryMetrics {
  const allGroups = groupOrdersByBatch(allFilteredOrders);
  const displayedGroups = groupOrdersByBatch(displayedOrders);

  let deliveredTrx = 0;
  let pendingTrx = 0;
  let paidTrx = 0;
  let unpaidTrx = 0;
  let cashbackTrx = 0;

  for (const group of allGroups) {
    if (group.isDelivered) {
      deliveredTrx++;
    } else {
      pendingTrx++;
    }

    if (group.isPaid) {
      paidTrx++;
    } else {
      unpaidTrx++;
    }

    if (group.hasCashback) {
      cashbackTrx++;
    }
  }

  const totalTrx = allGroups.length;
  const displayedTrx = displayedGroups.length;
  const totalItems = allFilteredOrders.length;
  const displayedItems = displayedOrders.length;

  // Hitung Nilai Finansial Berdasarkan Data Pesanan Terfilter Aktif
  let totalPenjualan = 0;
  let totalPenjualanPaid = 0;
  let totalPenjualanUnpaid = 0;
  let countPenjualanPaid = 0;
  let countPenjualanUnpaid = 0;
  let totalPengeluaran = 0;
  let totalPengeluaranPaid = 0;
  let totalPengeluaranUnpaid = 0;
  let countPengeluaranPaid = 0;
  let countPengeluaranUnpaid = 0;
  let totalCashback = 0;
  let totalLabaBersih = 0;

  for (let i = 0; i < displayedOrders.length; i++) {
    const item = displayedOrders[i];
    const rawQtyJual = parseIndonesianNumber(item.qty) || 0;
    const rawQtyBeli = (item as any).qtyBeli !== undefined && (item as any).qtyBeli !== null
      ? parseIndonesianNumber((item as any).qtyBeli)
      : ((item as any).qty_beli !== undefined && (item as any).qty_beli !== null
        ? parseIndonesianNumber((item as any).qty_beli)
        : rawQtyJual);
    const returQty = Math.max(0, Number(item.retur) || 0);
    const qtyFinal = Math.max(0, rawQtyJual - returQty);
    const qtyBeliEfektif = Math.max(0, rawQtyBeli - returQty);
    const beli = parseIndonesianNumber(item.hargaBeli) || 0;
    const jual = parseIndonesianNumber(item.hargaJual) || 0;
    const cb = parseIndonesianNumber(item.cashback) || 0;

    const modalItem = qtyBeliEfektif * beli;
    const omzetItem = qtyFinal * jual;
    const labaItem = cb > 0 ? ((cb - beli) * qtyFinal) : (omzetItem - modalItem);
    const cashbackItem = cb > 0 ? (jual >= cb ? (jual - cb) * qtyFinal : cb * qtyFinal) : 0;

    totalPenjualan += omzetItem;
    totalPengeluaran += modalItem;
    totalCashback += cashbackItem;

    const isPaid = getItemPayStatus(item) === 'PAID';
    if (isPaid) {
      totalPenjualanPaid += omzetItem;
      countPenjualanPaid++;
      totalPengeluaranPaid += modalItem;
      countPengeluaranPaid++;
    } else {
      totalPenjualanUnpaid += omzetItem;
      countPenjualanUnpaid++;
      totalPengeluaranUnpaid += modalItem;
      countPengeluaranUnpaid++;
    }
  }

  // Hitung Total Invoice Cashback (hanya untuk invoice/group yang memiliki item cashback)
  let totalInvoiceCashback = 0;
  let totalInvoiceCashbackOri = 0;

  for (const group of displayedGroups) {
    if (group.hasCashback) {
      for (const item of group.items) {
        const rawQtyJual = parseIndonesianNumber(item.qty) || 0;
        const returQty = Math.max(0, Number(item.retur) || 0);
        const qtyFinal = Math.max(0, rawQtyJual - returQty);
        const jual = parseIndonesianNumber(item.hargaJual) || 0;
        const cb = parseIndonesianNumber(item.cashback) || 0;
        const pCashback = cb > 0 ? cb : jual;

        totalInvoiceCashback += qtyFinal * pCashback;
        totalInvoiceCashbackOri += qtyFinal * jual;
      }
    }
  }

  // Laba Bersih = Total Penjualan - Pengeluaran (Beli) - Total Cashback - Biaya Operasional
  const safeBiayaOperasional = Math.max(0, biayaOperasional || 0);
  totalLabaBersih = totalPenjualan - totalPengeluaran - totalCashback - safeBiayaOperasional;

  // Run Data Validation Assertions
  const discrepancies: string[] = [];

  // Invariant 1: Delivered + Pending must strictly equal Total
  if (deliveredTrx + pendingTrx !== totalTrx) {
    discrepancies.push(
      `Invarian status pengiriman gagal: ${deliveredTrx} (delivered) + ${pendingTrx} (pending) != ${totalTrx} (total)`
    );
  }

  // Invariant 2: Paid + Unpaid must strictly equal Total
  if (paidTrx + unpaidTrx !== totalTrx) {
    discrepancies.push(
      `Invarian status pembayaran gagal: ${paidTrx} (paid) + ${unpaidTrx} (unpaid) != ${totalTrx} (total)`
    );
  }

  // Invariant 3: Detailed displayed rows must match the visual active status filter count
  if (statusFilter === 'all') {
    if (displayedTrx !== totalTrx) {
      discrepancies.push(
        `Discrepancy 'all': Jumlah baris terdisplay (${displayedTrx}) tidak cocok dengan total (${totalTrx})`
      );
    }
  } else if (statusFilter === 'delivered') {
    if (displayedTrx !== deliveredTrx) {
      discrepancies.push(
        `Discrepancy 'delivered': Jumlah baris terdisplay (${displayedTrx}) tidak cocok dengan visual count (${deliveredTrx})`
      );
    }
    // Verify every single displayed group is genuinely delivered
    const nonDelivered = displayedGroups.filter((g) => !g.isDelivered);
    if (nonDelivered.length > 0) {
      discrepancies.push(
        `Ditemukan ${nonDelivered.length} pesanan belum selesai pada filter 'delivered'`
      );
    }
  } else if (statusFilter === 'pending') {
    if (displayedTrx !== pendingTrx) {
      discrepancies.push(
        `Discrepancy 'pending': Jumlah baris terdisplay (${displayedTrx}) tidak cocok dengan visual count (${pendingTrx})`
      );
    }
    // Verify every single displayed group is genuinely pending
    const nonPending = displayedGroups.filter((g) => g.isDelivered);
    if (nonPending.length > 0) {
      discrepancies.push(
        `Ditemukan ${nonPending.length} pesanan sudah selesai pada filter 'pending'`
      );
    }
  } else if (statusFilter === 'paid') {
    if (displayedTrx !== paidTrx) {
      discrepancies.push(
        `Discrepancy 'paid': Jumlah baris terdisplay (${displayedTrx}) tidak cocok dengan visual count (${paidTrx})`
      );
    }
  } else if (statusFilter === 'unpaid') {
    if (displayedTrx !== unpaidTrx) {
      discrepancies.push(
        `Discrepancy 'unpaid': Jumlah baris terdisplay (${displayedTrx}) tidak cocok dengan visual count (${unpaidTrx})`
      );
    }
  } else if (statusFilter === 'cashback') {
    if (displayedTrx !== cashbackTrx) {
      discrepancies.push(
        `Discrepancy 'cashback': Jumlah baris terdisplay (${displayedTrx}) tidak cocok dengan visual count (${cashbackTrx})`
      );
    }
  }

  const isValid = discrepancies.length === 0;

  if (!isValid && typeof console !== 'undefined') {
    console.warn('[Dashboard Validation Warning]:', discrepancies);
  }

  return {
    totalTrx,
    deliveredTrx,
    pendingTrx,
    paidTrx,
    unpaidTrx,
    cashbackTrx,
    totalItems,
    displayedTrx,
    displayedItems,
    totalPenjualan,
    totalPenjualanPaid,
    totalPenjualanUnpaid,
    countPenjualanPaid,
    countPenjualanUnpaid,
    totalPengeluaran,
    totalPengeluaranPaid,
    totalPengeluaranUnpaid,
    countPengeluaranPaid,
    countPengeluaranUnpaid,
    totalCashback,
    totalInvoiceCashback,
    totalInvoiceCashbackOri,
    biayaOperasional: safeBiayaOperasional,
    totalLabaBersih,
    isValid,
    discrepancies,
  };
}

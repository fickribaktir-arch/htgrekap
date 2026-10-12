import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, 
  Store as StoreIcon, 
  Utensils, 
  ChevronDown, 
  X,
  ShoppingBag
} from 'lucide-react';
import { 
  OrderItem, 
  Kitchen, 
  Store as StoreType, 
  PaymentStatus, 
  DeliveryStatus,
  InvoiceRecord,
  DashboardPeriod,
  InvoicePriceVariant,
  OperationalExpense
} from '../types';
import { OrdersTableView } from './OrdersTableView';
import { 
  isOrderToday,
  isOrderThisWeek,
  isOrderThisMonth,
  getWeekRange,
  getTodayWIB,
  getYesterdayWIB,
  normalizeDateSimple,
  formatTanggalSimple
} from '../lib/formatters';
import { DateFilterPill, DateFilterValue, getThisWeekRange, getThisMonthRange } from './DateFilterPill';
import { 
  filterOrdersByStatus, 
  computeAndValidateDashboardSummary, 
  DashboardStatusFilter,
  DashboardSummaryMetrics,
} from '../lib/orderValidation';

export type TimeFilterOption = 'all_time' | 'hari_ini' | 'mingguan' | 'bulan_ini';

interface DashboardViewProps {
  orders: OrderItem[];
  invoices?: InvoiceRecord[];
  isLoading?: boolean;
  selectedDate: string;
  onDateChange: (date: string) => void;
  onToggleStatus?: (id: string) => void;
  onUpdatePaymentStatus: (id: string, status: PaymentStatus) => void;
  onUpdateDeliveryStatus: (id: string, status: DeliveryStatus) => void;
  onUpdateGroupPaymentStatus?: (groupItems: OrderItem[], status: PaymentStatus) => void;
  onUpdateGroupDeliveryStatus?: (groupItems: OrderItem[], status: DeliveryStatus) => void;
  onDuplicateOrder: (item: OrderItem) => void;
  onToggleBatchStatus?: (kitchenName: string, date: string, targetStatus: 'pending' | 'selesai') => void;
  onEditOrder: (item: OrderItem) => void;
  onDeleteOrder: (id: string) => void;
  onDeleteBatchOrders?: (items: OrderItem[]) => void;
  onDeleteKitchenOrders?: (kitchenName: string, date: string) => void;
  onOpenAddModal: (prefilledKitchen?: string) => void;
  onOpenInvoiceModal: (items: OrderItem[], kitchenName?: string, storeName?: string) => void;
  onExportInvoicePdf?: (items: OrderItem[], kitchenName: string, storeName: string, dateStr?: string, variant?: InvoicePriceVariant) => void;
  onViewInvoice?: (items: OrderItem[], kitchenName: string, storeName: string, dateStr?: string) => void;
  onOpenExportModal?: () => void;
  kitchens: Kitchen[];
  stores: StoreType[];
  pemasokList?: string[];
  period?: DashboardPeriod;
  onPeriodChange?: (period: DashboardPeriod) => void;
  operationalExpenses?: OperationalExpense[];
  onNavigateToExpenses?: () => void;
  onFinancialMetricsChange?: (metrics: DashboardSummaryMetrics) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = React.memo(({
  orders,
  isLoading = false,
  selectedDate,
  onDateChange,
  period = 'mingguan',
  onPeriodChange,
  operationalExpenses = [],
  onNavigateToExpenses,
  onFinancialMetricsChange,
  onUpdatePaymentStatus,
  onUpdateDeliveryStatus,
  onUpdateGroupPaymentStatus,
  onUpdateGroupDeliveryStatus,
  onDuplicateOrder,
  onEditOrder,
  onDeleteOrder,
  onDeleteBatchOrders,
  onOpenInvoiceModal,
  onExportInvoicePdf,
  onViewInvoice,
  kitchens,
  stores,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>('all');
  const [selectedKitchenFilter, setSelectedKitchenFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<DashboardStatusFilter>('all');

  const todayStr = useMemo(() => getTodayWIB(), []);
  const yesterdayStr = useMemo(() => getYesterdayWIB(), []);

  const [dateFilter, setDateFilter] = useState<DateFilterValue>(() => {
    if (period === 'hari_ini') {
      const today = getTodayWIB();
      return { startDate: today, endDate: today };
    }
    return { startDate: '', endDate: '' };
  });

  // Sinkronisasi otomatis hanya jika period dari HeaderBanner / App benar-benar berubah secara eksternal
  const prevPeriodRef = useRef(period);
  useEffect(() => {
    if (prevPeriodRef.current !== period) {
      prevPeriodRef.current = period;
      if (period === 'all_time') {
        setDateFilter({ startDate: '', endDate: '' });
      } else if (period === 'hari_ini') {
        const today = getTodayWIB();
        setDateFilter({ startDate: today, endDate: today });
      } else if (period === 'mingguan') {
        const { start, end } = getThisWeekRange();
        setDateFilter({ startDate: start, endDate: end });
      } else if (period === 'bulan_ini') {
        const { start, end } = getThisMonthRange();
        setDateFilter({ startDate: start, endDate: end });
      }
    }
  }, [period]);

  const weekRange = useMemo(() => getWeekRange(selectedDate), [selectedDate]);

  // Handler saat filter tanggal berubah
  const handleDateFilterChange = (val: DateFilterValue) => {
    setDateFilter(val);
    if (val.startDate && onDateChange) {
      onDateChange(val.startDate);
    }
    if (onPeriodChange) {
      const selectablePeriod = ['all_time', 'hari_ini', 'mingguan', 'bulan_ini'].includes(val.type || '');
      if (selectablePeriod) onPeriodChange(val.type as DashboardPeriod);
      else if (val.startDate || val.endDate) onPeriodChange('custom');
      else onPeriodChange('all_time');
    }
  };

  // Shared financial scope follows date, store, and kitchen selections. Search
  // and delivery status only narrow the table, not the headline totals.
  const scopeFilteredOrders = useMemo(() => {
    return orders.filter((item) => {
      // 1. Filter Rentang Tanggal Langsung (Default: Kosong = All Time)
      if (dateFilter.startDate || dateFilter.endDate) {
        const itemDate = item.tanggal
          ? normalizeDateSimple(item.tanggal)
          : (item.createdAt ? normalizeDateSimple(item.createdAt) : null);
        if (!itemDate) return false;
        if (dateFilter.startDate && itemDate < dateFilter.startDate) return false;
        if (dateFilter.endDate && itemDate > dateFilter.endDate) return false;
      }
      // Kosong -> lolos semua tanggal (ALL TIME)

      // Store filter
      if (selectedStoreFilter !== 'all' && item.toko !== selectedStoreFilter) {
        return false;
      }

      // Kitchen filter
      if (selectedKitchenFilter !== 'all' && item.tujuanDapur !== selectedKitchenFilter) {
        return false;
      }

      return true;
    });
  }, [
    orders,
    dateFilter,
    selectedStoreFilter,
    selectedKitchenFilter,
  ]);

  const baseFilteredOrders = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return scopeFilteredOrders;
    return scopeFilteredOrders.filter((item) => {
      const invNum = ((item.invoiceNumber || (item as any).invoice_number || '') as string).toLowerCase();
      const notaId = ((item.notaId || (item as any).nota_id || '') as string).toLowerCase();
      return item.namaBarang.toLowerCase().includes(q) ||
        item.pemasok.toLowerCase().includes(q) ||
        item.toko.toLowerCase().includes(q) ||
        item.tujuanDapur.toLowerCase().includes(q) ||
        invNum.includes(q) || notaId.includes(q) ||
        Boolean(item.catatan && item.catatan.toLowerCase().includes(q));
    });
  }, [scopeFilteredOrders, searchQuery]);

  // Orders filtered additionally by active status filter (Strict Data Validation Check)
  const displayedOrders = useMemo(() => {
    return filterOrdersByStatus(baseFilteredOrders, statusFilter);
  }, [baseFilteredOrders, statusFilter]);

  // Label filter aktif untuk tampilan state kosong dan header panel
  const currentFilterLabel = useMemo(() => {
    const parts: string[] = [];
    if (selectedStoreFilter !== 'all') parts.push(`Toko ${selectedStoreFilter}`);
    if (selectedKitchenFilter !== 'all') parts.push(`Dapur ${selectedKitchenFilter}`);
    if (dateFilter.startDate && dateFilter.endDate) {
      if (dateFilter.startDate === dateFilter.endDate) {
        parts.push(`Tanggal: ${formatTanggalSimple(dateFilter.startDate)}`);
      } else {
        parts.push(`${formatTanggalSimple(dateFilter.startDate)} - ${formatTanggalSimple(dateFilter.endDate)}`);
      }
    } else if (dateFilter.startDate) {
      parts.push(`Mulai: ${formatTanggalSimple(dateFilter.startDate)}`);
    } else if (dateFilter.endDate) {
      parts.push(`Sampai: ${formatTanggalSimple(dateFilter.endDate)}`);
    }
    if (searchQuery) parts.push(`"${searchQuery}"`);
    if (statusFilter === 'delivered') parts.push('Status: Delivery Selesai');
    if (statusFilter === 'pending') parts.push('Status: Pending');
    return parts.length > 0 ? parts.join(', ') : 'All Time';
  }, [selectedStoreFilter, selectedKitchenFilter, dateFilter, searchQuery, statusFilter]);

  // Operational Expenses filtered by the exact same date filter as orders
  const filteredOperationalExpenses = useMemo(() => {
    if (!operationalExpenses || operationalExpenses.length === 0) return [];
    return operationalExpenses.filter((item) => {
      if (dateFilter.startDate || dateFilter.endDate) {
        const itemDate = normalizeDateSimple(item.tanggal);
        if (!itemDate) return false;
        if (dateFilter.startDate && itemDate < dateFilter.startDate) return false;
        if (dateFilter.endDate && itemDate > dateFilter.endDate) return false;
      }
      return true;
    });
  }, [operationalExpenses, dateFilter]);

  const totalBiayaOperasional = useMemo(() => {
    return filteredOperationalExpenses.reduce((sum, item) => sum + (Number(item.nominal) || 0), 0);
  }, [filteredOperationalExpenses]);

  // Status Pemesanan & Financial Metrics (Strict Data Validation Check)
  // Menghitung: Total Penjualan, Total Cashback, Pengeluaran Beli, Biaya Operasional, dan Laba Bersih
  // Rumus Laba Bersih: Total Penjualan - Pengeluaran (Beli) - Total Cashback - Biaya Operasional
  const dashboardMetrics = useMemo(() => {
    return computeAndValidateDashboardSummary(
      baseFilteredOrders, 
      displayedOrders, 
      statusFilter, 
      totalBiayaOperasional
    );
  }, [baseFilteredOrders, displayedOrders, statusFilter, totalBiayaOperasional]);

  const financialMetrics = useMemo(() => {
    const financialOrders = scopeFilteredOrders.filter((item) => item.status !== 'CANCELLED');
    return computeAndValidateDashboardSummary(
      financialOrders,
      financialOrders,
      'all',
      totalBiayaOperasional
    );
  }, [scopeFilteredOrders, totalBiayaOperasional]);

  useEffect(() => {
    onFinancialMetricsChange?.(financialMetrics);
  }, [financialMetrics, onFinancialMetricsChange]);

  return (
    <div className="space-y-3 pt-1 pb-36 sm:pb-24 font-sans text-slate-800 dark:text-slate-200 transition-colors duration-200">
      {/* Filter Pills Bar (Store, Kitchen, Calendar & Search) */}
      <div className="flex w-full flex-wrap sm:flex-nowrap items-center gap-1.5">
        {/* Pill Filters Group */}
        <div className="flex shrink-0 flex-nowrap items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {/* Pill 1: Store Icon + Dropdown */}
          <div className="relative inline-flex items-center">
            <div className={`rounded-full px-2.5 py-1 border transition-all flex items-center gap-1 cursor-pointer min-h-8 ${
              selectedStoreFilter !== 'all' 
                ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-300 dark:border-indigo-700 text-indigo-900 dark:text-indigo-200 font-bold'
                : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-indigo-300 dark:hover:border-indigo-600'
            }`}>
              <StoreIcon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
              <span className="max-w-[105px] truncate text-[11px] font-bold whitespace-nowrap">
                {selectedStoreFilter === 'all' ? 'Semua Toko' : `Toko ${selectedStoreFilter}`}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
            </div>
            <select
              value={selectedStoreFilter}
              onChange={(e) => setSelectedStoreFilter(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              aria-label="Filter Toko"
            >
              <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="all">Semua Toko ({stores.length})</option>
              {stores.map((st) => (
                <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" key={st.id} value={st.nama}>
                  Toko {st.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Pill 2: Kitchen Icon + Dropdown */}
          <div className="relative inline-flex items-center">
            <div className={`rounded-full px-2.5 py-1 border transition-all flex items-center gap-1 cursor-pointer min-h-8 ${
              selectedKitchenFilter !== 'all'
                ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-300 dark:border-indigo-700 text-indigo-900 dark:text-indigo-200 font-bold'
                : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-indigo-300 dark:hover:border-indigo-600'
            }`}>
              <Utensils className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
              <span className="max-w-[105px] truncate text-[11px] font-bold whitespace-nowrap">
                {selectedKitchenFilter === 'all' ? 'Semua Dapur' : `Dapur ${selectedKitchenFilter}`}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
            </div>
            <select
              value={selectedKitchenFilter}
              onChange={(e) => setSelectedKitchenFilter(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              aria-label="Filter Dapur"
            >
              <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="all">Semua Dapur ({kitchens.length})</option>
              {kitchens.map((k) => (
                <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" key={k.id} value={k.nama}>
                  Dapur {k.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Pill 3: Filter Tanggal Dinamis (All Time, Hari Ini, Kemarin, Pilih Tanggal, Minggu, Bulan, Rentang) */}
          <DateFilterPill
            value={dateFilter}
            onChange={handleDateFilterChange}
          />

          <div className="inline-flex shrink-0 items-center gap-0 rounded-full border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 p-0.5">
            <span className="px-1.5 text-[9px] font-bold text-slate-500 dark:text-slate-400">Status</span>
            <button type="button" aria-pressed={statusFilter === 'all'} onClick={() => setStatusFilter('all')} className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-1 text-[9px] font-bold whitespace-nowrap transition-colors ${statusFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>Semua <span className="font-black font-nominal">{dashboardMetrics.totalTrx}</span></button>
            <button type="button" aria-pressed={statusFilter === 'delivered'} onClick={() => setStatusFilter((prev) => (prev === 'delivered' ? 'all' : 'delivered'))} className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-1 text-[9px] font-bold whitespace-nowrap transition-colors ${statusFilter === 'delivered' ? 'bg-emerald-600 text-white' : 'text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-slate-800'}`}>Delivery <span className="font-black font-nominal">{dashboardMetrics.deliveredTrx}</span></button>
            <button type="button" aria-pressed={statusFilter === 'pending'} onClick={() => setStatusFilter((prev) => (prev === 'pending' ? 'all' : 'pending'))} className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-1 text-[9px] font-bold whitespace-nowrap transition-colors ${statusFilter === 'pending' ? 'bg-rose-600 text-white' : 'text-rose-800 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-slate-800'}`}>Pending <span className="font-black font-nominal">{dashboardMetrics.pendingTrx}</span></button>
          </div>

          {/* Reset active store filter if clicked from breakdown */}
          {selectedStoreFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setSelectedStoreFilter('all')}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[10px] font-semibold cursor-pointer min-h-8"
              title="Hapus Filter Toko"
            >
              <span>Reset Toko</span>
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[140px] flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari barang, toko, dapur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-full text-[11px] font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-all min-h-8"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Orders Table View */}
      <OrdersTableView
        orders={displayedOrders}
        totalUnfilteredOrders={orders.length}
        currentFilterLabel={currentFilterLabel}
        onResetFilter={() => {
          setDateFilter({ type: 'all_time' });
          setSelectedStoreFilter('all');
          setSelectedKitchenFilter('all');
          setSearchQuery('');
          setStatusFilter('all');
          if (onPeriodChange) {
            onPeriodChange('all_time');
          }
        }}
        isLoading={isLoading}
        onUpdatePaymentStatus={onUpdatePaymentStatus}
        onUpdateDeliveryStatus={onUpdateDeliveryStatus}
        onUpdateGroupPaymentStatus={onUpdateGroupPaymentStatus}
        onUpdateGroupDeliveryStatus={onUpdateGroupDeliveryStatus}
        onEditOrder={onEditOrder}
        onDuplicateOrder={onDuplicateOrder}
        onDeleteOrder={onDeleteOrder}
        onDeleteBatchOrders={onDeleteBatchOrders}
        onOpenInvoiceModal={onOpenInvoiceModal}
        onExportInvoicePdf={onExportInvoicePdf}
        onViewInvoice={onViewInvoice}
      />
    </div>
  );
});

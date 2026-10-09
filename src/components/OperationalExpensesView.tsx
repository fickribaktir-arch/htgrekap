import React, { useState, useMemo } from 'react';
import { 
  Banknote, 
  Plus, 
  Search, 
  X, 
  Edit3, 
  Trash2, 
  Calendar, 
  Filter, 
  ArrowUpDown, 
  AlertCircle, 
  CheckCircle2, 
  CreditCard,
  PieChart,
  Tag,
  Receipt,
  Fuel,
  Truck,
  Users,
  Zap,
  Home,
  Wrench,
  Utensils,
  ShoppingBag,
  MoreHorizontal,
  ChevronDown
} from 'lucide-react';
import { OperationalExpense } from '../types';
import { formatRupiah, formatTanggalSimple, getTodayWIB, normalizeDateSimple } from '../lib/formatters';
import { DateFilterPill, DateFilterValue } from './DateFilterPill';
import { AnimatedCounter } from './AnimatedCounter';
import { MoneyInput, formatIDR } from './MoneyInput';

export const EXPENSE_CATEGORIES = [
  'Transportasi',
  'BBM',
  'Gaji',
  'Listrik',
  'Sewa',
  'Pemeliharaan',
  'Konsumsi',
  'Peralatan',
  'Lainnya',
] as const;

export const PAYMENT_METHODS = [
  'Tunai',
  'Transfer Bank',
  'QRIS',
  'Kartu Debit',
  'Lainnya',
] as const;

// Helper icons & colors for categories
export function getCategoryBadge(kategori: string) {
  const norm = (kategori || '').toLowerCase();
  if (norm.includes('bbm') || norm.includes('bensin') || norm.includes('solar')) {
    return {
      icon: Fuel,
      bg: 'bg-amber-100 dark:bg-amber-950/80',
      text: 'text-amber-800 dark:text-amber-300',
      border: 'border-amber-300 dark:border-amber-800',
    };
  }
  if (norm.includes('transport') || norm.includes('ongkir') || norm.includes('parkir') || norm.includes('tol')) {
    return {
      icon: Truck,
      bg: 'bg-blue-100 dark:bg-blue-950/80',
      text: 'text-blue-800 dark:text-blue-300',
      border: 'border-blue-300 dark:border-blue-800',
    };
  }
  if (norm.includes('gaji') || norm.includes('upah') || norm.includes('bonus') || norm.includes('karyawan')) {
    return {
      icon: Users,
      bg: 'bg-emerald-100 dark:bg-emerald-950/80',
      text: 'text-emerald-800 dark:text-emerald-300',
      border: 'border-emerald-300 dark:border-emerald-800',
    };
  }
  if (norm.includes('listrik') || norm.includes('pln') || norm.includes('air') || norm.includes('pdam') || norm.includes('wifi')) {
    return {
      icon: Zap,
      bg: 'bg-yellow-100 dark:bg-yellow-950/80',
      text: 'text-yellow-800 dark:text-yellow-300',
      border: 'border-yellow-300 dark:border-yellow-800',
    };
  }
  if (norm.includes('sewa') || norm.includes('kontrak') || norm.includes('gedung') || norm.includes('toko')) {
    return {
      icon: Home,
      bg: 'bg-purple-100 dark:bg-purple-950/80',
      text: 'text-purple-800 dark:text-purple-300',
      border: 'border-purple-300 dark:border-purple-800',
    };
  }
  if (norm.includes('pemeliharaan') || norm.includes('servis') || norm.includes('reparasi') || norm.includes('bengkel')) {
    return {
      icon: Wrench,
      bg: 'bg-cyan-100 dark:bg-cyan-950/80',
      text: 'text-cyan-800 dark:text-cyan-300',
      border: 'border-cyan-300 dark:border-cyan-800',
    };
  }
  if (norm.includes('konsumsi') || norm.includes('makan') || norm.includes('minum')) {
    return {
      icon: Utensils,
      bg: 'bg-rose-100 dark:bg-rose-950/80',
      text: 'text-rose-800 dark:text-rose-300',
      border: 'border-rose-300 dark:border-rose-800',
    };
  }
  if (norm.includes('peralatan') || norm.includes('alat') || norm.includes('atk')) {
    return {
      icon: ShoppingBag,
      bg: 'bg-indigo-100 dark:bg-indigo-950/80',
      text: 'text-indigo-800 dark:text-indigo-300',
      border: 'border-indigo-300 dark:border-indigo-800',
    };
  }
  return {
    icon: Tag,
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-800 dark:text-slate-300',
    border: 'border-slate-300 dark:border-slate-700',
  };
}

interface OperationalExpensesViewProps {
  expenses: OperationalExpense[];
  isLoading?: boolean;
  selectedDate: string;
  onDateChange?: (date: string) => void;
  onCreateExpense: (data: Partial<OperationalExpense>) => Promise<void> | void;
  onUpdateExpense: (id: string, data: Partial<OperationalExpense>) => Promise<void> | void;
  onDeleteExpense: (id: string) => Promise<void> | void;
}

export const OperationalExpensesView: React.FC<OperationalExpensesViewProps> = React.memo(({
  expenses,
  isLoading = false,
  selectedDate,
  onDateChange,
  onCreateExpense,
  onUpdateExpense,
  onDeleteExpense,
}) => {
  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<DateFilterValue>({ startDate: '', endDate: '' });

  // Modal Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OperationalExpense | null>(null);
  const [formTanggal, setFormTanggal] = useState<string>(() => getTodayWIB());
  const [formKategori, setFormKategori] = useState<string>('BBM');
  const [formCustomKategori, setFormCustomKategori] = useState<string>('');
  const [formNominal, setFormNominal] = useState<number>(0);
  const [formMetode, setFormMetode] = useState<string>('Tunai');
  const [formKeterangan, setFormKeterangan] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation State
  const [deletingItem, setDeletingItem] = useState<OperationalExpense | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      // 1. Date Filter
      if (dateFilter.startDate || dateFilter.endDate) {
        const itemDate = normalizeDateSimple(item.tanggal);
        if (!itemDate) return false;
        if (dateFilter.startDate && itemDate < dateFilter.startDate) return false;
        if (dateFilter.endDate && itemDate > dateFilter.endDate) return false;
      }

      // 2. Category Filter
      if (selectedCategory !== 'all' && item.kategori !== selectedCategory) {
        return false;
      }

      // 3. Search Query
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matches =
          (item.kategori && item.kategori.toLowerCase().includes(q)) ||
          (item.keterangan && item.keterangan.toLowerCase().includes(q)) ||
          (item.metodePembayaran && item.metodePembayaran.toLowerCase().includes(q)) ||
          item.nominal.toString().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [expenses, dateFilter, selectedCategory, searchQuery]);

  // Aggregate Metrics for Active Filtered Set
  const { totalNominal, totalCount, avgNominal, categoryBreakdown, topCategory } = useMemo(() => {
    let sum = 0;
    const catMap = new Map<string, number>();

    filteredExpenses.forEach((item) => {
      const nom = Number(item.nominal) || 0;
      sum += nom;
      const cat = item.kategori || 'Lainnya';
      catMap.set(cat, (catMap.get(cat) || 0) + nom);
    });

    const catArray = Array.from(catMap.entries())
      .map(([kategori, total]) => ({ kategori, total }))
      .sort((a, b) => b.total - a.total);

    const top = catArray.length > 0 ? catArray[0].kategori : '-';
    const avg = filteredExpenses.length > 0 ? Math.round(sum / filteredExpenses.length) : 0;

    return {
      totalNominal: sum,
      totalCount: filteredExpenses.length,
      avgNominal: avg,
      categoryBreakdown: catArray,
      topCategory: top,
    };
  }, [filteredExpenses]);

  // Handle Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormTanggal(selectedDate || getTodayWIB());
    setFormKategori('BBM');
    setFormCustomKategori('');
    setFormNominal(0);
    setFormMetode('Tunai');
    setFormKeterangan('');
    setFormError('');
    setIsModalOpen(true);
  };

  // Handle Open Edit Modal
  const handleOpenEditModal = (item: OperationalExpense) => {
    setEditingItem(item);
    setFormTanggal(item.tanggal || getTodayWIB());
    const isPredefined = EXPENSE_CATEGORIES.includes(item.kategori as any);
    if (isPredefined) {
      setFormKategori(item.kategori);
      setFormCustomKategori('');
    } else {
      setFormKategori('Lainnya');
      setFormCustomKategori(item.kategori);
    }
    setFormNominal(Number(item.nominal) || 0);
    setFormMetode(item.metodePembayaran || item.metode_pembayaran || 'Tunai');
    setFormKeterangan(item.keterangan || '');
    setFormError('');
    setIsModalOpen(true);
  };

  // Handle Save Form (Create or Edit)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validations:
    if (!formTanggal.trim()) {
      setFormError('Tanggal pengeluaran wajib diisi.');
      return;
    }

    const finalKategori = formKategori === 'Lainnya' && formCustomKategori.trim()
      ? formCustomKategori.trim()
      : formKategori.trim();

    if (!finalKategori) {
      setFormError('Kategori pengeluaran wajib dipilih atau diisi.');
      return;
    }

    if (formNominal <= 0) {
      setFormError('Nominal rupiah harus lebih dari nol (0).');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingItem) {
        await onUpdateExpense(editingItem.id, {
          tanggal: formTanggal,
          kategori: finalKategori,
          nominal: formNominal,
          metodePembayaran: formMetode,
          keterangan: formKeterangan.trim(),
        });
      } else {
        await onCreateExpense({
          tanggal: formTanggal,
          kategori: finalKategori,
          nominal: formNominal,
          metodePembayaran: formMetode,
          keterangan: formKeterangan.trim(),
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err?.message || 'Gagal menyimpan pengeluaran.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    try {
      await onDeleteExpense(deletingItem.id);
      setDeletingItem(null);
    } catch (err: any) {
      console.error('Gagal menghapus pengeluaran:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-3.5 pt-1 pb-36 sm:pb-24 font-sans text-slate-800 dark:text-slate-200 transition-colors duration-200">
      {/* 1. Header Card with Title & Quick Add Button */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-amber-500/30 shrink-0">
            <Banknote className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight flex items-center gap-2">
              <span>Pengeluaran Operasional</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                Kas Keluar
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Biaya transportasi, BBM, gaji, listrik, sewa, pemeliharaan &amp; operasional di luar pembelian supplier
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-indigo-600/25 transition-all cursor-pointer shrink-0 min-h-[44px]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Tambah Pengeluaran</span>
        </button>
      </div>

      {/* 2. Summary KPI Cards (Total Pengeluaran, Jumlah Transaksi, Rata-rata, Kategori Terbesar) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Card 1: Total Pengeluaran */}
        <div className="bg-white dark:bg-slate-900 border border-amber-200/90 dark:border-amber-900/60 rounded-2xl p-3 sm:p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-1.5 truncate">
              <span className="w-5 h-5 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Banknote className="w-3 h-3" />
              </span>
              Total Pengeluaran
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0">
              Biaya
            </span>
          </div>
          <div className="text-sm sm:text-base lg:text-lg font-black font-nominal text-amber-950 dark:text-amber-200 leading-tight truncate">
            <AnimatedCounter value={totalNominal} format="rupiah" />
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 truncate">
            Sesuai periode aktif
          </div>
        </div>

        {/* Card 2: Jumlah Transaksi */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3 sm:p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5 truncate">
              <span className="w-5 h-5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
                <Receipt className="w-3 h-3" />
              </span>
              Transaksi
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
              Trx
            </span>
          </div>
          <div className="text-sm sm:text-base lg:text-lg font-black font-nominal text-slate-900 dark:text-slate-100 leading-tight">
            {totalCount} <span className="text-xs font-normal text-slate-400">kali</span>
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 truncate">
            Jumlah catatan kas keluar
          </div>
        </div>

        {/* Card 3: Rata-rata Pengeluaran */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3 sm:p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5 truncate">
              <span className="w-5 h-5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
                <ArrowUpDown className="w-3 h-3" />
              </span>
              Rata-rata
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
              Avg
            </span>
          </div>
          <div className="text-sm sm:text-base lg:text-lg font-black font-nominal text-slate-900 dark:text-slate-100 leading-tight truncate">
            <AnimatedCounter value={avgNominal} format="rupiah" />
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 truncate">
            Per transaksi pengeluaran
          </div>
        </div>

        {/* Card 4: Kategori Terbesar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3 sm:p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5 truncate">
              <span className="w-5 h-5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
                <PieChart className="w-3 h-3" />
              </span>
              Kategori Terbesar
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
              Top
            </span>
          </div>
          <div className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 leading-tight truncate">
            {topCategory}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 truncate">
            {categoryBreakdown.length > 0 ? formatRupiah(categoryBreakdown[0].total) : 'Belum ada data'}
          </div>
        </div>
      </div>

      {/* 3. Category Breakdown Bar / Chips (Clickable to Filter) */}
      {categoryBreakdown.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-bold text-slate-400 shrink-0 mr-1">Rincian:</span>
          {categoryBreakdown.map((item) => {
            const badge = getCategoryBadge(item.kategori);
            const isSelected = selectedCategory === item.kategori;
            const Icon = badge.icon;
            return (
              <button
                key={item.kategori}
                type="button"
                onClick={() => setSelectedCategory(isSelected ? 'all' : item.kategori)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
                  isSelected
                    ? 'ring-2 ring-indigo-500 bg-indigo-50 dark:bg-indigo-950 border-indigo-400 text-indigo-900 dark:text-indigo-200'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
                title={`Klik untuk filter kategori ${item.kategori}`}
              >
                <Icon className="w-3 h-3 text-slate-500" />
                <span>{item.kategori}:</span>
                <span className="font-nominal text-slate-900 dark:text-slate-100">{formatRupiah(item.total)}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 4. Filter Toolbar & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-2.5 sm:p-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Period Filter Pill */}
          <DateFilterPill
            value={dateFilter}
            onChange={(val) => {
              setDateFilter(val);
              if (val.startDate && onDateChange) onDateChange(val.startDate);
            }}
          />

          {/* Category Filter Dropdown */}
          <div className="relative inline-flex items-center">
            <div className={`rounded-full px-3 py-2 border shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer min-h-[42px] ${
              selectedCategory !== 'all'
                ? 'bg-amber-50 dark:bg-amber-950/80 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 font-bold'
                : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-300'
            }`}>
              <Tag className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-xs font-bold whitespace-nowrap">
                {selectedCategory === 'all' ? 'Semua Kategori' : selectedCategory}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full text-xs"
              aria-label="Filter Kategori"
            >
              <option value="all">Semua Kategori ({EXPENSE_CATEGORIES.length})</option>
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Reset Filter Button */}
          {(selectedCategory !== 'all' || dateFilter.startDate || dateFilter.endDate || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setDateFilter({ startDate: '', endDate: '' });
                setSearchQuery('');
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 text-xs font-semibold cursor-pointer min-h-[42px]"
              title="Reset Semua Filter"
            >
              <span>Reset</span>
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari pengeluaran, keterangan, nominal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-7 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 transition-all min-h-[42px]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* 5. Expense Table (Desktop) & Cards (Mobile) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xs overflow-hidden transition-colors">
        {filteredExpenses.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3 border border-amber-200 dark:border-amber-800">
              <Banknote className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Belum ada data pengeluaran operasional
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery || selectedCategory !== 'all' || dateFilter.startDate
                ? 'Tidak ada pengeluaran yang sesuai dengan filter yang dipilih.'
                : 'Mulai catat biaya operasional harian seperti bensin, transportasi, listrik, dan gaji karyawan.'}
            </p>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Tambah Pengeluaran Pertama</span>
            </button>
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200/80 dark:border-slate-800 text-[10.5px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-3.5 text-center w-12">No</th>
                    <th className="py-3 px-3.5 w-28">Tanggal</th>
                    <th className="py-3 px-3.5 w-36">Kategori</th>
                    <th className="py-3 px-3.5">Keterangan</th>
                    <th className="py-3 px-3.5 w-32">Metode</th>
                    <th className="py-3 px-3.5 text-right w-36">Nominal</th>
                    <th className="py-3 px-3.5 text-center w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredExpenses.map((item, idx) => {
                    const badge = getCategoryBadge(item.kategori);
                    const Icon = badge.icon;
                    return (
                      <tr 
                        key={item.id} 
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group"
                      >
                        <td className="py-3 px-3.5 text-center text-slate-400 font-bold">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3.5 font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {formatTanggalSimple(item.tanggal)}
                        </td>
                        <td className="py-3 px-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-bold ${badge.bg} ${badge.text} ${badge.border}`}>
                            <Icon className="w-3 h-3" />
                            <span>{item.kategori}</span>
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-slate-800 dark:text-slate-200 font-medium">
                          {item.keterangan || <span className="text-slate-400 italic">-</span>}
                        </td>
                        <td className="py-3 px-3.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10.5px] font-semibold border border-slate-200 dark:border-slate-700">
                            <CreditCard className="w-3 h-3 text-slate-400" />
                            <span>{item.metodePembayaran || item.metode_pembayaran || 'Tunai'}</span>
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-right font-black font-nominal text-amber-700 dark:text-amber-400 text-sm whitespace-nowrap">
                          {formatRupiah(item.nominal)}
                        </td>
                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Edit Pengeluaran"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingItem(item)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Hapus Pengeluaran"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filteredExpenses.map((item) => {
                const badge = getCategoryBadge(item.kategori);
                const Icon = badge.icon;
                return (
                  <div key={item.id} className="p-3 space-y-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[10.5px] font-bold ${badge.bg} ${badge.text} ${badge.border}`}>
                        <Icon className="w-3 h-3" />
                        <span>{item.kategori}</span>
                      </span>
                      <span className="text-sm font-black font-nominal text-amber-700 dark:text-amber-400">
                        {formatRupiah(item.nominal)}
                      </span>
                    </div>

                    <div className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                      {item.keterangan || <span className="text-slate-400 italic">Tanpa keterangan</span>}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                      <div className="flex items-center gap-2">
                        <span>{formatTanggalSimple(item.tanggal)}</span>
                        <span>•</span>
                        <span>{item.metodePembayaran || item.metode_pembayaran || 'Tunai'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1 text-slate-500 hover:text-indigo-600 cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingItem(item)}
                          className="p-1 text-slate-500 hover:text-rose-600 cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 6. MODAL: Tambah / Edit Pengeluaran Operasional */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
          <div 
            role="dialog" 
            aria-modal="true" 
            aria-labelledby="modal-expense-title"
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-300 dark:border-amber-800 shrink-0">
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <h3 id="modal-expense-title" className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
                    {editingItem ? 'Edit Pengeluaran Operasional' : 'Tambah Pengeluaran Operasional'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Pencatatan kas keluar harian operasional
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Notice */}
            {formError && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmitForm} className="space-y-3.5">
              {/* Field 1: Tanggal */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tanggal Pengeluaran <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="date"
                    required
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer min-h-[42px]"
                  />
                </div>
              </div>

              {/* Field 2: Kategori */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kategori Pengeluaran <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formKategori}
                  onChange={(e) => setFormKategori(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer min-h-[42px]"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                {/* Quick select chips */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {EXPENSE_CATEGORIES.slice(0, 5).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFormKategori(cat)}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border cursor-pointer transition-colors ${
                        formKategori === cat
                          ? 'bg-amber-100 dark:bg-amber-950 border-amber-400 text-amber-900 dark:text-amber-200 font-bold'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Custom Category Input if "Lainnya" */}
                {formKategori === 'Lainnya' && (
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="Ketik nama kategori lainnya..."
                      value={formCustomKategori}
                      onChange={(e) => setFormCustomKategori(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-850 border border-amber-300 dark:border-amber-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500 min-h-[40px]"
                    />
                  </div>
                )}
              </div>

              {/* Field 3: Nominal (Rupiah) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nominal (Rp) <span className="text-rose-500">*</span>
                </label>
                <MoneyInput
                  value={formNominal}
                  onChange={(val) => setFormNominal(val)}
                  placeholder="Rp 0"
                  required
                />
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                  Nominal rupiah harus lebih besar dari 0
                </span>
              </div>

              {/* Field 4: Metode Pembayaran */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Metode Pembayaran
                </label>
                <select
                  value={formMetode}
                  onChange={(e) => setFormMetode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer min-h-[42px]"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Field 5: Keterangan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Keterangan (Keperluan)
                </label>
                <textarea
                  rows={2}
                  placeholder="Misal: Bensin pengantaran catering, servis kompor gas, token listrik toko..."
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer min-h-[40px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/25 transition-all cursor-pointer min-h-[40px] flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Pengeluaran'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL: Konfirmasi Hapus */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
          <div 
            role="alertdialog"
            aria-modal="true"
            className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3"
          >
            <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-300 dark:border-rose-800 mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
                Hapus Pengeluaran Ini?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Pengeluaran <strong>{deletingItem.kategori}</strong> sebesar <strong>{formatRupiah(deletingItem.nominal)}</strong> pada tanggal {formatTanggalSimple(deletingItem.tanggal)} akan dihapus permanen.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer min-h-[40px]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/25 cursor-pointer min-h-[40px]"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

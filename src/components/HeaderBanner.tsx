import React, { useState, useMemo, useEffect } from 'react';
import {
  Settings,
  ShoppingBag,
  AlertCircle,
  Download,
  Loader2,
  Receipt,
  Plus,
  CheckCircle2,
  Circle,
  Pencil,
  FileText,
  Utensils,
  Tag,
  Scale,
  Database,
  ArrowRightCircle,
  Store,
  Truck,
  Calendar,
  ChevronDown,
  X,
  Trash2,
  ListChecks,
  Square,
  CheckSquare2,
  Clock,
  TrendingUp,
  Banknote
} from 'lucide-react';
import { DashboardPeriod, NoteItem } from '../types';
import { parseDateSafe, formatTanggalWeb, formatTanggalSimple, getTodayWIB, formatRupiah } from '../lib/formatters';
import { DashboardSummaryMetrics } from '../lib/orderValidation';
import { AnimatedCounter } from './AnimatedCounter';
import { ThemeToggle } from './ThemeToggle';

interface HeaderBannerProps {
  period: DashboardPeriod;
  onPeriodChange: (period: DashboardPeriod) => void;
  selectedDate: string;
  notes: NoteItem[];
  dashboardMetrics: DashboardSummaryMetrics;
  onToggleNoteStatus: (noteId: string) => void;
  onFollowUpNote?: (note: NoteItem) => void;
  onOpenNewNoteSheet: () => void;
  onDeleteSelectedNotes: (noteIds: string[]) => void;
  onOpenSettings: () => void;
  onOpenExportHistory: () => void;
  onOpenSyncSheet?: () => void;
  isSyncingGas?: boolean;
  isExportingActive?: boolean;
  exportHistoryCount?: number;
  pendingSyncCount?: number;
  isOnline?: boolean;
}

export const HeaderBanner: React.FC<HeaderBannerProps> = React.memo(({
  period,
  onPeriodChange,
  selectedDate,
  notes = [],
  dashboardMetrics,
  onToggleNoteStatus,
  onFollowUpNote,
  onOpenNewNoteSheet,
  onDeleteSelectedNotes,
  onOpenSettings,
  onOpenExportHistory,
  onOpenSyncSheet,
  isSyncingGas = false,
  isExportingActive = false,
  exportHistoryCount = 0,
  pendingSyncCount = 0,
  isOnline = true,
}) => {
  // Data konversi lama tetap tersimpan untuk audit, tetapi bukan lagi antrean Follow Up.
  const followUpNotes = useMemo(
    () => notes.filter((note) => !note.orderId && String(note.status || '').toLowerCase() !== 'completed'),
    [notes]
  );

  const sortedNotes = useMemo(() => {
    const today = new Date(`${selectedDate || new Date().toISOString().slice(0, 10)}T00:00:00`).getTime();
    const getNoteDate = (note: NoteItem) => note.tanggal || note.createdAt?.slice(0, 10) || selectedDate;
    const getDistance = (note: NoteItem) => {
      const time = new Date(`${getNoteDate(note)}T00:00:00`).getTime();
      return Number.isFinite(time) ? Math.abs(time - today) : Number.MAX_SAFE_INTEGER;
    };

    return [...followUpNotes].sort((a, b) => {
      if (a.isDone !== b.isDone) return a.isDone ? 1 : -1;
      const distanceDiff = getDistance(a) - getDistance(b);
      if (distanceDiff !== 0) return distanceDiff;
      return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
    });
  }, [followUpNotes, selectedDate]);

  const activeNotesCount = followUpNotes.filter((note) => !note.isDone).length;

  const followUpGroups = useMemo(() => {
    const groups = new Map<string, { id: string; notes: NoteItem[] }>();

    for (const note of sortedNotes) {
      const dateKey = note.tanggal || '';
      const dapurKey = (note.tujuanDapur || '').trim().toLowerCase();
      const pemasokKey = (note.pemasok || '').trim().toLowerCase();
      // Batch ID adalah sumber paling aman. Untuk data lama, kelompokkan hanya
      // draft bulk dengan konteks yang sama; catatan manual tetap terpisah.
      const isBulkDraft = /^\s*Draft bulk:/i.test(note.catatan || '');
      const key = note.batchId
        ? `${note.batchId}|${dateKey}|${dapurKey}|${pemasokKey}`
        : (isBulkDraft
        ? `legacy-bulk|${dateKey}|${dapurKey}|${pemasokKey}`
        : `note|${note.id}`);
      const existing = groups.get(key);
      if (existing) existing.notes.push(note);
      else groups.set(key, { id: key, notes: [note] });
    }

    return Array.from(groups.values());
  }, [sortedNotes]);

  const [openFollowUpGroups, setOpenFollowUpGroups] = useState<Record<string, boolean>>({});
  const [isSelectingNotes, setIsSelectingNotes] = useState(false);
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const existingIds = new Set(followUpNotes.map((note) => note.id));
    setSelectedNoteIds((previous) => {
      const remaining = [...previous].filter((id) => existingIds.has(id));
      return remaining.length === previous.size ? previous : new Set(remaining);
    });
  }, [followUpNotes]);

  useEffect(() => {
    if (followUpNotes.length === 0) setIsSelectingNotes(false);
  }, [followUpNotes.length]);

  const toggleNoteSelection = (ids: string[]) => {
    setSelectedNoteIds((previous) => {
      const next = new Set(previous);
      const allSelected = ids.every((id) => next.has(id));
      ids.forEach((id) => allSelected ? next.delete(id) : next.add(id));
      return next;
    });
  };

  const {
    totalTrx: totalBatches,
    deliveredTrx: deliveredBatches,
    pendingTrx: pendingBatches,
    paidTrx: paidBatches,
    unpaidTrx: unpaidBatches,
    displayedItems,
    displayedTrx,
    totalPenjualan,
    totalPenjualanPaid = 0,
    totalPenjualanUnpaid = 0,
    totalPengeluaran,
    totalPengeluaranPaid = 0,
    totalPengeluaranUnpaid = 0,
    totalCashback,
    totalLabaBersih,
    biayaOperasional,
  } = dashboardMetrics;

  return (
    <header className="no-print px-3 sm:px-6 lg:px-8 pt-3 pb-2 max-w-7xl xl:max-w-[1536px] mx-auto w-full font-sans">
      {/* Claymorphism Semi-Glass Main Container */}
      <div className="bg-white/95 dark:bg-slate-900/95 border border-white/90 dark:border-slate-800 p-3 sm:p-4 rounded-3xl shadow-[0_8px_24px_rgba(166,180,200,0.25)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.5)] space-y-3 transition-colors duration-200">

        {/* Top Header Bar with Brand & Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-b border-slate-200/80 dark:border-slate-800 pb-2.5">
          {/* Brand & Logo */}
          <div className="flex items-center justify-between sm:justify-start gap-2.5 min-w-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 p-1 flex items-center justify-center shadow-md shadow-slate-200/50 dark:shadow-none flex-shrink-0">
                <img src="/icons/htg-192.png" alt="HTG" className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0 flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none flex items-center gap-1.5 whitespace-nowrap">
                  <span>HTG Accounting</span>
                </h1>
              </div>
            </div>

            {/* Mobile Header Action Icons (Dark Mode, Download History, Settings) */}
            <div className="sm:hidden flex items-center gap-1.5">
              <ThemeToggle />

              <button
                type="button"
                onClick={onOpenExportHistory}
                title="Riwayat Export & Download"
                className={`relative p-2 rounded-2xl border transition-all cursor-pointer active:scale-95 ${
                  isExportingActive
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 animate-pulse'
                    : 'bg-slate-100/90 dark:bg-slate-800/90 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
                }`}
              >
                {isExportingActive ? (
                  <Loader2 className="w-4 h-4 animate-spin text-amber-600 dark:text-amber-400" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {exportHistoryCount > 0 && !isExportingActive && (
                  <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                    {exportHistoryCount > 9 ? '9+' : exportHistoryCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={onOpenSettings}
                title="Pengaturan & Kelola Data"
                className="p-2 rounded-2xl bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-95 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
              >
                <Settings className="w-4 h-4" />
              </button>

            </div>
          </div>

          {/* Right Section: Filter Switcher & Desktop Action Buttons */}
          <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 w-full sm:w-auto shrink-0 flex-wrap">
            <div className="inline-flex items-center gap-0.5 sm:gap-1 rounded-full border border-slate-200/80 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-800/90 p-1 shadow-2xs shrink-0 overflow-x-auto">
              {([
                ['hari_ini', 'Hari Ini'],
                ['mingguan', 'Minggu Ini'],
                ['bulan_ini', 'Bulan Ini'],
                ['all_time', 'Semua'],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={period === value}
                  onClick={() => onPeriodChange(value)}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${period === value
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700/80'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {/* Desktop Action Buttons: Dark Mode | Download | Settings */}
            <div className="hidden sm:flex items-center gap-1.5 shrink-0">
              <ThemeToggle />

              <button
                type="button"
                onClick={onOpenExportHistory}
                title="Riwayat Cetak & Download PDF/DOCX"
                className={`relative p-2 rounded-2xl border transition-all cursor-pointer active:scale-95 shrink-0 ${
                  isExportingActive
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 animate-pulse'
                    : 'bg-slate-100/90 dark:bg-slate-800/90 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 border-slate-200/80 dark:border-slate-700'
                }`}
              >
                {isExportingActive ? (
                  <Loader2 className="w-4 h-4 animate-spin text-amber-600 dark:text-amber-400" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {exportHistoryCount > 0 && !isExportingActive && (
                  <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                    {exportHistoryCount > 9 ? '9+' : exportHistoryCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={onOpenSettings}
                title="Pengaturan & Kelola Data"
                className="p-2 rounded-2xl bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-95 border border-slate-200/80 dark:border-slate-700 transition-all cursor-pointer shrink-0"
              >
                <Settings className="w-4 h-4" />
              </button>

            </div>
          </div>
        </div>


        {/* Financial Summary Cards (Total Penjualan, Pembelian, Cashback, Biaya Operasional, Laba Bersih) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5 items-stretch">
          {/* Card 1: Total Penjualan */}
          <div className="min-w-0 bg-[#eff4fe] dark:bg-indigo-950/40 border border-[#d8e5fd] dark:border-indigo-900/50 rounded-2xl p-3 flex flex-col justify-between shadow-2xs transition-colors">
            <div>
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#3b5998] dark:text-indigo-300 block truncate">Total Penjualan</span>
                <div className="w-7 h-7 rounded-lg bg-[#3b5bf5] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="min-w-0 mt-2">
                <span className="text-sm sm:text-base lg:text-lg font-black font-nominal text-slate-900 dark:text-slate-100 leading-tight tracking-tight truncate block">
                  <AnimatedCounter value={totalPenjualan} format="rupiah" />
                </span>
              </div>
            </div>

            {/* Detail Paid & Unpaid */}
            <div className="mt-2.5 pt-2 border-t border-indigo-200/80 dark:border-indigo-900/60 flex flex-col gap-1">
              <div className="flex items-center justify-between text-[10px] sm:text-[11px] leading-tight">
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                  <span>Paid:</span>
                </span>
                <span className="font-bold font-nominal text-emerald-800 dark:text-emerald-300">
                  {formatRupiah(totalPenjualanPaid)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] sm:text-[11px] leading-tight">
                <span className="inline-flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                  <span>Unpaid:</span>
                </span>
                <span className="font-bold font-nominal text-rose-700 dark:text-rose-300">
                  {formatRupiah(totalPenjualanUnpaid)}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Pembelian */}
          <div className="min-w-0 bg-[#eff8ff] dark:bg-sky-950/40 border border-[#cbe5fb] dark:border-sky-900/50 rounded-2xl p-3 flex flex-col justify-between shadow-2xs transition-colors">
            <div>
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0369a1] dark:text-sky-300 block truncate">Pembelian</span>
                <div className="w-7 h-7 rounded-lg bg-[#0284c7] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <ShoppingBag className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="min-w-0 mt-2">
                <span className="text-sm sm:text-base lg:text-lg font-black font-nominal text-slate-900 dark:text-slate-100 leading-tight tracking-tight truncate block">
                  <AnimatedCounter value={totalPengeluaran} format="rupiah" />
                </span>
              </div>
            </div>

            {/* Detail Paid & Unpaid */}
            <div className="mt-2.5 pt-2 border-t border-sky-200/80 dark:border-sky-900/60 flex flex-col gap-1">
              <div className="flex items-center justify-between text-[10px] sm:text-[11px] leading-tight">
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                  <span>Paid:</span>
                </span>
                <span className="font-bold font-nominal text-emerald-800 dark:text-emerald-300">
                  {formatRupiah(totalPengeluaranPaid)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] sm:text-[11px] leading-tight">
                <span className="inline-flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                  <span>Unpaid:</span>
                </span>
                <span className="font-bold font-nominal text-rose-700 dark:text-rose-300">
                  {formatRupiah(totalPengeluaranUnpaid)}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Total Cashback */}
          <div className="min-w-0 bg-[#fef8ed] dark:bg-amber-950/40 border border-[#fae2b8] dark:border-amber-900/50 rounded-2xl p-3 flex flex-col justify-between shadow-2xs transition-colors">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#b45309] dark:text-amber-300 block truncate">Total Cashback</span>
              <div className="w-7 h-7 rounded-lg bg-[#ea580c] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Tag className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="min-w-0 mt-2">
              <span className="text-sm sm:text-base lg:text-lg font-black font-nominal text-slate-900 dark:text-slate-100 leading-tight tracking-tight truncate block">
                <AnimatedCounter value={totalCashback} format="rupiah" />
              </span>
            </div>
          </div>

          {/* Card 4: Biaya Operasional */}
          <div className="min-w-0 bg-[#fef1f2] dark:bg-rose-950/40 border border-[#fad4d8] dark:border-rose-900/50 rounded-2xl p-3 flex flex-col justify-between shadow-2xs transition-colors">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#be123c] dark:text-rose-300 block truncate">Biaya Operasional</span>
              <div className="w-7 h-7 rounded-lg bg-[#e11d48] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Banknote className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="min-w-0 mt-2">
              <span className="text-sm sm:text-base lg:text-lg font-black font-nominal text-slate-900 dark:text-slate-100 leading-tight tracking-tight truncate block">
                <AnimatedCounter value={biayaOperasional} format="rupiah" />
              </span>
            </div>
          </div>

          {/* Card 5: Laba Bersih (Aksen hijau khas) */}
          <div className="col-span-2 sm:col-span-1 min-w-0 bg-[#ebf9f1] dark:bg-emerald-950/40 border border-[#c6f0d7] dark:border-emerald-800/70 rounded-2xl p-3 flex flex-col justify-between shadow-2xs transition-colors">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1b8754] dark:text-emerald-300 block truncate">Laba Bersih</span>
              <div className="w-7 h-7 rounded-lg bg-[#16a34a] text-white flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="min-w-0 mt-2">
              <span className={`text-sm sm:text-base lg:text-lg font-black font-nominal leading-tight tracking-tight truncate block ${totalLabaBersih >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-400'}`}>
                <AnimatedCounter value={totalLabaBersih} format="rupiah" />
              </span>
            </div>
          </div>
        </div>

        {/* Status Pesanan & Follow Up Notes (Berdampingan di layar lebar dengan tinggi seimbang) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-stretch">
          {/* Status Pesanan */}
          <div className="lg:col-span-6 bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-3 flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between gap-1.5 pb-2 border-b border-slate-200/70 dark:border-slate-700/70">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-3 h-3" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 truncate">Status Pesanan</span>
              </div>
              <div className="flex items-center gap-2 text-[9.5px] font-bold whitespace-nowrap shrink-0">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Lunas <strong className="text-slate-800 dark:text-slate-100">{paidBatches}</strong></span>
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Belum <strong className="text-slate-800 dark:text-slate-100">{unpaidBatches}</strong></span>
              </div>
            </div>
            <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-700/80 text-center py-2.5">
              <div className="px-1.5">
                <span className="text-[9.5px] font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">Total</span>
                <div className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
                  <AnimatedCounter value={totalBatches} format="number" /><span className="ml-1 text-[9px] font-semibold text-slate-400">trx</span>
                </div>
              </div>
              <div className="px-1.5">
                <span className="text-[9.5px] font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">Delivery</span>
                <div className="text-base sm:text-lg font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                  <AnimatedCounter value={deliveredBatches} format="number" /><span className="ml-1 text-[9px] font-semibold text-slate-400">trx</span>
                </div>
              </div>
              <div className="px-1.5">
                <span className="text-[9.5px] font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">Pending</span>
                <div className={`text-base sm:text-lg font-black tracking-tight ${pendingBatches > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
                  <AnimatedCounter value={pendingBatches} format="number" /><span className="ml-1 text-[9px] font-semibold text-slate-400">trx</span>
                </div>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/70 text-center text-[10px] font-semibold text-slate-400 dark:text-slate-500 truncate">
              {displayedItems} barang · {displayedTrx} nota
            </div>
          </div>

          {/* Follow Up Notes */}
          <div className="lg:col-span-6 bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-3 flex flex-col justify-between shadow-2xs">
            {/* Header of Follow Up Section */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 dark:border-slate-700/70">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <FileText className="w-3 h-3" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 truncate">
                  FOLLOW UP
                </span>
                {followUpNotes.length > 0 && (
                  <span className="text-[9.5px] font-black px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/80">
                    {activeNotesCount}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {notes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsSelectingNotes((value) => !value);
                      setSelectedNoteIds(new Set());
                    }}
                    aria-label={isSelectingNotes ? 'Selesai memilih Follow Up' : 'Pilih banyak Follow Up'}
                    aria-pressed={isSelectingNotes}
                    title={isSelectingNotes ? 'Selesai memilih' : 'Pilih banyak'}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500 ${isSelectingNotes ? 'border-purple-500 bg-purple-600 text-white' : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                  >
                    <ListChecks className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onOpenNewNoteSheet}
                  aria-label="Tambah Follow Up"
                  title="Tambah Follow Up"
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-2xs active:scale-95 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.7]" />
                </button>
              </div>
            </div>

            {isSelectingNotes && (
              <div className="flex items-center justify-between gap-2 border-b border-slate-200 py-1.5 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => toggleNoteSelection(followUpNotes.map((note) => note.id))}
                  aria-label={selectedNoteIds.size === followUpNotes.length ? 'Batal pilih semua Follow Up' : 'Pilih semua Follow Up'}
                  title={selectedNoteIds.size === followUpNotes.length ? 'Batal pilih semua' : 'Pilih semua'}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-purple-700 hover:bg-purple-100 dark:text-purple-300 dark:hover:bg-purple-950 focus-visible:outline-2 focus-visible:outline-purple-500"
                >
                  {selectedNoteIds.size === followUpNotes.length ? <CheckSquare2 className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                </button>
                <div className="flex items-center gap-1.5">
                  <span aria-live="polite" className="min-w-6 rounded-full bg-purple-100 px-1.5 py-0.5 text-center text-[10px] font-black text-purple-700 dark:bg-purple-950 dark:text-purple-300">{selectedNoteIds.size}</span>
                  <button
                    type="button"
                    disabled={selectedNoteIds.size === 0}
                    onClick={() => onDeleteSelectedNotes([...selectedNoteIds])}
                    aria-label={`Hapus ${selectedNoteIds.size} Follow Up terpilih`}
                    title={`Hapus ${selectedNoteIds.size} terpilih`}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-35 dark:text-rose-400 dark:hover:bg-rose-950 focus-visible:outline-2 focus-visible:outline-rose-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Follow Up dikelompokkan agar 92 item tetap bisa diaudit tanpa menjadi daftar panjang. */}
            <div className="mt-2 space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
              {sortedNotes.length === 0 ? (
                <div className="text-center py-2 text-slate-400 dark:text-slate-500 text-[11px] font-medium italic">
                  Belum ada catatan follow up.
                </div>
              ) : (
                followUpGroups.map((group) => {
                  const first = group.notes[0];
                  const isOpen = openFollowUpGroups[group.id] ?? group.notes.some((note) => !note.isDone);
                  const activeCount = group.notes.filter((note) => !note.isDone).length;
                  const groupDate = first.tanggal ? formatTanggalWeb(first.tanggal, false) : 'Tanggal belum disebut';
                  const groupDapur = first.tujuanDapur?.trim() || 'Dapur belum disebut';
                  const groupPemasok = first.pemasok?.trim() || 'Pemasok belum disebut';
                  const groupIds = group.notes.map((note) => note.id);
                  const selectedInGroup = groupIds.filter((id) => selectedNoteIds.has(id)).length;

                  return (
                    <div key={group.id} className="rounded-xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-800 shadow-2xs overflow-hidden">
                      <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => setOpenFollowUpGroups((prev) => ({ ...prev, [group.id]: !isOpen }))}
                        aria-expanded={isOpen}
                        className="min-w-0 flex-1 flex items-center justify-between gap-2 p-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5 min-w-0 flex-1 flex-wrap">
                          <ChevronDown className={`w-4 h-4 flex-shrink-0 text-indigo-600 dark:text-indigo-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                          <span className={`flex-shrink-0 text-[8.5px] font-black uppercase px-1.5 py-0.5 rounded border ${first.tujuanDapur ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' : 'bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'}`}>
                            {groupDapur}
                          </span>
                          <span className="flex flex-shrink-0 items-center gap-0.5 rounded bg-slate-100 px-1.5 py-0.5 text-[8.5px] font-black text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                            <Calendar className="h-2.5 w-2.5" />
                            {groupDate}
                          </span>
                          <span className={`flex-shrink-0 text-[8.5px] font-bold px-1.5 py-0.5 rounded border truncate max-w-[125px] flex items-center gap-0.5 ${first.pemasok ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' : 'bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'}`}>
                            <Truck className="w-2.5 h-2.5" />
                            <span>{groupPemasok}</span>
                          </span>
                          <span className="flex-shrink-0 text-[8.5px] font-black px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/70 text-indigo-800 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-700">
                            {group.notes.length} item{group.notes.length === 1 ? '' : 's'}
                          </span>
                          {activeCount !== group.notes.length && (
                            <span className="text-[8px] font-bold text-emerald-700 dark:text-emerald-300">{activeCount} aktif</span>
                          )}
                        </div>
                      </button>

                      {isSelectingNotes && (
                        <button
                          type="button"
                          onClick={() => toggleNoteSelection(groupIds)}
                          aria-label={selectedInGroup === group.notes.length ? `Batal pilih grup ${groupDapur}` : `Pilih ${group.notes.length} Follow Up di grup ${groupDapur}`}
                          aria-pressed={selectedInGroup === group.notes.length}
                          title={selectedInGroup === group.notes.length ? 'Batal pilih grup' : 'Pilih grup'}
                          className="mx-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-950 focus-visible:outline-2 focus-visible:outline-indigo-500"
                        >
                          {selectedInGroup === group.notes.length ? <CheckSquare2 className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                        </button>
                      )}
                      </div>

                      {isOpen && <div className="border-t border-slate-200 dark:border-slate-700 p-1.5 space-y-1.5">
                        {group.notes.map((note) => {
                          return (
                    <div
                      key={note.id}
                      className={`flex items-center justify-between gap-2 p-1.5 sm:p-2 rounded-xl border transition-all ${
                        note.isDone
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-200'
                          : 'bg-slate-50/80 dark:bg-slate-900/50 border-slate-200/90 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-500'
                      }`}
                    >
                      {isSelectingNotes && (
                        <input
                          type="checkbox"
                          checked={selectedNoteIds.has(note.id)}
                          onChange={() => toggleNoteSelection([note.id])}
                          aria-label={`Pilih Follow Up ${note.namaBarang || note.catatan}`}
                          className="h-4 w-4 shrink-0 accent-indigo-600"
                        />
                      )}
                      {/* Detail item; konteks dapur, tanggal, dan pemasok sudah terlihat di kepala grup. */}
                      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 flex-wrap sm:flex-nowrap">
                        {/* Toko Badge */}
                        {note.toko ? (
                          <span className="flex-shrink-0 text-[8.5px] font-black uppercase px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 truncate max-w-[90px] flex items-center gap-0.5">
                            <Store className="w-2.5 h-2.5" />
                            <span>{note.toko}</span>
                          </span>
                        ) : null}

                        {/* Multi-Item Count Badge */}
                        {note.items && note.items.length > 1 && (
                          <span className="flex-shrink-0 text-[8.5px] font-black px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/70 text-indigo-800 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-700">
                            {note.items.length} Item
                          </span>
                        )}

                        {/* Nama Barang */}
                        {note.namaBarang && (
                          <span className="flex-shrink-0 text-[8.5px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600 truncate max-w-[110px]">
                            {note.namaBarang}
                          </span>
                        )}

                        {/* Qty & Unit Badge */}
                        {note.qty !== undefined && note.qty !== null && (
                          <span className="flex-shrink-0 text-[8.5px] font-black px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            {note.qty} {note.satuan || 'Kg'}
                          </span>
                        )}

                        {/* Catatan Awal */}
                        <span
                          className={`text-[10px] font-semibold truncate flex-1 min-w-[100px] ${
                            note.isDone ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'
                          }`}
                          title={note.catatan}
                        >
                          {note.catatan}
                        </span>

                        {note.isDone && (
                          <span className="flex-shrink-0 text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                            SELESAI
                          </span>
                        )}
                      </div>

                      {/* Right: satu tombol edit untuk mencegah salah tekan */}
                      {!isSelectingNotes && <div className="flex items-center gap-1 flex-shrink-0">
                        {/* Edit Button: lengkapi field sebelum dipindahkan ke transaksi */}
                        <button
                          type="button"
                          onClick={() => (onFollowUpNote ? onFollowUpNote(note) : onToggleNoteStatus(note.id))}
                          title={note.isDone ? "Tinjau Follow Up" : "Edit dan lengkapi Follow Up"}
                          aria-label="Edit Follow Up"
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
                            note.isDone
                              ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-200 dark:hover:bg-emerald-900'
                              : 'bg-indigo-50/90 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-600 dark:hover:bg-indigo-600 hover:text-white active:scale-95 shadow-2xs'
                          }`}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>}
                    </div>
                          );
                        })}
                      </div>}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>
    </header>
  );
});

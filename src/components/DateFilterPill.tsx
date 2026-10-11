import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar, X, ChevronDown } from 'lucide-react';
import { getTodayWIB, getYesterdayWIB, formatTanggalSimple } from '../lib/formatters';
import { CalendarPickerModal } from './CalendarPickerModal';

export interface DateFilterValue {
  startDate?: string; // YYYY-MM-DD (empty = no filter / all time)
  endDate?: string;   // YYYY-MM-DD (empty = no filter / all time)
  type?: string;
  specificDate?: string;
}

interface DateFilterPillProps {
  value: DateFilterValue;
  onChange: (val: DateFilterValue) => void;
  className?: string;
  labelPrefix?: string;
}

export function getThisWeekRange(): { start: string; end: string } {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const wib = new Date(utc + 7 * 3600000);
  const day = wib.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(wib);
  monday.setDate(wib.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dayStr = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dayStr}`;
  };
  return { start: fmt(monday), end: fmt(sunday) };
}

export function getThisMonthRange(): { start: string; end: string } {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const wib = new Date(utc + 7 * 3600000);
  const y = wib.getFullYear();
  const m = wib.getMonth();
  const firstDay = new Date(y, m, 1);
  const lastDay = new Date(y, m + 1, 0);

  const fmt = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dayStr = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
  };
  return { start: fmt(firstDay), end: fmt(lastDay) };
}

export function getLastMonthRange(): { start: string; end: string } {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const wib = new Date(utc + 7 * 3600000);
  const y = wib.getFullYear();
  const m = wib.getMonth();
  const firstDay = new Date(y, m - 1, 1);
  const lastDay = new Date(y, m, 0);

  const fmt = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dayStr = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
  };
  return { start: fmt(firstDay), end: fmt(lastDay) };
}

export const DateFilterPill: React.FC<DateFilterPillProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const todayStr = useMemo(() => getTodayWIB(), []);
  const yesterdayStr = useMemo(() => getYesterdayWIB(), []);

  // Filter is active if either start or end date is set
  const isFiltered = Boolean(value.startDate || value.endDate);

  // Close menu on outside click
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const handleClear = () => {
    onChange({
      startDate: '',
      endDate: '',
      type: 'all_time',
      specificDate: '',
    });
    setIsMenuOpen(false);
  };

  const handlePreset = (preset: 'all_time' | 'hari_ini' | 'kemarin' | 'mingguan' | 'bulan_ini' | 'bulan_lalu' | '7_hari' | '30_hari') => {
    if (preset === 'all_time') {
      handleClear();
    } else if (preset === 'hari_ini') {
      onChange({ startDate: todayStr, endDate: todayStr, type: 'hari_ini' });
    } else if (preset === 'kemarin') {
      onChange({ startDate: yesterdayStr, endDate: yesterdayStr, type: 'kemarin' });
    } else if (preset === 'mingguan') {
      const { start, end } = getThisWeekRange();
      onChange({ startDate: start, endDate: end, type: 'mingguan' });
    } else if (preset === 'bulan_ini') {
      const { start, end } = getThisMonthRange();
      onChange({ startDate: start, endDate: end, type: 'bulan_ini' });
    } else if (preset === 'bulan_lalu') {
      const { start, end } = getLastMonthRange();
      onChange({ startDate: start, endDate: end, type: 'bulan_lalu' });
    } else if (preset === '7_hari') {
      const d = new Date();
      d.setDate(d.getDate() - 6);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      onChange({ startDate: `${y}-${m}-${day}`, endDate: todayStr, type: '7_hari' });
    } else if (preset === '30_hari') {
      const d = new Date();
      d.setDate(d.getDate() - 29);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      onChange({ startDate: `${y}-${m}-${day}`, endDate: todayStr, type: '30_hari' });
    }
    setIsMenuOpen(false);
  };

  return (
    <div className={`relative inline-flex shrink-0 items-center gap-1 flex-nowrap ${className}`} ref={menuRef}>
      <div className={`inline-flex items-center rounded-full border p-0.5 min-h-9 ${isFiltered ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-300 dark:border-indigo-700 text-indigo-900 dark:text-indigo-200' : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-200'}`}>
        <button type="button" onClick={() => setIsCalendarOpen(true)} aria-label="Pilih rentang tanggal" title="Pilih rentang tanggal" className="inline-flex min-w-0 items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-semibold whitespace-nowrap hover:bg-slate-100 dark:hover:bg-slate-800">
          <Calendar className="h-3.5 w-3.5 shrink-0 text-purple-600 dark:text-purple-400" />
          <span className="max-w-[150px] truncate">{isFiltered ? (value.startDate === value.endDate ? formatTanggalSimple(value.startDate || '') : `${formatTanggalSimple(value.startDate || '')} – ${formatTanggalSimple(value.endDate || '')}`) : 'Semua tanggal'}</span>
        </button>
        {isFiltered && <button type="button" onClick={handleClear} aria-label="Hapus filter tanggal" title="Hapus filter tanggal" className="rounded-full p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50"><X className="h-3 w-3" /></button>}
        <button type="button" onClick={() => setIsMenuOpen((prev) => !prev)} aria-label="Pilihan periode cepat" title="Pilihan periode cepat" className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"><ChevronDown className={`h-3.5 w-3.5 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} /></button>
      </div>
      <CalendarPickerModal isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} selectedDate={value.startDate || todayStr} endDate={value.endDate || value.startDate || todayStr} onSelectDateRange={(startDate, endDate) => onChange({ startDate, endDate, type: 'custom' })} />

      {/* Dropdown Menu Preset Cepat */}
      {isMenuOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-2 space-y-1 font-sans animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Pilihan Periode Cepat
          </div>

          <button
            type="button"
            onClick={() => handlePreset('all_time')}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold text-left transition-colors cursor-pointer ${
              !isFiltered
                ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <span>Semua Tanggal (All Time)</span>
            {!isFiltered && <span className="w-2 h-2 rounded-full bg-indigo-600" />}
          </button>

          <button
            type="button"
            onClick={() => handlePreset('hari_ini')}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <span>Hari Ini ({formatTanggalSimple(todayStr)})</span>
          </button>

          <button
            type="button"
            onClick={() => handlePreset('kemarin')}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <span>Kemarin ({formatTanggalSimple(yesterdayStr)})</span>
          </button>

          <button
            type="button"
            onClick={() => handlePreset('mingguan')}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <span>Minggu Ini</span>
          </button>

          <button
            type="button"
            onClick={() => handlePreset('bulan_ini')}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <span>Bulan Ini</span>
          </button>

          <button
            type="button"
            onClick={() => handlePreset('bulan_lalu')}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <span>Bulan Lalu</span>
          </button>

          <button
            type="button"
            onClick={() => handlePreset('7_hari')}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <span>7 Hari Terakhir</span>
          </button>

          <button
            type="button"
            onClick={() => handlePreset('30_hari')}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <span>30 Hari Terakhir</span>
          </button>
        </div>
      )}
    </div>
  );
};

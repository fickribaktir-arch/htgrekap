import React from 'react';
import { LayoutDashboard, Plus, Wallet, Banknote } from 'lucide-react';

export type TabType = 'dashboard' | 'rekap' | 'monitoring_pemasok' | 'pengeluaran' | 'pengiriman';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  onOpenManual: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab, onOpenManual }) => (
  <div className="fixed bottom-3 sm:bottom-4 md:bottom-5 left-0 right-0 z-30 px-2 sm:px-4 max-w-[680px] mx-auto no-print pointer-events-none">
    <nav aria-label="Navigasi utama" className="clay-card relative h-[72px] rounded-[28px] flex items-center justify-between px-4 sm:px-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-lg pointer-events-auto transition-colors duration-200">
      {/* 1. Grup Kiri: Dashboard */}
      <div className="flex items-center gap-0.5 sm:gap-2">
        {/* Tombol Dashboard */}
        <button
          type="button"
          onClick={() => onChangeTab('dashboard')}
          aria-current={activeTab === 'dashboard' ? 'page' : undefined}
          className={`flex min-w-[50px] sm:min-w-[64px] flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
            activeTab === 'dashboard' 
              ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' 
              : 'text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-300 font-semibold'
          }`}
        >
          <span className={`p-1.5 rounded-xl transition-all ${activeTab === 'dashboard' ? 'clay-pill-active text-[#4f46e5] dark:text-white' : ''}`}>
            <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5" />
          </span>
          <span className="text-[8.5px] sm:text-[10px] uppercase tracking-wider">Dashboard</span>
        </button>
      </div>

      {/* 2. Tombol Plus (Tengah Melayang) */}
      <button
        type="button"
        onClick={onOpenManual}
        aria-label="Input pesanan manual"
        title="Input pesanan manual"
        className="absolute left-1/2 -top-5 -translate-x-1/2 flex h-16 w-16 items-center justify-center rounded-[20px] bg-indigo-600 text-white shadow-[0_8px_25px_rgba(79,70,229,0.45)] ring-4 ring-white dark:ring-slate-900 transition-transform hover:scale-105 active:scale-95 cursor-pointer z-10"
      >
        <Plus className="h-9 w-9 stroke-[2.7]" />
      </button>

      {/* 3. Grup Kanan: PEMBELIAN & PENGELUARAN */}
      <div className="flex items-center gap-0.5 sm:gap-2">
        {/* Tombol Pembelian */}
        <button
          type="button"
          onClick={() => onChangeTab('monitoring_pemasok')}
          aria-current={activeTab === 'monitoring_pemasok' ? 'page' : undefined}
          className={`flex min-w-[50px] sm:min-w-[64px] flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
            activeTab === 'monitoring_pemasok' 
              ? 'text-rose-600 dark:text-rose-400 font-extrabold' 
              : 'text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-300 font-semibold'
          }`}
          title="Monitoring Pengeluaran Pembelian ke Pemasok"
        >
          <span className={`p-1.5 rounded-xl transition-all ${activeTab === 'monitoring_pemasok' ? 'clay-pill-active text-rose-600 dark:text-rose-400' : ''}`}>
            <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
          </span>
          <span className="text-[8.5px] sm:text-[10px] uppercase tracking-wider font-extrabold">PEMBELIAN</span>
        </button>

        {/* Tombol Pengeluaran */}
        <button
          type="button"
          onClick={() => onChangeTab('pengeluaran')}
          aria-current={activeTab === 'pengeluaran' ? 'page' : undefined}
          className={`flex min-w-[50px] sm:min-w-[64px] flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
            activeTab === 'pengeluaran' 
              ? 'text-amber-600 dark:text-amber-400 font-extrabold' 
              : 'text-slate-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-300 font-semibold'
          }`}
          title="Pengeluaran Operasional (BBM, Gaji, Listrik, Sewa, dll)"
        >
          <span className={`p-1.5 rounded-xl transition-all ${activeTab === 'pengeluaran' ? 'clay-pill-active text-amber-600 dark:text-amber-400' : ''}`}>
            <Banknote className="w-4 h-4 sm:w-5 sm:h-5" />
          </span>
          <span className="text-[8.5px] sm:text-[10px] uppercase tracking-wider font-extrabold">PENGELUARAN</span>
        </button>
      </div>
    </nav>
  </div>
);

import React from 'react';
import { LayoutDashboard, SquarePlus, Wallet, Banknote } from 'lucide-react';

export type TabType = 'dashboard' | 'monitoring_pemasok' | 'pengeluaran' | 'pengiriman';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  onOpenManual: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab, onOpenManual }) => (
  <div className="fixed bottom-3 sm:bottom-4 md:bottom-5 left-0 right-0 z-30 px-3 sm:px-4 max-w-[480px] sm:max-w-[520px] mx-auto no-print pointer-events-none">
    <nav
      aria-label="Navigasi utama"
      className="relative h-[62px] sm:h-[66px] rounded-full grid grid-cols-4 items-center px-2 sm:px-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-[0_8px_30px_rgba(15,23,42,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] pointer-events-auto transition-all duration-200"
    >
      {/* 1. Dashboard */}
      <button
        type="button"
        onClick={() => onChangeTab('dashboard')}
        aria-current={activeTab === 'dashboard' ? 'page' : undefined}
        className={`group flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-2xl transition-all cursor-pointer ${
          activeTab === 'dashboard'
            ? 'text-indigo-600 dark:text-indigo-400 font-extrabold'
            : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-semibold'
        }`}
      >
        <div className="relative flex items-center justify-center">
          <LayoutDashboard className={`w-5 h-5 transition-transform group-hover:scale-105 ${activeTab === 'dashboard' ? 'stroke-[2.3]' : 'stroke-[1.8]'}`} />
        </div>
        <span className="text-[8.5px] sm:text-[9.5px] uppercase tracking-wider">Dashboard</span>
        <span
          className={`w-3.5 h-0.5 rounded-full transition-all ${
            activeTab === 'dashboard' ? 'bg-indigo-600 dark:bg-indigo-400' : 'bg-transparent'
          }`}
        />
      </button>

      {/* 2. Tombol Tambah / Input Pesanan (Flat, sejajar dengan icon lainnya) */}
      <button
        type="button"
        onClick={onOpenManual}
        aria-label="Input pesanan manual"
        title="Input pesanan manual"
        className="group flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 font-semibold transition-all cursor-pointer active:scale-95"
      >
        <div className="relative flex items-center justify-center">
          <SquarePlus className="w-5 h-5 stroke-[1.8] group-hover:stroke-[2.2] transition-all group-hover:scale-105" />
        </div>
        <span className="text-[8.5px] sm:text-[9.5px] uppercase tracking-wider font-extrabold">TAMBAH</span>
        <span className="w-3.5 h-0.5 rounded-full bg-transparent" />
      </button>

      {/* 3. Pembelian */}
      <button
        type="button"
        onClick={() => onChangeTab('monitoring_pemasok')}
        aria-current={activeTab === 'monitoring_pemasok' ? 'page' : undefined}
        className={`group flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-2xl transition-all cursor-pointer ${
          activeTab === 'monitoring_pemasok'
            ? 'text-rose-600 dark:text-rose-400 font-extrabold'
            : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-semibold'
        }`}
        title="Monitoring Pengeluaran Pembelian ke Pemasok"
      >
        <div className="relative flex items-center justify-center">
          <Wallet className={`w-5 h-5 transition-transform group-hover:scale-105 ${activeTab === 'monitoring_pemasok' ? 'stroke-[2.3]' : 'stroke-[1.8]'}`} />
        </div>
        <span className="text-[8.5px] sm:text-[9.5px] uppercase tracking-wider font-extrabold">PEMBELIAN</span>
        <span
          className={`w-3.5 h-0.5 rounded-full transition-all ${
            activeTab === 'monitoring_pemasok' ? 'bg-rose-600 dark:bg-rose-400' : 'bg-transparent'
          }`}
        />
      </button>

      {/* 4. Pengeluaran */}
      <button
        type="button"
        onClick={() => onChangeTab('pengeluaran')}
        aria-current={activeTab === 'pengeluaran' ? 'page' : undefined}
        className={`group flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-2xl transition-all cursor-pointer ${
          activeTab === 'pengeluaran'
            ? 'text-amber-600 dark:text-amber-400 font-extrabold'
            : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-semibold'
        }`}
        title="Pengeluaran Operasional (BBM, Gaji, Listrik, Sewa, dll)"
      >
        <div className="relative flex items-center justify-center">
          <Banknote className={`w-5 h-5 transition-transform group-hover:scale-105 ${activeTab === 'pengeluaran' ? 'stroke-[2.3]' : 'stroke-[1.8]'}`} />
        </div>
        <span className="text-[8.5px] sm:text-[9.5px] uppercase tracking-wider font-extrabold">PENGELUARAN</span>
        <span
          className={`w-3.5 h-0.5 rounded-full transition-all ${
            activeTab === 'pengeluaran' ? 'bg-amber-600 dark:bg-amber-400' : 'bg-transparent'
          }`}
        />
      </button>
    </nav>
  </div>
);

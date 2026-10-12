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

      {/* 2. Pembelian */}
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

      {/* 3. Pengeluaran */}
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

      {/* 4. Tombol Input Pesanan (Warna ungu berbeda dengan fungsi lainnya, di paling kanan) */}
      <button
        type="button"
        onClick={onOpenManual}
        aria-label="Input pesanan manual"
        title="Input pesanan manual"
        className="group flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-2xl text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold transition-all cursor-pointer active:scale-95"
      >
        <div className="relative flex items-center justify-center w-7 h-7 rounded-xl bg-purple-100 dark:bg-purple-950/80 border border-purple-200/90 dark:border-purple-800/60 shadow-2xs group-hover:bg-purple-200 dark:group-hover:bg-purple-900/80 transition-colors">
          <SquarePlus className="w-4 h-4 stroke-[2.2] text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform" />
        </div>
        <span className="text-[8.5px] sm:text-[9.5px] uppercase tracking-wider font-extrabold text-purple-700 dark:text-purple-300">INPUT</span>
        <span className="w-3.5 h-0.5 rounded-full bg-purple-600 dark:bg-purple-400 opacity-60" />
      </button>
    </nav>
  </div>
);

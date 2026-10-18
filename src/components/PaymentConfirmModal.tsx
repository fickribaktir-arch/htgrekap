import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  X, 
  Store, 
  Utensils, 
  Truck,
  Package,
  FileText
} from 'lucide-react';
import { PaymentStatus } from '../types';
import { formatRupiah } from '../lib/formatters';

export interface PaymentConfirmDetails {
  title?: string;
  targetName: string; // e.g. "Dapur Kedayunan (HTG)" or "Pemasok Ayam Jaya"
  targetType?: 'customer' | 'supplier' | 'order';
  invoiceNumber?: string;
  notaId?: string;
  itemCount: number;
  totalNominal?: number;
  date?: string;
}

export interface PaymentConfirmModalProps {
  isOpen: boolean;
  currentStatus: PaymentStatus;
  nextStatus: PaymentStatus;
  details: PaymentConfirmDetails;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export const PaymentConfirmModal: React.FC<PaymentConfirmModalProps> = ({
  isOpen,
  currentStatus,
  nextStatus,
  details,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  // Lock body scrolling when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isLoading, onCancel]);

  if (typeof document === 'undefined' || !isOpen) return null;

  const isChangingToPaid = nextStatus === 'PAID';

  const title = isChangingToPaid
    ? (details.targetType === 'supplier' ? 'Konfirmasi Pembayaran Pemasok' : 'Konfirmasi Pelunasan (PAID)')
    : (details.targetType === 'supplier' ? 'Konfirmasi Batal Bayar Pemasok' : 'Konfirmasi Belum Lunas (UNPAID)');

  const subtitle = isChangingToPaid
    ? 'Apakah Anda yakin ingin menandai status pembayaran ini menjadi LUNAS (PAID)?'
    : 'Apakah Anda yakin ingin mengembalikan status pembayaran ini menjadi BELUM DIBAYAR (UNPAID)?';

  const confirmBtnLabel = isChangingToPaid ? 'Ya, Tandai PAID' : 'Ya, Ubah ke UNPAID';

  return createPortal(
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs no-print overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-confirm-title"
        data-testid="payment-confirm-modal"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isLoading) {
            onCancel();
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm sm:max-w-md p-4 sm:p-5 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl relative my-auto select-none"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            data-testid="payment-cancel-x-btn"
            aria-label="Tutup dialog"
            className="absolute top-3.5 right-3.5 p-1.5 rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header icon and title */}
          <div className="flex items-start gap-3 pr-6">
            <div 
              className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 border shadow-xs ${
                isChangingToPaid 
                  ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' 
                  : 'bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
              }`}
            >
              {isChangingToPaid ? (
                <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
              ) : (
                <AlertCircle className="w-6 h-6 stroke-[2.2]" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 id="payment-confirm-title" className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 leading-tight">
                {title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed mt-1">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Visual Status Transition Badge */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 sm:p-3 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center gap-2.5 text-xs font-black">
            <span
              className={`px-2.5 py-1 rounded-md border text-[11px] font-black tracking-wider ${
                currentStatus === 'PAID'
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                  : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700'
              }`}
            >
              {currentStatus}
            </span>
            <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
            <span
              className={`px-2.5 py-1 rounded-md border text-[11px] font-black tracking-wider animate-pulse ${
                nextStatus === 'PAID'
                  ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                  : 'bg-rose-600 text-white border-rose-700 shadow-xs'
              }`}
            >
              {nextStatus}
            </span>
          </div>

          {/* Transaction Summary Card */}
          <div className="bg-slate-50/80 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-200/60 dark:border-slate-800/70 space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 min-w-0">
                {details.targetType === 'supplier' ? (
                  <Truck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                ) : (
                  <Utensils className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                )}
                <span className="font-bold text-slate-800 dark:text-slate-100 truncate">
                  {details.targetName}
                </span>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-[10.5px] font-semibold text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700 shrink-0">
                <Package className="w-3 h-3 text-slate-400" />
                {details.itemCount} Item
              </span>
            </div>

            {(details.invoiceNumber || details.notaId) && (
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-700/50 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3 text-slate-400" />
                  {details.invoiceNumber ? 'No. Invoice:' : 'Nota ID:'}
                </span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                  {details.invoiceNumber || details.notaId}
                </span>
              </div>
            )}

            {details.totalNominal !== undefined && details.totalNominal > 0 && (
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">
                  Total Nilai:
                </span>
                <span className="font-nominal font-black text-slate-900 dark:text-slate-100 text-sm">
                  {formatRupiah(details.totalNominal)}
                </span>
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-400 dark:text-slate-500 italic text-center">
            Peringatan: Konfirmasi ini ditambahkan untuk mencegah kesalahan pencet status pembayaran.
          </p>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              data-testid="payment-cancel-btn"
              className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              data-testid="payment-confirm-btn"
              className={`px-4 py-2 text-xs font-bold text-white rounded-xl transition-all cursor-pointer active:scale-95 disabled:opacity-50 flex items-center gap-1.5 shadow-sm ${
                isChangingToPaid
                  ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-emerald-600/30'
                  : 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-rose-600/30'
              }`}
            >
              {isLoading && (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>{confirmBtnLabel}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

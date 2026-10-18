import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'success' | 'info';
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title = 'Konfirmasi Hapus',
  message,
  confirmLabel = 'Ya, Hapus',
  cancelLabel = 'Batal',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
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

  const isSuccess = variant === 'success';
  const isWarning = variant === 'warning';
  const isInfo = variant === 'info';

  const iconContainerClass = isSuccess
    ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
    : isWarning
    ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
    : isInfo
    ? 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
    : 'bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800';

  const confirmBtnClass = isSuccess
    ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-emerald-600/30'
    : isWarning
    ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 shadow-amber-600/30'
    : isInfo
    ? 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-indigo-600/30'
    : 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-rose-600/30';

  return createPortal(
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs no-print overflow-y-auto"
        role="dialog"
        aria-modal="true"
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
          transition={{ duration: 0.15 }}
          className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm p-5 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl relative my-auto select-none"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            aria-label="Tutup dialog"
            className="absolute top-3 right-3 p-1 rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 border shadow-xs ${iconContainerClass}`}>
              {isSuccess ? (
                <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
              ) : isInfo ? (
                <Info className="w-5 h-5 stroke-[2.2]" />
              ) : (
                <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">{title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-snug mt-0.5">
                {message}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-4 py-2 text-xs font-bold text-white rounded-xl transition-all cursor-pointer active:scale-95 disabled:opacity-50 flex items-center gap-1.5 shadow-sm ${confirmBtnClass}`}
            >
              {isLoading && (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>{confirmLabel}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

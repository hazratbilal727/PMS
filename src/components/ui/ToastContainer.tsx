import React from 'react';
import { CheckCircle2, Info, X, AlertCircle } from 'lucide-react';
import { usePMS } from '../../services/pmsStore';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = usePMS();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 no-print" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          {t.type === 'success' && <CheckCircle2 className="h-[18px] w-[18px] shrink-0 text-emerald-600 dark:text-emerald-400" />}
          {t.type === 'error' && <AlertCircle className="h-[18px] w-[18px] shrink-0 text-red-600 dark:text-red-400" />}
          {t.type === 'info' && <Info className="h-[18px] w-[18px] shrink-0 text-teal-600 dark:text-teal-400" />}
          <span>{t.title}</span>
          <button
            type="button"
            onClick={() => dismissToast(t.id)}
            aria-label="Dismiss notification"
            className="ml-2 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

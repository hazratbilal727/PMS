import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export type KpiTone = 'teal' | 'emerald' | 'amber' | 'red' | 'slate';

interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: KpiTone;
  onClick?: () => void;
  loading?: boolean;
}

const iconToneClasses: Record<KpiTone, string> = {
  teal: 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-400',
  emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400',
  red: 'bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400',
  slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

const subToneClasses: Record<KpiTone, string> = {
  teal: 'text-slate-500 dark:text-slate-400',
  emerald: 'text-emerald-700 dark:text-emerald-400',
  amber: 'text-amber-700 dark:text-amber-400',
  red: 'text-red-600 dark:text-red-400',
  slate: 'text-slate-500 dark:text-slate-400',
};

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  subtitle,
  icon: Icon,
  tone = 'teal',
  onClick,
  loading = false,
}) => {
  const baseClass =
    'group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 text-left shadow-[0_1px_3px_rgba(15,23,42,0.03)] transition-all dark:border-slate-800 dark:bg-slate-900';

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</span>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconToneClasses[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        {loading ? (
          <div className="h-8 w-32 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
        ) : (
          <span className="font-mono text-2xl sm:text-[28px] font-bold tracking-tight text-slate-900 tabular-nums dark:text-slate-100">
            {value}
          </span>
        )}
        {onClick && (
          <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-teal-600 dark:text-slate-600 dark:group-hover:text-teal-400" />
        )}
      </div>

      {subtitle && (
        <p className={`mt-1.5 text-[13px] ${subToneClasses[tone]}`}>{subtitle}</p>
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${baseClass} hover:border-teal-500/60 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-teal-600 dark:hover:border-teal-500/50`}
      >
        {content}
      </button>
    );
  }

  return <div className={baseClass}>{content}</div>;
};

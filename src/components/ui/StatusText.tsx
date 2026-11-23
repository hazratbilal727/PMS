import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

export type SemanticTone = 'ok' | 'warning' | 'critical' | 'caution' | 'neutral';

interface StatusTextProps {
  label: string;
  tone: SemanticTone;
  showIcon?: boolean;
}

const toneClasses: Record<SemanticTone, string> = {
  ok: 'text-emerald-700 dark:text-emerald-400',
  warning: 'text-amber-700 dark:text-amber-400',
  caution: 'text-amber-600 dark:text-amber-300',
  critical: 'text-red-700 dark:text-red-400',
  neutral: 'text-slate-600 dark:text-slate-400',
};

export const StatusText: React.FC<StatusTextProps> = ({ label, tone, showIcon = true }) => {
  const Icon =
    tone === 'ok'
      ? CheckCircle2
      : tone === 'critical'
      ? AlertCircle
      : tone === 'warning'
      ? AlertTriangle
      : Clock;

  return (
    <span className={`inline-flex items-center gap-1.5 text-[13px] font-medium whitespace-nowrap ${toneClasses[tone]}`}>
      {showIcon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
      <span>{label}</span>
    </span>
  );
};

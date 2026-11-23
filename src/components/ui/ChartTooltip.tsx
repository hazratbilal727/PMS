import React from 'react';

interface TooltipPayloadEntry {
  name?: string;
  value?: number | string;
  color?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
  valueFormatter?: (val: number | string, name?: string) => string;
}

export const ChartTooltip: React.FC<ChartTooltipProps> = ({
  active,
  payload,
  label,
  valueFormatter,
}) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] shadow-md dark:border-slate-700 dark:bg-slate-900">
      {label && (
        <p className="mb-1.5 font-semibold text-slate-900 dark:text-slate-100">{label}</p>
      )}
      <div className="space-y-1">
        {payload.map((entry, idx) => {
          const val = entry.value ?? 0;
          const formatted = valueFormatter ? valueFormatter(val, entry.name) : String(val);
          return (
            <div key={idx} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <span
                  className="h-2.5 w-2.5 rounded-xs shrink-0"
                  style={{ backgroundColor: entry.color || '#0F766E' }}
                />
                <span>{entry.name}</span>
              </span>
              <span className="font-mono font-semibold text-slate-900 tabular-nums dark:text-slate-100">
                {formatted}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

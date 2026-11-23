import React, { useMemo, useState } from 'react';
import { Download, RotateCcw, Trash2 } from 'lucide-react';
import { downloadCSV, formatCurrency, formatDate, getExpiryStatus } from '../lib/utils';
import { usePMS } from '../services/pmsStore';
import type { Medicine } from '../types';
import { Modal } from '../components/ui/Modal';
import { StatusText } from '../components/ui/StatusText';

export const ExpiryPage: React.FC = () => {
  const { medicines, settings, removeExpiredBatch } = usePMS();
  const [period, setPeriod] = useState<'all' | 'expired' | '30d' | '90d' | 'valid'>('all');

  const [actionTarget, setActionTarget] = useState<{
    med: Medicine;
    mode: 'Expired Removal' | 'Supplier Return';
  } | null>(null);
  const [disposeQty, setDisposeQty] = useState(0);
  const [disposeNotes, setDisposeNotes] = useState('');

  const summary = useMemo(() => {
    let expired = 0;
    let within30 = 0;
    let within90 = 0;
    let atRiskValue = 0;
    medicines.forEach((m) => {
      const d = getExpiryStatus(m.expiryDate).daysLeft;
      if (d <= 0) {
        expired++;
        atRiskValue += m.availableQuantity * m.purchasePrice;
      } else if (d <= 30) {
        within30++;
        atRiskValue += m.availableQuantity * m.purchasePrice;
      } else if (d <= 90) {
        within90++;
      }
    });
    return { expired, within30, within90, atRiskValue };
  }, [medicines]);

  const filtered = useMemo(() => {
    return [...medicines]
      .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))
      .filter((m) => {
        const d = getExpiryStatus(m.expiryDate).daysLeft;
        if (period === 'expired') return d <= 0;
        if (period === '30d') return d > 0 && d <= 30;
        if (period === '90d') return d > 0 && d <= 90;
        if (period === 'valid') return d > 90;
        return true;
      });
  }, [medicines, period]);

  const openDisposition = (med: Medicine, mode: 'Expired Removal' | 'Supplier Return') => {
    setActionTarget({ med, mode });
    setDisposeQty(med.availableQuantity);
    setDisposeNotes(
      mode === 'Supplier Return'
        ? `Returning batch ${med.batchNumber} to ${med.supplierName} for credit note`
        : `Quarantined & removed expired batch ${med.batchNumber}`
    );
  };

  const handleConfirmDisposition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionTarget || disposeQty <= 0) return;
    removeExpiredBatch(actionTarget.med.id, disposeQty, actionTarget.mode, disposeNotes);
    setActionTarget(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
            Expiry Management & Batch Control
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Monitor expired inventory, near-expiry batches, quarantine disposal, and supplier return workflows
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            downloadCSV(
              'expiry-audit-report.csv',
              ['Code', 'Medicine', 'Batch', 'Supplier', 'Qty', 'Expiry Date', 'Days Left', 'Status'],
              filtered.map((m) => {
                const st = getExpiryStatus(m.expiryDate);
                return [m.medicineCode, m.name, m.batchNumber, m.supplierName, m.availableQuantity, m.expiryDate, st.daysLeft, st.label];
              })
            )
          }
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export Expiry Report</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs text-slate-500">Already Expired</p>
          <p className="mt-1 font-mono text-2xl font-bold text-red-600 tabular-nums dark:text-red-400">
            {summary.expired}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Blocked from POS dispensing</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs text-slate-500">Expiring Within 30 Days</p>
          <p className="mt-1 font-mono text-2xl font-bold text-amber-700 tabular-nums dark:text-amber-400">
            {summary.within30}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Immediate return / clearance priority</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs text-slate-500">Expiring 31–90 Days</p>
          <p className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums dark:text-slate-100">
            {summary.within90}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Monitor FEFO dispensing</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs text-slate-500">At-Risk Cost Exposure</p>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums">
            {formatCurrency(summary.atRiskValue, settings.currencySymbol)}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Expired + 30-day batches</p>
        </div>
      </div>

      {/* Period Filter */}
      <div className="inline-flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
        {(
          [
            { id: 'all', label: 'All Batches' },
            { id: 'expired', label: `Expired (${summary.expired})` },
            { id: '30d', label: `Within 30 Days (${summary.within30})` },
            { id: '90d', label: 'Within 90 Days' },
            { id: 'valid', label: 'Safe (> 90 Days)' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setPeriod(t.id)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
              period === t.id
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-slate-100'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
                <th className="px-4 py-3 font-medium">Medicine</th>
                <th className="px-3 py-3 font-medium">Batch Number</th>
                <th className="px-3 py-3 font-medium">Supplier</th>
                <th className="px-3 py-3 font-medium">Expiry Date</th>
                <th className="px-3 py-3 text-right font-medium">Remaining Qty</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Workflow Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((m) => {
                const exp = getExpiryStatus(m.expiryDate);
                return (
                  <tr key={m.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{m.name}</p>
                      <p className="font-mono text-[11px] text-slate-400">{m.medicineCode}</p>
                    </td>
                    <td className="px-3 py-3 font-mono font-medium">{m.batchNumber}</td>
                    <td className="px-3 py-3 text-slate-600 dark:text-slate-400">{m.supplierName}</td>
                    <td className="px-3 py-3 font-mono">
                      <p>{formatDate(m.expiryDate)}</p>
                      <p className="text-[11px] text-slate-400">
                        {exp.daysLeft <= 0 ? `${Math.abs(exp.daysLeft)}d overdue` : `${exp.daysLeft}d remaining`}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-semibold tabular-nums">{m.availableQuantity}</td>
                    <td className="px-3 py-3">
                      <StatusText
                        label={exp.label}
                        tone={
                          exp.severity === 'critical'
                            ? 'critical'
                            : exp.severity === 'warning' || exp.severity === 'caution'
                            ? 'warning'
                            : 'ok'
                        }
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {m.availableQuantity > 0 ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openDisposition(m, 'Supplier Return')}
                            className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                          >
                            <RotateCcw className="h-3 w-3" />
                            <span>Return</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openDisposition(m, 'Expired Removal')}
                            className="inline-flex items-center gap-1 rounded border border-red-200 px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Remove</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">Cleared (0 qty)</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disposition Modal */}
      <Modal
        open={Boolean(actionTarget)}
        onClose={() => setActionTarget(null)}
        title={actionTarget?.mode === 'Supplier Return' ? 'Return Batch to Supplier' : 'Quarantine & Remove Expired Stock'}
        subtitle={actionTarget ? `${actionTarget.med.name} · Batch ${actionTarget.med.batchNumber}` : ''}
        size="sm"
      >
        <form onSubmit={handleConfirmDisposition} className="space-y-4 text-xs">
          <div>
            <label className="mb-1 block font-medium">Quantity to Process (Max: {actionTarget?.med.availableQuantity})</label>
            <input
              type="number"
              min={1}
              max={actionTarget?.med.availableQuantity ?? 1}
              value={disposeQty}
              onChange={(e) => setDisposeQty(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="mb-1 block font-medium">Audit Notes / Credit Reference</label>
            <textarea
              rows={2}
              value={disposeNotes}
              onChange={(e) => setDisposeNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setActionTarget(null)}
              className="rounded-lg border border-slate-200 px-4 py-2 font-medium dark:border-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-teal-700 px-4 py-2 font-medium text-white hover:bg-teal-800"
            >
              Confirm {actionTarget?.mode}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

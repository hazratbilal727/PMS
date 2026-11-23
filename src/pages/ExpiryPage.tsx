import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpDown,
  CalendarClock,
  CalendarX2,
  Download,
  RotateCcw,
  ShieldAlert,
  Trash2,
  Wallet,
} from 'lucide-react';
import { downloadCSV, formatCurrency, formatDate, getExpiryStatus } from '../lib/utils';
import { usePMS } from '../services/pmsStore';
import type { Medicine } from '../types';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { KpiCard } from '../components/ui/KpiCard';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { PaginationBar } from '../components/ui/PaginationBar';
import { SearchInput } from '../components/ui/SearchInput';
import { StatusText } from '../components/ui/StatusText';

export const ExpiryPage: React.FC = () => {
  const { medicines, settings, removeExpiredBatch } = usePMS();
  const [period, setPeriod] = useState<'all' | 'expired' | '30d' | '90d' | 'valid'>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'expiryDate' | 'availableQuantity'>('expiryDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [actionTarget, setActionTarget] = useState<{
    med: Medicine;
    mode: 'Expired Removal' | 'Supplier Return';
  } | null>(null);
  const [disposeQty, setDisposeQty] = useState(0);
  const [disposeNotes, setDisposeNotes] = useState('');
  const [quarantineAllOpen, setQuarantineAllOpen] = useState(false);

  const summary = useMemo(() => {
    let expired = 0;
    let expiredWithStock = 0;
    let within30 = 0;
    let within90 = 0;
    let atRiskValue = 0;
    medicines.forEach((m) => {
      const d = getExpiryStatus(m.expiryDate).daysLeft;
      if (d <= 0) {
        expired++;
        if (m.availableQuantity > 0) expiredWithStock++;
        atRiskValue += m.availableQuantity * m.purchasePrice;
      } else if (d <= 30) {
        within30++;
        atRiskValue += m.availableQuantity * m.purchasePrice;
      } else if (d <= 90) {
        within90++;
      }
    });
    return { expired, expiredWithStock, within30, within90, atRiskValue };
  }, [medicines]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = medicines.filter((m) => {
      const d = getExpiryStatus(m.expiryDate).daysLeft;
      if (period === 'expired' && d > 0) return false;
      if (period === '30d' && !(d > 0 && d <= 30)) return false;
      if (period === '90d' && !(d > 0 && d <= 90)) return false;
      if (period === 'valid' && d <= 90) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.medicineCode.toLowerCase().includes(q) ||
        m.batchNumber.toLowerCase().includes(q) ||
        m.supplierName.toLowerCase().includes(q)
      );
    });
    const factor = sortDir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name) * factor;
      if (sortBy === 'availableQuantity') return (a.availableQuantity - b.availableQuantity) * factor;
      return a.expiryDate.localeCompare(b.expiryDate) * factor;
    });
  }, [medicines, period, search, sortBy, sortDir]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(col);
      setSortDir('asc');
    }
    setPage(1);
  };

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

  const handleQuarantineAllExpired = () => {
    const expiredMeds = medicines.filter(
      (m) => getExpiryStatus(m.expiryDate).daysLeft <= 0 && m.availableQuantity > 0
    );
    expiredMeds.forEach((m) => {
      removeExpiredBatch(
        m.id,
        m.availableQuantity,
        'Expired Removal',
        `Bulk quarantine clearance for expired batch ${m.batchNumber}`
      );
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expiry Management & Batch Control"
        description="Monitor expired inventory, near-expiry batches, quarantine disposal, and supplier return workflows"
        actions={
          <>
            {summary.expiredWithStock > 0 && (
              <button
                type="button"
                onClick={() => setQuarantineAllOpen(true)}
                className="pms-btn-danger"
              >
                <ShieldAlert className="h-4 w-4" />
                <span>Quarantine All Expired ({summary.expiredWithStock})</span>
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                downloadCSV(
                  'expiry-audit-report.csv',
                  ['Code', 'Medicine', 'Batch', 'Supplier', 'Qty', 'Expiry Date', 'Days Left', 'Status'],
                  filtered.map((m) => {
                    const st = getExpiryStatus(m.expiryDate);
                    return [
                      m.medicineCode,
                      m.name,
                      m.batchNumber,
                      m.supplierName,
                      m.availableQuantity,
                      m.expiryDate,
                      st.daysLeft,
                      st.label,
                    ];
                  })
                )
              }
              className="pms-btn-secondary"
            >
              <Download className="h-4 w-4" />
              <span>Export Expiry Report</span>
            </button>
          </>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Already Expired"
          value={summary.expired}
          subtitle="Blocked from POS dispensing"
          icon={CalendarX2}
          tone={summary.expired > 0 ? 'red' : 'emerald'}
        />
        <KpiCard
          label="Expiring Within 30 Days"
          value={summary.within30}
          subtitle="Immediate return / clearance priority"
          icon={AlertTriangle}
          tone={summary.within30 > 0 ? 'amber' : 'emerald'}
        />
        <KpiCard
          label="Expiring 31–90 Days"
          value={summary.within90}
          subtitle="Monitor FEFO dispensing"
          icon={CalendarClock}
          tone="slate"
        />
        <KpiCard
          label="At-Risk Cost Exposure"
          value={formatCurrency(summary.atRiskValue, settings.currencySymbol)}
          subtitle="Expired + 30-day batches"
          icon={Wallet}
          tone="amber"
        />
      </div>

      {/* Period Filter & Search */}
      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
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
              onClick={() => {
                setPeriod(t.id);
                setPage(1);
              }}
              className={`rounded-lg px-3.5 py-2 text-[13px] font-medium whitespace-nowrap transition-colors ${
                period === t.id
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <SearchInput
          value={search}
          onValueChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search batch, medicine or supplier..."
          containerClassName="w-full sm:w-80"
        />
      </div>

      {/* Table */}
      <div className="pms-card overflow-hidden">
        {paged.length === 0 ? (
          <EmptyState
            icon={CalendarX2}
            title="No batches match this filter"
            description="Adjust your expiry window tab or clear your search query to view batches."
            actionLabel="Reset Filters"
            onAction={() => {
              setPeriod('all');
              setSearch('');
              setPage(1);
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                  <th className="px-5 py-3.5">
                    <button
                      type="button"
                      onClick={() => toggleSort('name')}
                      className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-100"
                    >
                      <span>Medicine</span>
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="px-4 py-3.5">Batch Number</th>
                  <th className="px-4 py-3.5">Supplier</th>
                  <th className="px-4 py-3.5">
                    <button
                      type="button"
                      onClick={() => toggleSort('expiryDate')}
                      className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-100"
                    >
                      <span>Expiry Date</span>
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="px-4 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => toggleSort('availableQuantity')}
                      className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-100"
                    >
                      <span>Remaining Qty</span>
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Workflow Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paged.map((m) => {
                  const exp = getExpiryStatus(m.expiryDate);
                  return (
                    <tr key={m.id} className="transition-colors hover:bg-slate-50/75 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{m.name}</p>
                        <p className="font-mono text-xs text-slate-400">{m.medicineCode}</p>
                      </td>
                      <td className="px-4 py-3.5 font-mono font-medium text-slate-800 dark:text-slate-200">
                        {m.batchNumber}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">{m.supplierName}</td>
                      <td className="px-4 py-3.5 font-mono">
                        <p className="text-slate-800 dark:text-slate-200">{formatDate(m.expiryDate)}</p>
                        <p className="text-xs text-slate-400">
                          {exp.daysLeft <= 0 ? `${Math.abs(exp.daysLeft)}d overdue` : `${exp.daysLeft}d remaining`}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-semibold tabular-nums">
                        {m.availableQuantity}
                      </td>
                      <td className="px-4 py-3.5">
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
                      <td className="px-5 py-3.5 text-right">
                        {m.availableQuantity > 0 ? (
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openDisposition(m, 'Supplier Return')}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              <span>Return</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openDisposition(m, 'Expired Removal')}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Remove</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Cleared (0 qty)</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <PaginationBar page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
      </div>

      {/* Disposition Modal */}
      <Modal
        open={Boolean(actionTarget)}
        onClose={() => setActionTarget(null)}
        title={actionTarget?.mode === 'Supplier Return' ? 'Return Batch to Supplier' : 'Quarantine & Remove Expired Stock'}
        subtitle={actionTarget ? `${actionTarget.med.name} · Batch ${actionTarget.med.batchNumber}` : ''}
        size="sm"
      >
        <form onSubmit={handleConfirmDisposition} className="space-y-4">
          <div>
            <label className="pms-label">
              Quantity to Process (Max: {actionTarget?.med.availableQuantity})
            </label>
            <input
              type="number"
              min={1}
              max={actionTarget?.med.availableQuantity ?? 1}
              value={disposeQty}
              onChange={(e) => setDisposeQty(Number(e.target.value))}
              className="pms-input font-mono"
            />
          </div>
          <div>
            <label className="pms-label">Audit Notes / Credit Reference</label>
            <textarea
              rows={2}
              value={disposeNotes}
              onChange={(e) => setDisposeNotes(e.target.value)}
              className="pms-textarea"
            />
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <button type="button" onClick={() => setActionTarget(null)} className="pms-btn-secondary">
              Cancel
            </button>
            <button type="submit" className="pms-btn-primary">
              Confirm {actionTarget?.mode}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={quarantineAllOpen}
        onClose={() => setQuarantineAllOpen(false)}
        onConfirm={handleQuarantineAllExpired}
        title="Quarantine All Expired Stock"
        message={`Write off remaining units across ${summary.expiredWithStock} expired batch(es) and record Expired Removal audit logs? This prevents accidental dispensing.`}
        confirmLabel="Quarantine All"
        tone="danger"
      />
    </div>
  );
};

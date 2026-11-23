import React, { useMemo, useState } from 'react';
import { AlertTriangle, ArrowUpDown, Ban, PackageCheck, Plus, Truck } from 'lucide-react';
import { formatCurrency, getStockStatus } from '../lib/utils';
import { usePMS } from '../services/pmsStore';
import { EmptyState } from '../components/ui/EmptyState';
import { KpiCard } from '../components/ui/KpiCard';
import { PageHeader } from '../components/ui/PageHeader';
import { PaginationBar } from '../components/ui/PaginationBar';
import { SearchInput } from '../components/ui/SearchInput';
import { StatusText } from '../components/ui/StatusText';

export const StockPage: React.FC = () => {
  const { medicines, settings, updateMedicine, adjustStock, triggerQuickAction } = usePMS();
  const [filter, setFilter] = useState<'all' | 'low' | 'healthy'>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'availableQuantity' | 'minimumStockLevel' | 'suggested'>('availableQuantity');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = medicines.filter((m) => {
      const isLow = m.availableQuantity <= m.minimumStockLevel;
      if (filter === 'low' && !isLow) return false;
      if (filter === 'healthy' && isLow) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.medicineCode.toLowerCase().includes(q) ||
        m.supplierName.toLowerCase().includes(q) ||
        (m.shelfLocation || '').toLowerCase().includes(q)
      );
    });
    const factor = sortDir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name) * factor;
      if (sortBy === 'availableQuantity') return (a.availableQuantity - b.availableQuantity) * factor;
      if (sortBy === 'minimumStockLevel') return (a.minimumStockLevel - b.minimumStockLevel) * factor;
      const sugA = Math.max(0, a.minimumStockLevel * 2 - a.availableQuantity);
      const sugB = Math.max(0, b.minimumStockLevel * 2 - b.availableQuantity);
      return (sugA - sugB) * factor;
    });
  }, [medicines, filter, search, sortBy, sortDir]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(col);
      setSortDir('asc');
    }
    setPage(1);
  };

  const lowCount = medicines.filter((m) => m.availableQuantity <= m.minimumStockLevel).length;
  const outCount = medicines.filter((m) => m.availableQuantity === 0).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Management & Reorder Planner"
        description="Monitor minimum threshold breaches, tune par levels, and replenish fast-moving stock"
        actions={
          <button
            type="button"
            onClick={() => triggerQuickAction('purchases', 'new-po')}
            className="pms-btn-primary"
          >
            <Truck className="h-4 w-4" />
            <span>Create Low-Stock PO</span>
          </button>
        }
      />

      {/* KPI Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label="Healthy Stock SKUs"
          value={medicines.length - lowCount}
          subtitle="Above minimum par level"
          icon={PackageCheck}
          tone="emerald"
        />
        <KpiCard
          label="Low Stock Alerts"
          value={lowCount}
          subtitle="Needs replenishment"
          icon={AlertTriangle}
          tone={lowCount > 0 ? 'amber' : 'emerald'}
        />
        <KpiCard
          label="Out of Stock SKUs"
          value={outCount}
          subtitle="Zero packs available"
          icon={Ban}
          tone={outCount > 0 ? 'red' : 'emerald'}
        />
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          {(
            [
              { id: 'all', label: `All SKUs (${medicines.length})` },
              { id: 'low', label: `Needs Reorder (${lowCount})` },
              { id: 'healthy', label: `Optimal (${medicines.length - lowCount})` },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setFilter(t.id);
                setPage(1);
              }}
              className={`rounded-lg px-3.5 py-2 text-[13px] font-medium whitespace-nowrap transition-colors ${
                filter === t.id
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
          placeholder="Search medicine, supplier or shelf..."
          containerClassName="w-full sm:w-80"
        />
      </div>

      {/* Table */}
      <div className="pms-card overflow-hidden">
        {paged.length === 0 ? (
          <EmptyState
            icon={PackageCheck}
            title="No SKUs match your stock filter"
            description="Try clearing your search query or switching to All SKUs."
            actionLabel="Reset Filters"
            onAction={() => {
              setSearch('');
              setFilter('all');
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
                  <th className="px-4 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => toggleSort('availableQuantity')}
                      className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-100"
                    >
                      <span>On Hand</span>
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="px-4 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => toggleSort('minimumStockLevel')}
                      className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-100"
                    >
                      <span>Min Level (Par)</span>
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="px-4 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => toggleSort('suggested')}
                      className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-100"
                    >
                      <span>Suggested Reorder</span>
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="px-4 py-3.5 text-right">Est. Restock Cost</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paged.map((m) => {
                  const st = getStockStatus(m.availableQuantity, m.minimumStockLevel);
                  const suggestedQty = Math.max(0, m.minimumStockLevel * 2 - m.availableQuantity);
                  return (
                    <tr key={m.id} className="transition-colors hover:bg-slate-50/75 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{m.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {m.supplierName} · {m.shelfLocation || 'Main Rack'}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-semibold text-slate-900 tabular-nums dark:text-slate-100">
                        {m.availableQuantity}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <input
                          type="number"
                          min={1}
                          value={m.minimumStockLevel}
                          onChange={(e) =>
                            updateMedicine(m.id, { minimumStockLevel: Math.max(1, Number(e.target.value)) })
                          }
                          aria-label={`Minimum stock for ${m.name}`}
                          className="h-9 w-20 rounded-lg border border-slate-200 px-2.5 text-right font-mono text-sm tabular-nums focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                        />
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        {suggestedQty > 0 ? `+${suggestedQty} packs` : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        {suggestedQty > 0
                          ? formatCurrency(suggestedQty * m.purchasePrice, settings.currencySymbol)
                          : '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusText label={st.label} tone={st.severity} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            adjustStock({
                              medicineId: m.id,
                              quantityChange: Math.max(10, suggestedQty),
                              type: 'Stock In',
                              reason: 'Quick shelf replenishment from Stock Planner',
                            })
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-teal-700 transition-colors hover:bg-teal-50 dark:border-slate-700 dark:text-teal-400 dark:hover:bg-teal-950/30"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Restock +{Math.max(10, suggestedQty)}</span>
                        </button>
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

      {lowCount === 0 && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
          <PackageCheck className="h-5 w-5" />
          <span>All medicines are currently above minimum stock thresholds.</span>
        </div>
      )}
    </div>
  );
};

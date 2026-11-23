import React, { useMemo, useState } from 'react';
import { PackageCheck, Plus, Truck } from 'lucide-react';
import { formatCurrency, getStockStatus } from '../lib/utils';
import { usePMS } from '../services/pmsStore';
import { StatusText } from '../components/ui/StatusText';

export const StockPage: React.FC = () => {
  const { medicines, settings, updateMedicine, adjustStock, setActiveRoute } = usePMS();
  const [filter, setFilter] = useState<'all' | 'low' | 'healthy'>('all');

  const filtered = useMemo(() => {
    return medicines.filter((m) => {
      const isLow = m.availableQuantity <= m.minimumStockLevel;
      if (filter === 'low') return isLow;
      if (filter === 'healthy') return !isLow;
      return true;
    });
  }, [medicines, filter]);

  const lowCount = medicines.filter((m) => m.availableQuantity <= m.minimumStockLevel).length;
  const outCount = medicines.filter((m) => m.availableQuantity === 0).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
            Stock Management & Reorder Planner
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Monitor minimum threshold breaches, tune par levels, and replenish fast-moving stock
          </p>
        </div>

        <button
          type="button"
          onClick={() => setActiveRoute('purchases')}
          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-medium text-white hover:bg-teal-800 dark:bg-teal-600"
        >
          <Truck className="h-3.5 w-3.5" />
          <span>Create Purchase Order</span>
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs text-slate-500">Healthy Stock SKUs</p>
          <p className="mt-1 font-mono text-2xl font-bold text-emerald-700 tabular-nums dark:text-emerald-400">
            {medicines.length - lowCount}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs text-slate-500">Low Stock Alerts</p>
          <p className="mt-1 font-mono text-2xl font-bold text-amber-700 tabular-nums dark:text-amber-400">
            {lowCount}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs text-slate-500">Out of Stock SKUs</p>
          <p className="mt-1 font-mono text-2xl font-bold text-red-600 tabular-nums dark:text-red-400">
            {outCount}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
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
            onClick={() => setFilter(t.id)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === t.id
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
                <th className="px-3 py-3 text-right font-medium">On Hand</th>
                <th className="px-3 py-3 text-right font-medium">Min Level (Par)</th>
                <th className="px-3 py-3 text-right font-medium">Suggested Reorder</th>
                <th className="px-3 py-3 text-right font-medium">Est. Restock Cost</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((m) => {
                const st = getStockStatus(m.availableQuantity, m.minimumStockLevel);
                const suggestedQty = Math.max(0, m.minimumStockLevel * 2 - m.availableQuantity);
                return (
                  <tr key={m.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{m.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {m.supplierName} · {m.shelfLocation || 'Main Rack'}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-semibold tabular-nums">{m.availableQuantity}</td>
                    <td className="px-3 py-3 text-right">
                      <input
                        type="number"
                        min={1}
                        value={m.minimumStockLevel}
                        onChange={(e) =>
                          updateMedicine(m.id, { minimumStockLevel: Math.max(1, Number(e.target.value)) })
                        }
                        aria-label={`Minimum stock for ${m.name}`}
                        className="w-16 rounded border border-slate-200 px-2 py-1 text-right font-mono text-xs tabular-nums dark:border-slate-700 dark:bg-slate-800"
                      />
                    </td>
                    <td className="px-3 py-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {suggestedQty > 0 ? `+${suggestedQty} packs` : '—'}
                    </td>
                    <td className="px-3 py-3 text-right font-mono tabular-nums">
                      {suggestedQty > 0
                        ? formatCurrency(suggestedQty * m.purchasePrice, settings.currencySymbol)
                        : '—'}
                    </td>
                    <td className="px-3 py-3">
                      <StatusText label={st.label} tone={st.severity} />
                    </td>
                    <td className="px-4 py-3 text-right">
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
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 font-medium text-teal-700 hover:bg-teal-50 dark:border-slate-700 dark:text-teal-400 dark:hover:bg-teal-950/30"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Restock +{Math.max(10, suggestedQty)}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {lowCount === 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
          <PackageCheck className="h-4 w-4" />
          <span>All medicines are currently above minimum stock thresholds.</span>
        </div>
      )}
    </div>
  );
};

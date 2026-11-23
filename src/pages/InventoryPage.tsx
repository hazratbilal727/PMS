import React, { useMemo, useState } from 'react';
import { ArrowRightLeft, ClipboardEdit, Download, Search } from 'lucide-react';
import { downloadCSV, formatCurrency, formatDate, formatDateTime, getStockStatus } from '../lib/utils';
import { usePMS } from '../services/pmsStore';
import type { InventoryTransactionType } from '../types';
import { Modal } from '../components/ui/Modal';
import { StatusText } from '../components/ui/StatusText';

export const InventoryPage: React.FC = () => {
  const { medicines, inventoryTx, transfers, settings, adjustStock, transferStock } = usePMS();
  const [tab, setTab] = useState<'overview' | 'batches' | 'transfers' | 'history'>('overview');
  const [search, setSearch] = useState('');

  // Adjustment modal
  const [adjOpen, setAdjOpen] = useState(false);
  const [adjMedId, setAdjMedId] = useState(medicines[0]?.id ?? '');
  const [adjType, setAdjType] = useState<InventoryTransactionType>('Manual Adjustment');
  const [adjDelta, setAdjDelta] = useState(0);
  const [adjReason, setAdjReason] = useState('');

  // Transfer modal
  const [trfOpen, setTrfOpen] = useState(false);
  const [trfMedId, setTrfMedId] = useState(medicines[0]?.id ?? '');
  const [trfQty, setTrfQty] = useState(5);
  const [trfFrom, setTrfFrom] = useState('Main Store Room');
  const [trfTo, setTrfTo] = useState('Counter OTC · Bay 1');

  const valuation = useMemo(() => {
    const costValue = medicines.reduce((sum, m) => sum + m.availableQuantity * m.purchasePrice, 0);
    const retailValue = medicines.reduce((sum, m) => sum + m.availableQuantity * m.sellingPrice, 0);
    const totalUnits = medicines.reduce((sum, m) => sum + m.availableQuantity, 0);
    return { costValue, retailValue, totalUnits, potentialMargin: retailValue - costValue };
  }, [medicines]);

  const filteredMeds = useMemo(() => {
    const q = search.trim().toLowerCase();
    return medicines.filter(
      (m) =>
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.batchNumber.toLowerCase().includes(q) ||
        m.medicineCode.toLowerCase().includes(q)
    );
  }, [medicines, search]);

  const handleAdjSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjMedId || adjDelta === 0 || !adjReason.trim()) return;
    const signedDelta = adjType === 'Damaged Write-Off' ? -Math.abs(adjDelta) : adjDelta;
    adjustStock({
      medicineId: adjMedId,
      quantityChange: signedDelta,
      type: adjType,
      reason: adjReason.trim(),
    });
    setAdjOpen(false);
    setAdjDelta(0);
    setAdjReason('');
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trfMedId || trfQty <= 0) return;
    transferStock({
      medicineId: trfMedId,
      quantity: trfQty,
      fromLocation: trfFrom,
      toLocation: trfTo,
    });
    setTrfOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
            Inventory Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Stock valuation, batch tracking, damaged write-offs, shelf transfers, and audit trail
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setAdjMedId(medicines[0]?.id ?? '');
              setAdjOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-medium text-white hover:bg-teal-800 dark:bg-teal-600"
          >
            <ClipboardEdit className="h-3.5 w-3.5" />
            <span>Adjust / Damaged Stock</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTrfMedId(medicines[0]?.id ?? '');
              setTrfOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowRightLeft className="h-3.5 w-3.5" />
            <span>Transfer Stock</span>
          </button>
          <button
            type="button"
            onClick={() =>
              downloadCSV(
                'inventory-valuation.csv',
                ['Code', 'Name', 'Batch', 'Qty', 'Purchase Cost', 'Retail Value', 'Location'],
                medicines.map((m) => [
                  m.medicineCode,
                  m.name,
                  m.batchNumber,
                  m.availableQuantity,
                  m.availableQuantity * m.purchasePrice,
                  m.availableQuantity * m.sellingPrice,
                  m.shelfLocation || 'Main',
                ])
              )
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Stock Valuation Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs text-slate-500">Total Stock Units</p>
          <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums">{valuation.totalUnits.toLocaleString()}</p>
          <p className="mt-1 text-[11px] text-slate-400">Across {medicines.length} active SKUs</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs text-slate-500">Inventory Cost Value</p>
          <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums">
            {formatCurrency(valuation.costValue, settings.currencySymbol)}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Purchase basis valuation</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs text-slate-500">Retail Stock Value</p>
          <p className="mt-1.5 font-mono text-2xl font-bold text-teal-700 tabular-nums dark:text-teal-400">
            {formatCurrency(valuation.retailValue, settings.currencySymbol)}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Estimated gross selling value</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs text-slate-500">Projected Gross Margin</p>
          <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums">
            {formatCurrency(valuation.potentialMargin, settings.currencySymbol)}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            {valuation.retailValue > 0 ? Math.round((valuation.potentialMargin / valuation.retailValue) * 100) : 0}% avg margin
          </p>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
          {(
            [
              { id: 'overview', label: 'Stock Overview' },
              { id: 'batches', label: 'Batch Tracking' },
              { id: 'transfers', label: `Transfers (${transfers.length})` },
              { id: 'history', label: `Audit History (${inventoryTx.length})` },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                tab === t.id
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter medicine or batch..."
            className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
      </div>

      {/* Tab Content */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {tab === 'overview' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
                  <th className="px-4 py-3 font-medium">Medicine</th>
                  <th className="px-3 py-3 font-medium">Location</th>
                  <th className="px-3 py-3 text-right font-medium">On Hand</th>
                  <th className="px-3 py-3 text-right font-medium">Min Level</th>
                  <th className="px-3 py-3 text-right font-medium">Cost Valuation</th>
                  <th className="px-3 py-3 text-right font-medium">Retail Valuation</th>
                  <th className="px-4 py-3 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredMeds.map((m) => {
                  const st = getStockStatus(m.availableQuantity, m.minimumStockLevel);
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{m.name}</p>
                        <p className="font-mono text-[11px] text-slate-400">{m.medicineCode}</p>
                      </td>
                      <td className="px-3 py-3 text-slate-600 dark:text-slate-400">{m.shelfLocation || 'Main Rack'}</td>
                      <td className="px-3 py-3 text-right font-mono font-semibold tabular-nums">{m.availableQuantity}</td>
                      <td className="px-3 py-3 text-right font-mono text-slate-500 tabular-nums">{m.minimumStockLevel}</td>
                      <td className="px-3 py-3 text-right font-mono tabular-nums">
                        {formatCurrency(m.availableQuantity * m.purchasePrice, settings.currencySymbol)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-semibold tabular-nums">
                        {formatCurrency(m.availableQuantity * m.sellingPrice, settings.currencySymbol)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <StatusText label={st.label} tone={st.severity} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'batches' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
                  <th className="px-4 py-3 font-medium">Batch Number</th>
                  <th className="px-3 py-3 font-medium">Medicine</th>
                  <th className="px-3 py-3 font-medium">Supplier</th>
                  <th className="px-3 py-3 font-medium">Mfg Date</th>
                  <th className="px-3 py-3 font-medium">Expiry Date</th>
                  <th className="px-4 py-3 text-right font-medium">Batch Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredMeds.map((m) => (
                  <tr key={m.id}>
                    <td className="px-4 py-3 font-mono font-semibold text-teal-700 dark:text-teal-400">{m.batchNumber}</td>
                    <td className="px-3 py-3 font-medium">{m.name}</td>
                    <td className="px-3 py-3 text-slate-500">{m.supplierName}</td>
                    <td className="px-3 py-3 font-mono text-slate-500">{formatDate(m.manufacturingDate)}</td>
                    <td className="px-3 py-3 font-mono">{formatDate(m.expiryDate)}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums">{m.availableQuantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'transfers' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
                  <th className="px-4 py-3 font-medium">Transfer Code</th>
                  <th className="px-3 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 font-medium">Medicine / Batch</th>
                  <th className="px-3 py-3 font-medium">From → To</th>
                  <th className="px-3 py-3 text-right font-medium">Qty</th>
                  <th className="px-4 py-3 text-right font-medium">Authorized By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {transfers.map((t) => (
                  <tr key={t.id}>
                    <td className="px-4 py-3 font-mono font-semibold">{t.transferCode}</td>
                    <td className="px-3 py-3 text-slate-500">{formatDate(t.date)}</td>
                    <td className="px-3 py-3">
                      <p className="font-medium">{t.medicineName}</p>
                      <p className="font-mono text-[11px] text-slate-400">{t.batchNumber}</p>
                    </td>
                    <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                      {t.fromLocation} → <strong>{t.toLocation}</strong>
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-semibold tabular-nums">{t.quantity}</td>
                    <td className="px-4 py-3 text-right text-slate-500">{t.authorizedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'history' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
                  <th className="px-4 py-3 font-medium">Timestamp</th>
                  <th className="px-3 py-3 font-medium">Type</th>
                  <th className="px-3 py-3 font-medium">Medicine / Batch</th>
                  <th className="px-3 py-3 text-right font-medium">Change</th>
                  <th className="px-3 py-3 text-right font-medium">Resulting Stock</th>
                  <th className="px-4 py-3 font-medium">Reason & User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {inventoryTx.map((tx) => (
                  <tr key={tx.id}>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{formatDateTime(tx.date)}</td>
                    <td className="px-3 py-3 font-medium">{tx.type}</td>
                    <td className="px-3 py-3">
                      <p className="font-medium">{tx.medicineName}</p>
                      <p className="font-mono text-[11px] text-slate-400">{tx.batchNumber}</p>
                    </td>
                    <td
                      className={`px-3 py-3 text-right font-mono font-semibold tabular-nums ${
                        tx.quantityChange > 0
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : tx.quantityChange < 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-slate-500'
                      }`}
                    >
                      {tx.quantityChange > 0 ? `+${tx.quantityChange}` : tx.quantityChange}
                    </td>
                    <td className="px-3 py-3 text-right font-mono tabular-nums">{tx.newStock}</td>
                    <td className="px-4 py-3">
                      <p className="text-slate-800 dark:text-slate-200">{tx.reason}</p>
                      <p className="text-[11px] text-slate-400">
                        {tx.performedBy} {tx.referenceCode ? `· ${tx.referenceCode}` : ''}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Adjustment Modal */}
      <Modal open={adjOpen} onClose={() => setAdjOpen(false)} title="Stock Adjustment / Damaged Write-Off" size="sm">
        <form onSubmit={handleAdjSubmit} className="space-y-4 text-xs">
          <div>
            <label className="mb-1 block font-medium">Select Medicine</label>
            <select
              value={adjMedId}
              onChange={(e) => setAdjMedId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
            >
              {medicines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} (Current: {m.availableQuantity})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-medium">Adjustment Type</label>
              <select
                value={adjType}
                onChange={(e) => setAdjType(e.target.value as InventoryTransactionType)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="Manual Adjustment">Manual Adjustment</option>
                <option value="Damaged Write-Off">Damaged Write-Off</option>
                <option value="Stock In">Manual Stock In</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block font-medium">
                {adjType === 'Damaged Write-Off' ? 'Units Damaged' : 'Qty Delta (+/-)'}
              </label>
              <input
                type="number"
                required
                value={adjDelta}
                onChange={(e) => setAdjDelta(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block font-medium">Adjustment Reason *</label>
            <textarea
              rows={2}
              required
              value={adjReason}
              onChange={(e) => setAdjReason(e.target.value)}
              placeholder="e.g. Cycle count reconciliation or broken vial during handling"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAdjOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 font-medium dark:border-slate-700"
            >
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-teal-700 px-4 py-2 font-medium text-white hover:bg-teal-800">
              Apply Adjustment
            </button>
          </div>
        </form>
      </Modal>

      {/* Transfer Modal */}
      <Modal open={trfOpen} onClose={() => setTrfOpen(false)} title="Internal Stock Transfer" size="sm">
        <form onSubmit={handleTransferSubmit} className="space-y-4 text-xs">
          <div>
            <label className="mb-1 block font-medium">Select Medicine</label>
            <select
              value={trfMedId}
              onChange={(e) => setTrfMedId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
            >
              {medicines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.shelfLocation || 'Main'})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block font-medium">Quantity</label>
            <input
              type="number"
              min={1}
              value={trfQty}
              onChange={(e) => setTrfQty(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-medium">From Location</label>
              <input
                type="text"
                value={trfFrom}
                onChange={(e) => setTrfFrom(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="mb-1 block font-medium">To Location</label>
              <input
                type="text"
                value={trfTo}
                onChange={(e) => setTrfTo(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setTrfOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 font-medium dark:border-slate-700"
            >
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-teal-700 px-4 py-2 font-medium text-white hover:bg-teal-800">
              Complete Transfer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

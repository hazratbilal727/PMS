import React, { useMemo, useState } from 'react';
import {
  ArrowRightLeft,
  ArrowUpDown,
  Boxes,
  ClipboardEdit,
  DollarSign,
  Download,
  PackageOpen,
  SlidersHorizontal,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { downloadCSV, formatCurrency, formatDate, formatDateTime, getStockStatus } from '../lib/utils';
import { usePMS } from '../services/pmsStore';
import type { InventoryTransactionType } from '../types';
import { EmptyState } from '../components/ui/EmptyState';
import { KpiCard } from '../components/ui/KpiCard';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { PaginationBar } from '../components/ui/PaginationBar';
import { SearchInput } from '../components/ui/SearchInput';
import { StatusText } from '../components/ui/StatusText';

export const InventoryPage: React.FC = () => {
  const { medicines, inventoryTx, transfers, settings, adjustStock, transferStock } = usePMS();
  const [tab, setTab] = useState<'overview' | 'batches' | 'transfers' | 'history'>('overview');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Sorting for overview & batches
  const [overviewSort, setOverviewSort] = useState<'name' | 'availableQuantity' | 'cost' | 'retail'>('name');
  const [overviewDir, setOverviewDir] = useState<'asc' | 'desc'>('asc');
  const [batchSort, setBatchSort] = useState<'batchNumber' | 'name' | 'expiryDate' | 'availableQuantity'>('expiryDate');
  const [batchDir, setBatchDir] = useState<'asc' | 'desc'>('asc');

  // Adjustment modal
  const [adjOpen, setAdjOpen] = useState(false);
  const [adjMedId, setAdjMedId] = useState(medicines[0]?.id ?? '');
  const [adjType, setAdjType] = useState<InventoryTransactionType>('Manual Adjustment');
  const [adjDelta, setAdjDelta] = useState(0);
  const [adjReason, setAdjReason] = useState('');
  const [adjError, setAdjError] = useState('');

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

  const filteredOverview = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = medicines.filter(
      (m) =>
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.batchNumber.toLowerCase().includes(q) ||
        m.medicineCode.toLowerCase().includes(q) ||
        (m.shelfLocation || '').toLowerCase().includes(q)
    );
    const factor = overviewDir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      if (overviewSort === 'name') return a.name.localeCompare(b.name) * factor;
      if (overviewSort === 'availableQuantity') return (a.availableQuantity - b.availableQuantity) * factor;
      if (overviewSort === 'cost')
        return (a.availableQuantity * a.purchasePrice - b.availableQuantity * b.purchasePrice) * factor;
      return (a.availableQuantity * a.sellingPrice - b.availableQuantity * b.sellingPrice) * factor;
    });
  }, [medicines, search, overviewSort, overviewDir]);

  const filteredBatches = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = medicines.filter(
      (m) =>
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.batchNumber.toLowerCase().includes(q) ||
        m.supplierName.toLowerCase().includes(q)
    );
    const factor = batchDir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      if (batchSort === 'batchNumber') return a.batchNumber.localeCompare(b.batchNumber) * factor;
      if (batchSort === 'name') return a.name.localeCompare(b.name) * factor;
      if (batchSort === 'availableQuantity') return (a.availableQuantity - b.availableQuantity) * factor;
      return a.expiryDate.localeCompare(b.expiryDate) * factor;
    });
  }, [medicines, search, batchSort, batchDir]);

  const filteredTransfers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transfers.filter(
      (t) =>
        !q ||
        t.transferCode.toLowerCase().includes(q) ||
        t.medicineName.toLowerCase().includes(q) ||
        t.batchNumber.toLowerCase().includes(q) ||
        t.toLocation.toLowerCase().includes(q)
    );
  }, [transfers, search]);

  const filteredHistory = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inventoryTx.filter(
      (tx) =>
        !q ||
        tx.medicineName.toLowerCase().includes(q) ||
        tx.batchNumber.toLowerCase().includes(q) ||
        tx.type.toLowerCase().includes(q) ||
        tx.reason.toLowerCase().includes(q) ||
        (tx.referenceCode || '').toLowerCase().includes(q)
    );
  }, [inventoryTx, search]);

  const currentTotal =
    tab === 'overview'
      ? filteredOverview.length
      : tab === 'batches'
      ? filteredBatches.length
      : tab === 'transfers'
      ? filteredTransfers.length
      : filteredHistory.length;

  const pagedOverview = filteredOverview.slice((page - 1) * pageSize, page * pageSize);
  const pagedBatches = filteredBatches.slice((page - 1) * pageSize, page * pageSize);
  const pagedTransfers = filteredTransfers.slice((page - 1) * pageSize, page * pageSize);
  const pagedHistory = filteredHistory.slice((page - 1) * pageSize, page * pageSize);

  const toggleOverviewSort = (col: typeof overviewSort) => {
    if (overviewSort === col) setOverviewDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setOverviewSort(col);
      setOverviewDir('asc');
    }
    setPage(1);
  };

  const toggleBatchSort = (col: typeof batchSort) => {
    if (batchSort === col) setBatchDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setBatchSort(col);
      setBatchDir('asc');
    }
    setPage(1);
  };

  const openAdjustFor = (medId: string) => {
    setAdjMedId(medId);
    setAdjType('Manual Adjustment');
    setAdjDelta(0);
    setAdjReason('');
    setAdjError('');
    setAdjOpen(true);
  };

  const handleAdjSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjMedId) {
      setAdjError('Please select a medicine.');
      return;
    }
    if (adjDelta === 0) {
      setAdjError('Quantity delta cannot be zero.');
      return;
    }
    if (!adjReason.trim()) {
      setAdjError('Adjustment reason is required for audit compliance.');
      return;
    }
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
    setAdjError('');
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trfMedId || trfQty <= 0) return;
    transferStock({
      medicineId: trfMedId,
      quantity: trfQty,
      fromLocation: trfFrom.trim() || 'Main Store Room',
      toLocation: trfTo.trim() || 'Counter OTC',
    });
    setTrfOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Management"
        description="Stock valuation, batch tracking, damaged write-offs, shelf transfers, and audit trail"
        actions={
          <>
            <button type="button" onClick={() => openAdjustFor(medicines[0]?.id ?? '')} className="pms-btn-primary">
              <ClipboardEdit className="h-4 w-4" />
              <span>Adjust / Damaged Stock</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const first = medicines[0];
                setTrfMedId(first?.id ?? '');
                setTrfFrom(first?.shelfLocation || 'Main Store Room');
                setTrfOpen(true);
              }}
              className="pms-btn-secondary"
            >
              <ArrowRightLeft className="h-4 w-4" />
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
              className="pms-btn-secondary"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </>
        }
      />

      {/* Stock Valuation Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Stock Units"
          value={valuation.totalUnits.toLocaleString()}
          subtitle={`Across ${medicines.length} active SKUs`}
          icon={Boxes}
          tone="slate"
        />
        <KpiCard
          label="Inventory Cost Value"
          value={formatCurrency(valuation.costValue, settings.currencySymbol)}
          subtitle="Purchase basis valuation"
          icon={Wallet}
          tone="slate"
        />
        <KpiCard
          label="Retail Stock Value"
          value={formatCurrency(valuation.retailValue, settings.currencySymbol)}
          subtitle="Estimated gross selling value"
          icon={DollarSign}
          tone="teal"
        />
        <KpiCard
          label="Projected Gross Margin"
          value={formatCurrency(valuation.potentialMargin, settings.currencySymbol)}
          subtitle={`${valuation.retailValue > 0 ? Math.round((valuation.potentialMargin / valuation.retailValue) * 100) : 0}% avg margin`}
          icon={TrendingUp}
          tone="emerald"
        />
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex items-center gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
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
              onClick={() => {
                setTab(t.id);
                setPage(1);
              }}
              className={`rounded-lg px-3.5 py-2 text-[13px] font-medium whitespace-nowrap transition-colors ${
                tab === t.id
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
          placeholder="Filter medicine, batch, shelf or ref..."
          containerClassName="w-full sm:w-80"
        />
      </div>

      {/* Tab Content */}
      <div className="pms-card overflow-hidden">
        {tab === 'overview' && (
          <>
            {pagedOverview.length === 0 ? (
              <EmptyState
                icon={PackageOpen}
                title="No inventory records found"
                description="No medicines matched your search query in Stock Overview."
                actionLabel="Clear Filter"
                onAction={() => setSearch('')}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                      <th className="px-5 py-3.5">
                        <button
                          type="button"
                          onClick={() => toggleOverviewSort('name')}
                          className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-100"
                        >
                          <span>Medicine</span>
                          <ArrowUpDown className="h-3.5 w-3.5" />
                        </button>
                      </th>
                      <th className="px-4 py-3.5">Location</th>
                      <th className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => toggleOverviewSort('availableQuantity')}
                          className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-100"
                        >
                          <span>On Hand</span>
                          <ArrowUpDown className="h-3.5 w-3.5" />
                        </button>
                      </th>
                      <th className="px-4 py-3.5 text-right">Min Level</th>
                      <th className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => toggleOverviewSort('cost')}
                          className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-100"
                        >
                          <span>Cost Valuation</span>
                          <ArrowUpDown className="h-3.5 w-3.5" />
                        </button>
                      </th>
                      <th className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => toggleOverviewSort('retail')}
                          className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-100"
                        >
                          <span>Retail Valuation</span>
                          <ArrowUpDown className="h-3.5 w-3.5" />
                        </button>
                      </th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {pagedOverview.map((m) => {
                      const st = getStockStatus(m.availableQuantity, m.minimumStockLevel);
                      return (
                        <tr key={m.id} className="transition-colors hover:bg-slate-50/75 dark:hover:bg-slate-800/40">
                          <td className="px-5 py-3.5">
                            <p className="font-semibold text-slate-900 dark:text-slate-100">{m.name}</p>
                            <p className="font-mono text-xs text-slate-400">{m.medicineCode}</p>
                          </td>
                          <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">{m.shelfLocation || 'Main Rack'}</td>
                          <td className="px-4 py-3.5 text-right font-mono font-semibold text-slate-900 tabular-nums dark:text-slate-100">
                            {m.availableQuantity}
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono text-slate-500 tabular-nums">
                            {m.minimumStockLevel}
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                            {formatCurrency(m.availableQuantity * m.purchasePrice, settings.currencySymbol)}
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                            {formatCurrency(m.availableQuantity * m.sellingPrice, settings.currencySymbol)}
                          </td>
                          <td className="px-4 py-3.5">
                            <StatusText label={st.label} tone={st.severity} />
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => openAdjustFor(m.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                              <SlidersHorizontal className="h-3.5 w-3.5" />
                              <span>Adjust</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {tab === 'batches' && (
          <>
            {pagedBatches.length === 0 ? (
              <EmptyState
                icon={PackageOpen}
                title="No matching batches"
                description="Try adjusting your medicine or batch number search query."
                actionLabel="Clear Filter"
                onAction={() => setSearch('')}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                      <th className="px-5 py-3.5">
                        <button
                          type="button"
                          onClick={() => toggleBatchSort('batchNumber')}
                          className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-100"
                        >
                          <span>Batch Number</span>
                          <ArrowUpDown className="h-3.5 w-3.5" />
                        </button>
                      </th>
                      <th className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => toggleBatchSort('name')}
                          className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-100"
                        >
                          <span>Medicine</span>
                          <ArrowUpDown className="h-3.5 w-3.5" />
                        </button>
                      </th>
                      <th className="px-4 py-3.5">Supplier</th>
                      <th className="px-4 py-3.5">Mfg Date</th>
                      <th className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => toggleBatchSort('expiryDate')}
                          className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-100"
                        >
                          <span>Expiry Date</span>
                          <ArrowUpDown className="h-3.5 w-3.5" />
                        </button>
                      </th>
                      <th className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => toggleBatchSort('availableQuantity')}
                          className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-100"
                        >
                          <span>Batch Qty</span>
                          <ArrowUpDown className="h-3.5 w-3.5" />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {pagedBatches.map((m) => (
                      <tr key={m.id} className="transition-colors hover:bg-slate-50/75 dark:hover:bg-slate-800/40">
                        <td className="px-5 py-3.5 font-mono font-semibold text-teal-700 dark:text-teal-400">
                          {m.batchNumber}
                        </td>
                        <td className="px-4 py-3.5 font-medium text-slate-900 dark:text-slate-100">{m.name}</td>
                        <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">{m.supplierName}</td>
                        <td className="px-4 py-3.5 font-mono text-slate-500 dark:text-slate-400">
                          {formatDate(m.manufacturingDate)}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-700 dark:text-slate-300">
                          {formatDate(m.expiryDate)}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono font-semibold tabular-nums">
                          {m.availableQuantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {tab === 'transfers' && (
          <>
            {pagedTransfers.length === 0 ? (
              <EmptyState
                icon={ArrowRightLeft}
                title="No stock transfers found"
                description="No internal shelf transfers matched your search query."
                actionLabel={search ? 'Clear Search' : undefined}
                onAction={search ? () => setSearch('') : undefined}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                      <th className="px-5 py-3.5">Transfer Code</th>
                      <th className="px-4 py-3.5">Date</th>
                      <th className="px-4 py-3.5">Medicine / Batch</th>
                      <th className="px-4 py-3.5">From → To</th>
                      <th className="px-4 py-3.5 text-right">Qty</th>
                      <th className="px-5 py-3.5 text-right">Authorized By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {pagedTransfers.map((t) => (
                      <tr key={t.id} className="transition-colors hover:bg-slate-50/75 dark:hover:bg-slate-800/40">
                        <td className="px-5 py-3.5 font-mono font-semibold text-slate-900 dark:text-slate-100">
                          {t.transferCode}
                        </td>
                        <td className="px-4 py-3.5 text-slate-500">{formatDate(t.date)}</td>
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-slate-900 dark:text-slate-100">{t.medicineName}</p>
                          <p className="font-mono text-xs text-slate-400">{t.batchNumber}</p>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                          {t.fromLocation} → <strong>{t.toLocation}</strong>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-semibold tabular-nums">{t.quantity}</td>
                        <td className="px-5 py-3.5 text-right text-slate-500">{t.authorizedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {tab === 'history' && (
          <>
            {pagedHistory.length === 0 ? (
              <EmptyState
                icon={PackageOpen}
                title="No audit events found"
                description="No inventory transactions matched your filter criteria."
                actionLabel={search ? 'Clear Search' : undefined}
                onAction={search ? () => setSearch('') : undefined}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                      <th className="px-5 py-3.5">Timestamp</th>
                      <th className="px-4 py-3.5">Type</th>
                      <th className="px-4 py-3.5">Medicine / Batch</th>
                      <th className="px-4 py-3.5 text-right">Change</th>
                      <th className="px-4 py-3.5 text-right">Resulting Stock</th>
                      <th className="px-5 py-3.5">Reason & User</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {pagedHistory.map((tx) => (
                      <tr key={tx.id} className="transition-colors hover:bg-slate-50/75 dark:hover:bg-slate-800/40">
                        <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{formatDateTime(tx.date)}</td>
                        <td className="px-4 py-3.5 font-medium text-slate-800 dark:text-slate-200">{tx.type}</td>
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-slate-900 dark:text-slate-100">{tx.medicineName}</p>
                          <p className="font-mono text-xs text-slate-400">{tx.batchNumber}</p>
                        </td>
                        <td
                          className={`px-4 py-3.5 text-right font-mono font-semibold tabular-nums ${
                            tx.quantityChange > 0
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : tx.quantityChange < 0
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-slate-500'
                          }`}
                        >
                          {tx.quantityChange > 0 ? `+${tx.quantityChange}` : tx.quantityChange}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono tabular-nums">{tx.newStock}</td>
                        <td className="px-5 py-3.5">
                          <p className="text-slate-800 dark:text-slate-200">{tx.reason}</p>
                          <p className="text-xs text-slate-400">
                            {tx.performedBy} {tx.referenceCode ? `· ${tx.referenceCode}` : ''}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        <PaginationBar page={page} pageSize={pageSize} total={currentTotal} onPageChange={setPage} />
      </div>

      {/* Adjustment Modal */}
      <Modal open={adjOpen} onClose={() => setAdjOpen(false)} title="Stock Adjustment / Damaged Write-Off" size="sm">
        <form onSubmit={handleAdjSubmit} className="space-y-4">
          <div>
            <label className="pms-label">Select Medicine</label>
            <select value={adjMedId} onChange={(e) => setAdjMedId(e.target.value)} className="pms-select">
              {medicines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} (Current: {m.availableQuantity})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="pms-label">Adjustment Type</label>
              <select
                value={adjType}
                onChange={(e) => setAdjType(e.target.value as InventoryTransactionType)}
                className="pms-select"
              >
                <option value="Manual Adjustment">Manual Adjustment</option>
                <option value="Damaged Write-Off">Damaged Write-Off</option>
                <option value="Stock In">Manual Stock In</option>
              </select>
            </div>
            <div>
              <label className="pms-label">
                {adjType === 'Damaged Write-Off' ? 'Units Damaged' : 'Qty Delta (+/-)'}
              </label>
              <input
                type="number"
                required
                value={adjDelta}
                onChange={(e) => {
                  setAdjDelta(Number(e.target.value));
                  setAdjError('');
                }}
                className="pms-input font-mono"
              />
            </div>
          </div>
          <div>
            <label className="pms-label">Adjustment Reason *</label>
            <textarea
              rows={2}
              required
              value={adjReason}
              onChange={(e) => {
                setAdjReason(e.target.value);
                setAdjError('');
              }}
              placeholder="e.g. Cycle count reconciliation or broken vial during handling"
              className="pms-textarea"
            />
          </div>
          {adjError && <p className="text-xs font-medium text-red-600 dark:text-red-400">{adjError}</p>}
          <div className="flex justify-end gap-2.5 pt-2">
            <button type="button" onClick={() => setAdjOpen(false)} className="pms-btn-secondary">
              Cancel
            </button>
            <button type="submit" className="pms-btn-primary">
              Apply Adjustment
            </button>
          </div>
        </form>
      </Modal>

      {/* Transfer Modal */}
      <Modal open={trfOpen} onClose={() => setTrfOpen(false)} title="Internal Stock Transfer" size="sm">
        <form onSubmit={handleTransferSubmit} className="space-y-4">
          <div>
            <label className="pms-label">Select Medicine</label>
            <select
              value={trfMedId}
              onChange={(e) => {
                const nextId = e.target.value;
                setTrfMedId(nextId);
                const found = medicines.find((m) => m.id === nextId);
                if (found?.shelfLocation) setTrfFrom(found.shelfLocation);
              }}
              className="pms-select"
            >
              {medicines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.shelfLocation || 'Main'})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="pms-label">Quantity</label>
            <input
              type="number"
              min={1}
              value={trfQty}
              onChange={(e) => setTrfQty(Number(e.target.value))}
              className="pms-input font-mono"
            />
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="pms-label">From Location</label>
              <input
                type="text"
                required
                value={trfFrom}
                onChange={(e) => setTrfFrom(e.target.value)}
                className="pms-input"
              />
            </div>
            <div>
              <label className="pms-label">To Location</label>
              <input
                type="text"
                required
                value={trfTo}
                onChange={(e) => setTrfTo(e.target.value)}
                className="pms-input"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <button type="button" onClick={() => setTrfOpen(false)} className="pms-btn-secondary">
              Cancel
            </button>
            <button type="submit" className="pms-btn-primary">
              Complete Transfer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

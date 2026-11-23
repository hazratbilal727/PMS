import React, { useMemo, useState } from 'react';
import { DollarSign, Plus, Receipt, RotateCcw } from 'lucide-react';
import { formatCurrencyExact, formatDate } from '../lib/utils';
import { usePMS } from '../services/pmsStore';
import type { PaymentMethod } from '../types';
import { EmptyState } from '../components/ui/EmptyState';
import { KpiCard } from '../components/ui/KpiCard';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { PaginationBar } from '../components/ui/PaginationBar';
import { SearchInput } from '../components/ui/SearchInput';
import { StatusText } from '../components/ui/StatusText';

export const ReturnsPage: React.FC = () => {
  const { returns, sales, settings, processReturn } = usePMS();
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<'All' | PaymentMethod>('All');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const eligibleSales = sales.filter((s) => s.paymentStatus !== 'Refunded');
  const [selectedSaleId, setSelectedSaleId] = useState(eligibleSales[0]?.id ?? '');
  const [refundMethod, setRefundMethod] = useState<PaymentMethod>('Cash');
  const [reason, setReason] = useState('');
  const [restockable, setRestockable] = useState(true);

  const selectedSale = sales.find((s) => s.id === selectedSaleId);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return returns.filter((r) => {
      const matchMethod = methodFilter === 'All' || r.refundMethod === methodFilter;
      const matchSearch =
        !q ||
        r.returnNumber.toLowerCase().includes(q) ||
        r.invoiceNumber.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q) ||
        r.items.some((i) => i.medicineName.toLowerCase().includes(q));
      return matchMethod && matchSearch;
    });
  }, [returns, search, methodFilter]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalRefunded = returns.reduce((sum, r) => sum + r.refundAmount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSale || !reason.trim()) return;
    processReturn({
      saleId: selectedSale.id,
      items: selectedSale.items.map((i) => ({
        medicineId: i.medicineId,
        medicineName: i.medicineName,
        quantity: i.quantity,
        refundUnitPrice: i.unitPrice,
        restockable,
      })),
      refundAmount: selectedSale.grandTotal,
      refundMethod,
      reason: reason.trim(),
    });
    setModalOpen(false);
    setReason('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Returns & Refunds (${returns.length})`}
        description="Process customer medicine returns, manage sealed restocking, and audit refund payouts"
        actions={
          <button
            type="button"
            disabled={eligibleSales.length === 0}
            onClick={() => {
              setSelectedSaleId(eligibleSales[0]?.id ?? '');
              setModalOpen(true);
            }}
            className="pms-btn-primary"
          >
            <Plus className="h-4 w-4" />
            <span>Process Return</span>
          </button>
        }
      />

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label="Total Returns Logged"
          value={returns.length}
          subtitle="All audited refund vouchers"
          icon={RotateCcw}
          tone="slate"
        />
        <KpiCard
          label="Total Refunded Value"
          value={formatCurrencyExact(totalRefunded, settings.currencySymbol)}
          subtitle="Cumulative customer payouts"
          icon={DollarSign}
          tone="red"
        />
        <KpiCard
          label="Eligible Open Invoices"
          value={eligibleSales.length}
          subtitle="Invoices available for return"
          icon={Receipt}
          tone="teal"
        />
      </div>

      {/* Filters */}
      <div className="pms-card flex flex-col gap-3.5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={search}
          onValueChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search return #, invoice #, customer or medicine..."
          containerClassName="w-full sm:max-w-md"
        />

        <select
          value={methodFilter}
          onChange={(e) => {
            setMethodFilter(e.target.value as 'All' | PaymentMethod);
            setPage(1);
          }}
          aria-label="Filter by refund method"
          className="pms-select sm:w-56"
        >
          <option value="All">All Refund Methods</option>
          <option value="Cash">Cash</option>
          <option value="Card">Card</option>
          <option value="Bank Transfer">Bank Transfer</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Refund Ledger */}
      <div className="pms-card overflow-hidden">
        {paged.length === 0 ? (
          <EmptyState
            icon={RotateCcw}
            title="No return records found"
            description="No returns or refunds matched your current search or refund method filter."
            actionLabel="Reset Filters"
            onAction={() => {
              setSearch('');
              setMethodFilter('All');
              setPage(1);
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                  <th className="px-5 py-3.5">Return #</th>
                  <th className="px-4 py-3.5">Invoice / Customer</th>
                  <th className="px-4 py-3.5">Returned Items</th>
                  <th className="px-4 py-3.5">Reason</th>
                  <th className="px-4 py-3.5 text-right">Refund</th>
                  <th className="px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paged.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-slate-50/75 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3.5">
                      <p className="font-mono font-semibold text-slate-900 dark:text-slate-100">{r.returnNumber}</p>
                      <p className="text-xs text-slate-400">{formatDate(r.date)}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-mono font-medium text-slate-800 dark:text-slate-200">{r.invoiceNumber}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{r.customerName}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      {r.items.map((i, idx) => (
                        <p key={idx} className="text-slate-700 dark:text-slate-300">
                          {i.medicineName} × {i.quantity}{' '}
                          <span className="text-xs text-slate-400">({i.restockable ? 'Restocked' : 'Damaged'})</span>
                        </p>
                      ))}
                    </td>
                    <td className="max-w-xs px-4 py-3.5 text-slate-600 dark:text-slate-400">{r.reason}</td>
                    <td className="px-4 py-3.5 text-right font-mono font-semibold tabular-nums">
                      <p className="text-slate-900 dark:text-slate-100">
                        {formatCurrencyExact(r.refundAmount, settings.currencySymbol)}
                      </p>
                      <p className="text-xs font-sans font-normal text-slate-400">{r.refundMethod}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusText label={r.status} tone="ok" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <PaginationBar page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
      </div>

      {/* Process Return Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Process Customer Return & Refund"
        subtitle="Select an open invoice to issue a refund and optionally restock sealed items"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="pms-label">Select Invoice</label>
            <select
              value={selectedSaleId}
              onChange={(e) => setSelectedSaleId(e.target.value)}
              className="pms-select"
            >
              {eligibleSales.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.invoiceNumber} — {s.customerName} ({formatCurrencyExact(s.grandTotal, settings.currencySymbol)})
                </option>
              ))}
            </select>
          </div>
          {selectedSale && (
            <div className="rounded-xl bg-slate-50 p-3.5 text-sm dark:bg-slate-800/60">
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                Items on {selectedSale.invoiceNumber}:
              </p>
              <ul className="mt-1.5 space-y-1 text-slate-600 dark:text-slate-300">
                {selectedSale.items.map((item, idx) => (
                  <li key={idx}>
                    {item.medicineName} × {item.quantity}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <label className="pms-label">Refund Method</label>
            <select
              value={refundMethod}
              onChange={(e) => setRefundMethod(e.target.value as PaymentMethod)}
              className="pms-select"
            >
              <option value="Cash">Cash</option>
              <option value="Card">Card Reversal</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>
          <div>
            <label className="pms-label">Return Reason *</label>
            <textarea
              rows={2}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Prescription modified by physician within 48h"
              className="pms-textarea"
            />
          </div>
          <label className="flex items-center gap-2.5 text-sm font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={restockable}
              onChange={(e) => setRestockable(e.target.checked)}
              className="h-4 w-4 accent-teal-700"
            />
            <span>Packaging unopened & safe — restock items into active inventory</span>
          </label>
          <div className="flex justify-end gap-2.5 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="pms-btn-secondary">
              Cancel
            </button>
            <button type="submit" className="pms-btn-primary">
              <RotateCcw className="h-4 w-4" />
              <span>Confirm Refund</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

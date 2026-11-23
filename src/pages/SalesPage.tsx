import React, { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  CheckCircle2,
  Clock,
  DollarSign,
  Printer,
  Receipt,
  ReceiptText,
  RotateCcw,
} from 'lucide-react';
import { formatCurrencyExact, formatDateTime } from '../lib/utils';
import { usePMS } from '../services/pmsStore';
import type { PaymentMethod, PaymentStatus, Sale } from '../types';
import { EmptyState } from '../components/ui/EmptyState';
import { KpiCard } from '../components/ui/KpiCard';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { PaginationBar } from '../components/ui/PaginationBar';
import { SearchInput } from '../components/ui/SearchInput';
import { PrintableInvoiceModal } from '../components/dialogs/PrintableInvoiceModal';
import { StatusText } from '../components/ui/StatusText';

export const SalesPage: React.FC = () => {
  const { sales, settings, processReturn, updateSalePaymentStatus, setActiveRoute } = usePMS();

  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<'All' | PaymentMethod>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | PaymentStatus>('All');
  const [dateFilter, setDateFilter] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'invoiceNumber' | 'grandTotal'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [printSale, setPrintSale] = useState<Sale | null>(null);
  const [returnTarget, setReturnTarget] = useState<Sale | null>(null);
  const [returnReason, setReturnReason] = useState('Customer requested exchange / doctor changed prescription');
  const [restockable, setRestockable] = useState(true);

  const summary = useMemo(() => {
    const paidTotal = sales.filter((s) => s.paymentStatus === 'Paid').reduce((sum, s) => sum + s.grandTotal, 0);
    const pendingTotal = sales
      .filter((s) => s.paymentStatus === 'Pending' || s.paymentStatus === 'Partial')
      .reduce((sum, s) => sum + s.grandTotal, 0);
    const refundedTotal = sales
      .filter((s) => s.paymentStatus === 'Refunded')
      .reduce((sum, s) => sum + s.grandTotal, 0);
    return { totalCount: sales.length, paidTotal, pendingTotal, refundedTotal };
  }, [sales]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = sales.filter((s) => {
      const matchSearch =
        !q ||
        s.invoiceNumber.toLowerCase().includes(q) ||
        s.customerName.toLowerCase().includes(q) ||
        s.cashierName.toLowerCase().includes(q);
      const matchMethod = methodFilter === 'All' || s.paymentMethod === methodFilter;
      const matchStatus = statusFilter === 'All' || s.paymentStatus === statusFilter;
      const matchDate = !dateFilter || s.date.startsWith(dateFilter);
      return matchSearch && matchMethod && matchStatus && matchDate;
    });

    const factor = sortDir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      if (sortBy === 'invoiceNumber') return a.invoiceNumber.localeCompare(b.invoiceNumber) * factor;
      if (sortBy === 'grandTotal') return (a.grandTotal - b.grandTotal) * factor;
      return a.date.localeCompare(b.date) * factor;
    });
  }, [sales, search, methodFilter, statusFilter, dateFilter, sortBy, sortDir]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(col);
      setSortDir('desc');
    }
    setPage(1);
  };

  const handleConfirmReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnTarget) return;
    processReturn({
      saleId: returnTarget.id,
      items: returnTarget.items.map((item) => ({
        medicineId: item.medicineId,
        medicineName: item.medicineName,
        quantity: item.quantity,
        refundUnitPrice: item.unitPrice,
        restockable,
      })),
      refundAmount: returnTarget.grandTotal,
      refundMethod: returnTarget.paymentMethod,
      reason: returnReason,
    });
    setReturnTarget(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Sales & Invoices (${filtered.length})`}
        description="Review completed invoices, settle pending credit bills, reprint customer receipts, and initiate returns"
        actions={
          <button type="button" onClick={() => setActiveRoute('pos')} className="pms-btn-primary">
            New POS Sale
          </button>
        }
      />

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Invoices" value={summary.totalCount} icon={Receipt} tone="slate" />
        <KpiCard
          label="Paid Revenue"
          value={formatCurrencyExact(summary.paidTotal, settings.currencySymbol)}
          icon={DollarSign}
          tone="emerald"
        />
        <KpiCard
          label="Credit Pending"
          value={formatCurrencyExact(summary.pendingTotal, settings.currencySymbol)}
          icon={Clock}
          tone="amber"
        />
        <KpiCard
          label="Refunded Total"
          value={formatCurrencyExact(summary.refundedTotal, settings.currencySymbol)}
          icon={RotateCcw}
          tone="red"
        />
      </div>

      {/* Filters */}
      <div className="pms-card grid grid-cols-1 gap-3.5 p-4 sm:grid-cols-5">
        <SearchInput
          value={search}
          onValueChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search invoice #, customer or cashier..."
          containerClassName="sm:col-span-2"
        />
        <select
          value={methodFilter}
          onChange={(e) => {
            setMethodFilter(e.target.value as 'All' | PaymentMethod);
            setPage(1);
          }}
          aria-label="Filter by payment method"
          className="pms-select"
        >
          <option value="All">All Payment Methods</option>
          <option value="Cash">Cash</option>
          <option value="Card">Card</option>
          <option value="Bank Transfer">Bank Transfer</option>
          <option value="Other">Other</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as 'All' | PaymentStatus);
            setPage(1);
          }}
          aria-label="Filter by payment status"
          className="pms-select"
        >
          <option value="All">All Statuses</option>
          <option value="Paid">Paid</option>
          <option value="Pending">Pending</option>
          <option value="Partial">Partial</option>
          <option value="Refunded">Refunded</option>
        </select>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => {
            setDateFilter(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by invoice date"
          className="pms-input"
        />
      </div>

      {/* Table */}
      <div className="pms-card overflow-hidden">
        {paged.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title="No sales invoices found"
            description="No invoices matched your search or payment filters."
            actionLabel="Reset Filters"
            onAction={() => {
              setSearch('');
              setMethodFilter('All');
              setStatusFilter('All');
              setDateFilter('');
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
                      onClick={() => toggleSort('invoiceNumber')}
                      className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-100"
                    >
                      <span>Invoice #</span>
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="px-4 py-3.5">
                    <button
                      type="button"
                      onClick={() => toggleSort('date')}
                      className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-100"
                    >
                      <span>Date & Cashier</span>
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Payment</th>
                  <th className="px-4 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => toggleSort('grandTotal')}
                      className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-100"
                    >
                      <span>Total</span>
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paged.map((s) => (
                  <tr key={s.id} className="transition-colors hover:bg-slate-50/75 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3.5 font-mono font-semibold text-slate-900 dark:text-slate-100">
                      {s.invoiceNumber}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-slate-800 dark:text-slate-200">{formatDateTime(s.date)}</p>
                      <p className="text-xs text-slate-400">Cashier: {s.cashierName}</p>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-800 dark:text-slate-200">{s.customerName}</td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">{s.paymentMethod}</td>
                    <td className="px-4 py-3.5 text-right font-mono font-semibold tabular-nums">
                      {formatCurrencyExact(s.grandTotal, settings.currencySymbol)}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusText
                        label={s.paymentStatus}
                        tone={
                          s.paymentStatus === 'Paid'
                            ? 'ok'
                            : s.paymentStatus === 'Refunded'
                            ? 'critical'
                            : 'warning'
                        }
                      />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {(s.paymentStatus === 'Pending' || s.paymentStatus === 'Partial') && (
                          <button
                            type="button"
                            onClick={() => updateSalePaymentStatus(s.id, 'Paid')}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/60 px-2.5 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Mark Paid</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setPrintSale(s)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                        >
                          <Printer className="h-3.5 w-3.5" />
                          <span>Invoice</span>
                        </button>
                        {s.paymentStatus !== 'Refunded' && (
                          <button
                            type="button"
                            onClick={() => setReturnTarget(s)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-50 dark:border-slate-700 dark:text-amber-400 dark:hover:bg-amber-950/30"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>Return</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <PaginationBar page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
      </div>

      {/* Return Modal */}
      <Modal
        open={Boolean(returnTarget)}
        onClose={() => setReturnTarget(null)}
        title={`Process Return for ${returnTarget?.invoiceNumber ?? ''}`}
        subtitle={`Full refund of ${formatCurrencyExact(returnTarget?.grandTotal ?? 0, settings.currencySymbol)}`}
        size="sm"
      >
        <form onSubmit={handleConfirmReturn} className="space-y-4">
          <div>
            <label className="pms-label">Return Reason *</label>
            <textarea
              rows={2}
              required
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
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
            <span>Sealed & Resalable — Return quantities back to inventory</span>
          </label>
          <div className="flex justify-end gap-2.5 pt-2">
            <button type="button" onClick={() => setReturnTarget(null)} className="pms-btn-secondary">
              Cancel
            </button>
            <button type="submit" className="pms-btn-primary">
              Confirm Refund
            </button>
          </div>
        </form>
      </Modal>

      <PrintableInvoiceModal sale={printSale} onClose={() => setPrintSale(null)} />
    </div>
  );
};

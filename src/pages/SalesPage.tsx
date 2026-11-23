import React, { useMemo, useState } from 'react';
import { Printer, RotateCcw, Search } from 'lucide-react';
import { formatCurrencyExact, formatDateTime } from '../lib/utils';
import { usePMS } from '../services/pmsStore';
import type { PaymentMethod, Sale } from '../types';
import { Modal } from '../components/ui/Modal';
import { PrintableInvoiceModal } from '../components/dialogs/PrintableInvoiceModal';
import { StatusText } from '../components/ui/StatusText';

export const SalesPage: React.FC = () => {
  const { sales, settings, processReturn, setActiveRoute } = usePMS();

  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<'All' | PaymentMethod>('All');
  const [dateFilter, setDateFilter] = useState('');
  const [printSale, setPrintSale] = useState<Sale | null>(null);

  const [returnTarget, setReturnTarget] = useState<Sale | null>(null);
  const [returnReason, setReturnReason] = useState('Customer requested exchange / doctor changed prescription');
  const [restockable, setRestockable] = useState(true);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sales.filter((s) => {
      const matchSearch =
        !q || s.invoiceNumber.toLowerCase().includes(q) || s.customerName.toLowerCase().includes(q);
      const matchMethod = methodFilter === 'All' || s.paymentMethod === methodFilter;
      const matchDate = !dateFilter || s.date.startsWith(dateFilter);
      return matchSearch && matchMethod && matchDate;
    });
  }, [sales, search, methodFilter, dateFilter]);

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
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
            Sales & Invoices ({filtered.length})
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Review completed invoices, reprint customer receipts, and initiate returns
          </p>
        </div>

        <button
          type="button"
          onClick={() => setActiveRoute('pos')}
          className="rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-medium text-white hover:bg-teal-800 dark:bg-teal-600"
        >
          New POS Sale
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="relative sm:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice # or customer name..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs dark:border-slate-700 dark:bg-slate-800"
          />
        </div>
        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value as 'All' | PaymentMethod)}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
        >
          <option value="All">All Payment Methods</option>
          <option value="Cash">Cash</option>
          <option value="Card">Card</option>
          <option value="Bank Transfer">Bank Transfer</option>
          <option value="Other">Other</option>
        </select>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          aria-label="Filter by invoice date"
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
                <th className="px-4 py-3 font-medium">Invoice #</th>
                <th className="px-3 py-3 font-medium">Date & Cashier</th>
                <th className="px-3 py-3 font-medium">Customer</th>
                <th className="px-3 py-3 font-medium">Payment</th>
                <th className="px-3 py-3 text-right font-medium">Total</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-mono font-semibold text-slate-900 dark:text-slate-100">
                    {s.invoiceNumber}
                  </td>
                  <td className="px-3 py-3">
                    <p>{formatDateTime(s.date)}</p>
                    <p className="text-[11px] text-slate-400">Cashier: {s.cashierName}</p>
                  </td>
                  <td className="px-3 py-3 font-medium">{s.customerName}</td>
                  <td className="px-3 py-3 text-slate-600 dark:text-slate-400">{s.paymentMethod}</td>
                  <td className="px-3 py-3 text-right font-mono font-semibold tabular-nums">
                    {formatCurrencyExact(s.grandTotal, settings.currencySymbol)}
                  </td>
                  <td className="px-3 py-3">
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
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPrintSale(s)}
                        className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-[11px] font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                      >
                        <Printer className="h-3 w-3" />
                        <span>Invoice</span>
                      </button>
                      {s.paymentStatus !== 'Refunded' && (
                        <button
                          type="button"
                          onClick={() => setReturnTarget(s)}
                          className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-[11px] font-medium text-amber-700 hover:bg-amber-50 dark:border-slate-700 dark:text-amber-400 dark:hover:bg-amber-950/30"
                        >
                          <RotateCcw className="h-3 w-3" />
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
      </div>

      {/* Return Modal */}
      <Modal
        open={Boolean(returnTarget)}
        onClose={() => setReturnTarget(null)}
        title={`Process Return for ${returnTarget?.invoiceNumber ?? ''}`}
        subtitle={`Full refund of ${formatCurrencyExact(returnTarget?.grandTotal ?? 0, settings.currencySymbol)}`}
        size="sm"
      >
        <form onSubmit={handleConfirmReturn} className="space-y-4 text-xs">
          <div>
            <label className="mb-1 block font-medium">Return Reason *</label>
            <textarea
              rows={2}
              required
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <label className="flex items-center gap-2 font-medium">
            <input
              type="checkbox"
              checked={restockable}
              onChange={(e) => setRestockable(e.target.checked)}
              className="h-4 w-4 accent-teal-700"
            />
            <span>Sealed & Resalable — Return quantities back to inventory</span>
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setReturnTarget(null)}
              className="rounded-lg border border-slate-200 px-4 py-2 font-medium dark:border-slate-700"
            >
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-teal-700 px-4 py-2 font-medium text-white hover:bg-teal-800">
              Confirm Refund
            </button>
          </div>
        </form>
      </Modal>

      <PrintableInvoiceModal sale={printSale} onClose={() => setPrintSale(null)} />
    </div>
  );
};

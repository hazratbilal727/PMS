import React, { useState } from 'react';
import { Plus, RotateCcw } from 'lucide-react';
import { formatCurrencyExact, formatDate } from '../lib/utils';
import { usePMS } from '../services/pmsStore';
import type { PaymentMethod } from '../types';
import { Modal } from '../components/ui/Modal';
import { StatusText } from '../components/ui/StatusText';

export const ReturnsPage: React.FC = () => {
  const { returns, sales, settings, processReturn } = usePMS();
  const [modalOpen, setModalOpen] = useState(false);

  const eligibleSales = sales.filter((s) => s.paymentStatus !== 'Refunded');
  const [selectedSaleId, setSelectedSaleId] = useState(eligibleSales[0]?.id ?? '');
  const [refundMethod, setRefundMethod] = useState<PaymentMethod>('Cash');
  const [reason, setReason] = useState('');
  const [restockable, setRestockable] = useState(true);

  const selectedSale = sales.find((s) => s.id === selectedSaleId);

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
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
            Returns & Refunds ({returns.length})
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Process customer medicine returns, manage sealed restocking, and audit refund payouts
          </p>
        </div>

        <button
          type="button"
          disabled={eligibleSales.length === 0}
          onClick={() => {
            setSelectedSaleId(eligibleSales[0]?.id ?? '');
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-medium text-white hover:bg-teal-800 disabled:opacity-50 dark:bg-teal-600"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Process Return</span>
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs text-slate-500">Total Returns Logged</p>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums">{returns.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs text-slate-500">Total Refunded Value</p>
          <p className="mt-1 font-mono text-2xl font-bold text-red-600 tabular-nums dark:text-red-400">
            {formatCurrencyExact(totalRefunded, settings.currencySymbol)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs text-slate-500">Eligible Open Invoices</p>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums">{eligibleSales.length}</p>
        </div>
      </div>

      {/* Refund Ledger */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
                <th className="px-4 py-3 font-medium">Return #</th>
                <th className="px-3 py-3 font-medium">Invoice / Customer</th>
                <th className="px-3 py-3 font-medium">Returned Items</th>
                <th className="px-3 py-3 font-medium">Reason</th>
                <th className="px-3 py-3 text-right font-medium">Refund</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {returns.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3">
                    <p className="font-mono font-semibold">{r.returnNumber}</p>
                    <p className="text-[11px] text-slate-400">{formatDate(r.date)}</p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-mono font-medium">{r.invoiceNumber}</p>
                    <p className="text-[11px] text-slate-500">{r.customerName}</p>
                  </td>
                  <td className="px-3 py-3">
                    {r.items.map((i, idx) => (
                      <p key={idx}>
                        {i.medicineName} × {i.quantity} ({i.restockable ? 'Restocked' : 'Damaged'})
                      </p>
                    ))}
                  </td>
                  <td className="px-3 py-3 max-w-xs text-slate-600 dark:text-slate-400">{r.reason}</td>
                  <td className="px-3 py-3 text-right font-mono font-semibold tabular-nums">
                    <p>{formatCurrencyExact(r.refundAmount, settings.currencySymbol)}</p>
                    <p className="text-[11px] font-normal text-slate-400">{r.refundMethod}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusText label={r.status} tone="ok" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Process Return Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Process Customer Return & Refund" size="md">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="mb-1 block font-medium">Select Invoice</label>
            <select
              value={selectedSaleId}
              onChange={(e) => setSelectedSaleId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
            >
              {eligibleSales.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.invoiceNumber} — {s.customerName} ({formatCurrencyExact(s.grandTotal, settings.currencySymbol)})
                </option>
              ))}
            </select>
          </div>
          {selectedSale && (
            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
              <p className="font-semibold">Items on {selectedSale.invoiceNumber}:</p>
              <ul className="mt-1 space-y-1 text-slate-600 dark:text-slate-300">
                {selectedSale.items.map((item, idx) => (
                  <li key={idx}>
                    {item.medicineName} × {item.quantity}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <label className="mb-1 block font-medium">Refund Method</label>
            <select
              value={refundMethod}
              onChange={(e) => setRefundMethod(e.target.value as PaymentMethod)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="Cash">Cash</option>
              <option value="Card">Card Reversal</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block font-medium">Return Reason *</label>
            <textarea
              rows={2}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Prescription modified by physician within 48h"
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
            <span>Packaging unopened & safe — restock items into active inventory</span>
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 font-medium dark:border-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 font-medium text-white hover:bg-teal-800"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Confirm Refund</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

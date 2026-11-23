import React, { useState } from 'react';
import { CheckCircle2, Eye, Plus, Printer, Trash2 } from 'lucide-react';
import { REFERENCE_TODAY } from '../lib/constants';
import { formatCurrency, formatDate } from '../lib/utils';
import { usePMS } from '../services/pmsStore';
import type { PaymentStatus, PurchaseItem, PurchaseOrder } from '../types';
import { Modal } from '../components/ui/Modal';
import { StatusText } from '../components/ui/StatusText';

export const PurchasesPage: React.FC = () => {
  const { purchases, suppliers, medicines, settings, createPurchaseOrder, receivePurchaseOrder } = usePMS();

  const [createOpen, setCreateOpen] = useState(false);
  const [viewPO, setViewPO] = useState<PurchaseOrder | null>(null);

  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? '');
  const [expectedDate, setExpectedDate] = useState('2026-11-26');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<PurchaseItem[]>([
    {
      medicineId: medicines[0]?.id ?? '',
      medicineName: medicines[0]?.name ?? '',
      batchNumber: 'NEW-26A1',
      quantity: 20,
      purchasePrice: medicines[0]?.purchasePrice ?? 100,
      manufacturingDate: '2026-08-01',
      expiryDate: '2028-08-01',
      lineTotal: (medicines[0]?.purchasePrice ?? 100) * 20,
    },
  ]);

  const subtotal = items.reduce((s, i) => s + i.quantity * i.purchasePrice, 0);
  const totalAmount = Math.max(0, subtotal - discountAmount + taxAmount);

  const addLine = () => {
    const med = medicines[0];
    if (!med) return;
    setItems((prev) => [
      ...prev,
      {
        medicineId: med.id,
        medicineName: med.name,
        batchNumber: `B-${Math.floor(1000 + Math.random() * 9000)}`,
        quantity: 10,
        purchasePrice: med.purchasePrice,
        manufacturingDate: '2026-08-01',
        expiryDate: '2028-08-01',
        lineTotal: med.purchasePrice * 10,
      },
    ]);
  };

  const updateLine = (idx: number, patch: Partial<PurchaseItem>) => {
    setItems((prev) =>
      prev.map((line, i) => {
        if (i !== idx) return line;
        const merged = { ...line, ...patch };
        if (patch.medicineId) {
          const med = medicines.find((m) => m.id === patch.medicineId);
          if (med) {
            merged.medicineName = med.name;
            merged.purchasePrice = med.purchasePrice;
          }
        }
        merged.lineTotal = merged.quantity * merged.purchasePrice;
        return merged;
      })
    );
  };

  const removeLine = (idx: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find((s) => s.id === supplierId);
    if (!sup || items.length === 0) return;

    const paymentStatus: PaymentStatus =
      paidAmount >= totalAmount ? 'Paid' : paidAmount > 0 ? 'Partial' : 'Pending';

    createPurchaseOrder({
      date: REFERENCE_TODAY,
      supplierId: sup.id,
      supplierName: sup.companyName,
      items,
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount,
      paidAmount,
      paymentStatus,
      stockStatus: 'Pending',
      expectedDate,
      notes,
    });
    setCreateOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
            Purchase Orders & Receiving ({purchases.length})
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Issue distributor purchase orders, inspect incoming batches, and check stock into inventory
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-medium text-white hover:bg-teal-800 dark:bg-teal-600"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Create Purchase Order</span>
        </button>
      </div>

      {/* PO Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
                <th className="px-4 py-3 font-medium">PO Number</th>
                <th className="px-3 py-3 font-medium">Order Date</th>
                <th className="px-3 py-3 font-medium">Supplier</th>
                <th className="px-3 py-3 text-right font-medium">Items</th>
                <th className="px-3 py-3 text-right font-medium">Total Amount</th>
                <th className="px-3 py-3 font-medium">Payment</th>
                <th className="px-3 py-3 font-medium">Receiving Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {purchases.map((po) => (
                <tr key={po.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-mono font-semibold text-slate-900 dark:text-slate-100">
                    {po.poNumber}
                  </td>
                  <td className="px-3 py-3 text-slate-500">{formatDate(po.date)}</td>
                  <td className="px-3 py-3 font-medium">{po.supplierName}</td>
                  <td className="px-3 py-3 text-right font-mono tabular-nums">{po.items.length}</td>
                  <td className="px-3 py-3 text-right font-mono font-semibold tabular-nums">
                    {formatCurrency(po.totalAmount, settings.currencySymbol)}
                  </td>
                  <td className="px-3 py-3">
                    <StatusText
                      label={po.paymentStatus}
                      tone={po.paymentStatus === 'Paid' ? 'ok' : 'warning'}
                      showIcon={false}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <StatusText
                      label={po.stockStatus}
                      tone={po.stockStatus === 'Received' ? 'ok' : 'warning'}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {po.stockStatus !== 'Received' && (
                        <button
                          type="button"
                          onClick={() => receivePurchaseOrder(po.id)}
                          className="inline-flex items-center gap-1 rounded bg-teal-700 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-teal-800"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Receive Stock</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setViewPO(po)}
                        className="rounded p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        aria-label={`View ${po.poNumber}`}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Purchase Order Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Purchase Order"
        size="xl"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="mb-1 block font-medium">Supplier *</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.companyName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block font-medium">Expected Delivery Date</label>
              <input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Purchase Line Items</span>
              <button
                type="button"
                onClick={addLine}
                className="inline-flex items-center gap-1 text-teal-700 hover:underline dark:text-teal-400"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Medicine Line</span>
              </button>
            </div>

            <div className="space-y-2">
              {items.map((line, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-12 dark:border-slate-800"
                >
                  <div className="sm:col-span-4">
                    <label className="mb-1 block text-[11px] text-slate-400">Medicine</label>
                    <select
                      value={line.medicineId}
                      onChange={(e) => updateLine(idx, { medicineId: e.target.value })}
                      className="w-full rounded border border-slate-200 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-800"
                    >
                      {medicines.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-[11px] text-slate-400">Batch</label>
                    <input
                      type="text"
                      value={line.batchNumber}
                      onChange={(e) => updateLine(idx, { batchNumber: e.target.value })}
                      className="w-full rounded border border-slate-200 px-2 py-1.5 font-mono dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="mb-1 block text-[11px] text-slate-400">Qty</label>
                    <input
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) => updateLine(idx, { quantity: Number(e.target.value) })}
                      className="w-full rounded border border-slate-200 px-2 py-1.5 font-mono dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-[11px] text-slate-400">Unit Cost</label>
                    <input
                      type="number"
                      min={1}
                      value={line.purchasePrice}
                      onChange={(e) => updateLine(idx, { purchasePrice: Number(e.target.value) })}
                      className="w-full rounded border border-slate-200 px-2 py-1.5 font-mono dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-[11px] text-slate-400">Expiry</label>
                    <input
                      type="date"
                      value={line.expiryDate}
                      onChange={(e) => updateLine(idx, { expiryDate: e.target.value })}
                      className="w-full rounded border border-slate-200 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                  <div className="flex items-end justify-end sm:col-span-1">
                    <button
                      type="button"
                      onClick={() => removeLine(idx)}
                      className="rounded p-1.5 text-slate-400 hover:text-red-600"
                      aria-label="Remove line"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div>
              <label className="mb-1 block font-medium">Discount ({settings.currencySymbol})</label>
              <input
                type="number"
                min={0}
                value={discountAmount}
                onChange={(e) => setDiscountAmount(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="mb-1 block font-medium">Tax ({settings.currencySymbol})</label>
              <input
                type="number"
                min={0}
                value={taxAmount}
                onChange={(e) => setTaxAmount(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="mb-1 block font-medium">Advance Paid ({settings.currencySymbol})</label>
              <input
                type="number"
                min={0}
                value={paidAmount}
                onChange={(e) => setPaidAmount(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div className="flex flex-col justify-end rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
              <span className="text-[11px] text-slate-400">Net PO Total</span>
              <span className="font-mono text-sm font-bold text-teal-700 tabular-nums dark:text-teal-400">
                {formatCurrency(totalAmount, settings.currencySymbol)}
              </span>
            </div>
          </div>

          <div>
            <label className="mb-1 block font-medium">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional delivery or cold-chain instructions"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 font-medium dark:border-slate-700"
            >
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-teal-700 px-4 py-2 font-medium text-white hover:bg-teal-800">
              Issue Purchase Order
            </button>
          </div>
        </form>
      </Modal>

      {/* Purchase Invoice View Modal */}
      <Modal
        open={Boolean(viewPO)}
        onClose={() => setViewPO(null)}
        title={`Purchase Invoice ${viewPO?.poNumber ?? ''}`}
        subtitle={viewPO?.supplierName}
        size="lg"
        footer={
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-xs font-medium text-white hover:bg-teal-800"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Purchase Invoice</span>
          </button>
        }
      >
        {viewPO && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
              <div>
                <p className="text-slate-400">Supplier</p>
                <p className="font-semibold">{viewPO.supplierName}</p>
                <p className="text-slate-500">Order Date: {formatDate(viewPO.date)}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400">Receiving & Payment</p>
                <p className="font-semibold">{viewPO.stockStatus}</p>
                <p className="text-slate-500">
                  Paid: {formatCurrency(viewPO.paidAmount, settings.currencySymbol)} /{' '}
                  {formatCurrency(viewPO.totalAmount, settings.currencySymbol)}
                </p>
              </div>
            </div>

            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                  <th className="py-2 font-medium">Medicine</th>
                  <th className="py-2 font-medium">Batch / Expiry</th>
                  <th className="py-2 text-right font-medium">Qty</th>
                  <th className="py-2 text-right font-medium">Unit Cost</th>
                  <th className="py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {viewPO.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 font-medium">{item.medicineName}</td>
                    <td className="py-2.5 font-mono text-[11px] text-slate-500">
                      {item.batchNumber} · {formatDate(item.expiryDate)}
                    </td>
                    <td className="py-2.5 text-right font-mono tabular-nums">{item.quantity}</td>
                    <td className="py-2.5 text-right font-mono tabular-nums">
                      {formatCurrency(item.purchasePrice, settings.currencySymbol)}
                    </td>
                    <td className="py-2.5 text-right font-mono font-semibold tabular-nums">
                      {formatCurrency(item.lineTotal, settings.currencySymbol)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
};

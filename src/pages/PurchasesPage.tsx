import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  CreditCard,
  Eye,
  FileSpreadsheet,
  Plus,
  Printer,
  Trash2,
} from 'lucide-react';
import { REFERENCE_TODAY } from '../lib/constants';
import { formatCurrency, formatDate } from '../lib/utils';
import { usePMS } from '../services/pmsStore';
import type { PaymentStatus, PurchaseItem, PurchaseOrder } from '../types';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { PaginationBar } from '../components/ui/PaginationBar';
import { SearchInput } from '../components/ui/SearchInput';
import { StatusText } from '../components/ui/StatusText';

export const PurchasesPage: React.FC = () => {
  const {
    purchases,
    suppliers,
    medicines,
    settings,
    createPurchaseOrder,
    receivePurchaseOrder,
    recordPurchasePayment,
    deletePurchaseOrder,
    quickActionIntent,
    clearQuickActionIntent,
  } = usePMS();

  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<'All' | PurchaseOrder['stockStatus']>('All');
  const [paymentFilter, setPaymentFilter] = useState<'All' | PaymentStatus>('All');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [createOpen, setCreateOpen] = useState(false);
  const [viewPO, setViewPO] = useState<PurchaseOrder | null>(null);
  const [payPO, setPayPO] = useState<PurchaseOrder | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<PurchaseOrder | null>(null);

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

  const openCreateModal = (prefillLowStock = false) => {
    const lowStockMeds = prefillLowStock
      ? medicines.filter((m) => m.availableQuantity <= m.minimumStockLevel).slice(0, 4)
      : [];
    if (lowStockMeds.length > 0) {
      setSupplierId(lowStockMeds[0].supplierId || suppliers[0]?.id || '');
      setItems(
        lowStockMeds.map((m) => {
          const qty = Math.max(20, m.minimumStockLevel * 2 - m.availableQuantity);
          return {
            medicineId: m.id,
            medicineName: m.name,
            batchNumber: `B-${Math.floor(1000 + Math.random() * 9000)}`,
            quantity: qty,
            purchasePrice: m.purchasePrice,
            manufacturingDate: '2026-09-01',
            expiryDate: '2028-09-01',
            lineTotal: qty * m.purchasePrice,
          };
        })
      );
      setNotes('Replenishment PO for low-stock SKUs');
    } else if (medicines[0]) {
      setSupplierId(suppliers[0]?.id ?? '');
      setItems([
        {
          medicineId: medicines[0].id,
          medicineName: medicines[0].name,
          batchNumber: `NEW-${Math.floor(1000 + Math.random() * 9000)}`,
          quantity: 20,
          purchasePrice: medicines[0].purchasePrice,
          manufacturingDate: '2026-08-01',
          expiryDate: '2028-08-01',
          lineTotal: medicines[0].purchasePrice * 20,
        },
      ]);
      setNotes('');
    }
    setDiscountAmount(0);
    setTaxAmount(0);
    setPaidAmount(0);
    setCreateOpen(true);
  };

  useEffect(() => {
    if (quickActionIntent === 'new-po') {
      openCreateModal(true);
      clearQuickActionIntent();
    }
  }, [quickActionIntent]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return purchases.filter((po) => {
      const matchSearch =
        !q || po.poNumber.toLowerCase().includes(q) || po.supplierName.toLowerCase().includes(q);
      const matchStock = stockFilter === 'All' || po.stockStatus === stockFilter;
      const matchPay = paymentFilter === 'All' || po.paymentStatus === paymentFilter;
      return matchSearch && matchStock && matchPay;
    });
  }, [purchases, search, stockFilter, paymentFilter]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

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

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payPO || payAmount <= 0) return;
    recordPurchasePayment(payPO.id, payAmount);
    setPayPO(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Purchase Orders & Receiving (${purchases.length})`}
        description="Issue distributor purchase orders, inspect incoming batches, settle payables, and receive stock into inventory"
        actions={
          <button type="button" onClick={() => openCreateModal(false)} className="pms-btn-primary">
            <Plus className="h-4 w-4" />
            <span>Create Purchase Order</span>
          </button>
        }
      />

      {/* Search & Filters */}
      <div className="pms-card grid grid-cols-1 gap-3.5 p-4 sm:grid-cols-4">
        <SearchInput
          value={search}
          onValueChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search PO number or supplier..."
          containerClassName="sm:col-span-2"
        />
        <select
          value={stockFilter}
          onChange={(e) => {
            setStockFilter(e.target.value as typeof stockFilter);
            setPage(1);
          }}
          aria-label="Filter by receiving status"
          className="pms-select"
        >
          <option value="All">All Receiving Status</option>
          <option value="Pending">Pending Receipt</option>
          <option value="Received">Received</option>
          <option value="Partial">Partial</option>
        </select>
        <select
          value={paymentFilter}
          onChange={(e) => {
            setPaymentFilter(e.target.value as typeof paymentFilter);
            setPage(1);
          }}
          aria-label="Filter by payment status"
          className="pms-select"
        >
          <option value="All">All Payment Status</option>
          <option value="Paid">Paid</option>
          <option value="Partial">Partial</option>
          <option value="Pending">Pending</option>
        </select>
      </div>

      {/* PO Table */}
      <div className="pms-card overflow-hidden">
        {paged.length === 0 ? (
          <EmptyState
            icon={FileSpreadsheet}
            title="No purchase orders match your filters"
            description="Adjust your search or status filters, or create a new distributor purchase order."
            actionLabel="Reset Filters"
            onAction={() => {
              setSearch('');
              setStockFilter('All');
              setPaymentFilter('All');
              setPage(1);
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                  <th className="px-5 py-3.5">PO Number</th>
                  <th className="px-4 py-3.5">Order Date</th>
                  <th className="px-4 py-3.5">Supplier</th>
                  <th className="px-4 py-3.5 text-right">Items</th>
                  <th className="px-4 py-3.5 text-right">Total / Paid</th>
                  <th className="px-4 py-3.5">Payment</th>
                  <th className="px-4 py-3.5">Receiving</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paged.map((po) => {
                  const balanceDue = Math.max(0, po.totalAmount - po.paidAmount);
                  return (
                    <tr key={po.id} className="transition-colors hover:bg-slate-50/75 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-3.5 font-mono font-semibold text-slate-900 dark:text-slate-100">
                        {po.poNumber}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">{formatDate(po.date)}</td>
                      <td className="px-4 py-3.5 font-medium text-slate-800 dark:text-slate-200">{po.supplierName}</td>
                      <td className="px-4 py-3.5 text-right font-mono tabular-nums">{po.items.length}</td>
                      <td className="px-4 py-3.5 text-right font-mono tabular-nums">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {formatCurrency(po.totalAmount, settings.currencySymbol)}
                        </p>
                        {balanceDue > 0 && (
                          <p className="text-xs text-amber-700 dark:text-amber-400">
                            Due: {formatCurrency(balanceDue, settings.currencySymbol)}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusText
                          label={po.paymentStatus}
                          tone={po.paymentStatus === 'Paid' ? 'ok' : 'warning'}
                          showIcon={false}
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusText
                          label={po.stockStatus}
                          tone={po.stockStatus === 'Received' ? 'ok' : 'warning'}
                        />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {po.stockStatus !== 'Received' && (
                            <button
                              type="button"
                              onClick={() => receivePurchaseOrder(po.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-teal-800"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Receive</span>
                            </button>
                          )}
                          {balanceDue > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setPayPO(po);
                                setPayAmount(balanceDue);
                              }}
                              title="Record Payment"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-teal-700 transition-colors hover:bg-teal-50 dark:border-slate-700 dark:text-teal-400 dark:hover:bg-teal-950/30"
                            >
                              <CreditCard className="h-3.5 w-3.5" />
                              <span>Pay</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setViewPO(po)}
                            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                            aria-label={`View ${po.poNumber}`}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {po.stockStatus === 'Pending' && (
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(po)}
                              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                              aria-label={`Delete ${po.poNumber}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
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

      {/* Create Purchase Order Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Purchase Order"
        size="xl"
      >
        <form onSubmit={handleCreate} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="pms-label">Supplier *</label>
              <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="pms-select">
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.companyName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="pms-label">Expected Delivery Date</label>
              <input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="pms-input"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-display text-sm font-semibold">Purchase Line Items</span>
              <button
                type="button"
                onClick={addLine}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:underline dark:text-teal-400"
              >
                <Plus className="h-4 w-4" />
                <span>Add Medicine Line</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {items.map((line, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 gap-2.5 rounded-xl border border-slate-200 p-3.5 sm:grid-cols-12 dark:border-slate-800"
                >
                  <div className="sm:col-span-4">
                    <label className="pms-label">Medicine</label>
                    <select
                      value={line.medicineId}
                      onChange={(e) => updateLine(idx, { medicineId: e.target.value })}
                      className="pms-select"
                    >
                      {medicines.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="pms-label">Batch</label>
                    <input
                      type="text"
                      value={line.batchNumber}
                      onChange={(e) => updateLine(idx, { batchNumber: e.target.value })}
                      className="pms-input font-mono"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="pms-label">Qty</label>
                    <input
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) => updateLine(idx, { quantity: Number(e.target.value) })}
                      className="pms-input px-2 font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="pms-label">Unit Cost</label>
                    <input
                      type="number"
                      min={1}
                      value={line.purchasePrice}
                      onChange={(e) => updateLine(idx, { purchasePrice: Number(e.target.value) })}
                      className="pms-input font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="pms-label">Expiry</label>
                    <input
                      type="date"
                      value={line.expiryDate}
                      onChange={(e) => updateLine(idx, { expiryDate: e.target.value })}
                      className="pms-input px-2.5"
                    />
                  </div>
                  <div className="flex items-end justify-end sm:col-span-1">
                    <button
                      type="button"
                      onClick={() => removeLine(idx)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      aria-label="Remove line"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div>
              <label className="pms-label">Discount ({settings.currencySymbol})</label>
              <input
                type="number"
                min={0}
                value={discountAmount}
                onChange={(e) => setDiscountAmount(Number(e.target.value))}
                className="pms-input font-mono"
              />
            </div>
            <div>
              <label className="pms-label">Tax ({settings.currencySymbol})</label>
              <input
                type="number"
                min={0}
                value={taxAmount}
                onChange={(e) => setTaxAmount(Number(e.target.value))}
                className="pms-input font-mono"
              />
            </div>
            <div>
              <label className="pms-label">Advance Paid ({settings.currencySymbol})</label>
              <input
                type="number"
                min={0}
                value={paidAmount}
                onChange={(e) => setPaidAmount(Number(e.target.value))}
                className="pms-input font-mono"
              />
            </div>
            <div className="flex flex-col justify-center rounded-xl bg-slate-50 px-4 py-2.5 dark:bg-slate-800/60">
              <span className="text-xs text-slate-400">Net PO Total</span>
              <span className="font-mono text-base font-bold text-teal-700 tabular-nums dark:text-teal-400">
                {formatCurrency(totalAmount, settings.currencySymbol)}
              </span>
            </div>
          </div>

          <div>
            <label className="pms-label">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional delivery or cold-chain instructions"
              className="pms-input"
            />
          </div>

          <div className="flex justify-end gap-2.5 border-t border-slate-200 pt-4 dark:border-slate-800">
            <button type="button" onClick={() => setCreateOpen(false)} className="pms-btn-secondary">
              Cancel
            </button>
            <button type="submit" className="pms-btn-primary">
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
          <button type="button" onClick={() => window.print()} className="pms-btn-primary">
            <Printer className="h-4 w-4" />
            <span>Print Purchase Invoice</span>
          </button>
        }
      >
        {viewPO && (
          <div className="space-y-5 text-sm">
            <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
              <div>
                <p className="text-xs text-slate-400">Supplier</p>
                <p className="font-semibold">{viewPO.supplierName}</p>
                <p className="text-xs text-slate-500">Order Date: {formatDate(viewPO.date)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Receiving & Payment</p>
                <p className="font-semibold">{viewPO.stockStatus}</p>
                <p className="text-xs text-slate-500">
                  Paid: {formatCurrency(viewPO.paidAmount, settings.currencySymbol)} /{' '}
                  {formatCurrency(viewPO.totalAmount, settings.currencySymbol)}
                </p>
              </div>
            </div>

            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800">
                  <th className="py-2.5">Medicine</th>
                  <th className="py-2.5">Batch / Expiry</th>
                  <th className="py-2.5 text-right">Qty</th>
                  <th className="py-2.5 text-right">Unit Cost</th>
                  <th className="py-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {viewPO.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-3 font-medium">{item.medicineName}</td>
                    <td className="py-3 font-mono text-xs text-slate-500">
                      {item.batchNumber} · {formatDate(item.expiryDate)}
                    </td>
                    <td className="py-3 text-right font-mono tabular-nums">{item.quantity}</td>
                    <td className="py-3 text-right font-mono tabular-nums">
                      {formatCurrency(item.purchasePrice, settings.currencySymbol)}
                    </td>
                    <td className="py-3 text-right font-mono font-semibold tabular-nums">
                      {formatCurrency(item.lineTotal, settings.currencySymbol)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      {/* Record Purchase Payment Modal */}
      <Modal
        open={Boolean(payPO)}
        onClose={() => setPayPO(null)}
        title={`Pay Purchase Order ${payPO?.poNumber ?? ''}`}
        subtitle={payPO?.supplierName}
        size="sm"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div>
            <label className="pms-label">
              Payment Amount ({settings.currencySymbol}) — Max Due:{' '}
              {formatCurrency(Math.max(0, (payPO?.totalAmount ?? 0) - (payPO?.paidAmount ?? 0)), settings.currencySymbol)}
            </label>
            <input
              type="number"
              min={1}
              max={Math.max(1, (payPO?.totalAmount ?? 0) - (payPO?.paidAmount ?? 0))}
              value={payAmount}
              onChange={(e) => setPayAmount(Number(e.target.value))}
              className="pms-input font-mono"
            />
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <button type="button" onClick={() => setPayPO(null)} className="pms-btn-secondary">
              Cancel
            </button>
            <button type="submit" className="pms-btn-primary">
              Record Payment
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deletePurchaseOrder(deleteTarget.id);
        }}
        title="Delete Pending Purchase Order"
        message={`Remove pending purchase order ${deleteTarget?.poNumber} (${deleteTarget?.supplierName})? Received purchase orders cannot be deleted.`}
        confirmLabel="Delete PO"
        tone="danger"
      />
    </div>
  );
};

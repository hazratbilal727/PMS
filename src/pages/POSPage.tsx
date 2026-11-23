import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Barcode,
  CheckCircle2,
  History,
  Minus,
  Plus,
  Printer,
  ShoppingBag,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { DOSAGE_FORMS } from '../lib/constants';
import { formatCurrencyExact, formatDateTime, getExpiryStatus } from '../lib/utils';
import { usePMS } from '../services/pmsStore';
import type { DosageForm, Medicine, PaymentMethod, PaymentStatus, Sale, SaleItem } from '../types';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { SearchInput } from '../components/ui/SearchInput';
import { PrintableInvoiceModal } from '../components/dialogs/PrintableInvoiceModal';

interface CartLine {
  medicine: Medicine;
  quantity: number;
}

export const POSPage: React.FC = () => {
  const {
    medicines,
    customers,
    sales,
    settings,
    completeSale,
    addCustomer,
    posDraft,
    clearPosDraft,
    pushToast,
  } = usePMS();

  const [search, setSearch] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [dosageFilter, setDosageFilter] = useState<'All' | DosageForm>('All');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('cust-walkin');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(settings.applyTaxOnMedicines ? settings.defaultTaxPercent : 0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Paid');
  const [amountTendered, setAmountTendered] = useState<string>('');
  const [linkedPrescriptionId, setLinkedPrescriptionId] = useState<string | undefined>(undefined);
  const [receiptSale, setReceiptSale] = useState<Sale | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Quick Add Customer Modal
  const [custModalOpen, setCustModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustCity, setNewCustCity] = useState('Lahore');

  // Consume Prescription -> POS draft handoff
  useEffect(() => {
    if (!posDraft) return;
    const loadedLines: CartLine[] = [];
    posDraft.items.forEach((d) => {
      const med = medicines.find((m) => m.id === d.medicineId);
      if (med && med.availableQuantity > 0) {
        loadedLines.push({ medicine: med, quantity: Math.min(d.quantity, med.availableQuantity) });
      }
    });
    if (loadedLines.length > 0) setCart(loadedLines);
    if (posDraft.customerId) setSelectedCustomerId(posDraft.customerId);
    if (posDraft.prescriptionId) setLinkedPrescriptionId(posDraft.prescriptionId);
    clearPosDraft();
  }, [posDraft, medicines, clearPosDraft]);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  const filteredMedicines = useMemo(() => {
    const q = search.trim().toLowerCase();
    return medicines.filter((m) => {
      const matchesForm = dosageFilter === 'All' || m.dosageForm === dosageFilter;
      const matchesQuery =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.genericName.toLowerCase().includes(q) ||
        m.medicineCode.toLowerCase().includes(q) ||
        m.barcode.includes(q);
      return matchesForm && matchesQuery;
    });
  }, [medicines, search, dosageFilter]);

  const addToCart = (med: Medicine) => {
    if (med.availableQuantity <= 0) {
      pushToast(`${med.name} is out of stock`, 'error');
      return;
    }
    if (getExpiryStatus(med.expiryDate).severity === 'critical') {
      pushToast(`Blocked: ${med.name} batch ${med.batchNumber} is expired`, 'error');
      return;
    }
    setCart((prev) => {
      const existing = prev.find((c) => c.medicine.id === med.id);
      if (existing) {
        if (existing.quantity >= med.availableQuantity) {
          pushToast(`Maximum stock (${med.availableQuantity}) reached for ${med.name}`, 'info');
          return prev;
        }
        return prev.map((c) => (c.medicine.id === med.id ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [...prev, { medicine: med, quantity: 1 }];
    });
  };

  const updateCartQty = (medId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.medicine.id !== medId) return c;
          const next = c.quantity + delta;
          if (next <= 0) return null;
          if (next > c.medicine.availableQuantity) {
            pushToast(`Only ${c.medicine.availableQuantity} packs available`, 'info');
            return c;
          }
          return { ...c, quantity: next };
        })
        .filter(Boolean) as CartLine[]
    );
  };

  const removeCartItem = (medId: string) => {
    setCart((prev) => prev.filter((c) => c.medicine.id !== medId));
  };

  const scanBarcode = (rawCode: string) => {
    const code = rawCode.trim();
    if (!code) return;
    const found = medicines.find(
      (m) => m.barcode === code || m.medicineCode.toLowerCase() === code.toLowerCase()
    );
    if (!found) {
      pushToast(`No medicine matched barcode "${code}"`, 'error');
      return;
    }
    addToCart(found);
    setBarcodeInput('');
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    scanBarcode(barcodeInput);
  };

  const totals = useMemo(() => {
    const subtotal = cart.reduce((sum, c) => sum + c.medicine.sellingPrice * c.quantity, 0);
    const discountAmount = Math.round((subtotal * discountPercent) / 100);
    const afterDiscount = Math.max(0, subtotal - discountAmount);
    const taxAmount = Math.round((afterDiscount * taxPercent) / 100);
    const grandTotal = afterDiscount + taxAmount;
    const tenderedNum = Number(amountTendered) || 0;
    const changeDue = paymentMethod === 'Cash' && tenderedNum > 0 ? tenderedNum - grandTotal : 0;
    return { subtotal, discountAmount, taxAmount, grandTotal, tenderedNum, changeDue };
  }, [cart, discountPercent, taxPercent, amountTendered, paymentMethod]);

  const clinicalAlerts = useMemo(() => {
    const alerts: string[] = [];
    const hasRx = cart.some((c) => c.medicine.prescriptionRequired);
    if (hasRx && !linkedPrescriptionId) {
      alerts.push('Cart includes Rx-only medicine(s). Verify physical prescription before dispensing.');
    }
    if (selectedCustomer?.allergies && selectedCustomer.allergies.toLowerCase() !== 'none documented') {
      const allergyLower = selectedCustomer.allergies.toLowerCase();
      const conflict = cart.find(
        (c) =>
          (allergyLower.includes('penicillin') &&
            (c.medicine.genericName.toLowerCase().includes('amoxicillin') ||
              c.medicine.name.toLowerCase().includes('augmentin'))) ||
          allergyLower.includes(c.medicine.genericName.toLowerCase())
      );
      if (conflict) {
        alerts.push(
          `ALLERGY ALERT: ${selectedCustomer.name} has documented allergy (${selectedCustomer.allergies}) which may conflict with ${conflict.medicine.name}.`
        );
      }
    }
    return alerts;
  }, [cart, linkedPrescriptionId, selectedCustomer]);

  const handleCompleteSale = () => {
    if (cart.length === 0) {
      pushToast('Add at least one medicine to cart', 'error');
      return;
    }
    const items: SaleItem[] = cart.map((c) => ({
      medicineId: c.medicine.id,
      medicineName: c.medicine.name,
      medicineCode: c.medicine.medicineCode,
      batchNumber: c.medicine.batchNumber,
      quantity: c.quantity,
      unitPrice: c.medicine.sellingPrice,
      discountPercent: 0,
      lineTotal: c.medicine.sellingPrice * c.quantity,
    }));

    const completed = completeSale({
      customerId: selectedCustomerId,
      items,
      subtotal: totals.subtotal,
      discountAmount: totals.discountAmount,
      taxAmount: totals.taxAmount,
      grandTotal: totals.grandTotal,
      paymentMethod,
      paymentStatus,
      prescriptionId: linkedPrescriptionId,
    });

    setCart([]);
    setDiscountPercent(0);
    setAmountTendered('');
    setLinkedPrescriptionId(undefined);
    setReceiptSale(completed);
  };

  const handleCreateQuickCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) {
      pushToast('Customer name and phone are required', 'error');
      return;
    }
    const created = addCustomer({
      name: newCustName.trim(),
      phone: newCustPhone.trim(),
      city: newCustCity.trim() || 'Lahore',
      outstandingBalance: 0,
    });
    setSelectedCustomerId(created.id);
    setNewCustName('');
    setNewCustPhone('');
    setCustModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Point of Sale (POS)"
        description="Rapid dispensing terminal · Barcode lookup, clinical allergy check, cash change & invoice printing"
        actions={
          <>
            {sales[0] && (
              <button
                type="button"
                onClick={() => setReceiptSale(sales[0])}
                className="pms-btn-secondary"
              >
                <Printer className="h-4 w-4" />
                <span>Print Last Receipt</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className="pms-btn-secondary"
            >
              <History className="h-4 w-4" />
              <span>POS Sales History ({sales.length})</span>
            </button>
          </>
        }
      />

      {/* Main Split Workspace */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Product Catalog & Barcode Scanner (7 cols) */}
        <div className="pms-card lg:col-span-7 flex flex-col gap-5 p-5 sm:p-6">
          {/* Search + Barcode Row */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <SearchInput
              size="lg"
              value={search}
              onValueChange={setSearch}
              placeholder="Search medicine name, generic, code..."
              aria-label="Search POS catalog"
            />

            <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Barcode className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Scan barcode (e.g. 8964001001029)"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/75 pl-10 pr-3.5 font-mono text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-600/10 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100"
                />
              </div>
              <button
                type="submit"
                className="pms-btn-secondary h-11 px-4"
              >
                Scan
              </button>
            </form>
          </div>

          {/* Quick Test Barcode Strip */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-medium">Quick Scan:</span>
            {[
              { code: '8964001001029', label: 'Panadol 500mg' },
              { code: '8964001001012', label: 'Augmentin 625mg' },
              { code: '8964001001067', label: 'Glucophage 500mg' },
            ].map((b) => (
              <button
                key={b.code}
                type="button"
                onClick={() => scanBarcode(b.code)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs text-slate-700 transition-colors hover:border-teal-600 hover:text-teal-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                {b.label} ({b.code.slice(-4)})
              </button>
            ))}
          </div>

          {/* Dosage Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {(['All', ...DOSAGE_FORMS] as const).map((form) => (
              <button
                key={form}
                type="button"
                onClick={() => setDosageFilter(form)}
                className={`rounded-xl px-3.5 py-2 text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors ${
                  dosageFilter === form
                    ? 'bg-teal-700 text-white dark:bg-teal-600'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {form}
              </button>
            ))}
          </div>

          {/* Medicine Selection Grid */}
          {filteredMedicines.length === 0 ? (
            <EmptyState
              title="No matching medicines"
              description="Try clearing your search query or switching dosage form filters."
              actionLabel="Reset Filters"
              onAction={() => {
                setSearch('');
                setDosageFilter('All');
              }}
            />
          ) : (
            <div className="grid max-h-[600px] grid-cols-1 gap-3.5 overflow-y-auto pr-1 sm:grid-cols-2">
              {filteredMedicines.map((med) => {
                const exp = getExpiryStatus(med.expiryDate);
                const isExpired = exp.severity === 'critical';
                const outOfStock = med.availableQuantity <= 0;
                return (
                  <button
                    key={med.id}
                    type="button"
                    disabled={isExpired || outOfStock}
                    onClick={() => addToCart(med)}
                    className={`flex items-start gap-3.5 rounded-2xl border p-3.5 text-left transition-all ${
                      isExpired || outOfStock
                        ? 'cursor-not-allowed border-slate-200 bg-slate-50/70 opacity-60 dark:border-slate-800 dark:bg-slate-800/40'
                        : 'border-slate-200 bg-white hover:border-teal-600 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:hover:border-teal-500'
                    }`}
                  >
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-100 dark:border-slate-800 dark:bg-slate-800">
                      <img
                        src={med.imageUrl}
                        alt={med.name}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{med.name}</p>
                        <span className="shrink-0 font-mono text-sm font-bold text-teal-700 tabular-nums dark:text-teal-400">
                          {formatCurrencyExact(med.sellingPrice, settings.currencySymbol)}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                        {med.genericName} · {med.packSize}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span
                          className={`font-mono tabular-nums ${
                            isExpired
                              ? 'font-semibold text-red-600 dark:text-red-400'
                              : med.availableQuantity <= med.minimumStockLevel
                              ? 'font-semibold text-amber-700 dark:text-amber-400'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {isExpired ? 'EXPIRED' : outOfStock ? 'OUT OF STOCK' : `Stock: ${med.availableQuantity}`}
                        </span>
                        <span className="text-slate-400">
                          {med.prescriptionRequired ? 'Rx Required' : 'OTC'}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Active Cart & Checkout (5 cols) */}
        <div className="pms-card lg:col-span-5 flex flex-col justify-between p-5 sm:p-6">
          <div className="space-y-4">
            {/* Customer Selection */}
            <div className="flex items-end gap-2.5">
              <div className="flex-1">
                <label className="pms-label">Patient / Customer</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="pms-select"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => setCustModalOpen(true)}
                title="Add new customer"
                className="pms-btn-secondary px-3.5"
              >
                <UserPlus className="h-4 w-4" />
                <span>New</span>
              </button>
            </div>

            {linkedPrescriptionId && (
              <div className="flex items-center justify-between rounded-xl border border-teal-200 bg-teal-50/70 px-3.5 py-2.5 text-[13px] text-teal-800 dark:border-teal-800 dark:bg-teal-950/30 dark:text-teal-300">
                <span>Linked Prescription Active</span>
                <button type="button" onClick={() => setLinkedPrescriptionId(undefined)} className="font-semibold underline">
                  Unlink
                </button>
              </div>
            )}

            {/* Clinical Warnings */}
            {clinicalAlerts.map((msg, i) => (
              <div
                key={i}
                className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs ${
                  msg.startsWith('ALLERGY')
                    ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300'
                    : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300'
                }`}
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="leading-relaxed">{msg}</span>
              </div>
            ))}

            {/* Cart Items */}
            <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Dispensing Cart ({cart.reduce((s, c) => s + c.quantity, 0)} items)
                </span>
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCart([])}
                    className="text-[13px] font-medium text-red-600 hover:underline dark:text-red-400"
                  >
                    Clear Cart
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-10 text-center dark:border-slate-800">
                  <ShoppingBag className="h-8 w-8 text-slate-300 dark:text-slate-700" />
                  <p className="mt-2.5 text-sm font-medium text-slate-600 dark:text-slate-400">Cart is empty</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Select medicines on the left or scan a barcode
                  </p>
                </div>
              ) : (
                <div className="max-h-64 space-y-2.5 overflow-y-auto pr-1">
                  {cart.map((line) => (
                    <div
                      key={line.medicine.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/75 px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-800/50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                          {line.medicine.name}
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-slate-500 tabular-nums">
                          {formatCurrencyExact(line.medicine.sellingPrice, settings.currencySymbol)} × {line.quantity} ={' '}
                          <strong className="text-slate-800 dark:text-slate-200">
                            {formatCurrencyExact(line.medicine.sellingPrice * line.quantity, settings.currencySymbol)}
                          </strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateCartQty(line.medicine.id, -1)}
                          aria-label="Decrease quantity"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-7 text-center font-mono text-sm font-semibold tabular-nums">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQty(line.medicine.id, 1)}
                          aria-label="Increase quantity"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeCartItem(line.medicine.id)}
                          aria-label="Remove item"
                          className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Billing Controls & Totals */}
          <div className="mt-5 space-y-4 border-t border-slate-200 pt-4 dark:border-slate-800">
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="pms-label">Discount (%)</label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Math.max(0, Math.min(50, Number(e.target.value))))}
                  className="pms-input font-mono tabular-nums"
                />
              </div>
              <div>
                <label className="pms-label">Tax (%)</label>
                <input
                  type="number"
                  min={0}
                  max={25}
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(Math.max(0, Math.min(25, Number(e.target.value))))}
                  className="pms-input font-mono tabular-nums"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="pms-label">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="pms-select"
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="pms-label">Payment Status</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                  className="pms-select"
                >
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending (Credit)</option>
                  <option value="Partial">Partial</option>
                </select>
              </div>
            </div>

            {paymentMethod === 'Cash' && paymentStatus === 'Paid' && (
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="pms-label">
                    Cash Tendered ({settings.currencySymbol})
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={amountTendered}
                    onChange={(e) => setAmountTendered(e.target.value)}
                    placeholder={String(totals.grandTotal)}
                    className="pms-input font-mono tabular-nums"
                  />
                </div>
                <div className="flex flex-col justify-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 dark:border-slate-700 dark:bg-slate-800">
                  <span className="text-xs text-slate-400">Change Due</span>
                  <span
                    className={`font-mono text-sm font-bold tabular-nums ${
                      totals.changeDue < 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-emerald-700 dark:text-emerald-400'
                    }`}
                  >
                    {totals.tenderedNum > 0
                      ? formatCurrencyExact(totals.changeDue, settings.currencySymbol)
                      : '—'}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2 rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-800/60">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums">
                  {formatCurrencyExact(totals.subtotal, settings.currencySymbol)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Discount ({discountPercent}%)</span>
                <span className="font-mono tabular-nums">
                  -{formatCurrencyExact(totals.discountAmount, settings.currencySymbol)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Tax ({taxPercent}%)</span>
                <span className="font-mono tabular-nums">
                  {formatCurrencyExact(totals.taxAmount, settings.currencySymbol)}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2.5 text-base font-bold text-slate-900 dark:border-slate-700 dark:text-slate-100">
                <span>Grand Total</span>
                <span className="font-mono tabular-nums text-teal-700 dark:text-teal-400">
                  {formatCurrencyExact(totals.grandTotal, settings.currencySymbol)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCompleteSale}
              disabled={cart.length === 0}
              className="pms-btn-primary h-12 w-full text-sm font-semibold"
            >
              <CheckCircle2 className="h-5 w-5" />
              <span>Complete Sale & Generate Invoice</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add Customer Quick Modal */}
      <Modal open={custModalOpen} onClose={() => setCustModalOpen(false)} title="Add Walk-in / Registered Customer" size="sm">
        <form onSubmit={handleCreateQuickCustomer} className="space-y-4">
          <div>
            <label className="pms-label">Full Name *</label>
            <input
              type="text"
              required
              value={newCustName}
              onChange={(e) => setNewCustName(e.target.value)}
              placeholder="e.g. Muhammad Zubair"
              className="pms-input"
            />
          </div>
          <div>
            <label className="pms-label">Phone Number *</label>
            <input
              type="text"
              required
              value={newCustPhone}
              onChange={(e) => setNewCustPhone(e.target.value)}
              placeholder="+92 300 0000000"
              className="pms-input"
            />
          </div>
          <div>
            <label className="pms-label">City</label>
            <input
              type="text"
              value={newCustCity}
              onChange={(e) => setNewCustCity(e.target.value)}
              className="pms-input"
            />
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setCustModalOpen(false)}
              className="pms-btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="pms-btn-primary">
              Save Customer
            </button>
          </div>
        </form>
      </Modal>

      {/* POS Sales History Modal */}
      <Modal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title="Recent POS Invoices"
        subtitle="Click any invoice to view or print receipt"
        size="lg"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800">
                <th className="py-3 pr-3">Invoice</th>
                <th className="py-3 pr-3">Date</th>
                <th className="py-3 pr-3">Customer</th>
                <th className="py-3 pr-3">Method</th>
                <th className="py-3 pr-3 text-right">Total</th>
                <th className="py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sales.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="py-3 pr-3 font-mono font-medium">{s.invoiceNumber}</td>
                  <td className="py-3 pr-3 text-slate-500">{formatDateTime(s.date)}</td>
                  <td className="py-3 pr-3">{s.customerName}</td>
                  <td className="py-3 pr-3 text-slate-500">{s.paymentMethod}</td>
                  <td className="py-3 pr-3 text-right font-mono font-semibold tabular-nums">
                    {formatCurrencyExact(s.grandTotal, settings.currencySymbol)}
                  </td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setHistoryOpen(false);
                        setReceiptSale(s);
                      }}
                      className="inline-flex items-center gap-1.5 font-medium text-teal-700 hover:underline dark:text-teal-400"
                    >
                      <Printer className="h-4 w-4" />
                      <span>Print</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      <PrintableInvoiceModal sale={receiptSale} onClose={() => setReceiptSale(null)} />
    </div>
  );
};

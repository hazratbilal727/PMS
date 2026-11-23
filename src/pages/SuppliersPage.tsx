import React, { useMemo, useState } from 'react';
import { CreditCard, Edit2, Eye, Plus, Search, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/utils';
import { validateSupplierForm } from '../lib/validations';
import { usePMS } from '../services/pmsStore';
import type { PaymentMethod, Supplier } from '../types';
import { Modal } from '../components/ui/Modal';
import { StatusText } from '../components/ui/StatusText';

export const SuppliersPage: React.FC = () => {
  const {
    suppliers,
    purchases,
    settings,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    recordSupplierPayment,
  } = usePMS();

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [viewSup, setViewSup] = useState<Supplier | null>(null);
  const [paySup, setPaySup] = useState<Supplier | null>(null);

  // Supplier Form
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Lahore');
  const [ntnNumber, setNtnNumber] = useState('');
  const [outstandingBalance, setOutstandingBalance] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Payment Form
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Bank Transfer');
  const [payRef, setPayRef] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return suppliers.filter(
      (s) =>
        !q ||
        s.companyName.toLowerCase().includes(q) ||
        s.contactPerson.toLowerCase().includes(q) ||
        s.ntnNumber.includes(q)
    );
  }, [suppliers, search]);

  const openAdd = () => {
    setEditing(null);
    setCompanyName('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setAddress('');
    setCity('Lahore');
    setNtnNumber('');
    setOutstandingBalance(0);
    setErrors({});
    setFormOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditing(s);
    setCompanyName(s.companyName);
    setContactPerson(s.contactPerson);
    setPhone(s.phone);
    setEmail(s.email);
    setAddress(s.address);
    setCity(s.city);
    setNtnNumber(s.ntnNumber);
    setOutstandingBalance(s.outstandingBalance);
    setErrors({});
    setFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const v = validateSupplierForm({ companyName, contactPerson, phone, email });
    if (!v.valid) {
      setErrors(v.errors);
      return;
    }
    if (editing) {
      updateSupplier(editing.id, {
        companyName,
        contactPerson,
        phone,
        email,
        address,
        city,
        ntnNumber,
        outstandingBalance,
      });
    } else {
      addSupplier({
        companyName,
        contactPerson,
        phone,
        email,
        address,
        city,
        ntnNumber,
        outstandingBalance,
        status: 'Active',
      });
    }
    setFormOpen(false);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paySup || payAmount <= 0) return;
    recordSupplierPayment(paySup.id, payAmount, payMethod, payRef || 'MANUAL-PMT');
    setPaySup(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
            Suppliers & Distributors ({suppliers.length})
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pharmaceutical distributors, NTN tax records, purchase history, and payable settlements
          </p>
        </div>

        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-medium text-white hover:bg-teal-800 dark:bg-teal-600"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Supplier</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search company, contact person or NTN..."
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs dark:border-slate-700 dark:bg-slate-900"
        />
      </div>

      {/* Suppliers Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
                <th className="px-4 py-3 font-medium">Company & NTN</th>
                <th className="px-3 py-3 font-medium">Contact Person</th>
                <th className="px-3 py-3 font-medium">City / Phone</th>
                <th className="px-3 py-3 text-right font-medium">Total Supplied</th>
                <th className="px-3 py-3 text-right font-medium">Outstanding Balance</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{s.companyName}</p>
                    <p className="font-mono text-[11px] text-slate-400">NTN: {s.ntnNumber || '—'}</p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-medium">{s.contactPerson}</p>
                    <p className="text-[11px] text-slate-400">{s.email}</p>
                  </td>
                  <td className="px-3 py-3">
                    <p>{s.city}</p>
                    <p className="font-mono text-[11px] text-slate-500">{s.phone}</p>
                  </td>
                  <td className="px-3 py-3 text-right font-mono tabular-nums">
                    {formatCurrency(s.totalSuppliedValue, settings.currencySymbol)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-semibold tabular-nums">
                    <span className={s.outstandingBalance > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-500'}>
                      {formatCurrency(s.outstandingBalance, settings.currencySymbol)}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <StatusText label={s.status} tone={s.status === 'Active' ? 'ok' : 'neutral'} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      {s.outstandingBalance > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setPaySup(s);
                            setPayAmount(s.outstandingBalance);
                            setPayRef('');
                          }}
                          title="Record Payment"
                          className="rounded p-1.5 text-teal-700 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-950/30"
                        >
                          <CreditCard className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setViewSup(s)}
                        aria-label={`View ${s.companyName}`}
                        className="rounded p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(s)}
                        aria-label={`Edit ${s.companyName}`}
                        className="rounded p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSupplier(s.id)}
                        aria-label={`Delete ${s.companyName}`}
                        className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Supplier Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit Supplier' : 'Add Pharmaceutical Supplier'}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block font-medium">Company Name *</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
              {errors.companyName && <p className="mt-1 text-[11px] text-red-600">{errors.companyName}</p>}
            </div>
            <div>
              <label className="mb-1 block font-medium">Contact Person *</label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
              {errors.contactPerson && <p className="mt-1 text-[11px] text-red-600">{errors.contactPerson}</p>}
            </div>
            <div>
              <label className="mb-1 block font-medium">Phone *</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
              {errors.phone && <p className="mt-1 text-[11px] text-red-600">{errors.phone}</p>}
            </div>
            <div>
              <label className="mb-1 block font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
              {errors.email && <p className="mt-1 text-[11px] text-red-600">{errors.email}</p>}
            </div>
            <div>
              <label className="mb-1 block font-medium">NTN / Tax ID</label>
              <input
                type="text"
                value={ntnNumber}
                onChange={(e) => setNtnNumber(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="mb-1 block font-medium">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="mb-1 block font-medium">Opening Balance ({settings.currencySymbol})</label>
              <input
                type="number"
                value={outstandingBalance}
                onChange={(e) => setOutstandingBalance(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block font-medium">Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 font-medium dark:border-slate-700"
            >
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-teal-700 px-4 py-2 font-medium text-white hover:bg-teal-800">
              Save Supplier
            </button>
          </div>
        </form>
      </Modal>

      {/* Supplier Details & History Modal */}
      <Modal
        open={Boolean(viewSup)}
        onClose={() => setViewSup(null)}
        title={viewSup?.companyName ?? 'Supplier Profile'}
        subtitle={viewSup ? `NTN: ${viewSup.ntnNumber} · ${viewSup.city}` : ''}
        size="lg"
      >
        {viewSup && (
          <div className="space-y-5 text-xs">
            <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
              <div>
                <p className="text-slate-400">Primary Contact</p>
                <p className="font-semibold">{viewSup.contactPerson}</p>
                <p className="text-slate-500">{viewSup.phone} · {viewSup.email}</p>
              </div>
              <div>
                <p className="text-slate-400">Address & Balance</p>
                <p className="font-medium">{viewSup.address}</p>
                <p className="mt-0.5 font-mono font-semibold text-amber-700 dark:text-amber-400">
                  Payable: {formatCurrency(viewSup.outstandingBalance, settings.currencySymbol)}
                </p>
              </div>
            </div>

            <div>
              <h4 className="mb-2 font-semibold">Purchase Orders</h4>
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40">
                      <th className="px-3 py-2 font-medium">PO Number</th>
                      <th className="px-3 py-2 font-medium">Date</th>
                      <th className="px-3 py-2 text-right font-medium">Amount</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {purchases
                      .filter((p) => p.supplierId === viewSup.id)
                      .map((p) => (
                        <tr key={p.id}>
                          <td className="px-3 py-2 font-mono font-medium">{p.poNumber}</td>
                          <td className="px-3 py-2">{formatDate(p.date)}</td>
                          <td className="px-3 py-2 text-right font-mono tabular-nums">
                            {formatCurrency(p.totalAmount, settings.currencySymbol)}
                          </td>
                          <td className="px-3 py-2">{p.stockStatus}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h4 className="mb-2 font-semibold">Payment History</h4>
              {viewSup.paymentHistory.length === 0 ? (
                <p className="text-slate-400">No payments recorded yet.</p>
              ) : (
                <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                  {viewSup.paymentHistory.map((pmt) => (
                    <li key={pmt.id} className="flex items-center justify-between px-3 py-2">
                      <span>
                        {formatDate(pmt.date)} · {pmt.method} ({pmt.reference})
                      </span>
                      <span className="font-mono font-semibold tabular-nums">
                        {formatCurrency(pmt.amount, settings.currencySymbol)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Record Supplier Payment Modal */}
      <Modal
        open={Boolean(paySup)}
        onClose={() => setPaySup(null)}
        title="Record Supplier Payment"
        subtitle={paySup?.companyName}
        size="sm"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
          <div>
            <label className="mb-1 block font-medium">Payment Amount ({settings.currencySymbol})</label>
            <input
              type="number"
              min={1}
              value={payAmount}
              onChange={(e) => setPayAmount(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="mb-1 block font-medium">Method</label>
            <select
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Other">Cheque / Other</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block font-medium">Transaction / Cheque Reference</label>
            <input
              type="text"
              required
              value={payRef}
              onChange={(e) => setPayRef(e.target.value)}
              placeholder="e.g. HBL-IBFT-99402"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setPaySup(null)}
              className="rounded-lg border border-slate-200 px-4 py-2 font-medium dark:border-slate-700"
            >
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-teal-700 px-4 py-2 font-medium text-white hover:bg-teal-800">
              Record Payment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

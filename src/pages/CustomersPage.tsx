import React, { useMemo, useState } from 'react';
import { ArrowUpDown, CreditCard, Edit2, Eye, Plus, Trash2, Users } from 'lucide-react';
import { formatCurrency, formatDate, formatDateTime } from '../lib/utils';
import { validateCustomerForm } from '../lib/validations';
import { usePMS } from '../services/pmsStore';
import type { Customer, Sale } from '../types';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { PaginationBar } from '../components/ui/PaginationBar';
import { SearchInput } from '../components/ui/SearchInput';
import { PrintableInvoiceModal } from '../components/dialogs/PrintableInvoiceModal';

export const CustomersPage: React.FC = () => {
  const {
    customers,
    sales,
    settings,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    recordCustomerPayment,
  } = usePMS();

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'totalVisits' | 'totalSpending' | 'outstandingBalance'>('totalSpending');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null);
  const [printInvoice, setPrintInvoice] = useState<Sale | null>(null);
  const [settleTarget, setSettleTarget] = useState<Customer | null>(null);
  const [settleAmount, setSettleAmount] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Lahore');
  const [address, setAddress] = useState('');
  const [allergies, setAllergies] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = customers.filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.email ?? '').toLowerCase().includes(q) ||
        (c.allergies ?? '').toLowerCase().includes(q)
    );
    const factor = sortDir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name) * factor;
      if (sortBy === 'totalVisits') return (a.totalVisits - b.totalVisits) * factor;
      if (sortBy === 'totalSpending') return (a.totalSpending - b.totalSpending) * factor;
      return (a.outstandingBalance - b.outstandingBalance) * factor;
    });
  }, [customers, search, sortBy, sortDir]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(col);
      setSortDir('desc');
    }
    setPage(1);
  };

  const openAdd = () => {
    setEditing(null);
    setName('');
    setPhone('');
    setEmail('');
    setCity('Lahore');
    setAddress('');
    setAllergies('');
    setErrors({});
    setFormOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setName(c.name);
    setPhone(c.phone);
    setEmail(c.email ?? '');
    setCity(c.city ?? 'Lahore');
    setAddress(c.address ?? '');
    setAllergies(c.allergies ?? '');
    setErrors({});
    setFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const v = validateCustomerForm({ name, phone });
    if (!v.valid) {
      setErrors(v.errors);
      return;
    }
    if (editing) {
      updateCustomer(editing.id, { name, phone, email, city, address, allergies });
    } else {
      addCustomer({ name, phone, email, city, address, allergies, outstandingBalance: 0 });
    }
    setFormOpen(false);
  };

  const handleSettleBalance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleTarget || settleAmount <= 0) return;
    recordCustomerPayment(settleTarget.id, settleAmount);
    setSettleTarget(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Customer & Patient Profiles (${customers.length})`}
        description="Patient allergy notes, lifetime spending, credit balance settlements, and invoice history"
        actions={
          <button type="button" onClick={openAdd} className="pms-btn-primary">
            <Plus className="h-4 w-4" />
            <span>Add Customer</span>
          </button>
        }
      />

      <div className="pms-card p-4">
        <SearchInput
          value={search}
          onValueChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search customer by name, phone, email or allergy..."
          containerClassName="max-w-md"
        />
      </div>

      <div className="pms-card overflow-hidden">
        {paged.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No customer profiles found"
            description="No patients or customers matched your search query."
            actionLabel="Clear Search"
            onAction={() => {
              setSearch('');
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
                      onClick={() => toggleSort('name')}
                      className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-100"
                    >
                      <span>Patient / Customer</span>
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="px-4 py-3.5">Contact</th>
                  <th className="px-4 py-3.5">Allergy Notes</th>
                  <th className="px-4 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => toggleSort('totalVisits')}
                      className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-100"
                    >
                      <span>Visits</span>
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="px-4 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => toggleSort('totalSpending')}
                      className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-100"
                    >
                      <span>Total Spending</span>
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="px-4 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => toggleSort('outstandingBalance')}
                      className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-100"
                    >
                      <span>Balance Due</span>
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paged.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-slate-50/75 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{c.name}</p>
                      <p className="text-xs text-slate-400">
                        {c.city || 'Lahore'} · Last: {formatDate(c.lastVisitDate)}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-mono text-slate-700 dark:text-slate-300">{c.phone}</p>
                      <p className="text-xs text-slate-400">{c.email || '—'}</p>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">
                      {c.allergies ? (
                        <span className="font-medium text-amber-700 dark:text-amber-400">{c.allergies}</span>
                      ) : (
                        'None documented'
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono tabular-nums">{c.totalVisits}</td>
                    <td className="px-4 py-3.5 text-right font-mono font-semibold tabular-nums">
                      {formatCurrency(c.totalSpending, settings.currencySymbol)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono tabular-nums">
                      <span
                        className={
                          c.outstandingBalance > 0
                            ? 'font-semibold text-red-600 dark:text-red-400'
                            : 'text-slate-400'
                        }
                      >
                        {formatCurrency(c.outstandingBalance, settings.currencySymbol)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        {c.outstandingBalance > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setSettleTarget(c);
                              setSettleAmount(c.outstandingBalance);
                            }}
                            title="Settle Credit Balance"
                            className="rounded-lg p-2 text-teal-700 transition-colors hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-950/30"
                          >
                            <CreditCard className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setViewCustomer(c)}
                          aria-label={`View ${c.name}`}
                          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(c)}
                          aria-label={`Edit ${c.name}`}
                          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {c.id !== 'cust-walkin' && (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(c)}
                            aria-label={`Delete ${c.name}`}
                            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* Add/Edit Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit Customer Profile' : 'Add New Customer'}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="pms-label">Full Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pms-input"
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>
            <div>
              <label className="pms-label">Phone *</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pms-input font-mono"
              />
              {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
            </div>
            <div>
              <label className="pms-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pms-input"
              />
            </div>
            <div>
              <label className="pms-label">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="pms-input"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="pms-label">Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="pms-input"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="pms-label">Documented Drug Allergies</label>
              <input
                type="text"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="e.g. Penicillin, Sulfa drugs"
                className="pms-input"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <button type="button" onClick={() => setFormOpen(false)} className="pms-btn-secondary">
              Cancel
            </button>
            <button type="submit" className="pms-btn-primary">
              Save Customer
            </button>
          </div>
        </form>
      </Modal>

      {/* Settle Balance Modal */}
      <Modal
        open={Boolean(settleTarget)}
        onClose={() => setSettleTarget(null)}
        title="Settle Customer Credit Balance"
        subtitle={settleTarget?.name}
        size="sm"
      >
        <form onSubmit={handleSettleBalance} className="space-y-4">
          <div>
            <label className="pms-label">
              Amount Received ({settings.currencySymbol}) — Outstanding:{' '}
              {formatCurrency(settleTarget?.outstandingBalance ?? 0, settings.currencySymbol)}
            </label>
            <input
              type="number"
              min={1}
              max={Math.max(1, settleTarget?.outstandingBalance ?? 1)}
              value={settleAmount}
              onChange={(e) => setSettleAmount(Number(e.target.value))}
              className="pms-input font-mono"
            />
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <button type="button" onClick={() => setSettleTarget(null)} className="pms-btn-secondary">
              Cancel
            </button>
            <button type="submit" className="pms-btn-primary">
              Record Payment
            </button>
          </div>
        </form>
      </Modal>

      {/* Customer Purchase History Modal */}
      <Modal
        open={Boolean(viewCustomer)}
        onClose={() => setViewCustomer(null)}
        title={viewCustomer?.name ?? 'Customer Profile'}
        subtitle={viewCustomer ? `${viewCustomer.phone} · ${viewCustomer.address || viewCustomer.city || ''}` : ''}
        size="lg"
      >
        {viewCustomer && (
          <div className="space-y-5 text-sm">
            <div className="grid grid-cols-3 gap-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
              <div>
                <p className="text-xs text-slate-400">Total Spending</p>
                <p className="mt-0.5 font-mono text-lg font-bold text-teal-700 tabular-nums dark:text-teal-400">
                  {formatCurrency(viewCustomer.totalSpending, settings.currencySymbol)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Outstanding Credit</p>
                <p className="mt-0.5 font-mono text-lg font-bold tabular-nums">
                  {formatCurrency(viewCustomer.outstandingBalance, settings.currencySymbol)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Drug Allergies</p>
                <p className="mt-0.5 font-semibold text-amber-700 dark:text-amber-400">
                  {viewCustomer.allergies || 'None'}
                </p>
              </div>
            </div>

            <div>
              <h4 className="mb-2.5 font-display text-sm font-semibold">Invoice & Purchase History</h4>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
                      <th className="px-4 py-2.5">Invoice</th>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5">Method</th>
                      <th className="px-4 py-2.5 text-right">Amount</th>
                      <th className="px-4 py-2.5 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {sales.filter((s) => s.customerId === viewCustomer.id).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-5 text-center text-slate-400">
                          No invoices recorded for this patient yet.
                        </td>
                      </tr>
                    ) : (
                      sales
                        .filter((s) => s.customerId === viewCustomer.id)
                        .map((s) => (
                          <tr key={s.id}>
                            <td className="px-4 py-2.5 font-mono font-medium">{s.invoiceNumber}</td>
                            <td className="px-4 py-2.5 text-slate-500">{formatDateTime(s.date)}</td>
                            <td className="px-4 py-2.5">{s.paymentMethod}</td>
                            <td className="px-4 py-2.5 text-right font-mono font-semibold tabular-nums">
                              {formatCurrency(s.grandTotal, settings.currencySymbol)}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => setPrintInvoice(s)}
                                className="font-medium text-teal-700 hover:underline dark:text-teal-400"
                              >
                                View Invoice
                              </button>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteCustomer(deleteTarget.id);
        }}
        title="Delete Customer Profile"
        message={`Are you sure you want to delete "${deleteTarget?.name}" from the patient registry? Past sales invoices will remain preserved.`}
        confirmLabel="Delete Profile"
        tone="danger"
      />

      <PrintableInvoiceModal sale={printInvoice} onClose={() => setPrintInvoice(null)} />
    </div>
  );
};

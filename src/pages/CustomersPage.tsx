import React, { useMemo, useState } from 'react';
import { Edit2, Eye, Plus, Search, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate, formatDateTime } from '../lib/utils';
import { validateCustomerForm } from '../lib/validations';
import { usePMS } from '../services/pmsStore';
import type { Customer, Sale } from '../types';
import { Modal } from '../components/ui/Modal';
import { PrintableInvoiceModal } from '../components/dialogs/PrintableInvoiceModal';

export const CustomersPage: React.FC = () => {
  const { customers, sales, settings, addCustomer, updateCustomer, deleteCustomer } = usePMS();

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null);
  const [printInvoice, setPrintInvoice] = useState<Sale | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Lahore');
  const [address, setAddress] = useState('');
  const [allergies, setAllergies] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.email ?? '').toLowerCase().includes(q)
    );
  }, [customers, search]);

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

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
            Customer & Patient Profiles ({customers.length})
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Patient allergy notes, lifetime spending, credit balances, and invoice history
          </p>
        </div>

        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-medium text-white hover:bg-teal-800 dark:bg-teal-600"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Customer</span>
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customer by name, phone or email..."
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs dark:border-slate-700 dark:bg-slate-900"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
                <th className="px-4 py-3 font-medium">Patient / Customer</th>
                <th className="px-3 py-3 font-medium">Contact</th>
                <th className="px-3 py-3 font-medium">Allergy Notes</th>
                <th className="px-3 py-3 text-right font-medium">Visits</th>
                <th className="px-3 py-3 text-right font-medium">Total Spending</th>
                <th className="px-3 py-3 text-right font-medium">Balance Due</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{c.name}</p>
                    <p className="text-[11px] text-slate-400">{c.city || 'Lahore'} · Last: {formatDate(c.lastVisitDate)}</p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-mono">{c.phone}</p>
                    <p className="text-[11px] text-slate-400">{c.email || '—'}</p>
                  </td>
                  <td className="px-3 py-3 text-slate-600 dark:text-slate-400">
                    {c.allergies ? (
                      <span className="font-medium text-amber-700 dark:text-amber-400">{c.allergies}</span>
                    ) : (
                      'None documented'
                    )}
                  </td>
                  <td className="px-3 py-3 text-right font-mono tabular-nums">{c.totalVisits}</td>
                  <td className="px-3 py-3 text-right font-mono font-semibold tabular-nums">
                    {formatCurrency(c.totalSpending, settings.currencySymbol)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono tabular-nums">
                    <span className={c.outstandingBalance > 0 ? 'font-semibold text-red-600 dark:text-red-400' : 'text-slate-400'}>
                      {formatCurrency(c.outstandingBalance, settings.currencySymbol)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setViewCustomer(c)}
                        aria-label={`View ${c.name}`}
                        className="rounded p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(c)}
                        aria-label={`Edit ${c.name}`}
                        className="rounded p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      {c.id !== 'cust-walkin' && (
                        <button
                          type="button"
                          onClick={() => deleteCustomer(c.id)}
                          aria-label={`Delete ${c.name}`}
                          className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

      {/* Add/Edit Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit Customer Profile' : 'Add New Customer'}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-medium">Full Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
              {errors.name && <p className="mt-1 text-[11px] text-red-600">{errors.name}</p>}
            </div>
            <div>
              <label className="mb-1 block font-medium">Phone *</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono dark:border-slate-700 dark:bg-slate-800"
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
            <div className="sm:col-span-2">
              <label className="mb-1 block font-medium">Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block font-medium">Documented Drug Allergies</label>
              <input
                type="text"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="e.g. Penicillin, Sulfa drugs"
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
              Save Customer
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
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-3 gap-3 rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
              <div>
                <p className="text-slate-400">Total Spending</p>
                <p className="font-mono text-base font-bold text-teal-700 tabular-nums dark:text-teal-400">
                  {formatCurrency(viewCustomer.totalSpending, settings.currencySymbol)}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Outstanding Credit</p>
                <p className="font-mono text-base font-bold tabular-nums">
                  {formatCurrency(viewCustomer.outstandingBalance, settings.currencySymbol)}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Drug Allergies</p>
                <p className="font-semibold text-amber-700 dark:text-amber-400">
                  {viewCustomer.allergies || 'None'}
                </p>
              </div>
            </div>

            <div>
              <h4 className="mb-2 font-semibold">Invoice & Purchase History</h4>
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40">
                      <th className="px-3 py-2 font-medium">Invoice</th>
                      <th className="px-3 py-2 font-medium">Date</th>
                      <th className="px-3 py-2 font-medium">Method</th>
                      <th className="px-3 py-2 text-right font-medium">Amount</th>
                      <th className="px-3 py-2 text-right font-medium">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {sales
                      .filter((s) => s.customerId === viewCustomer.id)
                      .map((s) => (
                        <tr key={s.id}>
                          <td className="px-3 py-2 font-mono font-medium">{s.invoiceNumber}</td>
                          <td className="px-3 py-2 text-slate-500">{formatDateTime(s.date)}</td>
                          <td className="px-3 py-2">{s.paymentMethod}</td>
                          <td className="px-3 py-2 text-right font-mono font-semibold tabular-nums">
                            {formatCurrency(s.grandTotal, settings.currencySymbol)}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => setPrintInvoice(s)}
                              className="text-teal-700 hover:underline dark:text-teal-400"
                            >
                              View Invoice
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <PrintableInvoiceModal sale={printInvoice} onClose={() => setPrintInvoice(null)} />
    </div>
  );
};

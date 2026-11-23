import React, { useMemo, useState } from 'react';
import { ArrowUpDown, Building2, CreditCard, Edit2, Eye, Plus, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/utils';
import { validateSupplierForm } from '../lib/validations';
import { usePMS } from '../services/pmsStore';
import type { PaymentMethod, Supplier } from '../types';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { PaginationBar } from '../components/ui/PaginationBar';
import { SearchInput } from '../components/ui/SearchInput';
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
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [sortBy, setSortBy] = useState<'companyName' | 'totalSuppliedValue' | 'outstandingBalance'>('companyName');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [viewSup, setViewSup] = useState<Supplier | null>(null);
  const [paySup, setPaySup] = useState<Supplier | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);

  // Supplier Form
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Lahore');
  const [ntnNumber, setNtnNumber] = useState('');
  const [outstandingBalance, setOutstandingBalance] = useState(0);
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Payment Form
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Bank Transfer');
  const [payRef, setPayRef] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = suppliers.filter((s) => {
      if (statusFilter !== 'All' && s.status !== statusFilter) return false;
      if (!q) return true;
      return (
        s.companyName.toLowerCase().includes(q) ||
        s.contactPerson.toLowerCase().includes(q) ||
        s.ntnNumber.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q)
      );
    });
    const factor = sortDir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      if (sortBy === 'companyName') return a.companyName.localeCompare(b.companyName) * factor;
      if (sortBy === 'totalSuppliedValue') return (a.totalSuppliedValue - b.totalSuppliedValue) * factor;
      return (a.outstandingBalance - b.outstandingBalance) * factor;
    });
  }, [suppliers, search, statusFilter, sortBy, sortDir]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(col);
      setSortDir('asc');
    }
    setPage(1);
  };

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
    setStatus('Active');
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
    setStatus(s.status);
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
        status,
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
        status,
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
    <div className="space-y-6">
      <PageHeader
        title={`Suppliers & Distributors (${suppliers.length})`}
        description="Pharmaceutical distributors, NTN tax records, purchase history, and payable settlements"
        actions={
          <button type="button" onClick={openAdd} className="pms-btn-primary">
            <Plus className="h-4 w-4" />
            <span>Add Supplier</span>
          </button>
        }
      />

      {/* Search & Filter */}
      <div className="pms-card flex flex-col gap-3.5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={search}
          onValueChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search company, contact person, city or NTN..."
          containerClassName="w-full max-w-md"
        />

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as typeof statusFilter);
            setPage(1);
          }}
          aria-label="Filter by supplier status"
          className="pms-select sm:w-52"
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active Only</option>
          <option value="Inactive">Inactive Only</option>
        </select>
      </div>

      {/* Suppliers Table */}
      <div className="pms-card overflow-hidden">
        {paged.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No suppliers found"
            description="No pharmaceutical suppliers matched your search or status filter."
            actionLabel="Reset Filters"
            onAction={() => {
              setSearch('');
              setStatusFilter('All');
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
                      onClick={() => toggleSort('companyName')}
                      className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-100"
                    >
                      <span>Company & NTN</span>
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="px-4 py-3.5">Contact Person</th>
                  <th className="px-4 py-3.5">City / Phone</th>
                  <th className="px-4 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => toggleSort('totalSuppliedValue')}
                      className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-100"
                    >
                      <span>Total Supplied</span>
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="px-4 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => toggleSort('outstandingBalance')}
                      className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-100"
                    >
                      <span>Outstanding Balance</span>
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
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{s.companyName}</p>
                      <p className="font-mono text-xs text-slate-400">NTN: {s.ntnNumber || '—'}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-slate-800 dark:text-slate-200">{s.contactPerson}</p>
                      <p className="text-xs text-slate-400">{s.email}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-slate-700 dark:text-slate-300">{s.city}</p>
                      <p className="font-mono text-xs text-slate-500">{s.phone}</p>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono tabular-nums">
                      {formatCurrency(s.totalSuppliedValue, settings.currencySymbol)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-semibold tabular-nums">
                      <span className={s.outstandingBalance > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-500'}>
                        {formatCurrency(s.outstandingBalance, settings.currencySymbol)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusText label={s.status} tone={s.status === 'Active' ? 'ok' : 'neutral'} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
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
                            className="rounded-lg p-2 text-teal-700 transition-colors hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-950/30"
                          >
                            <CreditCard className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setViewSup(s)}
                          aria-label={`View ${s.companyName}`}
                          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(s)}
                          aria-label={`Edit ${s.companyName}`}
                          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(s)}
                          aria-label={`Delete ${s.companyName}`}
                          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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

      {/* Add/Edit Supplier Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit Supplier' : 'Add Pharmaceutical Supplier'}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="pms-label">Company Name *</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="pms-input"
              />
              {errors.companyName && <p className="mt-1 text-xs text-red-600">{errors.companyName}</p>}
            </div>
            <div>
              <label className="pms-label">Contact Person *</label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="pms-input"
              />
              {errors.contactPerson && <p className="mt-1 text-xs text-red-600">{errors.contactPerson}</p>}
            </div>
            <div>
              <label className="pms-label">Phone *</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pms-input"
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
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>
            <div>
              <label className="pms-label">NTN / Tax ID</label>
              <input
                type="text"
                value={ntnNumber}
                onChange={(e) => setNtnNumber(e.target.value)}
                className="pms-input font-mono"
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
            <div>
              <label className="pms-label">Opening Balance ({settings.currencySymbol})</label>
              <input
                type="number"
                value={outstandingBalance}
                onChange={(e) => setOutstandingBalance(Number(e.target.value))}
                className="pms-input font-mono"
              />
            </div>
            <div>
              <label className="pms-label">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
                className="pms-select"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="pms-label">Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="pms-input"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <button type="button" onClick={() => setFormOpen(false)} className="pms-btn-secondary">
              Cancel
            </button>
            <button type="submit" className="pms-btn-primary">
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
          <div className="space-y-5 text-sm">
            <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
              <div>
                <p className="text-xs text-slate-400">Primary Contact</p>
                <p className="font-semibold">{viewSup.contactPerson}</p>
                <p className="text-xs text-slate-500">{viewSup.phone} · {viewSup.email}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Address & Balance</p>
                <p className="font-medium">{viewSup.address || '—'}</p>
                <p className="mt-0.5 font-mono font-semibold text-amber-700 dark:text-amber-400">
                  Payable: {formatCurrency(viewSup.outstandingBalance, settings.currencySymbol)}
                </p>
              </div>
            </div>

            <div>
              <h4 className="mb-2.5 font-display text-sm font-semibold">Purchase Orders</h4>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
                      <th className="px-4 py-2.5">PO Number</th>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5 text-right">Amount</th>
                      <th className="px-4 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {purchases.filter((p) => p.supplierId === viewSup.id).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-5 text-center text-slate-400">
                          No purchase orders on record for this distributor.
                        </td>
                      </tr>
                    ) : (
                      purchases
                        .filter((p) => p.supplierId === viewSup.id)
                        .map((p) => (
                          <tr key={p.id}>
                            <td className="px-4 py-2.5 font-mono font-medium">{p.poNumber}</td>
                            <td className="px-4 py-2.5">{formatDate(p.date)}</td>
                            <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                              {formatCurrency(p.totalAmount, settings.currencySymbol)}
                            </td>
                            <td className="px-4 py-2.5">{p.stockStatus}</td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h4 className="mb-2.5 font-display text-sm font-semibold">Payment History</h4>
              {viewSup.paymentHistory.length === 0 ? (
                <p className="text-slate-400">No payments recorded yet.</p>
              ) : (
                <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                  {viewSup.paymentHistory.map((pmt) => (
                    <li key={pmt.id} className="flex items-center justify-between px-4 py-2.5">
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
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div>
            <label className="pms-label">Payment Amount ({settings.currencySymbol})</label>
            <input
              type="number"
              min={1}
              value={payAmount}
              onChange={(e) => setPayAmount(Number(e.target.value))}
              className="pms-input font-mono"
            />
          </div>
          <div>
            <label className="pms-label">Method</label>
            <select
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
              className="pms-select"
            >
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Other">Cheque / Other</option>
            </select>
          </div>
          <div>
            <label className="pms-label">Transaction / Cheque Reference</label>
            <input
              type="text"
              required
              value={payRef}
              onChange={(e) => setPayRef(e.target.value)}
              placeholder="e.g. HBL-IBFT-99402"
              className="pms-input font-mono"
            />
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <button type="button" onClick={() => setPaySup(null)} className="pms-btn-secondary">
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
          if (deleteTarget) deleteSupplier(deleteTarget.id);
        }}
        title="Delete Supplier"
        message={`Are you sure you want to remove "${deleteTarget?.companyName}" from your pharmaceutical distributors directory? Historical purchase orders will remain intact.`}
        confirmLabel="Delete Supplier"
        tone="danger"
      />
    </div>
  );
};

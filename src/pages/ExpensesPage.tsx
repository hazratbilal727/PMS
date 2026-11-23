import React, { useMemo, useState } from 'react';
import { Download, Edit2, Plus, Receipt, Trash2, Wallet } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { EXPENSE_CATEGORIES, REFERENCE_TODAY } from '../lib/constants';
import { downloadCSV, formatCurrency, formatDate } from '../lib/utils';
import { validateExpenseForm } from '../lib/validations';
import { usePMS } from '../services/pmsStore';
import type { Expense, ExpenseCategory, PaymentMethod } from '../types';
import { ChartTooltip } from '../components/ui/ChartTooltip';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { KpiCard } from '../components/ui/KpiCard';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { PaginationBar } from '../components/ui/PaginationBar';
import { SearchInput } from '../components/ui/SearchInput';

export const ExpensesPage: React.FC = () => {
  const { expenses, settings, addExpense, updateExpense, deleteExpense } = usePMS();

  const [catFilter, setCatFilter] = useState<'All' | ExpenseCategory>('All');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);

  const [category, setCategory] = useState<ExpenseCategory>('Utilities & Electricity');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(REFERENCE_TODAY);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [vendor, setVendor] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return expenses.filter((e) => {
      const matchCat = catFilter === 'All' || e.category === catFilter;
      const matchDate = !dateFilter || e.date === dateFilter;
      const matchSearch =
        !q ||
        e.voucherNumber.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        (e.vendor ?? '').toLowerCase().includes(q);
      return matchCat && matchDate && matchSearch;
    });
  }, [expenses, catFilter, dateFilter, search]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalMonthly = expenses.reduce((sum, e) => sum + e.amount, 0);

  const chartData = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((e) => {
      const short = e.category.split(' ')[0];
      map.set(short, (map.get(short) ?? 0) + e.amount);
    });
    return Array.from(map.entries()).map(([categoryName, total]) => ({ categoryName, total }));
  }, [expenses]);

  const openAdd = () => {
    setEditing(null);
    setCategory('Utilities & Electricity');
    setDescription('');
    setAmount(0);
    setDate(REFERENCE_TODAY);
    setPaymentMethod('Cash');
    setVendor('');
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (e: Expense) => {
    setEditing(e);
    setCategory(e.category);
    setDescription(e.description);
    setAmount(e.amount);
    setDate(e.date);
    setPaymentMethod(e.paymentMethod);
    setVendor(e.vendor ?? '');
    setErrors({});
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const v = validateExpenseForm({ description, amount, date });
    if (!v.valid) {
      setErrors(v.errors);
      return;
    }
    if (editing) {
      updateExpense(editing.id, {
        category,
        description: description.trim(),
        amount,
        date,
        paymentMethod,
        vendor: vendor.trim() || undefined,
      });
    } else {
      addExpense({
        category,
        description: description.trim(),
        amount,
        date,
        paymentMethod,
        recordedBy: 'Dr. Ayesha Siddiqui',
        vendor: vendor.trim() || undefined,
      });
    }
    setModalOpen(false);
    setErrors({});
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Operating Expenses (${expenses.length})`}
        description="Track pharmacy utilities, cold-chain maintenance, facility lease, and consumables"
        actions={
          <>
            <button
              type="button"
              onClick={() =>
                downloadCSV(
                  'pms-expenses.csv',
                  ['Voucher', 'Date', 'Category', 'Description', 'Vendor', 'Method', 'Amount'],
                  filtered.map((e) => [
                    e.voucherNumber,
                    e.date,
                    e.category,
                    e.description,
                    e.vendor ?? '',
                    e.paymentMethod,
                    e.amount,
                  ])
                )
              }
              className="pms-btn-secondary"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
            <button type="button" onClick={openAdd} className="pms-btn-primary">
              <Plus className="h-4 w-4" />
              <span>Record Expense</span>
            </button>
          </>
        }
      />

      {/* Summary + Chart */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-4">
          <KpiCard
            label="November Total Expenses"
            value={formatCurrency(totalMonthly, settings.currencySymbol)}
            subtitle={`${expenses.length} vouchers posted this month`}
            icon={Wallet}
            tone="amber"
          />

          <div className="pms-card space-y-3.5 p-5">
            <div>
              <label className="pms-label">Search Vouchers</label>
              <SearchInput
                value={search}
                onValueChange={(val) => {
                  setSearch(val);
                  setPage(1);
                }}
                placeholder="Voucher, description or vendor..."
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="pms-label">Category</label>
                <select
                  value={catFilter}
                  onChange={(e) => {
                    setCatFilter(e.target.value as 'All' | ExpenseCategory);
                    setPage(1);
                  }}
                  className="pms-select"
                >
                  <option value="All">All Categories</option>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="pms-label">Date</label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value);
                    setPage(1);
                  }}
                  className="pms-input"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pms-card p-6 lg:col-span-2">
          <div className="mb-4">
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
              Expense Breakdown by Category
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Monthly operating outflows grouped by facility cost center
            </p>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="categoryName" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} width={64} />
                <Tooltip
                  content={
                    <ChartTooltip
                      valueFormatter={(v) => formatCurrency(Number(v), settings.currencySymbol)}
                    />
                  }
                />
                <Bar dataKey="total" name="Expense" fill="#0F766E" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Expense Table */}
      <div className="pms-card overflow-hidden">
        {paged.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No expense vouchers found"
            description="No operating expenses matched your search, date, or category filters."
            actionLabel="Reset Filters"
            onAction={() => {
              setSearch('');
              setCatFilter('All');
              setDateFilter('');
              setPage(1);
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                  <th className="px-5 py-3.5">Voucher</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Description & Vendor</th>
                  <th className="px-4 py-3.5">Method</th>
                  <th className="px-4 py-3.5 text-right">Amount</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paged.map((e) => (
                  <tr key={e.id} className="transition-colors hover:bg-slate-50/75 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3.5 font-mono font-semibold text-slate-900 dark:text-slate-100">
                      {e.voucherNumber}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">{formatDate(e.date)}</td>
                    <td className="px-4 py-3.5 font-medium text-slate-800 dark:text-slate-200">{e.category}</td>
                    <td className="px-4 py-3.5">
                      <p className="text-slate-800 dark:text-slate-200">{e.description}</p>
                      {e.vendor && <p className="text-xs text-slate-400">Vendor: {e.vendor}</p>}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">{e.paymentMethod}</td>
                    <td className="px-4 py-3.5 text-right font-mono font-semibold tabular-nums">
                      {formatCurrency(e.amount, settings.currencySymbol)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(e)}
                          aria-label={`Edit ${e.voucherNumber}`}
                          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(e)}
                          aria-label={`Delete ${e.voucherNumber}`}
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

      {/* Add/Edit Expense Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit Expense ${editing.voucherNumber}` : 'Record Operating Expense'}
        subtitle="Log pharmacy overhead, utilities, or maintenance payouts"
        size="sm"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="pms-label">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="pms-select"
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="pms-label">Description *</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="pms-input"
            />
            {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="pms-label">Amount ({settings.currencySymbol}) *</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="pms-input font-mono"
              />
              {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount}</p>}
            </div>
            <div>
              <label className="pms-label">Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="pms-input"
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
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Card">Card</option>
              </select>
            </div>
            <div>
              <label className="pms-label">Payee / Vendor</label>
              <input
                type="text"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                className="pms-input"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="pms-btn-secondary">
              Cancel
            </button>
            <button type="submit" className="pms-btn-primary">
              {editing ? 'Update Expense' : 'Save Expense'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteExpense(deleteTarget.id);
        }}
        title="Delete Expense Voucher"
        message={`Are you sure you want to delete voucher ${deleteTarget?.voucherNumber} (${deleteTarget?.description})?`}
        confirmLabel="Delete Voucher"
        tone="danger"
      />
    </div>
  );
};

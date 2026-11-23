import React, { useMemo, useState } from 'react';
import { Download, Plus } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { EXPENSE_CATEGORIES, REFERENCE_TODAY } from '../lib/constants';
import { downloadCSV, formatCurrency, formatDate } from '../lib/utils';
import { validateExpenseForm } from '../lib/validations';
import { usePMS } from '../services/pmsStore';
import type { ExpenseCategory, PaymentMethod } from '../types';
import { Modal } from '../components/ui/Modal';

export const ExpensesPage: React.FC = () => {
  const { expenses, settings, addExpense } = usePMS();

  const [catFilter, setCatFilter] = useState<'All' | ExpenseCategory>('All');
  const [modalOpen, setModalOpen] = useState(false);

  const [category, setCategory] = useState<ExpenseCategory>('Utilities & Electricity');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(REFERENCE_TODAY);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [vendor, setVendor] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = useMemo(
    () => expenses.filter((e) => catFilter === 'All' || e.category === catFilter),
    [expenses, catFilter]
  );

  const totalMonthly = expenses.reduce((sum, e) => sum + e.amount, 0);

  const chartData = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((e) => {
      const short = e.category.split(' ')[0];
      map.set(short, (map.get(short) ?? 0) + e.amount);
    });
    return Array.from(map.entries()).map(([categoryName, total]) => ({ categoryName, total }));
  }, [expenses]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const v = validateExpenseForm({ description, amount, date });
    if (!v.valid) {
      setErrors(v.errors);
      return;
    }
    addExpense({
      category,
      description: description.trim(),
      amount,
      date,
      paymentMethod,
      recordedBy: 'Dr. Ayesha Siddiqui',
      vendor: vendor.trim() || undefined,
    });
    setModalOpen(false);
    setDescription('');
    setAmount(0);
    setVendor('');
    setErrors({});
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
            Operating Expenses ({expenses.length})
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track pharmacy utilities, cold-chain maintenance, facility lease, and consumables
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              downloadCSV(
                'pms-expenses.csv',
                ['Voucher', 'Date', 'Category', 'Description', 'Vendor', 'Method', 'Amount'],
                filtered.map((e) => [e.voucherNumber, e.date, e.category, e.description, e.vendor ?? '', e.paymentMethod, e.amount])
              )
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-medium text-white hover:bg-teal-800 dark:bg-teal-600"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* Summary + Chart */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs text-slate-500">November Total Expenses</p>
            <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums">
              {formatCurrency(totalMonthly, settings.currencySymbol)}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">{expenses.length} vouchers posted this month</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
              Filter by Category
            </label>
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value as 'All' | ExpenseCategory)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="All">All Expense Categories</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-3 text-sm font-semibold">Expense Breakdown by Category</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="categoryName" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} width={60} />
                <Tooltip
                  formatter={(v) =>
                    formatCurrency(Number(Array.isArray(v) ? v[0] : (v ?? 0)), settings.currencySymbol)
                  }
                />
                <Bar dataKey="total" name="Expense" fill="#0F766E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Expense Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
                <th className="px-4 py-3 font-medium">Voucher</th>
                <th className="px-3 py-3 font-medium">Date</th>
                <th className="px-3 py-3 font-medium">Category</th>
                <th className="px-3 py-3 font-medium">Description & Vendor</th>
                <th className="px-3 py-3 font-medium">Method</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-3 font-mono font-semibold">{e.voucherNumber}</td>
                  <td className="px-3 py-3 text-slate-500">{formatDate(e.date)}</td>
                  <td className="px-3 py-3 font-medium">{e.category}</td>
                  <td className="px-3 py-3">
                    <p>{e.description}</p>
                    {e.vendor && <p className="text-[11px] text-slate-400">Vendor: {e.vendor}</p>}
                  </td>
                  <td className="px-3 py-3 text-slate-500">{e.paymentMethod}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums">
                    {formatCurrency(e.amount, settings.currencySymbol)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Record Operating Expense" size="sm">
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="mb-1 block font-medium">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block font-medium">Description *</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
            />
            {errors.description && <p className="mt-1 text-[11px] text-red-600">{errors.description}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-medium">Amount ({settings.currencySymbol}) *</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono dark:border-slate-700 dark:bg-slate-800"
              />
              {errors.amount && <p className="mt-1 text-[11px] text-red-600">{errors.amount}</p>}
            </div>
            <div>
              <label className="mb-1 block font-medium">Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-medium">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Card">Card</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block font-medium">Payee / Vendor</label>
              <input
                type="text"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 font-medium dark:border-slate-700"
            >
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-teal-700 px-4 py-2 font-medium text-white hover:bg-teal-800">
              Save Expense
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

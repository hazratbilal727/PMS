import React, { useMemo, useState } from 'react';
import { Download, FileText, Printer, Search } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { downloadCSV, formatCurrency, getExpiryStatus } from '../lib/utils';
import { SALES_TREND_SERIES } from '../mock-data';
import { usePMS } from '../services/pmsStore';

type ReportType =
  | 'daily-sales'
  | 'weekly-sales'
  | 'monthly-sales'
  | 'yearly-sales'
  | 'profit-loss'
  | 'purchase'
  | 'inventory'
  | 'stock-valuation'
  | 'low-stock'
  | 'expiry'
  | 'supplier'
  | 'customer'
  | 'employee-performance'
  | 'expense'
  | 'tax';

const REPORT_MENU: Array<{ id: ReportType; title: string }> = [
  { id: 'daily-sales', title: 'Daily Sales Report' },
  { id: 'weekly-sales', title: 'Weekly Sales Report' },
  { id: 'monthly-sales', title: 'Monthly Sales Report' },
  { id: 'yearly-sales', title: 'Yearly Sales Report' },
  { id: 'profit-loss', title: 'Profit & Loss Report' },
  { id: 'purchase', title: 'Purchase Report' },
  { id: 'inventory', title: 'Inventory Report' },
  { id: 'stock-valuation', title: 'Stock Valuation Report' },
  { id: 'low-stock', title: 'Low Stock Report' },
  { id: 'expiry', title: 'Expiry Report' },
  { id: 'supplier', title: 'Supplier Report' },
  { id: 'customer', title: 'Customer Report' },
  { id: 'employee-performance', title: 'Employee Performance Report' },
  { id: 'expense', title: 'Expense Report' },
  { id: 'tax', title: 'Tax Report' },
];

export const ReportsPage: React.FC = () => {
  const {
    medicines,
    sales,
    purchases,
    suppliers,
    customers,
    employees,
    expenses,
    settings,
    pushToast,
  } = usePMS();

  const [selectedReport, setSelectedReport] = useState<ReportType>('monthly-sales');
  const [fromDate, setFromDate] = useState('2026-11-01');
  const [toDate, setToDate] = useState('2026-11-23');
  const [search, setSearch] = useState('');

  const reportPayload = useMemo(() => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let chartData: { label: string; value: number }[] = [];

    switch (selectedReport) {
      case 'daily-sales':
      case 'weekly-sales':
      case 'monthly-sales':
      case 'yearly-sales': {
        const key =
          selectedReport === 'daily-sales'
            ? 'daily'
            : selectedReport === 'weekly-sales'
            ? 'weekly'
            : selectedReport === 'monthly-sales'
            ? 'monthly'
            : 'yearly';
        const series = SALES_TREND_SERIES[key];
        headers = ['Period', 'Gross Sales', 'Purchases', 'Net Profit'];
        rows = series.map((d) => [d.label, d.sales, d.purchases, d.profit]);
        chartData = series.map((d) => ({ label: d.label, value: d.sales }));
        break;
      }
      case 'profit-loss': {
        const totalRev = sales.reduce((s, x) => s + x.grandTotal, 0) + 1405000;
        const cogs = Math.round(totalRev * 0.74);
        const opEx = expenses.reduce((s, e) => s + e.amount, 0);
        const net = totalRev - cogs - opEx;
        headers = ['Account Line', 'Amount'];
        rows = [
          ['Gross Pharmacy Revenue', totalRev],
          ['Cost of Goods Sold (COGS)', cogs],
          ['Gross Profit', totalRev - cogs],
          ['Operating Expenses', opEx],
          ['Net Profit Before Tax', net],
        ];
        chartData = [
          { label: 'Revenue', value: totalRev },
          { label: 'COGS', value: cogs },
          { label: 'Expenses', value: opEx },
          { label: 'Net Profit', value: net },
        ];
        break;
      }
      case 'purchase':
        headers = ['PO Number', 'Date', 'Supplier', 'Items', 'Total Amount', 'Status'];
        rows = purchases.map((p) => [p.poNumber, p.date, p.supplierName, p.items.length, p.totalAmount, p.stockStatus]);
        chartData = purchases.map((p) => ({ label: p.poNumber, value: p.totalAmount }));
        break;
      case 'inventory':
      case 'stock-valuation':
        headers = ['Code', 'Medicine', 'Qty', 'Cost Value', 'Retail Value'];
        rows = medicines.map((m) => [
          m.medicineCode,
          m.name,
          m.availableQuantity,
          m.availableQuantity * m.purchasePrice,
          m.availableQuantity * m.sellingPrice,
        ]);
        chartData = medicines.slice(0, 7).map((m) => ({
          label: m.medicineCode,
          value: m.availableQuantity * m.sellingPrice,
        }));
        break;
      case 'low-stock': {
        const low = medicines.filter((m) => m.availableQuantity <= m.minimumStockLevel);
        headers = ['Code', 'Medicine', 'On Hand', 'Min Level', 'Deficit'];
        rows = low.map((m) => [m.medicineCode, m.name, m.availableQuantity, m.minimumStockLevel, Math.max(0, m.minimumStockLevel - m.availableQuantity)]);
        chartData = low.map((m) => ({ label: m.medicineCode, value: m.availableQuantity }));
        break;
      }
      case 'expiry':
        headers = ['Code', 'Medicine', 'Batch', 'Expiry Date', 'Days Left', 'Qty'];
        rows = medicines
          .map((m) => {
            const st = getExpiryStatus(m.expiryDate);
            return [m.medicineCode, m.name, m.batchNumber, m.expiryDate, st.daysLeft, m.availableQuantity];
          })
          .sort((a, b) => Number(a[4]) - Number(b[4]));
        chartData = medicines.slice(0, 7).map((m) => ({
          label: m.batchNumber,
          value: Math.max(0, getExpiryStatus(m.expiryDate).daysLeft),
        }));
        break;
      case 'supplier':
        headers = ['Supplier', 'City', 'NTN', 'Total Supplied', 'Balance Payable'];
        rows = suppliers.map((s) => [s.companyName, s.city, s.ntnNumber, s.totalSuppliedValue, s.outstandingBalance]);
        chartData = suppliers.map((s) => ({ label: s.companyName.split(' ')[0], value: s.totalSuppliedValue }));
        break;
      case 'customer':
        headers = ['Customer', 'Phone', 'Visits', 'Total Spending', 'Outstanding'];
        rows = customers.map((c) => [c.name, c.phone, c.totalVisits, c.totalSpending, c.outstandingBalance]);
        chartData = customers.map((c) => ({ label: c.name.split(' ')[0], value: c.totalSpending }));
        break;
      case 'employee-performance':
        headers = ['Employee', 'Role', 'Shift', 'Invoices Handled', 'Est. Sales Volume'];
        rows = employees.map((e, i) => [e.name, e.role, e.shift, 24 + i * 11, (24 + i * 11) * 2150]);
        chartData = employees.map((e, i) => ({ label: e.name.split(' ')[0], value: (24 + i * 11) * 2150 }));
        break;
      case 'expense':
        headers = ['Voucher', 'Date', 'Category', 'Description', 'Amount'];
        rows = expenses.map((e) => [e.voucherNumber, e.date, e.category, e.description, e.amount]);
        chartData = expenses.map((e) => ({ label: e.voucherNumber, value: e.amount }));
        break;
      case 'tax':
        headers = ['Invoice #', 'Date', 'Customer', 'Taxable Subtotal', 'Tax Collected'];
        rows = sales.map((s) => [s.invoiceNumber, s.date.slice(0, 10), s.customerName, s.subtotal, s.taxAmount]);
        chartData = sales.map((s) => ({ label: s.invoiceNumber.slice(-4), value: s.taxAmount }));
        break;
    }

    const q = search.trim().toLowerCase();
    const filteredRows = q
      ? rows.filter((r) => r.some((cell) => String(cell).toLowerCase().includes(q)))
      : rows;

    return { headers, rows: filteredRows, chartData };
  }, [selectedReport, medicines, sales, purchases, suppliers, customers, employees, expenses, search]);

  const currentMeta = REPORT_MENU.find((r) => r.id === selectedReport);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between no-print">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
            Reports & Business Analytics
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            15 audit-ready clinical, inventory, tax, and financial reports with CSV & print export
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              downloadCSV(`${selectedReport}-report.csv`, reportPayload.headers, reportPayload.rows)
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => {
              pushToast('Preparing print/PDF layout', 'info');
              window.print();
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-medium text-white hover:bg-teal-800 dark:bg-teal-600"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Export PDF / Print</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left Report Index */}
        <div className="lg:col-span-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 no-print">
          <p className="px-2 pb-2 text-[11px] font-semibold text-slate-400">Available Reports (15)</p>
          <ul className="space-y-0.5">
            {REPORT_MENU.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => setSelectedReport(r.id)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium transition-colors ${
                    selectedReport === r.id
                      ? 'bg-teal-50 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{r.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Report Canvas */}
        <div className="lg:col-span-9 space-y-5">
          {/* Date & Search Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 no-print">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-medium text-slate-500">Range:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-800"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>

            <div className="relative w-full sm:w-56">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter report rows..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          </div>

          {/* Chart */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{currentMeta?.title}</h3>
                <p className="text-[11px] text-slate-500">
                  {settings.pharmacyName} · Period {fromDate} to {toDate}
                </p>
              </div>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportPayload.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} width={64} />
                  <Tooltip
                    formatter={(v) => {
                      const val = Array.isArray(v) ? v[0] : (v ?? 0);
                      return selectedReport === 'expiry' || selectedReport === 'low-stock'
                        ? String(val)
                        : formatCurrency(Number(val), settings.currencySymbol);
                    }}
                  />
                  <Bar dataKey="value" fill="#0F766E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Report Table */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
                    {reportPayload.headers.map((h) => (
                      <th key={h} className="px-4 py-3 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {reportPayload.rows.map((row, idx) => (
                    <tr key={idx}>
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className={`px-4 py-2.5 ${
                            typeof cell === 'number' ? 'font-mono tabular-nums font-medium' : ''
                          }`}
                        >
                          {typeof cell === 'number' &&
                          !['Qty', 'On Hand', 'Min Level', 'Deficit', 'Days Left', 'Visits', 'Items', 'Invoices Handled'].includes(
                            reportPayload.headers[cIdx]
                          )
                            ? formatCurrency(cell, settings.currencySymbol)
                            : cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useMemo, useState } from 'react';
import { Download, FileText, Printer } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { downloadCSV, formatCurrency, getExpiryStatus } from '../lib/utils';
import { SALES_TREND_SERIES } from '../mock-data';
import { usePMS } from '../services/pmsStore';
import { ChartTooltip } from '../components/ui/ChartTooltip';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { SearchInput } from '../components/ui/SearchInput';

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
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  const handleSelectReport = (id: ReportType) => {
    setSelectedReport(id);
    setIsLoadingReport(true);
    setTimeout(() => setIsLoadingReport(false), 160);
  };

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
        rows = low.map((m) => [
          m.medicineCode,
          m.name,
          m.availableQuantity,
          m.minimumStockLevel,
          Math.max(0, m.minimumStockLevel - m.availableQuantity),
        ]);
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
    <div className="space-y-6">
      <div className="no-print">
        <PageHeader
          title="Reports & Business Analytics"
          description="15 audit-ready clinical, inventory, tax, and financial reports with CSV & print export"
          actions={
            <>
              <button
                type="button"
                onClick={() =>
                  downloadCSV(`${selectedReport}-report.csv`, reportPayload.headers, reportPayload.rows)
                }
                className="pms-btn-secondary"
              >
                <Download className="h-4 w-4" />
                <span>Export CSV</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  pushToast('Preparing print/PDF layout', 'info');
                  window.print();
                }}
                className="pms-btn-primary"
              >
                <Printer className="h-4 w-4" />
                <span>Export PDF / Print</span>
              </button>
            </>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left Report Index */}
        <div className="no-print pms-card p-3.5 lg:col-span-3">
          <p className="px-2.5 pb-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Available Reports (15)
          </p>
          <ul className="space-y-1">
            {REPORT_MENU.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => handleSelectReport(r.id)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition-colors ${
                    selectedReport === r.id
                      ? 'bg-teal-50 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <FileText className="h-4 w-4 shrink-0" />
                  <span className="truncate">{r.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Report Canvas */}
        <div className="space-y-5 lg:col-span-9">
          {/* Date & Search Controls */}
          <div className="no-print pms-card flex flex-wrap items-center justify-between gap-3.5 p-4">
            <div className="flex flex-wrap items-center gap-2.5 text-sm">
              <span className="font-medium text-slate-600 dark:text-slate-400">Period:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                aria-label="Report start date"
                className="pms-input !w-auto"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                aria-label="Report end date"
                className="pms-input !w-auto"
              />
            </div>

            <SearchInput
              value={search}
              onValueChange={setSearch}
              placeholder="Filter report rows..."
              containerClassName="w-full sm:w-64"
            />
          </div>

          {/* Chart */}
          <div className="pms-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                  {currentMeta?.title}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {settings.pharmacyName} · Period {fromDate} to {toDate}
                </p>
              </div>
            </div>

            {isLoadingReport ? (
              <div className="h-64 w-full animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800/60" />
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportPayload.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} width={68} />
                    <Tooltip
                      content={
                        <ChartTooltip
                          valueFormatter={(v) =>
                            selectedReport === 'expiry' || selectedReport === 'low-stock'
                              ? String(v)
                              : formatCurrency(Number(v), settings.currencySymbol)
                          }
                        />
                      }
                    />
                    <Bar dataKey="value" name={currentMeta?.title ?? 'Value'} fill="#0F766E" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Report Table */}
          <div className="pms-card overflow-hidden">
            {isLoadingReport ? (
              <div className="space-y-2.5 p-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-9 w-full animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800/60" />
                ))}
              </div>
            ) : reportPayload.rows.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No rows in this report"
                description="No records matched your filter in the selected report view."
                actionLabel={search ? 'Clear Filter' : undefined}
                onAction={search ? () => setSearch('') : undefined}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                      {reportPayload.headers.map((h, i) => (
                        <th key={h} className={`${i === 0 ? 'px-5' : 'px-4'} py-3.5`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {reportPayload.rows.map((row, idx) => (
                      <tr key={idx} className="transition-colors hover:bg-slate-50/75 dark:hover:bg-slate-800/40">
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className={`${cIdx === 0 ? 'px-5' : 'px-4'} py-3.5 ${
                              typeof cell === 'number' ? 'font-mono font-medium tabular-nums' : ''
                            }`}
                          >
                            {typeof cell === 'number' &&
                            ![
                              'Qty',
                              'On Hand',
                              'Min Level',
                              'Deficit',
                              'Days Left',
                              'Visits',
                              'Items',
                              'Invoices Handled',
                            ].includes(reportPayload.headers[cIdx])
                              ? formatCurrency(cell, settings.currencySymbol)
                              : cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

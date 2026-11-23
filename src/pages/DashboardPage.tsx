import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarClock,
  ClipboardPlus,
  DollarSign,
  Package,
  Pill,
  Plus,
  ShoppingCart,
  TrendingUp,
  Truck,
  Users,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency, formatDate, formatDateTime, getExpiryStatus } from '../lib/utils';
import { SALES_TREND_SERIES } from '../mock-data';
import { usePMS } from '../services/pmsStore';
import { StatusText } from '../components/ui/StatusText';

const CHART_COLORS = ['#0F766E', '#0284C7', '#059669', '#D97706', '#475569', '#0D9488'];

export const DashboardPage: React.FC = () => {
  const {
    medicines,
    sales,
    purchases,
    customers,
    suppliers,
    expenses,
    activityLogs,
    settings,
    setActiveRoute,
  } = usePMS();

  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');

  const stats = useMemo(() => {
    const totalSalesRevenue = sales.reduce((sum, s) => sum + (s.paymentStatus === 'Refunded' ? 0 : s.grandTotal), 0);
    const todaySalesRevenue = sales
      .filter((s) => s.date.startsWith('2026-11-23') && s.paymentStatus !== 'Refunded')
      .reduce((sum, s) => sum + s.grandTotal, 0);
    const lowStockMeds = medicines.filter((m) => m.availableQuantity <= m.minimumStockLevel);
    const expiringMeds = medicines.filter((m) => getExpiryStatus(m.expiryDate).daysLeft <= 90);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const monthlyGross = totalSalesRevenue + 1405000;
    const monthlyProfit = Math.round(monthlyGross * 0.24) - totalExpenses;

    return {
      totalSalesCount: sales.length + 1240,
      totalSalesRevenue,
      todaySalesRevenue,
      totalMedicines: medicines.length,
      lowStockCount: lowStockMeds.length,
      expiringCount: expiringMeds.length,
      totalCustomers: customers.length + 412,
      totalSuppliers: suppliers.length,
      monthlyProfit,
      lowStockMeds,
      expiringMeds,
    };
  }, [medicines, sales, customers.length, suppliers.length, expenses]);

  const bestSellingData = useMemo(() => {
    const qtyMap = new Map<string, { name: string; units: number; revenue: number }>();
    sales.forEach((s) => {
      s.items.forEach((item) => {
        const prev = qtyMap.get(item.medicineName) ?? { name: item.medicineName, units: 0, revenue: 0 };
        qtyMap.set(item.medicineName, {
          name: item.medicineName.split(' ').slice(0, 2).join(' '),
          units: prev.units + item.quantity,
          revenue: prev.revenue + item.lineTotal,
        });
      });
    });
    return Array.from(qtyMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  }, [sales]);

  const categoryDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    medicines.forEach((m) => {
      counts.set(m.dosageForm, (counts.get(m.dosageForm) ?? 0) + m.availableQuantity);
    });
    return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
  }, [medicines]);

  const trendData = SALES_TREND_SERIES[timeframe];

  const kpiCards = [
    {
      label: 'Total Sales (YTD)',
      value: stats.totalSalesCount.toLocaleString(),
      sub: `${formatCurrency(stats.totalSalesRevenue + 1405000, settings.currencySymbol)} gross`,
      icon: TrendingUp,
      route: 'sales' as const,
    },
    {
      label: "Today's Revenue",
      value: formatCurrency(stats.todaySalesRevenue, settings.currencySymbol),
      sub: `${sales.filter((s) => s.date.startsWith('2026-11-23')).length} invoices today`,
      icon: DollarSign,
      route: 'pos' as const,
    },
    {
      label: 'Total Medicines',
      value: String(stats.totalMedicines),
      sub: `${medicines.reduce((sum, m) => sum + m.availableQuantity, 0).toLocaleString()} units in stock`,
      icon: Pill,
      route: 'medicines' as const,
    },
    {
      label: 'Low Stock Medicines',
      value: String(stats.lowStockCount),
      sub: 'Below minimum reorder level',
      icon: Package,
      tone: stats.lowStockCount > 0 ? 'warning' : 'ok',
      route: 'stock' as const,
    },
    {
      label: 'Expiring Medicines',
      value: String(stats.expiringCount),
      sub: 'Expired or within 90 days',
      icon: CalendarClock,
      tone: stats.expiringCount > 0 ? 'critical' : 'ok',
      route: 'expiry' as const,
    },
    {
      label: 'Total Customers',
      value: stats.totalCustomers.toLocaleString(),
      sub: `${customers.length} active profiles`,
      icon: Users,
      route: 'customers' as const,
    },
    {
      label: 'Total Suppliers',
      value: String(stats.totalSuppliers),
      sub: 'Verified distributors',
      icon: Truck,
      route: 'suppliers' as const,
    },
    {
      label: 'Monthly Net Profit',
      value: formatCurrency(stats.monthlyProfit, settings.currencySymbol),
      sub: 'After operating expenses',
      icon: TrendingUp,
      route: 'reports' as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header & Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Pharmacy Operations Overview
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {settings.pharmacyName} · {settings.city} · Live dispensing, inventory & financial summary
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveRoute('pos')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-teal-800 whitespace-nowrap shrink-0 dark:bg-teal-600 dark:hover:bg-teal-700"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>Open POS</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveRoute('medicines')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Medicine</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveRoute('purchases')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Truck className="h-3.5 w-3.5" />
            <span>New Purchase</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveRoute('prescriptions')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ClipboardPlus className="h-3.5 w-3.5" />
            <span>Prescriptions</span>
          </button>
        </div>
      </div>

      {/* 8 Statistics Cards */}
      <section aria-label="Key performance metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              type="button"
              onClick={() => setActiveRoute(card.route)}
              className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 text-left transition-colors hover:border-teal-500/60 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-teal-500/50"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{card.label}</span>
                <Icon
                  className={`h-4 w-4 ${
                    card.tone === 'critical'
                      ? 'text-red-600 dark:text-red-400'
                      : card.tone === 'warning'
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-teal-700 dark:text-teal-400'
                  }`}
                />
              </div>
              <div className="mt-3 flex items-baseline justify-between gap-2">
                <span className="font-mono text-2xl font-bold tracking-tight text-slate-900 tabular-nums dark:text-slate-100">
                  {card.value}
                </span>
                <ArrowUpRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-teal-600 dark:text-slate-700" />
              </div>
              <p
                className={`mt-1.5 text-xs ${
                  card.tone === 'critical'
                    ? 'text-red-600 dark:text-red-400'
                    : card.tone === 'warning'
                    ? 'text-amber-700 dark:text-amber-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {card.sub}
              </p>
            </button>
          );
        })}
      </section>

      {/* Primary Charts Row */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Sales & Revenue Overview (2 cols) */}
        <div className="xl:col-span-2 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Sales & Revenue Analytics
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Revenue vs procurement cost and net profit trend
              </p>
            </div>

            <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
              {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors whitespace-nowrap ${
                    timeframe === tf
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-slate-100'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} width={64} />
                <Tooltip
                  formatter={(value) =>
                    formatCurrency(Number(Array.isArray(value) ? value[0] : (value ?? 0)), settings.currencySymbol)
                  }
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area
                  type="monotone"
                  dataKey="sales"
                  name="Sales Revenue"
                  stroke="#0F766E"
                  fill="#0F766E"
                  fillOpacity={0.14}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  name="Estimated Profit"
                  stroke="#0284C7"
                  fill="#0284C7"
                  fillOpacity={0.08}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Stock Distribution (1 col) */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Dosage Form Distribution
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Units on hand across medicine types
            </p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={82}
                  paddingAngle={2}
                >
                  {categoryDistribution.map((_, idx) => (
                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `${Array.isArray(v) ? v[0] : (v ?? 0)} packs`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
            {categoryDistribution.slice(0, 6).map((cat, idx) => (
              <div key={cat.name} className="flex items-center justify-between gap-1.5">
                <span className="flex items-center gap-1.5 truncate text-slate-600 dark:text-slate-400">
                  <span
                    className="h-2 w-2 shrink-0 rounded-xs"
                    style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                  />
                  <span className="truncate">{cat.name}</span>
                </span>
                <span className="font-mono text-[11px] font-medium text-slate-900 tabular-nums dark:text-slate-200">
                  {cat.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Secondary Charts Row: Sales vs Purchases + Best-Selling Medicines */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Sales vs Purchases ({timeframe})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Comparison of dispensing revenue against supplier procurement
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} width={64} />
                <Tooltip
                  formatter={(value) =>
                    formatCurrency(Number(Array.isArray(value) ? value[0] : (value ?? 0)), settings.currencySymbol)
                  }
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="sales" name="Sales" fill="#0F766E" radius={[4, 4, 0, 0]} />
                <Bar dataKey="purchases" name="Purchases" fill="#94A3B8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Top-Selling Medicines
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Highest revenue formulations from recent invoices
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveRoute('reports')}
              className="text-xs font-medium text-teal-700 hover:underline dark:text-teal-400"
            >
              Full Report
            </button>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bestSellingData} layout="vertical" margin={{ left: 10, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(value) =>
                    formatCurrency(Number(Array.isArray(value) ? value[0] : (value ?? 0)), settings.currencySymbol)
                  }
                />
                <Bar dataKey="revenue" name="Revenue" fill="#0F766E" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Operational Grids: Alerts & Recent Records */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Low Stock & Expiring Alerts */}
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Low Stock & Expiry Alerts
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveRoute('expiry')}
              className="text-xs font-medium text-teal-700 hover:underline dark:text-teal-400"
            >
              Manage Expiry
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {stats.expiringMeds.slice(0, 3).map((med) => {
              const exp = getExpiryStatus(med.expiryDate);
              return (
                <div key={`exp-${med.id}`} className="flex items-center justify-between gap-3 px-5 py-3 text-xs">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900 dark:text-slate-100">{med.name}</p>
                    <p className="font-mono text-[11px] text-slate-500">
                      Batch {med.batchNumber} · Exp {formatDate(med.expiryDate)}
                    </p>
                  </div>
                  <StatusText
                    label={exp.label}
                    tone={exp.severity === 'critical' ? 'critical' : 'warning'}
                  />
                </div>
              );
            })}
            {stats.lowStockMeds.slice(0, 3).map((med) => (
              <div key={`low-${med.id}`} className="flex items-center justify-between gap-3 px-5 py-3 text-xs">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900 dark:text-slate-100">{med.name}</p>
                  <p className="text-[11px] text-slate-500">
                    Stock: <span className="font-mono font-semibold tabular-nums">{med.availableQuantity}</span> / Min{' '}
                    <span className="font-mono tabular-nums">{med.minimumStockLevel}</span>
                  </p>
                </div>
                <StatusText label="Low Stock" tone="warning" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Sales */}
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Recent Sales</h3>
            <button
              type="button"
              onClick={() => setActiveRoute('sales')}
              className="text-xs font-medium text-teal-700 hover:underline dark:text-teal-400"
            >
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="px-5 py-2.5 font-medium">Invoice</th>
                  <th className="px-3 py-2.5 font-medium">Customer</th>
                  <th className="px-3 py-2.5 font-medium">Method</th>
                  <th className="px-5 py-2.5 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sales.slice(0, 5).map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-2.5 font-mono font-medium text-slate-900 dark:text-slate-100">
                      {sale.invoiceNumber}
                    </td>
                    <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300">{sale.customerName}</td>
                    <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">{sale.paymentMethod}</td>
                    <td className="px-5 py-2.5 text-right font-mono font-semibold text-slate-900 tabular-nums dark:text-slate-100">
                      {formatCurrency(sale.grandTotal, settings.currencySymbol)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Recent Purchases & Activity Log */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Recent Purchases</h3>
            <button
              type="button"
              onClick={() => setActiveRoute('purchases')}
              className="text-xs font-medium text-teal-700 hover:underline dark:text-teal-400"
            >
              Manage Orders
            </button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {purchases.slice(0, 4).map((po) => (
              <div key={po.id} className="flex items-center justify-between gap-3 px-5 py-3 text-xs">
                <div className="min-w-0">
                  <p className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                    {po.poNumber} · <span className="font-sans font-medium">{po.supplierName}</span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {formatDate(po.date)} · {po.items.length} line item(s)
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono font-semibold text-slate-900 tabular-nums dark:text-slate-100">
                    {formatCurrency(po.totalAmount, settings.currencySymbol)}
                  </p>
                  <StatusText
                    label={po.stockStatus}
                    tone={po.stockStatus === 'Received' ? 'ok' : 'warning'}
                    showIcon={false}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Recent Staff Activity</h3>
            <button
              type="button"
              onClick={() => setActiveRoute('employees')}
              className="text-xs font-medium text-teal-700 hover:underline dark:text-teal-400"
            >
              Audit Log
            </button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {activityLogs.slice(0, 4).map((log) => (
              <div key={log.id} className="flex items-start justify-between gap-3 px-5 py-3 text-xs">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {log.action} · <span className="text-slate-500 dark:text-slate-400">{log.actorName}</span>
                  </p>
                  <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{log.details}</p>
                </div>
                <span className="shrink-0 font-mono text-[11px] text-slate-400">
                  {formatDateTime(log.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

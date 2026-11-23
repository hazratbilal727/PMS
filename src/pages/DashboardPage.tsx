import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  ClipboardPlus,
  DollarSign,
  Package,
  Pill,
  Plus,
  RefreshCw,
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
import type { Sale } from '../types';
import { ChartTooltip } from '../components/ui/ChartTooltip';
import { KpiCard, type KpiTone } from '../components/ui/KpiCard';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusText } from '../components/ui/StatusText';
import { PrintableInvoiceModal } from '../components/dialogs/PrintableInvoiceModal';

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
    triggerQuickAction,
    pushToast,
  } = usePMS();

  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [refreshing, setRefreshing] = useState(false);
  const [previewSale, setPreviewSale] = useState<Sale | null>(null);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      pushToast('Dashboard metrics synced', 'info');
    }, 260);
  };

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
    const qtyMap = new Map<string, { name: string; fullName: string; units: number; revenue: number }>();
    sales.forEach((s) => {
      s.items.forEach((item) => {
        const prev = qtyMap.get(item.medicineName) ?? {
          name: item.medicineName.split(' ').slice(0, 2).join(' '),
          fullName: item.medicineName,
          units: 0,
          revenue: 0,
        };
        qtyMap.set(item.medicineName, {
          name: item.medicineName.split(' ').slice(0, 2).join(' '),
          fullName: item.medicineName,
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

  const kpiCards: Array<{
    label: string;
    value: string;
    sub: string;
    icon: React.ComponentType<{ className?: string }>;
    tone: KpiTone;
    route: 'sales' | 'pos' | 'medicines' | 'stock' | 'expiry' | 'customers' | 'suppliers' | 'reports';
  }> = [
    {
      label: 'Total Sales (YTD)',
      value: stats.totalSalesCount.toLocaleString(),
      sub: `${formatCurrency(stats.totalSalesRevenue + 1405000, settings.currencySymbol)} gross`,
      icon: TrendingUp,
      tone: 'teal',
      route: 'sales',
    },
    {
      label: "Today's Revenue",
      value: formatCurrency(stats.todaySalesRevenue, settings.currencySymbol),
      sub: `${sales.filter((s) => s.date.startsWith('2026-11-23')).length} invoices today`,
      icon: DollarSign,
      tone: 'emerald',
      route: 'pos',
    },
    {
      label: 'Total Medicines',
      value: String(stats.totalMedicines),
      sub: `${medicines.reduce((sum, m) => sum + m.availableQuantity, 0).toLocaleString()} units in stock`,
      icon: Pill,
      tone: 'teal',
      route: 'medicines',
    },
    {
      label: 'Low Stock Medicines',
      value: String(stats.lowStockCount),
      sub: 'Below minimum reorder level',
      icon: Package,
      tone: stats.lowStockCount > 0 ? 'amber' : 'emerald',
      route: 'stock',
    },
    {
      label: 'Expiring Medicines',
      value: String(stats.expiringCount),
      sub: 'Expired or within 90 days',
      icon: CalendarClock,
      tone: stats.expiringCount > 0 ? 'red' : 'emerald',
      route: 'expiry',
    },
    {
      label: 'Total Customers',
      value: stats.totalCustomers.toLocaleString(),
      sub: `${customers.length} active profiles`,
      icon: Users,
      tone: 'slate',
      route: 'customers',
    },
    {
      label: 'Total Suppliers',
      value: String(stats.totalSuppliers),
      sub: 'Verified distributors',
      icon: Truck,
      tone: 'slate',
      route: 'suppliers',
    },
    {
      label: 'Monthly Net Profit',
      value: formatCurrency(stats.monthlyProfit, settings.currencySymbol),
      sub: 'After operating expenses',
      icon: TrendingUp,
      tone: 'emerald',
      route: 'reports',
    },
  ];

  return (
    <div className="space-y-7">
      <PageHeader
        title="Pharmacy Operations Overview"
        description={`${settings.pharmacyName} · ${settings.city} · Live dispensing, inventory & financial summary`}
        actions={
          <>
            <button
              type="button"
              onClick={handleRefresh}
              className="pms-btn-secondary"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
              <span>Sync</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveRoute('pos')}
              className="pms-btn-primary"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Open POS</span>
            </button>
            <button
              type="button"
              onClick={() => triggerQuickAction('medicines', 'add-medicine')}
              className="pms-btn-secondary"
            >
              <Plus className="h-4 w-4" />
              <span>Add Medicine</span>
            </button>
            <button
              type="button"
              onClick={() => triggerQuickAction('purchases', 'new-po')}
              className="pms-btn-secondary"
            >
              <Truck className="h-4 w-4" />
              <span>New Purchase</span>
            </button>
            <button
              type="button"
              onClick={() => triggerQuickAction('prescriptions', 'new-rx')}
              className="pms-btn-secondary"
            >
              <ClipboardPlus className="h-4 w-4" />
              <span>New Rx</span>
            </button>
          </>
        }
      />

      {/* 8 Statistics Cards */}
      <section aria-label="Key performance metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => (
          <KpiCard
            key={card.label}
            label={card.label}
            value={card.value}
            subtitle={card.sub}
            icon={card.icon}
            tone={card.tone}
            loading={refreshing}
            onClick={() => setActiveRoute(card.route)}
          />
        ))}
      </section>

      {/* Primary Charts Row */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="pms-card xl:col-span-2 p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                Sales & Revenue Analytics
              </h3>
              <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
                Revenue vs estimated profit trend across selected period
              </p>
            </div>

            <div className="inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf)}
                  className={`rounded-lg px-3 py-1.5 text-[13px] font-medium capitalize transition-colors whitespace-nowrap ${
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

          <div className="h-76 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.25} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} width={68} />
                <Tooltip
                  content={
                    <ChartTooltip
                      valueFormatter={(val) => formatCurrency(Number(val), settings.currencySymbol)}
                    />
                  }
                />
                <Legend wrapperStyle={{ fontSize: '13px' }} />
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

        <div className="pms-card p-6">
          <div className="mb-3">
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
              Dosage Form Distribution
            </h3>
            <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
              Units on hand across medicine types
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={56}
                  outerRadius={86}
                  paddingAngle={2}
                >
                  {categoryDistribution.map((_, idx) => (
                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip valueFormatter={(val) => `${val} packs`} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
            {categoryDistribution.slice(0, 6).map((cat, idx) => (
              <div key={cat.name} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 truncate text-slate-600 dark:text-slate-400">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-xs"
                    style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                  />
                  <span className="truncate">{cat.name}</span>
                </span>
                <span className="font-mono text-xs font-semibold text-slate-900 tabular-nums dark:text-slate-200">
                  {cat.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Secondary Charts Row */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="pms-card p-6">
          <div className="mb-5">
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
              Sales vs Purchases ({timeframe})
            </h3>
            <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
              Dispensing revenue compared against distributor procurement
            </p>
          </div>
          <div className="h-68 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.25} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} width={68} />
                <Tooltip
                  content={
                    <ChartTooltip
                      valueFormatter={(val) => formatCurrency(Number(val), settings.currencySymbol)}
                    />
                  }
                />
                <Legend wrapperStyle={{ fontSize: '13px' }} />
                <Bar dataKey="sales" name="Sales" fill="#0F766E" radius={[4, 4, 0, 0]} />
                <Bar dataKey="purchases" name="Purchases" fill="#94A3B8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="pms-card p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                Best-Selling Medicines
              </h3>
              <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
                Top revenue formulations from recent invoices
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveRoute('reports')}
              className="text-[13px] font-medium text-teal-700 hover:underline dark:text-teal-400"
            >
              Full Report
            </button>
          </div>
          <div className="h-68 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bestSellingData} layout="vertical" margin={{ left: 10, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.25} />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  content={
                    <ChartTooltip
                      valueFormatter={(val) => formatCurrency(Number(val), settings.currencySymbol)}
                    />
                  }
                />
                <Bar dataKey="revenue" name="Revenue" fill="#0F766E" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Operational Grids */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="pms-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-[18px] w-[18px] text-amber-600 dark:text-amber-400" />
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                Low Stock & Expiry Alerts
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveRoute('expiry')}
              className="text-[13px] font-medium text-teal-700 hover:underline dark:text-teal-400"
            >
              Manage Expiry
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {stats.expiringMeds.slice(0, 3).map((med) => {
              const exp = getExpiryStatus(med.expiryDate);
              return (
                <button
                  key={`exp-${med.id}`}
                  type="button"
                  onClick={() => setActiveRoute('expiry')}
                  className="flex w-full items-center justify-between gap-4 px-6 py-3.5 text-left transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{med.name}</p>
                    <p className="mt-0.5 font-mono text-xs text-slate-500">
                      Batch {med.batchNumber} · Exp {formatDate(med.expiryDate)}
                    </p>
                  </div>
                  <StatusText
                    label={exp.label}
                    tone={exp.severity === 'critical' ? 'critical' : 'warning'}
                  />
                </button>
              );
            })}
            {stats.lowStockMeds.slice(0, 3).map((med) => (
              <button
                key={`low-${med.id}`}
                type="button"
                onClick={() => setActiveRoute('stock')}
                className="flex w-full items-center justify-between gap-4 px-6 py-3.5 text-left transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{med.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Stock: <span className="font-mono font-semibold tabular-nums">{med.availableQuantity}</span> / Min{' '}
                    <span className="font-mono tabular-nums">{med.minimumStockLevel}</span>
                  </p>
                </div>
                <StatusText label="Low Stock" tone="warning" />
              </button>
            ))}
          </div>
        </div>

        <div className="pms-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
              Recent Sales (click for invoice)
            </h3>
            <button
              type="button"
              onClick={() => setActiveRoute('sales')}
              className="text-[13px] font-medium text-teal-700 hover:underline dark:text-teal-400"
            >
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                  <th className="px-6 py-3">Invoice</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-6 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sales.slice(0, 5).map((sale) => (
                  <tr
                    key={sale.id}
                    onClick={() => setPreviewSale(sale)}
                    className="cursor-pointer transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-6 py-3.5 font-mono text-[13px] font-medium text-teal-700 dark:text-teal-400">
                      {sale.invoiceNumber}
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300">{sale.customerName}</td>
                    <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">{sale.paymentMethod}</td>
                    <td className="px-6 py-3.5 text-right font-mono font-semibold text-slate-900 tabular-nums dark:text-slate-100">
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
        <div className="pms-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
              Recent Purchases
            </h3>
            <button
              type="button"
              onClick={() => setActiveRoute('purchases')}
              className="text-[13px] font-medium text-teal-700 hover:underline dark:text-teal-400"
            >
              Manage Orders
            </button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {purchases.slice(0, 4).map((po) => (
              <div key={po.id} className="flex items-center justify-between gap-4 px-6 py-3.5">
                <div className="min-w-0">
                  <p className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {po.poNumber} · <span className="font-sans font-medium">{po.supplierName}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatDate(po.date)} · {po.items.length} line item(s)
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono text-sm font-semibold text-slate-900 tabular-nums dark:text-slate-100">
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

        <div className="pms-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
              Recent Staff Activity
            </h3>
            <button
              type="button"
              onClick={() => setActiveRoute('employees')}
              className="text-[13px] font-medium text-teal-700 hover:underline dark:text-teal-400"
            >
              Audit Log
            </button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {activityLogs.slice(0, 4).map((log) => (
              <div key={log.id} className="flex items-start justify-between gap-4 px-6 py-3.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {log.action} · <span className="text-slate-500 dark:text-slate-400">{log.actorName}</span>
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{log.details}</p>
                </div>
                <span className="shrink-0 font-mono text-xs text-slate-400">
                  {formatDateTime(log.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PrintableInvoiceModal sale={previewSale} onClose={() => setPreviewSale(null)} />
    </div>
  );
};

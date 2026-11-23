import React from 'react';
import {
  AlertTriangle,
  ArchiveRestore,
  BarChart3,
  Bell,
  Boxes,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CreditCard,
  FileText,
  FolderTree,
  LayoutDashboard,
  PackageCheck,
  Pill,
  Receipt,
  Settings,
  ShoppingCart,
  Truck,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { NAV_ITEMS } from '../../lib/constants';
import { getExpiryStatus } from '../../lib/utils';
import { usePMS } from '../../services/pmsStore';
import type { NavRoute } from '../../types';

const iconMap: Record<NavRoute, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  pos: ShoppingCart,
  medicines: Pill,
  categories: FolderTree,
  inventory: Boxes,
  stock: PackageCheck,
  expiry: CalendarClock,
  prescriptions: ClipboardList,
  sales: Receipt,
  purchases: Truck,
  returns: ArchiveRestore,
  suppliers: CreditCard,
  customers: Users,
  employees: UserCheck,
  expenses: FileText,
  reports: BarChart3,
  notifications: Bell,
  settings: Settings,
};

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const {
    activeRoute,
    setActiveRoute,
    sidebarCollapsed,
    setSidebarCollapsed,
    notifications,
    medicines,
    settings,
  } = usePMS();

  const unreadCount = notifications.filter((n) => !n.read).length;
  const lowStockCount = medicines.filter((m) => m.availableQuantity <= m.minimumStockLevel).length;
  const expiryAlertCount = medicines.filter((m) => getExpiryStatus(m.expiryDate).daysLeft <= 30).length;

  const groups: Array<'Core' | 'Inventory' | 'Operations' | 'Administration'> = [
    'Core',
    'Inventory',
    'Operations',
    'Administration',
  ];

  const handleNavigate = (route: NavRoute) => {
    setActiveRoute(route);
    onCloseMobile();
  };

  const getBadgeCount = (route: NavRoute): number | null => {
    if (route === 'notifications' && unreadCount > 0) return unreadCount;
    if (route === 'stock' && lowStockCount > 0) return lowStockCount;
    if (route === 'expiry' && expiryAlertCount > 0) return expiryAlertCount;
    return null;
  };

  const renderContent = (isMobile: boolean) => {
    const collapsed = !isMobile && sidebarCollapsed;

    return (
      <div className="flex h-full flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {/* Brand Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
          <button
            type="button"
            onClick={() => handleNavigate('dashboard')}
            className="flex items-center gap-2.5 text-left focus-visible:outline-2 focus-visible:outline-teal-600"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-700 text-white dark:bg-teal-600">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <span className="block truncate font-display text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  PMS
                </span>
                <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">
                  {settings.pharmacyName}
                </span>
              </div>
            )}
          </button>

          {isMobile ? (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close navigation"
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="hidden rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 lg:inline-flex dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-5 overflow-y-auto px-2.5 py-4" aria-label="Primary sidebar">
          {groups.map((group) => {
            const items = NAV_ITEMS.filter((i) => i.group === group);
            return (
              <div key={group}>
                {!collapsed && (
                  <p className="mb-1.5 px-2.5 text-[11px] font-semibold tracking-wide text-slate-400 dark:text-slate-500">
                    {group}
                  </p>
                )}
                <ul className="space-y-0.5">
                  {items.map((item) => {
                    const Icon = iconMap[item.id];
                    const isActive = activeRoute === item.id;
                    const count = getBadgeCount(item.id);
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => handleNavigate(item.id)}
                          title={collapsed ? item.label : undefined}
                          className={`group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-teal-600 ${
                            isActive
                              ? 'bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100'
                          } ${collapsed ? 'justify-center px-2' : 'justify-between'}`}
                        >
                          <span className="flex min-w-0 items-center gap-2.5">
                            <Icon
                              className={`h-4 w-4 shrink-0 ${
                                isActive
                                  ? 'text-teal-700 dark:text-teal-400'
                                  : 'text-slate-400 group-hover:text-slate-700 dark:text-slate-500 dark:group-hover:text-slate-200'
                              }`}
                            />
                            {!collapsed && <span className="truncate">{item.label}</span>}
                          </span>
                          {!collapsed && count !== null && (
                            <span
                              className={`ml-2 font-mono text-[11px] font-semibold tabular-nums ${
                                item.id === 'expiry'
                                  ? 'text-red-600 dark:text-red-400'
                                  : item.id === 'stock'
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-teal-700 dark:text-teal-400'
                              }`}
                            >
                              {count}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* Compact Expiry Alert Footer inside Sidebar (Actionable shortcut, not fake telemetry) */}
        {!collapsed && expiryAlertCount > 0 && (
          <div className="border-t border-slate-200 p-3 dark:border-slate-800">
            <button
              type="button"
              onClick={() => handleNavigate('expiry')}
              className="flex w-full items-center gap-2.5 rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2 text-left transition-colors hover:bg-amber-100/70 dark:border-amber-900/50 dark:bg-amber-950/30 dark:hover:bg-amber-950/50"
            >
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" />
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-amber-900 dark:text-amber-200">
                  {expiryAlertCount} Batch Alerts
                </p>
                <p className="truncate text-[11px] text-amber-700 dark:text-amber-400">
                  Review expiring stock
                </p>
              </div>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden shrink-0 transition-[width] duration-200 lg:block no-print ${
          sidebarCollapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {renderContent(false)}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden no-print">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-[1px]"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 h-full w-72 max-w-[85vw]">{renderContent(true)}</aside>
        </div>
      )}
    </>
  );
};

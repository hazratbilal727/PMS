import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  Bell,
  ChevronDown,
  ClipboardPlus,
  LogOut,
  Menu,
  Moon,
  Pill,
  Plus,
  Search,
  Settings,
  ShoppingCart,
  Sun,
  Truck,
  User,
} from 'lucide-react';
import { MEDICINE_IMAGES, NAV_ITEMS } from '../../lib/constants';
import { formatCurrency, formatDateTime } from '../../lib/utils';
import { usePMS } from '../../services/pmsStore';
import type { NavRoute } from '../../types';

interface TopBarProps {
  onOpenMobileMenu: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenMobileMenu }) => {
  const {
    activeRoute,
    setActiveRoute,
    theme,
    toggleTheme,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    medicines,
    customers,
    sales,
    settings,
    setIsLocked,
    pushToast,
  } = usePMS();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const quickRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (searchRef.current && !searchRef.current.contains(target)) setSearchOpen(false);
      if (quickRef.current && !quickRef.current.contains(target)) setQuickOpen(false);
      if (notifRef.current && !notifRef.current.contains(target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const currentNav = NAV_ITEMS.find((i) => i.id === activeRoute);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { meds: [], custs: [], invs: [], routes: [] };
    return {
      meds: medicines
        .filter(
          (m) =>
            m.name.toLowerCase().includes(q) ||
            m.genericName.toLowerCase().includes(q) ||
            m.medicineCode.toLowerCase().includes(q) ||
            m.barcode.includes(q)
        )
        .slice(0, 4),
      custs: customers
        .filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q))
        .slice(0, 3),
      invs: sales
        .filter((s) => s.invoiceNumber.toLowerCase().includes(q) || s.customerName.toLowerCase().includes(q))
        .slice(0, 3),
      routes: NAV_ITEMS.filter((r) => r.label.toLowerCase().includes(q)).slice(0, 3),
    };
  }, [searchQuery, medicines, customers, sales]);

  const hasResults =
    searchResults.meds.length > 0 ||
    searchResults.custs.length > 0 ||
    searchResults.invs.length > 0 ||
    searchResults.routes.length > 0;

  const jumpTo = (route: NavRoute) => {
    setActiveRoute(route);
    setSearchOpen(false);
    setSearchQuery('');
    setQuickOpen(false);
    setNotifOpen(false);
    setProfileOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6 dark:border-slate-800 dark:bg-slate-900 no-print">
      {/* Left: Mobile drawer trigger + Breadcrumb */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          className="inline-flex rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden min-w-0 items-center gap-2 text-sm sm:flex">
          <span className="font-medium text-slate-400 dark:text-slate-500">PMS</span>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <h1 className="truncate font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
            {currentNav?.label ?? 'Dashboard'}
          </h1>
        </div>
      </div>

      {/* Center: Global Search */}
      <div ref={searchRef} className="relative flex-1 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setSearchOpen(true);
          }}
          onFocus={() => setSearchOpen(true)}
          placeholder="Search medicines, barcodes, invoices, patients..."
          aria-label="Global pharmacy search"
          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-teal-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-teal-500 dark:focus:bg-slate-800"
        />

        {searchOpen && searchQuery.trim().length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 max-h-96 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-800 dark:bg-slate-900">
            {!hasResults ? (
              <p className="px-3 py-4 text-center text-xs text-slate-500 dark:text-slate-400">
                No matches found for &ldquo;{searchQuery}&rdquo;
              </p>
            ) : (
              <div className="space-y-2">
                {searchResults.routes.length > 0 && (
                  <div>
                    <p className="px-2 py-1 text-[11px] font-semibold text-slate-400">Modules</p>
                    {searchResults.routes.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => jumpTo(r.id)}
                        className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <span>{r.label}</span>
                        <span className="text-[11px] text-slate-400">{r.group}</span>
                      </button>
                    ))}
                  </div>
                )}

                {searchResults.meds.length > 0 && (
                  <div>
                    <p className="px-2 py-1 text-[11px] font-semibold text-slate-400">Medicines</p>
                    {searchResults.meds.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => jumpTo('medicines')}
                        className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900 dark:text-slate-100">{m.name}</p>
                          <p className="truncate text-[11px] text-slate-500">
                            {m.genericName} · {m.medicineCode}
                          </p>
                        </div>
                        <span className="ml-2 shrink-0 font-mono text-xs text-slate-700 tabular-nums dark:text-slate-300">
                          {formatCurrency(m.sellingPrice, settings.currencySymbol)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {searchResults.invs.length > 0 && (
                  <div>
                    <p className="px-2 py-1 text-[11px] font-semibold text-slate-400">Invoices</p>
                    {searchResults.invs.map((inv) => (
                      <button
                        key={inv.id}
                        type="button"
                        onClick={() => jumpTo('sales')}
                        className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                          {inv.invoiceNumber} · {inv.customerName}
                        </span>
                        <span className="font-mono text-slate-600 tabular-nums dark:text-slate-300">
                          {formatCurrency(inv.grandTotal, settings.currencySymbol)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {searchResults.custs.length > 0 && (
                  <div>
                    <p className="px-2 py-1 text-[11px] font-semibold text-slate-400">Customers</p>
                    {searchResults.custs.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => jumpTo('customers')}
                        className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <span className="font-medium text-slate-900 dark:text-slate-100">{c.name}</span>
                        <span className="font-mono text-[11px] text-slate-500">{c.phone}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex shrink-0 items-center gap-2">
        {/* Quick Actions Dropdown */}
        <div ref={quickRef} className="relative">
          <button
            type="button"
            onClick={() => setQuickOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-teal-800 whitespace-nowrap shrink-0 dark:bg-teal-600 dark:hover:bg-teal-700"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Quick Action</span>
            <ChevronDown className="h-3.5 w-3.5 opacity-80" />
          </button>

          {quickOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => jumpTo('pos')}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <ShoppingCart className="h-4 w-4 text-teal-600" />
                <span>Open POS Terminal</span>
              </button>
              <button
                type="button"
                onClick={() => jumpTo('medicines')}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Pill className="h-4 w-4 text-teal-600" />
                <span>Manage Medicines</span>
              </button>
              <button
                type="button"
                onClick={() => jumpTo('purchases')}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Truck className="h-4 w-4 text-teal-600" />
                <span>New Purchase Order</span>
              </button>
              <button
                type="button"
                onClick={() => jumpTo('prescriptions')}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <ClipboardPlus className="h-4 w-4 text-teal-600" />
                <span>New Prescription</span>
              </button>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          className="rounded-lg border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>

        {/* Notifications Popover */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen((v) => !v)}
            aria-label="Notifications"
            className="relative rounded-lg border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 font-mono text-[10px] font-semibold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Notifications ({unreadCount} unread)
                </span>
                <button
                  type="button"
                  onClick={markAllNotificationsRead}
                  className="text-xs font-medium text-teal-700 hover:underline dark:text-teal-400"
                >
                  Mark all read
                </button>
              </div>
              <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
                {notifications.slice(0, 5).map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      markNotificationRead(n.id, true);
                      jumpTo(n.targetRoute);
                    }}
                    className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                      !n.read ? 'bg-teal-50/40 dark:bg-teal-950/20' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">{n.title}</span>
                      <span className="shrink-0 text-[11px] text-slate-400">{n.category}</span>
                    </div>
                    <p className="line-clamp-2 text-xs text-slate-600 dark:text-slate-400">{n.message}</p>
                    <span className="text-[11px] text-slate-400">{formatDateTime(n.timestamp)}</span>
                  </button>
                ))}
              </div>
              <div className="border-t border-slate-200 p-2 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => jumpTo('notifications')}
                  className="w-full rounded-lg py-1.5 text-center text-xs font-medium text-teal-700 hover:bg-slate-50 dark:text-teal-400 dark:hover:bg-slate-800"
                >
                  Open Notification Center
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 py-1 pl-1.5 pr-2.5 text-left transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <img
              src={MEDICINE_IMAGES.avatarAdmin}
              alt="Dr. Ayesha Siddiqui"
              referrerPolicy="no-referrer"
              className="h-7 w-7 rounded-md object-cover bg-slate-200"
            />
            <div className="hidden text-left md:block">
              <p className="text-xs font-semibold leading-none text-slate-900 dark:text-slate-100">
                Dr. Ayesha Siddiqui
              </p>
              <p className="mt-0.5 text-[11px] leading-none text-slate-500 dark:text-slate-400">
                Chief Pharmacist
              </p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">Dr. Ayesha Siddiqui</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Administrator · DRAP Reg #1492</p>
              </div>
              <button
                type="button"
                onClick={() => jumpTo('settings')}
                className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <User className="h-4 w-4 text-slate-400" />
                <span>Account Settings</span>
              </button>
              <button
                type="button"
                onClick={() => jumpTo('settings')}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Settings className="h-4 w-4 text-slate-400" />
                <span>Pharmacy Preferences</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  setIsLocked(true);
                  pushToast('Session locked', 'info');
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                <LogOut className="h-4 w-4" />
                <span>Lock / Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

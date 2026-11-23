import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronDown,
  ClipboardPlus,
  Info,
  LogOut,
  Menu,
  Moon,
  Pill,
  Plus,
  Settings,
  ShoppingCart,
  Sun,
  Truck,
  User,
} from 'lucide-react';
import { MEDICINE_IMAGES, NAV_ITEMS } from '../../lib/constants';
import { formatCurrency, formatDateTime } from '../../lib/utils';
import { usePMS } from '../../services/pmsStore';
import type { NavRoute, Sale } from '../../types';
import { PrintableInvoiceModal } from '../dialogs/PrintableInvoiceModal';
import { SearchInput } from '../ui/SearchInput';

interface TopBarProps {
  onOpenMobileMenu: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenMobileMenu }) => {
  const {
    activeRoute,
    setActiveRoute,
    triggerQuickAction,
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
  const [selectedInvoice, setSelectedInvoice] = useState<Sale | null>(null);

  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
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
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setQuickOpen(false);
        setNotifOpen(false);
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
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

  const getSeverityIcon = (severity: 'info' | 'warning' | 'critical' | 'success') => {
    if (severity === 'critical') return <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />;
    if (severity === 'warning') return <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />;
    if (severity === 'success') return <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />;
    return <Info className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />;
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-[72px] shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xs sm:px-8 dark:border-slate-800 dark:bg-slate-900/95 no-print">
        {/* Left: Mobile drawer trigger + Breadcrumb */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Open navigation menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 lg:hidden dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden min-w-0 items-center gap-2 text-sm sm:flex">
            <button
              type="button"
              onClick={() => jumpTo('dashboard')}
              className="font-medium text-slate-400 transition-colors hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300"
            >
              PMS
            </button>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            {currentNav && (
              <>
                <span className="hidden text-[13px] text-slate-400 md:inline dark:text-slate-500">
                  {currentNav.group}
                </span>
                <span className="hidden text-slate-300 md:inline dark:text-slate-700">/</span>
              </>
            )}
            <h1 className="truncate font-display text-[15px] font-semibold text-slate-900 dark:text-slate-100">
              {currentNav?.label ?? 'Dashboard'}
            </h1>
          </div>
        </div>

        {/* Center: Global Search with Ctrl+K */}
        <div ref={searchRef} className="relative flex-1 max-w-xl">
          <SearchInput
            ref={searchInputRef}
            size="lg"
            value={searchQuery}
            onValueChange={(val) => {
              setSearchQuery(val);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Search medicines, barcodes, invoices, patients..."
            aria-label="Global pharmacy search"
            rightSlot={
              <kbd className="hidden rounded-md border border-slate-200 bg-white px-2 py-0.5 font-mono text-[11px] font-medium text-slate-400 sm:inline-block dark:border-slate-700 dark:bg-slate-900">
                Ctrl K
              </kbd>
            }
          />

          {searchOpen && searchQuery.trim().length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 max-h-[420px] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2.5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
              {!hasResults ? (
                <p className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  No matches found for &ldquo;{searchQuery}&rdquo;
                </p>
              ) : (
                <div className="space-y-3">
                  {searchResults.routes.length > 0 && (
                    <div>
                      <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Modules
                      </p>
                      {searchResults.routes.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => jumpTo(r.id)}
                          className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          <span>{r.label}</span>
                          <span className="text-xs text-slate-400">{r.group}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchResults.meds.length > 0 && (
                    <div>
                      <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Medicines
                      </p>
                      {searchResults.meds.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => jumpTo('medicines')}
                          className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900 dark:text-slate-100">{m.name}</p>
                            <p className="truncate text-xs text-slate-500">
                              {m.genericName} · {m.medicineCode} · Stock {m.availableQuantity}
                            </p>
                          </div>
                          <span className="ml-3 shrink-0 font-mono text-sm font-semibold text-teal-700 tabular-nums dark:text-teal-400">
                            {formatCurrency(m.sellingPrice, settings.currencySymbol)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchResults.invs.length > 0 && (
                    <div>
                      <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Invoices (click to preview)
                      </p>
                      {searchResults.invs.map((inv) => (
                        <button
                          key={inv.id}
                          type="button"
                          onClick={() => {
                            setSearchOpen(false);
                            setSearchQuery('');
                            setSelectedInvoice(inv);
                          }}
                          className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                            {inv.invoiceNumber} · <span className="font-sans">{inv.customerName}</span>
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
                      <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Customers
                      </p>
                      {searchResults.custs.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => jumpTo('customers')}
                          className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <span className="font-medium text-slate-900 dark:text-slate-100">{c.name}</span>
                          <span className="font-mono text-xs text-slate-500">{c.phone}</span>
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
        <div className="flex shrink-0 items-center gap-2.5">
          {/* Quick Actions Dropdown */}
          <div ref={quickRef} className="relative">
            <button
              type="button"
              onClick={() => setQuickOpen((v) => !v)}
              aria-expanded={quickOpen}
              className="pms-btn-primary"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden md:inline">Quick Action</span>
              <ChevronDown className="h-4 w-4 opacity-80" />
            </button>

            {quickOpen && (
              <div className="absolute right-0 top-full mt-2 w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => jumpTo('pos')}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <ShoppingCart className="h-4 w-4 text-teal-600" />
                  <span>Open POS Terminal</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuickOpen(false);
                    triggerQuickAction('medicines', 'add-medicine');
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Pill className="h-4 w-4 text-teal-600" />
                  <span>Add New Medicine</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuickOpen(false);
                    triggerQuickAction('purchases', 'new-po');
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Truck className="h-4 w-4 text-teal-600" />
                  <span>Create Purchase Order</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuickOpen(false);
                    triggerQuickAction('prescriptions', 'new-rx');
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
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
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {theme === 'light' ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
          </button>

          {/* Notifications Popover */}
          <div ref={notifRef} className="relative">
            <button
              type="button"
              onClick={() => setNotifOpen((v) => !v)}
              aria-label="Notifications"
              aria-expanded={notifOpen}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Bell className="h-[18px] w-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 font-mono text-[11px] font-semibold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3.5 dark:border-slate-800">
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Notifications ({unreadCount} unread)
                  </span>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllNotificationsRead}
                      className="text-xs font-medium text-teal-700 hover:underline dark:text-teal-400"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-slate-400">No active notifications.</p>
                  ) : (
                    notifications.slice(0, 5).map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          markNotificationRead(n.id, true);
                          jumpTo(n.targetRoute);
                        }}
                        className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                          !n.read ? 'bg-teal-50/40 dark:bg-teal-950/20' : ''
                        }`}
                      >
                        <div className="mt-0.5">{getSeverityIcon(n.severity)}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-[13px] font-semibold text-slate-900 dark:text-slate-100">
                              {n.title}
                            </span>
                            <span className="shrink-0 text-[11px] text-slate-400">{n.category}</span>
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-xs text-slate-600 dark:text-slate-400">{n.message}</p>
                          <span className="mt-1 block text-[11px] text-slate-400">{formatDateTime(n.timestamp)}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
                <div className="border-t border-slate-200 p-2 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => jumpTo('notifications')}
                    className="w-full rounded-xl py-2 text-center text-[13px] font-medium text-teal-700 hover:bg-slate-50 dark:text-teal-400 dark:hover:bg-slate-800"
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
              aria-expanded={profileOpen}
              className="flex h-10 items-center gap-2.5 rounded-xl border border-slate-200 pl-1.5 pr-3 text-left transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              <img
                src={MEDICINE_IMAGES.avatarAdmin}
                alt="Dr. Ayesha Siddiqui"
                referrerPolicy="no-referrer"
                className="h-7 w-7 rounded-lg object-cover bg-slate-200"
              />
              <div className="hidden text-left md:block">
                <p className="text-[13px] font-semibold leading-none text-slate-900 dark:text-slate-100">
                  Dr. Ayesha Siddiqui
                </p>
                <p className="mt-0.5 text-[11px] leading-none text-slate-500 dark:text-slate-400">
                  Chief Pharmacist
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-100 px-3 py-2.5 dark:border-slate-800">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Dr. Ayesha Siddiqui</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Administrator · DRAP Reg #1492</p>
                </div>
                <button
                  type="button"
                  onClick={() => jumpTo('settings')}
                  className="mt-1.5 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <User className="h-4 w-4 text-slate-400" />
                  <span>Account Settings</span>
                </button>
                <button
                  type="button"
                  onClick={() => jumpTo('settings')}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
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
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Lock / Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <PrintableInvoiceModal sale={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
    </>
  );
};

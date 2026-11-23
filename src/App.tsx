import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { PMSProvider, usePMS } from './services/pmsStore';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { ToastContainer } from './components/ui/ToastContainer';
import { DashboardPage } from './pages/DashboardPage';
import { POSPage } from './pages/POSPage';
import { MedicinesPage } from './pages/MedicinesPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { InventoryPage } from './pages/InventoryPage';
import { StockPage } from './pages/StockPage';
import { ExpiryPage } from './pages/ExpiryPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { PurchasesPage } from './pages/PurchasesPage';
import { CustomersPage } from './pages/CustomersPage';
import { PrescriptionsPage } from './pages/PrescriptionsPage';
import { SalesPage } from './pages/SalesPage';
import { ReturnsPage } from './pages/ReturnsPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { ReportsPage } from './pages/ReportsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SettingsPage } from './pages/SettingsPage';

const PMSShell: React.FC = () => {
  const { activeRoute, isLocked, setIsLocked, settings } = usePMS();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');

  if (isLocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4 dark:bg-slate-950">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPinInput('');
            setIsLocked(false);
          }}
          className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-700 text-white">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                Session Locked
              </h1>
              <p className="text-xs text-slate-500">{settings.pharmacyName}</p>
            </div>
          </div>
          <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
            Pharmacist Access PIN (any key to unlock demo)
          </label>
          <input
            type="password"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            placeholder="••••"
            className="mb-4 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-800"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-teal-700 py-2.5 text-xs font-semibold text-white hover:bg-teal-800"
          >
            Sign Back In as Dr. Ayesha Siddiqui
          </button>
        </form>
      </div>
    );
  }

  const renderPage = () => {
    switch (activeRoute) {
      case 'dashboard':
        return <DashboardPage />;
      case 'pos':
        return <POSPage />;
      case 'medicines':
        return <MedicinesPage />;
      case 'categories':
        return <CategoriesPage />;
      case 'inventory':
        return <InventoryPage />;
      case 'stock':
        return <StockPage />;
      case 'expiry':
        return <ExpiryPage />;
      case 'suppliers':
        return <SuppliersPage />;
      case 'purchases':
        return <PurchasesPage />;
      case 'customers':
        return <CustomersPage />;
      case 'prescriptions':
        return <PrescriptionsPage />;
      case 'sales':
        return <SalesPage />;
      case 'returns':
        return <ReturnsPage />;
      case 'employees':
        return <EmployeesPage />;
      case 'expenses':
        return <ExpensesPage />;
      case 'reports':
        return <ReportsPage />;
      case 'notifications':
        return <NotificationsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Sidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onOpenMobileMenu={() => setMobileMenuOpen(true)} />
        <main className="flex-1 p-4 sm:p-6">
          <div className="mx-auto max-w-[1440px]">{renderPage()}</div>
        </main>
      </div>
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <PMSProvider>
      <PMSShell />
    </PMSProvider>
  );
}

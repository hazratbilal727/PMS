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
          className="pms-card w-full max-w-md p-7 shadow-lg"
        >
          <div className="mb-5 flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-700 text-white dark:bg-teal-600">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                Session Locked
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">{settings.pharmacyName}</p>
            </div>
          </div>
          <label className="pms-label">
            Pharmacist Access PIN (any key to unlock demo)
          </label>
          <input
            type="password"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            placeholder="••••"
            className="pms-input mb-5 font-mono"
          />
          <button
            type="submit"
            className="pms-btn-primary w-full"
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
        <main className="flex-1 p-5 sm:p-8">
          <div className="mx-auto max-w-[1480px]">{renderPage()}</div>
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

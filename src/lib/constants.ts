import type { DosageForm, ExpenseCategory, NavRoute, RolePermissionMatrix, StaffRole } from '../types';

export interface NavItemConfig {
  id: NavRoute;
  label: string;
  group: 'Core' | 'Inventory' | 'Operations' | 'Administration';
}

export const NAV_ITEMS: NavItemConfig[] = [
  { id: 'dashboard', label: 'Dashboard', group: 'Core' },
  { id: 'pos', label: 'Point of Sale (POS)', group: 'Core' },
  { id: 'medicines', label: 'Medicines', group: 'Inventory' },
  { id: 'categories', label: 'Categories', group: 'Inventory' },
  { id: 'inventory', label: 'Inventory Management', group: 'Inventory' },
  { id: 'stock', label: 'Stock Management', group: 'Inventory' },
  { id: 'expiry', label: 'Expiry Management', group: 'Inventory' },
  { id: 'prescriptions', label: 'Prescriptions', group: 'Operations' },
  { id: 'sales', label: 'Sales', group: 'Operations' },
  { id: 'purchases', label: 'Purchases', group: 'Operations' },
  { id: 'returns', label: 'Returns & Refunds', group: 'Operations' },
  { id: 'suppliers', label: 'Suppliers', group: 'Operations' },
  { id: 'customers', label: 'Customers', group: 'Operations' },
  { id: 'employees', label: 'Employees & Staff', group: 'Administration' },
  { id: 'expenses', label: 'Expenses', group: 'Administration' },
  { id: 'reports', label: 'Reports & Analytics', group: 'Administration' },
  { id: 'notifications', label: 'Notifications', group: 'Administration' },
  { id: 'settings', label: 'Settings', group: 'Administration' },
];

export const DOSAGE_FORMS: DosageForm[] = [
  'Tablets',
  'Capsules',
  'Syrups',
  'Injections',
  'Creams',
  'Drops',
  'Medical Devices',
  'Other Healthcare Products',
];

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Utilities & Electricity',
  'Rent & Facility',
  'Cold-Chain & Storage',
  'Staff Welfare & Payroll',
  'Packaging & Consumables',
  'Logistics & Courier',
  'Maintenance & Calibration',
  'Licensing & Compliance',
];

export const STAFF_ROLES: StaffRole[] = [
  'Administrator',
  'Pharmacist',
  'Cashier',
  'Inventory Manager',
  'Sales Manager',
];

export const DEFAULT_ROLE_PERMISSIONS: RolePermissionMatrix = {
  Administrator: {
    posAccess: true,
    manageMedicines: true,
    adjustInventory: true,
    approvePurchases: true,
    processRefunds: true,
    viewFinancialReports: true,
    manageStaff: true,
    systemSettings: true,
  },
  Pharmacist: {
    posAccess: true,
    manageMedicines: true,
    adjustInventory: true,
    approvePurchases: true,
    processRefunds: true,
    viewFinancialReports: false,
    manageStaff: false,
    systemSettings: false,
  },
  Cashier: {
    posAccess: true,
    manageMedicines: false,
    adjustInventory: false,
    approvePurchases: false,
    processRefunds: false,
    viewFinancialReports: false,
    manageStaff: false,
    systemSettings: false,
  },
  'Inventory Manager': {
    posAccess: false,
    manageMedicines: true,
    adjustInventory: true,
    approvePurchases: true,
    processRefunds: false,
    viewFinancialReports: false,
    manageStaff: false,
    systemSettings: false,
  },
  'Sales Manager': {
    posAccess: true,
    manageMedicines: false,
    adjustInventory: false,
    approvePurchases: false,
    processRefunds: true,
    viewFinancialReports: true,
    manageStaff: false,
    systemSettings: false,
  },
};

export const MEDICINE_IMAGES = {
  tablets: '/src/assets/images/medicine_tablets_pack_1795439150730.jpg',
  syrup: '/src/assets/images/medicine_syrup_bottle_1795439150143.jpg',
  vialDevice: '/src/assets/images/medicine_vial_device_1795439150085.jpg',
  avatarAdmin: '/src/assets/images/avatar_pharmacist_admin_1795439149711.jpg',
};

export const REFERENCE_TODAY = '2026-11-23';

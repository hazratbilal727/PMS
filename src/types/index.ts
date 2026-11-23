export type NavRoute =
  | 'dashboard'
  | 'pos'
  | 'medicines'
  | 'categories'
  | 'inventory'
  | 'suppliers'
  | 'customers'
  | 'sales'
  | 'purchases'
  | 'prescriptions'
  | 'stock'
  | 'expiry'
  | 'returns'
  | 'employees'
  | 'expenses'
  | 'reports'
  | 'notifications'
  | 'settings';

export type DosageForm =
  | 'Tablets'
  | 'Capsules'
  | 'Syrups'
  | 'Injections'
  | 'Creams'
  | 'Drops'
  | 'Medical Devices'
  | 'Other Healthcare Products';

export type PaymentMethod = 'Cash' | 'Card' | 'Bank Transfer' | 'Other';
export type PaymentStatus = 'Paid' | 'Pending' | 'Partial' | 'Refunded';
export type StaffRole =
  | 'Administrator'
  | 'Pharmacist'
  | 'Cashier'
  | 'Inventory Manager'
  | 'Sales Manager';

export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  brandName: string;
  medicineCode: string;
  barcode: string;
  category: string;
  manufacturer: string;
  batchNumber: string;
  dosageForm: DosageForm;
  strength: string;
  packSize: string;
  purchasePrice: number;
  sellingPrice: number;
  availableQuantity: number;
  minimumStockLevel: number;
  manufacturingDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  supplierId: string;
  supplierName: string;
  prescriptionRequired: boolean;
  description: string;
  imageUrl: string;
  shelfLocation?: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  dosageGroup: DosageForm;
  description: string;
  taxRate: number;
  requiresPrescriptionDefault: boolean;
}

export interface SupplierPayment {
  id: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  notes?: string;
}

export interface Supplier {
  id: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  ntnNumber: string;
  gstNumber?: string;
  outstandingBalance: number;
  totalSuppliedValue: number;
  lastOrderDate: string;
  status: 'Active' | 'Inactive';
  paymentHistory: SupplierPayment[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  age?: number;
  gender?: 'Male' | 'Female' | 'Other';
  allergies?: string;
  totalSpending: number;
  outstandingBalance: number;
  totalVisits: number;
  lastVisitDate: string;
  createdAt: string;
}

export interface SaleItem {
  medicineId: string;
  medicineName: string;
  medicineCode: string;
  batchNumber: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  lineTotal: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  date: string; // ISO string
  customerId: string;
  customerName: string;
  customerPhone?: string;
  items: SaleItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  cashierName: string;
  prescriptionId?: string;
  notes?: string;
}

export interface PurchaseItem {
  medicineId: string;
  medicineName: string;
  batchNumber: string;
  quantity: number;
  purchasePrice: number;
  manufacturingDate: string;
  expiryDate: string;
  lineTotal: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  date: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  stockStatus: 'Pending' | 'Received' | 'Partial';
  expectedDate: string;
  receivedDate?: string;
  notes?: string;
}

export interface PrescriptionItem {
  medicineId?: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions?: string;
}

export interface Prescription {
  id: string;
  prescriptionNumber: string;
  date: string;
  patientId?: string;
  patientName: string;
  patientPhone: string;
  patientAge: number;
  doctorName: string;
  doctorLicense: string;
  clinicName: string;
  diagnosis: string;
  items: PrescriptionItem[];
  status: 'Pending' | 'Dispensed' | 'Partial' | 'Cancelled';
  linkedSaleInvoice?: string;
  imagePreviewUrl?: string;
  notes?: string;
}

export type InventoryTransactionType =
  | 'Stock In'
  | 'Stock Out'
  | 'Manual Adjustment'
  | 'Damaged Write-Off'
  | 'Expired Removal'
  | 'Supplier Return'
  | 'Customer Return'
  | 'Stock Transfer';

export interface InventoryTransaction {
  id: string;
  date: string;
  medicineId: string;
  medicineName: string;
  batchNumber: string;
  type: InventoryTransactionType;
  quantityChange: number;
  previousStock: number;
  newStock: number;
  reason: string;
  performedBy: string;
  referenceCode?: string;
}

export interface StockTransfer {
  id: string;
  transferCode: string;
  date: string;
  medicineId: string;
  medicineName: string;
  batchNumber: string;
  quantity: number;
  fromLocation: string;
  toLocation: string;
  status: 'Completed' | 'In Transit';
  authorizedBy: string;
}

export interface ReturnRecord {
  id: string;
  returnNumber: string;
  date: string;
  saleId: string;
  invoiceNumber: string;
  customerName: string;
  items: {
    medicineId: string;
    medicineName: string;
    quantity: number;
    refundUnitPrice: number;
    restockable: boolean;
  }[];
  refundAmount: number;
  refundMethod: PaymentMethod;
  reason: string;
  processedBy: string;
  status: 'Completed' | 'Pending Approval';
}

export interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  role: StaffRole;
  phone: string;
  email: string;
  cnic: string;
  salaryPkr: number;
  joinDate: string;
  shift: 'Morning (08:00 - 16:00)' | 'Evening (14:00 - 22:00)' | 'Night (22:00 - 08:00)';
  status: 'Active' | 'On Leave' | 'Inactive';
  avatarUrl?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  role: StaffRole;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'Present' | 'Absent' | 'Late' | 'Leave';
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: StaffRole;
  module: string;
  action: string;
  details: string;
}

export type RolePermissionMatrix = Record<
  StaffRole,
  {
    posAccess: boolean;
    manageMedicines: boolean;
    adjustInventory: boolean;
    approvePurchases: boolean;
    processRefunds: boolean;
    viewFinancialReports: boolean;
    manageStaff: boolean;
    systemSettings: boolean;
  }
>;

export type ExpenseCategory =
  | 'Utilities & Electricity'
  | 'Rent & Facility'
  | 'Cold-Chain & Storage'
  | 'Staff Welfare & Payroll'
  | 'Packaging & Consumables'
  | 'Logistics & Courier'
  | 'Maintenance & Calibration'
  | 'Licensing & Compliance';

export interface Expense {
  id: string;
  voucherNumber: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  recordedBy: string;
  vendor?: string;
}

export type NotificationCategory =
  | 'Low Stock'
  | 'Expiry Warning'
  | 'Expired Stock'
  | 'New Sale'
  | 'Purchase Update'
  | 'Payment Reminder'
  | 'System';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  severity: 'info' | 'warning' | 'critical' | 'success';
  timestamp: string;
  read: boolean;
  targetRoute: NavRoute;
}

export interface PharmacySettings {
  pharmacyName: string;
  tagline: string;
  licenseNumber: string;
  ntnNumber: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  city: string;
  country: string;
  currencyCode: string;
  currencySymbol: string;
  defaultTaxPercent: number;
  applyTaxOnMedicines: boolean;
  invoicePrefix: string;
  receiptFooterNote: string;
  lowStockThresholdDefault: number;
  expiryAlertDays: number;
  language: 'English (PK)' | 'English (US)' | 'Urdu Support';
  autoBackupEnabled: boolean;
  backupFrequency: 'Daily' | 'Weekly' | 'Manual';
  lastBackupAt: string;
  notifyLowStock: boolean;
  notifyExpiry: boolean;
  notifySalesOverAmount: boolean;
  dbProvider: 'PostgreSQL + Prisma (Ready)' | 'Local Mock Repository';
}

// Backend & Database Readiness: API-ready DTOs
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

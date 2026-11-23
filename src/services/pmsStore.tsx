import React, { createContext, useCallback, useContext, useState } from 'react';
import { DEFAULT_ROLE_PERMISSIONS, REFERENCE_TODAY } from '../lib/constants';
import { generateId } from '../lib/utils';
import {
  INITIAL_ACTIVITY_LOGS,
  INITIAL_ATTENDANCE,
  INITIAL_CATEGORIES,
  INITIAL_CUSTOMERS,
  INITIAL_EMPLOYEES,
  INITIAL_EXPENSES,
  INITIAL_INVENTORY_TX,
  INITIAL_MEDICINES,
  INITIAL_NOTIFICATIONS,
  INITIAL_PRESCRIPTIONS,
  INITIAL_PURCHASES,
  INITIAL_RETURNS,
  INITIAL_SALES,
  INITIAL_SETTINGS,
  INITIAL_SUPPLIERS,
  INITIAL_TRANSFERS,
} from '../mock-data';
import type {
  ActivityLog,
  AppNotification,
  AttendanceRecord,
  CategoryItem,
  Customer,
  Employee,
  Expense,
  InventoryTransaction,
  InventoryTransactionType,
  Medicine,
  NavRoute,
  PaymentMethod,
  PaymentStatus,
  PharmacySettings,
  Prescription,
  PurchaseOrder,
  ReturnRecord,
  RolePermissionMatrix,
  Sale,
  SaleItem,
  StaffRole,
  StockTransfer,
  Supplier,
} from '../types';

export interface ToastMessage {
  id: string;
  title: string;
  type: 'success' | 'error' | 'info';
}

export interface POSDraftItem {
  medicineId: string;
  quantity: number;
}

interface PMSContextValue {
  activeRoute: NavRoute;
  setActiveRoute: (route: NavRoute) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  isLocked: boolean;
  setIsLocked: (v: boolean) => void;
  toasts: ToastMessage[];
  pushToast: (title: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;

  // Entities
  medicines: Medicine[];
  categories: CategoryItem[];
  suppliers: Supplier[];
  customers: Customer[];
  sales: Sale[];
  purchases: PurchaseOrder[];
  prescriptions: Prescription[];
  inventoryTx: InventoryTransaction[];
  transfers: StockTransfer[];
  returns: ReturnRecord[];
  employees: Employee[];
  attendance: AttendanceRecord[];
  activityLogs: ActivityLog[];
  rolePermissions: RolePermissionMatrix;
  expenses: Expense[];
  notifications: AppNotification[];
  settings: PharmacySettings;

  // Cross-module POS handoff from Prescriptions
  posDraft: { customerId?: string; prescriptionId?: string; items: POSDraftItem[] } | null;
  clearPosDraft: () => void;
  sendPrescriptionToPOS: (prescriptionId: string) => void;

  // Actions
  addMedicine: (med: Omit<Medicine, 'id'>) => void;
  updateMedicine: (id: string, patch: Partial<Medicine>) => void;
  deleteMedicine: (id: string) => void;
  importMedicinesBatch: (items: Omit<Medicine, 'id'>[]) => void;

  addCategory: (cat: Omit<CategoryItem, 'id'>) => void;
  updateCategory: (id: string, patch: Partial<CategoryItem>) => void;
  deleteCategory: (id: string) => void;

  addSupplier: (sup: Omit<Supplier, 'id' | 'paymentHistory' | 'totalSuppliedValue' | 'lastOrderDate'>) => void;
  updateSupplier: (id: string, patch: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  recordSupplierPayment: (supplierId: string, amount: number, method: PaymentMethod, reference: string) => void;

  addCustomer: (cust: Omit<Customer, 'id' | 'totalSpending' | 'totalVisits' | 'lastVisitDate' | 'createdAt'>) => Customer;
  updateCustomer: (id: string, patch: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  completeSale: (payload: {
    customerId: string;
    items: SaleItem[];
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    grandTotal: number;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    prescriptionId?: string;
    notes?: string;
  }) => Sale;

  adjustStock: (payload: {
    medicineId: string;
    quantityChange: number;
    type: InventoryTransactionType;
    reason: string;
  }) => void;

  transferStock: (payload: {
    medicineId: string;
    quantity: number;
    fromLocation: string;
    toLocation: string;
  }) => void;

  removeExpiredBatch: (medicineId: string, quantity: number, disposition: 'Expired Removal' | 'Supplier Return', notes: string) => void;

  createPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'poNumber'>) => PurchaseOrder;
  receivePurchaseOrder: (poId: string) => void;

  addPrescription: (rx: Omit<Prescription, 'id' | 'prescriptionNumber'>) => void;
  updatePrescriptionStatus: (id: string, status: Prescription['status']) => void;

  processReturn: (payload: {
    saleId: string;
    items: ReturnRecord['items'];
    refundAmount: number;
    refundMethod: PaymentMethod;
    reason: string;
  }) => void;

  addEmployee: (emp: Omit<Employee, 'id' | 'employeeCode'>) => void;
  updateEmployeeStatus: (id: string, status: Employee['status']) => void;
  updateAttendanceStatus: (employeeId: string, status: AttendanceRecord['status']) => void;
  toggleRolePermission: (role: StaffRole, key: keyof RolePermissionMatrix[StaffRole]) => void;

  addExpense: (exp: Omit<Expense, 'id' | 'voucherNumber'>) => void;

  markNotificationRead: (id: string, read?: boolean) => void;
  markAllNotificationsRead: () => void;

  updateSettings: (patch: Partial<PharmacySettings>) => void;
}

const PMSContext = createContext<PMSContextValue | null>(null);

export const PMSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeRoute, setActiveRoute] = useState<NavRoute>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const [medicines, setMedicines] = useState<Medicine[]>(INITIAL_MEDICINES);
  const [categories, setCategories] = useState<CategoryItem[]>(INITIAL_CATEGORIES);
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [sales, setSales] = useState<Sale[]>(INITIAL_SALES);
  const [purchases, setPurchases] = useState<PurchaseOrder[]>(INITIAL_PURCHASES);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(INITIAL_PRESCRIPTIONS);
  const [inventoryTx, setInventoryTx] = useState<InventoryTransaction[]>(INITIAL_INVENTORY_TX);
  const [transfers, setTransfers] = useState<StockTransfer[]>(INITIAL_TRANSFERS);
  const [returns, setReturns] = useState<ReturnRecord[]>(INITIAL_RETURNS);
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(INITIAL_ACTIVITY_LOGS);
  const [rolePermissions, setRolePermissions] = useState<RolePermissionMatrix>(DEFAULT_ROLE_PERMISSIONS);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [settings, setSettings] = useState<PharmacySettings>(INITIAL_SETTINGS);
  const [posDraft, setPosDraft] = useState<PMSContextValue['posDraft']>(null);

  const pushToast = useCallback((title: string, type: ToastMessage['type'] = 'success') => {
    const id = generateId('toast');
    setToasts((prev) => [...prev, { id, title, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const logActivity = useCallback((module: string, action: string, details: string) => {
    setActivityLogs((prev) => [
      {
        id: generateId('act'),
        timestamp: new Date().toISOString(),
        actorName: 'Dr. Ayesha Siddiqui',
        actorRole: 'Administrator',
        module,
        action,
        details,
      },
      ...prev,
    ]);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      if (next === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  }, []);

  // Medicines
  const addMedicine = useCallback(
    (med: Omit<Medicine, 'id'>) => {
      const newMed: Medicine = { ...med, id: generateId('med') };
      setMedicines((prev) => [newMed, ...prev]);
      logActivity('Medicines', 'Added Medicine', `${newMed.name} (${newMed.medicineCode}) · Stock: ${newMed.availableQuantity}`);
      pushToast(`Added ${newMed.name} to catalog`);
    },
    [logActivity, pushToast]
  );

  const updateMedicine = useCallback(
    (id: string, patch: Partial<Medicine>) => {
      setMedicines((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
      logActivity('Medicines', 'Updated Medicine', `Updated record ${id}`);
      pushToast('Medicine details updated');
    },
    [logActivity, pushToast]
  );

  const deleteMedicine = useCallback(
    (id: string) => {
      const target = medicines.find((m) => m.id === id);
      setMedicines((prev) => prev.filter((m) => m.id !== id));
      logActivity('Medicines', 'Deleted Medicine', target ? target.name : id);
      pushToast('Medicine removed from catalog', 'info');
    },
    [medicines, logActivity, pushToast]
  );

  const importMedicinesBatch = useCallback(
    (items: Omit<Medicine, 'id'>[]) => {
      const created = items.map((item) => ({ ...item, id: generateId('med') }));
      setMedicines((prev) => [...created, ...prev]);
      logActivity('Medicines', 'Batch Import', `Imported ${created.length} medicine records`);
      pushToast(`Imported ${created.length} medicines`);
    },
    [logActivity, pushToast]
  );

  // Categories
  const addCategory = useCallback(
    (cat: Omit<CategoryItem, 'id'>) => {
      setCategories((prev) => [{ ...cat, id: generateId('cat') }, ...prev]);
      pushToast(`Category "${cat.name}" created`);
    },
    [pushToast]
  );

  const updateCategory = useCallback(
    (id: string, patch: Partial<CategoryItem>) => {
      setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
      pushToast('Category updated');
    },
    [pushToast]
  );

  const deleteCategory = useCallback(
    (id: string) => {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      pushToast('Category deleted', 'info');
    },
    [pushToast]
  );

  // Suppliers
  const addSupplier = useCallback(
    (sup: Omit<Supplier, 'id' | 'paymentHistory' | 'totalSuppliedValue' | 'lastOrderDate'>) => {
      const created: Supplier = {
        ...sup,
        id: generateId('sup'),
        paymentHistory: [],
        totalSuppliedValue: 0,
        lastOrderDate: REFERENCE_TODAY,
      };
      setSuppliers((prev) => [created, ...prev]);
      logActivity('Suppliers', 'Added Supplier', created.companyName);
      pushToast(`Added supplier ${created.companyName}`);
    },
    [logActivity, pushToast]
  );

  const updateSupplier = useCallback(
    (id: string, patch: Partial<Supplier>) => {
      setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
      pushToast('Supplier details updated');
    },
    [pushToast]
  );

  const deleteSupplier = useCallback(
    (id: string) => {
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
      pushToast('Supplier removed', 'info');
    },
    [pushToast]
  );

  const recordSupplierPayment = useCallback(
    (supplierId: string, amount: number, method: PaymentMethod, reference: string) => {
      setSuppliers((prev) =>
        prev.map((s) => {
          if (s.id !== supplierId) return s;
          return {
            ...s,
            outstandingBalance: Math.max(0, s.outstandingBalance - amount),
            paymentHistory: [
              { id: generateId('sp'), date: REFERENCE_TODAY, amount, method, reference },
              ...s.paymentHistory,
            ],
          };
        })
      );
      logActivity('Suppliers', 'Supplier Payment', `Recorded payment of ${amount} via ${method} (${reference})`);
      pushToast('Supplier payment recorded');
    },
    [logActivity, pushToast]
  );

  // Customers
  const addCustomer = useCallback(
    (cust: Omit<Customer, 'id' | 'totalSpending' | 'totalVisits' | 'lastVisitDate' | 'createdAt'>): Customer => {
      const created: Customer = {
        ...cust,
        id: generateId('cust'),
        totalSpending: 0,
        totalVisits: 0,
        lastVisitDate: REFERENCE_TODAY,
        createdAt: REFERENCE_TODAY,
      };
      setCustomers((prev) => [created, ...prev]);
      pushToast(`Added customer ${created.name}`);
      return created;
    },
    [pushToast]
  );

  const updateCustomer = useCallback(
    (id: string, patch: Partial<Customer>) => {
      setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
      pushToast('Customer profile updated');
    },
    [pushToast]
  );

  const deleteCustomer = useCallback(
    (id: string) => {
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      pushToast('Customer removed', 'info');
    },
    [pushToast]
  );

  // POS Sale Completion (cross-module reactive)
  const completeSale = useCallback(
    (payload: {
      customerId: string;
      items: SaleItem[];
      subtotal: number;
      discountAmount: number;
      taxAmount: number;
      grandTotal: number;
      paymentMethod: PaymentMethod;
      paymentStatus: PaymentStatus;
      prescriptionId?: string;
      notes?: string;
    }): Sale => {
      const customer = customers.find((c) => c.id === payload.customerId) ?? customers[0];
      const invNum = `${settings.invoicePrefix}${1049 + sales.length}`;
      const newSale: Sale = {
        id: generateId('sale'),
        invoiceNumber: invNum,
        date: new Date().toISOString(),
        customerId: customer?.id ?? 'cust-walkin',
        customerName: customer?.name ?? 'Walk-in Customer',
        customerPhone: customer?.phone,
        items: payload.items,
        subtotal: payload.subtotal,
        discountAmount: payload.discountAmount,
        taxAmount: payload.taxAmount,
        grandTotal: payload.grandTotal,
        paymentMethod: payload.paymentMethod,
        paymentStatus: payload.paymentStatus,
        cashierName: 'Dr. Ayesha Siddiqui',
        prescriptionId: payload.prescriptionId,
        notes: payload.notes,
      };

      setSales((prev) => [newSale, ...prev]);

      // Deduct inventory & log stock-out transactions
      const newTx: InventoryTransaction[] = [];
      setMedicines((prevMeds) =>
        prevMeds.map((med) => {
          const soldLine = payload.items.find((i) => i.medicineId === med.id);
          if (!soldLine) return med;
          const nextQty = Math.max(0, med.availableQuantity - soldLine.quantity);
          newTx.push({
            id: generateId('tx'),
            date: new Date().toISOString(),
            medicineId: med.id,
            medicineName: med.name,
            batchNumber: med.batchNumber,
            type: 'Stock Out',
            quantityChange: -soldLine.quantity,
            previousStock: med.availableQuantity,
            newStock: nextQty,
            reason: `POS Sale ${invNum}`,
            performedBy: 'Dr. Ayesha Siddiqui',
            referenceCode: invNum,
          });
          return { ...med, availableQuantity: nextQty };
        })
      );

      setInventoryTx((prev) => [...newTx, ...prev]);

      // Update customer spending
      if (customer) {
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === customer.id
              ? {
                  ...c,
                  totalSpending: c.totalSpending + payload.grandTotal,
                  totalVisits: c.totalVisits + 1,
                  lastVisitDate: REFERENCE_TODAY,
                  outstandingBalance:
                    payload.paymentStatus === 'Pending'
                      ? c.outstandingBalance + payload.grandTotal
                      : c.outstandingBalance,
                }
              : c
          )
        );
      }

      // Link prescription if dispensed
      if (payload.prescriptionId) {
        setPrescriptions((prev) =>
          prev.map((rx) =>
            rx.id === payload.prescriptionId
              ? { ...rx, status: 'Dispensed', linkedSaleInvoice: invNum }
              : rx
          )
        );
      }

      setNotifications((prev) => [
        {
          id: generateId('notif'),
          title: `New Sale Completed (${invNum})`,
          message: `Sold ${payload.items.length} item(s) to ${customer?.name ?? 'Walk-in'} for ${settings.currencySymbol} ${payload.grandTotal.toLocaleString()}.`,
          category: 'New Sale',
          severity: 'success',
          timestamp: new Date().toISOString(),
          read: false,
          targetRoute: 'sales',
        },
        ...prev,
      ]);

      logActivity('POS', 'Completed Sale', `${invNum} · ${settings.currencySymbol} ${payload.grandTotal.toLocaleString()} (${payload.paymentMethod})`);
      pushToast(`Sale ${invNum} completed`);
      return newSale;
    },
    [customers, sales.length, settings.currencySymbol, settings.invoicePrefix, logActivity, pushToast]
  );

  // Stock Adjustment
  const adjustStock = useCallback(
    (payload: { medicineId: string; quantityChange: number; type: InventoryTransactionType; reason: string }) => {
      setMedicines((prev) =>
        prev.map((med) => {
          if (med.id !== payload.medicineId) return med;
          const nextQty = Math.max(0, med.availableQuantity + payload.quantityChange);
          setInventoryTx((txPrev) => [
            {
              id: generateId('tx'),
              date: new Date().toISOString(),
              medicineId: med.id,
              medicineName: med.name,
              batchNumber: med.batchNumber,
              type: payload.type,
              quantityChange: payload.quantityChange,
              previousStock: med.availableQuantity,
              newStock: nextQty,
              reason: payload.reason,
              performedBy: 'Dr. Ayesha Siddiqui',
              referenceCode: generateId('ADJ'),
            },
            ...txPrev,
          ]);
          return { ...med, availableQuantity: nextQty };
        })
      );
      logActivity('Inventory', payload.type, payload.reason);
      pushToast('Stock adjusted and logged');
    },
    [logActivity, pushToast]
  );

  // Stock Transfer
  const transferStock = useCallback(
    (payload: { medicineId: string; quantity: number; fromLocation: string; toLocation: string }) => {
      const med = medicines.find((m) => m.id === payload.medicineId);
      if (!med) return;
      const transfer: StockTransfer = {
        id: generateId('st'),
        transferCode: `TRF-2026-0${43 + transfers.length}`,
        date: REFERENCE_TODAY,
        medicineId: med.id,
        medicineName: med.name,
        batchNumber: med.batchNumber,
        quantity: payload.quantity,
        fromLocation: payload.fromLocation,
        toLocation: payload.toLocation,
        status: 'Completed',
        authorizedBy: 'Dr. Ayesha Siddiqui',
      };
      setTransfers((prev) => [transfer, ...prev]);
      setMedicines((prev) =>
        prev.map((m) => (m.id === med.id ? { ...m, shelfLocation: payload.toLocation } : m))
      );
      setInventoryTx((prev) => [
        {
          id: generateId('tx'),
          date: new Date().toISOString(),
          medicineId: med.id,
          medicineName: med.name,
          batchNumber: med.batchNumber,
          type: 'Stock Transfer',
          quantityChange: 0,
          previousStock: med.availableQuantity,
          newStock: med.availableQuantity,
          reason: `Transferred ${payload.quantity} units from ${payload.fromLocation} to ${payload.toLocation}`,
          performedBy: 'Dr. Ayesha Siddiqui',
          referenceCode: transfer.transferCode,
        },
        ...prev,
      ]);
      logActivity('Inventory', 'Stock Transfer', `${transfer.transferCode}: ${med.name} → ${payload.toLocation}`);
      pushToast(`Transfer ${transfer.transferCode} completed`);
    },
    [medicines, transfers.length, logActivity, pushToast]
  );

  // Expiry removal / supplier return
  const removeExpiredBatch = useCallback(
    (medicineId: string, quantity: number, disposition: 'Expired Removal' | 'Supplier Return', notes: string) => {
      adjustStock({
        medicineId,
        quantityChange: -Math.abs(quantity),
        type: disposition,
        reason: notes || `${disposition} processed via Expiry Management`,
      });
    },
    [adjustStock]
  );

  // Purchases
  const createPurchaseOrder = useCallback(
    (po: Omit<PurchaseOrder, 'id' | 'poNumber'>): PurchaseOrder => {
      const created: PurchaseOrder = {
        ...po,
        id: generateId('po'),
        poNumber: `PO-2026-0${414 + purchases.length}`,
      };
      setPurchases((prev) => [created, ...prev]);
      const unpaid = Math.max(0, created.totalAmount - created.paidAmount);
      if (unpaid > 0) {
        setSuppliers((prev) =>
          prev.map((s) =>
            s.id === created.supplierId
              ? {
                  ...s,
                  outstandingBalance: s.outstandingBalance + unpaid,
                  lastOrderDate: created.date,
                }
              : s
          )
        );
      }
      logActivity('Purchases', 'Created Purchase Order', `${created.poNumber} · ${created.supplierName}`);
      pushToast(`Created ${created.poNumber}`);
      return created;
    },
    [purchases.length, logActivity, pushToast]
  );

  const receivePurchaseOrder = useCallback(
    (poId: string) => {
      const target = purchases.find((p) => p.id === poId);
      if (!target || target.stockStatus === 'Received') return;

      setPurchases((prev) =>
        prev.map((p) =>
          p.id === poId ? { ...p, stockStatus: 'Received', receivedDate: REFERENCE_TODAY } : p
        )
      );

      const txToLog: InventoryTransaction[] = [];
      setMedicines((prevMeds) =>
        prevMeds.map((med) => {
          const item = target.items.find((i) => i.medicineId === med.id);
          if (!item) return med;
          const nextQty = med.availableQuantity + item.quantity;
          txToLog.push({
            id: generateId('tx'),
            date: new Date().toISOString(),
            medicineId: med.id,
            medicineName: med.name,
            batchNumber: item.batchNumber || med.batchNumber,
            type: 'Stock In',
            quantityChange: item.quantity,
            previousStock: med.availableQuantity,
            newStock: nextQty,
            reason: `Received Purchase Order ${target.poNumber}`,
            performedBy: 'Dr. Ayesha Siddiqui',
            referenceCode: target.poNumber,
          });
          return {
            ...med,
            availableQuantity: nextQty,
            batchNumber: item.batchNumber || med.batchNumber,
            purchasePrice: item.purchasePrice || med.purchasePrice,
            manufacturingDate: item.manufacturingDate || med.manufacturingDate,
            expiryDate: item.expiryDate || med.expiryDate,
          };
        })
      );

      setInventoryTx((prev) => [...txToLog, ...prev]);
      setSuppliers((prev) =>
        prev.map((s) =>
          s.id === target.supplierId
            ? { ...s, totalSuppliedValue: s.totalSuppliedValue + target.totalAmount }
            : s
        )
      );
      logActivity('Purchases', 'Received Stock', `${target.poNumber} checked into stock`);
      pushToast(`Stock received for ${target.poNumber}`);
    },
    [purchases, logActivity, pushToast]
  );

  // Prescriptions
  const addPrescription = useCallback(
    (rx: Omit<Prescription, 'id' | 'prescriptionNumber'>) => {
      const created: Prescription = {
        ...rx,
        id: generateId('rx'),
        prescriptionNumber: `RX-2026-${884 + prescriptions.length}`,
      };
      setPrescriptions((prev) => [created, ...prev]);
      logActivity('Prescriptions', 'Created Prescription', `${created.prescriptionNumber} for ${created.patientName}`);
      pushToast(`Saved ${created.prescriptionNumber}`);
    },
    [prescriptions.length, logActivity, pushToast]
  );

  const updatePrescriptionStatus = useCallback(
    (id: string, status: Prescription['status']) => {
      setPrescriptions((prev) => prev.map((rx) => (rx.id === id ? { ...rx, status } : rx)));
      pushToast(`Prescription marked as ${status}`);
    },
    [pushToast]
  );

  const sendPrescriptionToPOS = useCallback(
    (prescriptionId: string) => {
      const rx = prescriptions.find((p) => p.id === prescriptionId);
      if (!rx) return;
      const draftItems: POSDraftItem[] = [];
      rx.items.forEach((item) => {
        const matchedMed =
          medicines.find((m) => m.id === item.medicineId) ||
          medicines.find((m) => m.name.toLowerCase().includes(item.medicineName.toLowerCase()));
        if (matchedMed && matchedMed.availableQuantity > 0) {
          draftItems.push({
            medicineId: matchedMed.id,
            quantity: Math.min(item.quantity, matchedMed.availableQuantity),
          });
        }
      });
      setPosDraft({
        customerId: rx.patientId || 'cust-walkin',
        prescriptionId: rx.id,
        items: draftItems,
      });
      setActiveRoute('pos');
      pushToast(`Loaded ${rx.prescriptionNumber} items into POS cart`, 'info');
    },
    [prescriptions, medicines, pushToast]
  );

  const clearPosDraft = useCallback(() => setPosDraft(null), []);

  // Returns & Refunds
  const processReturn = useCallback(
    (payload: {
      saleId: string;
      items: ReturnRecord['items'];
      refundAmount: number;
      refundMethod: PaymentMethod;
      reason: string;
    }) => {
      const sale = sales.find((s) => s.id === payload.saleId);
      if (!sale) return;
      const ret: ReturnRecord = {
        id: generateId('ret'),
        returnNumber: `RET-2026-0${90 + returns.length}`,
        date: REFERENCE_TODAY,
        saleId: sale.id,
        invoiceNumber: sale.invoiceNumber,
        customerName: sale.customerName,
        items: payload.items,
        refundAmount: payload.refundAmount,
        refundMethod: payload.refundMethod,
        reason: payload.reason,
        processedBy: 'Dr. Ayesha Siddiqui',
        status: 'Completed',
      };
      setReturns((prev) => [ret, ...prev]);
      setSales((prev) =>
        prev.map((s) => (s.id === sale.id ? { ...s, paymentStatus: 'Refunded' } : s))
      );

      // Restock restockable items
      const txList: InventoryTransaction[] = [];
      setMedicines((prevMeds) =>
        prevMeds.map((med) => {
          const retItem = payload.items.find((i) => i.medicineId === med.id);
          if (!retItem || !retItem.restockable) return med;
          const nextQty = med.availableQuantity + retItem.quantity;
          txList.push({
            id: generateId('tx'),
            date: new Date().toISOString(),
            medicineId: med.id,
            medicineName: med.name,
            batchNumber: med.batchNumber,
            type: 'Customer Return',
            quantityChange: retItem.quantity,
            previousStock: med.availableQuantity,
            newStock: nextQty,
            reason: `Return ${ret.returnNumber}: ${payload.reason}`,
            performedBy: 'Dr. Ayesha Siddiqui',
            referenceCode: ret.returnNumber,
          });
          return { ...med, availableQuantity: nextQty };
        })
      );
      if (txList.length) setInventoryTx((prev) => [...txList, ...prev]);

      logActivity('Returns', 'Processed Refund', `${ret.returnNumber} · ${settings.currencySymbol} ${payload.refundAmount}`);
      pushToast(`Refund ${ret.returnNumber} processed`);
    },
    [sales, returns.length, settings.currencySymbol, logActivity, pushToast]
  );

  // Staff
  const addEmployee = useCallback(
    (emp: Omit<Employee, 'id' | 'employeeCode'>) => {
      const created: Employee = {
        ...emp,
        id: generateId('emp'),
        employeeCode: `EMP-00${employees.length + 1}`,
      };
      setEmployees((prev) => [created, ...prev]);
      setAttendance((prev) => [
        ...prev,
        {
          id: generateId('att'),
          employeeId: created.id,
          employeeName: created.name,
          role: created.role,
          date: REFERENCE_TODAY,
          checkIn: '08:00',
          status: 'Present',
        },
      ]);
      logActivity('Staff', 'Added Employee', `${created.name} (${created.role})`);
      pushToast(`Added ${created.name} to staff directory`);
    },
    [employees.length, logActivity, pushToast]
  );

  const updateEmployeeStatus = useCallback(
    (id: string, status: Employee['status']) => {
      setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
      pushToast('Staff status updated');
    },
    [pushToast]
  );

  const updateAttendanceStatus = useCallback(
    (employeeId: string, status: AttendanceRecord['status']) => {
      setAttendance((prev) =>
        prev.map((a) =>
          a.employeeId === employeeId
            ? {
                ...a,
                status,
                checkIn: status === 'Present' || status === 'Late' ? a.checkIn || '08:15' : undefined,
              }
            : a
        )
      );
      pushToast('Attendance updated');
    },
    [pushToast]
  );

  const toggleRolePermission = useCallback(
    (role: StaffRole, key: keyof RolePermissionMatrix[StaffRole]) => {
      setRolePermissions((prev) => ({
        ...prev,
        [role]: { ...prev[role], [key]: !prev[role][key] },
      }));
      pushToast(`Updated ${role} permission`);
    },
    [pushToast]
  );

  // Expenses
  const addExpense = useCallback(
    (exp: Omit<Expense, 'id' | 'voucherNumber'>) => {
      const created: Expense = {
        ...exp,
        id: generateId('exp'),
        voucherNumber: `VCH-2026-${306 + expenses.length}`,
      };
      setExpenses((prev) => [created, ...prev]);
      logActivity('Expenses', 'Recorded Expense', `${created.voucherNumber} · ${created.category}`);
      pushToast(`Recorded expense ${created.voucherNumber}`);
    },
    [expenses.length, logActivity, pushToast]
  );

  // Notifications
  const markNotificationRead = useCallback((id: string, read = true) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read } : n)));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    pushToast('All notifications marked as read', 'info');
  }, [pushToast]);

  // Settings
  const updateSettings = useCallback(
    (patch: Partial<PharmacySettings>) => {
      setSettings((prev) => ({ ...prev, ...patch }));
      pushToast('Settings saved');
    },
    [pushToast]
  );

  return (
    <PMSContext.Provider
      value={{
        activeRoute,
        setActiveRoute,
        theme,
        toggleTheme,
        sidebarCollapsed,
        setSidebarCollapsed,
        isLocked,
        setIsLocked,
        toasts,
        pushToast,
        dismissToast,
        medicines,
        categories,
        suppliers,
        customers,
        sales,
        purchases,
        prescriptions,
        inventoryTx,
        transfers,
        returns,
        employees,
        attendance,
        activityLogs,
        rolePermissions,
        expenses,
        notifications,
        settings,
        posDraft,
        clearPosDraft,
        sendPrescriptionToPOS,
        addMedicine,
        updateMedicine,
        deleteMedicine,
        importMedicinesBatch,
        addCategory,
        updateCategory,
        deleteCategory,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        recordSupplierPayment,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        completeSale,
        adjustStock,
        transferStock,
        removeExpiredBatch,
        createPurchaseOrder,
        receivePurchaseOrder,
        addPrescription,
        updatePrescriptionStatus,
        processReturn,
        addEmployee,
        updateEmployeeStatus,
        updateAttendanceStatus,
        toggleRolePermission,
        addExpense,
        markNotificationRead,
        markAllNotificationsRead,
        updateSettings,
      }}
    >
      {children}
    </PMSContext.Provider>
  );
};

export function usePMS(): PMSContextValue {
  const ctx = useContext(PMSContext);
  if (!ctx) throw new Error('usePMS must be used inside PMSProvider');
  return ctx;
}

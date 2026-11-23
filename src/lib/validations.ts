export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateMedicineForm(data: {
  name: string;
  genericName: string;
  medicineCode: string;
  purchasePrice: number;
  sellingPrice: number;
  availableQuantity: number;
  minimumStockLevel: number;
  expiryDate: string;
}): ValidationResult {
  const errors: Record<string, string> = {};
  if (!data.name.trim()) errors.name = 'Medicine name is required.';
  if (!data.genericName.trim()) errors.genericName = 'Generic name is required.';
  if (!data.medicineCode.trim()) errors.medicineCode = 'Medicine code is required.';
  if (data.purchasePrice <= 0) errors.purchasePrice = 'Purchase price must be greater than 0.';
  if (data.sellingPrice <= 0) errors.sellingPrice = 'Selling price must be greater than 0.';
  if (data.sellingPrice < data.purchasePrice) errors.sellingPrice = 'Selling price should not be below purchase price.';
  if (data.availableQuantity < 0) errors.availableQuantity = 'Quantity cannot be negative.';
  if (data.minimumStockLevel < 0) errors.minimumStockLevel = 'Minimum stock level cannot be negative.';
  if (!data.expiryDate) errors.expiryDate = 'Expiry date is required.';
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateSupplierForm(data: {
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
}): ValidationResult {
  const errors: Record<string, string> = {};
  if (!data.companyName.trim()) errors.companyName = 'Company name is required.';
  if (!data.contactPerson.trim()) errors.contactPerson = 'Contact person is required.';
  if (!data.phone.trim()) errors.phone = 'Phone number is required.';
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Enter a valid email address.';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateCustomerForm(data: { name: string; phone: string }): ValidationResult {
  const errors: Record<string, string> = {};
  if (!data.name.trim()) errors.name = 'Customer name is required.';
  if (!data.phone.trim()) errors.phone = 'Phone number is required.';
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateExpenseForm(data: { description: string; amount: number; date: string }): ValidationResult {
  const errors: Record<string, string> = {};
  if (!data.description.trim()) errors.description = 'Description is required.';
  if (data.amount <= 0) errors.amount = 'Amount must be greater than 0.';
  if (!data.date) errors.date = 'Date is required.';
  return { valid: Object.keys(errors).length === 0, errors };
}

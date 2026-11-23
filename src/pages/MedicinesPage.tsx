import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpDown,
  Download,
  Edit2,
  Eye,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { DOSAGE_FORMS, MEDICINE_IMAGES } from '../lib/constants';
import { downloadCSV, formatCurrency, formatDate, getExpiryStatus, getStockStatus } from '../lib/utils';
import { validateMedicineForm } from '../lib/validations';
import { usePMS } from '../services/pmsStore';
import type { DosageForm, Medicine } from '../types';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { PaginationBar } from '../components/ui/PaginationBar';
import { SearchInput } from '../components/ui/SearchInput';
import { StatusText } from '../components/ui/StatusText';

const EMPTY_FORM: Omit<Medicine, 'id'> = {
  name: '',
  genericName: '',
  brandName: '',
  medicineCode: '',
  barcode: '',
  category: 'Antibiotics & Antimicrobials',
  manufacturer: '',
  batchNumber: '',
  dosageForm: 'Tablets',
  strength: '',
  packSize: '',
  purchasePrice: 0,
  sellingPrice: 0,
  availableQuantity: 0,
  minimumStockLevel: 20,
  manufacturingDate: '2026-01-01',
  expiryDate: '2028-01-01',
  supplierId: 'sup-1',
  supplierName: 'Muller & Phipps Pakistan (Pvt.) Ltd.',
  prescriptionRequired: false,
  description: '',
  imageUrl: MEDICINE_IMAGES.tablets,
  shelfLocation: 'Rack A1',
};

export const MedicinesPage: React.FC = () => {
  const {
    medicines,
    categories,
    suppliers,
    settings,
    addMedicine,
    updateMedicine,
    deleteMedicine,
    adjustStock,
    importMedicinesBatch,
    quickActionIntent,
    clearQuickActionIntent,
  } = usePMS();

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [mfgFilter, setMfgFilter] = useState('All');
  const [alertFilter, setAlertFilter] = useState<'all' | 'low' | 'expiring'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'sellingPrice' | 'availableQuantity' | 'expiryDate'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Modals
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Medicine, 'id'>>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [viewMed, setViewMed] = useState<Medicine | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Medicine | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const openAdd = () => {
    setEditingId(null);
    setFormData({
      ...EMPTY_FORM,
      medicineCode: `MED-${1016 + medicines.length}`,
      barcode: `8964001001${160 + medicines.length}`,
      category: categories[0]?.name ?? 'Antibiotics & Antimicrobials',
      supplierId: suppliers[0]?.id ?? 'sup-1',
      supplierName: suppliers[0]?.companyName ?? '',
    });
    setFormErrors({});
    setFormOpen(true);
  };

  useEffect(() => {
    if (quickActionIntent === 'add-medicine') {
      openAdd();
      clearQuickActionIntent();
    }
  }, [quickActionIntent]); // eslint-disable-line react-hooks/exhaustive-deps

  const manufacturers = useMemo(
    () => Array.from(new Set(medicines.map((m) => m.manufacturer))).sort(),
    [medicines]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = medicines.filter((m) => {
      const matchSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.genericName.toLowerCase().includes(q) ||
        m.medicineCode.toLowerCase().includes(q) ||
        m.barcode.includes(q);
      const matchCat = catFilter === 'All' || m.category === catFilter;
      const matchMfg = mfgFilter === 'All' || m.manufacturer === mfgFilter;
      const matchAlert =
        alertFilter === 'all' ||
        (alertFilter === 'low' && m.availableQuantity <= m.minimumStockLevel) ||
        (alertFilter === 'expiring' && getExpiryStatus(m.expiryDate).daysLeft <= 90);
      return matchSearch && matchCat && matchMfg && matchAlert;
    });

    return [...list].sort((a, b) => {
      const factor = sortDir === 'asc' ? 1 : -1;
      if (sortBy === 'name') return a.name.localeCompare(b.name) * factor;
      if (sortBy === 'sellingPrice') return (a.sellingPrice - b.sellingPrice) * factor;
      if (sortBy === 'availableQuantity') return (a.availableQuantity - b.availableQuantity) * factor;
      return a.expiryDate.localeCompare(b.expiryDate) * factor;
    });
  }, [medicines, search, catFilter, mfgFilter, alertFilter, sortBy, sortDir]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortDir('asc');
    }
  };

  const openEdit = (med: Medicine) => {
    setEditingId(med.id);
    const { id: _id, ...rest } = med;
    setFormData(rest);
    setFormErrors({});
    setFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateMedicineForm(formData);
    if (!validation.valid) {
      setFormErrors(validation.errors);
      return;
    }
    const sup = suppliers.find((s) => s.id === formData.supplierId);
    const payload = { ...formData, supplierName: sup?.companyName ?? formData.supplierName };
    if (editingId) {
      updateMedicine(editingId, payload);
    } else {
      addMedicine(payload);
    }
    setFormOpen(false);
  };

  const handleExportCSV = () => {
    downloadCSV(
      'pms-medicines-catalog.csv',
      ['Code', 'Name', 'Generic', 'Category', 'Dosage Form', 'Manufacturer', 'Batch', 'Purchase Price', 'Selling Price', 'Qty', 'Expiry'],
      filtered.map((m) => [
        m.medicineCode,
        m.name,
        m.genericName,
        m.category,
        m.dosageForm,
        m.manufacturer,
        m.batchNumber,
        m.purchasePrice,
        m.sellingPrice,
        m.availableQuantity,
        m.expiryDate,
      ])
    );
  };

  const handleSimulateBatchImport = () => {
    importMedicinesBatch([
      {
        ...EMPTY_FORM,
        name: 'Flagyl 400mg Tablets',
        genericName: 'Metronidazole',
        brandName: 'Flagyl',
        medicineCode: `MED-${1020 + medicines.length}`,
        barcode: `8964001001${200 + medicines.length}`,
        category: 'Antibiotics & Antimicrobials',
        manufacturer: 'Sanofi Aventis',
        batchNumber: 'SNF-401B',
        dosageForm: 'Tablets',
        strength: '400 mg',
        packSize: '20 Tablets',
        purchasePrice: 95,
        sellingPrice: 120,
        availableQuantity: 75,
        minimumStockLevel: 25,
        manufacturingDate: '2026-03-01',
        expiryDate: '2028-03-01',
        supplierId: 'sup-1',
        supplierName: 'Muller & Phipps Pakistan (Pvt.) Ltd.',
        prescriptionRequired: true,
        description: 'Nitroimidazole antimicrobial for anaerobic and protozoal infections.',
        imageUrl: MEDICINE_IMAGES.tablets,
        shelfLocation: 'Rack A2 · Row 1',
      },
      {
        ...EMPTY_FORM,
        name: 'Ventolin 100mcg Inhaler',
        genericName: 'Salbutamol',
        brandName: 'Ventolin',
        medicineCode: `MED-${1021 + medicines.length}`,
        barcode: `8964001001${210 + medicines.length}`,
        category: 'Other Healthcare Products',
        manufacturer: 'GSK Pakistan',
        batchNumber: 'GSK-V991',
        dosageForm: 'Other Healthcare Products',
        strength: '100 mcg / actuation',
        packSize: '200 Metered Doses',
        purchasePrice: 410,
        sellingPrice: 485,
        availableQuantity: 32,
        minimumStockLevel: 12,
        manufacturingDate: '2026-02-15',
        expiryDate: '2028-02-15',
        supplierId: 'sup-1',
        supplierName: 'Muller & Phipps Pakistan (Pvt.) Ltd.',
        prescriptionRequired: true,
        description: 'Short-acting beta-2 adrenergic bronchodilator inhaler.',
        imageUrl: MEDICINE_IMAGES.vialDevice,
        shelfLocation: 'Rack E1 · Respiratory',
      },
    ]);
    setImportOpen(false);
  };

  const resetFilters = () => {
    setSearch('');
    setCatFilter('All');
    setMfgFilter('All');
    setAlertFilter('all');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Medicine Catalog (${filtered.length})`}
        description="Manage formulations, pricing, batch numbers, barcodes, and reorder thresholds"
        actions={
          <>
            <button type="button" onClick={() => setImportOpen(true)} className="pms-btn-secondary">
              <Upload className="h-4 w-4" />
              <span>Import</span>
            </button>
            <button type="button" onClick={handleExportCSV} className="pms-btn-secondary">
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
            <button type="button" onClick={openAdd} className="pms-btn-primary">
              <Plus className="h-4 w-4" />
              <span>Add Medicine</span>
            </button>
          </>
        }
      />

      {/* Filters */}
      <div className="pms-card grid grid-cols-1 gap-3.5 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <SearchInput
          value={search}
          onValueChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search by medicine name, generic, code or barcode..."
          containerClassName="lg:col-span-2"
        />
        <select
          value={catFilter}
          onChange={(e) => {
            setCatFilter(e.target.value);
            setPage(1);
          }}
          className="pms-select"
        >
          <option value="All">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={mfgFilter}
          onChange={(e) => {
            setMfgFilter(e.target.value);
            setPage(1);
          }}
          className="pms-select"
        >
          <option value="All">All Manufacturers</option>
          {manufacturers.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={alertFilter}
          onChange={(e) => {
            setAlertFilter(e.target.value as 'all' | 'low' | 'expiring');
            setPage(1);
          }}
          className="pms-select"
        >
          <option value="all">All Stock & Expiry</option>
          <option value="low">Low Stock Only</option>
          <option value="expiring">Expiring / Expired (&lt;90d)</option>
        </select>
      </div>

      {/* Table */}
      <div className="pms-card overflow-hidden">
        {paged.length === 0 ? (
          <EmptyState
            title="No medicines found"
            description="No medicines match your current search or filter selection."
            actionLabel="Reset All Filters"
            onAction={resetFilters}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                  <th className="px-5 py-3.5">
                    <button type="button" onClick={() => toggleSort('name')} className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-100">
                      <span>Medicine</span>
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="px-4 py-3.5">Code / Batch</th>
                  <th className="px-4 py-3.5">Category & Form</th>
                  <th className="px-4 py-3.5">Manufacturer</th>
                  <th className="px-4 py-3.5 text-right">
                    <button type="button" onClick={() => toggleSort('sellingPrice')} className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-100">
                      <span>Price</span>
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="px-4 py-3.5 text-right">
                    <button type="button" onClick={() => toggleSort('availableQuantity')} className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-100">
                      <span>Stock</span>
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="px-4 py-3.5">
                    <button type="button" onClick={() => toggleSort('expiryDate')} className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-100">
                      <span>Expiry</span>
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paged.map((med) => {
                  const stockSt = getStockStatus(med.availableQuantity, med.minimumStockLevel);
                  const expSt = getExpiryStatus(med.expiryDate);
                  return (
                    <tr key={med.id} className="transition-colors hover:bg-slate-50/75 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3.5">
                          <img
                            src={med.imageUrl}
                            alt={med.name}
                            referrerPolicy="no-referrer"
                            className="h-11 w-11 shrink-0 rounded-xl border border-slate-200 object-cover dark:border-slate-700"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-slate-100">{med.name}</p>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                              {med.genericName} · {med.strength}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs">
                        <p className="font-medium text-slate-900 dark:text-slate-200">{med.medicineCode}</p>
                        <p className="text-slate-400">{med.batchNumber}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-slate-800 dark:text-slate-200">{med.dosageForm}</p>
                        <p className="text-xs text-slate-400">{med.prescriptionRequired ? 'Rx Only' : 'OTC'}</p>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">{med.manufacturer}</td>
                      <td className="px-4 py-3.5 text-right font-mono tabular-nums">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {formatCurrency(med.sellingPrice, settings.currencySymbol)}
                        </p>
                        <p className="text-xs text-slate-400">
                          Cost {formatCurrency(med.purchasePrice, settings.currencySymbol)}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <p className="font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                          {med.availableQuantity}
                        </p>
                        <StatusText label={stockSt.label} tone={stockSt.severity} showIcon={false} />
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-mono text-xs text-slate-700 dark:text-slate-300">
                          {formatDate(med.expiryDate)}
                        </p>
                        <StatusText
                          label={expSt.label}
                          tone={expSt.severity === 'critical' ? 'critical' : expSt.severity === 'warning' ? 'warning' : 'ok'}
                          showIcon={false}
                        />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setViewMed(med)}
                            aria-label={`View ${med.name}`}
                            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(med)}
                            aria-label={`Edit ${med.name}`}
                            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-teal-700 dark:hover:bg-slate-800 dark:hover:text-teal-400"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(med)}
                            aria-label={`Delete ${med.name}`}
                            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <PaginationBar page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
      </div>

      {/* Add / Edit Medicine Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? 'Edit Medicine Record' : 'Add New Medicine'}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="pms-label">Medicine Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="pms-input"
              />
              {formErrors.name && <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>}
            </div>
            <div>
              <label className="pms-label">Generic Name *</label>
              <input
                type="text"
                value={formData.genericName}
                onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                className="pms-input"
              />
              {formErrors.genericName && <p className="mt-1 text-xs text-red-600">{formErrors.genericName}</p>}
            </div>
            <div>
              <label className="pms-label">Brand Name</label>
              <input
                type="text"
                value={formData.brandName}
                onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                className="pms-input"
              />
            </div>
            <div>
              <label className="pms-label">Manufacturer</label>
              <input
                type="text"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                className="pms-input"
              />
            </div>
            <div>
              <label className="pms-label">Medicine Code *</label>
              <input
                type="text"
                value={formData.medicineCode}
                onChange={(e) => setFormData({ ...formData, medicineCode: e.target.value })}
                className="pms-input font-mono"
              />
              {formErrors.medicineCode && <p className="mt-1 text-xs text-red-600">{formErrors.medicineCode}</p>}
            </div>
            <div>
              <label className="pms-label">Barcode</label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="pms-input font-mono"
              />
            </div>
            <div>
              <label className="pms-label">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="pms-select"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="pms-label">Dosage Form</label>
              <select
                value={formData.dosageForm}
                onChange={(e) => {
                  const form = e.target.value as DosageForm;
                  const img =
                    form === 'Syrups' || form === 'Drops'
                      ? MEDICINE_IMAGES.syrup
                      : form === 'Injections' || form === 'Medical Devices'
                      ? MEDICINE_IMAGES.vialDevice
                      : MEDICINE_IMAGES.tablets;
                  setFormData({ ...formData, dosageForm: form, imageUrl: img });
                }}
                className="pms-select"
              >
                {DOSAGE_FORMS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="pms-label">Strength</label>
              <input
                type="text"
                value={formData.strength}
                onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                placeholder="e.g. 500 mg"
                className="pms-input"
              />
            </div>
            <div>
              <label className="pms-label">Pack Size</label>
              <input
                type="text"
                value={formData.packSize}
                onChange={(e) => setFormData({ ...formData, packSize: e.target.value })}
                placeholder="e.g. 10x10 Tablets"
                className="pms-input"
              />
            </div>
            <div>
              <label className="pms-label">Batch Number</label>
              <input
                type="text"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                className="pms-input font-mono"
              />
            </div>
            <div>
              <label className="pms-label">Supplier</label>
              <select
                value={formData.supplierId}
                onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                className="pms-select"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.companyName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="pms-label">Purchase Price ({settings.currencySymbol}) *</label>
              <input
                type="number"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                className="pms-input font-mono tabular-nums"
              />
              {formErrors.purchasePrice && <p className="mt-1 text-xs text-red-600">{formErrors.purchasePrice}</p>}
            </div>
            <div>
              <label className="pms-label">Selling Price ({settings.currencySymbol}) *</label>
              <input
                type="number"
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                className="pms-input font-mono tabular-nums"
              />
              {formErrors.sellingPrice && <p className="mt-1 text-xs text-red-600">{formErrors.sellingPrice}</p>}
            </div>
            <div>
              <label className="pms-label">Available Quantity</label>
              <input
                type="number"
                value={formData.availableQuantity}
                onChange={(e) => setFormData({ ...formData, availableQuantity: Number(e.target.value) })}
                className="pms-input font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="pms-label">Minimum Stock Level</label>
              <input
                type="number"
                value={formData.minimumStockLevel}
                onChange={(e) => setFormData({ ...formData, minimumStockLevel: Number(e.target.value) })}
                className="pms-input font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="pms-label">Manufacturing Date</label>
              <input
                type="date"
                value={formData.manufacturingDate}
                onChange={(e) => setFormData({ ...formData, manufacturingDate: e.target.value })}
                className="pms-input"
              />
            </div>
            <div>
              <label className="pms-label">Expiry Date *</label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="pms-input"
              />
              {formErrors.expiryDate && <p className="mt-1 text-xs text-red-600">{formErrors.expiryDate}</p>}
            </div>
          </div>

          <div>
            <label className="pms-label">Description / Clinical Notes</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="pms-textarea"
            />
          </div>

          <label className="flex items-center gap-2.5 text-sm font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={formData.prescriptionRequired}
              onChange={(e) => setFormData({ ...formData, prescriptionRequired: e.target.checked })}
              className="h-4 w-4 accent-teal-700"
            />
            <span>Prescription Required (Schedule / Controlled Dispensing)</span>
          </label>

          <div className="flex justify-end gap-2.5 border-t border-slate-200 pt-4 dark:border-slate-800">
            <button type="button" onClick={() => setFormOpen(false)} className="pms-btn-secondary">
              Cancel
            </button>
            <button type="submit" className="pms-btn-primary">
              {editingId ? 'Save Changes' : 'Create Medicine'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Medicine Details Modal */}
      <Modal
        open={Boolean(viewMed)}
        onClose={() => setViewMed(null)}
        title={viewMed?.name ?? 'Medicine Details'}
        subtitle={viewMed ? `${viewMed.genericName} · ${viewMed.medicineCode}` : ''}
        size="md"
        footer={
          viewMed && (
            <>
              <button
                type="button"
                onClick={() => {
                  adjustStock({
                    medicineId: viewMed.id,
                    quantityChange: 10,
                    type: 'Stock In',
                    reason: 'Quick +10 restock from Medicine Details',
                  });
                  setViewMed({ ...viewMed, availableQuantity: viewMed.availableQuantity + 10 });
                }}
                className="pms-btn-secondary text-teal-700 dark:text-teal-400"
              >
                Quick Restock +10
              </button>
              <button type="button" onClick={() => setViewMed(null)} className="pms-btn-primary">
                Close
              </button>
            </>
          )
        }
      >
        {viewMed && (
          <div className="space-y-5 text-sm">
            <div className="flex gap-4">
              <img
                src={viewMed.imageUrl}
                alt={viewMed.name}
                referrerPolicy="no-referrer"
                className="h-24 w-32 shrink-0 rounded-xl border border-slate-200 object-cover dark:border-slate-700"
              />
              <div className="space-y-1">
                <p className="font-display text-base font-bold text-slate-900 dark:text-slate-100">{viewMed.name}</p>
                <p className="text-[13px] text-slate-500">
                  {viewMed.brandName} · {viewMed.manufacturer}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300">{viewMed.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-4 dark:border-slate-800">
              <div>
                <p className="text-xs text-slate-400">Category / Dosage</p>
                <p className="mt-0.5 font-medium">
                  {viewMed.category} ({viewMed.dosageForm})
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Strength / Pack Size</p>
                <p className="mt-0.5 font-medium">
                  {viewMed.strength} · {viewMed.packSize}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Barcode / Batch</p>
                <p className="mt-0.5 font-mono font-medium">
                  {viewMed.barcode} · {viewMed.batchNumber}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Shelf Location & On-Hand</p>
                <p className="mt-0.5 font-medium">
                  {viewMed.shelfLocation || 'Main Dispensary'} ({viewMed.availableQuantity} units)
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Purchase / Selling Price</p>
                <p className="mt-0.5 font-mono font-semibold tabular-nums">
                  {formatCurrency(viewMed.purchasePrice, settings.currencySymbol)} /{' '}
                  {formatCurrency(viewMed.sellingPrice, settings.currencySymbol)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Mfg / Expiry Dates</p>
                <p className="mt-0.5 font-mono">
                  {formatDate(viewMed.manufacturingDate)} → {formatDate(viewMed.expiryDate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Supplier</p>
                <p className="mt-0.5 font-medium">{viewMed.supplierName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Dispensing Rule</p>
                <p className="mt-0.5 font-medium">{viewMed.prescriptionRequired ? 'Prescription Required' : 'Over-the-Counter'}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteMedicine(deleteTarget.id);
        }}
        title="Confirm Medicine Deletion"
        message={`Are you sure you want to remove "${deleteTarget?.name ?? ''}" (${deleteTarget?.medicineCode ?? ''}) from the active pharmacy catalog?`}
        confirmLabel="Delete Medicine"
      />

      {/* Import Catalog UI Modal */}
      <Modal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import Medicines Batch (CSV / Excel Simulation)"
        size="sm"
      >
        <div className="space-y-4 text-sm">
          <p className="text-slate-600 dark:text-slate-300">
            Load standardized distributor catalog files into PMS. For demonstration, you can trigger a sample import of
            2 verified formulations (Flagyl 400mg & Ventolin Inhaler).
          </p>
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center dark:border-slate-700 dark:bg-slate-800/40">
            <p className="font-medium text-slate-800 dark:text-slate-200">sample_distributor_catalog_2026.csv</p>
            <p className="mt-1 text-xs text-slate-400">2 validated SKUs ready for import</p>
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <button type="button" onClick={() => setImportOpen(false)} className="pms-btn-secondary">
              Cancel
            </button>
            <button type="button" onClick={handleSimulateBatchImport} className="pms-btn-primary">
              Import 2 Medicines
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

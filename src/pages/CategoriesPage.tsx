import React, { useMemo, useState } from 'react';
import { Edit2, FolderTree, Plus, Trash2 } from 'lucide-react';
import { DOSAGE_FORMS } from '../lib/constants';
import { formatCurrency } from '../lib/utils';
import { usePMS } from '../services/pmsStore';
import type { CategoryItem, DosageForm } from '../types';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { SearchInput } from '../components/ui/SearchInput';

export const CategoriesPage: React.FC = () => {
  const { categories, medicines, settings, addCategory, updateCategory, deleteCategory } = usePMS();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryItem | null>(null);

  const [name, setName] = useState('');
  const [dosageGroup, setDosageGroup] = useState<DosageForm>('Tablets');
  const [description, setDescription] = useState('');
  const [taxRate, setTaxRate] = useState(0);
  const [rxDefault, setRxDefault] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return categories.filter(
      (c) => !q || c.name.toLowerCase().includes(q) || c.dosageGroup.toLowerCase().includes(q)
    );
  }, [categories, search]);

  const openAdd = () => {
    setEditing(null);
    setName('');
    setDosageGroup('Tablets');
    setDescription('');
    setTaxRate(0);
    setRxDefault(false);
    setModalOpen(true);
  };

  const openEdit = (cat: CategoryItem) => {
    setEditing(cat);
    setName(cat.name);
    setDosageGroup(cat.dosageGroup);
    setDescription(cat.description);
    setTaxRate(cat.taxRate);
    setRxDefault(cat.requiresPrescriptionDefault);
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (editing) {
      updateCategory(editing.id, {
        name: name.trim(),
        dosageGroup,
        description,
        taxRate,
        requiresPrescriptionDefault: rxDefault,
      });
    } else {
      addCategory({
        name: name.trim(),
        dosageGroup,
        description,
        taxRate,
        requiresPrescriptionDefault: rxDefault,
      });
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Medicine Categories (${filtered.length})`}
        description="Therapeutic groups, default tax rules, and dosage form classifications"
        actions={
          <button type="button" onClick={openAdd} className="pms-btn-primary">
            <Plus className="h-4 w-4" />
            <span>Add Category</span>
          </button>
        }
      />

      <div className="pms-card p-4">
        <SearchInput
          value={search}
          onValueChange={setSearch}
          placeholder="Search category name or dosage form..."
          containerClassName="max-w-md"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="pms-card">
          <EmptyState
            title="No categories found"
            description="No therapeutic categories match your search query."
            actionLabel="Clear Search"
            onAction={() => setSearch('')}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((cat) => {
            const linked = medicines.filter((m) => m.category === cat.name);
            const stockValue = linked.reduce((sum, m) => sum + m.availableQuantity * m.sellingPrice, 0);
            return (
              <div key={cat.id} className="pms-card flex flex-col justify-between p-6 transition-colors hover:border-teal-500/50">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-400">
                        <FolderTree className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">{cat.name}</h3>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {cat.dosageGroup} · Tax {cat.taxRate}% · {cat.requiresPrescriptionDefault ? 'Rx Default' : 'OTC'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEdit(cat)}
                        aria-label={`Edit ${cat.name}`}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(cat)}
                        aria-label={`Delete ${cat.name}`}
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {cat.description || 'No description provided.'}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm dark:border-slate-800">
                  <span className="text-slate-500">
                    <strong className="font-mono text-slate-900 tabular-nums dark:text-slate-100">{linked.length}</strong>{' '}
                    medicines
                  </span>
                  <span className="font-mono font-semibold text-teal-700 tabular-nums dark:text-teal-400">
                    {formatCurrency(stockValue, settings.currencySymbol)} value
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Category' : 'Add Category'} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="pms-label">Category Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="pms-input"
            />
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="pms-label">Primary Dosage Form</label>
              <select
                value={dosageGroup}
                onChange={(e) => setDosageGroup(e.target.value as DosageForm)}
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
              <label className="pms-label">Default Tax (%)</label>
              <input
                type="number"
                min={0}
                max={25}
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="pms-input font-mono"
              />
            </div>
          </div>
          <div>
            <label className="pms-label">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="pms-textarea"
            />
          </div>
          <label className="flex items-center gap-2.5 text-sm font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={rxDefault}
              onChange={(e) => setRxDefault(e.target.checked)}
              className="h-4 w-4 accent-teal-700"
            />
            <span>Requires Prescription by Default</span>
          </label>
          <div className="flex justify-end gap-2.5 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="pms-btn-secondary">
              Cancel
            </button>
            <button type="submit" className="pms-btn-primary">
              Save Category
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteCategory(deleteTarget.id);
        }}
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteTarget?.name ?? ''}"? Existing medicines in this category will remain in your catalog.`}
        confirmLabel="Delete Category"
      />
    </div>
  );
};

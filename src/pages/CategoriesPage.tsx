import React, { useState } from 'react';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import { DOSAGE_FORMS } from '../lib/constants';
import { formatCurrency } from '../lib/utils';
import { usePMS } from '../services/pmsStore';
import type { CategoryItem, DosageForm } from '../types';
import { Modal } from '../components/ui/Modal';

export const CategoriesPage: React.FC = () => {
  const { categories, medicines, settings, addCategory, updateCategory, deleteCategory } = usePMS();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryItem | null>(null);
  const [name, setName] = useState('');
  const [dosageGroup, setDosageGroup] = useState<DosageForm>('Tablets');
  const [description, setDescription] = useState('');
  const [taxRate, setTaxRate] = useState(0);
  const [rxDefault, setRxDefault] = useState(false);

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
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
            Medicine Categories ({categories.length})
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Therapeutic groups, default tax rules, and dosage form classifications
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-medium text-white hover:bg-teal-800 dark:bg-teal-600"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Category</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {categories.map((cat) => {
          const linked = medicines.filter((m) => m.category === cat.name);
          const stockValue = linked.reduce((sum, m) => sum + m.availableQuantity * m.sellingPrice, 0);
          return (
            <div
              key={cat.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{cat.name}</h3>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {cat.dosageGroup} · Tax {cat.taxRate}% · {cat.requiresPrescriptionDefault ? 'Rx Default' : 'OTC'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(cat)}
                      aria-label={`Edit ${cat.name}`}
                      className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCategory(cat.id)}
                      aria-label={`Delete ${cat.name}`}
                      className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {cat.description || 'No description provided.'}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
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

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Category' : 'Add Category'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="mb-1 block font-medium">Category Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-medium">Primary Dosage Form</label>
              <select
                value={dosageGroup}
                onChange={(e) => setDosageGroup(e.target.value as DosageForm)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              >
                {DOSAGE_FORMS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block font-medium">Default Tax (%)</label>
              <input
                type="number"
                min={0}
                max={25}
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block font-medium">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <label className="flex items-center gap-2 font-medium">
            <input
              type="checkbox"
              checked={rxDefault}
              onChange={(e) => setRxDefault(e.target.checked)}
              className="h-4 w-4 accent-teal-700"
            />
            <span>Requires Prescription by Default</span>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 font-medium dark:border-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-teal-700 px-4 py-2 font-medium text-white hover:bg-teal-800"
            >
              Save Category
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

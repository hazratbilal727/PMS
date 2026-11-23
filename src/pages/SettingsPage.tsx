import React, { useState } from 'react';
import { Database, Download, Save } from 'lucide-react';
import { MEDICINE_IMAGES } from '../lib/constants';
import { downloadJSON, formatDateTime } from '../lib/utils';
import { usePMS } from '../services/pmsStore';
import type { PharmacySettings } from '../types';

export const SettingsPage: React.FC = () => {
  const {
    settings,
    updateSettings,
    theme,
    toggleTheme,
    medicines,
    customers,
    suppliers,
    sales,
    purchases,
    pushToast,
  } = usePMS();

  const [tab, setTab] = useState<'pharmacy' | 'billing' | 'account' | 'system'>('pharmacy');
  const [draft, setDraft] = useState<PharmacySettings>(settings);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(draft);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || newPassword.length < 6 || newPassword !== confirmPassword) {
      pushToast('Check password fields (minimum 6 characters and matching)', 'error');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    pushToast('Password updated (frontend simulation)');
  };

  const handleExportBackup = () => {
    downloadJSON('pms-full-backup-2026.json', {
      exportedAt: new Date().toISOString(),
      settings: draft,
      medicines,
      customers,
      suppliers,
      sales,
      purchases,
    });
    updateSettings({ lastBackupAt: new Date().toISOString() });
    pushToast('Full pharmacy JSON backup downloaded');
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
          System & Pharmacy Settings
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Configure Pakistan/PKR business defaults, invoice templates, user security, and database readiness
        </p>
      </div>

      {/* Tabs */}
      <div className="inline-flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
        {(
          [
            { id: 'pharmacy', label: 'Pharmacy & General' },
            { id: 'billing', label: 'Currency, Tax & Invoices' },
            { id: 'account', label: 'Profile, Theme & Alerts' },
            { id: 'system', label: 'Backup & Database Ready' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
              tab === t.id
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-slate-100'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'pharmacy' && (
        <form
          onSubmit={handleSave}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 text-xs dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-medium">Pharmacy Name</label>
              <input
                type="text"
                value={draft.pharmacyName}
                onChange={(e) => setDraft({ ...draft, pharmacyName: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="mb-1 block font-medium">Tagline / Sub-title</label>
              <input
                type="text"
                value={draft.tagline}
                onChange={(e) => setDraft({ ...draft, tagline: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="mb-1 block font-medium">DRAP / Pharmacy License #</label>
              <input
                type="text"
                value={draft.licenseNumber}
                onChange={(e) => setDraft({ ...draft, licenseNumber: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="mb-1 block font-medium">FBR NTN Number</label>
              <input
                type="text"
                value={draft.ntnNumber}
                onChange={(e) => setDraft({ ...draft, ntnNumber: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="mb-1 block font-medium">Contact Phone</label>
              <input
                type="text"
                value={draft.phone}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="mb-1 block font-medium">Operations Email</label>
              <input
                type="email"
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block font-medium">Business Address</label>
              <input
                type="text"
                value={draft.address}
                onChange={(e) => setDraft({ ...draft, address: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="mb-1 block font-medium">City</label>
              <input
                type="text"
                value={draft.city}
                onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="mb-1 block font-medium">Country</label>
              <input
                type="text"
                value={draft.country}
                onChange={(e) => setDraft({ ...draft, country: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 font-medium text-white hover:bg-teal-800"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save Pharmacy Profile</span>
            </button>
          </div>
        </form>
      )}

      {tab === 'billing' && (
        <form
          onSubmit={handleSave}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 text-xs dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block font-medium">Currency Code</label>
              <select
                value={draft.currencyCode}
                onChange={(e) => {
                  const code = e.target.value;
                  const sym = code === 'PKR' ? 'Rs.' : code === 'USD' ? '$' : '£';
                  setDraft({ ...draft, currencyCode: code, currencySymbol: sym });
                }}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="PKR">PKR (Pakistani Rupee — Rs.)</option>
                <option value="USD">USD (US Dollar — $)</option>
                <option value="GBP">GBP (British Pound — £)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block font-medium">Default GST / Sales Tax (%)</label>
              <input
                type="number"
                value={draft.defaultTaxPercent}
                onChange={(e) => setDraft({ ...draft, defaultTaxPercent: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="mb-1 block font-medium">Invoice Number Prefix</label>
              <input
                type="text"
                value={draft.invoicePrefix}
                onChange={(e) => setDraft({ ...draft, invoicePrefix: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="mb-1 block font-medium">Default Low-Stock Alert Threshold</label>
              <input
                type="number"
                value={draft.lowStockThresholdDefault}
                onChange={(e) => setDraft({ ...draft, lowStockThresholdDefault: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="mb-1 block font-medium">Expiry Alert Window (Days)</label>
              <input
                type="number"
                value={draft.expiryAlertDays}
                onChange={(e) => setDraft({ ...draft, expiryAlertDays: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 font-medium">
            <input
              type="checkbox"
              checked={draft.applyTaxOnMedicines}
              onChange={(e) => setDraft({ ...draft, applyTaxOnMedicines: e.target.checked })}
              className="h-4 w-4 accent-teal-700"
            />
            <span>Apply default tax automatically on POS medicines (uncheck for tax-exempt essential medicines)</span>
          </label>

          <div>
            <label className="mb-1 block font-medium">Receipt Footer Policy Note</label>
            <textarea
              rows={2}
              value={draft.receiptFooterNote}
              onChange={(e) => setDraft({ ...draft, receiptFooterNote: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 font-medium text-white hover:bg-teal-800"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save Billing & Tax Rules</span>
            </button>
          </div>
        </form>
      )}

      {tab === 'account' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 text-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-4">
              <img
                src={MEDICINE_IMAGES.avatarAdmin}
                alt="Dr. Ayesha Siddiqui"
                referrerPolicy="no-referrer"
                className="h-14 w-14 rounded-lg object-cover"
              />
              <div>
                <h3 className="text-sm font-bold">Dr. Ayesha Siddiqui</h3>
                <p className="text-slate-500">Chief Pharmacist & Administrator · DRAP Reg #1492</p>
              </div>
            </div>

            <div className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-medium">Appearance Theme</span>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  Current: {theme === 'light' ? 'Light Mode' : 'Dark Mode'} (Toggle)
                </button>
              </div>

              <div>
                <label className="mb-1 block font-medium">Interface Language</label>
                <select
                  value={draft.language}
                  onChange={(e) => {
                    const lang = e.target.value as PharmacySettings['language'];
                    setDraft({ ...draft, language: lang });
                    updateSettings({ language: lang });
                  }}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="English (PK)">English (Pakistan)</option>
                  <option value="English (US)">English (US)</option>
                  <option value="Urdu Support">Bilingual English / Urdu Labels</option>
                </select>
              </div>

              <div className="space-y-2 pt-2">
                <p className="font-semibold">Notification Preferences</p>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={draft.notifyLowStock}
                    onChange={(e) => {
                      setDraft({ ...draft, notifyLowStock: e.target.checked });
                      updateSettings({ notifyLowStock: e.target.checked });
                    }}
                    className="h-4 w-4 accent-teal-700"
                  />
                  <span>Alert when stock falls below minimum level</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={draft.notifyExpiry}
                    onChange={(e) => {
                      setDraft({ ...draft, notifyExpiry: e.target.checked });
                      updateSettings({ notifyExpiry: e.target.checked });
                    }}
                    className="h-4 w-4 accent-teal-700"
                  />
                  <span>Alert for batches expiring within {draft.expiryAlertDays} days</span>
                </label>
              </div>
            </div>
          </div>

          <form
            onSubmit={handlePasswordSubmit}
            className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 text-xs dark:border-slate-800 dark:bg-slate-900"
          >
            <h3 className="text-sm font-semibold">Security & Password Management</h3>
            <div>
              <label className="mb-1 block font-medium">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="mb-1 block font-medium">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="mb-1 block font-medium">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-teal-700 px-4 py-2 font-medium text-white hover:bg-teal-800"
            >
              Update Password
            </button>
          </form>
        </div>
      )}

      {tab === 'system' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 text-xs">
          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-semibold">Automated Backup & Export</h3>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
              <span>Last Snapshot</span>
              <span className="font-mono font-medium">{formatDateTime(settings.lastBackupAt)}</span>
            </div>
            <div>
              <label className="mb-1 block font-medium">Backup Cadence</label>
              <select
                value={draft.backupFrequency}
                onChange={(e) => {
                  const freq = e.target.value as PharmacySettings['backupFrequency'];
                  setDraft({ ...draft, backupFrequency: freq });
                  updateSettings({ backupFrequency: freq });
                }}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="Daily">Daily (02:00 PKT)</option>
                <option value="Weekly">Weekly (Sunday)</option>
                <option value="Manual">Manual Only</option>
              </select>
            </div>
            <button
              type="button"
              onClick={handleExportBackup}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 font-medium text-white hover:bg-teal-800"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download Complete JSON Snapshot</span>
            </button>
          </div>

          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-teal-600" />
              <h3 className="text-sm font-semibold">Backend & Database Integration Architecture</h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              Frontend entities, validation schemas, and repository methods are decoupled in <code>src/types</code> and{' '}
              <code>src/services/pmsStore.tsx</code> for seamless migration to PostgreSQL + Prisma ORM.
            </p>
            <div className="space-y-2 rounded-lg bg-slate-50 p-3 font-mono text-[11px] dark:bg-slate-800/50">
              <p>Provider Target: {settings.dbProvider}</p>
              <p>Entities Mapped: Medicine, Supplier, Customer, Sale, PurchaseOrder, Prescription, Employee, Expense</p>
              <p>Currency Standard: {settings.currencyCode} ({settings.currencySymbol})</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

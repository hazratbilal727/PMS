import React, { useEffect, useState } from 'react';
import { Database, Download, Moon, RotateCcw, Save, Sun } from 'lucide-react';
import { MEDICINE_IMAGES } from '../lib/constants';
import { downloadJSON, formatDateTime } from '../lib/utils';
import { usePMS } from '../services/pmsStore';
import type { PharmacySettings } from '../types';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { PageHeader } from '../components/ui/PageHeader';

export const SettingsPage: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetDemoData,
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
  const [resetOpen, setResetOpen] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

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
    <div className="space-y-6">
      <PageHeader
        title="System & Pharmacy Settings"
        description="Configure Pakistan/PKR business defaults, invoice templates, user security, and database readiness"
      />

      {/* Tabs */}
      <div className="inline-flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
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
            className={`rounded-lg px-3.5 py-2 text-[13px] font-medium whitespace-nowrap transition-colors ${
              tab === t.id
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-slate-100'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'pharmacy' && (
        <form onSubmit={handleSave} className="pms-card space-y-5 p-6">
          <div>
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
              Pharmacy Identity & Licensing
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Printed on official customer tax invoices, prescription labels, and purchase orders
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="pms-label">Pharmacy Name</label>
              <input
                type="text"
                value={draft.pharmacyName}
                onChange={(e) => setDraft({ ...draft, pharmacyName: e.target.value })}
                className="pms-input"
              />
            </div>
            <div>
              <label className="pms-label">Tagline / Sub-title</label>
              <input
                type="text"
                value={draft.tagline}
                onChange={(e) => setDraft({ ...draft, tagline: e.target.value })}
                className="pms-input"
              />
            </div>
            <div>
              <label className="pms-label">DRAP / Pharmacy License #</label>
              <input
                type="text"
                value={draft.licenseNumber}
                onChange={(e) => setDraft({ ...draft, licenseNumber: e.target.value })}
                className="pms-input font-mono"
              />
            </div>
            <div>
              <label className="pms-label">FBR NTN Number</label>
              <input
                type="text"
                value={draft.ntnNumber}
                onChange={(e) => setDraft({ ...draft, ntnNumber: e.target.value })}
                className="pms-input font-mono"
              />
            </div>
            <div>
              <label className="pms-label">Contact Phone</label>
              <input
                type="text"
                value={draft.phone}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                className="pms-input font-mono"
              />
            </div>
            <div>
              <label className="pms-label">Operations Email</label>
              <input
                type="email"
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                className="pms-input"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="pms-label">Business Address</label>
              <input
                type="text"
                value={draft.address}
                onChange={(e) => setDraft({ ...draft, address: e.target.value })}
                className="pms-input"
              />
            </div>
            <div>
              <label className="pms-label">City</label>
              <input
                type="text"
                value={draft.city}
                onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                className="pms-input"
              />
            </div>
            <div>
              <label className="pms-label">Country</label>
              <input
                type="text"
                value={draft.country}
                onChange={(e) => setDraft({ ...draft, country: e.target.value })}
                className="pms-input"
              />
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-100 pt-4 dark:border-slate-800">
            <button type="submit" className="pms-btn-primary">
              <Save className="h-4 w-4" />
              <span>Save Pharmacy Profile</span>
            </button>
          </div>
        </form>
      )}

      {tab === 'billing' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <form onSubmit={handleSave} className="pms-card space-y-5 p-6 lg:col-span-2">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                Taxation, Currency & Alert Thresholds
              </h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Default POS billing parameters and automated inventory monitoring windows
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="pms-label">Currency Code</label>
                <select
                  value={draft.currencyCode}
                  onChange={(e) => {
                    const code = e.target.value;
                    const sym = code === 'PKR' ? 'Rs.' : code === 'USD' ? '$' : '£';
                    setDraft({ ...draft, currencyCode: code, currencySymbol: sym });
                  }}
                  className="pms-select"
                >
                  <option value="PKR">PKR (Pakistani Rupee — Rs.)</option>
                  <option value="USD">USD (US Dollar — $)</option>
                  <option value="GBP">GBP (British Pound — £)</option>
                </select>
              </div>
              <div>
                <label className="pms-label">Default GST / Sales Tax (%)</label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={draft.defaultTaxPercent}
                  onChange={(e) => setDraft({ ...draft, defaultTaxPercent: Number(e.target.value) })}
                  className="pms-input font-mono"
                />
              </div>
              <div>
                <label className="pms-label">Invoice Number Prefix</label>
                <input
                  type="text"
                  value={draft.invoicePrefix}
                  onChange={(e) => setDraft({ ...draft, invoicePrefix: e.target.value })}
                  className="pms-input font-mono"
                />
              </div>
              <div>
                <label className="pms-label">Default Low-Stock Threshold</label>
                <input
                  type="number"
                  min={1}
                  value={draft.lowStockThresholdDefault}
                  onChange={(e) => setDraft({ ...draft, lowStockThresholdDefault: Number(e.target.value) })}
                  className="pms-input font-mono"
                />
              </div>
              <div>
                <label className="pms-label">Expiry Alert Window (Days)</label>
                <input
                  type="number"
                  min={7}
                  value={draft.expiryAlertDays}
                  onChange={(e) => setDraft({ ...draft, expiryAlertDays: Number(e.target.value) })}
                  className="pms-input font-mono"
                />
              </div>
            </div>

            <label className="flex items-center gap-2.5 text-sm font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={draft.applyTaxOnMedicines}
                onChange={(e) => setDraft({ ...draft, applyTaxOnMedicines: e.target.checked })}
                className="h-4 w-4 accent-teal-700"
              />
              <span>
                Apply default tax automatically on POS medicines (uncheck for tax-exempt essential medicines)
              </span>
            </label>

            <div>
              <label className="pms-label">Receipt Footer Policy Note</label>
              <textarea
                rows={2}
                value={draft.receiptFooterNote}
                onChange={(e) => setDraft({ ...draft, receiptFooterNote: e.target.value })}
                className="pms-textarea"
              />
            </div>

            <div className="flex justify-end border-t border-slate-100 pt-4 dark:border-slate-800">
              <button type="submit" className="pms-btn-primary">
                <Save className="h-4 w-4" />
                <span>Save Billing & Tax Rules</span>
              </button>
            </div>
          </form>

          {/* Live Thermal Receipt Preview */}
          <div className="pms-card p-6">
            <h3 className="mb-3.5 font-display text-base font-semibold text-slate-900 dark:text-slate-100">
              Live Thermal Receipt Preview
            </h3>
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-700 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-300">
              <p className="text-center text-sm font-bold text-slate-900 dark:text-slate-100">{draft.pharmacyName}</p>
              <p className="text-center text-[11px] text-slate-500">{draft.tagline}</p>
              <p className="mt-1.5 text-center text-[11px]">
                {draft.address}, {draft.city}
              </p>
              <p className="text-center text-[11px]">
                Lic: {draft.licenseNumber} · NTN: {draft.ntnNumber}
              </p>
              <div className="my-2.5 border-t border-dashed border-slate-300 dark:border-slate-700" />
              <div className="flex justify-between">
                <span>Sample Invoice:</span>
                <span>{draft.invoicePrefix}1049</span>
              </div>
              <div className="flex justify-between">
                <span>Tax Mode:</span>
                <span>{draft.applyTaxOnMedicines ? `${draft.defaultTaxPercent}% GST` : 'Exempt (0%)'}</span>
              </div>
              <div className="mt-1 flex justify-between font-bold text-slate-900 dark:text-slate-100">
                <span>Sample Total:</span>
                <span>{draft.currencySymbol} 1,450.00</span>
              </div>
              <div className="my-2.5 border-t border-dashed border-slate-300 dark:border-slate-700" />
              <p className="text-center text-[11px] italic text-slate-500">{draft.receiptFooterNote}</p>
            </div>
          </div>
        </div>
      )}

      {tab === 'account' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="pms-card space-y-5 p-6">
            <div className="flex items-center gap-4">
              <img
                src={MEDICINE_IMAGES.avatarAdmin}
                alt="Dr. Ayesha Siddiqui"
                referrerPolicy="no-referrer"
                className="h-16 w-16 rounded-2xl object-cover ring-1 ring-slate-200 dark:ring-slate-700"
              />
              <div>
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                  Dr. Ayesha Siddiqui
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Chief Pharmacist & Administrator · DRAP Reg #1492
                </p>
              </div>
            </div>

            <div className="space-y-4 border-t border-slate-200 pt-4 dark:border-slate-800">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Appearance Theme</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Active: {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
                  </p>
                </div>
                <button type="button" onClick={toggleTheme} className="pms-btn-secondary">
                  {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  <span>Switch to {theme === 'light' ? 'Dark' : 'Light'}</span>
                </button>
              </div>

              <div>
                <label className="pms-label">Interface Language</label>
                <select
                  value={draft.language}
                  onChange={(e) => {
                    const lang = e.target.value as PharmacySettings['language'];
                    setDraft({ ...draft, language: lang });
                    updateSettings({ language: lang });
                  }}
                  className="pms-select"
                >
                  <option value="English (PK)">English (Pakistan)</option>
                  <option value="English (US)">English (US)</option>
                  <option value="Urdu Support">Bilingual English / Urdu Labels</option>
                </select>
              </div>

              <div className="space-y-2.5 pt-2">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notification Preferences</p>
                <label className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300">
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
                <label className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300">
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

          <form onSubmit={handlePasswordSubmit} className="pms-card space-y-4 p-6">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                Security & Password Management
              </h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Update administrator credentials for POS and system controls
              </p>
            </div>
            <div>
              <label className="pms-label">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="pms-input"
              />
            </div>
            <div>
              <label className="pms-label">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pms-input"
              />
            </div>
            <div>
              <label className="pms-label">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pms-input"
              />
            </div>
            <div className="pt-2">
              <button type="submit" className="pms-btn-primary">
                Update Password
              </button>
            </div>
          </form>
        </div>
      )}

      {tab === 'system' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="pms-card space-y-5 p-6">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                Automated Backup & Demo Reset
              </h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Download a complete portable snapshot or restore initial sample pharmacy state
              </p>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm dark:bg-slate-800/60">
              <span className="text-slate-600 dark:text-slate-300">Last Snapshot</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                {formatDateTime(settings.lastBackupAt)}
              </span>
            </div>
            <div>
              <label className="pms-label">Backup Cadence</label>
              <select
                value={draft.backupFrequency}
                onChange={(e) => {
                  const freq = e.target.value as PharmacySettings['backupFrequency'];
                  setDraft({ ...draft, backupFrequency: freq });
                  updateSettings({ backupFrequency: freq });
                }}
                className="pms-select"
              >
                <option value="Daily">Daily (02:00 PKT)</option>
                <option value="Weekly">Weekly (Sunday)</option>
                <option value="Manual">Manual Only</option>
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button type="button" onClick={handleExportBackup} className="pms-btn-primary">
                <Download className="h-4 w-4" />
                <span>Download Complete JSON Snapshot</span>
              </button>
              <button
                type="button"
                onClick={() => setResetOpen(true)}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 px-4 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Restore Default Demo Data</span>
              </button>
            </div>
          </div>

          <div className="pms-card space-y-4 p-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-400">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                  Backend & Database Integration Architecture
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Typed domain layer ready for persistence</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Frontend entities, validation schemas, and repository methods are decoupled in{' '}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-800">
                src/types
              </code>{' '}
              and{' '}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-800">
                src/services/pmsStore.tsx
              </code>{' '}
              for seamless migration to PostgreSQL + Prisma ORM.
            </p>
            <div className="space-y-2 rounded-xl bg-slate-50 p-4 font-mono text-xs text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
              <p>Provider Target: {settings.dbProvider}</p>
              <p>Entities Mapped: Medicine, Supplier, Customer, Sale, PurchaseOrder, Prescription, Employee, Expense</p>
              <p>
                Currency Standard: {settings.currencyCode} ({settings.currencySymbol})
              </p>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={resetDemoData}
        title="Restore Default Demo Data"
        message="Reset all medicines, POS invoices, purchase orders, prescriptions, expenses, and settings back to their initial Al-Shifa Clinical Pharmacy demo values?"
        confirmLabel="Restore Defaults"
        tone="danger"
      />
    </div>
  );
};

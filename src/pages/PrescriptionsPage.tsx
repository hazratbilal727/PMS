import React, { useEffect, useMemo, useState } from 'react';
import { Eye, FileImage, FileText, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { REFERENCE_TODAY } from '../lib/constants';
import { formatDate } from '../lib/utils';
import { usePMS } from '../services/pmsStore';
import type { Prescription, PrescriptionItem } from '../types';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { PaginationBar } from '../components/ui/PaginationBar';
import { SearchInput } from '../components/ui/SearchInput';
import { StatusText } from '../components/ui/StatusText';

export const PrescriptionsPage: React.FC = () => {
  const {
    prescriptions,
    medicines,
    customers,
    addPrescription,
    updatePrescriptionStatus,
    deletePrescription,
    sendPrescriptionToPOS,
    quickActionIntent,
    clearQuickActionIntent,
  } = usePMS();

  const [statusFilter, setStatusFilter] = useState<'All' | Prescription['status']>('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [createOpen, setCreateOpen] = useState(false);
  const [viewRx, setViewRx] = useState<Prescription | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Prescription | null>(null);

  const [patientId, setPatientId] = useState(customers[1]?.id ?? 'cust-walkin');
  const [patientAge, setPatientAge] = useState(38);
  const [doctorName, setDoctorName] = useState('');
  const [doctorLicense, setDoctorLicense] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');
  const [rxItems, setRxItems] = useState<PrescriptionItem[]>([
    {
      medicineId: medicines[0]?.id,
      medicineName: medicines[0]?.name ?? 'Augmentin 625mg Tablets',
      dosage: '625 mg',
      frequency: 'Twice daily',
      duration: '7 Days',
      quantity: 1,
    },
  ]);

  useEffect(() => {
    if (quickActionIntent === 'new-rx') {
      setCreateOpen(true);
      clearQuickActionIntent();
    }
  }, [quickActionIntent, clearQuickActionIntent]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return prescriptions.filter((p) => {
      const matchStatus = statusFilter === 'All' || p.status === statusFilter;
      const matchSearch =
        !q ||
        p.prescriptionNumber.toLowerCase().includes(q) ||
        p.patientName.toLowerCase().includes(q) ||
        p.patientPhone.includes(q) ||
        p.doctorName.toLowerCase().includes(q) ||
        p.diagnosis.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [prescriptions, statusFilter, search]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImagePreviewUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const addRxLine = () => {
    const med = medicines[0];
    setRxItems((prev) => [
      ...prev,
      {
        medicineId: med?.id,
        medicineName: med?.name ?? '',
        dosage: med?.strength ?? '500 mg',
        frequency: 'Once daily',
        duration: '5 Days',
        quantity: 1,
      },
    ]);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === patientId);
    if (!doctorName.trim() || rxItems.length === 0) return;

    addPrescription({
      date: REFERENCE_TODAY,
      patientId: cust?.id,
      patientName: cust?.name ?? 'Walk-in Patient',
      patientPhone: cust?.phone ?? '',
      patientAge,
      doctorName: doctorName.trim(),
      doctorLicense: doctorLicense.trim() || 'PMDC-VERIFIED',
      clinicName: clinicName.trim() || 'Outpatient Clinic',
      diagnosis: diagnosis.trim() || 'Clinical Consultation',
      items: rxItems,
      status: 'Pending',
      imagePreviewUrl: imagePreviewUrl || undefined,
      notes: notes.trim() || undefined,
    });
    setCreateOpen(false);
    setDoctorName('');
    setDiagnosis('');
    setImagePreviewUrl('');
    setNotes('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Prescriptions (Rx) & Dispensing (${prescriptions.length})`}
        description="Log physician prescriptions, verify dosage schedules, upload Rx scans, and send directly to POS"
        actions={
          <button type="button" onClick={() => setCreateOpen(true)} className="pms-btn-primary">
            <Plus className="h-4 w-4" />
            <span>New Prescription</span>
          </button>
        }
      />

      {/* Status Filter & Search */}
      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex items-center gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          {(['All', 'Pending', 'Dispensed', 'Partial', 'Cancelled'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`rounded-lg px-3.5 py-2 text-[13px] font-medium whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <SearchInput
          value={search}
          onValueChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search Rx #, patient or doctor..."
          containerClassName="w-full sm:w-80"
        />
      </div>

      {/* Table */}
      <div className="pms-card overflow-hidden">
        {paged.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No prescriptions found"
            description="No prescription records matched your status filter or search term."
            actionLabel="Reset Filters"
            onAction={() => {
              setStatusFilter('All');
              setSearch('');
              setPage(1);
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                  <th className="px-5 py-3.5">Rx Number</th>
                  <th className="px-4 py-3.5">Patient</th>
                  <th className="px-4 py-3.5">Prescribing Physician</th>
                  <th className="px-4 py-3.5">Medicines</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paged.map((rx) => (
                  <tr key={rx.id} className="transition-colors hover:bg-slate-50/75 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3.5">
                      <p className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                        {rx.prescriptionNumber}
                      </p>
                      <p className="text-xs text-slate-400">{formatDate(rx.date)}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-slate-900 dark:text-slate-100">{rx.patientName}</p>
                      <p className="text-xs text-slate-400">
                        Age {rx.patientAge} · {rx.patientPhone || 'Walk-in'}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-slate-800 dark:text-slate-200">{rx.doctorName}</p>
                      <p className="text-xs text-slate-400">
                        {rx.clinicName} · {rx.doctorLicense}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium">{rx.items.length} prescribed item(s)</p>
                      <p className="max-w-xs truncate text-xs text-slate-500">
                        {rx.items.map((i) => i.medicineName).join(', ')}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusText
                        label={rx.linkedSaleInvoice ? `${rx.status} (${rx.linkedSaleInvoice})` : rx.status}
                        tone={rx.status === 'Dispensed' ? 'ok' : rx.status === 'Cancelled' ? 'critical' : 'warning'}
                      />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {rx.status !== 'Dispensed' && rx.status !== 'Cancelled' && (
                          <button
                            type="button"
                            onClick={() => sendPrescriptionToPOS(rx.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-teal-800"
                          >
                            <ShoppingCart className="h-3.5 w-3.5" />
                            <span>Dispense in POS</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setViewRx(rx)}
                          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                          aria-label={`View ${rx.prescriptionNumber}`}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(rx)}
                          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                          aria-label={`Delete ${rx.prescriptionNumber}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <PaginationBar page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
      </div>

      {/* Create Prescription Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Clinical Prescription" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="pms-label">Patient</label>
              <select value={patientId} onChange={(e) => setPatientId(e.target.value)} className="pms-select">
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="pms-label">Patient Age</label>
              <input
                type="number"
                min={0}
                value={patientAge}
                onChange={(e) => setPatientAge(Number(e.target.value))}
                className="pms-input font-mono"
              />
            </div>
            <div>
              <label className="pms-label">Doctor Name *</label>
              <input
                type="text"
                required
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="e.g. Dr. Kamran Haider"
                className="pms-input"
              />
            </div>
            <div>
              <label className="pms-label">PMDC License #</label>
              <input
                type="text"
                value={doctorLicense}
                onChange={(e) => setDoctorLicense(e.target.value)}
                placeholder="e.g. PMDC-44912-P"
                className="pms-input font-mono"
              />
            </div>
            <div>
              <label className="pms-label">Hospital / Clinic</label>
              <input
                type="text"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                className="pms-input"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="pms-label">Diagnosis / Indication</label>
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="pms-input"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-display text-sm font-semibold">Prescribed Medicines</span>
              <button
                type="button"
                onClick={addRxLine}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:underline dark:text-teal-400"
              >
                <Plus className="h-4 w-4" />
                <span>Add Medicine</span>
              </button>
            </div>
            {rxItems.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 gap-2.5 rounded-xl border border-slate-200 p-3 sm:grid-cols-12 dark:border-slate-800"
              >
                <div className="sm:col-span-4">
                  <select
                    value={item.medicineId ?? ''}
                    onChange={(e) => {
                      const med = medicines.find((m) => m.id === e.target.value);
                      setRxItems((prev) =>
                        prev.map((r, i) =>
                          i === idx
                            ? {
                                ...r,
                                medicineId: med?.id,
                                medicineName: med?.name ?? r.medicineName,
                                dosage: med?.strength ?? r.dosage,
                              }
                            : r
                        )
                      );
                    }}
                    className="pms-select"
                  >
                    {medicines.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={item.dosage}
                    onChange={(e) =>
                      setRxItems((prev) => prev.map((r, i) => (i === idx ? { ...r, dosage: e.target.value } : r)))
                    }
                    placeholder="Dosage"
                    className="pms-input"
                  />
                </div>
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    value={item.frequency}
                    onChange={(e) =>
                      setRxItems((prev) => prev.map((r, i) => (i === idx ? { ...r, frequency: e.target.value } : r)))
                    }
                    placeholder="Frequency"
                    className="pms-input"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={item.duration}
                    onChange={(e) =>
                      setRxItems((prev) => prev.map((r, i) => (i === idx ? { ...r, duration: e.target.value } : r)))
                    }
                    placeholder="Duration"
                    className="pms-input"
                  />
                </div>
                <div className="flex items-center justify-end sm:col-span-1">
                  <button
                    type="button"
                    onClick={() => rxItems.length > 1 && setRxItems((prev) => prev.filter((_, i) => i !== idx))}
                    className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Remove medicine line"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="pms-label">Upload Scanned Prescription Image</label>
              <label className="flex h-10 cursor-pointer items-center gap-2.5 rounded-xl border border-dashed border-slate-300 px-3.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                <FileImage className="h-4 w-4 text-teal-600" />
                <span>{imagePreviewUrl ? 'Image attached (click to replace)' : 'Attach Rx Photo / Scan'}</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
            <div>
              <label className="pms-label">Pharmacist Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="pms-input"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button type="button" onClick={() => setCreateOpen(false)} className="pms-btn-secondary">
              Cancel
            </button>
            <button type="submit" className="pms-btn-primary">
              Save Prescription
            </button>
          </div>
        </form>
      </Modal>

      {/* View Rx Modal */}
      <Modal
        open={Boolean(viewRx)}
        onClose={() => setViewRx(null)}
        title={`Prescription ${viewRx?.prescriptionNumber ?? ''}`}
        subtitle={viewRx ? `${viewRx.patientName} · ${viewRx.doctorName}` : ''}
        size="md"
      >
        {viewRx && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
              <div>
                <p className="text-xs text-slate-400">Diagnosis</p>
                <p className="mt-0.5 font-semibold">{viewRx.diagnosis}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Status</p>
                <select
                  value={viewRx.status}
                  onChange={(e) => {
                    const st = e.target.value as Prescription['status'];
                    updatePrescriptionStatus(viewRx.id, st);
                    setViewRx({ ...viewRx, status: st });
                  }}
                  className="pms-select mt-1 h-9"
                >
                  <option value="Pending">Pending</option>
                  <option value="Partial">Partial</option>
                  <option value="Dispensed">Dispensed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {viewRx.imagePreviewUrl && (
              <img
                src={viewRx.imagePreviewUrl}
                alt="Uploaded prescription scan"
                className="max-h-52 w-full rounded-xl border border-slate-200 object-contain dark:border-slate-700"
              />
            )}

            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800">
                  <th className="py-2.5">Medicine</th>
                  <th className="py-2.5">Dosage & Frequency</th>
                  <th className="py-2.5 text-right">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {viewRx.items.map((item, i) => (
                  <tr key={i}>
                    <td className="py-2.5 font-medium">{item.medicineName}</td>
                    <td className="py-2.5 text-slate-600 dark:text-slate-300">
                      {item.dosage} · {item.frequency}
                    </td>
                    <td className="py-2.5 text-right font-mono">{item.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {viewRx.notes && (
              <p className="rounded-xl bg-amber-50 p-3.5 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                Note: {viewRx.notes}
              </p>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deletePrescription(deleteTarget.id);
        }}
        title="Delete Prescription"
        message={`Remove prescription ${deleteTarget?.prescriptionNumber} for ${deleteTarget?.patientName}? Linked POS invoices will not be affected.`}
        confirmLabel="Delete Prescription"
        tone="danger"
      />
    </div>
  );
};

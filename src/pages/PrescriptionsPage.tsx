import React, { useMemo, useState } from 'react';
import { Eye, FileImage, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { REFERENCE_TODAY } from '../lib/constants';
import { formatDate } from '../lib/utils';
import { usePMS } from '../services/pmsStore';
import type { Prescription, PrescriptionItem } from '../types';
import { Modal } from '../components/ui/Modal';
import { StatusText } from '../components/ui/StatusText';

export const PrescriptionsPage: React.FC = () => {
  const {
    prescriptions,
    medicines,
    customers,
    addPrescription,
    updatePrescriptionStatus,
    sendPrescriptionToPOS,
  } = usePMS();

  const [statusFilter, setStatusFilter] = useState<'All' | Prescription['status']>('All');
  const [createOpen, setCreateOpen] = useState(false);
  const [viewRx, setViewRx] = useState<Prescription | null>(null);

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

  const filtered = useMemo(() => {
    return prescriptions.filter((p) => statusFilter === 'All' || p.status === statusFilter);
  }, [prescriptions, statusFilter]);

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
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
            Prescriptions (Rx) & Dispensing ({prescriptions.length})
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Log physician prescriptions, verify dosage schedules, upload Rx scans, and send directly to POS
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-medium text-white hover:bg-teal-800 dark:bg-teal-600"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Prescription</span>
        </button>
      </div>

      {/* Status Filter */}
      <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
        {(['All', 'Pending', 'Dispensed', 'Partial', 'Cancelled'] as const).map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === st
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-slate-100'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
                <th className="px-4 py-3 font-medium">Rx Number</th>
                <th className="px-3 py-3 font-medium">Patient</th>
                <th className="px-3 py-3 font-medium">Prescribing Physician</th>
                <th className="px-3 py-3 font-medium">Medicines</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((rx) => (
                <tr key={rx.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3">
                    <p className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                      {rx.prescriptionNumber}
                    </p>
                    <p className="text-[11px] text-slate-400">{formatDate(rx.date)}</p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-medium">{rx.patientName}</p>
                    <p className="text-[11px] text-slate-400">Age {rx.patientAge} · {rx.patientPhone}</p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-medium">{rx.doctorName}</p>
                    <p className="text-[11px] text-slate-400">{rx.clinicName} · {rx.doctorLicense}</p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-medium">{rx.items.length} prescribed item(s)</p>
                    <p className="truncate max-w-xs text-[11px] text-slate-500">
                      {rx.items.map((i) => i.medicineName).join(', ')}
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    <StatusText
                      label={rx.linkedSaleInvoice ? `${rx.status} (${rx.linkedSaleInvoice})` : rx.status}
                      tone={rx.status === 'Dispensed' ? 'ok' : rx.status === 'Cancelled' ? 'critical' : 'warning'}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {rx.status !== 'Dispensed' && rx.status !== 'Cancelled' && (
                        <button
                          type="button"
                          onClick={() => sendPrescriptionToPOS(rx.id)}
                          className="inline-flex items-center gap-1 rounded bg-teal-700 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-teal-800"
                        >
                          <ShoppingCart className="h-3 w-3" />
                          <span>Dispense in POS</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setViewRx(rx)}
                        className="rounded p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        aria-label={`View ${rx.prescriptionNumber}`}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Prescription Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Clinical Prescription" size="lg">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="mb-1 block font-medium">Patient</label>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block font-medium">Patient Age</label>
              <input
                type="number"
                value={patientAge}
                onChange={(e) => setPatientAge(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="mb-1 block font-medium">Doctor Name *</label>
              <input
                type="text"
                required
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="e.g. Dr. Kamran Haider"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="mb-1 block font-medium">PMDC License #</label>
              <input
                type="text"
                value={doctorLicense}
                onChange={(e) => setDoctorLicense(e.target.value)}
                placeholder="e.g. PMDC-44912-P"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="mb-1 block font-medium">Hospital / Clinic</label>
              <input
                type="text"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="mb-1 block font-medium">Diagnosis / Indication</label>
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Prescribed Medicines</span>
              <button
                type="button"
                onClick={addRxLine}
                className="inline-flex items-center gap-1 text-teal-700 hover:underline dark:text-teal-400"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Medicine</span>
              </button>
            </div>
            {rxItems.map((item, idx) => (
              <div key={idx} className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-12 dark:border-slate-800">
                <div className="sm:col-span-4">
                  <select
                    value={item.medicineId ?? ''}
                    onChange={(e) => {
                      const med = medicines.find((m) => m.id === e.target.value);
                      setRxItems((prev) =>
                        prev.map((r, i) =>
                          i === idx
                            ? { ...r, medicineId: med?.id, medicineName: med?.name ?? r.medicineName, dosage: med?.strength ?? r.dosage }
                            : r
                        )
                      );
                    }}
                    className="w-full rounded border border-slate-200 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-800"
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
                    className="w-full rounded border border-slate-200 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-800"
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
                    className="w-full rounded border border-slate-200 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-800"
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
                    className="w-full rounded border border-slate-200 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div className="flex items-center justify-end sm:col-span-1">
                  <button
                    type="button"
                    onClick={() => rxItems.length > 1 && setRxItems((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-medium">Upload Scanned Prescription Image</label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                <FileImage className="h-4 w-4 text-teal-600" />
                <span>{imagePreviewUrl ? 'Image attached (click to replace)' : 'Attach Rx Photo / Scan'}</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
            <div>
              <label className="mb-1 block font-medium">Pharmacist Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 font-medium dark:border-slate-700"
            >
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-teal-700 px-4 py-2 font-medium text-white hover:bg-teal-800">
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
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
              <div>
                <p className="text-slate-400">Diagnosis</p>
                <p className="font-semibold">{viewRx.diagnosis}</p>
              </div>
              <div>
                <p className="text-slate-400">Status</p>
                <select
                  value={viewRx.status}
                  onChange={(e) => {
                    const st = e.target.value as Prescription['status'];
                    updatePrescriptionStatus(viewRx.id, st);
                    setViewRx({ ...viewRx, status: st });
                  }}
                  className="mt-0.5 rounded border border-slate-200 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
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
                className="max-h-48 w-full rounded-lg border border-slate-200 object-contain dark:border-slate-700"
              />
            )}

            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                  <th className="py-2 font-medium">Medicine</th>
                  <th className="py-2 font-medium">Dosage & Frequency</th>
                  <th className="py-2 text-right font-medium">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {viewRx.items.map((item, i) => (
                  <tr key={i}>
                    <td className="py-2 font-medium">{item.medicineName}</td>
                    <td className="py-2 text-slate-600 dark:text-slate-300">
                      {item.dosage} · {item.frequency}
                    </td>
                    <td className="py-2 text-right font-mono">{item.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {viewRx.notes && (
              <p className="rounded-lg bg-amber-50 p-3 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                Note: {viewRx.notes}
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

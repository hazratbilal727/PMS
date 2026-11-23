import React, { useState } from 'react';
import { Plus, ShieldCheck } from 'lucide-react';
import { REFERENCE_TODAY, STAFF_ROLES } from '../lib/constants';
import { formatCurrency, formatDate, formatDateTime } from '../lib/utils';
import { usePMS } from '../services/pmsStore';
import type { AttendanceRecord, Employee, RolePermissionMatrix, StaffRole } from '../types';
import { Modal } from '../components/ui/Modal';
import { StatusText } from '../components/ui/StatusText';

const PERMISSION_LABELS: Array<{ key: keyof RolePermissionMatrix[StaffRole]; label: string }> = [
  { key: 'posAccess', label: 'POS Terminal' },
  { key: 'manageMedicines', label: 'Edit Medicines' },
  { key: 'adjustInventory', label: 'Adjust Stock' },
  { key: 'approvePurchases', label: 'Approve POs' },
  { key: 'processRefunds', label: 'Process Refunds' },
  { key: 'viewFinancialReports', label: 'Financial P&L' },
  { key: 'manageStaff', label: 'Manage Staff' },
  { key: 'systemSettings', label: 'System Settings' },
];

export const EmployeesPage: React.FC = () => {
  const {
    employees,
    attendance,
    activityLogs,
    rolePermissions,
    settings,
    addEmployee,
    updateAttendanceStatus,
    toggleRolePermission,
  } = usePMS();

  const [tab, setTab] = useState<'directory' | 'attendance' | 'roles' | 'activity'>('directory');
  const [modalOpen, setModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [role, setRole] = useState<StaffRole>('Pharmacist');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [cnic, setCnic] = useState('');
  const [salaryPkr, setSalaryPkr] = useState(85000);
  const [shift, setShift] = useState<Employee['shift']>('Morning (08:00 - 16:00)');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    addEmployee({
      name: name.trim(),
      role,
      phone: phone.trim(),
      email: email.trim(),
      cnic: cnic.trim() || '35202-0000000-0',
      salaryPkr,
      joinDate: REFERENCE_TODAY,
      shift,
      status: 'Active',
    });
    setModalOpen(false);
    setName('');
    setPhone('');
    setEmail('');
    setCnic('');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
            Employees, Attendance & RBAC ({employees.length})
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage pharmacy staff profiles, shifts, daily attendance, audit logs, and role permissions
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-medium text-white hover:bg-teal-800 dark:bg-teal-600"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="inline-flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
        {(
          [
            { id: 'directory', label: 'Staff Directory' },
            { id: 'attendance', label: 'Attendance' },
            { id: 'roles', label: 'Roles & Permissions' },
            { id: 'activity', label: `Activity Logs (${activityLogs.length})` },
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

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {tab === 'directory' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
                  <th className="px-4 py-3 font-medium">Employee</th>
                  <th className="px-3 py-3 font-medium">Role</th>
                  <th className="px-3 py-3 font-medium">Contact & CNIC</th>
                  <th className="px-3 py-3 font-medium">Shift</th>
                  <th className="px-3 py-3 text-right font-medium">Monthly Salary</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {employees.map((e) => (
                  <tr key={e.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{e.name}</p>
                      <p className="font-mono text-[11px] text-slate-400">
                        {e.employeeCode} · Joined {formatDate(e.joinDate)}
                      </p>
                    </td>
                    <td className="px-3 py-3 font-medium text-teal-700 dark:text-teal-400">{e.role}</td>
                    <td className="px-3 py-3">
                      <p className="font-mono">{e.phone}</p>
                      <p className="font-mono text-[11px] text-slate-400">{e.cnic}</p>
                    </td>
                    <td className="px-3 py-3 text-slate-600 dark:text-slate-400">{e.shift}</td>
                    <td className="px-3 py-3 text-right font-mono font-semibold tabular-nums">
                      {formatCurrency(e.salaryPkr, settings.currencySymbol)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusText label={e.status} tone={e.status === 'Active' ? 'ok' : 'warning'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'attendance' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
                  <th className="px-4 py-3 font-medium">Staff Member</th>
                  <th className="px-3 py-3 font-medium">Role</th>
                  <th className="px-3 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 font-medium">Check-in</th>
                  <th className="px-4 py-3 font-medium">Attendance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {attendance.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-3 font-semibold">{a.employeeName}</td>
                    <td className="px-3 py-3 text-slate-500">{a.role}</td>
                    <td className="px-3 py-3 font-mono">{formatDate(a.date)}</td>
                    <td className="px-3 py-3 font-mono">{a.checkIn || '—'}</td>
                    <td className="px-4 py-3">
                      <select
                        value={a.status}
                        onChange={(e) => updateAttendanceStatus(a.employeeId, e.target.value as AttendanceRecord['status'])}
                        className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
                      >
                        <option value="Present">Present</option>
                        <option value="Late">Late</option>
                        <option value="Leave">Leave</option>
                        <option value="Absent">Absent</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'roles' && (
          <div className="overflow-x-auto p-4">
            <div className="mb-3 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <ShieldCheck className="h-4 w-4 text-teal-600" />
              <span>Interactive Role-Based Access Control (RBAC) permission matrix ready for backend middleware enforcement.</span>
            </div>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                  <th className="py-2.5 pr-4 font-medium">Role</th>
                  {PERMISSION_LABELS.map((p) => (
                    <th key={p.key} className="px-2 py-2.5 text-center font-medium whitespace-nowrap">
                      {p.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {STAFF_ROLES.map((r) => (
                  <tr key={r}>
                    <td className="py-3 pr-4 font-semibold text-slate-900 dark:text-slate-100">{r}</td>
                    {PERMISSION_LABELS.map((p) => (
                      <td key={p.key} className="px-2 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={rolePermissions[r][p.key]}
                          onChange={() => toggleRolePermission(r, p.key)}
                          aria-label={`${r} ${p.label}`}
                          className="h-4 w-4 cursor-pointer accent-teal-700"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'activity' && (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {activityLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between gap-4 px-5 py-3 text-xs">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {log.actorName} ({log.actorRole}) · {log.module} — {log.action}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400">{log.details}</p>
                </div>
                <span className="shrink-0 font-mono text-[11px] text-slate-400">{formatDateTime(log.timestamp)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Pharmacy Staff Member" size="md">
        <form onSubmit={handleAdd} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-medium">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="mb-1 block font-medium">Job Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as StaffRole)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              >
                {STAFF_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block font-medium">Phone *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="mb-1 block font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="mb-1 block font-medium">CNIC</label>
              <input
                type="text"
                value={cnic}
                onChange={(e) => setCnic(e.target.value)}
                placeholder="35202-0000000-0"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="mb-1 block font-medium">Monthly Salary ({settings.currencySymbol})</label>
              <input
                type="number"
                value={salaryPkr}
                onChange={(e) => setSalaryPkr(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block font-medium">Assigned Shift</label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value as Employee['shift'])}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="Morning (08:00 - 16:00)">Morning (08:00 - 16:00)</option>
                <option value="Evening (14:00 - 22:00)">Evening (14:00 - 22:00)</option>
                <option value="Night (22:00 - 08:00)">Night (22:00 - 08:00)</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 font-medium dark:border-slate-700"
            >
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-teal-700 px-4 py-2 font-medium text-white hover:bg-teal-800">
              Add Staff Member
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

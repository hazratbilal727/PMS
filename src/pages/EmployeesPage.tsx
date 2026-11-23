import React, { useMemo, useState } from 'react';
import { Edit2, Plus, ShieldCheck, Trash2, Users } from 'lucide-react';
import { REFERENCE_TODAY, STAFF_ROLES } from '../lib/constants';
import { formatCurrency, formatDate, formatDateTime } from '../lib/utils';
import { usePMS } from '../services/pmsStore';
import type { AttendanceRecord, Employee, RolePermissionMatrix, StaffRole } from '../types';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { PaginationBar } from '../components/ui/PaginationBar';
import { SearchInput } from '../components/ui/SearchInput';
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
    updateEmployee,
    deleteEmployee,
    updateAttendanceStatus,
    toggleRolePermission,
  } = usePMS();

  const [tab, setTab] = useState<'directory' | 'attendance' | 'roles' | 'activity'>('directory');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);

  const [name, setName] = useState('');
  const [role, setRole] = useState<StaffRole>('Pharmacist');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [cnic, setCnic] = useState('');
  const [salaryPkr, setSalaryPkr] = useState(85000);
  const [shift, setShift] = useState<Employee['shift']>('Morning (08:00 - 16:00)');
  const [status, setStatus] = useState<Employee['status']>('Active');

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter(
      (e) =>
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.role.toLowerCase().includes(q) ||
        e.employeeCode.toLowerCase().includes(q) ||
        e.phone.includes(q)
    );
  }, [employees, search]);

  const filteredAttendance = useMemo(() => {
    const q = search.trim().toLowerCase();
    return attendance.filter(
      (a) =>
        !q ||
        a.employeeName.toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q) ||
        a.status.toLowerCase().includes(q)
    );
  }, [attendance, search]);

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activityLogs.filter(
      (l) =>
        !q ||
        l.actorName.toLowerCase().includes(q) ||
        l.module.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q)
    );
  }, [activityLogs, search]);

  const pagedEmployees = filteredEmployees.slice((page - 1) * pageSize, page * pageSize);
  const pagedLogs = filteredLogs.slice((page - 1) * pageSize, page * pageSize);

  const openAdd = () => {
    setEditing(null);
    setName('');
    setRole('Pharmacist');
    setPhone('');
    setEmail('');
    setCnic('');
    setSalaryPkr(85000);
    setShift('Morning (08:00 - 16:00)');
    setStatus('Active');
    setModalOpen(true);
  };

  const openEdit = (e: Employee) => {
    setEditing(e);
    setName(e.name);
    setRole(e.role);
    setPhone(e.phone);
    setEmail(e.email);
    setCnic(e.cnic);
    setSalaryPkr(e.salaryPkr);
    setShift(e.shift);
    setStatus(e.status);
    setModalOpen(true);
  };

  const handleSave = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    if (editing) {
      updateEmployee(editing.id, {
        name: name.trim(),
        role,
        phone: phone.trim(),
        email: email.trim(),
        cnic: cnic.trim() || editing.cnic,
        salaryPkr,
        shift,
        status,
      });
    } else {
      addEmployee({
        name: name.trim(),
        role,
        phone: phone.trim(),
        email: email.trim(),
        cnic: cnic.trim() || '35202-0000000-0',
        salaryPkr,
        joinDate: REFERENCE_TODAY,
        shift,
        status,
      });
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Employees, Attendance & RBAC (${employees.length})`}
        description="Manage pharmacy staff profiles, shifts, daily attendance, audit logs, and role permissions"
        actions={
          <button type="button" onClick={openAdd} className="pms-btn-primary">
            <Plus className="h-4 w-4" />
            <span>Add Employee</span>
          </button>
        }
      />

      {/* Tabs & Search */}
      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
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
              onClick={() => {
                setTab(t.id);
                setPage(1);
              }}
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

        {tab !== 'roles' && (
          <SearchInput
            value={search}
            onValueChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder={tab === 'activity' ? 'Search audit logs...' : 'Search staff name, role or code...'}
            containerClassName="w-full sm:w-72"
          />
        )}
      </div>

      <div className="pms-card overflow-hidden">
        {tab === 'directory' && (
          <>
            {pagedEmployees.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No staff members found"
                description="No employees matched your search query."
                actionLabel="Clear Search"
                onAction={() => setSearch('')}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                      <th className="px-5 py-3.5">Employee</th>
                      <th className="px-4 py-3.5">Role</th>
                      <th className="px-4 py-3.5">Contact & CNIC</th>
                      <th className="px-4 py-3.5">Shift</th>
                      <th className="px-4 py-3.5 text-right">Monthly Salary</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {pagedEmployees.map((e) => (
                      <tr key={e.id} className="transition-colors hover:bg-slate-50/75 dark:hover:bg-slate-800/40">
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{e.name}</p>
                          <p className="font-mono text-xs text-slate-400">
                            {e.employeeCode} · Joined {formatDate(e.joinDate)}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 font-medium text-teal-700 dark:text-teal-400">{e.role}</td>
                        <td className="px-4 py-3.5">
                          <p className="font-mono text-slate-700 dark:text-slate-300">{e.phone}</p>
                          <p className="font-mono text-xs text-slate-400">{e.cnic}</p>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">{e.shift}</td>
                        <td className="px-4 py-3.5 text-right font-mono font-semibold tabular-nums">
                          {formatCurrency(e.salaryPkr, settings.currencySymbol)}
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusText
                            label={e.status}
                            tone={e.status === 'Active' ? 'ok' : e.status === 'On Leave' ? 'warning' : 'neutral'}
                          />
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEdit(e)}
                              aria-label={`Edit ${e.name}`}
                              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(e)}
                              aria-label={`Delete ${e.name}`}
                              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
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
            <PaginationBar
              page={page}
              pageSize={pageSize}
              total={filteredEmployees.length}
              onPageChange={setPage}
            />
          </>
        )}

        {tab === 'attendance' && (
          <>
            {filteredAttendance.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No attendance records found"
                description="No attendance logs matched your search query."
                actionLabel="Clear Search"
                onAction={() => setSearch('')}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                      <th className="px-5 py-3.5">Staff Member</th>
                      <th className="px-4 py-3.5">Role</th>
                      <th className="px-4 py-3.5">Date</th>
                      <th className="px-4 py-3.5">Check-in</th>
                      <th className="px-5 py-3.5">Attendance Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredAttendance.map((a) => (
                      <tr key={a.id} className="transition-colors hover:bg-slate-50/75 dark:hover:bg-slate-800/40">
                        <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-slate-100">
                          {a.employeeName}
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">{a.role}</td>
                        <td className="px-4 py-3.5 font-mono">{formatDate(a.date)}</td>
                        <td className="px-4 py-3.5 font-mono">{a.checkIn || '—'}</td>
                        <td className="px-5 py-3.5">
                          <select
                            value={a.status}
                            onChange={(e) =>
                              updateAttendanceStatus(a.employeeId, e.target.value as AttendanceRecord['status'])
                            }
                            aria-label={`Attendance status for ${a.employeeName}`}
                            className="pms-select !h-9 !w-40"
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
          </>
        )}

        {tab === 'roles' && (
          <div className="overflow-x-auto p-6">
            <div className="mb-4 flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
              <ShieldCheck className="h-5 w-5 shrink-0 text-teal-600" />
              <span>
                Interactive Role-Based Access Control (RBAC) permission matrix ready for backend middleware enforcement.
              </span>
            </div>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="py-3 pr-4">Role</th>
                  {PERMISSION_LABELS.map((p) => (
                    <th key={p.key} className="px-2.5 py-3 text-center whitespace-nowrap">
                      {p.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {STAFF_ROLES.map((r) => (
                  <tr key={r} className="transition-colors hover:bg-slate-50/75 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 pr-4 font-semibold text-slate-900 dark:text-slate-100">{r}</td>
                    {PERMISSION_LABELS.map((p) => (
                      <td key={p.key} className="px-2.5 py-3.5 text-center">
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
          <>
            {pagedLogs.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No activity logs found"
                description="No system audit logs matched your search query."
                actionLabel="Clear Search"
                onAction={() => setSearch('')}
              />
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {pagedLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex flex-col gap-2 px-6 py-4 text-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {log.actorName} ({log.actorRole}) · {log.module} — {log.action}
                      </p>
                      <p className="mt-0.5 text-slate-500 dark:text-slate-400">{log.details}</p>
                    </div>
                    <span className="shrink-0 font-mono text-xs text-slate-400">
                      {formatDateTime(log.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <PaginationBar page={page} pageSize={pageSize} total={filteredLogs.length} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Add/Edit Employee Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Pharmacy Staff Member' : 'Add Pharmacy Staff Member'}
        subtitle="Configure staff contact credentials, assigned shift, and payroll rate"
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="pms-label">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pms-input"
              />
            </div>
            <div>
              <label className="pms-label">Job Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as StaffRole)}
                className="pms-select"
              >
                {STAFF_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="pms-label">Phone *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pms-input font-mono"
              />
            </div>
            <div>
              <label className="pms-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pms-input"
              />
            </div>
            <div>
              <label className="pms-label">CNIC</label>
              <input
                type="text"
                value={cnic}
                onChange={(e) => setCnic(e.target.value)}
                placeholder="35202-0000000-0"
                className="pms-input font-mono"
              />
            </div>
            <div>
              <label className="pms-label">Monthly Salary ({settings.currencySymbol})</label>
              <input
                type="number"
                min={0}
                value={salaryPkr}
                onChange={(e) => setSalaryPkr(Number(e.target.value))}
                className="pms-input font-mono"
              />
            </div>
            <div>
              <label className="pms-label">Assigned Shift</label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value as Employee['shift'])}
                className="pms-select"
              >
                <option value="Morning (08:00 - 16:00)">Morning (08:00 - 16:00)</option>
                <option value="Evening (14:00 - 22:00)">Evening (14:00 - 22:00)</option>
                <option value="Night (22:00 - 08:00)">Night (22:00 - 08:00)</option>
              </select>
            </div>
            <div>
              <label className="pms-label">Employment Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Employee['status'])}
                className="pms-select"
              >
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="pms-btn-secondary">
              Cancel
            </button>
            <button type="submit" className="pms-btn-primary">
              {editing ? 'Save Changes' : 'Add Staff Member'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteEmployee(deleteTarget.id);
        }}
        title="Remove Staff Member"
        message={`Are you sure you want to remove "${deleteTarget?.name}" (${deleteTarget?.role}) from the pharmacy staff directory?`}
        confirmLabel="Remove Staff"
        tone="danger"
      />
    </div>
  );
};

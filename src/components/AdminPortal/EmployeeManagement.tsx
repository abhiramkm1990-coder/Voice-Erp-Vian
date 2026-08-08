import React, { useState } from 'react';
import { Employee, UserRole } from '../../types';
import { CurrencyCode, formatCurrency } from '../../lib/currency';
import { getEmploymentStatus } from '../../lib/employmentStatus';
import {
  Users,
  UserPlus,
  Search,
  Building,
  Calendar,
  Briefcase,
  DollarSign,
  Edit2,
  UserX,
  UserCheck,
  CheckCircle2,
  X,
  ShieldCheck,
  Mail,
  Coins,
} from 'lucide-react';

interface EmployeeManagementProps {
  employees: Employee[];
  onAddEmployee: (employee: Omit<Employee, 'id'>) => void;
  onUpdateEmployee: (employee: Employee) => void;
  onToggleEmployeeStatus: (employeeId: string) => void;
  currency?: CurrencyCode;
}

export const EmployeeManagement: React.FC<EmployeeManagementProps> = ({
  employees,
  onAddEmployee,
  onUpdateEmployee,
  onToggleEmployeeStatus,
  currency = 'INR' as CurrencyCode,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: 'Engineering',
    designation: 'Software Engineer',
    joiningDate: new Date().toISOString().split('T')[0],
    dob: '1995-08-15',
    basicSalary: 45000,
    role: 'employee' as UserRole,
    bankAccount: 'HDFC' + Math.floor(10000000 + Math.random() * 90000000),
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      department: 'Engineering',
      designation: 'Software Engineer',
      joiningDate: new Date().toISOString().split('T')[0],
      dob: '1995-08-15',
      basicSalary: 45000,
      role: 'employee',
      bankAccount: 'HDFC' + Math.floor(10000000 + Math.random() * 90000000),
    });
    setEditingEmp(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEditModal = (emp: Employee) => {
    setEditingEmp(emp);
    setFormData({
      name: emp.name,
      email: emp.email,
      department: emp.department,
      designation: emp.designation,
      joiningDate: emp.joinDate,
      dob: emp.dob || '1995-08-15',
      basicSalary: emp.salary.basic,
      role: emp.role,
      bankAccount: emp.salary.bankAccount,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim()) {
      alert('Please fill in Employee Name and Email Address.');
      return;
    }

    // Salary auto calculation formula
    const basic = Number(formData.basicSalary) || 30000;
    const hra = Math.round(basic * 0.4);
    const specialAllowance = Math.round(basic * 0.2);
    const pf = Math.round(basic * 0.12);
    const tax = Math.round(basic * 0.1);
    const netPay = Math.round((basic + hra + specialAllowance) - (pf + tax));

    if (editingEmp) {
      // Update Existing Employee
      const updated: Employee = {
        ...editingEmp,
        name: formData.name,
        email: formData.email,
        department: formData.department,
        designation: formData.designation,
        joinDate: formData.joiningDate,
        dob: formData.dob,
        role: formData.role,
        salary: {
          ...editingEmp.salary,
          basic,
          hra,
          specialAllowance,
          pf,
          tax,
          netPay,
          bankAccount: formData.bankAccount,
        },
      };
      onUpdateEmployee(updated);
      setEditingEmp(null);
    } else {
      // Add New Employee
      const newEmp: Omit<Employee, 'id'> = {
        name: formData.name,
        email: formData.email,
        department: formData.department,
        designation: formData.designation,
        phone: '+91 98765 43210',
        joinDate: formData.joiningDate,
        dob: formData.dob,
        role: formData.role,
        status: 'active',
        avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250`,
        leaveBalance: {
          casual: 12,
          sick: 6,
          earned: 15,
          totalAllowed: 33,
        },
        salary: {
          basic,
          hra,
          specialAllowance,
          pf,
          tax,
          netPay,
          bankAccount: formData.bankAccount,
          panNumber: 'ABCDE1234F',
        },
      };
      onAddEmployee(newEmp);
      setShowAddModal(false);
    }

    resetForm();
  };

  // Filter Employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.designation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'All' || emp.department === selectedDept;
    const matchesStatus =
      selectedStatus === 'All' ||
      (selectedStatus === 'Active' && emp.status !== 'deactivated') ||
      (selectedStatus === 'Deactivated' && emp.status === 'deactivated');

    return matchesSearch && matchesDept && matchesStatus;
  });

  // Unique departments for filter dropdown
  const departmentsList = ['All', ...Array.from(new Set(employees.map((e) => e.department)))];

  // Stats
  const totalEmployees = employees.length;
  const activeCount = employees.filter((e) => e.status !== 'deactivated').length;
  const deactivatedCount = totalEmployees - activeCount;
  const totalMonthlyPayroll = employees
    .filter((e) => e.status !== 'deactivated')
    .reduce((acc, curr) => acc + curr.salary.netPay, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner & Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Employee Directory & Management</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage workforce accounts, designations, departments, salary bands, and account statuses.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600 hover:opacity-95 text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-blue-500/15 flex items-center space-x-2 shrink-0 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Employee</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Workforce</span>
          <p className="text-2xl font-black text-slate-900">{totalEmployees}</p>
          <p className="text-[11px] text-slate-500">{activeCount} Active &bull; {deactivatedCount} Deactivated</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Staff Ratio</span>
          <p className="text-2xl font-black text-emerald-600">
            {totalEmployees > 0 ? Math.round((activeCount / totalEmployees) * 100) : 0}%
          </p>
          <p className="text-[11px] text-slate-500">Authorized active portal logins</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Departments</span>
          <p className="text-2xl font-black text-indigo-900">{departmentsList.length - 1}</p>
          <p className="text-[11px] text-slate-500">Cross-functional enterprise teams</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Monthly Payroll Liability</span>
          <p className="text-2xl font-black text-blue-900">{formatCurrency(totalMonthlyPayroll, currency)}</p>
          <p className="text-[11px] text-slate-500">Net monthly disbursement</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, designation..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Dept:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold bg-slate-50 text-slate-800 outline-none"
            >
              {departmentsList.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold bg-slate-50 text-slate-800 outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Deactivated">Deactivated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-4">Employee</th>
                <th className="p-4">Role</th>
                <th className="p-4">Department & Designation</th>
                <th className="p-4">Joining Date</th>
                <th className="p-4">Basic Salary</th>
                <th className="p-4">Net Take-Home</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredEmployees.map((emp) => {
                const isDeactivated = emp.status === 'deactivated';
                return (
                  <tr
                    key={emp.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isDeactivated ? 'bg-slate-50/50 opacity-75' : ''
                    }`}
                  >
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={emp.avatar}
                          alt={emp.name}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-slate-900">{emp.name}</p>
                          <p className="text-[11px] text-slate-500">{emp.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase ${
                          emp.role === 'admin'
                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {emp.role === 'admin' ? (
                          <>
                            <ShieldCheck className="w-3 h-3 text-indigo-600" />
                            <span>Admin</span>
                          </>
                        ) : (
                          <span>Employee</span>
                        )}
                      </span>
                    </td>

                    <td className="p-4">
                      <p className="font-bold text-slate-800">{emp.designation}</p>
                      <p className="text-[11px] text-slate-500">{emp.department}</p>
                    </td>

                    <td className="p-4 text-slate-600 font-medium">
                      <div>Joined: {emp.joinDate || '2024-01-15'}</div>
                      {(() => {
                        const tenure = getEmploymentStatus(emp.joinDate);
                        return (
                          <div className="mt-1">
                            <span
                              className={`inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${tenure.badgeBg} ${tenure.badgeText} ${tenure.badgeBorder}`}
                            >
                              {tenure.status} ({tenure.monthsCompleted}m)
                            </span>
                          </div>
                        );
                      })()}
                      {emp.dob && (
                        <div className="text-[11px] text-amber-700 font-bold mt-1">
                          🎂 DOB: {new Date(emp.dob).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      )}
                    </td>

                    <td className="p-4 font-semibold text-slate-800">
                      {formatCurrency(emp.salary.basic, currency)}
                    </td>

                    <td className="p-4 font-black text-blue-900">
                      {formatCurrency(emp.salary.netPay, currency)}
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[10px] font-bold ${
                          isDeactivated
                            ? 'bg-rose-50 text-rose-700 border border-rose-200/80'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                        }`}
                      >
                        {isDeactivated ? (
                          <>
                            <UserX className="w-3 h-3 text-rose-600" />
                            <span>Deactivated</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3 h-3 text-emerald-600" />
                            <span>Active</span>
                          </>
                        )}
                      </span>
                    </td>

                    <td className="p-4 text-right space-x-2 shrink-0">
                      <button
                        onClick={() => handleOpenEditModal(emp)}
                        className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
                        title="Edit Employee Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onToggleEmployeeStatus(emp.id)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                          isDeactivated
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        {isDeactivated ? 'Activate' : 'Deactivate'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Employee Modal */}
      {(showAddModal || editingEmp) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingEmp ? 'Edit Employee Profile' : 'Add New Employee'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingEmp ? 'Update designation, email, and salary structure' : 'Register a new team member in VianERP'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Ananya Sharma"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Company Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ananya@vianinfo.com"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Department
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="HR & Operations">HR & Operations</option>
                    <option value="UI/UX & Product">UI/UX & Product</option>
                    <option value="Sales & CRM">Sales & CRM</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Executive Management">Executive Management</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="e.g. Senior Frontend Dev"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Joining Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.joiningDate}
                    onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Date of Birth (DOB)
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Basic Salary Component
                </label>
                <input
                  type="number"
                  required
                  min={10000}
                  step={1000}
                  value={formData.basicSalary}
                  onChange={(e) => setFormData({ ...formData, basicSalary: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Portal System Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    <option value="employee">Employee Portal Access</option>
                    <option value="admin">Admin Portal Full Access</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Bank Account Number
                  </label>
                  <input
                    type="text"
                    value={formData.bankAccount}
                    onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <p className="font-bold text-slate-800">Auto-Calculated Salary Breakdown Preview:</p>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <span>HRA (40%): {formatCurrency(Math.round(formData.basicSalary * 0.4), currency)}</span>
                  <span>Special (20%): {formatCurrency(Math.round(formData.basicSalary * 0.2), currency)}</span>
                  <span>PF (12%): {formatCurrency(Math.round(formData.basicSalary * 0.12), currency)}</span>
                  <span>Estimated Net: <strong className="text-blue-900">{formatCurrency(Math.round((formData.basicSalary * 1.6) - (formData.basicSalary * 0.22)), currency)}</strong></span>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm cursor-pointer"
                >
                  {editingEmp ? 'Save Changes' : 'Create Employee Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

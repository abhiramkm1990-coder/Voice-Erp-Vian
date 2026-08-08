import React, { useState } from 'react';
import { LeaveRequest, Employee } from '../../types';
import { CurrencyCode, formatCurrency } from '../../lib/currency';
import { CalendarDays, DollarSign, CheckCircle2, XCircle, Printer, Edit, X } from 'lucide-react';

interface LeavePayrollAdminProps {
  leaveRequests: LeaveRequest[];
  employees: Employee[];
  onApproveLeave: (leaveId: string, comment?: string) => void;
  onRejectLeave: (leaveId: string, comment?: string) => void;
  onUpdateSalary: (employeeId: string, newNetPay: number) => void;
  currency?: CurrencyCode;
}

export const LeavePayrollAdmin: React.FC<LeavePayrollAdminProps> = ({
  leaveRequests,
  employees,
  onApproveLeave,
  onRejectLeave,
  onUpdateSalary,
  currency = 'INR' as CurrencyCode,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'leaves' | 'payroll'>('leaves');
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [adminComment, setAdminComment] = useState('');

  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [newNetPayInput, setNewNetPayInput] = useState<number>(0);

  const pendingLeaves = leaveRequests.filter((l) => l.status === 'pending');

  const handleApprove = () => {
    if (!selectedLeave) return;
    onApproveLeave(selectedLeave.id, adminComment || 'Approved by Admin.');
    setSelectedLeave(null);
    setAdminComment('');
  };

  const handleReject = () => {
    if (!selectedLeave) return;
    onRejectLeave(selectedLeave.id, adminComment || 'Rejected due to project deadline priorities.');
    setSelectedLeave(null);
    setAdminComment('');
  };

  const handleSalarySave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;
    onUpdateSalary(editingEmployee.id, newNetPayInput);
    setEditingEmployee(null);
  };

  return (
    <div className="space-y-6">
      {/* Subtab Switcher Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Leave Approvals & Payroll Management</h2>
          <p className="text-xs text-slate-500 mt-1">Approve leaves & manage employee salary structures</p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => setActiveSubTab('leaves')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'leaves' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            Leave Approvals ({pendingLeaves.length})
          </button>
          <button
            onClick={() => setActiveSubTab('payroll')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'payroll' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            Payroll & Salaries
          </button>
        </div>
      </div>

      {/* Subtab 1: Leave Approvals */}
      {activeSubTab === 'leaves' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Pending Leave Applications</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="p-3">Employee</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Dates</th>
                  <th className="p-3">Total Days</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaveRequests.map((leave) => (
                  <tr key={leave.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900">{leave.employeeName}</td>
                    <td className="p-3 text-slate-700 font-semibold capitalize">{leave.leaveType} Leave</td>
                    <td className="p-3 text-slate-600">{leave.startDate} to {leave.endDate}</td>
                    <td className="p-3 font-bold text-slate-800">{leave.totalDays} Days</td>
                    <td className="p-3 text-slate-600 max-w-xs truncate">{leave.reason}</td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          leave.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : leave.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {leave.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      {leave.status === 'pending' ? (
                        <button
                          onClick={() => setSelectedLeave(leave)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-xl cursor-pointer"
                        >
                          Review & Action
                        </button>
                      ) : (
                        <span className="text-slate-400 italic">Action Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab 2: Payroll & Salary Management */}
      {activeSubTab === 'payroll' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Employee Payroll Directory</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="p-3">Employee</th>
                  <th className="p-3">Role / Department</th>
                  <th className="p-3">Basic Salary</th>
                  <th className="p-3">HRA + Allowances</th>
                  <th className="p-3">Deductions</th>
                  <th className="p-3">Net Take-Home Pay</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center space-x-2.5">
                        <img src={emp.avatar} alt={emp.name} className="w-7 h-7 rounded-lg object-cover" />
                        <div>
                          <p className="font-bold text-slate-900">{emp.name}</p>
                          <p className="text-[10px] text-slate-500">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <p className="font-semibold text-slate-800">{emp.designation}</p>
                      <p className="text-[10px] text-slate-500">{emp.department}</p>
                    </td>
                    <td className="p-3 font-semibold text-slate-700">{formatCurrency(emp.salary.basic, currency)}</td>
                    <td className="p-3 font-semibold text-emerald-700">
                      {formatCurrency(emp.salary.hra + emp.salary.specialAllowance, currency)}
                    </td>
                    <td className="p-3 font-semibold text-rose-700">
                      {formatCurrency(emp.salary.pf + emp.salary.tax, currency)}
                    </td>
                    <td className="p-3 font-black text-blue-900 text-sm">
                      {formatCurrency(emp.salary.netPay, currency)}
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => {
                          setEditingEmployee(emp);
                          setNewNetPayInput(emp.salary.netPay);
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-1.5 rounded-xl cursor-pointer"
                      >
                        Adjust Salary
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Modal for Leave Approval */}
      {selectedLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="text-base font-bold">Action Leave Request</h3>
              <button onClick={() => setSelectedLeave(null)} className="p-1 rounded text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="font-bold text-slate-800 text-sm">{selectedLeave.employeeName}</p>
              <p className="text-slate-600">
                Requesting <span className="font-bold">{selectedLeave.totalDays} Days</span> ({selectedLeave.leaveType} leave) from {selectedLeave.startDate} to {selectedLeave.endDate}.
              </p>
              <p className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700">
                Reason: "{selectedLeave.reason}"
              </p>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Admin Comment</label>
                <textarea
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  rows={2}
                  placeholder="e.g. Approved. Have a good break."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  onClick={handleReject}
                  className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-4 py-2 rounded-xl"
                >
                  Reject Request
                </button>
                <button
                  onClick={handleApprove}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl shadow-md"
                >
                  Approve Leave
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Salary Modal */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="text-base font-bold">Adjust Net Pay</h3>
              <button onClick={() => setEditingEmployee(null)} className="p-1 rounded text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalarySave} className="p-6 space-y-4 text-xs">
              <p className="font-bold text-slate-800">{editingEmployee.name} ({editingEmployee.designation})</p>

              <div>
                <label className="block font-bold text-slate-700 mb-1">New Monthly Net Pay (₹)</label>
                <input
                  type="number"
                  value={newNetPayInput}
                  onChange={(e) => setNewNetPayInput(Number(e.target.value))}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-sm text-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="bg-slate-100 text-slate-700 font-semibold px-4 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-xl shadow-md"
                >
                  Update Salary
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

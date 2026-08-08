import React, { useState } from 'react';
import { Employee, LeaveRequest } from '../../types';
import { CalendarDays, Plus, Clock, CheckCircle2, XCircle, FileText, X } from 'lucide-react';

interface LeaveHubProps {
  currentUser: Employee;
  leaveRequests: LeaveRequest[];
  onApplyLeave: (leave: Omit<LeaveRequest, 'id' | 'appliedDate' | 'status'>) => void;
}

export const LeaveHub: React.FC<LeaveHubProps> = ({
  currentUser,
  leaveRequests,
  onApplyLeave,
}) => {
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [leaveType, setLeaveType] = useState<'casual' | 'sick' | 'earned'>('casual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const myLeaves = leaveRequests.filter((l) => l.employeeId === currentUser.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason.trim()) {
      alert('Please complete all leave application fields.');
      return;
    }

    // Calculate total days roughly
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    onApplyLeave({
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      leaveType,
      startDate,
      endDate,
      totalDays,
      reason,
    });

    setStartDate('');
    setEndDate('');
    setReason('');
    setShowApplyModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Title & Apply Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Leave Management Hub</h2>
          <p className="text-xs text-slate-500 mt-1">Track leave quotas & submit leave applications</p>
        </div>
        <button
          onClick={() => setShowApplyModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-2xl transition-all cursor-pointer shadow-md shadow-blue-500/20 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Apply for Leave</span>
        </button>
      </div>

      {/* Leave Balance Quota Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Casual Leave */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase">Casual Leave (CL)</span>
          <p className="text-2xl font-black text-slate-900">
            {currentUser.leaveBalance.casual} <span className="text-xs font-normal text-slate-500">Days Left</span>
          </p>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full"
              style={{ width: `${(currentUser.leaveBalance.casual / 12) * 100}%` }}
            />
          </div>
        </div>

        {/* Sick Leave */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase">Sick Leave (SL)</span>
          <p className="text-2xl font-black text-slate-900">
            {currentUser.leaveBalance.sick} <span className="text-xs font-normal text-slate-500">Days Left</span>
          </p>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-teal-500 h-full rounded-full"
              style={{ width: `${(currentUser.leaveBalance.sick / 6) * 100}%` }}
            />
          </div>
        </div>

        {/* Earned Leave */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase">Earned Leave (EL)</span>
          <p className="text-2xl font-black text-slate-900">
            {currentUser.leaveBalance.earned} <span className="text-xs font-normal text-slate-500">Days Left</span>
          </p>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-purple-600 h-full rounded-full"
              style={{ width: `${(currentUser.leaveBalance.earned / 12) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Leave Application History Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">My Leave History</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <th className="p-3">Applied On</th>
                <th className="p-3">Type</th>
                <th className="p-3">Dates</th>
                <th className="p-3">Total Days</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Status</th>
                <th className="p-3">Admin Comment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {myLeaves.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    No leave requests recorded yet.
                  </td>
                </tr>
              ) : (
                myLeaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 text-slate-600">{leave.appliedDate}</td>
                    <td className="p-3 font-semibold text-slate-800 capitalize">
                      {leave.leaveType} Leave
                    </td>
                    <td className="p-3 text-slate-700">
                      {leave.startDate} to {leave.endDate}
                    </td>
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
                    <td className="p-3 text-slate-500 italic">
                      {leave.adminComment || 'None'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CalendarDays className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold">Submit Leave Application</h3>
              </div>
              <button
                onClick={() => setShowApplyModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Leave Type</label>
                <select
                  value={leaveType}
                  onChange={(e: any) => setLeaveType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 outline-hidden"
                >
                  <option value="casual">Casual Leave (Balance: {currentUser.leaveBalance.casual})</option>
                  <option value="sick">Sick Leave (Balance: {currentUser.leaveBalance.sick})</option>
                  <option value="earned">Earned Leave (Balance: {currentUser.leaveBalance.earned})</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Leave</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  rows={3}
                  placeholder="State the reason for leave application..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-xl shadow-md cursor-pointer"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

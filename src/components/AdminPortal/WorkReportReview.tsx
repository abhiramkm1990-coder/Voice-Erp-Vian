import React, { useState } from 'react';
import { WorkReport, Employee } from '../../types';
import { FileText, CheckCircle2, Clock, AlertTriangle, Send, Search, Filter, X } from 'lucide-react';

interface WorkReportReviewProps {
  reports: WorkReport[];
  employees: Employee[];
  onReviewReport: (reportId: string, reviewerNote: string) => void;
  onSendReminder: (employeeName: string) => void;
}

export const WorkReportReview: React.FC<WorkReportReviewProps> = ({
  reports,
  employees,
  onReviewReport,
  onSendReminder,
}) => {
  const [selectedReport, setSelectedReport] = useState<WorkReport | null>(null);
  const [reviewerNote, setReviewerNote] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredReports = reports.filter((r) => {
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchesSearch = r.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.summary.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingEmployees = reports
    .filter((r) => r.status === 'pending')
    .map((r) => r.employeeName);

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;
    onReviewReport(selectedReport.id, reviewerNote || 'Reviewed and approved by Admin.');
    setSelectedReport(null);
    setReviewerNote('');
  };

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Work Report Review Portal</h2>
          <p className="text-xs text-slate-500 mt-1">Audit daily submitted work reports & track pending task logs</p>
        </div>

        {pendingEmployees.length > 0 && (
          <button
            onClick={() => {
              pendingEmployees.forEach((name) => onSendReminder(name));
              alert(`Sent automated reminders to ${pendingEmployees.join(', ')}!`);
            }}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-2xl transition-all cursor-pointer shadow-md shadow-amber-500/20 flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>Send Reminder to Pending ({pendingEmployees.length})</span>
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search employee or task summary..."
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 outline-hidden text-xs w-full sm:w-64"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-600">Status:</span>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold ${
                filterStatus === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1 rounded-lg text-xs font-bold ${
                filterStatus === 'pending' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-500'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilterStatus('submitted')}
              className={`px-3 py-1 rounded-lg text-xs font-bold ${
                filterStatus === 'submitted' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500'
              }`}
            >
              Submitted
            </button>
          </div>
        </div>
      </div>

      {/* Work Reports Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <th className="p-3">Employee</th>
                <th className="p-3">Date</th>
                <th className="p-3">Summary</th>
                <th className="p-3">Hours Logged</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReports.map((rep) => (
                <tr key={rep.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 font-bold text-slate-900">{rep.employeeName}</td>
                  <td className="p-3 text-slate-600">{rep.date}</td>
                  <td className="p-3 text-slate-700 max-w-sm truncate">{rep.summary}</td>
                  <td className="p-3 font-bold text-slate-800">{rep.hoursLogged} hrs</td>
                  <td className="p-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        rep.status === 'reviewed'
                          ? 'bg-purple-100 text-purple-800'
                          : rep.status === 'submitted'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {rep.status}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <button
                      onClick={() => setSelectedReport(rep)}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                    >
                      Audit & Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit & Review Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Review Work Report</h3>
                <p className="text-xs text-slate-400">{selectedReport.employeeName} &bull; {selectedReport.date}</p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <span className="font-bold text-slate-500 uppercase block mb-1">Work Summary:</span>
                <p className="bg-slate-50 p-3 rounded-xl text-slate-800 font-medium border border-slate-200">
                  {selectedReport.summary}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-500 uppercase block mb-1">Detailed Tasks Breakdown:</span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {selectedReport.tasks.map((t, idx) => (
                    <div key={idx} className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex justify-between">
                      <span className="font-medium text-slate-800">{t.description} ({t.project})</span>
                      <span className="font-bold text-blue-600">{t.hours} hrs</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reviewer Feedback / Note</label>
                <textarea
                  value={reviewerNote}
                  onChange={(e) => setReviewerNote(e.target.value)}
                  rows={3}
                  placeholder="e.g. Approved. Excellent progress on WAI endpoint architecture."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-xl"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-5 py-2 rounded-xl shadow-md"
                >
                  Mark as Reviewed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

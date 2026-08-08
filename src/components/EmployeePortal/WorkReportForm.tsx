import React, { useState } from 'react';
import { Employee, WorkReport, WorkTaskItem, Project } from '../../types';
import { FileText, Plus, Trash2, CheckCircle2, Clock, Send } from 'lucide-react';

interface WorkReportFormProps {
  currentUser: Employee;
  projects: Project[];
  existingReports: WorkReport[];
  onSubmitReport: (report: Omit<WorkReport, 'id' | 'status'>) => void;
}

export const WorkReportForm: React.FC<WorkReportFormProps> = ({
  currentUser,
  projects,
  existingReports,
  onSubmitReport,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [summary, setSummary] = useState('');
  const [tasks, setTasks] = useState<WorkTaskItem[]>([
    {
      id: 't-1',
      description: '',
      hours: 4.0,
      project: projects[0]?.name || 'VianERP Platform',
      status: 'completed',
    },
  ]);

  const myReports = existingReports.filter((r) => r.employeeId === currentUser.id);
  const todayReport = myReports.find((r) => r.date === todayStr);

  const handleAddTask = () => {
    setTasks((prev) => [
      ...prev,
      {
        id: `t-${Date.now()}`,
        description: '',
        hours: 2.0,
        project: projects[0]?.name || 'VianERP Platform',
        status: 'completed',
      },
    ]);
  };

  const handleRemoveTask = (id: string) => {
    if (tasks.length === 1) return;
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleTaskChange = (id: string, field: keyof WorkTaskItem, value: any) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) {
      alert('Please provide a overall summary for today\'s work.');
      return;
    }

    const totalHours = tasks.reduce((acc, t) => acc + Number(t.hours || 0), 0);

    onSubmitReport({
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      date: todayStr,
      summary,
      hoursLogged: totalHours,
      tasks,
      submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    alert('Work report submitted successfully to Admin Portal!');
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Daily Work Report Portal</h2>
          <p className="text-xs text-slate-500 mt-1">Submit end-of-day task breakdowns & project billing hours</p>
        </div>
        {todayReport && (
          <div className="flex items-center space-x-1.5 bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-xl text-xs font-bold uppercase">
            <CheckCircle2 className="w-4 h-4" />
            <span>Today's Report Submitted ({todayReport.submittedAt})</span>
          </div>
        )}
      </div>

      {/* Main Form */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
        <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
          Work Report Submission for Today ({todayStr})
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* Summary Input */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Work Summary & Highlights
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              required
              placeholder="Provide a concise summary of tasks accomplished today..."
              className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl p-3 text-xs outline-hidden text-slate-800"
            />
          </div>

          {/* Task Line Items Header */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 uppercase tracking-wider">
                Detailed Task Breakdown
              </label>
              <button
                type="button"
                onClick={handleAddTask}
                className="bg-slate-100 hover:bg-slate-200 text-blue-700 font-bold px-3 py-1.5 rounded-xl cursor-pointer flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task Row</span>
              </button>
            </div>

            {/* Task Rows */}
            <div className="space-y-3">
              {tasks.map((task, idx) => (
                <div
                  key={task.id}
                  className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
                >
                  <div className="md:col-span-5">
                    <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">
                      Task Description #{idx + 1}
                    </label>
                    <input
                      type="text"
                      value={task.description}
                      onChange={(e) => handleTaskChange(task.id, 'description', e.target.value)}
                      required
                      placeholder="e.g. Implemented WAI Voice Web Speech API hook"
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 outline-hidden font-medium text-slate-800"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">
                      Linked Project
                    </label>
                    <select
                      value={task.project}
                      onChange={(e) => handleTaskChange(task.id, 'project', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 outline-hidden font-medium text-slate-800"
                    >
                      {projects.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">
                      Hours Logged
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="12"
                      value={task.hours}
                      onChange={(e) => handleTaskChange(task.id, 'hours', parseFloat(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 outline-hidden font-medium text-slate-800"
                    />
                  </div>

                  <div className="md:col-span-2 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveTask(task.id)}
                      disabled={tasks.length === 1}
                      className="p-2 text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <p className="text-slate-500 font-medium">
              Total Hours: <span className="font-bold text-slate-900">{tasks.reduce((a, b) => a + Number(b.hours || 0), 0)} Hours</span>
            </p>
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs px-6 py-2.5 rounded-2xl transition-all cursor-pointer shadow-md shadow-blue-500/20 flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Submit Work Report</span>
            </button>
          </div>
        </form>
      </div>

      {/* Submission History */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Work Report Submission History</h3>

        <div className="space-y-3">
          {myReports.map((rep) => (
            <div
              key={rep.id}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-900">{rep.date}</span>
                  <span className="text-slate-400">&bull;</span>
                  <span className="text-slate-500">{rep.hoursLogged} Hours Logged</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    rep.status === 'reviewed'
                      ? 'bg-purple-100 text-purple-800'
                      : rep.status === 'submitted'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {rep.status}
                </span>
              </div>
              <p className="text-slate-700 leading-relaxed">{rep.summary}</p>
              {rep.reviewerNote && (
                <p className="text-[11px] text-purple-700 bg-purple-50 p-2 rounded-xl border border-purple-100">
                  💬 <span className="font-semibold">Reviewer Note:</span> {rep.reviewerNote}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

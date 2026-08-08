import React from 'react';
import { Employee, AttendanceRecord, WorkReport, LeaveRequest, CRMLead, Project } from '../../types';
import { CurrencyCode, formatCurrency } from '../../lib/currency';
import {
  Users,
  Clock,
  FileText,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Coffee,
  CheckCircle2,
  PieChart,
  BarChart2,
  Layers,
  Coins,
  Megaphone,
  Cake,
  Gift,
} from 'lucide-react';

interface AdminOverviewProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  workReports: WorkReport[];
  leaveRequests: LeaveRequest[];
  crmLeads: CRMLead[];
  projects: Project[];
  onNavigateTab: (tabId: string) => void;
  onOpenAnnouncementsModal?: () => void;
  currency?: CurrencyCode;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({
  employees,
  attendance,
  workReports,
  leaveRequests,
  crmLeads,
  projects,
  onNavigateTab,
  onOpenAnnouncementsModal,
  currency = 'INR' as CurrencyCode,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const presentCount = attendance.filter(
    (a) => a.date === todayStr && (a.status === 'present' || a.status === 'on_break')
  ).length;

  const onBreakCount = attendance.filter((a) => a.date === todayStr && a.status === 'on_break').length;

  const pendingReportsCount = workReports.filter(
    (r) => r.date === todayStr && r.status === 'pending'
  ).length;

  const pendingLeavesCount = leaveRequests.filter((l) => l.status === 'pending').length;

  const totalCrmPipeline = crmLeads.reduce((a, b) => a + b.value, 0);
  const totalWonDeals = crmLeads
    .filter((l) => l.stage === 'won')
    .reduce((a, b) => a + b.value, 0);

  const activeBreaks = attendance.filter((a) => a.date === todayStr && a.status === 'on_break');

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentMonthName = now.toLocaleString('en-US', { month: 'long' });

  const upcomingBirthdays = employees
    .filter((e) => {
      if (!e.dob || e.status === 'deactivated') return false;
      const dobDate = new Date(e.dob);
      return dobDate.getMonth() === currentMonth;
    })
    .map((e) => {
      const dobDate = new Date(e.dob!);
      return {
        ...e,
        day: dobDate.getDate(),
        formattedDob: dobDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      };
    })
    .sort((a, b) => a.day - b.day);

  return (
    <div className="space-y-6">
      {/* Admin Title Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Enterprise Operations Command</h1>
            <span className="bg-blue-500/20 text-blue-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-500/30">
              Admin View
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time workforce attendance, work report compliance, payroll & CRM metrics
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {onOpenAnnouncementsModal && (
            <button
              onClick={onOpenAnnouncementsModal}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-2xl transition-all cursor-pointer shadow-md flex items-center space-x-1.5"
            >
              <Megaphone className="w-4 h-4" />
              <span>Post Announcement</span>
            </button>
          )}
          <button
            onClick={() => onNavigateTab('admin_reports')}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-2xl transition-all cursor-pointer shadow-md shadow-blue-500/20"
          >
            Review Work Reports ({pendingReportsCount})
          </button>
          <button
            onClick={() => onNavigateTab('admin_crm_projects')}
            className="bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2.5 rounded-2xl transition-all cursor-pointer backdrop-blur-md border border-white/10"
          >
            CRM Kanban Pipeline
          </button>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Attendance Today */}
        <div
          onClick={() => onNavigateTab('admin_overview')}
          className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-3 cursor-pointer group hover:border-blue-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Present Today</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/60">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {presentCount} / {employees.length} <span className="text-xs font-semibold text-slate-500">Employees</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Active Breaks: <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">{onBreakCount} On Break</span>
            </p>
          </div>
        </div>

        {/* Card 2: Work Reports Review Queue */}
        <div
          onClick={() => onNavigateTab('admin_reports')}
          className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-3 cursor-pointer group hover:border-blue-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Work Reports</span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/60">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {pendingReportsCount} <span className="text-xs font-semibold text-slate-500">Awaiting Review</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              <span className="font-semibold text-slate-700">{workReports.length - pendingReportsCount}</span> Reports Submitted
            </p>
          </div>
        </div>

        {/* Card 3: Pending Leaves */}
        <div
          onClick={() => onNavigateTab('admin_leave_payroll')}
          className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-3 cursor-pointer group hover:border-blue-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Leave Applications</span>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-800 border border-purple-200/60">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {pendingLeavesCount} <span className="text-xs font-semibold text-slate-500">Pending</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">Approval required by management</p>
          </div>
        </div>

        {/* Card 4: CRM Pipeline Value */}
        <div
          onClick={() => onNavigateTab('admin_crm_projects')}
          className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-3 cursor-pointer group hover:border-blue-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">CRM Lead Pipeline</span>
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-800 border border-teal-200/60">
              <Coins className="w-4 h-4 text-teal-600" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {formatCurrency(totalCrmPipeline, currency)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Closed Won: <span className="font-bold text-emerald-600">{formatCurrency(totalWonDeals, currency)}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Section: Attendance & Active Breaks + Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Breaks & Attendance Monitor (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                <Coffee className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Live Active Breaks & Presence Feed</h3>
            </div>
            <span className="text-xs font-bold text-slate-400">{todayStr}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Active Breaks List */}
            <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/60 space-y-3">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block">
                Employees Currently On Break ({activeBreaks.length})
              </span>
              {activeBreaks.length === 0 ? (
                <p className="text-xs text-slate-500 py-2">No employees currently on break.</p>
              ) : (
                activeBreaks.map((a) => (
                  <div key={a.id} className="bg-white p-3 rounded-xl border border-amber-200/80 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{a.employeeName}</p>
                      <p className="text-[10px] text-slate-500">
                        Break started: {a.breakLogs[a.breakLogs.length - 1]?.startTime || '12:45 PM'}
                      </p>
                    </div>
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
                      On Break
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Attendance Quick Matrix */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-2 text-xs">
              <span className="font-bold text-slate-800 uppercase tracking-wider block">
                Staff Status Overview
              </span>
              <div className="space-y-1.5 pt-1">
                {attendance.map((att) => (
                  <div key={att.id} className="flex items-center justify-between py-1 border-b border-slate-200/40 last:border-0">
                    <span className="font-semibold text-slate-800">{att.employeeName}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      att.status === 'present' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {att.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Birthdays & Budget Distribution */}
        <div className="space-y-6">
          {/* Upcoming Birthdays This Month Card */}
          <div className="bg-gradient-to-br from-amber-500/10 via-pink-500/5 to-purple-500/10 rounded-3xl p-5 border border-amber-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-amber-200/50">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-bold shadow-xs">
                  <Cake className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Upcoming Birthdays</h3>
                  <p className="text-[11px] text-slate-500">{currentMonthName} Celebrations</p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300/80">
                {upcomingBirthdays.length} This Month
              </span>
            </div>

            <div className="space-y-2">
              {upcomingBirthdays.length === 0 ? (
                <p className="text-xs text-slate-500 py-2">No upcoming employee birthdays in {currentMonthName}.</p>
              ) : (
                upcomingBirthdays.map((b) => (
                  <div
                    key={b.id}
                    className="bg-white/90 backdrop-blur-xs p-2.5 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-2 text-xs shadow-xs hover:border-amber-300 transition-all"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <img
                        src={b.avatar}
                        alt={b.name}
                        className="w-8 h-8 rounded-full object-cover border border-amber-300 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{b.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{b.designation}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center space-x-1 bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-lg border border-amber-200">
                        <Gift className="w-3 h-3 text-amber-600" />
                        <span>{b.formattedDob}</span>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Visual Analytics Chart Widget */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <BarChart2 className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Project Budget Distribution</h3>
            </div>

            <div className="space-y-4 text-xs">
              {projects.map((proj) => {
                const spentPct = Math.round((proj.spentBudget / proj.budget) * 100);
                return (
                  <div key={proj.id} className="space-y-1">
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-800 font-bold">{proj.name}</span>
                      <span className="text-slate-500">${proj.spentBudget.toLocaleString()} / ${proj.budget.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          spentPct > 80 ? 'bg-amber-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${Math.min(spentPct, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Employee, AttendanceRecord, Announcement, WorkReport } from '../../types';
import { CurrencyCode, formatCurrency } from '../../lib/currency';
import {
  Clock,
  CalendarDays,
  FileText,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Megaphone,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Coffee,
} from 'lucide-react';

interface EmployeeDashboardProps {
  currentUser: Employee;
  todayAttendance?: AttendanceRecord;
  todayWorkReport?: WorkReport;
  announcements: Announcement[];
  onNavigateTab: (tabId: string) => void;
  onOpenWai: () => void;
  onOpenPayslipPdf?: () => void;
  currency?: CurrencyCode;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  currentUser,
  todayAttendance,
  todayWorkReport,
  announcements,
  onNavigateTab,
  onOpenWai,
  onOpenPayslipPdf,
  currency = 'INR' as CurrencyCode,
}) => {
  const isClockedIn = todayAttendance && todayAttendance.status !== 'absent';
  const isOnBreak = todayAttendance?.status === 'on_break';

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-blue-500/10 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-16 h-16 rounded-2xl object-cover ring-4 ring-white/30 shadow-md"
            />
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Welcome back, {currentUser.name}! 👋
                </h1>
                <span className="bg-white/20 text-xs px-2.5 py-0.5 rounded-full font-medium">
                  {currentUser.department}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-blue-100 mt-1">
                {currentUser.designation} &bull; Vianinfo Enterprise Member
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateTab('attendance')}
              className="bg-white text-blue-800 hover:bg-blue-50 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-md flex items-center space-x-2"
            >
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Attendance Portal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Status Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Punch Status */}
        <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Today's Attendance</span>
            <div className={`p-2.5 rounded-xl ${isClockedIn ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-slate-100 text-slate-500'}`}>
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">
              {todayAttendance ? todayAttendance.clockIn : 'Not Punched In'}
            </p>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span>Status:</span>
              <span className={`font-bold px-2 py-0.5 rounded-md text-[11px] capitalize ${isOnBreak ? 'bg-amber-50 text-amber-700 border border-amber-200/60' : isClockedIn ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-slate-100 text-slate-500'}`}>
                {todayAttendance?.status?.replace('_', ' ') || 'Pending'}
              </span>
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('attendance')}
            className="w-full text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center justify-between pt-2.5 border-t border-slate-100 cursor-pointer group"
          >
            <span>Clock In / Out Controls</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Card 2: Daily Work Report Status */}
        <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Daily Work Report</span>
            <div className={`p-2.5 rounded-xl ${todayWorkReport?.status === 'submitted' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-amber-50 text-amber-700 border border-amber-200/60'}`}>
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900 tracking-tight capitalize">
              {todayWorkReport?.status || 'Pending Submission'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Hours logged today: <span className="font-bold text-slate-800">{todayWorkReport?.hoursLogged || 0} hrs</span>
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('work_report')}
            className="w-full text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center justify-between pt-2.5 border-t border-slate-100 cursor-pointer group"
          >
            <span>{todayWorkReport?.status === 'submitted' ? 'View Submitted Report' : 'Submit Report Now'}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Card 3: Leave Balance */}
        <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Leave Balances</span>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200/60">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">
              {currentUser.leaveBalance.casual + currentUser.leaveBalance.sick + currentUser.leaveBalance.earned} Days
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Casual: <span className="font-semibold text-slate-700">{currentUser.leaveBalance.casual}</span> | Sick: <span className="font-semibold text-slate-700">{currentUser.leaveBalance.sick}</span> | Earned: <span className="font-semibold text-slate-700">{currentUser.leaveBalance.earned}</span>
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('leaves')}
            className="w-full text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center justify-between pt-2.5 border-t border-slate-100 cursor-pointer group"
          >
            <span>Apply for Leave</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Card 4: Net Salary Overview */}
        <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Monthly Net Pay</span>
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700 border border-teal-200/60">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">
              {formatCurrency(currentUser.salary.netPay, currency)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Account: <span className="font-mono text-slate-700 font-medium">{currentUser.salary.bankAccount}</span>
            </p>
          </div>
          <button
            onClick={() => {
              if (onOpenPayslipPdf) {
                onOpenPayslipPdf();
              } else {
                onNavigateTab('payslip');
              }
            }}
            className="w-full text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center justify-between pt-2.5 border-t border-slate-100 cursor-pointer group"
          >
            <span>Download Payslip PDF</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Main Bottom Section: Announcements & Quick Workflow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Announcements (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                <Megaphone className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Company Announcements</h3>
                <p className="text-[11px] text-slate-500">Official Vianinfo Solutions Bulletins</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {announcements.map((a) => (
              <div
                key={a.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 hover:border-slate-300 transition-colors space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{a.title}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      a.priority === 'urgent'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {a.priority.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{a.content}</p>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Posted by: {a.author}</span>
                  <span>{a.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Portal Actions */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                <CalendarDays className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Quick Portal Actions</h3>
                <p className="text-[11px] text-slate-500">Employee Workspace Shortcuts</p>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => onNavigateTab('attendance')}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/60 hover:border-blue-200 transition-all text-left cursor-pointer group"
              >
                <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">Clock In / Out Attendance</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => onNavigateTab('leaves')}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/60 hover:border-blue-200 transition-all text-left cursor-pointer group"
              >
                <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">Apply for Time-off / Leave</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => onNavigateTab('work_report')}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/60 hover:border-blue-200 transition-all text-left cursor-pointer group"
              >
                <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">Submit Daily Work Report</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => {
                  if (onOpenPayslipPdf) {
                    onOpenPayslipPdf();
                  } else {
                    onNavigateTab('payslip');
                  }
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/60 hover:border-blue-200 transition-all text-left cursor-pointer group"
              >
                <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">View Salary Slip & Payslips</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>VianERP &bull; Enterprise</span>
            <span className="font-semibold text-emerald-600">Portal Synced</span>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Employee, UserRole } from '../types';
import { CurrencyCode, CURRENCIES } from '../lib/currency';
import {
  Mic,
  Bell,
  Settings,
  User,
  CheckCircle,
  ChevronDown,
  Sparkles,
  LayoutDashboard,
  Clock,
  CalendarDays,
  FileText,
  Briefcase,
  Users,
  PieChart,
  Layers,
  LogOut,
  Coins,
  LifeBuoy,
} from 'lucide-react';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  currentUser: Employee;
  allEmployees: Employee[];
  onUserSelect: (employee: Employee) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenWai: () => void;
  onOpenNotifications: () => void;
  onOpenSettings: () => void;
  unreadNotificationsCount: number;
  currency: CurrencyCode;
  onCurrencyChange: (currency: CurrencyCode) => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  currentUser,
  allEmployees,
  onUserSelect,
  activeTab,
  onTabChange,
  onOpenWai,
  onOpenNotifications,
  onOpenSettings,
  unreadNotificationsCount,
  currency,
  onCurrencyChange,
  onLogout,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);

  // Navigation tabs depending on active role
  const employeeTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'leaves', label: 'Leave Hub', icon: CalendarDays },
    { id: 'work_report', label: 'Daily Work Report', icon: FileText },
    { id: 'tickets', label: 'My Support Tickets', icon: LifeBuoy },
    { id: 'profile', label: 'My Profile & Contacts', icon: User },
    { id: 'payslip', label: 'Payslips', icon: Briefcase },
  ];

  const itSupportTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'leaves', label: 'Leave Hub', icon: CalendarDays },
    { id: 'work_report', label: 'Daily Work Report', icon: FileText },
    { id: 'tickets', label: 'IT Helpdesk Console', icon: LifeBuoy },
    { id: 'profile', label: 'My Profile & Contacts', icon: User },
    { id: 'payslip', label: 'Payslips', icon: Briefcase },
  ];

  const adminTabs = [
    { id: 'admin_overview', label: 'Enterprise Overview', icon: PieChart },
    { id: 'admin_employees', label: 'Manage Employees', icon: Users },
    { id: 'admin_reports', label: 'Work Report Review', icon: FileText },
    { id: 'admin_leave_payroll', label: 'Leaves & Payroll', icon: CalendarDays },
    { id: 'admin_tickets', label: 'Support Tickets', icon: LifeBuoy },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'admin_crm_projects', label: 'CRM & Projects', icon: Layers },
  ];

  const currentTabs =
    currentRole === 'admin'
      ? adminTabs
      : currentRole === 'it_support'
      ? itSupportTabs
      : employeeTabs;

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
      {/* Top Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white font-black text-xl shadow-md shadow-blue-500/20 ring-1 ring-white/30">
              V
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-slate-900 text-lg tracking-tight">VianERP</span>
                <span className={`border text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  currentRole === 'admin' 
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                    : currentRole === 'it_support'
                    ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {currentRole === 'admin' ? 'Admin Suite' : currentRole === 'it_support' ? 'IT Support Console' : 'Employee Portal'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Vianinfo Solutions</p>
            </div>
          </div>

          {/* Center: WAI AI Assistant Launcher */}
          <div className="hidden md:flex items-center space-x-4">
            {/* WAI AI Launcher Button */}
            <button
              onClick={onOpenWai}
              className="flex items-center space-x-2 bg-gradient-to-r from-teal-500 via-cyan-600 to-blue-600 hover:opacity-95 text-white px-4 py-2 rounded-2xl font-semibold text-xs shadow-md shadow-cyan-500/15 transition-all cursor-pointer group hover:scale-[1.02]"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-200 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              <Mic className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
              <span>Ask Vian Voice AI</span>
            </button>
          </div>

          {/* Right Actions: Notifications, Settings & User Profile Switcher */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Vian Mobile button */}
            <button
              onClick={onOpenWai}
              className="md:hidden p-2 rounded-lg text-teal-600 hover:bg-teal-50 border border-teal-200"
              title="Vian Voice AI"
            >
              <Sparkles className="w-5 h-5" />
            </button>

            {/* Notifications Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Settings */}
            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Settings & Supabase Integration"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Multi-Currency Switcher dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowCurrencyMenu(!showCurrencyMenu)}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                title="Change Application Currency"
              >
                <Coins className="w-3.5 h-3.5 text-amber-600" />
                <span>{CURRENCIES[currency].symbol} {currency}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showCurrencyMenu && (
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1.5 border-b border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Select Currency
                    </p>
                  </div>
                  {Object.values(CURRENCIES).map((c) => (
                    <button
                      key={c.code}
                      onClick={() => {
                        onCurrencyChange(c.code);
                        setShowCurrencyMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium hover:bg-slate-50 transition-colors text-left ${
                        currency === c.code ? 'bg-amber-50/80 font-bold text-amber-800' : 'text-slate-700'
                      }`}
                    >
                      <span className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 w-4">{c.symbol}</span>
                        <span>{c.code}</span>
                      </span>
                      <span className="text-[10px] text-slate-400">{c.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Profile Selector Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 transition-all cursor-pointer"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-200"
                />
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-semibold text-slate-800 leading-tight">
                    {currentUser.name}
                  </p>
                  <p className="text-[10px] text-slate-500 capitalize">{currentUser.role}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User Selector & Sign Out Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-slate-100 space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Active Session Profile
                    </p>
                    <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-500 font-medium">{currentUser.email}</p>
                  </div>

                  {(currentRole === 'admin' || currentRole === 'it_support' || true) && (
                    <div className="max-h-56 overflow-y-auto py-1 border-b border-slate-100">
                      <p className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase">
                        Switch Active Account / Role
                      </p>
                      {allEmployees.map((emp) => (
                        <button
                          key={emp.id}
                          onClick={() => {
                            onUserSelect(emp);
                            onRoleChange(emp.role);
                            setShowUserMenu(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-1.5 text-xs hover:bg-slate-50 transition-colors text-left ${
                            currentUser.id === emp.id ? 'bg-blue-50/70 font-semibold text-blue-700' : 'text-slate-700'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <img
                              src={emp.avatar}
                              alt={emp.name}
                              className="w-6 h-6 rounded-md object-cover"
                            />
                            <span className="truncate max-w-[110px]">{emp.name}</span>
                          </div>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                              emp.role === 'admin'
                                ? 'bg-purple-100 text-purple-700'
                                : emp.role === 'it_support'
                                ? 'bg-cyan-100 text-cyan-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {emp.role === 'it_support' ? 'IT Support' : emp.role}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {onLogout && (
                    <div className="p-1 pt-2">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onLogout();
                        }}
                        className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer border border-rose-200/60"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-600" />
                        <span>Sign Out / Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Header Bar */}
      <div className="bg-slate-50/90 border-t border-slate-200/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-2">
          {currentTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-blue-700 shadow-sm border border-slate-200/90 ring-1 ring-blue-500/10'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80 hover:border-slate-200/60 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

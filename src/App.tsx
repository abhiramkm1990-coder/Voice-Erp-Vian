/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, Mic } from 'lucide-react';
import {
  UserRole,
  Employee,
  AttendanceRecord,
  WorkReport,
  LeaveRequest,
  Project,
  CRMLead,
  Announcement,
  AppNotification,
  CRMStage,
  SupportTicket,
  TicketStatus,
} from './types';
import {
  INITIAL_EMPLOYEES,
  INITIAL_ATTENDANCE,
  INITIAL_WORK_REPORTS,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_PROJECTS,
  INITIAL_CRM_LEADS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_TICKETS,
} from './data/mockData';

import { Header } from './components/Header';
import { CurrencyCode } from './lib/currency';
import { Footer } from './components/Footer';
import { WaiAssistantModal } from './components/WaiAssistantModal';
import { SettingsModal } from './components/SettingsModal';
import { NotificationsModal } from './components/NotificationsModal';
import { LoginPage } from './components/LoginPage';

// Employee Portal Components
import { EmployeeDashboard } from './components/EmployeePortal/EmployeeDashboard';
import { AttendanceTracker } from './components/EmployeePortal/AttendanceTracker';
import { LeaveHub } from './components/EmployeePortal/LeaveHub';
import { PayslipPortal } from './components/EmployeePortal/PayslipPortal';
import { WorkReportForm } from './components/EmployeePortal/WorkReportForm';

// Admin Portal Components
import { AdminOverview } from './components/AdminPortal/AdminOverview';
import { WorkReportReview } from './components/AdminPortal/WorkReportReview';
import { LeavePayrollAdmin } from './components/AdminPortal/LeavePayrollAdmin';
import { CrmProjectHub } from './components/AdminPortal/CrmProjectHub';
import { EmployeeManagement } from './components/AdminPortal/EmployeeManagement';

// New Support, Profile & Announcement Components
import { HelpDeskTickets } from './components/Ticketing/HelpDeskTickets';
import { EmployeeProfileSelfService } from './components/Profile/EmployeeProfileSelfService';
import { AnnouncementManagerModal } from './components/Announcements/AnnouncementManagerModal';

export default function App() {
  // Primary State
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [currentUser, setCurrentUser] = useState<Employee>(INITIAL_EMPLOYEES[0]); // Default Vyshak
  const [currentRole, setCurrentRole] = useState<UserRole>('admin');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const [activeTab, setActiveTab] = useState<string>('admin_overview');

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE);
  const [workReports, setWorkReports] = useState<WorkReport[]>(INITIAL_WORK_REPORTS);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(INITIAL_LEAVE_REQUESTS);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [crmLeads, setCrmLeads] = useState<CRMLead[]>(INITIAL_CRM_LEADS);
  const [announcements, setAnnouncements] = useState<Announcement[]>(INITIAL_ANNOUNCEMENTS);
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_TICKETS);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);

  // Modals state
  const [isWaiOpen, setIsWaiOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [autoOpenPayslipPdf, setAutoOpenPayslipPdf] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  // Reset autoOpenPayslipPdf when changing tabs manually
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab !== 'payslip') {
      setAutoOpenPayslipPdf(false);
    }
  };

  const handleOpenPayslipPdf = () => {
    setActiveTab('payslip');
    setAutoOpenPayslipPdf(true);
  };

  // Load Gemini key if stored
  useEffect(() => {
    const storedKey = localStorage.getItem('GEMINI_API_KEY');
    if (storedKey) setGeminiApiKey(storedKey);
  }, []);

  const handleSaveGeminiApiKey = (key: string) => {
    setGeminiApiKey(key);
    localStorage.setItem('GEMINI_API_KEY', key);
  };

  // Switch Current User Profile
  const handleSelectUser = (emp: Employee) => {
    setCurrentUser(emp);
    setCurrentRole(emp.role);
    if (emp.role === 'admin') {
      setActiveTab('admin_overview');
    } else {
      setActiveTab('dashboard');
    }
  };

  // Employee Management Handlers
  const handleAddEmployee = (newEmpData: Omit<Employee, 'id'>) => {
    const newEmp: Employee = {
      ...newEmpData,
      id: `EMP-${String(employees.length + 1).padStart(3, '0')}`,
    };
    setEmployees((prev) => [...prev, newEmp]);
  };

  const handleUpdateEmployee = (updatedEmp: Employee) => {
    setEmployees((prev) =>
      prev.map((emp) => (emp.id === updatedEmp.id ? updatedEmp : emp))
    );
    if (currentUser.id === updatedEmp.id) {
      setCurrentUser(updatedEmp);
    }
  };

  const handleToggleEmployeeStatus = (empId: string) => {
    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id === empId) {
          const newStatus = emp.status === 'deactivated' ? 'active' : 'deactivated';
          return { ...emp, status: newStatus };
        }
        return emp;
      })
    );
  };

  // Auth Handlers
  const handleLogin = (emp: Employee) => {
    setCurrentUser(emp);
    setCurrentRole(emp.role);
    setIsAuthenticated(true);
    if (emp.role === 'admin') {
      setActiveTab('admin_overview');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  // Get Today's attendance for current user
  const todayUserAttendance = attendance.find(
    (a) => a.employeeId === currentUser.id && a.date === todayStr
  );

  const todayUserWorkReport = workReports.find(
    (r) => r.employeeId === currentUser.id && r.date === todayStr
  );

  // Attendance Handlers
  const handlePunchIn = () => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (todayUserAttendance) {
      setAttendance((prev) =>
        prev.map((a) =>
          a.id === todayUserAttendance.id
            ? { ...a, clockIn: timeNow, status: 'present' }
            : a
        )
      );
    } else {
      const newRec: AttendanceRecord = {
        id: `att-${Date.now()}`,
        employeeId: currentUser.id,
        employeeName: currentUser.name,
        date: todayStr,
        clockIn: timeNow,
        breakTimeMinutes: 0,
        status: 'present',
        breakLogs: [],
      };
      setAttendance((prev) => [newRec, ...prev]);
    }
  };

  const handlePunchOut = () => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setAttendance((prev) =>
      prev.map((a) =>
        a.employeeId === currentUser.id && a.date === todayStr
          ? { ...a, clockOut: timeNow, status: 'absent' }
          : a
      )
    );
  };

  const handleStartBreak = () => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setAttendance((prev) =>
      prev.map((a) => {
        if (a.employeeId === currentUser.id && a.date === todayStr) {
          return {
            ...a,
            status: 'on_break',
            breakLogs: [...a.breakLogs, { id: `b-${Date.now()}`, startTime: timeNow }],
          };
        }
        return a;
      })
    );
  };

  const handleEndBreak = () => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setAttendance((prev) =>
      prev.map((a) => {
        if (a.employeeId === currentUser.id && a.date === todayStr) {
          const updatedLogs = a.breakLogs.map((log, idx) => {
            if (idx === a.breakLogs.length - 1 && !log.endTime) {
              return { ...log, endTime: timeNow, durationMinutes: 15 };
            }
            return log;
          });
          return {
            ...a,
            status: 'present',
            breakTimeMinutes: a.breakTimeMinutes + 15,
            breakLogs: updatedLogs,
          };
        }
        return a;
      })
    );
  };

  // Leave Handlers
  const handleApplyLeave = (leaveData: Omit<LeaveRequest, 'id' | 'appliedDate' | 'status'>) => {
    const newLeave: LeaveRequest = {
      ...leaveData,
      id: `lr-${Date.now()}`,
      appliedDate: todayStr,
      status: 'pending',
    };
    setLeaveRequests((prev) => [newLeave, ...prev]);

    // Push notification to admin
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: 'New Leave Request',
        message: `${currentUser.name} requested ${leaveData.totalDays} day(s) of ${leaveData.leaveType} leave.`,
        timestamp: 'Just now',
        type: 'info',
        read: false,
        linkTab: 'admin_leave_payroll',
      },
      ...prev,
    ]);

    alert('Leave application submitted successfully!');
  };

  const handleApproveLeave = (leaveId: string, comment?: string) => {
    const leaveToApprove = leaveRequests.find((l) => l.id === leaveId);

    setLeaveRequests((prev) =>
      prev.map((l) => (l.id === leaveId ? { ...l, status: 'approved', adminComment: comment } : l))
    );

    if (leaveToApprove && leaveToApprove.status === 'pending') {
      const empId = leaveToApprove.employeeId;
      const lType = leaveToApprove.leaveType;
      const days = leaveToApprove.totalDays;

      setEmployees((prev) =>
        prev.map((emp) => {
          if (emp.id === empId) {
            const currentBal = emp.leaveBalance[lType] || 0;
            return {
              ...emp,
              leaveBalance: {
                ...emp.leaveBalance,
                [lType]: Math.max(0, currentBal - days),
              },
            };
          }
          return emp;
        })
      );

      if (currentUser.id === empId) {
        setCurrentUser((prev) => ({
          ...prev,
          leaveBalance: {
            ...prev.leaveBalance,
            [lType]: Math.max(0, (prev.leaveBalance[lType] || 0) - days),
          },
        }));
      }
    }
  };

  const handleRejectLeave = (leaveId: string, comment?: string) => {
    setLeaveRequests((prev) =>
      prev.map((l) => (l.id === leaveId ? { ...l, status: 'rejected', adminComment: comment } : l))
    );
  };

  // Support Ticket Handlers
  const handleCreateTicket = (ticketData: Omit<SupportTicket, 'id' | 'createdAt' | 'status'>) => {
    const newTicket: SupportTicket = {
      ...ticketData,
      id: `TICK-${Math.floor(100 + Math.random() * 900)}`,
      createdAt: todayStr,
      status: 'open',
    };

    setTickets((prev) => [newTicket, ...prev]);

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: 'New Support Ticket',
        message: `${ticketData.employeeName} submitted a ${ticketData.priority} priority ${ticketData.category} ticket.`,
        timestamp: 'Just now',
        type: 'info',
        read: false,
        linkTab: 'admin_tickets',
      },
      ...prev,
    ]);
  };

  const handleUpdateTicketStatus = (
    ticketId: string,
    newStatus: TicketStatus,
    adminResponse?: string,
    assignedTo?: string
  ) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: newStatus,
              adminResponse: adminResponse !== undefined ? adminResponse : t.adminResponse,
              assignedTo: assignedTo !== undefined ? assignedTo : t.assignedTo,
            }
          : t
      )
    );
  };

  // Announcement Handlers
  const handlePostAnnouncement = (ancData: Omit<Announcement, 'id' | 'date'>) => {
    const newAnc: Announcement = {
      ...ancData,
      id: `anc-${Date.now()}`,
      date: todayStr,
    };

    setAnnouncements((prev) => [newAnc, ...prev]);

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: 'New Announcement Posted',
        message: `${ancData.title} by ${ancData.author}`,
        timestamp: 'Just now',
        type: 'info',
        read: false,
      },
      ...prev,
    ]);
  };

  const handleDeleteAnnouncement = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  };

  // Work Report Submission & Review
  const handleSubmitWorkReport = (reportData: Omit<WorkReport, 'id' | 'status'>) => {
    const newRep: WorkReport = {
      ...reportData,
      id: `wr-${Date.now()}`,
      status: 'submitted',
    };
    setWorkReports((prev) => [newRep, ...prev.filter((r) => r.id !== todayUserWorkReport?.id)]);
  };

  const handleReviewWorkReport = (reportId: string, reviewerNote: string) => {
    setWorkReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status: 'reviewed', reviewerNote } : r))
    );
  };

  const handleSendReminder = (employeeName: string) => {
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: 'Work Report Reminder Sent',
        message: `Automated reminder dispatched to ${employeeName}.`,
        timestamp: 'Just now',
        type: 'warning',
        read: false,
      },
      ...prev,
    ]);
  };

  // CRM Handlers
  const handleUpdateLeadStage = (leadId: string, newStage: CRMStage) => {
    setCrmLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, stage: newStage, updatedAt: todayStr } : l))
    );
  };

  const handleAddLead = (leadData: Omit<CRMLead, 'id' | 'updatedAt'>) => {
    const newLead: CRMLead = {
      ...leadData,
      id: `lead-${Date.now()}`,
      updatedAt: todayStr,
    };
    setCrmLeads((prev) => [newLead, ...prev]);
  };

  // Salary Handler
  const handleUpdateSalary = (employeeId: string, newNetPay: number) => {
    setEmployees((prev) =>
      prev.map((e) =>
        e.id === employeeId ? { ...e, salary: { ...e.salary, netPay: newNetPay } } : e
      )
    );
    alert('Employee salary updated successfully!');
  };

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  if (!isAuthenticated) {
    return <LoginPage employees={employees} onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 font-sans flex flex-col selection:bg-blue-200">
      {/* Header with Role Navigation & WAI AI Assistant Launcher */}
      <Header
        currentRole={currentRole}
        onRoleChange={(role) => setCurrentRole(role)}
        currentUser={currentUser}
        allEmployees={employees}
        onUserSelect={handleSelectUser}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onOpenWai={() => setIsWaiOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        unreadNotificationsCount={unreadNotifsCount}
        currency={currency}
        onCurrencyChange={setCurrency}
        onLogout={handleLogout}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* EMPLOYEE & IT SUPPORT PORTAL VIEWS */}
        {(currentRole === 'employee' || currentRole === 'it_support') && (
          <>
            {activeTab === 'dashboard' && (
              <EmployeeDashboard
                currentUser={currentUser}
                todayAttendance={todayUserAttendance}
                todayWorkReport={todayUserWorkReport}
                announcements={announcements}
                onNavigateTab={handleTabChange}
                onOpenWai={() => setIsWaiOpen(true)}
                onOpenPayslipPdf={handleOpenPayslipPdf}
                currency={currency}
              />
            )}

            {activeTab === 'attendance' && (
              <AttendanceTracker
                currentUser={currentUser}
                todayAttendance={todayUserAttendance}
                onPunchIn={handlePunchIn}
                onPunchOut={handlePunchOut}
                onStartBreak={handleStartBreak}
                onEndBreak={handleEndBreak}
                allAttendanceLogs={attendance}
              />
            )}

            {activeTab === 'leaves' && (
              <LeaveHub
                currentUser={currentUser}
                leaveRequests={leaveRequests}
                onApplyLeave={handleApplyLeave}
              />
            )}

            {activeTab === 'payslip' && (
              <PayslipPortal
                currentUser={currentUser}
                autoOpenPdf={autoOpenPayslipPdf}
                currency={currency}
              />
            )}

            {activeTab === 'work_report' && (
              <WorkReportForm
                currentUser={currentUser}
                projects={projects}
                existingReports={workReports}
                onSubmitReport={handleSubmitWorkReport}
              />
            )}

            {activeTab === 'tickets' && (
              <HelpDeskTickets
                tickets={tickets}
                currentUser={currentUser}
                currentRole={currentRole}
                allEmployees={employees}
                onCreateTicket={handleCreateTicket}
                onUpdateTicketStatus={handleUpdateTicketStatus}
              />
            )}

            {activeTab === 'profile' && (
              <EmployeeProfileSelfService
                currentUser={currentUser}
                onUpdateProfile={handleUpdateEmployee}
                isAdmin={false}
              />
            )}
          </>
        )}

        {/* ADMIN PORTAL VIEWS */}
        {currentRole === 'admin' && (
          <>
            {activeTab === 'admin_overview' && (
              <AdminOverview
                employees={employees}
                attendance={attendance}
                workReports={workReports}
                leaveRequests={leaveRequests}
                crmLeads={crmLeads}
                projects={projects}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onOpenAnnouncementsModal={() => setIsAnnouncementModalOpen(true)}
                currency={currency}
              />
            )}

            {activeTab === 'admin_employees' && (
              <EmployeeManagement
                employees={employees}
                onAddEmployee={handleAddEmployee}
                onUpdateEmployee={handleUpdateEmployee}
                onToggleEmployeeStatus={handleToggleEmployeeStatus}
                currency={currency}
              />
            )}

            {activeTab === 'admin_reports' && (
              <WorkReportReview
                reports={workReports}
                employees={employees}
                onReviewReport={handleReviewWorkReport}
                onSendReminder={handleSendReminder}
              />
            )}

            {activeTab === 'admin_leave_payroll' && (
              <LeavePayrollAdmin
                leaveRequests={leaveRequests}
                employees={employees}
                onApproveLeave={handleApproveLeave}
                onRejectLeave={handleRejectLeave}
                onUpdateSalary={handleUpdateSalary}
                currency={currency}
              />
            )}

            {activeTab === 'admin_tickets' && (
              <HelpDeskTickets
                tickets={tickets}
                currentUser={currentUser}
                currentRole={currentRole}
                allEmployees={employees}
                onCreateTicket={handleCreateTicket}
                onUpdateTicketStatus={handleUpdateTicketStatus}
              />
            )}

            {activeTab === 'profile' && (
              <EmployeeProfileSelfService
                currentUser={currentUser}
                onUpdateProfile={handleUpdateEmployee}
                isAdmin={true}
              />
            )}

            {activeTab === 'admin_crm_projects' && (
              <CrmProjectHub
                crmLeads={crmLeads}
                projects={projects}
                employees={employees}
                onUpdateLeadStage={handleUpdateLeadStage}
                onAddLead={handleAddLead}
                currency={currency}
              />
            )}
          </>
        )}
      </main>

      {/* Footer featuring Vianinfo Solutions */}
      <Footer onOpenSettings={() => setIsSettingsOpen(true)} />

      {/* Floating WAI Voice Assistant Trigger Button (Consistently Accessible in Admin & Employee Views at Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center">
        <button
          id="wai-floating-trigger-btn"
          onClick={() => setIsWaiOpen(true)}
          className="group flex items-center space-x-2.5 bg-gradient-to-r from-teal-500 via-cyan-600 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white px-4 py-3 rounded-2xl shadow-xl shadow-cyan-500/25 border border-white/20 transition-all hover:scale-105 active:scale-95 cursor-pointer ring-2 ring-cyan-400/30"
          title="Open Vian Voice AI Assistant"
        >
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-200 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-300"></span>
          </div>
          <Sparkles className="w-4 h-4 text-cyan-200 animate-pulse" />
          <span className="text-xs font-extrabold tracking-wide hidden sm:inline">Vian Voice AI</span>
        </button>
      </div>

      {/* WAI Multilingual Voice AI Assistant Modal */}
      <WaiAssistantModal
        isOpen={isWaiOpen}
        onClose={() => setIsWaiOpen(false)}
        currentUser={currentUser}
        employees={employees}
        attendance={attendance}
        workReports={workReports}
        leaveRequests={leaveRequests}
        projects={projects}
        crmLeads={crmLeads}
        tickets={tickets}
        geminiApiKey={geminiApiKey}
        onOpenSettings={() => {
          setIsWaiOpen(false);
          setIsSettingsOpen(true);
        }}
      />

      {/* Settings & Supabase Schema Exporter Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        geminiApiKey={geminiApiKey}
        onSaveGeminiApiKey={handleSaveGeminiApiKey}
      />

      {/* Notifications Drawer */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllRead={() =>
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        }
        onNavigateTab={(tab) => setActiveTab(tab)}
      />

      {/* Announcement Manager Bulletin Modal */}
      <AnnouncementManagerModal
        isOpen={isAnnouncementModalOpen}
        onClose={() => setIsAnnouncementModalOpen(false)}
        announcements={announcements}
        currentUser={currentUser}
        onPostAnnouncement={handlePostAnnouncement}
        onDeleteAnnouncement={handleDeleteAnnouncement}
      />
    </div>
  );
}

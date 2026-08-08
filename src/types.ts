export type UserRole = 'admin' | 'employee' | 'it_support';

export interface SalaryBreakup {
  basic: number;
  hra: number;
  specialAllowance: number;
  pf: number;
  tax: number;
  netPay: number;
  bankAccount: string;
  panNumber: string;
}

export interface LeaveBalance {
  casual: number;
  sick: number;
  earned: number;
  totalAllowed: number;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  designation: string;
  department: string;
  phone: string;
  joinDate: string;
  avatar: string;
  status: 'active' | 'on_leave' | 'remote' | 'deactivated';
  salary: SalaryBreakup;
  leaveBalance: LeaveBalance;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  personalEmail?: string;
  bloodGroup?: string;
  dob?: string; // YYYY-MM-DD format
}

export type TicketPriority = 'low' | 'medium' | 'high';
export type TicketCategory = 'IT' | 'HR' | 'Asset' | 'General';
export type TicketStatus = 'open' | 'in_progress' | 'resolved';

export interface SupportTicket {
  id: string;
  employeeId: string;
  employeeName: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  description: string;
  status: TicketStatus;
  createdAt: string;
  adminResponse?: string;
  assignedTo?: string;
}

export interface BreakLog {
  id: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  clockIn: string; // e.g., "09:00 AM"
  clockOut?: string; // e.g., "06:00 PM"
  breakTimeMinutes: number;
  status: 'present' | 'absent' | 'on_break' | 'late';
  breakLogs: BreakLog[];
}

export interface WorkTaskItem {
  id: string;
  description: string;
  hours: number;
  project: string;
  status: 'completed' | 'in_progress' | 'blocked';
}

export interface WorkReport {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  tasks: WorkTaskItem[];
  summary: string;
  hoursLogged: number;
  status: 'submitted' | 'pending' | 'reviewed';
  reviewerNote?: string;
  submittedAt?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: 'casual' | 'sick' | 'earned';
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedDate: string;
  adminComment?: string;
}

export interface Project {
  id: string;
  name: string;
  clientName: string;
  budget: number;
  status: 'planning' | 'in_progress' | 'on_hold' | 'completed';
  progressPercentage: number;
  leadEmployeeId: string;
  teamMemberIds: string[];
  deadline: string;
  description: string;
  spentBudget: number;
}

export type CRMStage = 'new' | 'qualified' | 'proposal' | 'won' | 'lost';

export interface CRMLead {
  id: string;
  title: string;
  clientName: string;
  company: string;
  email: string;
  phone: string;
  stage: CRMStage;
  value: number;
  priority: 'low' | 'medium' | 'high';
  notes: string;
  assignedEmployeeId: string;
  updatedAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  priority: 'normal' | 'urgent';
}

export type WAILanguage = 'en' | 'ml' | 'hi';

export interface WAIQueryResponse {
  answer: string;
  language: WAILanguage;
  contextType: 'attendance' | 'work_reports' | 'projects' | 'crm' | 'leaves' | 'payroll' | 'general';
  actionSuggested?: string;
  timestamp: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'info' | 'warning' | 'success';
  read: boolean;
  linkTab?: string;
}

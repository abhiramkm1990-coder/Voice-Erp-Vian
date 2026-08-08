import React, { useState } from 'react';
import { SupportTicket, TicketCategory, TicketPriority, TicketStatus, Employee, UserRole } from '../../types';
import {
  LifeBuoy,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  UserCheck,
  Send,
  X,
  Tag,
  ShieldAlert,
  ChevronRight,
  FileText,
} from 'lucide-react';

interface HelpDeskTicketsProps {
  tickets: SupportTicket[];
  currentUser: Employee;
  currentRole: UserRole;
  allEmployees: Employee[];
  onCreateTicket: (ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'status'>) => void;
  onUpdateTicketStatus: (
    ticketId: string,
    newStatus: TicketStatus,
    adminResponse?: string,
    assignedTo?: string
  ) => void;
}

export const HelpDeskTickets: React.FC<HelpDeskTicketsProps> = ({
  tickets,
  currentUser,
  currentRole,
  allEmployees,
  onCreateTicket,
  onUpdateTicketStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicketForAdmin, setSelectedTicketForAdmin] = useState<SupportTicket | null>(null);

  // New Ticket Form
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<TicketCategory>('IT');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [description, setDescription] = useState('');

  // Admin Response Form
  const [adminReply, setAdminReply] = useState('');
  const [adminStatus, setAdminStatus] = useState<TicketStatus>('in_progress');
  const [adminAssignee, setAdminAssignee] = useState('');

  // Check if current user or active role has admin/IT management privileges
  const isAdminOrIT =
    currentRole === 'admin' ||
    currentRole === 'it_support' ||
    currentUser.role === 'admin' ||
    currentUser.role === 'it_support';

  // Filter tickets based on user role and filters
  const displayedTickets = tickets.filter((t) => {
    // Regular employees see ONLY their own tickets created by themselves
    if (!isAdminOrIT && t.employeeId !== currentUser.id) {
      return false;
    }

    const matchesSearch =
      t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || t.status === selectedStatus;
    const matchesPriority = selectedPriority === 'all' || t.priority === selectedPriority;

    return matchesSearch && matchesCategory && matchesStatus && matchesPriority;
  });

  // Handle create
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    onCreateTicket({
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      subject: subject.trim(),
      category,
      priority,
      description: description.trim(),
    });

    setSubject('');
    setDescription('');
    setCategory('IT');
    setPriority('medium');
    setShowCreateModal(false);
  };

  // Open Admin Action Modal
  const openAdminModal = (ticket: SupportTicket) => {
    setSelectedTicketForAdmin(ticket);
    setAdminReply(ticket.adminResponse || '');
    setAdminStatus(ticket.status);
    setAdminAssignee(ticket.assignedTo || `${currentUser.name} (${currentUser.role === 'it_support' ? 'IT Support' : 'Admin'})`);
  };

  const handleAdminUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketForAdmin) return;

    onUpdateTicketStatus(
      selectedTicketForAdmin.id,
      adminStatus,
      adminReply.trim() || undefined,
      adminAssignee || undefined
    );

    setSelectedTicketForAdmin(null);
  };

  // Metrics (Scoped to personal tickets for employees, org-wide for Admin/IT)
  const scopedTickets = isAdminOrIT ? tickets : tickets.filter((t) => t.employeeId === currentUser.id);
  const openCount = scopedTickets.filter((t) => t.status === 'open').length;
  const inProgressCount = scopedTickets.filter((t) => t.status === 'in_progress').length;
  const resolvedCount = scopedTickets.filter((t) => t.status === 'resolved').length;

  const getPriorityBadge = (p: TicketPriority) => {
    switch (p) {
      case 'high':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-100 text-rose-700 border border-rose-200">High Priority</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-700 border border-amber-200">Medium</span>;
      case 'low':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">Low</span>;
    }
  };

  const getCategoryBadge = (c: TicketCategory) => {
    switch (c) {
      case 'IT':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">IT & Infrastructure</span>;
      case 'HR':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">HR & Policy</span>;
      case 'Asset':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Hardware Asset</span>;
      case 'General':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">General Request</span>;
    }
  };

  const getStatusBadge = (s: TicketStatus) => {
    switch (s) {
      case 'open':
        return (
          <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
            <Clock className="w-3 h-3" />
            <span>Open Ticket</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
            <AlertCircle className="w-3 h-3 animate-pulse" />
            <span>In Progress</span>
          </span>
        );
      case 'resolved':
        return (
          <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <CheckCircle2 className="w-3 h-3" />
            <span>Resolved</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-2xl bg-indigo-50 text-indigo-600">
              <LifeBuoy className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                {isAdminOrIT ? 'Enterprise IT & HR Help Desk Console' : 'My Support Requests & Help Desk'}
              </h1>
              <p className="text-xs text-slate-500">
                {isAdminOrIT
                  ? 'Review, assign, and resolve internal IT, HR, and Asset support tickets across the organization'
                  : 'Submit support requests, track resolution status, and manage your tickets'}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Submit Support Ticket</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {isAdminOrIT ? 'Open Tickets' : 'My Open Tickets'}
            </p>
            <p className="text-2xl font-black text-amber-600 mt-1">{openCount}</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {isAdminOrIT ? 'In Progress' : 'My In Progress'}
            </p>
            <p className="text-2xl font-black text-blue-600 mt-1">{inProgressCount}</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {isAdminOrIT ? 'Resolved Tickets' : 'My Resolved'}
            </p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{resolvedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search bar */}
          <div className="relative md:col-span-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by subject, description, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white outline-hidden font-medium"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-700 outline-hidden"
            >
              <option value="all">All Categories</option>
              <option value="IT">IT & Infrastructure</option>
              <option value="HR">HR & Policy</option>
              <option value="Asset">Hardware Asset</option>
              <option value="General">General Request</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-700 outline-hidden"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-700 outline-hidden"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {displayedTickets.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <LifeBuoy className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">No support tickets found</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {currentRole === 'employee'
                ? 'You have not submitted any support tickets yet or none match your filters.'
                : 'No tickets match the selected filters in the Help Desk queue.'}
            </p>
          </div>
        ) : (
          displayedTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-xs font-bold text-slate-400">{ticket.id}</span>
                  {getCategoryBadge(ticket.category)}
                  {getPriorityBadge(ticket.priority)}
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-[11px] text-slate-400 font-medium">Created: {ticket.createdAt}</span>
                  {getStatusBadge(ticket.status)}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900">{ticket.subject}</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  {ticket.description}
                </p>
              </div>

              {/* Employee & Admin Footer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="flex items-center space-x-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">Requested by:</span>
                  <span className="font-bold text-blue-700">{ticket.employeeName}</span>
                  {ticket.assignedTo && (
                    <span className="text-[11px] bg-slate-100 px-2 py-0.5 rounded-md font-medium text-slate-600">
                      Assigned to: {ticket.assignedTo}
                    </span>
                  )}
                </div>

                {/* Admin & IT Action Button */}
                {isAdminOrIT && (
                  <button
                    onClick={() => openAdminModal(ticket)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer self-end"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                    <span>Manage / Respond Ticket</span>
                  </button>
                )}
              </div>

              {/* Resolution / Admin Response Callout */}
              {ticket.adminResponse && (
                <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3 text-xs space-y-1">
                  <div className="flex items-center space-x-1.5 text-emerald-800 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Official Response / Resolution Note:</span>
                  </div>
                  <p className="text-emerald-900 leading-relaxed font-medium pl-5">{ticket.adminResponse}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* CREATE TICKET MODAL FOR EMPLOYEES */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Submit New Support Ticket</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Subject / Summary *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Need VPN setup for remote work / Monitor display glitch"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TicketCategory)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 outline-hidden"
                  >
                    <option value="IT">IT & Infrastructure</option>
                    <option value="HR">HR & Payroll Policy</option>
                    <option value="Asset">Hardware Asset</option>
                    <option value="General">General Request</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TicketPriority)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 outline-hidden"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Detailed Description *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe your issue or request in detail so IT/HR can assist quickly..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-2xl shadow-md shadow-blue-500/20 cursor-pointer transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Ticket</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN TICKET ACTION MODAL */}
      {selectedTicketForAdmin && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-mono text-xs font-bold text-slate-400">{selectedTicketForAdmin.id}</span>
                <h3 className="text-base font-bold text-slate-900">Manage Ticket Resolution</h3>
              </div>
              <button
                onClick={() => setSelectedTicketForAdmin(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">{selectedTicketForAdmin.subject}</span>
                <span className="text-[11px] font-medium text-blue-600">
                  By {selectedTicketForAdmin.employeeName}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{selectedTicketForAdmin.description}</p>
            </div>

            <form onSubmit={handleAdminUpdateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Update Status</label>
                  <select
                    value={adminStatus}
                    onChange={(e) => setAdminStatus(e.target.value as TicketStatus)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 outline-hidden"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Assign Support Staff</label>
                  <select
                    value={adminAssignee}
                    onChange={(e) => setAdminAssignee(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 outline-hidden"
                  >
                    {allEmployees
                      .filter((e) => e.role === 'admin' || e.role === 'it_support' || e.department.toLowerCase().includes('it'))
                      .map((emp) => (
                        <option key={emp.id} value={`${emp.name} (${emp.role === 'it_support' ? 'IT Lead' : emp.department})`}>
                          {emp.name} ({emp.designation})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Official Response / Resolution Note
                </label>
                <textarea
                  rows={4}
                  placeholder="Enter response or steps taken to resolve this ticket..."
                  value={adminReply}
                  onChange={(e) => setAdminReply(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedTicketForAdmin(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-2xl shadow-md cursor-pointer transition-all"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Save Status & Response</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

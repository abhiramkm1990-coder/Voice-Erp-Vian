import React, { useState } from 'react';
import { CRMLead, CRMStage, Project, Employee } from '../../types';
import { CurrencyCode, formatCurrency } from '../../lib/currency';
import { Layers, Plus, DollarSign, ArrowRight, UserCheck, CheckCircle2, TrendingUp, X } from 'lucide-react';

interface CrmProjectHubProps {
  crmLeads: CRMLead[];
  projects: Project[];
  employees: Employee[];
  onUpdateLeadStage: (leadId: string, newStage: CRMStage) => void;
  onAddLead: (lead: Omit<CRMLead, 'id' | 'updatedAt'>) => void;
  currency?: CurrencyCode;
}

export const CrmProjectHub: React.FC<CrmProjectHubProps> = ({
  crmLeads,
  projects,
  employees,
  onUpdateLeadStage,
  onAddLead,
  currency = 'INR' as CurrencyCode,
}) => {
  const [activeTab, setActiveTab] = useState<'crm' | 'projects'>('crm');
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);

  // New Lead State
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [value, setValue] = useState(25000);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('high');
  const [notes, setNotes] = useState('');
  const [assignedEmployeeId, setAssignedEmployeeId] = useState(employees[0]?.id || '');

  const stages: { key: CRMStage; title: string; color: string }[] = [
    { key: 'new', title: 'New Leads', color: 'border-blue-400 bg-blue-50/50' },
    { key: 'qualified', title: 'Qualified', color: 'border-teal-400 bg-teal-50/50' },
    { key: 'proposal', title: 'Proposal Sent', color: 'border-amber-400 bg-amber-50/50' },
    { key: 'won', title: 'Closed Won 🎉', color: 'border-emerald-400 bg-emerald-50/50' },
    { key: 'lost', title: 'Closed Lost', color: 'border-slate-300 bg-slate-100/50' },
  ];

  const totalPipeline = crmLeads.reduce((a, b) => a + b.value, 0);

  const handleAddLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !clientName.trim()) {
      alert('Please fill in title and client name.');
      return;
    }

    onAddLead({
      title,
      clientName,
      company,
      email,
      phone,
      stage: 'new',
      value: Number(value),
      priority,
      notes,
      assignedEmployeeId: assignedEmployeeId || employees[0]?.id || 'emp-rahul',
    });

    setTitle('');
    setClientName('');
    setCompany('');
    setEmail('');
    setPhone('');
    setValue(25000);
    setNotes('');
    setShowAddLeadModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">CRM Sales Pipeline & Project Management</h2>
          <p className="text-xs text-slate-500 mt-1">Kanban lead flows & active enterprise deliverables</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('crm')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'crm' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              CRM Pipeline ({formatCurrency(totalPipeline, currency)})
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'projects' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Active Projects ({projects.length})
            </button>
          </div>

          {activeTab === 'crm' && (
            <button
              onClick={() => setShowAddLeadModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-2xl cursor-pointer shadow-md shadow-blue-500/20 flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Lead</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: CRM Interactive Kanban Pipeline */}
      {activeTab === 'crm' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {stages.map((stg) => {
            const stageLeads = crmLeads.filter((l) => l.stage === stg.key);
            const stageValue = stageLeads.reduce((a, b) => a + b.value, 0);

            return (
              <div
                key={stg.key}
                className={`rounded-3xl p-4 border-t-4 ${stg.color} border-slate-200 bg-white/80 backdrop-blur-xs shadow-xs space-y-3 flex flex-col min-w-[240px]`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-800">{stg.title}</h3>
                  <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {stageLeads.length}
                  </span>
                </div>

                <p className="text-xs font-extrabold text-blue-900">
                  {formatCurrency(stageValue, currency)}
                </p>

                {/* Lead Cards */}
                <div className="space-y-3 flex-1">
                  {stageLeads.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-[11px] italic">No leads in stage</div>
                  ) : (
                    stageLeads.map((lead) => {
                      const assignedEmp = employees.find((e) => e.id === lead.assignedEmployeeId);
                      return (
                        <div
                          key={lead.id}
                          className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-2 text-xs"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="font-bold text-slate-900 leading-tight">{lead.title}</h4>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                                lead.priority === 'high'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {lead.priority}
                            </span>
                          </div>

                          <p className="text-slate-600 font-semibold">{lead.clientName} &bull; {lead.company}</p>
                          <p className="text-sm font-black text-emerald-700">{formatCurrency(lead.value, currency)}</p>

                          {assignedEmp && (
                            <div className="flex items-center space-x-1.5 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                              <img src={assignedEmp.avatar} alt={assignedEmp.name} className="w-5 h-5 rounded-full" />
                              <span>Lead: {assignedEmp.name}</span>
                            </div>
                          )}

                          {/* Stage Transition Selector */}
                          <div className="pt-2 border-t border-slate-100">
                            <select
                              value={lead.stage}
                              onChange={(e) => onUpdateLeadStage(lead.id, e.target.value as CRMStage)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1 text-[10px] font-bold text-slate-700 outline-hidden"
                            >
                              <option value="new">Stage: New</option>
                              <option value="qualified">Stage: Qualified</option>
                              <option value="proposal">Stage: Proposal</option>
                              <option value="won">Stage: Closed Won</option>
                              <option value="lost">Stage: Closed Lost</option>
                            </select>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Projects Directory */}
      {activeTab === 'projects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((proj) => {
            const leadEmp = employees.find((e) => e.id === proj.leadEmployeeId);
            return (
              <div
                key={proj.id}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{proj.name}</h3>
                    <p className="text-xs text-slate-500">{proj.clientName}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      proj.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : proj.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {proj.status.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{proj.description}</p>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600">Completion Progress</span>
                    <span className="text-blue-700">{proj.progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-teal-500 h-full rounded-full"
                      style={{ width: `${proj.progressPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Budget vs Spent & Lead */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block">Project Budget:</span>
                    <span className="font-bold text-slate-900">{formatCurrency(proj.budget, currency)}</span>
                  </div>
                  {leadEmp && (
                    <div className="flex items-center space-x-2 text-right">
                      <img src={leadEmp.avatar} alt={leadEmp.name} className="w-7 h-7 rounded-lg object-cover" />
                      <div>
                        <span className="text-slate-400 text-[10px] block">Lead Architect:</span>
                        <span className="font-bold text-slate-800">{leadEmp.name}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Lead Modal */}
      {showAddLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="text-base font-bold">Add New CRM Lead</h3>
              <button onClick={() => setShowAddLeadModal(false)} className="p-1 rounded text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddLeadSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Deal / Lead Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. Enterprise Cloud ERP Expansion"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Client Name</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    required
                    placeholder="e.g. Rajesh Nair"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Company</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Malabar Logistics"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estimated Value ($)</label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Employee</label>
                  <select
                    value={assignedEmployeeId}
                    onChange={(e) => setAssignedEmployeeId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium outline-hidden"
                  >
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name} ({e.designation})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deal Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Notes on client requirements..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddLeadModal(false)}
                  className="bg-slate-100 text-slate-700 font-semibold px-4 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-xl shadow-md"
                >
                  Create Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import {
  Employee,
  AttendanceRecord,
  WorkReport,
  LeaveRequest,
  Project,
  CRMLead,
  SupportTicket,
  WAILanguage,
  WAIQueryResponse,
} from '../types';

export interface EnterpriseState {
  employees: Employee[];
  attendance: AttendanceRecord[];
  workReports: WorkReport[];
  leaveRequests: LeaveRequest[];
  projects: Project[];
  crmLeads: CRMLead[];
  currentUser: Employee;
  tickets?: SupportTicket[];
}

// Detect query language if auto-detecting
export const detectQueryLanguage = (text: string): WAILanguage => {
  // Malayalam Unicode range check: \u0D00-\u0D7F
  if (/[\u0D00-\u0D7F]/.test(text)) return 'ml';
  // Devanagari (Hindi) Unicode range check: \u0900-\u097F
  if (/[\u0900-\u097F]/.test(text)) return 'hi';
  return 'en';
};

export const processLocalWAIQuery = (
  queryText: string,
  state: EnterpriseState,
  preferredLang?: WAILanguage
): WAIQueryResponse => {
  const query = queryText.toLowerCase().trim();
  const lang = preferredLang || detectQueryLanguage(queryText);
  const today = new Date().toISOString().split('T')[0];
  const user = state.currentUser;
  const isEmployee = user.role === 'employee';

  // 0. Employment Status / Probationary Queries
  if (
    query.includes('probation') ||
    query.includes('probationary') ||
    query.includes('permanent') ||
    query.includes('tenure') ||
    query.includes('പ്രൊബേഷൻ') ||
    query.includes('പെർമനന്റ്') ||
    query.includes('ജോയിനിംഗ്')
  ) {
    const probationList: string[] = [];
    const permanentList: string[] = [];

    state.employees.forEach((emp) => {
      let months = 12;
      if (emp.joinDate) {
        const join = new Date(emp.joinDate);
        const now = new Date();
        months = (now.getFullYear() - join.getFullYear()) * 12 + (now.getMonth() - join.getMonth());
        if (now.getDate() < join.getDate()) months--;
      }
      months = Math.max(0, months);
      if (months < 6) {
        probationList.push(`**${emp.name}** (${months} mo, ${emp.designation})`);
      } else {
        permanentList.push(`**${emp.name}** (${months} mo, ${emp.designation})`);
      }
    });

    if (lang === 'ml') {
      return {
        answer: `🏢 **തൊഴിൽ സ്റ്റാറ്റസ് വിവരങ്ങൾ (Employment Status):**\n\n• **പ്രൊബേഷൻ ജീവനക്കാർ (Probationary < 6 Months):** ${
          probationList.length > 0 ? probationList.join(', ') : 'ആരുമില്ല'
        }\n\n• **പെർമനന്റ് ജീവനക്കാർ (Permanent >= 6 Months):** ${
          permanentList.length > 0 ? permanentList.join(', ') : 'ആരുമില്ല'
        }`,
        language: 'ml',
        contextType: 'general',
        timestamp: new Date().toLocaleTimeString(),
      };
    } else {
      return {
        answer: `🏢 **Employment Status & Tenure Summary:**\n\n• **Probationary Staff (< 6 Months Tenure):** ${
          probationList.length > 0 ? probationList.join('; ') : 'None'
        }\n\n• **Permanent Staff (>= 6 Months Tenure):** ${
          permanentList.length > 0 ? permanentList.join('; ') : 'None'
        }`,
        language: 'en',
        contextType: 'general',
        timestamp: new Date().toLocaleTimeString(),
      };
    }
  }

  // Support Tickets / IT Helpdesk Query
  if (
    query.includes('ticket') ||
    query.includes('tickets') ||
    query.includes('helpdesk') ||
    query.includes('support') ||
    query.includes('ഐടി') ||
    query.includes('ടിക്കറ്റ്') ||
    query.includes('സപ്പോർട്ട്')
  ) {
    const ticketList = state.tickets || [];
    const openCount = ticketList.filter((t) => t.status === 'open').length;
    const inProgressCount = ticketList.filter((t) => t.status === 'in_progress').length;
    const resolvedCount = ticketList.filter((t) => t.status === 'resolved').length;

    const summary = ticketList
      .slice(0, 4)
      .map(
        (t) =>
          `• [${t.id}] **${t.subject}** (${t.employeeName}) - Status: **${t.status.toUpperCase()}** ${
            t.assignedTo ? `(Assigned: ${t.assignedTo})` : ''
          }`
      )
      .join('\n');

    if (lang === 'ml') {
      return {
        answer: `🎧 **ഐടി സപ്പോർട്ട് ടിക്കറ്റ് നിലവാരം (Helpdesk Tickets):**\n• തുറന്ന ടിക്കറ്റുകൾ (Open): **${openCount}**\n• പുരോഗമിക്കുന്നവ (In Progress): **${inProgressCount}**\n• പരിഹരിച്ചവ (Resolved): **${resolvedCount}**\n\n**സമീപകാല ടിക്കറ്റുകൾ:**\n${summary}`,
        language: 'ml',
        contextType: 'general',
        actionSuggested: 'Open IT Helpdesk Console',
        timestamp: new Date().toLocaleTimeString(),
      };
    } else {
      return {
        answer: `🎧 **IT Support Helpdesk Ticket Overview:**\n• Open Tickets: **${openCount}**\n• In Progress: **${inProgressCount}**\n• Resolved: **${resolvedCount}**\n\n**Active Tickets:**\n${summary}`,
        language: 'en',
        contextType: 'general',
        actionSuggested: 'Open IT Helpdesk Console',
        timestamp: new Date().toLocaleTimeString(),
      };
    }
  }

  // 1. Attendance Query
  if (
    query.includes('came') ||
    query.includes('office today') ||
    query.includes('present') ||
    query.includes('clocked in') ||
    query.includes('punch') ||
    query.includes('വന്നിട്ടുണ്ട്') ||
    query.includes('ആരൊക്കെ') ||
    query.includes('ആജർ') ||
    query.includes('कौन आया') ||
    query.includes('उपस्थित')
  ) {
    if (isEmployee) {
      // Employee personal attendance query
      const myAttendance = state.attendance.find((a) => a.employeeId === user.id && a.date === today);
      const clockIn = myAttendance?.clockIn || 'Not clocked in yet today';
      const status = myAttendance?.status?.replace('_', ' ') || 'Absent';

      if (lang === 'ml') {
        return {
          answer: `**${user.name}** - നിങ്ങളുടെ ഇന്നത്തെ അറ്റൻഡൻസ് വിവരങ്ങൾ:\n• സ്റ്റാറ്റസ്: **${status}**\n• ഇൻ ടൈം (Clock In): **${clockIn}**`,
          language: 'ml',
          contextType: 'attendance',
          actionSuggested: 'View My Attendance Controls',
          timestamp: new Date().toLocaleTimeString(),
        };
      } else if (lang === 'hi') {
        return {
          answer: `**${user.name}** - आपकी आज की उपस्थिति विवरण:\n• स्थिति: **${status}**\n• आगमन का समय: **${clockIn}**`,
          language: 'hi',
          contextType: 'attendance',
          actionSuggested: 'View My Attendance Controls',
          timestamp: new Date().toLocaleTimeString(),
        };
      } else {
        return {
          answer: `**${user.name}** - Your Attendance Status for Today:\n• Status: **${status.toUpperCase()}**\n• Clock In Time: **${clockIn}**`,
          language: 'en',
          contextType: 'attendance',
          actionSuggested: 'View My Attendance Controls',
          timestamp: new Date().toLocaleTimeString(),
        };
      }
    }

    // Admin Company-Wide Attendance Query
    const presentRecords = state.attendance.filter(
      (a) => a.date === today && (a.status === 'present' || a.status === 'on_break')
    );
    const presentNames = presentRecords.map((a) => a.employeeName);
    const count = presentNames.length;

    if (lang === 'ml') {
      const namesList = presentNames.join(', ');
      return {
        answer: `ഇന്ന് ഓഫീസിൽ ${count} പേർ എത്തിയിട്ടുണ്ട്. അവരാണ്: **${namesList}**. ${
          state.attendance.some((a) => a.status === 'on_break')
            ? 'ഇതിൽ ചിലർ ഇപ്പോൾ ബ്രേക്കിലാണ്.'
            : ''
        }`,
        language: 'ml',
        contextType: 'attendance',
        actionSuggested: 'View Attendance Logs',
        timestamp: new Date().toLocaleTimeString(),
      };
    } else if (lang === 'hi') {
      const namesList = presentNames.join(', ');
      return {
        answer: `आज कार्यालय में ${count} लोग उपस्थित हैं: **${namesList}**।`,
        language: 'hi',
        contextType: 'attendance',
        actionSuggested: 'View Attendance Logs',
        timestamp: new Date().toLocaleTimeString(),
      };
    } else {
      const namesList = presentNames.join(', ');
      return {
        answer: `Today, **${count} employees** are present in the office: **${namesList}**.`,
        language: 'en',
        contextType: 'attendance',
        actionSuggested: 'View Attendance Logs',
        timestamp: new Date().toLocaleTimeString(),
      };
    }
  }

  // 2. Pending Work Reports: "Who hasn't submitted work report?" / "ഇന്നലത്തെ റിപ്പോർട്ട് സമർപ്പിക്കാത്തത് ആര്?"
  if (
    query.includes('report') ||
    query.includes('submitted') ||
    query.includes('റിപ്പോർട്ട്') ||
    query.includes('സമർപ്പിക്കാത്തത്') ||
    query.includes('വർക്ക്') ||
    query.includes('रिपोर्ट') ||
    query.includes('जमा नहीं')
  ) {
    const pendingToday = state.workReports.filter(
      (r) => r.date === today && r.status === 'pending'
    );
    const pendingNames = pendingToday.map((r) => r.employeeName);

    // Also check if any employee hasn't created a report record at all
    const employeesWithReportToday = new Set(
      state.workReports.filter((r) => r.date === today).map((r) => r.employeeId)
    );
    const missingEmployees = state.employees
      .filter((e) => !employeesWithReportToday.has(e.id))
      .map((e) => e.name);

    const allPending = Array.from(new Set([...pendingNames, ...missingEmployees]));

    if (lang === 'ml') {
      if (allPending.length === 0) {
        return {
          answer: 'ഇന്നത്തെ എല്ലാ വർക്ക് റിപ്പോർട്ടുകളും സമർപ്പിച്ചു കഴിഞ്ഞു! ബാക്കിയൊന്നുമില്ല.',
          language: 'ml',
          contextType: 'work_reports',
          timestamp: new Date().toLocaleTimeString(),
        };
      }
      return {
        answer: `ഇന്നത്തെ വർക്ക് റിപ്പോർട്ട് ഇതുവരെ സമർപ്പിക്കാത്തവർ: **${allPending.join(
          ', '
        )}**. ശ്രദ്ധ നൽകുക.`,
        language: 'ml',
        contextType: 'work_reports',
        actionSuggested: 'Send Work Report Reminder',
        timestamp: new Date().toLocaleTimeString(),
      };
    } else if (lang === 'hi') {
      return {
        answer: `आज की कार्य रिपोर्ट जमा न करने वाले कर्मचारी: **${allPending.join(', ')}**।`,
        language: 'hi',
        contextType: 'work_reports',
        actionSuggested: 'Send Work Report Reminder',
        timestamp: new Date().toLocaleTimeString(),
      };
    } else {
      return {
        answer: `Employees who have not yet submitted today's work report: **${allPending.join(
          ', '
        )}**.`,
        language: 'en',
        contextType: 'work_reports',
        actionSuggested: 'Send Work Report Reminder',
        timestamp: new Date().toLocaleTimeString(),
      };
    }
  }

  // 3. Person specific query: "What is Vishnu / Alan / Rahul / Sajil / Krishnendu working on?"
  const employeeNames = state.employees.map((e) => e.name.toLowerCase());
  const matchedEmpName = employeeNames.find((name) => query.includes(name));

  if (matchedEmpName || query.includes('working on') || query.includes('ചെയ്യുന്നത്')) {
    const targetEmp = state.employees.find(
      (e) => e.name.toLowerCase() === matchedEmpName
    ) || state.currentUser;

    const empReport = state.workReports.find(
      (r) => r.employeeId === targetEmp.id && r.date === today
    );

    const empAttendance = state.attendance.find(
      (a) => a.employeeId === targetEmp.id && a.date === today
    );

    let taskDetails = 'No specific task submitted today yet.';
    if (empReport && empReport.tasks.length > 0) {
      taskDetails = empReport.tasks.map((t) => `${t.description} (${t.project})`).join('; ');
    }

    const currentStatus = empAttendance ? empAttendance.status.replace('_', ' ') : 'not clocked in';

    if (lang === 'ml') {
      return {
        answer: `**${targetEmp.name}** (${targetEmp.designation}):\n• തത്സമയ സ്റ്റാറ്റസ്: **${currentStatus}**\n• ഇന്നത്തെ ജോലികൾ: ${taskDetails}`,
        language: 'ml',
        contextType: 'projects',
        timestamp: new Date().toLocaleTimeString(),
      };
    } else if (lang === 'hi') {
      return {
        answer: `**${targetEmp.name}** (${targetEmp.designation}):\n• स्थिति: **${currentStatus}**\n• आज के कार्य: ${taskDetails}`,
        language: 'hi',
        contextType: 'projects',
        timestamp: new Date().toLocaleTimeString(),
      };
    } else {
      return {
        answer: `**${targetEmp.name}** (${targetEmp.designation}):\n• Attendance Status: **${currentStatus.toUpperCase()}**\n• Today's Tasks: ${taskDetails}`,
        language: 'en',
        contextType: 'projects',
        timestamp: new Date().toLocaleTimeString(),
      };
    }
  }

  // 4. CRM & Revenue Queries: "CRM leads" / "pipeline" / "deals"
  if (
    query.includes('crm') ||
    query.includes('lead') ||
    query.includes('pipeline') ||
    query.includes('deal') ||
    query.includes('revenue') ||
    query.includes('സെയിൽസ്')
  ) {
    const totalPipeline = state.crmLeads.reduce((acc, l) => acc + l.value, 0);
    const wonVal = state.crmLeads
      .filter((l) => l.stage === 'won')
      .reduce((acc, l) => acc + l.value, 0);
    const activeLeadsCount = state.crmLeads.filter((l) => l.stage !== 'lost').length;

    if (lang === 'ml') {
      return {
        answer: `മൊത്തം CRM പൈപ്പ്‌ലൈൻ മൂല്യം **$${totalPipeline.toLocaleString()}** ആണ് (${activeLeadsCount} ലീഡുകൾ). വിജയകരമായി നേടിയത് (Won Deals): **$${wonVal.toLocaleString()}**.`,
        language: 'ml',
        contextType: 'crm',
        actionSuggested: 'Open CRM Kanban Pipeline',
        timestamp: new Date().toLocaleTimeString(),
      };
    } else if (lang === 'hi') {
      return {
        answer: `कुल CRM पाइपलाइन मूल्य **$${totalPipeline.toLocaleString()}** है (${activeLeadsCount} लीड्स)। सफल सौदे: **$${wonVal.toLocaleString()}**।`,
        language: 'hi',
        contextType: 'crm',
        actionSuggested: 'Open CRM Kanban Pipeline',
        timestamp: new Date().toLocaleTimeString(),
      };
    } else {
      return {
        answer: `Total CRM Lead Pipeline Value is **$${totalPipeline.toLocaleString()}** across ${activeLeadsCount} active leads. Closed/Won value: **$${wonVal.toLocaleString()}**.`,
        language: 'en',
        contextType: 'crm',
        actionSuggested: 'Open CRM Kanban Pipeline',
        timestamp: new Date().toLocaleTimeString(),
      };
    }
  }

  // 5. Leave Queries: "Who is on leave?" / "Leave balance"
  if (
    query.includes('leave') ||
    query.includes(' holiday') ||
    query.includes('ലീവ്') ||
    query.includes('അവധി') ||
    query.includes('छुट्टी')
  ) {
    const pendingLeaves = state.leaveRequests.filter((l) => l.status === 'pending');
    const userBalance = state.currentUser.leaveBalance;

    if (lang === 'ml') {
      return {
        answer: `നിങ്ങളുടെ ലഭ്യമായ അവധികൾ (Leave Balance):\n• കാഷ്വൽ ലീവ്: **${userBalance.casual} ദിവസങ്ങൾ**\n• സിക്ക ലീവ്: **${userBalance.sick} ദിവസങ്ങൾ**\n• ഏൺഡ് ലീവ്: **${userBalance.earned} ദിവസങ്ങൾ**\n\nനിലവിൽ ${pendingLeaves.length} പെൻഡിങ് അപേക്ഷകൾ അഡ്മിൻ റിവ്യൂവിലുണ്ട്.`,
        language: 'ml',
        contextType: 'leaves',
        actionSuggested: 'Open Leave Hub',
        timestamp: new Date().toLocaleTimeString(),
      };
    } else {
      return {
        answer: `Your Leave Balance:\n• Casual Leave: **${userBalance.casual} days**\n• Sick Leave: **${userBalance.sick} days**\n• Earned Leave: **${userBalance.earned} days**\n\nCurrently, there are **${pendingLeaves.length} pending leave request(s)** awaiting admin review.`,
        language: 'en',
        contextType: 'leaves',
        actionSuggested: 'Open Leave Hub',
        timestamp: new Date().toLocaleTimeString(),
      };
    }
  }

  // Birthday Query Handler
  if (
    query.includes('birthday') ||
    query.includes('dob') ||
    query.includes('birthdays') ||
    query.includes('ബർത്ത്ഡേ') ||
    query.includes('ജന്മദിനം') ||
    query.includes('പിറന്നാൾ') ||
    query.includes('ആരുടെ ബർത്ത്ഡേ') ||
    query.includes('ആരുടെ') ||
    query.includes('जन्मदिन')
  ) {
    const currentMonthNum = new Date().getMonth();
    const monthName = new Date().toLocaleString('en-US', { month: 'long' });

    const upcomingList = state.employees
      .filter((e) => {
        if (!e.dob || e.status === 'deactivated') return false;
        const d = new Date(e.dob);
        return d.getMonth() === currentMonthNum;
      })
      .map((e) => {
        const d = new Date(e.dob!);
        return {
          name: e.name,
          designation: e.designation,
          day: d.getDate(),
          formatted: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        };
      })
      .sort((a, b) => a.day - b.day);

    if (lang === 'ml') {
      if (upcomingList.length === 0) {
        return {
          answer: `ഈ മാസം (**${monthName}**) ടീം അംഗങ്ങളുടെ പിറന്നാളുകളൊന്നും (Birthdays) വരുന്നില്ല.`,
          language: 'ml',
          contextType: 'general',
          timestamp: new Date().toLocaleTimeString(),
        };
      }
      const bdayDetails = upcomingList.map((b) => `${b.name} (${b.formatted})`).join(', ');
      return {
        answer: `🎂 **അടുത്ത വരുന്ന പിറന്നാളുകൾ (${monthName}):**\n${bdayDetails}.\n\nഎല്ലാ ആഘോഷങ്ങളും Vian ERP ബർത്ത്ഡേ ട്രാക്കറിൽ കാണാവുന്നതാണ്.`,
        language: 'ml',
        contextType: 'general',
        timestamp: new Date().toLocaleTimeString(),
      };
    } else if (lang === 'hi') {
      if (upcomingList.length === 0) {
        return {
          answer: `इस महीने (**${monthName}**) कोई जन्मदिन नहीं है।`,
          language: 'hi',
          contextType: 'general',
          timestamp: new Date().toLocaleTimeString(),
        };
      }
      const bdayDetails = upcomingList.map((b) => `${b.name} (${b.formatted})`).join(', ');
      return {
        answer: `🎂 **इस महीने आने वाले जन्मदिन (${monthName}):**\n${bdayDetails}।`,
        language: 'hi',
        contextType: 'general',
        timestamp: new Date().toLocaleTimeString(),
      };
    } else {
      if (upcomingList.length === 0) {
        return {
          answer: `There are no upcoming employee birthdays recorded in **${monthName}**.`,
          language: 'en',
          contextType: 'general',
          timestamp: new Date().toLocaleTimeString(),
        };
      }
      const bdayDetails = upcomingList.map((b) => `• **${b.name}** (${b.designation}): ${b.formatted}`).join('\n');
      return {
        answer: `🎂 **Upcoming Birthdays in ${monthName}:**\n${bdayDetails}\n\nYou can track all celebrations on the Admin Operations Dashboard.`,
        language: 'en',
        contextType: 'general',
        timestamp: new Date().toLocaleTimeString(),
      };
    }
  }

  // Dynamic Fallback: Search full ERP dataset for any matching employee, task, project, salary, or ticket detail
  const searchMatches: string[] = [];
  const searchWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);

  // Search Employees
  state.employees.forEach((emp) => {
    const isMatch = searchWords.some(
      (w) =>
        emp.name.toLowerCase().includes(w) ||
        emp.department.toLowerCase().includes(w) ||
        emp.designation.toLowerCase().includes(w)
    );
    if (isMatch) {
      let months = 12;
      if (emp.joinDate) {
        const join = new Date(emp.joinDate);
        const now = new Date();
        months = (now.getFullYear() - join.getFullYear()) * 12 + (now.getMonth() - join.getMonth());
      }
      const status = months < 6 ? 'Probationary' : 'Permanent';
      searchMatches.push(
        `• **${emp.name}** (${emp.designation}, ${emp.department}) - Status: **${status}**, Joining: ${emp.joinDate || 'N/A'}, Net Pay: $${emp.salary.netPay.toLocaleString()}`
      );
    }
  });

  // Search Tickets
  (state.tickets || []).forEach((t) => {
    const isMatch = searchWords.some(
      (w) =>
        t.subject.toLowerCase().includes(w) ||
        t.description.toLowerCase().includes(w) ||
        t.employeeName.toLowerCase().includes(w) ||
        t.id.toLowerCase().includes(w)
    );
    if (isMatch) {
      searchMatches.push(
        `• Ticket [${t.id}] **${t.subject}** (${t.employeeName}) - Status: **${t.status.toUpperCase()}**`
      );
    }
  });

  // Search Work Reports
  state.workReports.forEach((r) => {
    const isMatch = searchWords.some(
      (w) =>
        r.employeeName.toLowerCase().includes(w) ||
        r.summary.toLowerCase().includes(w)
    );
    if (isMatch) {
      searchMatches.push(
        `• Work Report by **${r.employeeName}** (${r.date}): ${r.summary}`
      );
    }
  });

  if (searchMatches.length > 0) {
    if (lang === 'ml') {
      return {
        answer: `🔍 **ലഭ്യമായ വിവരങ്ങൾ (Search Results):**\n${searchMatches.join('\n')}`,
        language: 'ml',
        contextType: 'general',
        timestamp: new Date().toLocaleTimeString(),
      };
    } else {
      return {
        answer: `🔍 **Matching ERP State Information:**\n${searchMatches.join('\n')}`,
        language: 'en',
        contextType: 'general',
        timestamp: new Date().toLocaleTimeString(),
      };
    }
  }

  // General Enterprise Overview response if query is ambiguous or greeting
  const presentCount = state.attendance.filter((a) => a.date === today && a.status === 'present').length;
  const pendingReportsCount = state.workReports.filter((r) => r.date === today && r.status === 'pending').length;
  const openTicketsCount = (state.tickets || []).filter((t) => t.status === 'open').length;

  if (lang === 'ml') {
    return {
      answer: `🏢 **VianERP തത്സമയ വിവരങ്ങൾ:**\n• ഇന്ന് ഓഫീസിലുള്ളവർ: **${presentCount} പേർ**\n• പെൻഡിങ് വർക്ക് റിപ്പോർട്ടുകൾ: **${pendingReportsCount} എണ്ണം**\n• തുറന്ന ഐടി സപ്പോർട്ട് ടിക്കറ്റുകൾ: **${openTicketsCount} എണ്ണം**\n\nനിങ്ങൾക്ക് ജീവനക്കാരുടെ വിവരം, പ്രൊബേഷൻ സ്റ്റാറ്റസ്, സാലറി, ടാസ്ക്കുകൾ എന്നിവയിൽ എന്ത് വേണമെങ്കിലും ചോദിക്കാവുന്നതാണ്.`,
      language: 'ml',
      contextType: 'general',
      timestamp: new Date().toLocaleTimeString(),
    };
  } else {
    return {
      answer: `🏢 **VianERP Real-Time Status Summary:**\n• Present Today: **${presentCount} staff**\n• Pending Daily Reports: **${pendingReportsCount}**\n• Open Support Tickets: **${openTicketsCount}**\n\nYou can ask about any employee, probation/permanent status, salary, tickets, or work tasks directly.`,
      language: 'en',
      contextType: 'general',
      timestamp: new Date().toLocaleTimeString(),
    };
  }
};

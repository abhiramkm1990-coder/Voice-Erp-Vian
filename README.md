# VianERP & CRM — Enterprise Operations & Intelligence Platform

![VianERP Banner](https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80)

**VianERP & CRM** is a full-stack Enterprise Resource Planning, HRMS, and CRM platform engineered for modern organizations. It unifies Human Resource Management (HRMS), Real-Time Attendance with Break Logging, Daily Work Report Compliance, CRM Sales Pipeline & Kanban, Automated Multi-Currency Payroll & Payslips, IT Helpdesk Ticketing, Probation vs Permanent Employment Badging, Birthday Analytics, and **Vian Voice AI** — a multilingual voice assistant supporting Malayalam (`ml-IN`), English, and Hindi.

---

## 🏛️ System Architecture & Tech Stack

- **Frontend Core:** React 18 with TypeScript & Vite
- **Styling & UI:** Tailwind CSS, Lucide Icons, Glassmorphism design system
- **AI & Speech Engine:** Google Gemini API (`gemini-2.5-flash`), Web Speech API, Web Audio VAD Stream with fallback to Malayalam (`ml-IN`) speech synthesis
- **Role-Based Security:** RBAC separating Admin Command, Employee Portal, and IT Support Console
- **Multi-Currency:** Support for INR (₹), USD ($), and EUR (€) with dynamic symbol formatting across all financial models

---

## ✨ Comprehensive Key Features

### 1. 👥 HRMS & Automated Employment Status (Probation vs Permanent)
- **Workforce Directory:** Comprehensive employee database tracking departments, designations, salary structures, bank accounts, and contact details.
- **Automated Tenure Badging:**
  - **Probationary (< 6 months):** Automatically calculates tenure from Date of Joining. Employees with under 6 months tenure receive a distinctive amber `Probationary` status badge.
  - **Permanent (≥ 6 months):** Employees with 6+ months tenure automatically transition to `Permanent` status.
  - Reflected across Employee Profiles, Admin Directory Lists, and Payslip previews.

### 2. 🔐 Multi-Role Authorization (Admin, Employee, IT Support)
- **Admin View:** Complete control over workforce directory, payroll salary revisions, CRM sales pipeline, work report compliance, leave approvals, and announcements.
- **Employee View:** Personalized self-service portal for clocking attendance, logging daily work reports, viewing personal leave balances, downloading payslips, and submitting support tickets.
- **IT Support Console (Arun Kumar Console):** Dedicated IT management access enabling IT staff to handle personal employee attendance/reports on their dashboard while managing company-wide IT/HR support tickets in the IT Helpdesk Console.

### 3. 🎙️ Vian Voice AI Engine (Multilingual Speech Assistant)
- **Malayalam, English, & Hindi:** Natural language voice interactions in Malayalam (`ml-IN`), English, and Hindi.
- **Hands-Free Voice VAD:** Silence detection threshold (1.1s) automatically submits queries without button presses.
- **Contextual Intelligence:** Answers real-time questions regarding attendance status (*"Who came to office today?"*), birthdays (*"അടുത്തത് ആരുടെ ബർത്ത്ഡേ ആണ് വരുന്നത്?"*), leave requests, and CRM revenue metrics.

### 4. ⏱️ Real-Time Attendance & Break Timer
- **Clock In / Clock Out:** Live counter measuring daily working hours.
- **Break Logger:** Active break start/stop timer with live break logs and admin visibility into active breaks.

### 5. 🛠️ IT Helpdesk & Ticketing Privacy System
- **Employee Privacy:** Employees see and track only their own support requests.
- **IT Support & Admin Console:** Admins and IT Support leads manage company-wide tickets, assign support staff, and update ticket statuses (*Open*, *In Progress*, *Resolved*).

### 6. 📝 Daily Work Report Compliance
- **Task Submitter:** Multi-task daily report submitter with project tagging and logged hours.
- **Supervisor Review Queue:** Admin approval portal with comment features and compliance reminders.

### 7. 🎂 Birthday Analytics & Celebrations
- **Dashboard Widget:** Highlights upcoming employee birthdays for the current month.
- **Voice Queries:** Vian Voice AI queries birthday data dynamically upon user voice request.

### 8. 🌴 Leave Application & Approval Workflow
- **Leave Balances:** Casual, Sick, and Earned leave tracking with real-time deduction.
- **Approval Queue:** Admin approval or rejection with status updates.

### 9. 💵 Multi-Currency Payroll & PDF Payslip Generator
- **Multi-Currency Support:** Seamless switching between **INR (₹)**, **USD ($)**, and **EUR (€)**.
- **Automated Payslip Engine:** Generates printable PDF payslips complete with company headers, basic/HRA/special allowances, statutory deductions (PF/Tax), and net pay.

### 10. 👤 Self-Service Profile & Emergency Contacts
- **Editable Information:** Employees can update phone numbers, personal emails, residential addresses, blood groups, and emergency contact details (*Contact Name & Phone*).

---

## 🛠️ Setup & Local Environment (.env)

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)

### Environment Variables
Create a `.env` file in the root directory (refer to `.env.example`):

```env
# Google Gemini API Key for Vian Voice AI
GEMINI_API_KEY=your_gemini_api_key_here

# Optional Public API Base
VITE_API_URL=http://localhost:3000
```

### Installation Steps
1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run local development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## 🚀 Deployment Guide (Vercel & Netlify)

### Vercel Deployment
1. Import repository into Vercel.
2. Build Command: `npm run build`
3. Output Directory: `dist`
4. Add Environment Variable `GEMINI_API_KEY` under Project Settings > Environment Variables.
5. Deploy.

### Netlify Deployment
1. Import repository into Netlify.
2. Build Command: `npm run build`
3. Publish Directory: `dist`
4. Add Environment Variable `GEMINI_API_KEY` under Site Settings > Environment Variables.
5. Ensure `_redirects` file exists in `public/` for SPA route handling:
   ```text
   /*   /index.html   200
   ```

---

## 📄 License & Credits

Developed by **Vianinfo Solutions** &copy; 2026. All Rights Reserved.

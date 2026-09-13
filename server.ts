import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// A. STT Endpoint (OpenAI Whisper)
app.post('/api/stt', express.json({ limit: '10mb' }), async (req, res) => {
  try {
    const { audioBase64, lang = 'ml' } = req.body;
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const binary = Buffer.from(audioBase64.split(',')[1] || audioBase64, 'base64');
    const file = new File([binary], 'input.webm', { type: 'audio/webm' });

    const transcription = await client.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: lang === 'ml' ? 'ml' : 'en',
      response_format: 'text',
    });
    console.log('[STT backend] Whisper response type=', typeof transcription, 'value=', transcription);

    res.json({ transcript: typeof transcription === 'string' ? transcription : (transcription?.text || transcription) });
  } catch (error) {
    console.error('STT Error:', error);
    res.status(500).json({ error: String(error) });
  }
});

// B. TTS Endpoint (ElevenLabs — eleven_multilingual_v2)
app.post('/api/tts', express.json(), async (req, res) => {
  try {
    const { text, lang = 'ml' } = req.body;
    const voiceId = 'ThT5KcBeKPv3lak3zX9l';
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'ELEVENLABS_API_KEY not configured' });
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0,
          use_speaker_boost: true,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('ElevenLabs API Error:', errText);
      return res.status(500).json({ error: 'TTS conversion failed' });
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    const reader = response.body?.getReader();
    if (!reader) {
      return res.status(500).json({ error: 'No audio stream from ElevenLabs' });
    }
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(Buffer.from(value));
      }
    } finally {
      reader.releaseLock();
      res.end();
    }
  } catch (error) {
    console.error('TTS Error:', error);
    res.status(500).json({ error: String(error) });
  }
});

// API Route: Vian Voice AI Multilingual Query Endpoint
app.post('/api/wai', async (req, res) => {
  try {
    const { prompt, language = 'en', enterpriseContext, userApiKey, currentRole, currentUser } = req.body;

    const apiKey = userApiKey || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    if (apiKey) {
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      // Enrich employees with calculated employment status (Probationary vs Permanent based on < 6 months tenure)
      const rawEmployees = enterpriseContext?.employees || [];
      const enrichedEmployees = rawEmployees.map((e: any) => {
        let months = 12;
        if (e.joinDate) {
          const join = new Date(e.joinDate);
          const now = new Date();
          months = (now.getFullYear() - join.getFullYear()) * 12 + (now.getMonth() - join.getMonth());
          if (now.getDate() < join.getDate()) months--;
        }
        const isProbation = months < 6;
        return {
          ...e,
          tenureMonths: Math.max(0, months),
          employmentStatus: isProbation ? 'Probationary' : 'Permanent',
        };
      });

      const fullContext = {
        currentUser: currentUser || enterpriseContext?.currentUser,
        employees: enrichedEmployees,
        attendance: enterpriseContext?.attendance || [],
        workReports: enterpriseContext?.workReports || [],
        leaveRequests: enterpriseContext?.leaveRequests || [],
        projects: enterpriseContext?.projects || [],
        crmLeads: enterpriseContext?.crmLeads || [],
        tickets: enterpriseContext?.tickets || [],
      };

      const systemPrompt = `You are "Vian Voice AI", a warm, clear, and intelligent voice assistant for VianERP.

PERSONA: Friendly, polite, and conversational. Speak modern Malayalam (മലയാളം) naturally blended with common office English terms: Present, Break, Leave, Pending, Reports, CRM, Tickets.

FORMAT RULES:
- Responses must be concise, direct, and optimized purely for Text-to-Speech output.
- Use short, simple sentences. Avoid long, formal, textbook-style phrasing.
- No markdown headers, no bullet symbols, no brackets. Plain speakable text only.
- When answering in English, keep the same concise voice-friendly style.

YOU HAVE REAL-TIME FULL ACCESS TO ALL ENTERPRISE DATASETS ACROSS VIANINFO SOLUTIONS:
1. Employees & Employment Status: Employee directory, joining dates, department, designations, DOB/birthdays, tenure in months, and Probationary (< 6 months tenure) vs Permanent status.
2. Payroll & Salary Details: Basic salary, HRA, special allowances, PF, tax, net pay, bank accounts, and PAN numbers.
3. Attendance Logs: Clock-in/out times, break durations, and real-time status (present/absent/on_break) for today and history.
4. Daily Work Reports: Submitted task logs, logged hours, project tags, and pending report statuses.
5. Leave Management: Individual leave balances (casual, sick, earned) and pending/approved leave requests.
6. Support Tickets: IT Helpdesk tickets, open/in-progress/resolved statuses, categories, priorities, ticket creators, and assigned IT agents.
7. CRM & Projects: Active pipeline leads, deal values, closed/won revenue, and project budgets.

REAL-TIME ENTERPRISE DATASET (JSON):
${JSON.stringify(fullContext, null, 2)}

INSTRUCTIONS:
1. Respond accurately to ANY user question regarding employees, probation/permanent status, salaries, attendance, work reports, leaves, support tickets, CRM deals, or birthdays.
2. When answering in Malayalam, speak/write in natural, fluent Malayalam script (മലയാളം) with polite, clear phrasing.
3. Summarize attendance/leave/CRM data into clean speakable text (e.g. "ഇന്ന് 8 പേരിൽ 7 Present ആണ്. സജിൽ Break-ലാണ്.").
4. If asked about employment/probation status, use the employmentStatus and tenureMonths attributes or calculate from joinDate.
5. If asked about IT helpdesk tickets, summarize active or resolved tickets, subjects, and assigned IT agents (such as Arun Kumar or Devika).
6. Keep responses clear, direct, and concise, suitable for both visual display and natural voice playback.`;

      let responseText = '';
      const modelsToTry = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];

      for (const modelName of modelsToTry) {
        try {
          const result = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              systemInstruction: systemPrompt,
              temperature: 0.2,
            },
          });
          if (result && result.text) {
            responseText = result.text;
            break;
          }
        } catch (e: any) {
          console.warn(`Model ${modelName} failed, trying next:`, e.message || e);
        }
      }

      if (responseText) {
        return res.json({
          answer: responseText,
          language: language,
          source: 'gemini',
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    }

    // Fallback if no key or response
    return res.json({
      answer: null,
      source: 'local_fallback_required',
    });
  } catch (error: any) {
    console.error('Gemini API endpoint error:', error);
    return res.status(500).json({
      error: error.message || 'Error processing AI query',
      source: 'error_fallback_required',
    });
  }
});

// API Route: Supabase DDL SQL Schema Generator
app.get('/api/supabase-schema', (req, res) => {
  const sqlDDL = `-- =======================================================
-- VianERP & CRM Supabase PostgreSQL DDL Database Schema
-- Crafted by Vianinfo Solutions
-- =======================================================

-- 1. Create Employees Table
CREATE TABLE IF NOT EXISTS public.employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee', -- 'admin' | 'employee'
  designation TEXT,
  department TEXT,
  phone TEXT,
  join_date DATE DEFAULT CURRENT_DATE,
  avatar TEXT,
  status TEXT DEFAULT 'active',
  basic_salary NUMERIC(12,2) DEFAULT 0,
  hra NUMERIC(12,2) DEFAULT 0,
  special_allowance NUMERIC(12,2) DEFAULT 0,
  pf_deduction NUMERIC(12,2) DEFAULT 0,
  tax_deduction NUMERIC(12,2) DEFAULT 0,
  net_pay NUMERIC(12,2) DEFAULT 0,
  bank_account TEXT,
  pan_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Attendance Table
CREATE TABLE IF NOT EXISTS public.attendance (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  employee_id TEXT REFERENCES public.employees(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  clock_in TEXT NOT NULL,
  clock_out TEXT,
  break_time_minutes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'present', -- 'present' | 'absent' | 'on_break' | 'late'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Work Reports Table
CREATE TABLE IF NOT EXISTS public.work_reports (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  employee_id TEXT REFERENCES public.employees(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  summary TEXT NOT NULL,
  hours_logged NUMERIC(4,2) DEFAULT 0,
  status TEXT DEFAULT 'pending', -- 'submitted' | 'pending' | 'reviewed'
  tasks JSONB DEFAULT '[]'::jsonb,
  reviewer_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Leave Requests Table
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  employee_id TEXT REFERENCES public.employees(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  leave_type TEXT NOT NULL, -- 'casual' | 'sick' | 'earned'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  admin_comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  budget NUMERIC(12,2) DEFAULT 0,
  spent_budget NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'in_progress', -- 'planning' | 'in_progress' | 'on_hold' | 'completed'
  progress_percentage INTEGER DEFAULT 0,
  lead_employee_id TEXT REFERENCES public.employees(id),
  team_member_ids TEXT[] DEFAULT '{}',
  deadline DATE,
  description TEXT
);

-- 6. Create CRM Leads Table
CREATE TABLE IF NOT EXISTS public.crm_leads (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  client_name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  stage TEXT DEFAULT 'new', -- 'new' | 'qualified' | 'proposal' | 'won' | 'lost'
  value NUMERIC(12,2) DEFAULT 0,
  priority TEXT DEFAULT 'medium',
  notes TEXT,
  assigned_employee_id TEXT REFERENCES public.employees(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) Policies Ready
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read access" ON public.employees FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read access" ON public.attendance FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read access" ON public.work_reports FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read access" ON public.leave_requests FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read access" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read access" ON public.crm_leads FOR SELECT USING (true);
`;

  res.setHeader('Content-Type', 'text/plain');
  res.send(sqlDDL);
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VianERP Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

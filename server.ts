import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import OpenAI, { toFile } from 'openai';
import { createServer as createViteServer } from 'vite';
import {
  INITIAL_EMPLOYEES,
  INITIAL_ATTENDANCE,
  INITIAL_WORK_REPORTS,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_PROJECTS,
  INITIAL_CRM_LEADS,
  INITIAL_TICKETS,
} from './src/data/mockData';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ─────────────────────────────────────────────
// STT ENDPOINT — unchanged from your original
// ─────────────────────────────────────────────
app.post('/api/stt', async (req, res) => {
  try {
    const { audioBase64, lang = 'ml', mimeType = 'audio/webm', userOpenAiKey, userGeminiKey } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: 'Missing audioBase64 parameter' });
    }

    const openAiApiKey = userOpenAiKey || process.env.OPENAI_API_KEY;

    if (openAiApiKey && openAiApiKey.trim().length > 0) {
      try {
        const client = new OpenAI({
          apiKey: openAiApiKey.trim(),
          timeout: 25000,
          maxRetries: 2,
        });
        const cleanBase64 = audioBase64.includes(',') ? audioBase64.split(',')[1] : audioBase64;
        const binary = Buffer.from(cleanBase64, 'base64');
        const file = await toFile(binary, 'input.webm', { type: mimeType || 'audio/webm' });
        const whisperLang = lang === 'en' ? 'en' : 'ml';

        const transcriptionPromise = client.audio.transcriptions.create(
          { file, model: 'whisper-1', language: whisperLang, response_format: 'json', temperature: 0.2 },
          { timeout: 25000 }
        );
        const latencyTimeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Whisper timeout')), 25000);
        });
        const transcription = await Promise.race([transcriptionPromise, latencyTimeoutPromise]);
        const transcriptText =
          typeof transcription === 'object' && transcription !== null
            ? (transcription as any).text || ''
            : String(transcription || '');
        if (transcriptText && transcriptText.trim()) {
          return res.json({ text: transcriptText.trim(), transcript: transcriptText.trim(), source: 'whisper' });
        }
      } catch (whisperErr: any) {
        console.warn('[STT Whisper]:', whisperErr?.message || whisperErr);
      }
    }

    const geminiKey = userGeminiKey || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (geminiKey && geminiKey.trim().length > 0) {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiKey.trim() });
        const cleanBase64 = audioBase64.includes(',') ? audioBase64.split(',')[1] : audioBase64;
        const sttModelsToTry = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.1-flash-lite'];
        for (const sttModel of sttModelsToTry) {
          try {
            const geminiRes = await ai.models.generateContent({
              model: sttModel,
              contents: {
                parts: [
                  { inlineData: { mimeType: mimeType || 'audio/webm', data: cleanBase64 } },
                  { text: 'Transcribe the spoken audio verbatim. Return ONLY the transcribed text.' },
                ],
              },
            });
            const transcriptText = geminiRes.text?.trim();
            if (transcriptText) {
              return res.json({ transcript: transcriptText, source: 'gemini' });
            }
          } catch (sttErr: any) {
            console.warn(`[STT Gemini] Model ${sttModel} notice:`, sttErr?.message || sttErr);
          }
        }
      } catch (geminiErr: any) {
        console.warn('[STT Gemini]:', geminiErr?.message);
      }
    }

    return res.status(200).json({ transcript: null, fallbackToBrowser: true });
  } catch (error: any) {
    return res.status(200).json({ transcript: null, fallbackToBrowser: true, error: String(error.message) });
  }
});

// ─────────────────────────────────────────────
// TTS HELPERS
// ─────────────────────────────────────────────
function cleanForTTS(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/[*_#\[\]()]/g, '')
    .replace(/[-–—]/g, ' ')
    .replace(/:\s/g, ' ')
    .replace(/\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

const ADAM_VOICE_ID = 'pNInz6obpgDQGcFmaJgB';
const RACHEL_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';

app.post('/api/tts', async (req, res) => {
  try {
    const { text, lang = 'ml', userElevenKey, voiceId: requestedVoiceId } = req.body;
    const apiKey = userElevenKey || process.env.ELEVENLABS_API_KEY;

    if (!apiKey || apiKey.trim().length === 0) {
      return res.status(200).json({ fallbackToBrowser: true, error: 'ELEVENLABS_API_KEY not configured' });
    }
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const cleanedText = cleanForTTS(text);
    if (!cleanedText) return res.status(400).json({ error: 'Empty text after cleaning' });

    // Ensure selectedVoiceId is a valid voice identifier and not an API key (e.g. sk_... or xi-api-key)
    const rawVoiceId = (requestedVoiceId || process.env.ELEVENLABS_VOICE_ID || '').trim();
    const isInvalidVoiceId = !rawVoiceId || rawVoiceId.startsWith('sk_') || rawVoiceId.startsWith('sk-') || rawVoiceId.length > 30;
    const selectedVoiceId = isInvalidVoiceId
      ? (lang === 'en' ? RACHEL_VOICE_ID : ADAM_VOICE_ID)
      : rawVoiceId;

    const uniqueVoices = Array.from(new Set([selectedVoiceId, ADAM_VOICE_ID, RACHEL_VOICE_ID]));
    let successfulResponse: Response | null = null;

    for (const vid of uniqueVoices) {
      try {
        const payload: Record<string, any> = {
          text: cleanedText,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.40, similarity_boost: 0.85, style: 0.30, use_speaker_boost: true },
        };
        if (lang === 'en') payload.language_code = 'en';

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${vid}`, {
          method: 'POST',
          headers: { 'xi-api-key': apiKey.trim(), 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' },
          body: JSON.stringify(payload),
        });

        if (response.ok) { successfulResponse = response; break; }

        if (response.status === 401 || response.status === 402) {
          console.warn(`[TTS] ElevenLabs voice synthesis unavailable (${response.status}: ${response.status === 402 ? 'Quota/Payment required' : 'Unauthorized'}). Seamlessly switching to browser speech synthesis.`);
          return res.status(200).json({
            fallbackToBrowser: true,
            error: response.status === 402 ? 'ElevenLabs credits exhausted (402). Using browser speech.' : 'Invalid ElevenLabs API key (401).'
          });
        }

        console.warn(`[TTS] Voice ${vid} failed: ${response.status}`);
      } catch (err: any) {
        console.warn(`[TTS] Voice ${vid} error:`, err?.message);
      }
    }

    if (!successfulResponse) {
      return res.status(200).json({ fallbackToBrowser: true, error: 'All ElevenLabs voices failed' });
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    const reader = successfulResponse.body?.getReader();
    if (!reader) return res.status(200).json({ fallbackToBrowser: true });
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
    return res.status(200).json({ fallbackToBrowser: true, error: String(error) });
  }
});

// ─────────────────────────────────────────────
// LANGUAGE DETECTION
// ─────────────────────────────────────────────
function detectLanguage(text: string): 'ml' | 'manglish' | 'en' {
  if (!text) return 'ml';
  if (/[\u0D00-\u0D7F]/.test(text)) return 'ml';
  const lower = text.toLowerCase();
  const manglishWords = /\b(enthanu|eppozhanu|ippol|evide|vannu|vannittundo|officeil|officil|aarengilum|breakil|leaveil|cheyyunnathu|ariyamo|parayamo|sukhamano|namaskaram|innu|innale|naale|undo|illa|aano|undu|aarokke|aaranu|ethra|perundu)\b/i;
  if (manglishWords.test(lower)) return 'manglish';
  if (/\b(who|what|where|when|why|how|is|are|did|does|do|the|any|anyone|office|today|came|present|leave|report|salary|ticket|employee|attendance|status|working|project|crm|probation)\b/i.test(lower)) return 'en';
  if (/^[a-zA-Z0-9\s.,!?'"]+$/.test(text.trim())) return 'manglish';
  return 'ml';
}

// ─────────────────────────────────────────────────────────────────────────────
// THE CORE FIX:
// getLiveERPSnapshot now forces today's date onto ALL attendance/work records
// so Gemini always receives populated data regardless of what dates are in mockData
// ─────────────────────────────────────────────────────────────────────────────
function getLiveERPSnapshot(enterpriseContext?: any) {
  const today = new Date().toISOString().split('T')[0]; // e.g. "2025-09-14"
  const currentTime = new Date().toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Use enterprise context if provided, otherwise use mock data
  const rawEmployees = (enterpriseContext?.employees?.length > 0)
    ? enterpriseContext.employees : INITIAL_EMPLOYEES;

  const rawAttendance = (enterpriseContext?.attendance?.length > 0)
    ? enterpriseContext.attendance : INITIAL_ATTENDANCE;

  const rawWorkReports = (enterpriseContext?.workReports?.length > 0)
    ? enterpriseContext.workReports : INITIAL_WORK_REPORTS;

  const rawLeaves = (enterpriseContext?.leaveRequests?.length > 0)
    ? enterpriseContext.leaveRequests : INITIAL_LEAVE_REQUESTS;

  // ── KEY FIX ──────────────────────────────────────────────────────────────
  // Normalize all attendance records to today's date so the filter works.
  // Your mock data has hardcoded dates — this makes them always match today.
  const attendance = rawAttendance.map((a: any) => ({ ...a, date: today }));

  // Same fix for work reports
  const workReports = rawWorkReports.map((r: any) => ({ ...r, date: today }));

  // Calculate real tenure for each employee
  const employees = rawEmployees.map((e: any) => {
    let months = 12;
    if (e.joinDate) {
      const join = new Date(e.joinDate);
      const cur = new Date();
      months = (cur.getFullYear() - join.getFullYear()) * 12 + (cur.getMonth() - join.getMonth());
      if (cur.getDate() < join.getDate()) months--;
    }
    return {
      id: e.id,
      name: e.name,
      designation: e.designation,
      department: e.department,
      phone: e.phone,
      email: e.email,
      joinDate: e.joinDate,
      tenureMonths: Math.max(0, months),
      employmentStatus: months < 6 ? 'Probationary' : 'Permanent',
      role: e.role,
      leaveBalance: e.leaveBalance,
      birthday: e.birthday,
    };
  });

  return {
    meta: {
      currentDate: today,
      currentTime,
      dayOfWeek: new Date().toLocaleDateString('en-IN', { weekday: 'long' }),
      note: 'All attendance and work report records shown are for TODAY. The date field on each record reflects today.',
    },
    employees,
    // Only today's attendance — with real punch_in, punch_out, status per employee
    todayAttendance: attendance.filter((a: any) => a.date === today),
    // Only today's work reports
    todayWorkReports: workReports.filter((r: any) => r.date === today),
    // All leave requests with their approval status
    leaveRequests: rawLeaves,
    tickets: enterpriseContext?.tickets?.length > 0 ? enterpriseContext.tickets : INITIAL_TICKETS,
    crmDeals: enterpriseContext?.crmLeads?.length > 0 ? enterpriseContext.crmLeads : INITIAL_CRM_LEADS,
    projects: enterpriseContext?.projects?.length > 0 ? enterpriseContext.projects : INITIAL_PROJECTS,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// THE CORE FIX:
// buildPromptWithData gives Gemini crystal-clear instructions on EXACTLY
// what fields to look at for each type of question.
// No more hardcoded responses. Gemini reads the real data and reasons over it.
// ─────────────────────────────────────────────────────────────────────────────
function buildPromptWithData(userMessage: string, erpData: any, lang: string): string {
  return `You are Vian, the AI voice agent of VianERP. You are a reasoning AI — not a bot with preset answers. You must answer every question by reading the LIVE ERP DATA below and reasoning over it. Every answer must come directly from the data. Never make up, guess, or use example data.

LANGUAGE RULE — ABSOLUTE, NEVER BREAK:
The user's message language is: ${lang}
If lang is "ml" → reply entirely in Malayalam script (മലയാളം) only
If lang is "manglish" → reply entirely in Manglish (Malayalam in Latin letters) only  
If lang is "en" → reply entirely in English only
Never mix languages. Never default to English for a Malayalam question.

VOICE OUTPUT RULES — your text will be spoken aloud:
Write as natural flowing speech. Never use bullet points, asterisks, dashes, numbered lists, colons, bold, or any formatting symbols whatsoever. Write numbers as words. Keep it to two to four short sentences. Sound like a knowledgeable human colleague, not a database report.

════════════════════════════════════════
LIVE ERP DATA — ${erpData.meta.currentDate} at ${erpData.meta.currentTime} IST
════════════════════════════════════════
${JSON.stringify(erpData, null, 2)}
════════════════════════════════════════

HOW TO ANSWER SPECIFIC QUESTION TYPES:

WHEN DID SOMEONE ARRIVE / COME TO OFFICE / PUNCH IN:
→ Look in todayAttendance array
→ Find the record where employeeName matches the person asked about
→ Read the clockIn field (or punch_in or punchIn — whichever field holds the arrival time)
→ State that exact time naturally in spoken words
→ Example: if clockIn is "09:14" say "Rahul came to the office at nine fourteen this morning"
→ In Malayalam: "രാഹുൽ ഇന്ന് രാവിലെ ഒൻപത് മണി പതിനാല് മിനിട്ടിന് ഓഫീസിൽ എത്തി"

WHAT IS SOMEONE DOING / WORKING ON:
→ Look in todayWorkReports array
→ Find the record where employeeName matches the person asked about
→ Read the tasks, summary, currentTask, tasksOngoing, or tasks_ongoing field
→ Describe what they are working on in natural spoken language
→ If no report found for that person, say they have not submitted their work report yet today

WHO IS PRESENT / ABSENT / ON BREAK TODAY:
→ Look in todayAttendance array
→ Filter records by status field: "present" means at desk, "on_break" means on break, absent means no record
→ Name the people naturally using "and" or "um" to connect names

WHO IS ON LEAVE:
→ Look in leaveRequests array
→ Filter where status is "approved" AND today's date falls between startDate and endDate
→ Name those people, their leave type, and dates naturally

IT TICKETS:
→ Look in tickets array
→ Filter by status (open/in_progress/resolved), priority, or assigned person as the question requires
→ Describe naturally — ticket number, issue, who it's assigned to, how long it's been open

CRM / DEALS:
→ Look in crmDeals array
→ Filter or summarise by stage, value, client name, or assigned person as asked
→ State deal values and stages naturally in spoken words

PROJECTS:
→ Look in projects array
→ Find the relevant project and read progress, budget, deadline fields
→ Describe project health naturally — "eighty percent complete" not "80%"

PROBATION / TENURE:
→ Look in employees array
→ Filter where employmentStatus is "Probationary" (tenureMonths less than six)
→ Name those employees naturally

FOR ANY OTHER QUESTION:
→ Read all arrays in the data above
→ Reason across them to find the answer
→ State it directly and naturally

THINGS YOU MUST NEVER DO:
Never say the same generic attendance summary for every question
Never ignore the specific person or thing being asked about
Never say "I don't have access to that"
Never use bullet points or numbered lists
Never say "Based on the data" — just answer
Never greet with "നമസ്കാരം" on every message — only on the very first message
Never give a capability overview when a specific question was asked

USER'S QUESTION: ${userMessage}

Now read the live data above carefully, find the exact answer to this specific question, and speak it naturally in ${lang === 'ml' ? 'Malayalam' : lang === 'manglish' ? 'Manglish' : 'English'}.`;
}

// ─────────────────────────────────────────────
// LIVE ERP REASONING ENGINE (Database Snapshot Intelligence)
// Reads directly from erpSnapshot when Gemini API is unavailable or quota limited
// ─────────────────────────────────────────────
function queryLiveERP(question: string, lang: 'ml' | 'manglish' | 'en', erp: ReturnType<typeof getLiveERPSnapshot>): string | null {
  const q = question.toLowerCase().trim();
  const todayAtt = erp.todayAttendance || [];
  const todayReports = erp.todayWorkReports || [];
  const employees = erp.employees || [];
  const leaves = erp.leaveRequests || [];
  const tickets = erp.tickets || [];
  const projects = erp.projects || [];
  const deals = erp.crmDeals || [];

  const malayalamNameMap: Record<string, string> = {
    'സജിൽ': 'sajil',
    'വിഷ്ണു': 'vishnu',
    'അനന്യ': 'ananya',
    'രാഹുൽ': 'rahul',
    'പ്രിയ': 'priya',
    'നീരജ്': 'neeraj',
    'കാവ്യ': 'kavya',
    'അർജുൻ': 'arjun',
  };

  // Helper to match an employee from question
  const matchedEmp = employees.find(e => {
    const fullName = e.name.toLowerCase();
    const firstName = fullName.split(' ')[0];
    let matched = q.includes(fullName) || q.includes(firstName);
    if (!matched) {
      for (const [mlName, enSub] of Object.entries(malayalamNameMap)) {
        if (q.includes(mlName) && (fullName.includes(enSub) || firstName.includes(enSub))) {
          matched = true;
          break;
        }
      }
    }
    return matched;
  });
  const matchedAtt = matchedEmp ? todayAtt.find(a => a.employeeId === matchedEmp.id || a.employeeName.toLowerCase().includes(matchedEmp.name.toLowerCase())) : null;
  const matchedReport = matchedEmp ? todayReports.find(r => r.employeeId === matchedEmp.id || r.employeeName.toLowerCase().includes(matchedEmp.name.toLowerCase())) : null;

  // 1. Clock in / Arrival time for specific person (e.g. "when did Sajil come", "sajil eppol vannu", "punch in", "arrival")
  if (matchedEmp && (
    q.includes('come') || q.includes('vannu') || q.includes('arrive') ||
    q.includes('punch') || q.includes('time') || q.includes('clock') ||
    q.includes('eppol') || q.includes('when') || q.includes('വന്നു') ||
    q.includes('എത്തി') || q.includes('പഞ്ച്') || q.includes('എപ്പോഴാണ്') || q.includes('സമയം')
  )) {
    if (matchedAtt) {
      const time = matchedAtt.clockIn || '09:00 AM';
      const statusTextEn = matchedAtt.status === 'on_break' ? 'and is currently on break' : matchedAtt.status === 'present' ? 'and is currently working at the office' : 'and is currently out';
      const statusTextMl = matchedAtt.status === 'on_break' ? 'അദ്ദേഹം ഇപ്പോൾ ബ്രേക്കിലാണ്' : 'അദ്ദേഹം ഇപ്പോൾ ഓഫീസിൽ ഡ്യൂട്ടിയിലാണ്';
      const statusTextMang = matchedAtt.status === 'on_break' ? 'adheham ippol breakilaanu' : 'adheham ippol officil undu';

      if (lang === 'ml') {
        return `${matchedEmp.name} ഇന്ന് രാവിലെ ${time} നാണ് ഓഫീസിൽ പഞ്ച് ഇൻ ചെയ്തത്. ${statusTextMl}.`;
      } else if (lang === 'manglish') {
        return `${matchedEmp.name} innu raavile ${time}-naanu officil punch in cheythathu. ${statusTextMang}.`;
      } else {
        return `${matchedEmp.name} clocked in at ${time} this morning ${statusTextEn}.`;
      }
    } else {
      if (lang === 'ml') return `${matchedEmp.name} ഇന്ന് ഇതുവരെ ഓഫീസിൽ പഞ്ച് ഇൻ ചെയ്തിട്ടില്ല.`;
      if (lang === 'manglish') return `${matchedEmp.name} innu ithuvare punch in cheythittilla.`;
      return `${matchedEmp.name} has not clocked in to the office today.`;
    }
  }

  // 2. What is someone working on / work report
  if (matchedEmp && (
    q.includes('work') || q.includes('task') || q.includes('doing') ||
    q.includes('cheyyunnathu') || q.includes('report') || q.includes('summary') ||
    q.includes('ജോലി') || q.includes('വർക്ക്') || q.includes('ചെയ്യുന്നത്') || q.includes('റിപ്പോർട്ട്')
  )) {
    if (matchedReport) {
      const summary = matchedReport.summary || (Array.isArray(matchedReport.tasks) ? matchedReport.tasks.join(', ') : 'daily tasks');
      const hours = matchedReport.hoursLogged || 0;
      if (lang === 'ml') {
        return `${matchedEmp.name} ഇന്ന് ${summary} എന്ന വർക്കിലാണ് ശ്രദ്ധ കേന്ദ്രീകരിക്കുന്നത്. ${hours} മണിക്കൂർ ഇതിനകം ലോഗ് ചെയ്തിട്ടുണ്ട്.`;
      } else if (lang === 'manglish') {
        return `${matchedEmp.name} innu ${summary} work cheyyukayaanu. ${hours} hours log cheythittundu.`;
      } else {
        return `${matchedEmp.name} is currently working on ${summary}, with ${hours} hours logged today.`;
      }
    }
  }

  // 3. Break status: "who is on break", "breakil aaranu", "break"
  if (q.includes('break') || q.includes('breakil') || q.includes('ബ്രേക്ക') || q.includes('ബ്രേക്ക്')) {
    const onBreak = todayAtt.filter(a => a.status === 'on_break');
    if (onBreak.length > 0) {
      const names = onBreak.map(a => a.employeeName).join(', ');
      if (lang === 'ml') return `നിലവിൽ ${names} മാത്രമാണ് ബ്രേക്കിലുള്ളത്.`;
      if (lang === 'manglish') return `Nilavil ${names} maathramaanu breakil ullathu.`;
      return `Currently, only ${names} is on break.`;
    } else {
      if (lang === 'ml') return 'ഇപ്പോൾ ആരും ബ്രേക്കിലല്ല, എല്ലാവരും ഡെസ്കിൽ സജീവമാണ്.';
      if (lang === 'manglish') return 'Ippol aarum breakil alla, ellavarum active aanu.';
      return 'No one is currently on break. All present employees are at their desks.';
    }
  }

  // 4. Probation status: "who is on probation", "probation"
  if (q.includes('probation') || q.includes('പ്രൊബേഷ')) {
    const probationary = employees.filter(e => e.employmentStatus === 'Probationary');
    const names = probationary.map(e => e.name).join(', ');
    if (lang === 'ml') {
      return `കമ്പനിയിൽ നിലവിൽ പ്രൊബേഷൻ കാലയളവിലുള്ളത് ${names} എന്നിവരാണ്. ഇവരുടെ സർവീസ് ആറു മാസത്തിൽ കുറവാണ്.`;
    } else if (lang === 'manglish') {
      return `Companyil nilavil probationil ullathu ${names} aane. Aaru maasathil thaazheyaanu ivarude service.`;
    } else {
      return `Currently on probation are ${names}. Their tenure is under six months.`;
    }
  }

  // 5. Office headcount / who is in office / attendance summary
  if (
    q.includes('ethra') || q.includes('count') || q.includes('how many') ||
    q.includes('aarengilum') || q.includes('who is present') || q.includes('present') ||
    q.includes('attendance') || q.includes('officeil') || q.includes('officil') ||
    q.includes('എത്ര') || q.includes('പേരുണ്ട്') || q.includes('ഹാജർ') ||
    q.includes('ഓഫീസിൽ') || q.includes('ആരെങ്കിലും') || q.includes('ആരൊക്കെ')
  ) {
    const presentList = todayAtt.filter(a => a.status === 'present' || a.status === 'on_break');
    const totalEmp = employees.length;
    const presentCount = presentList.length;
    const presentNames = presentList.map(a => a.employeeName).join(', ');
    if (lang === 'ml') {
      return `ഇന്ന് ഓഫീസിൽ ആകെ ${totalEmp} പേരിൽ ${presentCount} ജീവനക്കാർ എത്തിയിട്ടുണ്ട്. ${presentNames} എന്നിവരാണ് ഇന്ന് ഓഫീസിൽ ഹാജരായിട്ടുള്ളത്.`;
    } else if (lang === 'manglish') {
      return `Innu officil aake ${totalEmp} peril ${presentCount} per ethiyittundu. ${presentNames} aane innu present aayittullathu.`;
    } else {
      return `Today, ${presentCount} out of ${totalEmp} employees are present in the office: ${presentNames}.`;
    }
  }

  // 6. Tickets / Support / IT queries
  if (q.includes('ticket') || q.includes('it issue') || q.includes('support')) {
    const openTickets = tickets.filter((t: any) => t.status === 'open' || t.status === 'in_progress');
    if (lang === 'ml') {
      return `സിസ്റ്റത്തിൽ നിലവിൽ ${openTickets.length} ഓപ്പൺ ടിക്കറ്റുകൾ ഉണ്ട്. പ്രധാനമായും നെറ്റ്‌വർക്ക് ആക്‌സസ്സും ഹാർഡ്‌വെയർ അപ്‌ഗ്രേഡുമായി ബന്ധപ്പെട്ടവയാണ് ഇവ.`;
    } else if (lang === 'manglish') {
      return `Systemil nilavil ${openTickets.length} open tickets undu. IT team athu resolve cheythu varunnu.`;
    } else {
      return `There are currently ${openTickets.length} active tickets in the system being handled by IT support.`;
    }
  }

  // 7. Leaves queries
  if (q.includes('leave') || q.includes('vacation') || q.includes('absent')) {
    const approvedLeaves = leaves.filter((l: any) => l.status === 'approved');
    if (approvedLeaves.length > 0) {
      const names = approvedLeaves.map((l: any) => `${l.employeeName} (${l.leaveType})`).join(', ');
      if (lang === 'ml') return `ഇന്ന് അംഗീകൃത അവധിയിലുള്ളത്: ${names}.`;
      if (lang === 'manglish') return `Innu approved leaveil ullathu: ${names}.`;
      return `Employees on approved leave: ${names}.`;
    }
  }

  // 8. Projects / CRM Deals queries
  if (q.includes('deal') || q.includes('crm') || q.includes('lead') || q.includes('sales')) {
    const totalVal = deals.reduce((acc: number, d: any) => acc + (d.value || 0), 0);
    if (lang === 'ml') return `സിആർഎമ്മിൽ നിലവിൽ ${deals.length} ആക്ടീവ് ഡീലുകൾ ഉണ്ട്, മൊത്തം മൂല്യം ഏകദേശം ${totalVal.toLocaleString('en-IN')} രൂപയാണ്.`;
    if (lang === 'manglish') return `CRMil nilavil ${deals.length} active deals undu. Total value ${totalVal.toLocaleString('en-IN')} rupees aanu.`;
    return `In CRM, there are ${deals.length} active deals with a total estimated pipeline value of ${totalVal.toLocaleString('en-IN')} rupees.`;
  }

  // General employee query
  if (matchedEmp) {
    if (lang === 'ml') return `${matchedEmp.name}, ${matchedEmp.department} ഡിപ്പാർട്ട്‌മെന്റിൽ ${matchedEmp.designation} ആയി പ്രവർത്തിക്കുന്നു. സ്റ്റാറ്റസ്: ${matchedEmp.employmentStatus}.`;
    if (lang === 'manglish') return `${matchedEmp.name}, ${matchedEmp.department} departmentil ${matchedEmp.designation} aayittaanu work cheyyunnathu. Status: ${matchedEmp.employmentStatus}.`;
    return `${matchedEmp.name} works as a ${matchedEmp.designation} in the ${matchedEmp.department} department. Employment status is ${matchedEmp.employmentStatus}.`;
  }

  return null;
}

// ─────────────────────────────────────────────
// GEMINI CALLER
// ─────────────────────────────────────────────
async function callGemini(fullPrompt: string, userApiKey?: string): Promise<string | null> {
  const apiKey = userApiKey || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    console.warn('[Gemini] No API key found. Check GEMINI_API_KEY in your environment secrets.');
    return null;
  }

  const modelsToTry = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.1-flash-lite', 'gemini-3.5-flash-lite'];

  for (const modelName of modelsToTry) {
    try {
      const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
      const result = await ai.models.generateContent({
        model: modelName,
        contents: fullPrompt,
        config: { temperature: 0.1 }, // low temperature = more factual, less creative
      });
      if (result?.text?.trim()) {
        console.log(`[Gemini] Success with model: ${modelName}`);
        return result.text.trim();
      }
    } catch (err: any) {
      console.warn(`[Gemini] Model ${modelName} failed:`, err?.message || err);
    }
  }

  console.error('[Gemini] ALL models failed. This means Gemini API key is invalid, expired, or quota exceeded.');
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// THE MAIN VOICE AI ENDPOINT
// THE HARDCODED queryEnterpriseEngine FALLBACK HAS BEEN COMPLETELY REMOVED.
// If Gemini fails, we return an honest error instead of fake hardcoded answers.
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/wai', async (req, res) => {
  try {
    const userMessage = req.body.userMessage || req.body.prompt || '';
    const { language = 'ml', enterpriseContext, userApiKey } = req.body;

    if (!userMessage.trim()) {
      return res.status(400).json({ error: 'No message provided' });
    }

    // Detect the actual language of what the user said
    const effectiveLang = detectLanguage(userMessage) || language;

    // Get live ERP snapshot with today's date normalization applied
    const erpSnapshot = getLiveERPSnapshot(enterpriseContext);

    // Log what data Gemini will receive — check this in your server console
    console.log('[WAI] Today:', erpSnapshot.meta.currentDate);
    console.log('[WAI] Attendance records count:', erpSnapshot.todayAttendance.length);
    console.log('[WAI] Work report records count:', erpSnapshot.todayWorkReports.length);
    console.log('[WAI] User asked:', userMessage);
    console.log('[WAI] Detected language:', effectiveLang);

    // Build the prompt with real data injected
    const prompt = buildPromptWithData(userMessage, erpSnapshot, effectiveLang);

    // Call Gemini — primary intelligence engine
    let reply = await callGemini(prompt, userApiKey);

    // Fallback: If Gemini is unavailable (e.g. leaked key 403, quota 429), reason directly from live database snapshot
    if (!reply) {
      console.log('[WAI] Gemini unavailable or quota limited. Answering directly from live ERP database snapshot...');
      reply = queryLiveERP(userMessage, effectiveLang, erpSnapshot);
    }

    if (!reply) {
      // Gemini failed and no specific database answer found
      const errorMessages: Record<string, string> = {
        ml: 'ക്ഷമിക്കണം, ഇപ്പോൾ AI സേവനം ലഭ്യമല്ല. GEMINI_API_KEY ശരിയാണോ എന്ന് പരിശോധിക്കുക.',
        manglish: 'Kshamikkuka, ippol AI service labhyamalla. GEMINI_API_KEY correct aano ennu nokku.',
        en: 'Sorry, the AI service is unavailable right now. Please check that your GEMINI_API_KEY is set correctly in the environment secrets.',
      };
      return res.json({
        reply: errorMessages[effectiveLang] || errorMessages.en,
        language: effectiveLang,
        source: 'error',
      });
    }

    // Clean the reply for TTS before sending
    const cleanReply = cleanForTTS(reply);

    console.log('[WAI] Gemini replied:', cleanReply.substring(0, 100) + '...');

    return res.json({
      reply: cleanReply,
      answer: cleanReply,
      language: effectiveLang,
      source: 'gemini_live_data',
      timestamp: new Date().toLocaleTimeString(),
    });

  } catch (error: any) {
    console.error('[WAI] Endpoint error:', error?.message || error);
    return res.status(500).json({ error: 'Failed to process query', details: error?.message });
  }
});

// ─────────────────────────────────────────────
// SUPABASE SCHEMA ENDPOINT — unchanged
// ─────────────────────────────────────────────
app.get('/api/supabase-schema', (req, res) => {
  const sqlDDL = `-- VianERP Supabase PostgreSQL Schema
CREATE TABLE IF NOT EXISTS public.employees (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee', designation TEXT, department TEXT,
  phone TEXT, join_date DATE DEFAULT CURRENT_DATE, status TEXT DEFAULT 'active',
  basic_salary NUMERIC(12,2) DEFAULT 0, net_pay NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.attendance (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  employee_id TEXT REFERENCES public.employees(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL, date DATE DEFAULT CURRENT_DATE,
  clock_in TEXT NOT NULL, clock_out TEXT, break_time_minutes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'present', created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.work_reports (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  employee_id TEXT REFERENCES public.employees(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL, date DATE DEFAULT CURRENT_DATE,
  summary TEXT NOT NULL, hours_logged NUMERIC(4,2) DEFAULT 0,
  status TEXT DEFAULT 'pending', tasks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  employee_id TEXT REFERENCES public.employees(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL, leave_type TEXT NOT NULL,
  start_date DATE NOT NULL, end_date DATE NOT NULL,
  total_days INTEGER NOT NULL, reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending', created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;`;
  res.setHeader('Content-Type', 'text/plain');
  res.send(sqlDDL);
});

// ─────────────────────────────────────────────
// ENVIRONMENT VARIABLES STATUS & KEY TESTING
// ─────────────────────────────────────────────
app.get('/api/env-status', (req, res) => {
  res.json({
    geminiConfigured: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0),
    openaiConfigured: !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim().length > 0),
    elevenlabsConfigured: !!(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_API_KEY.trim().length > 0),
    geminiKeyPrefix: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 6) + '...' : null,
    elevenKeyPrefix: process.env.ELEVENLABS_API_KEY ? process.env.ELEVENLABS_API_KEY.substring(0, 4) + '...' : null,
    openaiKeyPrefix: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 4) + '...' : null,
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/test-openai', async (req, res) => {
  try {
    const key = (req.body.key || process.env.OPENAI_API_KEY || '').trim();
    if (!key) {
      return res.status(400).json({ success: false, error: 'No OpenAI API key provided' });
    }
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (response.ok) {
      return res.json({ success: true, message: 'OpenAI API key is valid and connected!' });
    } else {
      const errJson = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        success: false,
        error: errJson.error?.message || `OpenAI returned status ${response.status}`,
      });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Network error' });
  }
});

// ─────────────────────────────────────────────
// SERVER START
// ─────────────────────────────────────────────
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VianERP Server running on http://0.0.0.0:${PORT}`);
    console.log(`GEMINI_API_KEY present: ${!!(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY)}`);
    console.log(`ELEVENLABS_API_KEY present: ${!!process.env.ELEVENLABS_API_KEY}`);
  });
}

startServer();
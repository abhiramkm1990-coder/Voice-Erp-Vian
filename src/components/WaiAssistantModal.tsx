import React, { useState, useEffect, useRef } from 'react';
import {
  WAILanguage,
  WAIQueryResponse,
  Employee,
  AttendanceRecord,
  WorkReport,
  LeaveRequest,
  Project,
  CRMLead,
  SupportTicket,
} from '../types';
import { useWhisperSTT, playEleven, stopAudioPlayback } from '../lib/voicePipe';
import { processLocalWAIQuery, detectQueryLanguage } from '../lib/waiCore';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  X,
  Sparkles,
  Bot,
  RefreshCw,
  Globe,
  Settings,
  Zap,
} from 'lucide-react';

interface WaiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Employee;
  employees: Employee[];
  attendance: AttendanceRecord[];
  workReports: WorkReport[];
  leaveRequests: LeaveRequest[];
  projects: Project[];
  crmLeads: CRMLead[];
  tickets: SupportTicket[];
  geminiApiKey: string;
  onOpenSettings: () => void;
}

export const WaiAssistantModal: React.FC<WaiAssistantModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  employees,
  attendance,
  workReports,
  leaveRequests,
  projects,
  crmLeads,
  tickets,
  geminiApiKey,
  onOpenSettings,
}) => {
  const [selectedLang, setSelectedLang] = useState<WAILanguage>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('vian_assistant_lang') : null;
    return (saved === 'ml' || saved === 'en' || saved === 'hi') ? (saved as WAILanguage) : 'ml';
  });
  const [inputText, setInputText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<
    { sender: 'user' | 'wai'; text: string; language?: WAILanguage; actionSuggested?: string; timestamp: string }[]
  >([
    {
      sender: 'wai',
      text: 'നമസ്കാരം! ഞാൻ **വിയാൻ വോയ്സ് AI (Vian Voice AI)** ആണ്. Vianinfo Solutions-ന്റെ ഔദ്യോഗിക എന്റർപ്രൈസ് വോയ്സ് & ടെക്സ്റ്റ് അസിസ്റ്റന്റ്. നിങ്ങൾ സംസാരിക്കുന്ന അതേ ഭാഷയിൽ (മലയാളം അല്ലെങ്കിൽ ഇംഗ്ലീഷ്) ഞാൻ ഉത്തരം നൽകും.\n\nചോദിച്ചു നോക്കൂ: *"ഇന്ന് ആരൊക്കെ ഓഫീസിൽ വന്നിട്ടുണ്ട്?"*, *"എന്റെ ലീവ് ബാലൻസ് എത്ര?"*, അല്ലെങ്കിൽ *"Who came to office today?"*',
      language: 'ml',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const lastTranscriptRef = useRef<string>('');

  const {
    start: startWhisper,
    stop: stopWhisper,
    listening: whisperListening,
    transcribing: whisperTranscribing,
    transcript: whisperTranscript,
    audioLevel,
  } = useWhisperSTT({
    defaultLang: selectedLang === 'ml' ? 'ml' : 'en',
    onTranscript: (capturedText) => {
      if (capturedText && capturedText.trim() && capturedText !== lastTranscriptRef.current) {
        lastTranscriptRef.current = capturedText.trim();
        setInputText(capturedText.trim());
        handleSubmitQuery(capturedText.trim());
      }
    },
  });

  const isListening = whisperListening;

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isLoading]);

  // Fallback auto-submit if onTranscript missed
  useEffect(() => {
    if (!whisperListening && !whisperTranscribing && whisperTranscript && whisperTranscript !== lastTranscriptRef.current) {
      lastTranscriptRef.current = whisperTranscript;
      setInputText(whisperTranscript);
      handleSubmitQuery(whisperTranscript);
    }
  }, [whisperListening, whisperTranscribing, whisperTranscript]);

  // Handle Speech Recognition Toggle (Whisper STT via backend)
  const toggleListening = (langOverride?: WAILanguage) => {
    if (whisperListening || whisperTranscribing) {
      stopWhisper();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      alert('Microphone access is not supported by your browser. You can type queries directly below!');
      return;
    }
    const targetLang = langOverride || selectedLang;
    startWhisper(targetLang === 'ml' ? 'ml' : 'en');
  };

  const handleLanguageChange = (newLang: WAILanguage) => {
    setSelectedLang(newLang);
    try {
      localStorage.setItem('vian_assistant_lang', newLang);
    } catch (_) {}
    if (whisperListening) {
      stopWhisper();
      setTimeout(() => {
        startWhisper(newLang === 'ml' ? 'ml' : 'en');
      }, 300);
    }
  };

  const handleClose = () => {
    stopWhisper();
    stopAudioPlayback();
    setIsSpeaking(false);
    onClose();
  };

  // Submit Query to WAI - Strictly matches query language!
  const handleSubmitQuery = async (queryToSubmit?: string) => {
    const text = (queryToSubmit || inputText).trim();
    if (!text || isLoading) return;

    // Detect language of the query text (Malayalam Unicode, Manglish keywords, or Hindi)
    const detectedLang = detectQueryLanguage(text);

    // CRITICAL: If the user spoke or typed Malayalam (script or Manglish) or Hindi,
    // we MUST respond in that same language!
    let targetLanguage: WAILanguage = selectedLang;
    if (detectedLang === 'ml' || detectedLang === 'hi') {
      targetLanguage = detectedLang;
    } else if (selectedLang === 'en') {
      targetLanguage = 'en';
    } else if (detectedLang === 'en' && text.split(' ').length >= 2 && !/[\u0D00-\u0D7F]/.test(text)) {
      // User explicitly typed or spoke English words while in Malayalam mode
      targetLanguage = 'en';
    } else {
      targetLanguage = selectedLang;
    }

    // Automatically synchronize UI selected language to match what user spoke/typed
    if (targetLanguage !== selectedLang) {
      setSelectedLang(targetLanguage);
      try {
        localStorage.setItem('vian_assistant_lang', targetLanguage);
      } catch (_) {}
    }

    const userTimestamp = new Date().toLocaleTimeString();
    setChatHistory((prev) => [
      ...prev,
      { sender: 'user', text: text, language: targetLanguage, timestamp: userTimestamp },
    ]);

    setInputText('');
    setIsLoading(true);

    const enterpriseState = {
      employees,
      attendance,
      workReports,
      leaveRequests,
      projects,
      crmLeads,
      tickets,
      currentUser,
    };

    try {
      // First try server-side endpoint with Gemini / OpenAI if configured
      let waiAnswer: WAIQueryResponse | null = null;

      try {
        const res = await fetch('/api/wai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userMessage: text,
            prompt: text,
            language: targetLanguage,
            enterpriseContext: enterpriseState,
            userApiKey: geminiApiKey || ((import.meta as any).env?.VITE_GEMINI_API_KEY as string) || '',
            currentRole: currentUser.role,
            currentUser: currentUser,
          }),
        });

        const data = await res.json();
        if (data.reply || data.answer) {
          waiAnswer = {
            answer: data.reply || data.answer,
            language: data.language || targetLanguage,
            contextType: 'general',
            timestamp: data.timestamp || new Date().toLocaleTimeString(),
          };
        }
      } catch (err) {
        console.log('Gemini server route fallback to local engine:', err);
      }

      // If cloud model not available, process with rich local query engine in the exact same language
      if (!waiAnswer) {
        waiAnswer = processLocalWAIQuery(text, enterpriseState, targetLanguage);
      }

      const responseText = waiAnswer.answer;
      const respLang = waiAnswer.language || targetLanguage;

      setChatHistory((prev) => [
        ...prev,
        {
          sender: 'wai',
          text: responseText,
          language: respLang,
          actionSuggested: waiAnswer.actionSuggested,
          timestamp: waiAnswer.timestamp,
        },
      ]);

      // Speak response using ElevenLabs TTS or high-fidelity browser voice fallback in the matching language!
      setIsSpeaking(true);
      playEleven(
        responseText,
        respLang === 'ml' ? 'ml' : 'en',
        () => setIsSpeaking(true),
        () => setIsSpeaking(false)
      ).finally(() => setIsSpeaking(false));
    } catch (error) {
      console.error('Error in WAI query processing:', error);
      setChatHistory((prev) => [
        ...prev,
        {
          sender: 'wai',
          text: targetLanguage === 'ml'
            ? 'ക്ഷമിക്കണം, നിങ്ങളുടെ ചോദ്യം പ്രോസസ്സ് ചെയ്യുന്നതിൽ തടസ്സം നേരിട്ടു. ദയവായി വീണ്ടും ചോദിക്കുക.'
            : 'Apologies, I encountered an error processing your query. Please try again.',
          language: targetLanguage,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = (text: string, lang: WAILanguage = selectedLang) => {
    setIsSpeaking(true);
    playEleven(
      text,
      lang === 'ml' ? 'ml' : 'en',
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    ).finally(() => setIsSpeaking(false));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl h-[85vh] flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-700 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-cyan-200 border border-white/20">
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold tracking-tight">Vian Voice AI</h2>
                <span className="bg-cyan-400/20 text-cyan-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-cyan-300/30">
                  Fluent Malayalam AI
                </span>
              </div>
              <p className="text-xs text-cyan-100">Voice & Text Enterprise Intelligence for Vianinfo</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer text-xs flex items-center space-x-1"
              title="Configure Gemini API Key"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline font-medium">
                {geminiApiKey ? 'Gemini AI Connected' : 'Vian Voice AI Active'}
              </span>
            </button>
            <button
              onClick={handleClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Language Selection Bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-semibold text-slate-600">Speech & Response:</span>
            <div className="flex bg-slate-200/80 p-0.5 rounded-xl">
              <button
                onClick={() => handleLanguageChange('ml')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedLang === 'ml'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                മലയാളം (Malayalam)
              </button>
              <button
                onClick={() => handleLanguageChange('en')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedLang === 'en'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                English
              </button>
              <button
                onClick={() => handleLanguageChange('hi')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedLang === 'hi'
                    ? 'bg-white text-orange-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                हिंदी (Hindi)
              </button>
            </div>
          </div>

          {isSpeaking && (
            <div className="flex items-center space-x-1.5 text-xs text-cyan-700 font-semibold bg-cyan-50 px-2.5 py-1 rounded-full border border-cyan-200">
              <Volume2 className="w-3.5 h-3.5 animate-bounce text-cyan-600" />
              <span>Speaking response...</span>
              <button
                onClick={() => handleSpeak('')}
                className="ml-1 text-slate-400 hover:text-slate-700"
              >
                <VolumeX className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Preset Quick Query Chips */}
        <div className="bg-white border-b border-slate-100 p-2.5 px-4 overflow-x-auto no-scrollbar flex items-center space-x-2 text-xs">
          <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap uppercase">
            Suggested ({currentUser.role === 'employee' ? 'Employee View' : 'Admin View'}):
          </span>
          {currentUser.role === 'employee' ? (
            <>
              <button
                onClick={() => handleSubmitQuery('When did I clock in today?')}
                className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/60 font-medium whitespace-nowrap cursor-pointer transition-colors"
              >
                "When did I clock in today?"
              </button>
              <button
                onClick={() => {
                  setSelectedLang('ml');
                  handleSubmitQuery('എന്റെ ലീവ് ബാലൻസ് എത്ര?');
                }}
                className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200/60 font-medium whitespace-nowrap cursor-pointer transition-colors"
              >
                "എന്റെ ലീവ് ബാലൻസ് എത്ര?"
              </button>
              <button
                onClick={() => handleSubmitQuery('What are my assigned tasks for today?')}
                className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/60 font-medium whitespace-nowrap cursor-pointer transition-colors"
              >
                "My assigned tasks today?"
              </button>
              <button
                onClick={() => handleSubmitQuery('Show my monthly payslip summary')}
                className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60 font-medium whitespace-nowrap cursor-pointer transition-colors"
              >
                "My payslip summary"
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setSelectedLang('ml');
                  handleSubmitQuery('അടുത്തത് ആരുടെ ബർത്ത്ഡേ ആണ് വരുന്നത്?');
                }}
                className="px-2.5 py-1 rounded-lg bg-pink-50 text-pink-700 hover:bg-pink-100 border border-pink-200/60 font-medium whitespace-nowrap cursor-pointer transition-colors"
              >
                🎂 "അടുത്തത് ആരുടെ ബർത്ത്ഡേ ആണ് വരുന്നത്?"
              </button>
              <button
                onClick={() => handleSubmitQuery('Who came to the office today?')}
                className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/60 font-medium whitespace-nowrap cursor-pointer transition-colors"
              >
                "Who came to office today?"
              </button>
              <button
                onClick={() => {
                  setSelectedLang('ml');
                  handleSubmitQuery('ഇന്ന് ആരൊക്കെ ഓഫീസിൽ വന്നിട്ടുണ്ട്?');
                }}
                className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200/60 font-medium whitespace-nowrap cursor-pointer transition-colors"
              >
                "ഇന്ന് ആരൊക്കെ ഓഫീസിൽ വന്നിട്ടുണ്ട്?"
              </button>
              <button
                onClick={() => handleSubmitQuery("Who hasn't submitted their daily work report?")}
                className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/60 font-medium whitespace-nowrap cursor-pointer transition-colors"
              >
                "Pending work reports?"
              </button>
              <button
                onClick={() => handleSubmitQuery('What is Vishnu working on right now?')}
                className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60 font-medium whitespace-nowrap cursor-pointer transition-colors"
              >
                "What is Vishnu working on?"
              </button>
              <button
                onClick={() => handleSubmitQuery('What is our total CRM lead pipeline value?')}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60 font-medium whitespace-nowrap cursor-pointer transition-colors"
              >
                "CRM Pipeline Value?"
              </button>
            </>
          )}
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/50">
          {chatHistory.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start space-x-3 ${
                msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              {msg.sender === 'wai' ? (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
              ) : (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-xl object-cover ring-2 ring-blue-500 shrink-0"
                />
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white shadow-xs rounded-tr-none'
                    : 'bg-white text-slate-800 border border-slate-200 shadow-xs rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-line font-normal">{msg.text}</div>

                {msg.sender === 'wai' && (
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <button
                      onClick={() => handleSpeak(msg.text, msg.language)}
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Listen</span>
                    </button>
                    {msg.actionSuggested && (
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold text-[10px]">
                        💡 {msg.actionSuggested}
                      </span>
                    )}
                    <span>{msg.timestamp}</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center space-x-3 text-slate-500 text-xs font-medium">
              <div className="w-8 h-8 rounded-xl bg-cyan-600 flex items-center justify-center text-white">
                <RefreshCw className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-white border border-slate-200 px-4 py-2 rounded-2xl text-slate-600">
                WAI is scanning enterprise records & generating answer...
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Live Audio Waveform Visualizer (Gemini Live Style) when Listening, Transcribing or Speaking */}
        {(whisperListening || whisperTranscribing || isSpeaking) && (
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-t border-cyan-500/30 p-3 px-5 flex items-center justify-between text-white text-xs font-semibold shadow-inner">
            <div className="flex items-center space-x-3">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
              </div>
              <div>
                <span className="font-bold text-cyan-300">
                  {whisperTranscribing
                    ? 'Transcribing Speech with Whisper AI...'
                    : whisperListening
                    ? `Hands-free VAD Active (${selectedLang.toUpperCase()})`
                    : `Vian Voice AI Speaking (${selectedLang.toUpperCase()})`}
                </span>
                <p className="text-[10px] text-slate-400">
                  {whisperTranscribing
                    ? 'Processing audio stream with speech-to-text pipeline...'
                    : whisperListening
                    ? 'Speak naturally — pause to submit automatically, or click Stop'
                    : 'Audio response stream rendering'}
                </p>
              </div>
            </div>

            {/* Live Reactive Waveform Equalizer Bars */}
            <div className="flex items-center space-x-1 h-6">
              {[0.4, 0.9, 0.6, 1.0, 0.5, 0.8].map((scale, i) => {
                const dynamicHeight = whisperListening
                  ? Math.max(15, Math.min(100, (audioLevel || 20) * scale))
                  : whisperTranscribing
                  ? 40 + Math.sin(Date.now() / 150 + i) * 30
                  : isSpeaking
                  ? 50 + Math.sin(Date.now() / 100 + i) * 40
                  : 20;
                return (
                  <span
                    key={i}
                    className="w-1 bg-gradient-to-t from-cyan-400 to-teal-300 rounded-full transition-all duration-75"
                    style={{ height: `${dynamicHeight}%` }}
                  />
                );
              })}
            </div>

            <div className="flex items-center space-x-2">
              {(whisperListening || whisperTranscribing) && (
                <button
                  type="button"
                  onClick={stopWhisper}
                  className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer"
                >
                  Stop / Submit
                </button>
              )}
              {isSpeaking && (
                <button
                  type="button"
                  onClick={() => {
                    stopAudioPlayback();
                    setIsSpeaking(false);
                  }}
                  className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer"
                >
                  Stop Voice
                </button>
              )}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200">
          <div className="flex items-center justify-between mb-2 text-xs">
            <div className="flex items-center space-x-1.5 text-slate-600">
              <span className={`w-2 h-2 rounded-full ${selectedLang === 'ml' ? 'bg-emerald-500' : 'bg-blue-500'} animate-pulse`} />
              <span>
                {selectedLang === 'ml' ? (
                  <span>വോയ്സ് & ടെക്സ്റ്റ് മോഡ്: <strong className="text-emerald-700 font-bold">മലയാളം (ml-IN)</strong> — മൈക്കിൽ സംസാരിക്കുമ്പോൾ മലയാളത്തിൽ മറുപടി നൽകും</span>
                ) : selectedLang === 'hi' ? (
                  <span>Voice Mode: <strong className="text-orange-700 font-bold">हिंदी (hi-IN)</strong></span>
                ) : (
                  <span>Voice & Text Mode: <strong className="text-blue-700 font-bold">English (en-US)</strong> — Speaks and responds in English</span>
                )}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleLanguageChange(selectedLang === 'ml' ? 'en' : 'ml')}
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
            >
              {selectedLang === 'ml' ? 'Switch to English' : 'മലയാളത്തിലേക്ക് മാറ്റുക'}
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmitQuery();
            }}
            className="flex items-center space-x-2"
          >
            {/* Mic Toggle Button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-3 rounded-2xl transition-all cursor-pointer ${
                whisperListening
                  ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
                  : whisperTranscribing
                  ? 'bg-amber-500 text-white animate-bounce shadow-md shadow-amber-500/30'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              title={
                whisperListening
                  ? 'Stop and submit recording'
                  : whisperTranscribing
                  ? 'Transcribing audio...'
                  : 'Start Voice Speech-to-Text'
              }
            >
              {whisperListening ? (
                <MicOff className="w-5 h-5" />
              ) : whisperTranscribing ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Mic className="w-5 h-5 text-blue-600" />
              )}
            </button>

            {/* Query Input Box */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Ask WAI in ${
                selectedLang === 'ml' ? 'Malayalam' : selectedLang === 'hi' ? 'Hindi' : 'English'
              }...`}
              className="flex-1 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl px-4 py-3 text-sm outline-hidden transition-all text-slate-800"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 rounded-2xl hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer shadow-md shadow-blue-500/20"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

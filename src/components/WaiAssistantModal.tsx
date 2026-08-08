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
import {
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  speakText,
  stopSpeech,
  getLanguageCode,
} from '../lib/speech';
import { processLocalWAIQuery } from '../lib/waiCore';
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
  const [selectedLang, setSelectedLang] = useState<WAILanguage>('en');
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<
    { sender: 'user' | 'wai'; text: string; language?: WAILanguage; actionSuggested?: string; timestamp: string }[]
  >([
    {
      sender: 'wai',
      text: 'Hello! I am **Vian Voice AI**, your Enterprise AI Voice & Text Assistant for Vianinfo Solutions. How can I assist you today? Try asking: *"Who has an upcoming birthday this month?"* or *"അടുത്തത് ആരുടെ ബർത്ത്ഡേ ആണ് വരുന്നത്?"*',
      language: 'en',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const lastTranscriptRef = useRef<string>('');

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isLoading]);

  // Handle Speech Recognition Toggle with Hands-Free Voice Activity Detection (VAD)
  const toggleListening = () => {
    if (!isSpeechRecognitionSupported()) {
      alert('Speech Recognition is not supported by your browser. You can type queries directly below!');
      return;
    }

    if (isListening) {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.lang = getLanguageCode(selectedLang);
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result) => result.transcript)
          .join('');

        setInputText(transcript);
        lastTranscriptRef.current = transcript;

        // VAD: Reset silence timer on every spoken result
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

        if (transcript.trim().length > 0) {
          silenceTimerRef.current = setTimeout(() => {
            // User finished speaking! Automatically submit audio hands-free
            if (recognitionRef.current) {
              try {
                recognitionRef.current.stop();
              } catch (e) {}
            }
            setIsListening(false);
            handleSubmitQuery(transcript);
          }, 1100); // 1.1s silence detection threshold
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error('Failed to start speech recognition:', e);
      setIsListening(false);
    }
  };

  // Submit Query to WAI
  const handleSubmitQuery = async (queryToSubmit?: string) => {
    const text = queryToSubmit || inputText;
    if (!text.trim() || isLoading) return;

    const userTimestamp = new Date().toLocaleTimeString();
    setChatHistory((prev) => [
      ...prev,
      { sender: 'user', text: text, language: selectedLang, timestamp: userTimestamp },
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
      // First try server-side endpoint with Gemini if configured
      let waiAnswer: WAIQueryResponse | null = null;

      try {
        const res = await fetch('/api/wai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: text,
            language: selectedLang,
            enterpriseContext: enterpriseState,
            userApiKey: geminiApiKey || ((import.meta as any).env?.VITE_GEMINI_API_KEY as string) || '',
            currentRole: currentUser.role,
            currentUser: currentUser,
          }),
        });

        const data = await res.json();
        if (data.answer) {
          waiAnswer = {
            answer: data.answer,
            language: selectedLang,
            contextType: 'general',
            timestamp: data.timestamp || new Date().toLocaleTimeString(),
          };
        }
      } catch (err) {
        console.log('Gemini server route fallback to local engine:', err);
      }

      // If Gemini not available, process with rich local query engine
      if (!waiAnswer) {
        waiAnswer = processLocalWAIQuery(text, enterpriseState, selectedLang);
      }

      const responseText = waiAnswer.answer;
      const respLang = waiAnswer.language || selectedLang;

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

      // Speak response using Web Speech Synthesis
      speakText(
        responseText,
        respLang,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false)
      );
    } catch (error) {
      console.error('Error in WAI query processing:', error);
      setChatHistory((prev) => [
        ...prev,
        {
          sender: 'wai',
          text: 'Apologies, I encountered an error processing your query. Please try again.',
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = (text: string, lang: WAILanguage = 'en') => {
    if (isSpeaking) {
      stopSpeech();
      setIsSpeaking(false);
    } else {
      speakText(
        text,
        lang,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false)
      );
    }
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
              onClick={onClose}
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
            <span className="text-xs font-semibold text-slate-600">Response Language:</span>
            <div className="flex bg-slate-200/80 p-0.5 rounded-xl">
              <button
                onClick={() => setSelectedLang('en')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedLang === 'en'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setSelectedLang('ml')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedLang === 'ml'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                മലയാളം (Malayalam)
              </button>
              <button
                onClick={() => setSelectedLang('hi')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedLang === 'hi'
                    ? 'bg-white text-blue-700 shadow-xs'
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

        {/* Live Audio Waveform Visualizer (Gemini Live Style) when Listening or Speaking */}
        {(isListening || isSpeaking) && (
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-t border-cyan-500/30 p-3 px-5 flex items-center justify-between text-white text-xs font-semibold shadow-inner">
            <div className="flex items-center space-x-3">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
              </div>
              <div>
                <span className="font-bold text-cyan-300">
                  {isListening
                    ? `Hands-free VAD Active (${selectedLang.toUpperCase()})`
                    : `WAI Speaking (${selectedLang.toUpperCase()})`}
                </span>
                <p className="text-[10px] text-slate-400">
                  {isListening
                    ? 'Speak naturally — query processes automatically on pause'
                    : 'Audio response stream rendering'}
                </p>
              </div>
            </div>

            {/* Live Waveform Equalizer Bars */}
            <div className="flex items-center space-x-1 h-6">
              <span className="w-1 bg-cyan-400 rounded-full animate-[bounce_1s_infinite_100ms] h-3"></span>
              <span className="w-1 bg-teal-400 rounded-full animate-[bounce_1s_infinite_300ms] h-6"></span>
              <span className="w-1 bg-blue-400 rounded-full animate-[bounce_1s_infinite_150ms] h-4"></span>
              <span className="w-1 bg-indigo-400 rounded-full animate-[bounce_1s_infinite_400ms] h-5"></span>
              <span className="w-1 bg-cyan-300 rounded-full animate-[bounce_1s_infinite_200ms] h-2"></span>
              <span className="w-1 bg-teal-300 rounded-full animate-[bounce_1s_infinite_250ms] h-6"></span>
            </div>

            {isListening && (
              <button
                onClick={toggleListening}
                className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer"
              >
                Cancel Mic
              </button>
            )}
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200">
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
                isListening
                  ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              title={isListening ? 'Stop Speech Recognition' : 'Start Voice Speech-to-Text'}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-blue-600" />}
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

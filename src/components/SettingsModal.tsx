import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  Database,
  Check,
  Copy,
  Shield,
  Sparkles,
  Server,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Volume2,
  Bot,
  Mic,
  Trash2,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  geminiApiKey: string;
  onSaveGeminiApiKey: (key: string) => void;
  elevenLabsApiKey?: string;
  onSaveElevenLabsApiKey?: (key: string) => void;
  openAiApiKey?: string;
  onSaveOpenAiApiKey?: (key: string) => void;
}

interface EnvStatus {
  geminiConfigured: boolean;
  openaiConfigured: boolean;
  elevenlabsConfigured: boolean;
  geminiKeyPrefix?: string | null;
  elevenKeyPrefix?: string | null;
  openaiKeyPrefix?: string | null;
  timestamp?: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  geminiApiKey,
  onSaveGeminiApiKey,
  elevenLabsApiKey = '',
  onSaveElevenLabsApiKey,
  openAiApiKey = '',
  onSaveOpenAiApiKey,
}) => {
  const [activeTab, setActiveTab] = useState<'env' | 'supabase'>('env');

  // Input states
  const [geminiInput, setGeminiInput] = useState(geminiApiKey);
  const [elevenInput, setElevenInput] = useState(elevenLabsApiKey);
  const [openAiInput, setOpenAiInput] = useState(openAiApiKey);

  const [isSaved, setIsSaved] = useState(false);
  const [savedKeyType, setSavedKeyType] = useState<string | null>(null);
  const [copiedVar, setCopiedVar] = useState<string | null>(null);

  const [isCopyingSql, setIsCopyingSql] = useState(false);
  const [sqlSchemaText, setSqlSchemaText] = useState<string | null>(null);

  // Server env diagnostic state
  const [envStatus, setEnvStatus] = useState<EnvStatus | null>(null);
  const [loadingEnv, setLoadingEnv] = useState(false);
  const [testStatus, setTestStatus] = useState<{ [key: string]: 'idle' | 'testing' | 'success' | 'error' }>({});
  const [testMessage, setTestMessage] = useState<{ [key: string]: string }>({});

  // Sync inputs when props change
  useEffect(() => {
    setGeminiInput(geminiApiKey);
  }, [geminiApiKey]);

  useEffect(() => {
    setElevenInput(elevenLabsApiKey);
  }, [elevenLabsApiKey]);

  useEffect(() => {
    setOpenAiInput(openAiApiKey);
  }, [openAiApiKey]);

  // Fetch server env status on modal open
  const fetchEnvStatus = async () => {
    setLoadingEnv(true);
    try {
      const res = await fetch('/api/env-status');
      if (res.ok) {
        const data = await res.json();
        setEnvStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch env status:', err);
    } finally {
      setLoadingEnv(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEnvStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedVar(text);
      setTimeout(() => setCopiedVar(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleSaveGeminiKey = () => {
    onSaveGeminiApiKey(geminiInput.trim());
    setSavedKeyType('gemini');
    setTimeout(() => setSavedKeyType(null), 2500);
  };

  const handleSaveOpenAiKey = () => {
    if (onSaveOpenAiApiKey) onSaveOpenAiApiKey(openAiInput.trim());
    setSavedKeyType('openai');
    setTimeout(() => setSavedKeyType(null), 2500);
  };

  const handleSaveElevenLabsKey = () => {
    if (onSaveElevenLabsApiKey) onSaveElevenLabsApiKey(elevenInput.trim());
    setSavedKeyType('eleven');
    setTimeout(() => setSavedKeyType(null), 2500);
  };

  const handleSaveAllKeys = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSaveGeminiApiKey(geminiInput.trim());
    if (onSaveElevenLabsApiKey) onSaveElevenLabsApiKey(elevenInput.trim());
    if (onSaveOpenAiApiKey) onSaveOpenAiApiKey(openAiInput.trim());
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleClearKey = (keyType: 'gemini' | 'eleven' | 'openai') => {
    if (keyType === 'gemini') {
      setGeminiInput('');
      onSaveGeminiApiKey('');
    } else if (keyType === 'eleven') {
      setElevenInput('');
      if (onSaveElevenLabsApiKey) onSaveElevenLabsApiKey('');
    } else if (keyType === 'openai') {
      setOpenAiInput('');
      if (onSaveOpenAiApiKey) onSaveOpenAiApiKey('');
    }
  };

  const testGeminiKey = async () => {
    const keyToTest = geminiInput.trim();
    setTestStatus((prev) => ({ ...prev, gemini: 'testing' }));
    try {
      const res = await fetch('/api/wai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: 'ping',
          userApiKey: keyToTest || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.reply && data.source !== 'error') {
        setTestStatus((prev) => ({ ...prev, gemini: 'success' }));
        setTestMessage((prev) => ({ ...prev, gemini: 'Active and responding!' }));
      } else {
        setTestStatus((prev) => ({ ...prev, gemini: 'error' }));
        setTestMessage((prev) => ({
          ...prev,
          gemini: data.reply?.includes('leaked')
            ? 'Key flagged as leaked by Google. Please generate a new key.'
            : data.reply || 'Connection failed.',
        }));
      }
    } catch (err: any) {
      setTestStatus((prev) => ({ ...prev, gemini: 'error' }));
      setTestMessage((prev) => ({ ...prev, gemini: err?.message || 'Network error' }));
    }
  };

  const testOpenAiKey = async () => {
    const keyToTest = openAiInput.trim();
    setTestStatus((prev) => ({ ...prev, openai: 'testing' }));
    try {
      const res = await fetch('/api/test-openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: keyToTest || undefined }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestStatus((prev) => ({ ...prev, openai: 'success' }));
        setTestMessage((prev) => ({ ...prev, openai: 'OpenAI API key verified and connected!' }));
      } else {
        setTestStatus((prev) => ({ ...prev, openai: 'error' }));
        setTestMessage((prev) => ({ ...prev, openai: data.error || 'OpenAI authentication failed.' }));
      }
    } catch (err: any) {
      setTestStatus((prev) => ({ ...prev, openai: 'error' }));
      setTestMessage((prev) => ({ ...prev, openai: err?.message || 'Network error' }));
    }
  };

  const testElevenLabsKey = async () => {
    const keyToTest = elevenInput.trim();
    setTestStatus((prev) => ({ ...prev, eleven: 'testing' }));
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Hello from Vian Voice AI',
          lang: 'en',
          userElevenKey: keyToTest || undefined,
        }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('audio/mpeg')) {
        setTestStatus((prev) => ({ ...prev, eleven: 'success' }));
        setTestMessage((prev) => ({ ...prev, eleven: 'ElevenLabs voice stream verified!' }));
      } else {
        const data = await res.json();
        setTestStatus((prev) => ({ ...prev, eleven: 'error' }));
        setTestMessage((prev) => ({ ...prev, eleven: data.error || 'Speech synthesis failed' }));
      }
    } catch (err: any) {
      setTestStatus((prev) => ({ ...prev, eleven: 'error' }));
      setTestMessage((prev) => ({ ...prev, eleven: err?.message || 'Network error' }));
    }
  };

  const handleFetchAndCopySql = async () => {
    setIsCopyingSql(true);
    try {
      const res = await fetch('/api/supabase-schema');
      const text = await res.text();
      setSqlSchemaText(text);
      await navigator.clipboard.writeText(text);
      alert('Supabase PostgreSQL DDL Schema copied to clipboard! Paste directly into Supabase SQL Editor.');
    } catch (err) {
      console.error('Failed to copy schema:', err);
    } finally {
      setIsCopyingSql(false);
    }
  };

  return (
    <div id="settings-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div id="settings-modal-container" className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">API & Environment Secrets</h2>
              <p className="text-xs text-slate-400">Manage GEMINI_API_KEY, OPENAI_API_KEY & Voice Settings</p>
            </div>
          </div>
          <button
            id="close-settings-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-2 flex space-x-3">
          <button
            id="tab-env-status"
            onClick={() => setActiveTab('env')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'env'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Environment Secrets</span>
          </button>
          <button
            id="tab-supabase"
            onClick={() => setActiveTab('supabase')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'supabase'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Database Export</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* ENVIRONMENT SECRETS TAB */}
          {activeTab === 'env' && (
            <div className="space-y-6">
              {/* Info banner with guide */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 font-bold text-blue-950">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>How Environment Secrets Work</span>
                  </div>
                  <button
                    onClick={fetchEnvStatus}
                    disabled={loadingEnv}
                    className="flex items-center space-x-1 text-xs text-blue-700 hover:text-blue-900 font-semibold cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingEnv ? 'animate-spin' : ''}`} />
                    <span>Refresh Server Status</span>
                  </button>
                </div>
                <p className="text-blue-800 leading-relaxed text-[11.5px]">
                  <strong>1. Google AI Studio Secrets (Cloud Run):</strong> Open the AI Studio <strong>Settings</strong> (gear icon) &gt; <strong>Secrets / Environment Variables</strong>, add <code>GEMINI_API_KEY</code> and <code>OPENAI_API_KEY</code>.<br />
                  <strong>2. Direct Instant Override:</strong> You can also paste your keys directly into the fields below to use them immediately in your active session.
                </p>
              </div>

              {/* 1. GEMINI_API_KEY CARD */}
              <div id="env-secret-gemini-card" className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3.5 shadow-xs">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-blue-100 rounded-lg text-blue-700">
                        <Bot className="w-4 h-4" />
                      </div>
                      <code className="text-xs font-mono font-bold text-slate-900 bg-slate-200/80 px-2 py-0.5 rounded-md">
                        GEMINI_API_KEY
                      </code>
                      <button
                        onClick={() => copyToClipboard('GEMINI_API_KEY')}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1 cursor-pointer bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs"
                        title="Copy variable name to clipboard"
                      >
                        {copiedVar === 'GEMINI_API_KEY' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700 font-bold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Name</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[11.5px] text-slate-500">
                      Primary intelligence model for WAI Malayalam & English assistant, office attendance, and employee queries.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    {envStatus?.geminiConfigured ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Server Set</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Not in Env</span>
                      </span>
                    )}
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center space-x-0.5 font-medium ml-1"
                    >
                      <span>Get Key</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Input & Action controls for Gemini */}
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <input
                      type="password"
                      value={geminiInput}
                      onChange={(e) => {
                        setGeminiInput(e.target.value);
                        setTestStatus((prev) => ({ ...prev, gemini: 'idle' }));
                      }}
                      placeholder="Paste your GEMINI_API_KEY here (AIzaSy...)"
                      className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleSaveGeminiKey}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors cursor-pointer flex items-center space-x-1 whitespace-nowrap"
                    >
                      {savedKeyType === 'gemini' ? <Check className="w-3.5 h-3.5 text-white" /> : <Key className="w-3.5 h-3.5" />}
                      <span>{savedKeyType === 'gemini' ? 'Saved' : 'Save'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={testGeminiKey}
                      disabled={testStatus.gemini === 'testing'}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {testStatus.gemini === 'testing' ? 'Testing...' : 'Test Connection'}
                    </button>
                    {geminiInput && (
                      <button
                        type="button"
                        onClick={() => handleClearKey('gemini')}
                        className="p-2 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Clear Gemini Key"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {testStatus.gemini === 'success' && (
                    <div className="flex items-center space-x-1.5 text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{testMessage.gemini || 'Gemini API connection successful!'}</span>
                    </div>
                  )}
                  {testStatus.gemini === 'error' && (
                    <div className="flex items-center space-x-1.5 text-[11px] text-red-600 font-medium bg-red-50 px-2.5 py-1 rounded-lg border border-red-200">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{testMessage.gemini || 'Connection failed.'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. OPENAI_API_KEY CARD */}
              <div id="env-secret-openai-card" className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3.5 shadow-xs">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-teal-100 rounded-lg text-teal-700">
                        <Mic className="w-4 h-4" />
                      </div>
                      <code className="text-xs font-mono font-bold text-slate-900 bg-slate-200/80 px-2 py-0.5 rounded-md">
                        OPENAI_API_KEY
                      </code>
                      <button
                        onClick={() => copyToClipboard('OPENAI_API_KEY')}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1 cursor-pointer bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs"
                        title="Copy variable name to clipboard"
                      >
                        {copiedVar === 'OPENAI_API_KEY' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700 font-bold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Name</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[11.5px] text-slate-500">
                      Whisper-1 audio speech-to-text transcription engine for voice queries.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    {envStatus?.openaiConfigured ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Server Set</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                        <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
                        <span>Not in Env</span>
                      </span>
                    )}
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center space-x-0.5 font-medium ml-1"
                    >
                      <span>Get Key</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Input & Action controls for OpenAI */}
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <input
                      type="password"
                      value={openAiInput}
                      onChange={(e) => {
                        setOpenAiInput(e.target.value);
                        setTestStatus((prev) => ({ ...prev, openai: 'idle' }));
                      }}
                      placeholder="Paste your OPENAI_API_KEY here (sk-proj-...)"
                      className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono outline-hidden focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                    />
                    <button
                      type="button"
                      onClick={handleSaveOpenAiKey}
                      className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors cursor-pointer flex items-center space-x-1 whitespace-nowrap"
                    >
                      {savedKeyType === 'openai' ? <Check className="w-3.5 h-3.5 text-white" /> : <Key className="w-3.5 h-3.5" />}
                      <span>{savedKeyType === 'openai' ? 'Saved' : 'Save'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={testOpenAiKey}
                      disabled={testStatus.openai === 'testing'}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {testStatus.openai === 'testing' ? 'Testing...' : 'Test Connection'}
                    </button>
                    {openAiInput && (
                      <button
                        type="button"
                        onClick={() => handleClearKey('openai')}
                        className="p-2 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Clear OpenAI Key"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {testStatus.openai === 'success' && (
                    <div className="flex items-center space-x-1.5 text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{testMessage.openai}</span>
                    </div>
                  )}
                  {testStatus.openai === 'error' && (
                    <div className="flex items-center space-x-1.5 text-[11px] text-red-600 font-medium bg-red-50 px-2.5 py-1 rounded-lg border border-red-200">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{testMessage.openai}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. ELEVENLABS_API_KEY CARD (Optional Voice) */}
              <div id="env-secret-elevenlabs-card" className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3.5 shadow-xs">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-purple-100 rounded-lg text-purple-700">
                        <Volume2 className="w-4 h-4" />
                      </div>
                      <code className="text-xs font-mono font-bold text-slate-900 bg-slate-200/80 px-2 py-0.5 rounded-md">
                        ELEVENLABS_API_KEY
                      </code>
                      <button
                        onClick={() => copyToClipboard('ELEVENLABS_API_KEY')}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1 cursor-pointer bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs"
                        title="Copy variable name to clipboard"
                      >
                        {copiedVar === 'ELEVENLABS_API_KEY' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700 font-bold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Name</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[11.5px] text-slate-500">
                      High-fidelity multilingual neural voices (Adam/Rachel). Seamlessly falls back to browser Web Speech API.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    {envStatus?.elevenlabsConfigured ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Server Set</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                        <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
                        <span>Not in Env</span>
                      </span>
                    )}
                    <a
                      href="https://elevenlabs.io"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center space-x-0.5 font-medium ml-1"
                    >
                      <span>Get Key</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Input & Action controls for ElevenLabs */}
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <input
                      type="password"
                      value={elevenInput}
                      onChange={(e) => {
                        setElevenInput(e.target.value);
                        setTestStatus((prev) => ({ ...prev, eleven: 'idle' }));
                      }}
                      placeholder="Paste your ELEVENLABS_API_KEY here (xi-api-key)"
                      className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono outline-hidden focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    />
                    <button
                      type="button"
                      onClick={handleSaveElevenLabsKey}
                      className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors cursor-pointer flex items-center space-x-1 whitespace-nowrap"
                    >
                      {savedKeyType === 'eleven' ? <Check className="w-3.5 h-3.5 text-white" /> : <Key className="w-3.5 h-3.5" />}
                      <span>{savedKeyType === 'eleven' ? 'Saved' : 'Save'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={testElevenLabsKey}
                      disabled={testStatus.eleven === 'testing'}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {testStatus.eleven === 'testing' ? 'Testing...' : 'Test Speech'}
                    </button>
                    {elevenInput && (
                      <button
                        type="button"
                        onClick={() => handleClearKey('eleven')}
                        className="p-2 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Clear ElevenLabs Key"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {testStatus.eleven === 'success' && (
                    <div className="flex items-center space-x-1.5 text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{testMessage.eleven}</span>
                    </div>
                  )}
                  {testStatus.eleven === 'error' && (
                    <div className="flex items-center space-x-1.5 text-[11px] text-red-600 font-medium bg-red-50 px-2.5 py-1 rounded-lg border border-red-200">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{testMessage.eleven}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Save All Keys Button */}
              <div className="flex items-center justify-end pt-2">
                <button
                  type="button"
                  onClick={() => handleSaveAllKeys()}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center space-x-2 shadow-md"
                >
                  {isSaved ? <Check className="w-4 h-4 text-emerald-400" /> : <Key className="w-4 h-4" />}
                  <span>{isSaved ? 'All Keys Saved to Active Session!' : 'Save All Keys to Session'}</span>
                </button>
              </div>
            </div>
          )}

          {/* SUPABASE EXPORT & RBAC TAB */}
          {activeTab === 'supabase' && (
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
                    <Database className="w-4 h-4 text-teal-600" />
                    <span>Supabase PostgreSQL Schema</span>
                  </div>
                  <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                    Schema Ready
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  VianERP architecture is built for instant Supabase cloud synchronization. You can export the entire PostgreSQL database DDL schema (Employees, Attendance, Work Reports, Leave Requests, CRM Leads, Projects with RLS policies).
                </p>

                <button
                  onClick={handleFetchAndCopySql}
                  disabled={isCopyingSql}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-xs"
                >
                  <Copy className="w-4 h-4 text-teal-400" />
                  <span>{isCopyingSql ? 'Generating DDL SQL...' : '1-Click Copy Supabase SQL DDL Schema'}</span>
                </button>

                {sqlSchemaText && (
                  <div className="mt-2 bg-slate-900 text-teal-300 p-3 rounded-xl text-[10px] font-mono max-h-36 overflow-y-auto border border-slate-700">
                    <pre>{sqlSchemaText.slice(0, 450)}...</pre>
                  </div>
                )}
              </div>

              {/* RBAC */}
              <div className="bg-slate-100 rounded-2xl p-4 border border-slate-200 text-xs text-slate-600 space-y-2">
                <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span>Role-Based Access Control (RBAC) Status</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Active Session Scope: <span className="font-semibold text-slate-800">Vianinfo Enterprise Node</span>.
                  Permissions strictly segregated between Admin View and Employee Portal.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            VianERP v2.4 Enterprise Cloud Edition
          </span>
          <button
            onClick={onClose}
            className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs px-5 py-2 rounded-xl transition-colors cursor-pointer"
          >
            Close Settings
          </button>
        </div>
      </div>
    </div>
  );
};

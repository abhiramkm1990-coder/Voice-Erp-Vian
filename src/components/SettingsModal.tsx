import React, { useState } from 'react';
import { X, Key, Database, Check, Copy, Shield, Sparkles, Server } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  geminiApiKey: string;
  onSaveGeminiApiKey: (key: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  geminiApiKey,
  onSaveGeminiApiKey,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState(geminiApiKey);
  const [isSaved, setIsSaved] = useState(false);
  const [isCopyingSql, setIsCopyingSql] = useState(false);
  const [sqlSchemaText, setSqlSchemaText] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveGeminiApiKey(apiKeyInput.trim());
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Enterprise Settings & Integrations</h2>
              <p className="text-xs text-slate-400">Vianinfo Solutions Infrastructure</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Section 1: Gemini API Key for WAI Voice AI */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
              <Key className="w-4 h-4 text-amber-500" />
              <span>Google Gemini API Key (WAI Assistant)</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Input a free Gemini API Key to power live generative model queries for the WAI Assistant.
              If blank, WAI defaults to the high-performance local intelligent business logic engine.
            </p>

            <form onSubmit={handleSaveKey} className="space-y-3">
              <div className="flex space-x-2">
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono outline-hidden focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer flex items-center space-x-1"
                >
                  {isSaved ? <Check className="w-4 h-4" /> : null}
                  <span>{isSaved ? 'Saved!' : 'Save Key'}</span>
                </button>
              </div>
              {geminiApiKey && (
                <div className="flex items-center space-x-1.5 text-[11px] text-emerald-600 font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Gemini Key configured! WAI Assistant will use live server-side LLM.</span>
                </div>
              )}
            </form>
          </div>

          {/* Section 2: Supabase Database Readiness */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
                <Database className="w-4 h-4 text-teal-600" />
                <span>Supabase PostgreSQL Readiness</span>
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

          {/* Section 3: System Security & Metadata */}
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

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 text-right">
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

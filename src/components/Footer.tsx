import React from 'react';
import { Database, ShieldCheck, Heart, Sparkles } from 'lucide-react';

interface FooterProps {
  onOpenSettings: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenSettings }) => {
  return (
    <footer className="bg-white/90 backdrop-blur-md border-t border-slate-200/80 mt-auto py-4 px-6 text-slate-600 text-sm shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Prominent Branding requirement */}
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-black shadow-sm shadow-blue-500/20">
            V
          </div>
          <span className="font-semibold text-slate-800 text-xs sm:text-sm">
            Crafted by <span className="text-blue-600 font-extrabold hover:underline cursor-pointer">Vianinfo Solutions</span>
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-xs text-slate-500 font-medium">v2.5 Enterprise ERP & CRM</span>
        </div>

        {/* Center: System Status & Capabilities */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
          <div className="flex items-center space-x-1.5 bg-emerald-50/90 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200/80 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-[11px]">System Online</span>
          </div>

          <button
            onClick={onOpenSettings}
            className="flex items-center space-x-1.5 text-slate-700 hover:text-blue-600 transition-all bg-slate-100/90 hover:bg-slate-200/80 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer border border-slate-200/60 shadow-xs"
            title="Configure Supabase Database and Gemini AI"
          >
            <Database className="w-3.5 h-3.5 text-teal-600" />
            <span>Supabase Ready</span>
          </button>

          <div className="hidden sm:flex items-center space-x-1.5 text-slate-600 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Vian Voice AI (Malayalam)</span>
          </div>
        </div>

        {/* Right: Copyright & Security */}
        <div className="flex items-center space-x-3 text-xs text-slate-500 font-medium">
          <span className="flex items-center space-x-1 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200/60 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
            <span>RBAC Secured</span>
          </span>
          <span>&copy; {new Date().getFullYear()} Vianinfo Solutions.</span>
        </div>
      </div>
    </footer>
  );
};

import React, { useState } from 'react';
import { Employee } from '../types';
import { Building2, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, Sparkles, CheckCircle2 } from 'lucide-react';

interface LoginPageProps {
  employees: Employee[];
  onLogin: (employee: Employee) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ employees, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your company email address.');
      return;
    }

    const matchedEmployee = employees.find(
      (emp) => emp.email.toLowerCase() === cleanEmail
    );

    if (!matchedEmployee) {
      setError('No registered employee account found with this email. Please select a demo account below.');
      return;
    }

    if (matchedEmployee.status === 'deactivated') {
      setError('This employee account has been deactivated. Please contact your HR Administrator.');
      return;
    }

    onLogin(matchedEmployee);
  };

  const activeEmployees = employees.filter((e) => e.status !== 'deactivated');
  const adminAccount = activeEmployees.find((e) => e.role === 'admin') || activeEmployees[0];
  const itSupportAccount = activeEmployees.find((e) => e.role === 'it_support');
  const regularEmployees = activeEmployees.filter((e) => e.role === 'employee');

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background Decorative Ambient Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3 relative z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-400 text-white font-black text-3xl shadow-xl shadow-blue-500/25 ring-2 ring-white/20">
          V
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          VianERP & CRM
        </h2>
        <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">
          Vianinfo Solutions Enterprise Portal
        </p>
      </div>

      {/* Main Login Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-white/95 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-3xl border border-slate-100 sm:px-10 space-y-6">
          <form onSubmit={handleCustomLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Company Email Address
              </label>
              <div className="relative rounded-2xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@vianinfo.com"
                  className="block w-full pl-10 pr-4 py-3 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-slate-900 bg-slate-50/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative rounded-2xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-4 py-3 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-slate-900 bg-slate-50/50"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full flex justify-center items-center space-x-2 py-3 px-4 rounded-2xl shadow-md text-xs font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600 hover:opacity-95 focus:outline-none transition-all cursor-pointer hover:scale-[1.01]"
            >
              <span>Sign In to Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-wider">
              <span className="bg-white px-3 text-slate-400">Or Quick Demo Single Sign-On</span>
            </div>
          </div>

          {/* Quick Demo Credentials Buttons */}
          <div className="space-y-3">
            {/* Admin Demo Button */}
            {adminAccount && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-extrabold text-indigo-900 uppercase tracking-wider flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3 text-indigo-600" />
                  <span>Enterprise Admin Login</span>
                </p>
                <button
                  type="button"
                  onClick={() => onLogin(adminAccount)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl border-2 border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100/80 transition-all text-left cursor-pointer group shadow-2xs"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={adminAccount.avatar}
                      alt={adminAccount.name}
                      className="w-9 h-9 rounded-xl object-cover ring-2 ring-indigo-300"
                    />
                    <div>
                      <p className="text-xs font-bold text-indigo-950 flex items-center space-x-1.5">
                        <span>{adminAccount.name}</span>
                        <span className="bg-indigo-600 text-white text-[9px] px-1.5 py-0.2 rounded-md uppercase font-extrabold">
                          Admin
                        </span>
                      </p>
                      <p className="text-[10px] text-indigo-700 font-medium">
                        {adminAccount.designation} &bull; {adminAccount.email}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-indigo-600 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}

            {/* IT Support Demo Button */}
            {itSupportAccount && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-extrabold text-cyan-900 uppercase tracking-wider flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3 text-cyan-600" />
                  <span>IT Support Lead Login</span>
                </p>
                <button
                  type="button"
                  onClick={() => onLogin(itSupportAccount)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl border-2 border-cyan-200 bg-cyan-50/60 hover:bg-cyan-100/80 transition-all text-left cursor-pointer group shadow-2xs"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={itSupportAccount.avatar}
                      alt={itSupportAccount.name}
                      className="w-9 h-9 rounded-xl object-cover ring-2 ring-cyan-300"
                    />
                    <div>
                      <p className="text-xs font-bold text-cyan-950 flex items-center space-x-1.5">
                        <span>{itSupportAccount.name}</span>
                        <span className="bg-cyan-600 text-white text-[9px] px-1.5 py-0.2 rounded-md uppercase font-extrabold">
                          IT Support
                        </span>
                      </p>
                      <p className="text-[10px] text-cyan-700 font-medium">
                        {itSupportAccount.designation} &bull; {itSupportAccount.email}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-cyan-600 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}

            {/* Employee Demo Buttons Grid */}
            <div className="space-y-1.5 pt-1">
              <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
                <UserCheck className="w-3 h-3 text-slate-500" />
                <span>Employee Portal Login</span>
              </p>
              <div className="grid grid-cols-1 gap-2">
                {regularEmployees.slice(0, 4).map((emp) => (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => onLogin(emp)}
                    className="w-full flex items-center justify-between p-2.5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-slate-50/80 hover:bg-slate-100 transition-all text-left cursor-pointer group"
                  >
                    <div className="flex items-center space-x-2.5">
                      <img
                        src={emp.avatar}
                        alt={emp.name}
                        className="w-8 h-8 rounded-xl object-cover"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-900">{emp.name}</p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {emp.designation} ({emp.department})
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-blue-600 group-hover:underline">
                      Log In &rarr;
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2 text-center border-t border-slate-100">
            <p className="text-[11px] text-slate-400">
              Vianinfo Solutions &bull; Role-Segregated Enterprise Portal
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

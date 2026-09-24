'use client';

import React, { useState } from 'react';
import { useAppStore, MOCK_USERS } from '@store/appStore';
import type { UserRole } from '@/types';
import { Button } from '@components/common/Button';
import { Card } from '@components/common/Card';
import { ShieldCheck, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { roleLabel } from '@lib/utils';

export const LoginScreen: React.FC = () => {
  const { setRole } = useAppStore();
  const router = useRouter();
  const [authMethod, setAuthMethod] = useState<'SSO' | 'CREDENTIALS'>('SSO');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDevLogin = (role: UserRole) => {
    setLoading(true);
    setTimeout(() => {
      setRole(role);
      setLoading(false);
      if (role === 'FACULTY_MENTOR') router.push('/mentor/dashboard');
      else if (role === 'COORDINATOR') router.push('/coordinator/activities');
      else if (role === 'SUPER_ADMIN') router.push('/admin/reports');
      else router.push('/dashboard');
    }, 300);
  };

  const handleStandardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      // Default to student if submitted directly
      setRole('STUDENT');
      setLoading(false);
      router.push('/dashboard');
    }, 400);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-800">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white font-black text-2xl shadow-lg shadow-indigo-500/30">
            V
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-display">
            VBridge<span className="text-indigo-400">Connect</span>
          </h1>
          <p className="text-sm text-slate-300">
            Institutional Project, Research & Hackathon Collaboration Portal
          </p>
        </div>

        {/* Auth Card */}
        <Card padding="lg" className="border-slate-800 bg-white shadow-2xl">
          {/* Method Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setAuthMethod('SSO')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                authMethod === 'SSO'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Institutional SSO
            </button>
            <button
              type="button"
              onClick={() => setAuthMethod('CREDENTIALS')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                authMethod === 'CREDENTIALS'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ID & Password
            </button>
          </div>

          {authMethod === 'SSO' ? (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-indigo-900 leading-relaxed">
                <div className="font-bold flex items-center gap-1.5 mb-1 text-indigo-700">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Single Sign-On (SAML / OAuth2)</span>
                </div>
                Access your Capstone projects, Mentorship dashboard, or Verification ledger using your registered campus credentials.
              </div>

              <Button
                variant="primary"
                fullWidth
                size="lg"
                isLoading={loading}
                onClick={() => handleDevLogin('STUDENT')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Sign in with University SSO
              </Button>
            </div>
          ) : (
            <form onSubmit={handleStandardSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Institutional Email or PRN
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student.prn@university.edu"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-slate-600">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Remember session</span>
                </label>
                <a href="#forgot" className="text-indigo-600 hover:underline">
                  Forgot PIN?
                </a>
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="lg"
                isLoading={loading}
              >
                Sign In
              </Button>
            </form>
          )}

          {/* 1-Click Role Switcher Quick Dev Access */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Instant Persona Login (Dev Sandbox)</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  'STUDENT',
                  'FACULTY_MENTOR',
                  'COORDINATOR',
                  'EXTERNAL_REVIEWER',
                  'INDUSTRY_PARTNER',
                  'SUPER_ADMIN',
                ] as UserRole[]
              ).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleDevLogin(role)}
                  className="px-2.5 py-2 text-left text-xs bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 rounded-xl border border-slate-200/80 transition-all font-medium truncate"
                >
                  <div className="font-semibold truncate">{MOCK_USERS[role].name}</div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {roleLabel(role)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400">
          Protected by institutional audit logging (FR-130).
          <br />
          All actions are timestamped and signed.
        </p>
      </div>
    </div>
  );
};

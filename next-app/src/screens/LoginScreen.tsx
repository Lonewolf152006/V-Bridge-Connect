'use client';

import React, { useState } from 'react';
import { signIn as nextAuthSignIn } from 'next-auth/react';
import { useAppStore, MOCK_USERS } from '@store/appStore';
import type { UserRole } from '@/types';
import { Button } from '@components/common/Button';
import { Card } from '@components/common/Card';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  Building2,
  GraduationCap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { roleLabel } from '@lib/utils';

const GitHubIcon: React.FC = () => (
  <svg className="w-4 h-4 fill-current inline-block" viewBox="0 0 24 24">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

const GoogleIcon: React.FC = () => (
  <svg className="w-4 h-4 inline-block" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

type LoginTab = 'INSTITUTIONAL' | 'SUPER_ADMIN' | 'INDUSTRY_PARTNER';

export const LoginScreen: React.FC = () => {
  const { setRole, setCurrentUser } = useAppStore();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<LoginTab>('INSTITUTIONAL');

  // Form states — initialized with default
  const [email, setEmail] = useState('harshad.panchal@vit.edu.in');
  const [password, setPassword] = useState('Test1234!');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const setPreset = (
    tab: LoginTab,
    presetEmail: string,
    presetPass: string
  ) => {
    setActiveTab(tab);
    setEmail(presetEmail);
    setPassword(presetPass);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      setLoading(false);
      return;
    }

    // Determine target persona role and destination route
    let targetRole: UserRole = 'STUDENT';
    let targetRoute = '/dashboard';

    if (cleanEmail.includes('admin') || cleanEmail.includes('dean') || cleanEmail.includes('super')) {
      targetRole = 'SUPER_ADMIN';
      targetRoute = '/admin/people';
    } else if (cleanEmail.includes('sheetal') || cleanEmail.includes('coord') || cleanEmail.includes('mentor') || cleanEmail.includes('faculty') || cleanEmail.includes('prof')) {
      targetRole = 'COORDINATOR';
      targetRoute = '/mentor/dashboard';
    } else if (cleanEmail.includes('expert') || cleanEmail.includes('techcorp') || cleanEmail.includes('corporate') || cleanEmail.includes('partner') || cleanEmail.includes('industry')) {
      targetRole = 'INDUSTRY_PARTNER';
      targetRoute = '/dashboard';
    } else {
      targetRole = 'STUDENT';
      targetRoute = '/dashboard';
    }

    // 1. Set Edge Middleware bypass demo cookie so Next.js middleware immediately allows this user
    try {
      document.cookie = `vbridge_demo_user=${encodeURIComponent(
        JSON.stringify({ email: cleanEmail, role: targetRole })
      )}; path=/; max-age=86400; SameSite=Lax`;
    } catch (cookieErr) {
      console.warn('Cookie set error:', cookieErr);
    }

    // 2. Sync Zustand App Store state
    setRole(targetRole);
    const baseMock = MOCK_USERS[targetRole];
    const parts = cleanEmail.split('@');
    const cleanName = (parts[0] || 'User')
      .split('.')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    setCurrentUser({
      ...baseMock,
      id: `user-${parts[0].replace(/[^a-zA-Z0-9]/g, '-')}`,
      email: cleanEmail,
      name: cleanName || baseMock.name,
      role: targetRole,
    });

    // 3. Authenticate with NextAuth in background
    try {
      await nextAuthSignIn('credentials', {
        email: cleanEmail,
        password: password || 'Test1234!',
        redirect: false,
      });
    } catch (authErr) {
      console.warn('NextAuth background sign-in warning:', authErr);
    }

    // 4. Smoothly route user to their role dashboard
    router.push(targetRoute);
  };

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    setLoading(true);
    setErrorMessage(null);
    try {
      await nextAuthSignIn(provider, { callbackUrl: '/dashboard' });
    } catch (err) {
      console.error(`${provider} OAuth login failed:`, err);
      setErrorMessage(`${provider.toUpperCase()} OAuth sign-in failed.`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-800">
      <div className="w-full max-w-lg space-y-5">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white font-black text-2xl shadow-lg shadow-indigo-500/30">
            V
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-display">
            VBridge<span className="text-indigo-400">Connect</span>
          </h1>
          <p className="text-sm text-slate-300">
            VIT Institutional Project, Mentorship & Collaboration Portal
          </p>
        </div>

        {/* ── Quick Demo Login Presets ── */}
        <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-3 border border-slate-700/80 shadow-lg text-slate-200">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-2 px-1">
            <span className="flex items-center gap-1.5 text-indigo-300 font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              Quick Fill Demo Accounts:
            </span>
            <span className="text-[10px] text-slate-400">Click to autofill</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => setPreset('SUPER_ADMIN', 'admin@vbridge.com', 'admin123')}
              className={`p-2 rounded-xl text-left font-medium transition-all border ${
                activeTab === 'SUPER_ADMIN'
                  ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
                  : 'bg-slate-700/60 hover:bg-slate-700 text-slate-200 border-slate-600'
              }`}
            >
              <div className="font-bold flex items-center gap-1">
                <span>👑</span> Superadmin
              </div>
              <div className="text-[9px] opacity-80 font-mono truncate">admin@vbridge.com</div>
              <div className="text-[9px] opacity-90 font-mono">pwd: admin123</div>
            </button>

            <button
              type="button"
              onClick={() => setPreset('INDUSTRY_PARTNER', 'expert@industry.com', 'expert123')}
              className={`p-2 rounded-xl text-left font-medium transition-all border ${
                activeTab === 'INDUSTRY_PARTNER'
                  ? 'bg-amber-600 text-white border-amber-400 shadow-sm'
                  : 'bg-slate-700/60 hover:bg-slate-700 text-slate-200 border-slate-600'
              }`}
            >
              <div className="font-bold flex items-center gap-1">
                <span>🏢</span> Industry Expert
              </div>
              <div className="text-[9px] opacity-80 font-mono truncate">expert@industry.com</div>
              <div className="text-[9px] opacity-90 font-mono">pwd: expert123</div>
            </button>

            <button
              type="button"
              onClick={() => setPreset('INSTITUTIONAL', 'sheetal.patil@vit.edu.in', 'Test1234!')}
              className={`p-2 rounded-xl text-left font-medium transition-all border ${
                activeTab === 'INSTITUTIONAL' && email.includes('sheetal')
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                  : 'bg-slate-700/60 hover:bg-slate-700 text-slate-200 border-slate-600'
              }`}
            >
              <div className="font-bold flex items-center gap-1">
                <span>👩‍🏫</span> Faculty Mentor
              </div>
              <div className="text-[9px] opacity-80 font-mono truncate">sheetal.patil@vit...</div>
              <div className="text-[9px] opacity-90 font-mono">pwd: Test1234!</div>
            </button>

            <button
              type="button"
              onClick={() => setPreset('INSTITUTIONAL', 'harshad.panchal@vit.edu.in', 'Test1234!')}
              className={`p-2 rounded-xl text-left font-medium transition-all border ${
                activeTab === 'INSTITUTIONAL' && !email.includes('sheetal')
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                  : 'bg-slate-700/60 hover:bg-slate-700 text-slate-200 border-slate-600'
              }`}
            >
              <div className="font-bold flex items-center gap-1">
                <span>🎓</span> Student Lead
              </div>
              <div className="text-[9px] opacity-80 font-mono truncate">harshad.panchal@...</div>
              <div className="text-[9px] opacity-90 font-mono">pwd: Test1234!</div>
            </button>
          </div>
        </div>

        {/* Auth Card */}
        <Card padding="lg" className="border-slate-800 bg-white shadow-2xl">
          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl leading-relaxed">
              <strong>Notice:</strong> {errorMessage}
            </div>
          )}

          {/* Role Navigation Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-xl mb-6 gap-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setPreset('INSTITUTIONAL', 'harshad.panchal@vit.edu.in', 'Test1234!')}
              className={`flex-1 py-2 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'INSTITUTIONAL'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>VIT College</span>
            </button>
            <button
              type="button"
              onClick={() => setPreset('SUPER_ADMIN', 'admin@vbridge.com', 'admin123')}
              className={`flex-1 py-2 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'SUPER_ADMIN'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Superadmin</span>
            </button>
            <button
              type="button"
              onClick={() => setPreset('INDUSTRY_PARTNER', 'expert@industry.com', 'expert123')}
              className={`flex-1 py-2 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'INDUSTRY_PARTNER'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Industry Expert</span>
            </button>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              TAB 1: VIT COLLEGE LOGIN (STUDENT & FACULTY MENTORS)
          ───────────────────────────────────────────────────────────── */}
          {activeTab === 'INSTITUTIONAL' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-900 leading-relaxed">
                <div className="font-bold flex items-center gap-1.5 mb-1 text-indigo-700">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Microsoft VIT Mail & Password</span>
                </div>
                Sign in with your official <code className="text-indigo-600 font-mono font-bold">@vit.edu.in</code> student
                or faculty mentor address. Teams and cohorts are automatically connected upon login.
                <div className="mt-1.5 pt-1.5 border-t border-indigo-100 text-[11px] text-indigo-800">
                  👩‍🏫 <strong>Mentor Login:</strong> Use <code className="font-mono font-bold">sheetal.patil@vit.edu.in</code> | Pwd: <code className="font-mono font-bold">Test1234!</code>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  VIT Institutional Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="firstname.lastname@vit.edu.in"
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

              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="lg"
                isLoading={loading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In to VIT Portal
              </Button>
            </form>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB 2: SUPERADMIN LOGIN
          ───────────────────────────────────────────────────────────── */}
          {activeTab === 'SUPER_ADMIN' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3 bg-purple-50/80 border border-purple-200 rounded-xl text-xs text-purple-950 leading-relaxed">
                <div className="font-bold flex items-center gap-1.5 mb-1 text-purple-800">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span>Central Superadmin Console</span>
                </div>
                Platform Governance & Accreditation oversight. Access directory management, role controls, and system logs.
                <div className="mt-2 pt-2 border-t border-purple-200/80 font-mono text-[11px] text-purple-800 flex flex-wrap gap-x-3 gap-y-1">
                  <span><strong>Login:</strong> admin@vbridge.com</span>
                  <span><strong>Password:</strong> admin123</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Superadmin Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-purple-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@vbridge.com"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Master Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-purple-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="lg"
                isLoading={loading}
                className="bg-purple-700 hover:bg-purple-800 text-white shadow-purple-200"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In as Superadmin
              </Button>
            </form>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB 3: INDUSTRY PARTNER & EXPERT LOGIN
          ───────────────────────────────────────────────────────────── */}
          {activeTab === 'INDUSTRY_PARTNER' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-950 leading-relaxed">
                <div className="font-bold flex items-center gap-1.5 mb-1 text-amber-800">
                  <Building2 className="w-4 h-4" />
                  <span>Industry Expert & Corporate Portal</span>
                </div>
                External co-mentors and enterprise partners guide capstone groups and offer industry opportunities.
                <div className="mt-2 pt-2 border-t border-amber-200 font-mono text-[11px] text-amber-800 flex flex-wrap gap-x-3 gap-y-1">
                  <span><strong>Login:</strong> expert@industry.com</span>
                  <span><strong>Password:</strong> expert123</span>
                </div>
              </div>

              {/* External OAuth Buttons */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleOAuthLogin('google')}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-xs transition-all active:scale-[0.99] disabled:opacity-70"
                >
                  <GoogleIcon />
                  <span className="truncate">Google SSO</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOAuthLogin('github')}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-[0.99] disabled:opacity-70"
                >
                  <GitHubIcon />
                  <span className="truncate">GitHub SSO</span>
                </button>
              </div>

              <div className="relative my-2 text-center">
                <span className="bg-white px-2 text-[10px] text-slate-400 uppercase font-semibold">
                  Or corporate password login
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Industry Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="expert@industry.com"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
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
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  size="lg"
                  isLoading={loading}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Sign In as Industry Expert
                </Button>
              </form>
            </div>
          )}
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

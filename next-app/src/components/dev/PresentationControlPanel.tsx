'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import type { UserRole } from '@/types';
import { useRouter, usePathname } from 'next/navigation';
import {
  Monitor,
  Smartphone,
  Tablet,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Compass,
  LayoutDashboard,
  ClipboardCheck,
  Award,
  MessageSquare,
  FilePlus,
  Users2,
  FolderGit2,
  ShieldCheck,
  BarChart3,
  ExternalLink,
} from 'lucide-react';
import { roleLabel } from '@/lib/utils';

export const PresentationControlPanel: React.FC = () => {
  const { currentUser, setRole, viewportMode, setViewportMode } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);

  const roles: { role: UserRole; label: string; icon: string; name: string }[] = [
    { role: 'STUDENT', label: 'Student', icon: '🎓', name: 'Siddharth Chen' },
    { role: 'FACULTY_MENTOR', label: 'Faculty Mentor', icon: '👩‍🏫', name: 'Dr. Eleanor Vance' },
    { role: 'COORDINATOR', label: 'Coordinator', icon: '📋', name: 'Prof. Arjun Mehta' },
    { role: 'INDUSTRY_PARTNER', label: 'Industry Partner', icon: '🏢', name: 'Rahul Kapoor' },
    { role: 'EXTERNAL_REVIEWER', label: 'External Reviewer', icon: '🔍', name: 'Dr. Priya Nair' },
    { role: 'SUPER_ADMIN', label: 'Dean / Super Admin', icon: '🏛️', name: 'Dean Rita Sharma' },
  ];

  const quickPages = [
    { path: '/dashboard', label: 'Student Dashboard', icon: LayoutDashboard },
    { path: '/mentor/dashboard', label: 'Mentor Cohort Health', icon: LayoutDashboard },
    { path: '/activities', label: 'Opportunity Catalogue', icon: Compass },
    { path: '/projects/team-001', label: 'Workspace Hub (9 Tabs)', icon: FolderGit2 },
    { path: '/projects/team-001/milestones/ms-002/submit', label: 'Milestone Submission', icon: ExternalLink },
    { path: '/mentor/submissions/sub-001-v2/grade', label: 'Rubric Grading Console', icon: ClipboardCheck },
    { path: '/certificates', label: 'Certificate Ledger & QR', icon: Award },
    { path: '/messages', label: 'Unified Communications', icon: MessageSquare },
    { path: '/coordinator/activities', label: 'Activity Builder Wizard', icon: FilePlus },
    { path: '/coordinator/activities/activity-001/applications', label: 'Application Pipeline', icon: Users2 },
    { path: '/admin/people', label: 'Directory & Permissions', icon: ShieldCheck },
    { path: '/admin/reports', label: 'Institutional Audit Reports', icon: BarChart3 },
  ];

  const handleRoleSelect = (role: UserRole) => {
    setRole(role);
    if (role === 'STUDENT' && pathname.startsWith('/mentor')) {
      router.push('/dashboard');
    } else if (role === 'FACULTY_MENTOR' && pathname === '/dashboard') {
      router.push('/mentor/dashboard');
    } else if (role === 'COORDINATOR' && (pathname === '/dashboard' || pathname.startsWith('/mentor'))) {
      router.push('/coordinator/activities');
    } else if (role === 'SUPER_ADMIN' && pathname === '/dashboard') {
      router.push('/admin/reports');
    }
  };

  return (
    <aside
      aria-label="Presentation Demo Controller"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center max-w-[95vw]"
    >
      {/* Expanded Control Box */}
      {isExpanded && (
        <div className="mb-3 w-[680px] max-w-[95vw] bg-slate-900/95 backdrop-blur-md text-white rounded-3xl shadow-2xl border border-slate-700/80 p-5 space-y-4 animate-in slide-in-from-bottom-3 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-600/30 text-indigo-400">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-display">
                  Evaluator Presentation Control Panel
                </h4>
                <p className="text-[11px] text-slate-400">
                  Switch viewport devices & user personas instantly for faculty inspection
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsExpanded(false)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Minimize ✕
            </button>
          </div>

          {/* Section 1: Device Viewport Switcher */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <span>1. Select Device Viewport Preview</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setViewportMode('desktop')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  viewportMode === 'desktop'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span>Desktop (PC)</span>
              </button>

              <button
                type="button"
                onClick={() => setViewportMode('mobile')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  viewportMode === 'mobile'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Phone (Mobile Frame)</span>
              </button>

              <button
                type="button"
                onClick={() => setViewportMode('tablet')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  viewportMode === 'tablet'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Tablet className="w-4 h-4" />
                <span>Tablet (768px)</span>
              </button>
            </div>
          </div>

          {/* Section 2: Role Switcher */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
              <span>2. Switch User Persona (Role Permissions)</span>
              <span className="text-[10px] text-emerald-400 font-mono">
                Active: {roleLabel(currentUser.role)}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {roles.map((r) => {
                const isSelected = currentUser.role === r.role;
                return (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => handleRoleSelect(r.role)}
                    className={`text-left p-2 rounded-xl text-xs transition-all border ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-sm font-semibold'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      <span>{r.icon}</span>
                      <span className="truncate">{r.label}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                      {r.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Direct Screen Navigator Jump */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              3. Quick Screen Jump for Evaluation
            </div>
            <select
              value={pathname}
              onChange={(e) => router.push(e.target.value)}
              className="w-full bg-slate-800 text-slate-200 text-xs rounded-xl p-2.5 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            >
              {quickPages.map((page) => (
                <option key={page.path} value={page.path}>
                  {page.label} ({page.path})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Floating Pill Dock Button (Always visible) */}
      <div className="flex items-center gap-2 bg-slate-900/95 hover:bg-slate-900 text-white px-4 py-2.5 rounded-full shadow-2xl border border-slate-700/90 backdrop-blur-md text-xs transition-all active:scale-[0.99] select-none">
        {/* Device Mode Indicator */}
        <div className="flex items-center gap-1.5 pr-2.5 border-r border-slate-700">
          {viewportMode === 'desktop' ? (
            <Monitor className="w-3.5 h-3.5 text-indigo-400" />
          ) : viewportMode === 'mobile' ? (
            <Smartphone className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          ) : (
            <Tablet className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span className="capitalize font-semibold text-slate-200">
            {viewportMode}
          </span>
        </div>

        {/* Persona Indicator */}
        <div className="flex items-center gap-1.5 pl-1 pr-2.5 border-r border-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-400">Role:</span>
          <span className="font-bold text-indigo-300">
            {roleLabel(currentUser.role)}
          </span>
          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
            ({currentUser.name.split(' ')[0]})
          </span>
        </div>

        {/* Toggle Expand Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-slate-300 hover:text-white font-medium pl-1 focus:outline-none"
        >
          <span>{isExpanded ? 'Hide Panel' : 'Demo Controls'}</span>
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </aside>
  );
};

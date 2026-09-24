'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@store/appStore';
import { Card } from '@components/common/Card';
import { Button } from '@components/common/Button';
import { RiskBadge } from '@components/common/RiskBadge';
import { Badge } from '@components/common/Badge';
import {
  FolderGit2,
  Calendar,
  CheckCircle2,
  Clock,
  Code2,
  Users,
  MessageSquare,
  FileText,
  Shield,
  Send,
  UploadCloud,
  FileCheck,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import {
  MOCK_TEAMS,
  MOCK_ACTIVITIES,
  MOCK_MILESTONES,
  MOCK_SUBMISSIONS,
  MOCK_CHANNELS,
} from '@services/mockData';
import { formatDateTime, getMilestoneBadge, timeAgo } from '@lib/utils';

export const WorkspaceHub: React.FC = () => {
  const params = useParams();
  const teamId = params?.teamId as string | undefined;
  const { currentUser } = useAppStore();
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Chat tab state
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'm1',
      sender: 'Dr. Eleanor Vance',
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Eleanor',
      role: 'FACULTY_MENTOR',
      text: 'Great work on Milestone 1 v2 submission, Team NexGen. Make sure you finalize the GitHub README before Wednesday.',
      time: 'Yesterday at 4:15 PM',
    },
    {
      id: 'm2',
      sender: 'Siddharth Chen',
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Siddharth',
      role: 'STUDENT',
      text: 'Thank you Dr. Vance! We are currently running latency benchmarks on the streaming pipeline.',
      time: 'Today at 10:20 AM',
    },
  ]);
  const [newMsg, setNewMsg] = useState('');

  const currentTeam = MOCK_TEAMS.find((t) => t.id === teamId) || MOCK_TEAMS[0];
  const currentActivity =
    MOCK_ACTIVITIES.find((a) => a.id === currentTeam.activityId) ||
    MOCK_ACTIVITIES[0];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim()) return;
    setChatMessages([
      ...chatMessages,
      {
        id: Date.now().toString(),
        sender: currentUser.name,
        avatar: currentUser.avatarUrl || '',
        role: currentUser.role,
        text: newMsg,
        time: 'Just now',
      },
    ]);
    setNewMsg('');
  };

  // 9 Tabs definition according to VBridgeConnect_IA_Map.pdf
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'milestones', label: 'Milestones & Deliverables' },
    { id: 'repository', label: 'Repository & Code' },
    { id: 'team', label: 'Team Members' },
    // FR-092: Hide grades & rubrics from Industry Partners
    ...(currentUser.role !== 'INDUSTRY_PARTNER'
      ? [{ id: 'rubrics', label: 'Grading & Rubrics' }]
      : []),
    { id: 'discussion', label: 'Discussion & Chat' },
    { id: 'audit', label: 'Audit Trail' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ─── Breadcrumb ─── */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link href="/dashboard" className="hover:text-indigo-600">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link href="/activities" className="hover:text-indigo-600">
          Workspaces
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-800 font-bold">{currentTeam.name}</span>
      </div>

      {/* ─── Workspace Header Card ─── */}
      <Card padding="lg" className="border-slate-200/90 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200">
                Shared Hub Workspace
              </span>
              <RiskBadge level={currentTeam.riskLevel} />
              <span className="text-xs text-slate-400 font-mono">
                ID: {currentTeam.id}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              {currentTeam.name}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl font-medium">
              Project: <span className="text-slate-900 font-semibold">{currentActivity.title}</span>
            </p>
          </div>

          {/* Supervisor & Quick Shortcut CTA */}
          <div className="flex items-center gap-3 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6">
            <div className="text-right hidden sm:block">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Lead Mentor
              </div>
              <div className="text-sm font-bold text-slate-800">
                {currentTeam.mentor?.name || 'Dr. Eleanor Vance'}
              </div>
              <div className="text-xs text-indigo-600">Computer Science & AI</div>
            </div>

            <Link
              href={`/projects/${currentTeam.id}/milestones/ms-002/submit`}
              className="flex-shrink-0"
            >
              <Button
                variant="primary"
                leftIcon={<UploadCloud className="w-4 h-4" />}
              >
                Submit Milestone 2
              </Button>
            </Link>
          </div>
        </div>

        {/* ─── 9 Tabs Navigation Strip ─── */}
        <div className="flex items-center gap-1 overflow-x-auto border-t border-slate-100 mt-6 pt-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-50 text-indigo-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      {/* ─── TAB 1: OVERVIEW ─── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Urgent Milestone Box */}
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                    Next Deliverable Deadline
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Milestone 2: Working Prototype & Demo Recording
                </h3>
                <p className="text-xs text-slate-600">
                  GitHub URL + 5-minute video demonstration required. Weight: 35%.
                </p>
              </div>

              <Link href={`/projects/${currentTeam.id}/milestones/ms-002/submit`}>
                <Button variant="primary" size="sm" className="bg-amber-600 hover:bg-amber-700">
                  Submit Now
                </Button>
              </Link>
            </div>

            {/* Project Synopsis */}
            <Card padding="md">
              <h3 className="text-sm font-bold text-slate-900 font-display mb-2">
                Project Synopsis & Scope
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {currentActivity.description}
              </p>

              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-2.5 rounded-xl bg-slate-50">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">
                    Category
                  </div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">
                    {currentActivity.category}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">
                    Total Weightage
                  </div>
                  <div className="text-xs font-bold text-indigo-600 mt-0.5">
                    100 Points
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">
                    Completed
                  </div>
                  <div className="text-xs font-bold text-emerald-600 mt-0.5">
                    20 / 100 Pts
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">
                    Target Defense
                  </div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">
                    15 Nov 2026
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Sidebar: Quick Team & Resources */}
          <div className="space-y-6">
            <Card padding="md">
              <h3 className="text-sm font-bold text-slate-900 font-display mb-3 flex items-center justify-between">
                <span>Roster & Collaborators</span>
                <span className="text-xs text-indigo-600 font-normal">3 Members</span>
              </h3>
              <div className="space-y-2.5">
                {currentTeam.members.map((m) => (
                  <div
                    key={m.userId}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={m.user.avatarUrl}
                        alt={m.user.name}
                        className="w-7 h-7 rounded-full bg-slate-200"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-800 truncate">
                          {m.user.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {m.user.institutionalId}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
                      {m.role}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card padding="md">
              <h3 className="text-sm font-bold text-slate-900 font-display mb-3">
                Connected Repositories
              </h3>
              <a
                href="https://github.com/nexgen-ai/autonomous-pipeline"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4" />
                  <span className="text-xs font-mono">nexgen-ai/pipeline</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            </Card>
          </div>
        </div>
      )}

      {/* ─── TAB 2: MILESTONES ─── */}
      {activeTab === 'milestones' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 font-display">
              Milestone Progression & Submission Versions
            </h2>
            <Link href={`/projects/${currentTeam.id}/milestones/ms-002/submit`}>
              <Button variant="primary" size="sm">
                Submit Deliverable
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {MOCK_MILESTONES.map((ms) => {
              const badge = getMilestoneBadge(ms.status);
              return (
                <Card key={ms.id} padding="md" className="border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-600">
                          Stage {ms.stageNumber} • {ms.weightage}% Weight
                        </span>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${badge.classes}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900">
                        {ms.title}
                      </h3>
                      <p className="text-xs text-slate-500">{ms.description}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      {ms.status === 'ACCEPTED' ? (
                        <div className="text-right">
                          <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 justify-end">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approved (v2)</span>
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Score: 80 / 100 Pts
                          </span>
                        </div>
                      ) : (
                        <Link
                          href={`/projects/${currentTeam.id}/milestones/${ms.id}/submit`}
                        >
                          <Button variant="outline" size="sm">
                            Submit Deliverable
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── TAB 3: REPOSITORY ─── */}
      {activeTab === 'repository' && (
        <Card padding="md" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
              <Code2 className="w-5 h-5" />
              <span>nexgen-ai/autonomous-pipeline</span>
            </h3>
            <span className="text-xs text-emerald-600 font-medium">
              ● Webhook Active (Live Commit Tracking)
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            <div className="py-2.5 flex items-center justify-between text-xs">
              <div className="font-mono text-slate-700">
                fix(ingestion): buffer overrun mitigation on 128ch streams
              </div>
              <span className="text-slate-400 font-mono">commit 7e9b4a1 • 2d ago</span>
            </div>
            <div className="py-2.5 flex items-center justify-between text-xs">
              <div className="font-mono text-slate-700">
                feat(models): add synthetic test harness for RL controller
              </div>
              <span className="text-slate-400 font-mono">commit 3b8c2e1 • 3d ago</span>
            </div>
            <div className="py-2.5 flex items-center justify-between text-xs">
              <div className="font-mono text-slate-700">
                docs: architecture design spec initial draft v1
              </div>
              <span className="text-slate-400 font-mono">commit a1c0f94 • 5d ago</span>
            </div>
          </div>
        </Card>
      )}

      {/* ─── TAB 5: GRADING & RUBRICS (Hidden from Industry Partners FR-092) ─── */}
      {activeTab === 'rubrics' && (
        <Card padding="md" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">
                Evaluated Rubrics & Accreditations
              </h3>
              <p className="text-xs text-slate-500">
                Audited faculty reviews and milestone score sheets
              </p>
            </div>
            <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full border border-emerald-200">
              Passed M1 with B+
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-800">
                Milestone 1: System Architecture Spec (v2)
              </div>
              <span className="text-xs text-slate-500">
                Evaluator: Dr. Eleanor Vance
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-400">Technical Feasibility</div>
                <div className="text-sm font-bold text-indigo-600">8 / 10</div>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-400">Academic Rigor</div>
                <div className="text-sm font-bold text-indigo-600">9 / 10</div>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-400">Standards & Quality</div>
                <div className="text-sm font-bold text-indigo-600">7 / 10</div>
              </div>
            </div>

            <div className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200">
              <strong>Faculty Feedback:</strong> &quot;Excellent architectural revision. Please finalize docstrings for the WebSocket bridge before the midterm defense.&quot;
            </div>
          </div>
        </Card>
      )}

      {/* ─── TAB 6: DISCUSSION & CHAT (Rule 3) ─── */}
      {activeTab === 'discussion' && (
        <Card padding="md" className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">
                Team Workspace Discussion Thread
              </h3>
              <p className="text-xs text-slate-500">
                Unified messaging thread shared between students, mentors, and industry partners
              </p>
            </div>
            <span className="text-xs text-emerald-600 font-medium">● 3 Online</span>
          </div>

          {/* Messages Feed */}
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {chatMessages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-3 text-xs">
                <img
                  src={msg.avatar}
                  alt={msg.sender}
                  className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0"
                />
                <div className="flex-1 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900">{msg.sender}</span>
                      <span className="text-[10px] text-indigo-600 font-medium">
                        [{msg.role}]
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">{msg.time}</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{msg.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Input Box */}
          <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-slate-100">
            <input
              type="text"
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              placeholder="Post an update or question to the team..."
              className="flex-1 px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              rightIcon={<Send className="w-3.5 h-3.5" />}
            >
              Send
            </Button>
          </form>
        </Card>
      )}

      {/* ─── TAB 7: AUDIT TRAIL ─── */}
      {activeTab === 'audit' && (
        <Card padding="md" className="space-y-3">
          <h3 className="text-base font-bold text-slate-900 font-display">
            Immutable Audit Trail (FR-130)
          </h3>
          <p className="text-xs text-slate-500">
            All submissions, state transitions, and evaluations are cryptographically signed.
          </p>

          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-2.5 flex items-center justify-between">
              <span className="font-mono text-slate-800">
                [milestone.accepted] M1 Architecture Spec v2 signed by Dr. Eleanor Vance
              </span>
              <span className="text-slate-400 font-mono">02 Oct 2026 11:42 UTC</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="font-mono text-slate-800">
                [submission.created] Version 2 uploaded by Siddharth Chen (SHA-256: 7e9b4a...)
              </span>
              <span className="text-slate-400 font-mono">01 Oct 2026 09:40 UTC</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="font-mono text-slate-800">
                [application.accepted] Application approved by Prof. Arjun Mehta
              </span>
              <span className="text-slate-400 font-mono">16 Sep 2026 10:00 UTC</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

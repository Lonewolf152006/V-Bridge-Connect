'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '@components/common/Card';
import { Button } from '@components/common/Button';
import { RiskBadge } from '@components/common/RiskBadge';
import {
  Users2,
  Clock,
  ArrowRight,
  AlertTriangle,
  ClipboardCheck,
  Search,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { MOCK_TEAMS, MOCK_SUBMISSIONS, MOCK_ACTIVITIES } from '@services/mockData';
import type { TeamRiskLevel } from '@/types';

export const MentorDashboard: React.FC = () => {
  const [filterRisk, setFilterRisk] = useState<TeamRiskLevel | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const teams = MOCK_TEAMS.filter((team) => {
    const matchesRisk = filterRisk === 'ALL' || team.riskLevel === filterRisk;
    const matchesQuery =
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.riskReason?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRisk && matchesQuery;
  });

  const pendingSubmissions = MOCK_SUBMISSIONS.filter((s) => s.gradedAt); // show recent for demo

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 font-display">
              Cohort Risk & Mentorship Overview
            </h1>
            <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full border border-indigo-200">
              Fall 2026
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time cohort health tracking, risk classifications (FR-070 to FR-075), and pending rubric submissions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/messages">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<MessageSquare className="w-4 h-4" />}
            >
              Office Hours
            </Button>
          </Link>
          <Link href="/mentor/submissions/sub-001-v2/grade">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<ClipboardCheck className="w-4 h-4" />}
            >
              Grade Submissions (1)
            </Button>
          </Link>
        </div>
      </div>

      {/* ─── Risk Distribution Summary Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* On Track */}
        <div
          onClick={() => setFilterRisk(filterRisk === 'ON_TRACK' ? 'ALL' : 'ON_TRACK')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterRisk === 'ON_TRACK'
              ? 'ring-2 ring-emerald-500 bg-emerald-50/40 border-emerald-300'
              : 'bg-white border-slate-200/80 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>On Track</span>
            </span>
            <span className="text-xs text-slate-400">50% of Cohort</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-display">2</div>
          <p className="text-xs text-slate-500 mt-1">
            Meeting milestones on schedule with positive commit momentum.
          </p>
        </div>

        {/* Needs Attention */}
        <div
          onClick={() => setFilterRisk(filterRisk === 'NEEDS_ATTENTION' ? 'ALL' : 'NEEDS_ATTENTION')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterRisk === 'NEEDS_ATTENTION'
              ? 'ring-2 ring-amber-500 bg-amber-50/40 border-amber-300'
              : 'bg-white border-slate-200/80 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Needs Attention</span>
            </span>
            <span className="text-xs text-slate-400">25% of Cohort</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-display">1</div>
          <p className="text-xs text-slate-500 mt-1">
            Changes requested on rubrics or inactive commit streaks &gt; 72h.
          </p>
        </div>

        {/* At Risk */}
        <div
          onClick={() => setFilterRisk(filterRisk === 'AT_RISK' ? 'ALL' : 'AT_RISK')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterRisk === 'AT_RISK'
              ? 'ring-2 ring-rose-500 bg-rose-50/40 border-rose-300'
              : 'bg-white border-slate-200/80 hover:border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>At Risk</span>
            </span>
            <span className="text-xs text-slate-400">25% of Cohort</span>
          </div>
          <div className="text-3xl font-extrabold text-rose-600 font-display">1</div>
          <p className="text-xs text-slate-500 mt-1">
            Overdue deliverables &gt; 48 hours or unaddressed core criteria.
          </p>
        </div>
      </div>

      {/* ─── Cohort Attention / Teams Table ─── */}
      <Card padding="none" className="overflow-hidden">
        {/* Table Filter Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users2 className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900 font-display">
              Mentored Teams & Deliverable Health
            </h2>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
              {teams.length} teams
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search team or risk note..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            {filterRisk !== 'ALL' && (
              <button
                onClick={() => setFilterRisk('ALL')}
                className="text-xs text-indigo-600 font-semibold hover:underline"
              >
                Clear filter
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200/60 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="px-5 py-3">Team Name & Project</th>
                <th className="px-5 py-3">Risk Classification</th>
                <th className="px-5 py-3">Observed Anomaly / Trigger</th>
                <th className="px-5 py-3">Next Action</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teams.map((team) => (
                <tr
                  key={team.id}
                  className="hover:bg-slate-50/70 transition-colors"
                >
                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-900">{team.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5 max-w-xs truncate">
                      {MOCK_ACTIVITIES.find((a) => a.id === team.activityId)?.title}
                    </div>
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap">
                    <RiskBadge level={team.riskLevel} />
                  </td>

                  <td className="px-5 py-4 text-xs text-slate-600 max-w-sm">
                    {team.riskReason ? (
                      <span className="flex items-start gap-1.5 text-amber-900 bg-amber-50/80 p-2 rounded-lg border border-amber-200/80">
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <span>{team.riskReason}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400">Regular progression</span>
                    )}
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-600">
                    {team.riskLevel === 'AT_RISK' ? (
                      <span className="font-semibold text-rose-600">
                        Intervention Required
                      </span>
                    ) : team.riskLevel === 'NEEDS_ATTENTION' ? (
                      <span className="font-semibold text-amber-700">
                        Clarify Rubric §3.2
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-medium">
                        On schedule
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/projects/${team.id}`}>
                        <Button variant="outline" size="sm">
                          Workspace
                        </Button>
                      </Link>
                      <Link href="/mentor/submissions/sub-001-v2/grade">
                        <Button variant="primary" size="sm">
                          Review
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ─── Pending Deliverables for Rubric Evaluation ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-display">
              Submissions Ready for Rubric Grading
            </h2>
            <p className="text-xs text-slate-500">
              Student submissions awaiting faculty mentor evaluation and accreditation evidence sign-off
            </p>
          </div>
          <Link
            href="/mentor/submissions/sub-001-v2/grade"
            className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1"
          >
            <span>Open grading console</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <Card padding="md" className="border-indigo-100 bg-indigo-50/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-600 text-white flex-shrink-0 shadow-sm shadow-indigo-300">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-900">
                    Team NexGen • Version 2 (Resubmission)
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                    Score: 80% (B+)
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                  Milestone 1: System Architecture & Design Document
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Addressed previous review comments regarding buffer overrun risks. Synthetic stress testing report included in Appendix B.
                </p>
              </div>
            </div>

            <Link
              href="/mentor/submissions/sub-001-v2/grade"
              className="flex-shrink-0"
            >
              <Button
                variant="primary"
                size="sm"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Inspect Rubric & Sign
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

'use client';

import React from 'react';
import Link from 'next/link';
import { useAppStore } from '@store/appStore';
import { Card } from '@components/common/Card';
import { Button } from '@components/common/Button';
import { RiskBadge } from '@components/common/RiskBadge';
import {
  Clock,
  ArrowRight,
  FolderGit2,
  CheckCircle2,
  Award,
  AlertCircle,
  Users,
  Compass,
  FileCheck,
  TrendingUp,
} from 'lucide-react';
import { MOCK_ACTIVITIES, MOCK_TEAMS, MOCK_MILESTONES } from '@services/mockData';

export const StudentDashboard: React.FC = () => {
  const { currentUser } = useAppStore();

  // Active student team
  const studentTeam = MOCK_TEAMS[0]; // Team NexGen
  const currentActivity = MOCK_ACTIVITIES[0]; // Hackathon
  const upcomingMilestone = MOCK_MILESTONES[1]; // Milestone 2

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ─── Hero / Greeting Bar ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-400/20 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Active Semester • Term Fall 2026</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
            Welcome back, {currentUser.name}
          </h1>
          <p className="text-sm text-slate-300 max-w-xl">
            You are enrolled in <span className="text-white font-semibold">2 active projects</span>. Keep an eye on your upcoming deliverables to maintain on-track team risk status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/activities">
            <Button
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 shadow-none"
              leftIcon={<Compass className="w-4 h-4" />}
            >
              Browse Catalog
            </Button>
          </Link>
          <Link href="/certificates">
            <Button
              variant="primary"
              className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-900/50"
              leftIcon={<Award className="w-4 h-4" />}
            >
              My Ledger
            </Button>
          </Link>
        </div>
      </div>

      {/* ─── Critical Deadline Banner (IA Map Direct Shortcut Rule 1) ─── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-700 flex-shrink-0">
            <Clock className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Action Required • Due in 36 Hours
              </span>
              <span className="text-[10px] bg-amber-200/80 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                Milestone 2
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 mt-0.5">
              {upcomingMilestone.title} ({currentActivity.title})
            </h3>
            <p className="text-xs text-slate-600">
              Deliverable: GitHub Repository + 5-min demo video URL. Weightage: 35% of total grade.
            </p>
          </div>
        </div>

        <Link
          href={`/projects/${studentTeam.id}/milestones/${upcomingMilestone.id}/submit`}
          className="flex-shrink-0 w-full sm:w-auto"
        >
          <Button
            variant="primary"
            size="sm"
            className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 border-none shadow-sm shadow-amber-300"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Submit Deliverable
          </Button>
        </Link>
      </div>

      {/* ─── Key Metrics Grid ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Enrolled Projects
            </span>
            <FolderGit2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-display">
            2
          </div>
          <div className="text-[11px] text-emerald-600 flex items-center gap-1 mt-1 font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>1 Capstone • 1 Hackathon</span>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Milestones Passed
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-display">
            4 <span className="text-sm font-normal text-slate-400">/ 6 total</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Avg Rubric Score: <span className="font-bold text-slate-800">88.5%</span>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Issued Certificates
            </span>
            <Award className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-display">
            2
          </div>
          <div className="text-[11px] text-indigo-600 font-medium mt-1">
            Official Ledger Verified
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Team Risk Status
            </span>
            <AlertCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="pt-0.5">
            <RiskBadge level={studentTeam.riskLevel} />
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            No active escalations flagged
          </div>
        </Card>
      </div>

      {/* ─── Active Workspaces Section (Direct Access) ─── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-display">
              Active Project Workspaces
            </h2>
            <p className="text-xs text-slate-500">
              Direct access to team collaboration hubs, milestones, and grading rubrics
            </p>
          </div>
          <Link
            href="/activities"
            className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1"
          >
            <span>Explore catalogue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: Hackathon Project */}
          <Card hoverEffect padding="lg" className="border-slate-200/90 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                  Hackathon
                </span>
                <RiskBadge level="ON_TRACK" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 font-display hover:text-indigo-600 transition-colors">
                  <Link href={`/projects/${studentTeam.id}`}>
                    {currentActivity.title}
                  </Link>
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                  {currentActivity.description}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Milestone Progress</span>
                  <span className="font-bold text-slate-800">55%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full w-[55%]" />
                </div>
              </div>

              {/* Team Members & Mentor */}
              <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600 font-medium">3 members</span>
                </div>
                <div className="text-slate-500">
                  Mentor: <span className="font-semibold text-slate-800">Dr. Vance</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <span className="text-xs text-amber-700 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Next: M2 Prototype (36h left)</span>
              </span>

              <Link href={`/projects/${studentTeam.id}`}>
                <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Open Workspace
                </Button>
              </Link>
            </div>
          </Card>

          {/* Card 2: Capstone Project */}
          <Card hoverEffect padding="lg" className="border-slate-200/90 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                  Capstone
                </span>
                <RiskBadge level="ON_TRACK" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 font-display hover:text-indigo-600 transition-colors">
                  <Link href="/projects/team-002">
                    Autonomous Micro-Grid Simulation: Reinforcement Learning Controller
                  </Link>
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                  Designing a multi-agent reinforcement learning controller for decentralized urban energy grids.
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Milestone Progress</span>
                  <span className="font-bold text-slate-800">75%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full w-[75%]" />
                </div>
              </div>

              {/* Team Members & Mentor */}
              <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600 font-medium">4 members</span>
                </div>
                <div className="text-slate-500">
                  Mentor: <span className="font-semibold text-slate-800">Dr. Vance</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>M3 Architecture Defense Accepted</span>
              </span>

              <Link href="/projects/team-002">
                <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Open Workspace
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

'use client';

import React, { useEffect, useState } from 'react';
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
  TrendingUp,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

interface StudentDashboardData {
  student: {
    id: string;
    name: string;
    email: string;
    department: string;
  };
  metrics: {
    enrolledProjects: number;
    milestonesPassed: number;
    totalMilestones: number;
    issuedCertificates: number;
    teamRiskStatus: string;
  };
  activeTeam: {
    id: string;
    name: string;
    activityId: string;
    activityTitle: string;
    activityDescription: string;
    activityType: string;
    department: string;
    riskStatus: string;
    mentor: {
      id: string;
      name: string;
      email: string;
    } | null;
    members: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
      avatarUrl: string;
      status: string;
    }>;
    milestones: Array<{
      id: string;
      stageNumber: number;
      title: string;
      description: string;
      dueDate: string;
      weightage: number;
    }>;
    progressPercent: number;
    passedMilestonesCount: number;
    totalMilestonesCount: number;
    upcomingMilestone: {
      id: string;
      title: string;
      description: string;
      stageNumber: number;
      dueDate: string;
      weightage: number;
    } | null;
  } | null;
  teams: Array<any>;
  criticalDeadline: {
    milestoneId: string;
    milestoneTitle: string;
    stageNumber: number;
    activityTitle: string;
    deliverableNote: string;
    weightage: number;
    dueInHours: number;
    dueInDays: number;
    teamId: string;
  } | null;
}

export const StudentDashboard: React.FC = () => {
  const { currentUser, setActiveWorkspace } = useAppStore();
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchDashboard() {
      try {
        const res = await fetch('/api/v1/student/dashboard');
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data && isMounted) {
            setData(json.data);
            if (json.data.activeTeam) {
              setActiveWorkspace({
                teamId: json.data.activeTeam.id,
                name: json.data.activeTeam.name,
                activityTitle: json.data.activeTeam.activityTitle,
                mentorName: json.data.activeTeam.mentor?.name,
                nextMilestoneTitle: json.data.activeTeam.upcomingMilestone?.title,
              });
            }
          }
        }
      } catch (err) {
        console.error('Failed to load student dashboard:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchDashboard();

    return () => {
      isMounted = false;
    };
  }, [setActiveWorkspace]);

  const activeTeam = data?.activeTeam;
  const metrics = data?.metrics || {
    enrolledProjects: 0,
    milestonesPassed: 0,
    totalMilestones: 0,
    issuedCertificates: 0,
    teamRiskStatus: 'on_track',
  };
  const criticalDeadline = data?.criticalDeadline;

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
            Welcome back, {currentUser.name || data?.student?.name || 'Student'}
          </h1>
          <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
            {metrics.enrolledProjects > 0 ? (
              <>
                You are enrolled in{' '}
                <span className="text-white font-semibold">
                  {metrics.enrolledProjects} active project
                  {metrics.enrolledProjects > 1 ? 's' : ''}
                </span>{' '}
                ({activeTeam?.name}). Mentored by{' '}
                <span className="text-white font-semibold">
                  {activeTeam?.mentor?.name || 'Faculty Guide'}
                </span>
                .
              </>
            ) : (
              'You are not currently enrolled in any active project workspaces. Explore the catalog to apply or await roster allocation.'
            )}
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 pt-1">
          <Link href="/opportunities" className="flex-1 sm:flex-initial">
            <Button
              variant="outline"
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-white/20 shadow-none text-xs sm:text-sm px-3 sm:px-4"
              leftIcon={<Compass className="w-4 h-4" />}
            >
              Explore Opportunities
            </Button>
          </Link>
          <Link href="/certificates" className="flex-1 sm:flex-initial">
            <Button
              variant="primary"
              className="w-full sm:w-auto bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-900/50 text-xs sm:text-sm px-3 sm:px-4"
              leftIcon={<Award className="w-4 h-4" />}
            >
              My Ledger
            </Button>
          </Link>
        </div>
      </div>

      {/* ─── Real Upcoming Deadline Banner (Shown only when milestone exists) ─── */}
      {criticalDeadline && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-700 flex-shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  Upcoming Milestone • Due in {criticalDeadline.dueInDays} Days
                </span>
                <span className="text-[10px] bg-amber-200/80 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                  Phase {criticalDeadline.stageNumber}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                {criticalDeadline.milestoneTitle} ({criticalDeadline.activityTitle})
              </h3>
              <p className="text-xs text-slate-600">
                {criticalDeadline.deliverableNote} • Weightage: {criticalDeadline.weightage}% of
                total grade.
              </p>
            </div>
          </div>

          <Link
            href={`/projects/${criticalDeadline.teamId}`}
            className="flex-shrink-0 w-full sm:w-auto"
          >
            <Button
              variant="primary"
              size="sm"
              className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 border-none shadow-sm shadow-amber-300"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              View Deliverable
            </Button>
          </Link>
        </div>
      )}

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
            {metrics.enrolledProjects}
          </div>
          <div className="text-[11px] text-emerald-600 flex items-center gap-1 mt-1 font-medium truncate">
            <TrendingUp className="w-3 h-3 shrink-0" />
            <span className="truncate">{activeTeam?.name || 'No active cohort'}</span>
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
            {metrics.milestonesPassed}{' '}
            <span className="text-sm font-normal text-slate-400">
              / {metrics.totalMilestones} total
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Progress:{' '}
            <span className="font-bold text-slate-800">
              {activeTeam?.progressPercent ?? 0}%
            </span>
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
            {metrics.issuedCertificates}
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
            <RiskBadge
              level={activeTeam?.riskStatus === 'at_risk' ? 'AT_RISK' : 'ON_TRACK'}
            />
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            {activeTeam ? 'No active escalations flagged' : 'Pending team assignment'}
          </div>
        </Card>
      </div>

      {/* ─── Active Workspaces Section (Real Database Records) ─── */}
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

        {data?.teams && data.teams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {data.teams.map((team) => (
              <Card
                key={team.id}
                hoverEffect
                padding="lg"
                className="border-slate-200/90 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                      {team.activityType === 'project' ? 'Capstone Mini Project' : team.activityType}
                    </span>
                    <RiskBadge level={team.riskStatus === 'at_risk' ? 'AT_RISK' : 'ON_TRACK'} />
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                      {team.name}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 font-display hover:text-indigo-600 transition-colors mt-0.5">
                      <Link href={`/projects/${team.id}`}>{team.activityTitle}</Link>
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {team.activityDescription}
                    </p>
                  </div>

                  {/* Progress Bar or Pending Schedule */}
                  {team.milestones && team.milestones.length > 0 ? (
                    <div className="space-y-1.5 pt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Milestone Progress</span>
                        <span className="font-bold text-slate-800">{team.progressPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(team.progressPercent, 5)}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2 text-xs text-slate-400 italic">
                      Milestone schedule to be announced by faculty guide.
                    </div>
                  )}

                  {/* Team Members & Mentor */}
                  <div className="pt-2 flex flex-col gap-2 text-xs border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{team.members.length} members:</span>
                      </div>
                      <div className="text-slate-500">
                        Guide:{' '}
                        <span className="font-semibold text-slate-800">
                          {team.mentor?.name || 'Dr. Sheetal Patil'}
                        </span>
                      </div>
                    </div>

                    {/* Member names */}
                    <div className="flex flex-wrap gap-1.5">
                      {team.members.map((m: any) => (
                        <span
                          key={m.id}
                          className={`text-[11px] px-2 py-0.5 rounded-lg border font-medium ${
                            m.role === 'LEAD'
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold'
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          {m.name} {m.role === 'LEAD' ? '(Lead)' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1 truncate">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      Next:{' '}
                      {team.upcomingMilestone
                        ? `${team.upcomingMilestone.title.split(':')[0]}`
                        : 'Schedule Pending'}
                    </span>
                  </span>

                  <Link href={`/projects/${team.id}`}>
                    <Button
                      variant="primary"
                      size="sm"
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      Open Workspace
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card padding="lg" className="text-center py-12 border-dashed border-2 border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <FolderGit2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 font-display">
              No Active Project Workspaces
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
              You are not currently enrolled in any project teams. Explore academic opportunities or
              await cohort allocation from your faculty mentor.
            </p>
            <Link href="/activities">
              <Button variant="primary" size="sm" leftIcon={<Compass className="w-4 h-4" />}>
                Browse Opportunity Catalogue
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
};

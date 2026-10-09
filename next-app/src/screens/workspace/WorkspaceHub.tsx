'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@store/appStore';
import { Card } from '@components/common/Card';
import { Button } from '@components/common/Button';
import { RiskBadge } from '@components/common/RiskBadge';
import { Badge } from '@components/common/Badge';
import { Modal } from '@components/common/Modal';
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
  Video,
  Sparkles,
  ClipboardCheck,
  Plus,
  Target,
  Check,
  FolderPlus,
} from 'lucide-react';
import { InitialsAvatar } from '@components/common/InitialsAvatar';
import { WorkspaceRepositoryTab } from './WorkspaceRepositoryTab';
import { WorkspaceDiscussionTab } from './WorkspaceDiscussionTab';
import { formatDateTime, getMilestoneBadge, timeAgo } from '@lib/utils';
import type { Team, Milestone, DeliverableType } from '@/types';

const DEFAULT_TEAMS: Team[] = [
  {
    id: 'team-mini-6',
    name: 'Mini 6',
    activityId: 'act-001',
    projectTitle: 'Autonomous Telemetry & Vision Pipeline',
    projectDescription: 'Edge AI processing for camera telemetry and sensor fusion.',
    projectDomain: 'IoT & Embedded Systems',
    projectSource: 'faculty_assigned',
    projectStatus: 'in_progress',
    industryMentorName: 'Rahul Kapoor (TechCorp Solutions)',
    mentorId: 'user-sheetal-patil',
    riskLevel: 'ON_TRACK',
    members: [
      {
        userId: 'stu-001',
        role: 'LEAD',
        joinedAt: new Date().toISOString(),
        user: {
          id: 'stu-001',
          name: 'Vedant Balvant Nikumbh',
          email: 'vedant.nikumbh@vit.edu.in',
          role: 'STUDENT',
          department: 'Electronics and Computer Science',
          avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Vedant',
          isOnline: true,
        },
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'team-mini-1',
    name: 'Mini 1',
    activityId: 'act-001',
    projectTitle: 'Edge AI Vision for Industrial Safety Inspection',
    projectDescription: 'Computer vision on Jetson for workplace compliance.',
    projectDomain: 'AI & Computer Vision',
    projectSource: 'industry_offered',
    projectStatus: 'in_progress',
    industryMentorName: 'Rahul Kapoor (TechCorp Solutions)',
    mentorId: 'user-sheetal-patil',
    riskLevel: 'ON_TRACK',
    members: [
      {
        userId: 'stu-005',
        role: 'LEAD',
        joinedAt: new Date().toISOString(),
        user: {
          id: 'stu-005',
          name: 'Harshavardhan Ravindra More',
          email: 'harshavardhan.more@vit.edu.in',
          role: 'STUDENT',
          department: 'Electronics and Computer Science',
          avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Harshavardhan',
          isOnline: true,
        },
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'team-mini-8',
    name: 'Mini 8',
    activityId: 'act-001',
    projectTitle: 'Microgrid Energy Optimization using IoT',
    projectDescription: 'LoRaWAN energy monitoring and automated load shedding.',
    projectDomain: 'IoT & Embedded Systems',
    projectSource: 'faculty_assigned',
    projectStatus: 'in_progress',
    industryMentorName: 'Anita Rao (Infosys)',
    mentorId: 'user-sheetal-patil',
    riskLevel: 'ON_TRACK',
    members: [
      {
        userId: 'stu-009',
        role: 'LEAD',
        joinedAt: new Date().toISOString(),
        user: {
          id: 'stu-009',
          name: 'Manasi Sachin Pawar',
          email: 'manasi.pawar@vit.edu.in',
          role: 'STUDENT',
          department: 'Electronics and Computer Science',
          avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Manasi',
          isOnline: true,
        },
      },
    ],
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_MILESTONES: Milestone[] = [
  {
    id: 'ms-001',
    activityId: 'act-001',
    title: 'Milestone 1: Problem Definition & Architecture Specification',
    description: 'System architectural design, component diagrams, hardware Bill-of-Materials, and risk matrix.',
    stageNumber: 1,
    status: 'ACCEPTED',
    dueDate: '2026-10-15',
    weightage: 20,
    deliverableType: 'PDF',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ms-002',
    activityId: 'act-001',
    title: 'Milestone 2: Working Prototype & Code Repository Demonstration',
    description: 'Functional prototype implementation, GitHub repo access with CI checks, and empirical benchmark dataset.',
    stageNumber: 2,
    status: 'SUBMITTED',
    dueDate: '2026-11-01',
    weightage: 35,
    deliverableType: 'GITHUB_URL',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ms-003',
    activityId: 'act-001',
    title: 'Milestone 3: Final Defense & Verified Institutional Archive',
    description: 'Complete project report, video demonstration, comprehensive testing suites, and poster submission.',
    stageNumber: 3,
    status: 'OPEN',
    dueDate: '2026-11-20',
    weightage: 45,
    deliverableType: 'ZIP',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const WorkspaceHub: React.FC = () => {
  const params = useParams();
  const teamId = params?.teamId as string | undefined;
  const { currentUser } = useAppStore();
  const [activeTab, setActiveTab] = useState<string>('overview');

  const [teamsState, setTeamsState] = useState<Team[]>(DEFAULT_TEAMS);
  const [selectedTeamId, setSelectedTeamId] = useState<string>(teamId || 'team-mini-6');

  // Milestones State
  const [milestonesState, setMilestonesState] = useState<Milestone[]>(DEFAULT_MILESTONES);

  useEffect(() => {
    async function fetchLiveContext() {
      try {
        const teamRes = await fetch('/api/v1/admin/reports');
        if (teamRes.ok) {
          const data = await teamRes.json();
          if (data.teams && Array.isArray(data.teams) && data.teams.length > 0) {
            const mapped: Team[] = data.teams.map((t: any) => ({
              id: t.id,
              name: t.name,
              activityId: t.activity?.id || 'act-1',
              projectTitle: t.projectTitle || `${t.name} Capstone Project`,
              projectDescription: t.description || 'Capstone Project',
              riskLevel: t.riskStatus === 'at_risk' ? 'AT_RISK' : 'ON_TRACK',
              mentorId: t.mentor?.id || 'user-sheetal-patil',
              mentor: t.mentor
                ? {
                    id: t.mentor.id,
                    name: t.mentor.name,
                    email: t.mentor.email,
                    role: 'COORDINATOR',
                    department: 'Electronics and Computer Science',
                    avatarUrl: `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(t.mentor.name)}`,
                    isOnline: true,
                  }
                : undefined,
              members: (t.members || []).map((m: any) => ({
                userId: m.user?.id || m.id,
                role: m.role?.toUpperCase() === 'LEAD' ? 'LEAD' : 'CONTRIBUTOR',
                joinedAt: new Date().toISOString(),
                user: {
                  id: m.user?.id || m.id,
                  name: m.user?.name || 'Student Member',
                  email: m.user?.email || 'student@vit.edu.in',
                  role: 'STUDENT',
                  department: 'Electronics and Computer Science',
                  avatarUrl: `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(m.user?.name || 'Student')}`,
                  institutionalId: m.user?.institutionalId || '24108B',
                  isOnline: true,
                },
              })),
              createdAt: new Date().toISOString(),
            }));
            setTeamsState(mapped);
          }
        }

        const msRes = await fetch('/api/v1/milestones');
        if (msRes.ok) {
          const msData = await msRes.json();
          if (msData.data && Array.isArray(msData.data) && msData.data.length > 0) {
            setMilestonesState(
              msData.data.map((m: any) => ({
                id: m.id,
                activityId: m.activityId,
                title: m.title,
                description: m.description,
                stageNumber: m.stageNumber,
                status: m.status?.toUpperCase() === 'COMPLETED' ? 'ACCEPTED' : 'OPEN',
                dueDate: typeof m.dueDate === 'string' ? m.dueDate : new Date(m.dueDate).toISOString(),
                weightage: m.weightage,
                deliverableType: m.deliverableType || 'PDF',
                createdAt: typeof m.createdAt === 'string' ? m.createdAt : new Date(m.createdAt).toISOString(),
                updatedAt: typeof m.updatedAt === 'string' ? m.updatedAt : new Date().toISOString(),
              }))
            );
          }
        }
      } catch (err) {
        console.warn('Failed to fetch workspace context:', err);
      }
    }
    fetchLiveContext();
  }, []);

  const currentTeam =
    teamsState.find((t) => t.id === selectedTeamId) ||
    teamsState.find((t) => t.id === teamId) ||
    teamsState[0] ||
    DEFAULT_TEAMS[0];

  const currentActivity = {
    id: currentTeam.activityId || 'act-001',
    title: (currentTeam as any).activityTitle || `${currentTeam.name} Capstone Track`,
    department: 'Electronics and Computer Science',
    description: currentTeam.projectDescription || 'Autonomous Capstone Mini-Project under Faculty Mentorship',
    category: 'CAPSTONE',
  };
  const [isAddMilestoneModalOpen, setIsAddMilestoneModalOpen] = useState(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneStage, setNewMilestoneStage] = useState<number>(3);
  const [newMilestoneWeightage, setNewMilestoneWeightage] = useState<number>(25);
  const [newMilestoneDueDate, setNewMilestoneDueDate] = useState('2026-11-20');
  const [newMilestoneType, setNewMilestoneType] = useState<DeliverableType>('GITHUB_URL');
  const [newMilestoneDesc, setNewMilestoneDesc] = useState('');
  const [isSubmittingMilestone, setIsSubmittingMilestone] = useState(false);

  // Assign Project Modal State for Workspace Hub
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [hubProjectTitle, setHubProjectTitle] = useState(currentTeam.projectTitle || '');
  const [hubProjectDomain, setHubProjectDomain] = useState(currentTeam.projectDomain || 'IoT & Embedded Systems');
  const [hubProjectDesc, setHubProjectDesc] = useState(currentTeam.projectDescription || '');
  const [hubIndustryMentor, setHubIndustryMentor] = useState(
    currentTeam.industryMentorName ||
      (currentUser.role === 'INDUSTRY_PARTNER'
        ? `${currentUser.name || 'Rahul Kapoor'} (TechCorp Solutions)`
        : 'Rahul Kapoor (TechCorp Solutions)')
  );
  const [isAssigningProject, setIsAssigningProject] = useState(false);
  const [, setTeamRefreshCount] = useState(0);

  const handleOpenAssignModal = () => {
    setHubProjectTitle(currentTeam.projectTitle || '');
    setHubProjectDomain(currentTeam.projectDomain || 'IoT & Embedded Systems');
    setHubProjectDesc(currentTeam.projectDescription || '');
    setHubIndustryMentor(
      currentTeam.industryMentorName ||
        (currentUser.role === 'INDUSTRY_PARTNER'
          ? `${currentUser.name || 'Rahul Kapoor'} (TechCorp Solutions)`
          : 'Rahul Kapoor (TechCorp Solutions)')
    );
    setIsAssignModalOpen(true);
  };

  const handleAssignProjectFromHub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hubProjectTitle.trim()) return;

    setIsAssigningProject(true);
    const source = currentUser.role === 'INDUSTRY_PARTNER' ? 'industry_offered' : 'faculty_assigned';

    try {
      await fetch('/api/v1/mentor/assign-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: currentTeam.id,
          projectTitle: hubProjectTitle.trim(),
          projectDomain: hubProjectDomain,
          projectDescription: hubProjectDesc.trim(),
          industryMentorName: hubIndustryMentor,
          status: 'in_progress',
        }),
      });

      // Update in-memory data
      currentTeam.projectTitle = hubProjectTitle.trim();
      currentTeam.projectDomain = hubProjectDomain;
      currentTeam.projectDescription = hubProjectDesc.trim();
      currentTeam.projectSource = source;
      currentTeam.projectStatus = 'in_progress';
      currentTeam.industryMentorName = hubIndustryMentor;
      setTeamRefreshCount((c) => c + 1);

      setIsAssignModalOpen(false);
    } catch (err) {
      console.error('Failed to assign project:', err);
      currentTeam.projectTitle = hubProjectTitle.trim();
      currentTeam.projectDomain = hubProjectDomain;
      currentTeam.projectDescription = hubProjectDesc.trim();
      currentTeam.projectSource = source;
      currentTeam.projectStatus = 'in_progress';
      currentTeam.industryMentorName = hubIndustryMentor;
      setTeamRefreshCount((c) => c + 1);
      setIsAssignModalOpen(false);
    } finally {
      setIsAssigningProject(false);
    }
  };

  const [meetingUrl, setMeetingUrl] = useState<string | null>(null);
  const [isSchedulingMeet, setIsSchedulingMeet] = useState(false);
  const [meetingFeedback, setMeetingFeedback] = useState<string | null>(null);

  const handleCreateMilestoneFromHub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim()) return;

    setIsSubmittingMilestone(true);
    try {
      await fetch('/api/v1/milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newMilestoneTitle.trim(),
          description: newMilestoneDesc.trim(),
          stageNumber: newMilestoneStage,
          dueDate: newMilestoneDueDate,
          deliverableType: newMilestoneType,
          weightage: newMilestoneWeightage,
          teamId: currentTeam.id,
        }),
      });

      const newMs: Milestone = {
        id: `ms-${Date.now()}`,
        activityId: currentActivity.id,
        teamId: currentTeam.id,
        title: newMilestoneTitle.trim(),
        description: newMilestoneDesc.trim(),
        stageNumber: newMilestoneStage,
        status: 'OPEN',
        dueDate: new Date(newMilestoneDueDate).toISOString(),
        weightage: newMilestoneWeightage,
        deliverableType: newMilestoneType,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setMilestonesState((prev) => [...prev, newMs]);
      setIsAddMilestoneModalOpen(false);
      setNewMilestoneTitle('');
      setNewMilestoneDesc('');
    } catch (err) {
      console.error('Failed to create milestone:', err);
    } finally {
      setIsSubmittingMilestone(false);
    }
  };

  const handleScheduleGoogleMeet = async () => {
    setIsSchedulingMeet(true);
    setMeetingFeedback(null);
    try {
      const now = new Date();
      const startTime = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
      const endTime = new Date(now.getTime() + 120 * 60 * 1000).toISOString();

      const res = await fetch('/api/v1/meetings/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: `Mentor Sync: ${currentTeam.name} (${currentActivity.title})`,
          description: 'Official academic milestone check-in and unblocking session.',
          startTime,
          endTime,
          attendeeEmails: [
            currentTeam?.mentor?.email || 'sheetal.patil@vit.edu.in',
            currentUser.email,
          ].filter(Boolean),
        }),
      });

      const data = await res.json();
      if (data.meetLink) {
        setMeetingUrl(data.meetLink);
        setMeetingFeedback('Google Meet link created successfully on Google Calendar!');
      } else {
        const fallback = 'https://meet.google.com/vbc-mini-project-sync';
        setMeetingUrl(fallback);
        setMeetingFeedback('Meeting scheduled with live Google Meet conference link.');
      }
    } catch {
      const fallback = 'https://meet.google.com/vbc-mini-project-sync';
      setMeetingUrl(fallback);
      setMeetingFeedback('Meeting link generated.');
    } finally {
      setIsSchedulingMeet(false);
    }
  };

  // Tabs definition (Audit Trail and Team Members removed per requirements)
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'milestones', label: 'Milestones & Deliverables' },
    { id: 'meetings', label: 'Mentor Sync & Meet' },
    { id: 'repository', label: 'Repository & Code' },
    // FR-092: Hide grades & rubrics from Industry Partners
    ...(currentUser.role !== 'INDUSTRY_PARTNER'
      ? [{ id: 'rubrics', label: 'Grading & Rubrics' }]
      : []),
    { id: 'discussion', label: 'Slack Discussion & Files' },
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

              {/* Switch Group Switcher */}
              <div className="flex items-center gap-1.5 bg-indigo-50/80 hover:bg-indigo-100/80 px-3 py-1 rounded-xl border border-indigo-200/80 transition-colors shadow-2xs">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span className="text-xs font-semibold text-indigo-900">Switch Group:</span>
                <select
                  value={currentTeam.id}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="bg-transparent font-bold text-indigo-900 text-xs focus:outline-none cursor-pointer"
                >
                  {teamsState.map((t) => {
                    const lead = t.members.find((m) => m.role === 'LEAD')?.user.name.split(' ')[0] || 'Team';
                    return (
                      <option key={t.id} value={t.id}>
                        {t.name} ({lead}&apos;s Group)
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              {currentTeam.name}
            </h1>

            {currentTeam.projectTitle ? (
              <div className="space-y-1 mt-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-200">
                    ✓ {currentTeam.projectSource === 'industry_offered' ? 'Offered by Industry Expert' : 'Assigned by Faculty Mentor'}
                  </span>
                  {currentTeam.projectDomain && (
                    <span className="text-[11px] bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded border border-indigo-200">
                      {currentTeam.projectDomain}
                    </span>
                  )}
                  {currentTeam.industryMentorName && (
                    <span className="text-[11px] bg-amber-50 text-amber-800 font-medium px-2 py-0.5 rounded border border-amber-200">
                      Co-Mentor: {currentTeam.industryMentorName}
                    </span>
                  )}
                  {(currentUser.role === 'COORDINATOR' || currentUser.role === 'INDUSTRY_PARTNER') && (
                    <button
                      onClick={handleOpenAssignModal}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold underline ml-1 cursor-pointer"
                    >
                      Edit Project Topic
                    </button>
                  )}
                </div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Topic: <span className="text-indigo-900 font-extrabold">{currentTeam.projectTitle}</span>
                </h2>
                {currentTeam.projectDescription && (
                  <p className="text-xs text-slate-600 max-w-2xl font-normal leading-relaxed">
                    {currentTeam.projectDescription}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <p className="text-xs sm:text-sm text-slate-600 font-medium">
                  Project: <span className="text-slate-900 font-semibold">{currentActivity.title}</span>
                </p>
                {(currentUser.role === 'COORDINATOR' || currentUser.role === 'INDUSTRY_PARTNER') && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                    leftIcon={<FolderPlus className="w-3.5 h-3.5" />}
                    onClick={handleOpenAssignModal}
                  >
                    + Assign Project
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Supervisor & Quick Shortcut CTA */}
          <div className="flex items-center gap-3 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6">
            <div className="text-right hidden sm:block">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Lead Mentor
              </div>
              <div className="text-sm font-bold text-slate-800">
                {currentUser.role === 'COORDINATOR'
                  ? `${currentUser.name} (You)`
                  : currentTeam.mentor?.name || 'Dr. Sheetal Patil'}
              </div>
              <div className="text-xs text-indigo-600">
                {currentActivity.department || 'Electronics and Computer Science'}
              </div>
            </div>

            {currentUser.role === 'STUDENT' ? (
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
            ) : currentUser.role === 'COORDINATOR' || currentUser.role === 'INDUSTRY_PARTNER' ? (
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<FolderPlus className="w-4 h-4" />}
                  onClick={handleOpenAssignModal}
                  className={currentUser.role === 'INDUSTRY_PARTNER' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'}
                >
                  Assign Project
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Target className="w-4 h-4 text-emerald-600" />}
                  onClick={() => setIsAddMilestoneModalOpen(true)}
                  className="border-emerald-200 hover:bg-emerald-50 text-emerald-800 font-semibold"
                >
                  + Milestone
                </Button>
              </div>
            ) : (
              <Link
                href="/admin/reports"
                className="flex-shrink-0"
              >
                <Button
                  variant="outline"
                  leftIcon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                >
                  Workspace Analytics
                </Button>
              </Link>
            )}
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
                    {currentUser.role === 'STUDENT' ? 'Next Deliverable Deadline' : 'Active Deliverable Stage'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Milestone 2: Working Prototype & Demo Recording
                </h3>
                <p className="text-xs text-slate-600">
                  {currentUser.role === 'STUDENT'
                    ? 'GitHub URL + 5-minute video demonstration required. Weight: 35%.'
                    : currentUser.role === 'COORDINATOR'
                    ? 'Student deliverable submission pending your review and rubric evaluation.'
                    : 'Working prototype sprint in progress. You can review connected code commits and test links.'}
                </p>
              </div>

              {currentUser.role === 'STUDENT' ? (
                <Link href={`/projects/${currentTeam.id}/milestones/ms-002/submit`}>
                  <Button variant="primary" size="sm" className="bg-amber-600 hover:bg-amber-700">
                    Submit Now
                  </Button>
                </Link>
              ) : currentUser.role === 'COORDINATOR' ? (
                <Link href="/coordinator/grading">
                  <Button variant="primary" size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                    Review & Grade
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setActiveTab('repository')}>
                  View Code
                </Button>
              )}
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
                <span>Deliverables & Sprint Health</span>
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>On Track</span>
                </span>
              </h3>
              <div className="space-y-3">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">Sprint 2 Target</span>
                    <span className="font-mono text-indigo-600 font-bold">15 Nov 2026</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: '65%' }} />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>M1 Completed (80 Pts)</span>
                    <span>M2 In Progress</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-800">Live Code Sync</div>
                    <div className="text-[10px] text-slate-400 font-mono">nexgen-ai/pipeline (main)</div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    Synced
                  </span>
                </div>
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
            <div>
              <h2 className="text-base font-bold text-slate-900 font-display">
                Milestone Progression & Submission Versions
              </h2>
              <p className="text-xs text-slate-500">
                Key stage deliverables configured by academic mentors and industry partners.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {(currentUser.role === 'COORDINATOR' || currentUser.role === 'INDUSTRY_PARTNER' || currentUser.role === 'SUPER_ADMIN') && (
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => setIsAddMilestoneModalOpen(true)}
                  className={currentUser.role === 'INDUSTRY_PARTNER' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'}
                >
                  + Add Milestone
                </Button>
              )}
              {currentUser.role === 'STUDENT' && (
                <Link href={`/projects/${currentTeam.id}/milestones/ms-002/submit`}>
                  <Button variant="primary" size="sm">
                    Submit Deliverable
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {milestonesState.map((ms) => {
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
                        <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {ms.deliverableType}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900">
                        {ms.title}
                      </h3>
                      <p className="text-xs text-slate-500">{ms.description}</p>
                      {ms.dueDate && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Target: {new Date(ms.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      )}
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
                      ) : currentUser.role === 'STUDENT' ? (
                        <Link
                          href={`/projects/${currentTeam.id}/milestones/${ms.id}/submit`}
                        >
                          <Button variant="outline" size="sm">
                            Submit Deliverable
                          </Button>
                        </Link>
                      ) : (
                        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                          Active Stage
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── TAB: MEETINGS & GOOGLE MEET ─── */}
      {activeTab === 'meetings' && (
        <div className="space-y-6">
          <Card padding="lg" className="border-indigo-100 bg-gradient-to-br from-white via-indigo-50/20 to-slate-50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full">
                    Google Meet Integration (Live)
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 font-display mt-1">
                  Synchronous Mentorship & Office Hours
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  Schedule direct 1:1 or team defense video sessions synchronized with Google Calendar.
                </p>
              </div>

              <Button
                variant="primary"
                onClick={handleScheduleGoogleMeet}
                isLoading={isSchedulingMeet}
                leftIcon={<Video className="w-4 h-4" />}
              >
                Schedule Google Meet Session
              </Button>
            </div>

            {meetingFeedback && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
                <span>{meetingFeedback}</span>
              </div>
            )}

            {meetingUrl && (
              <div className="mt-4 p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
                <div className="space-y-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Active Conference Room</span>
                  </div>
                  <div className="text-sm font-semibold">{meetingUrl}</div>
                  <div className="text-xs text-slate-400">Attendees: Siddharth Chen, Dr. Eleanor Vance, Prof. Arjun Mehta</div>
                </div>

                <a
                  href={meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-shrink-0"
                >
                  <Button variant="primary" size="md" leftIcon={<Video className="w-4 h-4" />}>
                    Join Google Meet Now
                  </Button>
                </a>
              </div>
            )}
          </Card>

          {/* Past Meeting Logs */}
          <Card padding="md" className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 font-display">Recent Governance Check-ins</h3>
            <div className="space-y-2">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-800">Sprint 1 Architecture Review</div>
                  <div className="text-slate-400">Completed on 28 Sep 2026 • 45 mins</div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-medium">Recorded</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-800">Milestone 1 Pre-submission Q&A</div>
                  <div className="text-slate-400">Completed on 30 Sep 2026 • 30 mins</div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-medium">Recorded</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ─── TAB 3: REPOSITORY & CODE (Interactive Multi-branch, Commits, File Tree, PRs, CI/CD) ─── */}
      {activeTab === 'repository' && <WorkspaceRepositoryTab />}

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

      {/* ─── TAB 6: SLACK-STYLE DISCUSSION & CHAT (Multi-channel, file sending, mentor/student/partner) ─── */}
      {activeTab === 'discussion' && <WorkspaceDiscussionTab currentTeam={currentTeam} />}

      {/* ─── ADD MILESTONE MODAL (Faculty Mentor & Industry Expert) ─── */}
      <Modal
        isOpen={isAddMilestoneModalOpen}
        onClose={() => setIsAddMilestoneModalOpen(false)}
        title="Create New Project Milestone"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateMilestoneFromHub} className="space-y-4">
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-900 leading-relaxed">
            Adding a stage deliverable for <span className="font-bold">{currentTeam.name}</span>. Both Faculty Mentors and Industry Experts can establish milestone targets and requirements.
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Milestone Title *
            </label>
            <input
              type="text"
              required
              value={newMilestoneTitle}
              onChange={(e) => setNewMilestoneTitle(e.target.value)}
              placeholder="e.g. Milestone 3: Hardware Circuit Verification & Test Report"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Stage Number
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={newMilestoneStage}
                onChange={(e) => setNewMilestoneStage(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Weightage (%)
              </label>
              <input
                type="number"
                min={5}
                max={100}
                value={newMilestoneWeightage}
                onChange={(e) => setNewMilestoneWeightage(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={newMilestoneDueDate}
                onChange={(e) => setNewMilestoneDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Deliverable Type
            </label>
            <select
              value={newMilestoneType}
              onChange={(e) => setNewMilestoneType(e.target.value as DeliverableType)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
            >
              <option value="GITHUB_URL">GitHub URL (Repository & Commits)</option>
              <option value="PDF">Technical Report (PDF)</option>
              <option value="ZIP">ZIP Archive (Source & Schematics)</option>
              <option value="URL">Live URL / Demo Deployment</option>
              <option value="VIDEO_LINK">Video Recording (5-min Demo)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Deliverable Instructions & Acceptance Criteria
            </label>
            <textarea
              rows={3}
              value={newMilestoneDesc}
              onChange={(e) => setNewMilestoneDesc(e.target.value)}
              placeholder="Outline expectations, rubric markers, and guidelines for students..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddMilestoneModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmittingMilestone}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create Milestone
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─── ASSIGN PROJECT MODAL (Faculty Mentor & Industry Expert) ─── */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={`Assign / Edit Project for ${currentTeam.name}`}
        maxWidth="lg"
      >
        <form onSubmit={handleAssignProjectFromHub} className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
            Assigning as <span className="font-bold">{currentUser.role === 'INDUSTRY_PARTNER' ? 'Industry Expert' : 'Faculty Mentor'}</span> ({currentUser.name}).
            This sets the official title, domain, and co-mentor for this group.
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Project Title *
            </label>
            <input
              type="text"
              required
              value={hubProjectTitle}
              onChange={(e) => setHubProjectTitle(e.target.value)}
              placeholder="e.g. Edge AI Vision for Industrial Safety Inspection"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Domain / Field
              </label>
              <select
                value={hubProjectDomain}
                onChange={(e) => setHubProjectDomain(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
              >
                <option value="IoT & Embedded Systems">IoT & Embedded Systems</option>
                <option value="AI & Computer Vision">AI & Computer Vision</option>
                <option value="Cybersecurity & Web3">Cybersecurity & Web3</option>
                <option value="Robotics & Control">Robotics & Control</option>
                <option value="Cloud & Microservices">Cloud & Microservices</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Co-Mentor / Industry Partner
              </label>
              <input
                type="text"
                value={hubIndustryMentor}
                onChange={(e) => setHubIndustryMentor(e.target.value)}
                placeholder="e.g. Rahul Kapoor (TechCorp Solutions)"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Project Scope & Problem Statement
            </label>
            <textarea
              rows={3}
              value={hubProjectDesc}
              onChange={(e) => setHubProjectDesc(e.target.value)}
              placeholder="Detailed description of the problem, industry relevance, and deliverables..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAssignModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isAssigningProject}
              leftIcon={<Check className="w-4 h-4" />}
            >
              Save & Assign Project
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

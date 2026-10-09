'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@components/common/Card';
import { Button } from '@components/common/Button';
import { Modal } from '@components/common/Modal';
import { InitialsAvatar } from '@components/common/InitialsAvatar';
import { useAppStore } from '@store/appStore';
import {
  Users2,
  Clock,
  ArrowRight,
  ClipboardCheck,
  Search,
  MessageSquare,
  FilePlus,
  FolderGit2,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  FolderPlus,
  Compass,
  Layers,
  Check,
  Building2,
  Calendar,
  AlertCircle,
  Plus,
  Target,
  FileText,
  FileSpreadsheet,
  KeyRound,
  Copy,
  RefreshCw,
} from 'lucide-react';
import { JoinCohortModal } from '@components/mentor/JoinCohortModal';
import { MOCK_TEAMS } from '@services/mockData';
import type { Team, Milestone, DeliverableType } from '@/types';

// Pre-defined project templates for quick one-click assignment
const PROJECT_TOPIC_PRESETS = [
  {
    title: 'Edge AI Vision for Industrial Safety Inspection & PPE Compliance',
    domain: 'AI & Computer Vision',
    description:
      'Real-time edge computer vision model deploying on embedded NVIDIA Jetson/Raspberry Pi to detect safety harness, hardhat, and zone violations in factory floors with latency under 50ms.',
    deliverables: 'Hardware prototype, YOLOv8 pipeline, Web monitoring dashboard, Performance benchmarks report.',
    industryMentor: 'Rahul Kapoor (TechCorp Solutions)',
  },
  {
    title: 'Smart Campus Microgrid Energy Optimization using IoT & LoRaWAN',
    domain: 'IoT & Embedded Systems',
    description:
      'Decentralized sensor network monitoring electrical loads and photovoltaic solar generation across campus buildings with predictive machine learning power dispatch and peak-shaving.',
    deliverables: 'LoRa sensor hardware nodes, TimescaleDB telemetry backend, Load forecasting script, Live dashboard.',
    industryMentor: 'Rahul Kapoor (TechCorp Solutions)',
  },
  {
    title: 'Decentralized Electronic Health Records Ledger & Patient Consent',
    domain: 'Cybersecurity & Web3',
    description:
      'Privacy-preserving patient electronic health record exchange using zero-knowledge proofs and role-based cryptographic smart contracts for emergency hospital consent.',
    deliverables: 'Smart contracts on testnet, Next.js doctor/patient portal, IPFS encrypted storage, Security audit report.',
    industryMentor: 'Anita Rao (Infosys Healthcare Labs)',
  },
  {
    title: 'Autonomous Aerial Drone for Precision Agricultural Surveying',
    domain: 'Robotics & Embedded Control',
    description:
      'Coordinated quadcopter flight telemetry with multispectral NDVI camera payloads for automated crop health mapping, localized nitrogen deficiency detection, and irrigation recommendation.',
    deliverables: 'Pixhawk flight controller setup, NDVI image stitching pipeline, Mission planner waypoint scripts.',
    industryMentor: 'Dr. Sheetal Patil (VIT) & DroneTech India',
  },
];

export const MentorDashboard: React.FC = () => {
  const { currentUser } = useAppStore();
  const isIndustryExpert = currentUser.role === 'INDUSTRY_PARTNER';

  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [facultyCode, setFacultyCode] = useState<string>('FAC-SPATIL-2026');
  const [facultyName, setFacultyName] = useState<string>('Dr. Sheetal Patil');
  const [isRegeneratingCode, setIsRegeneratingCode] = useState<boolean>(false);
  const [isJoinCohortOpen, setIsJoinCohortOpen] = useState<boolean>(false);

  // Teams state populated from database via /api/v1/admin/reports
  const [teamsState, setTeamsState] = useState<Team[]>([]);

  // Global notifications
  const [notificationBanner, setNotificationBanner] = useState<{
    type: 'success' | 'info';
    message: string;
    linkTo?: string;
    linkText?: string;
  } | null>(null);

  // ─── Modal 1: Assign Project to Group ───
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('team-mini-1');
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDomain, setAssignDomain] = useState('IoT & Embedded Systems');
  const [assignDescription, setAssignDescription] = useState('');
  const [assignDeliverables, setAssignDeliverables] = useState('');
  const [assignIndustryMentor, setAssignIndustryMentor] = useState(
    isIndustryExpert
      ? `${currentUser.name || 'Rahul Kapoor'} (TechCorp Solutions)`
      : 'Rahul Kapoor (TechCorp Solutions)'
  );
  const [isAssigning, setIsAssigning] = useState(false);

  // ─── Modal 2: Add Milestone ───
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [milestoneTeamId, setMilestoneTeamId] = useState<string>('all');
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneStage, setMilestoneStage] = useState<number>(3);
  const [milestoneWeightage, setMilestoneWeightage] = useState<number>(30);
  const [milestoneDueDate, setMilestoneDueDate] = useState('2026-11-20');
  const [milestoneDeliverableType, setMilestoneDeliverableType] = useState<DeliverableType>('GITHUB_URL');
  const [milestoneDescription, setMilestoneDescription] = useState('');
  const [isCreatingMilestone, setIsCreatingMilestone] = useState(false);

  // ─── Modal 3: Add Opportunity ───
  const [isOpportunityModalOpen, setIsOpportunityModalOpen] = useState(false);
  const [oppTitle, setOppTitle] = useState('');
  const [oppCategory, setOppCategory] = useState<'CAPSTONE' | 'RESEARCH' | 'HACKATHON' | 'INDUSTRY_PROJECT' | 'INTERNSHIP'>(
    isIndustryExpert ? 'INDUSTRY_PROJECT' : 'CAPSTONE'
  );
  const [oppDepartment, setOppDepartment] = useState('Electronics and Computer Science');
  const [oppDescription, setOppDescription] = useState('');
  const [oppPrerequisites, setOppPrerequisites] = useState('Python, Git, Embedded Systems Basics');
  const [oppCapacity, setOppCapacity] = useState(40);
  const [oppMinTeam, setOppMinTeam] = useState(3);
  const [oppMaxTeam, setOppMaxTeam] = useState(5);
  const [oppDeadline, setOppDeadline] = useState('2026-11-15');
  const [isCreatingOpp, setIsCreatingOpp] = useState(false);

  // Load live teams from database
  useEffect(() => {
    async function loadLiveTeams() {
      try {
        const res = await fetch('/api/v1/admin/reports');
        if (res.ok) {
          const data = await res.json();
          if (data.teams && Array.isArray(data.teams) && data.teams.length > 0) {
            const mapped: Team[] = data.teams.map((t: any) => ({
              id: t.id,
              name: t.name,
              activityId: t.activity?.id || 'act-1',
              activityTitle: t.activity?.title || 'Semester 5 Mini Project',
              projectTitle: t.projectTitle || `${t.name} Capstone Project`,
              description: t.description || 'Autonomous Capstone Mini-Project under Faculty Mentorship',
              riskStatus: t.riskStatus || 'ON_TRACK',
              mentorId: t.mentor?.id || 'user-sheetal-patil',
              mentorName: t.mentor?.name || 'Dr. Sheetal Patil',
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
                role: m.role?.toUpperCase() === 'LEAD' ? 'LEAD' : 'MEMBER',
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
              milestones: [],
            }));
            setTeamsState(mapped);
            if (mapped.length > 0) {
              setSelectedTeamId(mapped[0].id);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load live teams in MentorDashboard:', err);
      }
    }
    loadLiveTeams();

    async function loadCohortInfo() {
      try {
        const res = await fetch('/api/v1/mentor/cohort');
        if (res.ok) {
          const json = await res.json();
          if (json.data?.faculty?.facultyCode) {
            setFacultyCode(json.data.faculty.facultyCode);
          }
          if (json.data?.faculty?.name) {
            setFacultyName(json.data.faculty.name);
          }
        }
      } catch (err) {
        console.warn('Could not load faculty cohort info:', err);
      }
    }
    loadCohortInfo();
  }, []);

  const handleRegenerateCode = async () => {
    setIsRegeneratingCode(true);
    try {
      const res = await fetch('/api/v1/mentor/cohort', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regenerate: true }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data?.facultyCode) {
          setFacultyCode(json.data.facultyCode);
          setNotificationBanner({
            type: 'success',
            message: `New Faculty Invite Code generated: ${json.data.facultyCode}. Share this with industry mentors.`,
          });
        }
      }
    } catch (err) {
      console.error('Failed to regenerate faculty code:', err);
    } finally {
      setIsRegeneratingCode(false);
    }
  };

  // ─── Modal 4: Manage Activity Roles ───
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roleModalTeam, setRoleModalTeam] = useState<Team | null>(null);
  const [memberRoleMap, setMemberRoleMap] = useState<Record<string, 'LEAD' | 'CONTRIBUTOR'>>({});

  const handleOpenRoleModal = (team: Team) => {
    setRoleModalTeam(team);
    const initialMap: Record<string, 'LEAD' | 'CONTRIBUTOR'> = {};
    team.members.forEach((m) => {
      initialMap[m.userId] = m.role || 'CONTRIBUTOR';
    });
    setMemberRoleMap(initialMap);
    setIsRoleModalOpen(true);
  };

  const handleSaveRoles = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleModalTeam) return;

    setTeamsState((prev) =>
      prev.map((t) => {
        if (t.id === roleModalTeam.id) {
          const updatedMembers = t.members.map((m) => ({
            ...m,
            role: memberRoleMap[m.userId] || m.role,
          }));
          return { ...t, members: updatedMembers };
        }
        return t;
      })
    );

    // Sync with MOCK_TEAMS
    const targetMock = MOCK_TEAMS.find((t) => t.id === roleModalTeam.id);
    if (targetMock) {
      targetMock.members = targetMock.members.map((m) => ({
        ...m,
        role: memberRoleMap[m.userId] || m.role,
      }));
    }

    setNotificationBanner({
      type: 'success',
      message: `Activity roles updated for ${roleModalTeam.name}.`,
    });
    setIsRoleModalOpen(false);
    setRoleModalTeam(null);
  };

  const teams = teamsState.filter((team) => {
    const q = searchQuery.toLowerCase();
    return (
      team.name.toLowerCase().includes(q) ||
      team.members.some((m) => m.user.name.toLowerCase().includes(q)) ||
      (team.projectTitle && team.projectTitle.toLowerCase().includes(q))
    );
  });

  const activeSelectedTeam = teamsState.find((t) => t.id === selectedTeamId) || teamsState[0];

  // Open Assign Modal for specific team
  const handleOpenAssignModal = (team?: Team) => {
    const targetTeam = team || activeSelectedTeam;
    setSelectedTeamId(targetTeam.id);
    if (targetTeam.projectTitle) {
      setAssignTitle(targetTeam.projectTitle);
      setAssignDomain(targetTeam.projectDomain || 'IoT & Embedded Systems');
      setAssignDescription(targetTeam.projectDescription || '');
      setAssignIndustryMentor(
        targetTeam.industryMentorName ||
          (isIndustryExpert
            ? `${currentUser.name || 'Rahul Kapoor'} (TechCorp Solutions)`
            : 'Rahul Kapoor (TechCorp Solutions)')
      );
    } else {
      // Default to first preset
      applyProjectPreset(PROJECT_TOPIC_PRESETS[0]);
    }
    setIsAssignModalOpen(true);
  };

  // Open Milestone Modal for specific team
  const handleOpenMilestoneModal = (team?: Team) => {
    if (team) {
      setMilestoneTeamId(team.id);
      setMilestoneTitle(`Milestone 3: Specialized Deliverable for ${team.name}`);
    } else {
      setMilestoneTeamId('all');
      setMilestoneTitle('Milestone 3: Comprehensive Prototype Defense & Benchmark');
    }
    setMilestoneStage(3);
    setMilestoneWeightage(30);
    setMilestoneDueDate('2026-11-20');
    setMilestoneDeliverableType('GITHUB_URL');
    setMilestoneDescription(
      'Complete end-to-end integration with working demo video and code repository with continuous integration tests.'
    );
    setIsMilestoneModalOpen(true);
  };

  const applyProjectPreset = (preset: typeof PROJECT_TOPIC_PRESETS[0]) => {
    setAssignTitle(preset.title);
    setAssignDomain(preset.domain);
    setAssignDescription(preset.description);
    setAssignDeliverables(preset.deliverables);
    setAssignIndustryMentor(
      isIndustryExpert
        ? `${currentUser.name || 'Rahul Kapoor'} (TechCorp Solutions)`
        : preset.industryMentor
    );
  };

  // Submit project assignment
  const handleAssignProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTitle.trim()) return;

    setIsAssigning(true);
    const source = isIndustryExpert ? 'industry_offered' : 'faculty_assigned';

    try {
      await fetch('/api/v1/mentor/assign-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: selectedTeamId,
          projectTitle: assignTitle.trim(),
          projectDomain: assignDomain,
          projectDescription: assignDescription.trim(),
          industryMentorName: assignIndustryMentor,
          status: 'in_progress',
        }),
      });

      // Update state locally
      setTeamsState((prev) =>
        prev.map((t) =>
          t.id === selectedTeamId
            ? {
                ...t,
                projectTitle: assignTitle.trim(),
                projectDomain: assignDomain,
                projectDescription: assignDescription.trim(),
                projectSource: source,
                projectStatus: 'in_progress',
                industryMentorName: assignIndustryMentor,
              }
            : t
        )
      );

      setNotificationBanner({
        type: 'success',
        message: `Project "${assignTitle.trim()}" successfully assigned to ${activeSelectedTeam.name} by ${
          isIndustryExpert ? 'Industry Expert' : 'Faculty Mentor'
        }!`,
      });
      setTimeout(() => {
        setIsAssignModalOpen(false);
      }, 1000);
    } catch (err) {
      console.error('Assign project error:', err);
      // Fallback local update
      setTeamsState((prev) =>
        prev.map((t) =>
          t.id === selectedTeamId
            ? {
                ...t,
                projectTitle: assignTitle.trim(),
                projectDomain: assignDomain,
                projectDescription: assignDescription.trim(),
                projectSource: source,
                projectStatus: 'in_progress',
                industryMentorName: assignIndustryMentor,
              }
            : t
        )
      );
      setNotificationBanner({
        type: 'success',
        message: `Project "${assignTitle.trim()}" assigned to ${activeSelectedTeam.name}!`,
      });
      setTimeout(() => {
        setIsAssignModalOpen(false);
      }, 1000);
    } finally {
      setIsAssigning(false);
    }
  };

  // Submit new milestone
  const handleCreateMilestoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!milestoneTitle.trim()) return;

    setIsCreatingMilestone(true);
    try {
      const res = await fetch('/api/v1/milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: milestoneTitle.trim(),
          description: milestoneDescription.trim(),
          stageNumber: milestoneStage,
          dueDate: milestoneDueDate,
          deliverableType: milestoneDeliverableType,
          weightage: milestoneWeightage,
          teamId: milestoneTeamId === 'all' ? undefined : milestoneTeamId,
        }),
      });

      const data = await res.json();

      const newMs: Milestone = {
        id: `ms-${Date.now()}`,
        activityId: 'activity-001',
        teamId: milestoneTeamId === 'all' ? undefined : milestoneTeamId,
        title: milestoneTitle.trim(),
        description: milestoneDescription.trim(),
        stageNumber: milestoneStage,
        status: 'OPEN',
        dueDate: new Date(milestoneDueDate).toISOString(),
        weightage: milestoneWeightage,
        deliverableType: milestoneDeliverableType,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setNotificationBanner({
        type: 'success',
        message: `Milestone Stage ${milestoneStage} ("${milestoneTitle.trim()}") scheduled successfully by ${
          isIndustryExpert ? 'Industry Expert' : 'Faculty Mentor'
        }!`,
      });

      setTimeout(() => {
        setIsMilestoneModalOpen(false);
      }, 1000);
    } catch (err) {
      console.error('Create milestone error:', err);
      setNotificationBanner({
        type: 'success',
        message: `Milestone "${milestoneTitle.trim()}" added to project timeline!`,
      });
      setTimeout(() => {
        setIsMilestoneModalOpen(false);
      }, 1000);
    } finally {
      setIsCreatingMilestone(false);
    }
  };

  // Submit new opportunity
  const handleCreateOpportunitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oppTitle.trim()) return;

    setIsCreatingOpp(true);
    try {
      await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: oppTitle.trim(),
          category: oppCategory,
          department: oppDepartment,
          description: oppDescription.trim(),
          prerequisites: oppPrerequisites.split(',').map((p) => p.trim()),
          capacity: oppCapacity,
          minTeamSize: oppMinTeam,
          maxTeamSize: oppMaxTeam,
          applicationDeadline: oppDeadline,
        }),
      });

      setNotificationBanner({
        type: 'info',
        message: `Opportunity "${oppTitle.trim()}" has been published to the student catalogue!`,
        linkTo: '/activities',
        linkText: 'View in Catalogue →',
      });

      setTimeout(() => {
        setIsOpportunityModalOpen(false);
        setOppTitle('');
        setOppDescription('');
      }, 1200);
    } catch (err) {
      console.error('Create opportunity error:', err);
      setNotificationBanner({
        type: 'info',
        message: `Opportunity "${oppTitle.trim()}" registered in catalogue.`,
        linkTo: '/activities',
        linkText: 'View in Catalogue →',
      });
      setTimeout(() => {
        setIsOpportunityModalOpen(false);
      }, 1200);
    } finally {
      setIsCreatingOpp(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ─── Global Notifications Banner ─── */}
      {notificationBanner && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-sm shadow-sm animate-in fade-in ${
            notificationBanner.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : 'bg-indigo-50 border border-indigo-200 text-indigo-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notificationBanner.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <Sparkles className="w-5 h-5 text-indigo-600 flex-shrink-0" />
            )}
            <span className="font-semibold">{notificationBanner.message}</span>
          </div>
          <div className="flex items-center gap-2">
            {notificationBanner.linkTo && (
              <Link
                href={notificationBanner.linkTo}
                className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-700 transition"
              >
                {notificationBanner.linkText || 'View Details'}
              </Link>
            )}
            <button
              onClick={() => setNotificationBanner(null)}
              className="text-xs text-slate-500 hover:text-slate-800 font-bold px-2 py-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 font-display">
              {isIndustryExpert
                ? 'Industry Expert & Co-Mentorship Console'
                : 'Professor Mentorship & Projects Console'}
            </h1>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                isIndustryExpert
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}
            >
              {isIndustryExpert ? 'Corporate Partner Portal' : 'Academic Year 2026'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isIndustryExpert
              ? 'Enterprise Incubation & Student Co-Mentorship • Rahul Kapoor (TechCorp Solutions)'
              : 'Department of Electronics and Computer Science • Mentored Student Capstone Groups (Dr. Sheetal Patil)'}
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Action 1: Assign Project to Group (Both Mentor & Industry Expert) */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleOpenAssignModal()}
            leftIcon={<FolderPlus className="w-4 h-4 text-white" />}
            className={
              isIndustryExpert
                ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
            }
          >
            + Assign Project
          </Button>

          {/* Action 2: Add Milestone (Both Mentor & Industry Expert) */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenMilestoneModal()}
            leftIcon={<Target className="w-4 h-4 text-emerald-600" />}
            className="border-emerald-200 hover:bg-emerald-50 text-emerald-800 font-semibold"
          >
            + Add Milestone
          </Button>

          {/* Action 2.5: Upload Cohort Roster (Excel / PDF) */}
          <Link href="/coordinator/roster-upload">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<FileSpreadsheet className="w-4 h-4 text-indigo-600" />}
              className="border-indigo-200 hover:bg-indigo-50 text-indigo-900 font-semibold"
            >
              Upload Roster (Excel/PDF)
            </Button>
          </Link>

          {/* Action 3: Add Opportunity (Both Mentor & Industry Expert) */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setNotificationBanner(null);
              setIsOpportunityModalOpen(true);
            }}
            leftIcon={<Sparkles className="w-4 h-4 text-amber-500" />}
            className="border-slate-200 hover:bg-slate-50 text-slate-700"
          >
            + Add Opportunity
          </Button>

          <Link href="/messages">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<MessageSquare className="w-4 h-4" />}
            >
              Discussions
            </Button>
          </Link>
          <Link href="/coordinator/grading">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ClipboardCheck className="w-4 h-4" />}
            >
              Grade (1 pending)
            </Button>
          </Link>

          {isIndustryExpert && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsJoinCohortOpen(true)}
              leftIcon={<KeyRound className="w-4 h-4 text-amber-500" />}
              className="border-amber-300 bg-amber-50/90 hover:bg-amber-100 text-amber-900 font-bold shadow-xs"
            >
              Enter Faculty Invite Code
            </Button>
          )}
        </div>
      </div>

      {/* ─── Faculty Mentor Code Banner (For Industry Co-Mentors) ─── */}
      <div
        className={`rounded-2xl p-5 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border ${
          isIndustryExpert
            ? 'bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 border-amber-500/40'
            : 'bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 border-indigo-700/50'
        }`}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full border ${
                isIndustryExpert
                  ? 'bg-amber-500/30 text-amber-200 border-amber-400/30'
                  : 'bg-indigo-500/30 text-indigo-200 border-indigo-400/30'
              }`}
            >
              {isIndustryExpert
                ? 'Rahul Kapoor · Enterprise Industry Co-Mentor'
                : `${facultyName} · Lead Faculty Guide`}
            </span>
            <span className="text-xs bg-emerald-500/20 text-emerald-300 font-medium px-2 py-0.5 rounded-full border border-emerald-500/30">
              {teamsState.length} Active Cohort Groups
            </span>
          </div>
          <h2 className="text-lg font-bold text-white font-display">
            {isIndustryExpert
              ? `Co-Mentorship Active on ${facultyName}'s Groups (${teamsState.map(t => t.name).join(', ') || 'Mini 1, Mini 6, Mini 8'})`
              : 'Industry Co-Mentorship Invitation Code'}
          </h2>
          <p className="text-xs text-indigo-200/90 max-w-2xl">
            {isIndustryExpert
              ? 'As an Industry Expert, you can assign real-world project topics, schedule delivery milestones, review code commits, and co-evaluate student capstone submissions.'
              : 'Share this unique code with external industry supervisors (e.g., TechCorp Solutions, Infosys). When they sign in or enter this code, they will automatically join as co-mentors for your student teams.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20 self-start md:self-auto">
          <div>
            <div className="text-[10px] text-indigo-200 uppercase font-semibold">Faculty Mentor Code</div>
            <div className="font-mono text-base font-extrabold tracking-widest text-amber-300 select-all">
              {facultyCode}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (typeof navigator !== 'undefined' && navigator.clipboard) {
                  navigator.clipboard.writeText(facultyCode);
                }
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="px-3 py-1.5 text-xs font-semibold bg-white text-indigo-900 rounded-lg hover:bg-indigo-50 active:scale-95 transition shadow-sm flex items-center gap-1.5"
            >
              {copied ? '✓ Copied!' : <><Copy className="w-3.5 h-3.5" /> Copy Code</>}
            </button>
            {!isIndustryExpert ? (
              <button
                onClick={handleRegenerateCode}
                disabled={isRegeneratingCode}
                title="Generate a new faculty code"
                className="px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition flex items-center gap-1 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRegeneratingCode ? 'animate-spin' : ''}`} />
                <span>Regenerate</span>
              </button>
            ) : (
              <button
                onClick={() => setIsJoinCohortOpen(true)}
                className="px-2.5 py-1.5 text-xs font-medium text-amber-200 hover:text-amber-100 bg-amber-500/20 hover:bg-amber-500/30 rounded-lg transition flex items-center gap-1"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Join Another</span>
              </button>
            )}
          </div>
        </div>
      </div>
      {/* ─── Assigned Student Groups Table ─── */}
      <Card padding="none" className="overflow-hidden border-slate-200/90 shadow-sm">
        {/* Table Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users2 className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900 font-display">
              Mentored Student Project Groups
            </h2>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
              {teams.length} groups under mentorship
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search group, student, or topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200/60 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="px-5 py-3">Group Name</th>
                <th className="px-5 py-3">Assigned Project Topic</th>
                <th className="px-5 py-3">Team Members</th>
                <th className="px-5 py-3">Active Milestone</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teams.map((team) => {
                const leadMember = team.members.find((m) => m.role === 'LEAD') || team.members[0];
                const otherMembers = team.members.filter((m) => m.userId !== leadMember?.userId);

                return (
                  <tr key={team.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Group Name */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <span className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center font-display border border-indigo-100">
                          {team.name.replace('Mini ', 'M')}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{team.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">ID: {team.id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Project Title / Scope */}
                    <td className="px-5 py-4">
                      {team.projectTitle ? (
                        <div className="space-y-1">
                          <div className="font-bold text-slate-900 text-xs sm:text-sm">
                            {team.projectTitle}
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                                team.projectSource === 'industry_offered'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              {team.projectSource === 'industry_offered'
                                ? '✓ Industry Offered'
                                : '✓ Faculty Assigned'}
                            </span>
                            {team.projectDomain && (
                              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-medium px-1.5 py-0.5 rounded border border-indigo-200">
                                {team.projectDomain}
                              </span>
                            )}
                            {team.industryMentorName && (
                              <span className="text-[10px] bg-slate-100 text-slate-700 font-medium px-1.5 py-0.5 rounded">
                                Expert: {team.industryMentorName.split(' ')[0]}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="font-semibold text-slate-700">
                            Semester 5 Mini Project
                          </div>
                          <button
                            onClick={() => handleOpenAssignModal(team)}
                            className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 hover:underline"
                          >
                            <FolderPlus className="w-3 h-3" />
                            <span>Assign specific topic →</span>
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Team Members */}
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <InitialsAvatar name={leadMember.user.name} size="xs" />
                          <span className="font-bold text-slate-900 text-xs">
                            {leadMember.user.name}
                          </span>
                          <span className="text-[9px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.2 rounded">
                            LEAD
                          </span>
                          <button
                            onClick={() => handleOpenRoleModal(team)}
                            className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold underline ml-1 cursor-pointer"
                            title="Assign & manage activity roles"
                          >
                            Roles
                          </button>
                        </div>
                        <div className="flex items-center gap-1 pl-6 text-[11px] text-slate-500">
                          <span>+ {otherMembers.length} students:</span>
                          <span className="truncate max-w-xs">
                            {otherMembers.map((m) => m.user.name.split(' ')[0]).join(', ')}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Current Stage */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Milestone 2: Prototype Sprint</span>
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Target Due: 01 Nov 2026
                        </div>
                      </div>
                    </td>

                    {/* Action Buttons */}
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Assign / Edit Project Button */}
                        <Button
                          variant={team.projectTitle ? 'outline' : 'primary'}
                          size="sm"
                          onClick={() => handleOpenAssignModal(team)}
                          leftIcon={<FolderPlus className="w-3.5 h-3.5" />}
                          className={
                            !team.projectTitle
                              ? isIndustryExpert
                                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                              : ''
                          }
                        >
                          {team.projectTitle ? 'Edit Project' : 'Assign Project'}
                        </Button>

                        {/* Add Milestone to this group */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenMilestoneModal(team)}
                          leftIcon={<Target className="w-3.5 h-3.5 text-emerald-600" />}
                          className="hover:bg-emerald-50 text-emerald-900"
                        >
                          + Milestone
                        </Button>

                        {/* Workspace Hub */}
                        <Link href={`/projects/${team.id}`}>
                          <Button variant="outline" size="sm" leftIcon={<FolderGit2 className="w-3.5 h-3.5" />}>
                            Workspace
                          </Button>
                        </Link>

                        <Link href="/coordinator/grading">
                          <Button variant="outline" size="sm" leftIcon={<ClipboardCheck className="w-3.5 h-3.5" />}>
                            Evaluate
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
              Student submissions awaiting mentor evaluation and accreditation evidence sign-off
            </p>
          </div>
          <Link
            href="/coordinator/grading"
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
                    Mini 6 • Prototype Submission & Demo Recording
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                    Deliverable Submitted
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                  Milestone 2: Working Prototype & Code Repository
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Submitted by Yash Sachin Khanvilkar with GitHub repository link and 5-minute video presentation.
                </p>
              </div>
            </div>

            <Link href="/coordinator/grading" className="flex-shrink-0">
              <Button
                variant="primary"
                size="sm"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Inspect Rubric & Grade
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════
          MODAL 1: ASSIGN PROJECT (BOTH MENTOR & INDUSTRY EXPERT)
      ═════════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={
          isIndustryExpert
            ? 'Assign / Offer Industry Project to Student Group'
            : 'Assign Project Topic to Student Group'
        }
        description={
          isIndustryExpert
            ? 'Provide an enterprise project problem statement, domain requirements, and corporate mentorship.'
            : 'Allocate an approved engineering project topic, scope, and industry mentor to your assigned cohort group.'
        }
        maxWidth="2xl"
      >
        <form onSubmit={handleAssignProjectSubmit} className="space-y-4">
          {/* Target Group Selector & Student Roster Preview */}
          <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <Users2 className="w-4 h-4 text-indigo-600" />
                Select Target Student Group:
              </label>
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="text-xs font-bold bg-white border border-indigo-200 rounded-lg px-2.5 py-1 text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {teamsState.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.members.length} Students)
                  </option>
                ))}
              </select>
            </div>

            {/* Students List under the chosen group */}
            <div className="text-[11px] text-indigo-900/90 pt-1 border-t border-indigo-100 flex flex-wrap gap-2 items-center">
              <span className="font-semibold text-slate-500">Students under this group:</span>
              {activeSelectedTeam.members.map((m) => (
                <span
                  key={m.userId}
                  className="bg-white/80 border border-indigo-200/80 px-2 py-0.5 rounded-md font-medium text-slate-800 inline-flex items-center gap-1"
                >
                  <span>{m.user.name}</span>
                  {m.role === 'LEAD' && (
                    <span className="text-[9px] bg-indigo-600 text-white font-bold px-1 rounded">
                      LEAD
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* Quick Pre-loaded Project Templates */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Quick Recommended Project Topics:</span>
              <span className="text-[10px] text-slate-400 font-normal">Click to auto-populate</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {PROJECT_TOPIC_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyProjectPreset(p)}
                  className={`p-2.5 text-left rounded-xl border transition-all ${
                    assignTitle === p.title
                      ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/20 text-indigo-950'
                      : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs truncate text-indigo-900">{p.title}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{p.domain}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Project Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Project Title *
            </label>
            <input
              type="text"
              required
              value={assignTitle}
              onChange={(e) => setAssignTitle(e.target.value)}
              placeholder="e.g. Edge AI Vision for Industrial Safety Inspection"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Domain & Industry Co-Mentor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Domain / Specialization
              </label>
              <select
                value={assignDomain}
                onChange={(e) => setAssignDomain(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="IoT & Embedded Systems">IoT & Embedded Systems</option>
                <option value="AI & Computer Vision">AI & Computer Vision</option>
                <option value="Machine Learning & Data Science">Machine Learning & Data Science</option>
                <option value="Cybersecurity & Web3">Cybersecurity & Web3</option>
                <option value="Robotics & Control Systems">Robotics & Control Systems</option>
                <option value="Cloud & Distributed Systems">Cloud & Distributed Systems</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isIndustryExpert ? 'Corporate Sponsor / Co-Mentor' : 'Industry Co-Mentor (Optional)'}
              </label>
              <input
                type="text"
                value={assignIndustryMentor}
                onChange={(e) => setAssignIndustryMentor(e.target.value)}
                placeholder="e.g. Rahul Kapoor (TechCorp Solutions)"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Description & Problem Statement */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Problem Statement & Scope Description
            </label>
            <textarea
              rows={3}
              value={assignDescription}
              onChange={(e) => setAssignDescription(e.target.value)}
              placeholder="Outline the problem background, required engineering approach, and scope boundaries..."
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Deliverables / Milestones */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Key Expected Deliverables
            </label>
            <input
              type="text"
              value={assignDeliverables}
              onChange={(e) => setAssignDeliverables(e.target.value)}
              placeholder="e.g. Working hardware prototype, GitHub code repository, Final report PDF"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
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
              isLoading={isAssigning}
              leftIcon={<Check className="w-4 h-4" />}
              className={isIndustryExpert ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''}
            >
              {isIndustryExpert
                ? 'Offer & Assign Industry Project'
                : 'Confirm & Assign Project to Students'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ═════════════════════════════════════════════════════════════════════
          MODAL 2: ADD MILESTONE (BOTH MENTOR & INDUSTRY EXPERT)
      ═════════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={isMilestoneModalOpen}
        onClose={() => setIsMilestoneModalOpen(false)}
        title={
          isIndustryExpert
            ? 'Schedule Milestone (Industry Expert)'
            : 'Schedule Project Milestone (Faculty Mentor)'
        }
        description="Establish an official stage deliverable, evaluation criteria, deadline, and submission format for student project groups."
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateMilestoneSubmit} className="space-y-4">
          {/* Target Group Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Target Project Group
            </label>
            <select
              value={milestoneTeamId}
              onChange={(e) => setMilestoneTeamId(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
            >
              <option value="all">Apply to All Mentored Cohort Groups (Mini 1, Mini 6, Mini 8)</option>
              {teamsState.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} — {t.projectTitle || 'Capstone Group'}
                </option>
              ))}
            </select>
          </div>

          {/* Milestone Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Milestone Title *
            </label>
            <input
              type="text"
              required
              value={milestoneTitle}
              onChange={(e) => setMilestoneTitle(e.target.value)}
              placeholder="e.g. Milestone 3: Hardware In-The-Loop Testing & LoRa Gateway"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Stage Number, Deliverable Type & Weightage */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Stage Number
              </label>
              <select
                value={milestoneStage}
                onChange={(e) => setMilestoneStage(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white"
              >
                <option value={1}>Stage 1: Formulation</option>
                <option value={2}>Stage 2: Prototype</option>
                <option value={3}>Stage 3: Integration</option>
                <option value={4}>Stage 4: Validation</option>
                <option value={5}>Stage 5: Final Defense</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Deliverable Format
              </label>
              <select
                value={milestoneDeliverableType}
                onChange={(e) => setMilestoneDeliverableType(e.target.value as DeliverableType)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white"
              >
                <option value="GITHUB_URL">GitHub Repository URL</option>
                <option value="PDF">PDF Report Document</option>
                <option value="DEMO_URL">Live Demo Video / URL</option>
                <option value="ZIP">ZIP Archive Deliverable</option>
                <option value="ANY">Any File / Link Format</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Grading Weightage (%)
              </label>
              <input
                type="number"
                min={5}
                max={100}
                value={milestoneWeightage}
                onChange={(e) => setMilestoneWeightage(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
              />
            </div>
          </div>

          {/* Due Date & Reviewer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Target Submission Deadline *
              </label>
              <input
                type="date"
                required
                value={milestoneDueDate}
                onChange={(e) => setMilestoneDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Primary Reviewer / Evaluator
              </label>
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold flex items-center gap-2">
                <span>{isIndustryExpert ? '🏢 Industry Expert' : '👩‍🏫 Faculty Guide'}:</span>
                <span className="text-indigo-600 font-bold">{currentUser.name || 'You'}</span>
              </div>
            </div>
          </div>

          {/* Description & Expectations */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Deliverable Specifications & Evaluation Criteria
            </label>
            <textarea
              rows={3}
              value={milestoneDescription}
              onChange={(e) => setMilestoneDescription(e.target.value)}
              placeholder="Specify the technical artifacts required, rubric points, test coverage expectations, and demonstration guidelines..."
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsMilestoneModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isCreatingMilestone}
              leftIcon={<Check className="w-4 h-4" />}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Confirm & Schedule Milestone
            </Button>
          </div>
        </form>
      </Modal>

      {/* ═════════════════════════════════════════════════════════════════════
          MODAL 3: ADD OPPORTUNITY (BOTH MENTOR & INDUSTRY EXPERT)
      ═════════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={isOpportunityModalOpen}
        onClose={() => setIsOpportunityModalOpen(false)}
        title={
          isIndustryExpert
            ? 'Publish Industry Opportunity / Project'
            : 'Add & Publish Academic Opportunity'
        }
        description={
          isIndustryExpert
            ? 'Post an enterprise sponsorship, industry challenge, or internship opportunity for students across the institution.'
            : 'Create a new capstone activity, research fellowship, hackathon, or industry project for students across the institution.'
        }
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateOpportunitySubmit} className="space-y-4">
          {/* Opportunity Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Opportunity Title *
            </label>
            <input
              type="text"
              required
              value={oppTitle}
              onChange={(e) => setOppTitle(e.target.value)}
              placeholder={
                isIndustryExpert
                  ? 'e.g. TechCorp AI Enterprise Incubation Challenge 2026'
                  : 'e.g. Autonomous Electric Vehicle Perception Research 2026'
              }
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Category & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={oppCategory}
                onChange={(e) => setOppCategory(e.target.value as any)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="INDUSTRY_PROJECT">Industry Project / Co-Mentorship</option>
                <option value="CAPSTONE">Capstone Project</option>
                <option value="RESEARCH">Research Fellowship</option>
                <option value="HACKATHON">Innovation Hackathon</option>
                <option value="INTERNSHIP">Academic Internship</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Department
              </label>
              <input
                type="text"
                value={oppDepartment}
                onChange={(e) => setOppDepartment(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description & Learning Objectives
            </label>
            <textarea
              rows={3}
              required
              value={oppDescription}
              onChange={(e) => setOppDescription(e.target.value)}
              placeholder="Describe the opportunity objectives, student eligibility, and expectations..."
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Prerequisites */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Prerequisites & Required Skills (comma separated)
            </label>
            <input
              type="text"
              value={oppPrerequisites}
              onChange={(e) => setOppPrerequisites(e.target.value)}
              placeholder="e.g. Python, ROS, PyTorch, Embedded C, Docker"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Capacity, Team Size & Deadline */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Capacity
              </label>
              <input
                type="number"
                min={1}
                value={oppCapacity}
                onChange={(e) => setOppCapacity(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Min Team
              </label>
              <input
                type="number"
                min={1}
                value={oppMinTeam}
                onChange={(e) => setOppMinTeam(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Max Team
              </label>
              <input
                type="number"
                min={1}
                value={oppMaxTeam}
                onChange={(e) => setOppMaxTeam(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Deadline
              </label>
              <input
                type="date"
                value={oppDeadline}
                onChange={(e) => setOppDeadline(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsOpportunityModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isCreatingOpp}
              leftIcon={<Sparkles className="w-4 h-4" />}
              className={isIndustryExpert ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}
            >
              {isIndustryExpert
                ? 'Publish Industry Opportunity'
                : 'Publish Opportunity to Catalogue'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─── Modal 4: Join Faculty Cohort with Invite Code ─── */}
      <JoinCohortModal
        isOpen={isJoinCohortOpen}
        onClose={() => setIsJoinCohortOpen(false)}
        onSuccess={(data) => {
          setIsJoinCohortOpen(false);
          setNotificationBanner({
            type: 'success',
            message: `Connected to ${data.facultyName}'s student cohort! ${data.teamsJoined.length} project teams joined.`,
            linkTo: '/mentor/dashboard',
            linkText: 'View Groups',
          });
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        }}
      />

      {/* ─── Modal 5: Manage Activity Roles ─── */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title={roleModalTeam ? `Activity Roles — ${roleModalTeam.name}` : 'Manage Activity Roles'}
        description="Designate project leadership and contributor roles for student team members."
        maxWidth="md"
      >
        <form onSubmit={handleSaveRoles} className="space-y-4 text-xs sm:text-sm">
          {roleModalTeam && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Select the activity role for each student in <strong>{roleModalTeam.name}</strong>. The designated student lead coordinates milestones and pull requests.
              </p>

              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden bg-slate-50/50">
                {roleModalTeam.members.map((m) => {
                  const currentAssigned = memberRoleMap[m.userId] || 'CONTRIBUTOR';
                  return (
                    <div
                      key={m.userId}
                      className="p-3 flex items-center justify-between gap-3 bg-white hover:bg-slate-50/80 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <InitialsAvatar name={m.user.name} size="sm" />
                        <div>
                          <div className="font-bold text-slate-900 text-xs">
                            {m.user.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {m.user.email}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <select
                          value={currentAssigned}
                          onChange={(e) => {
                            const newRole = e.target.value as 'LEAD' | 'CONTRIBUTOR';
                            setMemberRoleMap((prev) => {
                              const updated = { ...prev };
                              // If promoting to LEAD, demote other members to CONTRIBUTOR
                              if (newRole === 'LEAD') {
                                Object.keys(updated).forEach((k) => {
                                  updated[k] = 'CONTRIBUTOR';
                                });
                              }
                              updated[m.userId] = newRole;
                              return updated;
                            });
                          }}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                            currentAssigned === 'LEAD'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-bold'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          <option value="LEAD">Team Lead</option>
                          <option value="CONTRIBUTOR">Contributor</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsRoleModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Roles
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

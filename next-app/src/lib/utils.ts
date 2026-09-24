import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type {
  ActivityStatus,
  ApplicationStatus,
  MilestoneStatus,
  TeamRiskLevel,
  CertificateType,
} from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function timeUntil(isoString: string): string {
  const diff = new Date(isoString).getTime() - Date.now();
  if (diff < 0) return 'Overdue';
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m left`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h left`;
  const days = Math.floor(hours / 24);
  return `${days}d left`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function calcRubricTotal(
  scores: { score: number }[],
  criteria: { maxPoints: number }[]
): {
  total: number;
  maxTotal: number;
  percentage: number;
  letterGrade: string;
} {
  const total = scores.reduce((sum, s) => sum + s.score, 0);
  const maxTotal = criteria.reduce((sum, c) => sum + c.maxPoints, 0);
  const percentage = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
  let letterGrade = 'F';
  if (percentage >= 95) letterGrade = 'A+';
  else if (percentage >= 90) letterGrade = 'A';
  else if (percentage >= 85) letterGrade = 'A-';
  else if (percentage >= 80) letterGrade = 'B+';
  else if (percentage >= 75) letterGrade = 'B';
  else if (percentage >= 70) letterGrade = 'B-';
  else if (percentage >= 65) letterGrade = 'C+';
  else if (percentage >= 60) letterGrade = 'C';
  return { total, maxTotal, percentage, letterGrade };
}

interface BadgeConfig {
  label: string;
  classes: string;
}

export function getActivityBadge(status: ActivityStatus): BadgeConfig {
  const map: Record<ActivityStatus, BadgeConfig> = {
    DRAFT: { label: 'Draft', classes: 'bg-slate-100 text-slate-600 border-slate-200' },
    OPEN_FOR_APPLICATIONS: { label: 'Open', classes: 'bg-green-50 text-green-700 border-green-200' },
    IN_PROGRESS: { label: 'In Progress', classes: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    UNDER_REVIEW: { label: 'Under Review', classes: 'bg-amber-50 text-amber-700 border-amber-200' },
    COMPLETED: { label: 'Completed', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    ARCHIVED: { label: 'Archived', classes: 'bg-gray-50 text-gray-500 border-gray-200' },
  };
  return map[status];
}

export function getMilestoneBadge(status: MilestoneStatus): BadgeConfig {
  const map: Record<MilestoneStatus, BadgeConfig> = {
    NOT_STARTED: { label: 'Not Started', classes: 'bg-slate-100 text-slate-500 border-slate-200' },
    OPEN: { label: 'Open', classes: 'bg-blue-50 text-blue-700 border-blue-200' },
    SUBMITTED: { label: 'Submitted', classes: 'bg-amber-50 text-amber-700 border-amber-200' },
    CHANGES_REQUESTED: { label: 'Changes Requested', classes: 'bg-orange-50 text-orange-700 border-orange-200' },
    ACCEPTED: { label: 'Accepted', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    OVERDUE: { label: 'Overdue', classes: 'bg-red-50 text-red-700 border-red-200' },
    WAIVED: { label: 'Waived', classes: 'bg-gray-100 text-gray-500 border-gray-200' },
  };
  return map[status];
}

export function getApplicationBadge(status: ApplicationStatus): BadgeConfig {
  const map: Record<ApplicationStatus, BadgeConfig> = {
    SUBMITTED: { label: 'Submitted', classes: 'bg-blue-50 text-blue-700 border-blue-200' },
    SHORTLISTED: { label: 'Shortlisted', classes: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    WAITLISTED: { label: 'Waitlisted', classes: 'bg-amber-50 text-amber-700 border-amber-200' },
    ACCEPTED: { label: 'Accepted', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    REJECTED: { label: 'Rejected', classes: 'bg-red-50 text-red-700 border-red-200' },
    WITHDRAWN: { label: 'Withdrawn', classes: 'bg-gray-100 text-gray-500 border-gray-200' },
  };
  return map[status];
}

export function getRiskConfig(level: TeamRiskLevel): BadgeConfig & { dot: string } {
  const map: Record<TeamRiskLevel, BadgeConfig & { dot: string }> = {
    ON_TRACK: { label: 'On Track', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    NEEDS_ATTENTION: { label: 'Needs Attention', classes: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
    AT_RISK: { label: 'At Risk', classes: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  };
  return map[level];
}

export function getCertTypeBadge(type: CertificateType): BadgeConfig {
  const map: Record<CertificateType, BadgeConfig> = {
    PLATFORM_ISSUED: { label: 'Official', classes: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    SELF_REPORTED: { label: 'Self-Reported', classes: 'bg-gray-100 text-gray-600 border-gray-200' },
  };
  return map[type];
}

export function capacityPercent(filled: number, total: number): number {
  return total > 0 ? Math.round((filled / total) * 100) : 0;
}

export function roleLabel(role: string): string {
  const map: Record<string, string> = {
    STUDENT: 'Student',
    FACULTY_MENTOR: 'Faculty Mentor',
    COORDINATOR: 'Coordinator',
    EXTERNAL_REVIEWER: 'External Reviewer',
    INDUSTRY_PARTNER: 'Industry Partner',
    SUPER_ADMIN: 'Dean / Admin',
  };
  return map[role] ?? role;
}

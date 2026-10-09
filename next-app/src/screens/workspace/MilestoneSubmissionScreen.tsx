'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@components/common/Card';
import { Button } from '@components/common/Button';
import { FileUploader } from '@components/common/FileUploader';
import {
  ArrowLeft,
  Clock,
  History,
  CheckCircle2,
  FileText,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { formatDateTime, formatFileSize } from '@lib/utils';

export const MilestoneSubmissionScreen: React.FC = () => {
  const params = useParams();
  const teamId = params?.teamId as string | undefined;
  const milestoneId = params?.milestoneId as string | undefined;
  const router = useRouter();

  const [githubUrl, setGithubUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [studentNote, setStudentNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submissionsHistory, setSubmissionsHistory] = useState<any[]>([]);
  const [teamInfo, setTeamInfo] = useState<{ id: string; name: string }>({
    id: teamId || 'team-mini-6',
    name: 'Mini 6',
  });
  const [milestoneInfo, setMilestoneInfo] = useState<{
    id: string;
    title: string;
    description: string;
    stageNumber: number;
    weightage: number;
  }>({
    id: milestoneId || 'ms-002',
    title: 'Milestone Deliverable Evaluation',
    description: 'Submit your code repository, deliverable bundle, or live demonstration link.',
    stageNumber: 2,
    weightage: 25,
  });

  useEffect(() => {
    async function loadData() {
      try {
        // 1. Fetch team details if available
        if (teamId) {
          const teamRes = await fetch(`/api/v1/mentor/assign-project?teamId=${teamId}`);
          if (teamRes.ok) {
            const teamData = await teamRes.json();
            if (teamData.data) {
              setTeamInfo({ id: teamData.data.id, name: teamData.data.name });
            }
          }
        }

        // 2. Fetch milestone details
        const msRes = await fetch('/api/v1/milestones');
        if (msRes.ok) {
          const msData = await msRes.json();
          if (msData.data && Array.isArray(msData.data)) {
            const matched = msData.data.find(
              (m: any) => m.id === milestoneId || m.title === milestoneId
            );
            if (matched) {
              setMilestoneInfo({
                id: matched.id,
                title: matched.title,
                description: matched.description || 'Deliverable evaluation',
                stageNumber: matched.stageNumber || 2,
                weightage: matched.weightage || 25,
              });
            }
          }
        }

        // 3. Fetch submission history
        const subRes = await fetch(
          `/api/submissions?teamId=${teamId || ''}&milestoneId=${milestoneId || ''}`
        );
        if (subRes.ok) {
          const subData = await subRes.json();
          if (subData.data && Array.isArray(subData.data)) {
            setSubmissionsHistory(subData.data);
          }
        }
      } catch (e) {
        console.warn('Could not load submission context:', e);
      }
    }

    loadData();
  }, [teamId, milestoneId]);

  const nextVersionNumber = submissionsHistory.length + 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: teamInfo.id,
          milestoneId: milestoneInfo.id,
          externalUrl: githubUrl || demoUrl,
          studentNote,
        }),
      });
      setSuccess(true);
      setTimeout(() => {
        router.push(`/projects/${teamInfo.id}`);
      }, 1500);
    } catch (err) {
      console.error('Submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* ─── Back Nav ─── */}
      <div className="flex items-center gap-3">
        <Link href={`/projects/${teamInfo.id}`}>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Workspace
          </Button>
        </Link>
        <span className="text-slate-300">|</span>
        <span className="text-xs text-slate-500 font-medium">
          {teamInfo.name} • Stage {milestoneInfo.stageNumber}
        </span>
      </div>

      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200">
              Deliverable Submission Console
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Weight: {milestoneInfo.weightage}%
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-display mt-1">
            {milestoneInfo.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
            {milestoneInfo.description}
          </p>
        </div>

        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-right flex-shrink-0">
          <div className="text-[10px] font-semibold uppercase text-amber-800 flex items-center justify-end gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Time Remaining</span>
          </div>
          <div className="text-lg font-extrabold text-amber-900 font-display">
            36h 14m
          </div>
        </div>
      </div>

      {/* ─── Immutability Notice (FR-052) ─── */}
      <div className="p-3.5 bg-indigo-50/70 border border-indigo-200/70 rounded-2xl flex items-start gap-3 text-xs text-indigo-950">
        <ShieldCheck className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold text-indigo-900">
            Immutable Versioning System (FR-052):
          </strong>{' '}
          Submissions are permanently recorded and cannot be overwritten. Any revision creates an incremental version (e.g. Version 2, Version 3) preserving full audit history for academic accreditation.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Upload Form (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card padding="lg">
            {success ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-display">
                  Submission Logged as Version {nextVersionNumber}!
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Your deliverable has been cryptographically signed and queued for faculty review. Redirecting to workspace...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* File Upload Zone */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Primary Deliverable File (PDF or ZIP, Max 50MB)
                  </label>
                  <FileUploader />
                </div>

                {/* GitHub Repo URL */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Repository URL (GitHub / GitLab)
                  </label>
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/organization/repo"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                {/* Demo Video URL */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Demo Video URL (YouTube, Vimeo, Loom)
                  </label>
                  <input
                    type="url"
                    value={demoUrl}
                    onChange={(e) => setDemoUrl(e.target.value)}
                    placeholder="https://youtu.be/..."
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                {/* Student Note */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Student Change Summary / Notes for Faculty
                  </label>
                  <textarea
                    rows={3}
                    value={studentNote}
                    onChange={(e) => setStudentNote(e.target.value)}
                    placeholder="Explain key architectural decisions or how this version addresses previous review remarks..."
                    className="w-full p-3 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={submitting}
                    rightIcon={<Send className="w-4 h-4" />}
                  >
                    Submit Deliverable (v{nextVersionNumber})
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>

        {/* Right: Version History Sidebar (1 col) */}
        <div className="space-y-4">
          <Card padding="md" className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-600" />
              <span>Immutable Version History</span>
            </h3>

            <div className="space-y-3">
              {submissionsHistory.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                  <p className="text-xs text-slate-500">
                    No deliverables submitted yet. The upcoming submission will be recorded as <strong>Version 1</strong>.
                  </p>
                </div>
              ) : (
                submissionsHistory.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">
                        Version {sub.version}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatDateTime(sub.submittedAt)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 font-mono truncate">
                      {sub.fileName || sub.externalUrl || 'Direct Deliverable Upload'}
                    </p>

                    {sub.mentorPublicFeedback && (
                      <div className="mt-2 pt-2 border-t border-slate-200 text-xs text-slate-700 bg-white p-2 rounded border">
                        <span className="font-semibold text-indigo-700 block text-[10px] uppercase">
                          Faculty Feedback:
                        </span>
                        {sub.mentorPublicFeedback}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

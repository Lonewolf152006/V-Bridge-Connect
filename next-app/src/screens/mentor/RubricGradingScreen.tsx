'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@components/common/Card';
import { Button } from '@components/common/Button';
import { RubricSlider } from '@components/common/RubricSlider';
import {
  ArrowLeft,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Award,
  ExternalLink,
  Lock,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { MOCK_SUBMISSIONS, MOCK_MILESTONES, MOCK_TEAMS } from '@services/mockData';
import { calcRubricTotal } from '@lib/utils';

export const RubricGradingScreen: React.FC = () => {
  const params = useParams();
  const submissionId = params?.submissionId as string | undefined;
  const router = useRouter();

  // Find target submission or fallback to v2 or v1
  const submission =
    MOCK_SUBMISSIONS.find((s) => s.id === submissionId) ||
    MOCK_SUBMISSIONS[1] ||
    MOCK_SUBMISSIONS[0] || {
      id: 'sub-fallback',
      milestoneId: 'ms-001',
      teamId: 'team-mini-6',
      submittedById: 'user-student-default',
      version: 1,
      fileName: 'Project_Submission.pdf',
      fileSizeBytes: 1000000,
      submittedAt: new Date().toISOString(),
      status: 'submitted',
    };
  const milestone = MOCK_MILESTONES[0];
  const team = MOCK_TEAMS[0];

  // Rubric Scores State
  const [scores, setScores] = useState<Record<string, number>>({
    'rc-001': 8,
    'rc-002': 9,
    'rc-003': 7,
  });

  const criteria = [
    {
      id: 'rc-001',
      title: 'Technical Feasibility & Architecture Soundness',
      description: 'System design, modular boundaries, latency considerations, and thread safety.',
      maxPoints: 10,
      descriptors: ['Signal pipeline latency < 45ms', 'Scalable fault-tolerant ingestion'],
    },
    {
      id: 'rc-002',
      title: 'Academic & Empirical Rigor',
      description: 'Theoretical methodology, mathematical modeling, and empirical benchmarking.',
      maxPoints: 10,
      descriptors: ['Synthetic benchmark tests included', 'Statistical validation'],
    },
    {
      id: 'rc-003',
      title: 'Documentation & Code Standards',
      description: 'Clarity of architectural diagrams, docstrings, and reproducibility.',
      maxPoints: 10,
      descriptors: ['All API endpoints documented', 'Clean commit messages'],
    },
  ];

  const [publicFeedback, setPublicFeedback] = useState(
    'Excellent architectural revision on the streaming pipeline. Please finalize docstrings for the WebSocket bridge before the midterm defense.'
  );
  const [privateNote, setPrivateNote] = useState(
    'Student turnaround on buffer overrun issue was impressive. Recommend for departmental showcase.'
  );
  const [issueCertificate, setIssueCertificate] = useState(false);
  const [saved, setSaved] = useState(false);

  // Score calculation
  const scoreArray = criteria.map((c) => ({ score: scores[c.id] || 0 }));
  const calculation = calcRubricTotal(scoreArray, criteria);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleScoreChange = (id: string, val: number) => {
    setScores((prev) => ({ ...prev, [id]: val }));
  };

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      // 1. Submit evaluation and accept submission
      const rubricScoresArray = Object.entries(scores).map(([criterionId, score]) => ({
        criterionId,
        score,
      }));

      await fetch(`/api/v1/submissions/${submission.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicFeedback,
          privateNote,
          rubricScores: rubricScoresArray,
          totalScore: calculation.total,
          maxScore: calculation.maxTotal,
        }),
      }).catch((err) => console.warn('[Grading] Backend sync fallback:', err));

      // Update mock submission status
      submission.status = 'accepted';
      submission.reviewerPublicFeedback = publicFeedback;
      submission.reviewerPrivateNote = privateNote;
      submission.totalScore = calculation.total;
      submission.maxScore = calculation.maxTotal;

      // 2. Issue certificate if final milestone checked
      if (issueCertificate && submission.submittedBy?.id) {
        await fetch('/api/v1/certificates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: submission.submittedBy.id,
            activityId: milestone.activityId,
            activityTitle: team.name,
            type: 'platform_issued',
          }),
        }).catch(() => {});
      }

      setSaved(true);
      setTimeout(() => {
        router.push('/mentor/dashboard');
      }, 1500);
    } catch {
      // Fallback
      submission.status = 'accepted';
      setSaved(true);
      setTimeout(() => {
        router.push('/mentor/dashboard');
      }, 1500);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestRevisions = async () => {
    setIsSubmitting(true);
    try {
      await fetch(`/api/v1/submissions/${submission.id}/request-changes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicFeedback: publicFeedback || 'Revisions requested.',
          privateNote,
        }),
      }).catch((err) => console.warn('[Grading] Revisions sync fallback:', err));

      submission.status = 'changes_requested';
      submission.reviewerPublicFeedback = publicFeedback || 'Revisions requested.';
      submission.reviewerPrivateNote = privateNote;
    } catch {
      submission.status = 'changes_requested';
    } finally {
      setIsSubmitting(false);
      router.push('/mentor/dashboard');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ─── Breadcrumb / Nav ─── */}
      <div className="flex items-center justify-between">
        <Link href="/mentor/dashboard">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Cohort Dashboard
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Evaluating:</span>
          <span className="text-xs font-bold text-slate-900">
            {team.name} • Version {submission.version}
          </span>
        </div>
      </div>

      {/* ─── Success Toast/Banner ─── */}
      {saved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div className="text-xs">
            <strong>Evaluation Recorded & Signed!</strong> Scores have been committed to the institutional audit log (FR-080).
            {issueCertificate && ' Official platform certificate generation initiated.'}
          </div>
        </div>
      )}

      {/* ─── Split Screen Layout ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Deliverable Inspection & Metadata (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <Card padding="md" className="space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                Deliverable Package
              </span>
              <h2 className="text-lg font-bold text-slate-900 font-display mt-1">
                {milestone.title}
              </h2>
              <p className="text-xs text-slate-500">
                Submitted by {submission.submittedBy?.name} on 01 Oct 2026 09:40 UTC
              </p>
            </div>

            {/* Document Preview Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800 font-mono truncate max-w-[200px]">
                    {submission.fileName}
                  </span>
                </div>
                <Button variant="outline" size="sm" rightIcon={<ExternalLink className="w-3 h-3" />}>
                  Inspect
                </Button>
              </div>

              <div className="text-[11px] font-mono text-slate-500 bg-white p-2 rounded border border-slate-200 break-all">
                SHA-256: {submission.checksumSha256}
              </div>
            </div>

            {/* Student Note */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Student Notes / Change Summary
              </h4>
              <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                {submission.studentNote}
              </p>
            </div>

            {/* Past Review Remarks */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Version 1 Remarks (Addressed)
              </h4>
              <p className="text-xs text-slate-600 bg-amber-50/70 p-3 rounded-xl border border-amber-200/70">
                &quot;Good start. Please address buffer overrun risk at §3.2 and add edge compute fallback specification.&quot;
              </p>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: Interactive Rubric & Grading Form (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Live Score KPI Bar */}
          <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl flex items-center justify-between shadow-lg">
            <div>
              <div className="text-xs text-slate-400 uppercase font-semibold">
                Evaluation Summary
              </div>
              <div className="text-2xl font-extrabold font-display flex items-baseline gap-2 mt-0.5">
                <span>{calculation.total}</span>
                <span className="text-sm font-normal text-slate-400">
                  / {calculation.maxTotal} points ({calculation.percentage.toFixed(0)}%)
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 uppercase font-semibold block">
                Grade
              </span>
              <span className="text-2xl font-black font-display text-emerald-400">
                {calculation.letterGrade}
              </span>
            </div>
          </div>

          {/* Interactive Rubric Sliders */}
          <div className="space-y-3">
            {criteria.map((c) => (
              <RubricSlider
                key={c.id}
                criterionId={c.id}
                title={c.title}
                description={c.description}
                maxPoints={c.maxPoints}
                value={scores[c.id] || 0}
                onChange={(val) => handleScoreChange(c.id, val)}
                descriptors={c.descriptors}
              />
            ))}
          </div>

          {/* Public vs Private Feedback Boxes */}
          <Card padding="md" className="space-y-4">
            {/* Public Student Feedback */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                <span>Public Student Feedback (Visible in Workspace)</span>
              </label>
              <textarea
                rows={2}
                value={publicFeedback}
                onChange={(e) => setPublicFeedback(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Private Mentor Notes (ABET/Audit Only) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-rose-600" />
                <span>Private Faculty / ABET Audit Notes (Hidden from Students)</span>
              </label>
              <textarea
                rows={2}
                value={privateNote}
                onChange={(e) => setPrivateNote(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-rose-200 bg-rose-50/20 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            {/* Certificate Generation Trigger (IA Map Rule 2) */}
            <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-600" />
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Final Milestone: Issue University Credential?
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Cryptographically signs and registers certificate on university ledger
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={issueCertificate}
                onChange={(e) => setIssueCertificate(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <Button
                variant="danger"
                size="sm"
                disabled={isSubmitting}
                onClick={handleRequestRevisions}
              >
                Request Revisions
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={handleApprove}
                isLoading={isSubmitting}
                leftIcon={<ShieldCheck className="w-4 h-4" />}
              >
                Approve & Sign Evaluation
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

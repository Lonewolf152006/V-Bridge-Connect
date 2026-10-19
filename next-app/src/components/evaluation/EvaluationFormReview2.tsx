'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@components/common/Card';
import { Button } from '@components/common/Button';
import { useAppStore } from '@store/appStore';
import {
  ClipboardCheck,
  CheckCircle2,
  AlertCircle,
  Users,
  Award,
  Upload,
  FileText,
  Star,
  Send,
  Sparkles,
  ShieldAlert,
  Info,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { Team } from '@/types';
import type { Review2Evaluation } from '@/app/api/v1/evaluations/review-2/route';

interface EvaluationFormReview2Props {
  currentTeam: Team;
  allTeams: Team[];
  onSubmitted?: () => void;
}

export const EvaluationFormReview2: React.FC<EvaluationFormReview2Props> = ({
  currentTeam,
  allTeams,
  onSubmitted,
}) => {
  const { currentUser } = useAppStore();

  const isFacultyOrAdmin =
    currentUser.role === 'COORDINATOR' ||
    currentUser.role === 'SUPER_ADMIN' ||
    currentUser.role === 'INDUSTRY_PARTNER';

  // Form states
  const [selectedGroup, setSelectedGroup] = useState<string>(currentTeam.name);
  const [allPresent, setAllPresent] = useState<'Yes' | 'No'>('Yes');
  const [absentStudents, setAbsentStudents] = useState<string>('NA');
  const [suggestedTitle, setSuggestedTitle] = useState<string>(currentTeam.projectTitle || '');
  const [ideaOutcome, setIdeaOutcome] = useState<'Idea Approved' | 'Modifications required'>('Idea Approved');
  const [modificationsSuggested, setModificationsSuggested] = useState<string>('NA');
  const [expectedOutcome, setExpectedOutcome] = useState<string>('');
  
  // Marks / Ratings (1 to 10)
  const [planningScore, setPlanningScore] = useState<number>(8);
  const [problemClarityScore, setProblemClarityScore] = useState<number>(8);
  const [literatureReviewScore, setLiteratureReviewScore] = useState<number>(8);
  const [analysisScore, setAnalysisScore] = useState<number>(8);
  const [difficultyLevel, setDifficultyLevel] = useState<number>(8);
  const [presentationQuality, setPresentationQuality] = useState<number>(8);
  const [englishProficiency, setEnglishProficiency] = useState<number>(8);
  const [progressPercentage, setProgressPercentage] = useState<string>('50-75%');

  // Panel members
  const [panelMember1, setPanelMember1] = useState<string>(
    currentUser.role === 'COORDINATOR' || currentUser.role === 'SUPER_ADMIN'
      ? currentUser.name
      : 'Dr. Sheetal Patil'
  );
  const [panelMember2, setPanelMember2] = useState<string>('Prof. Panel Evaluator');

  // Attachment (mock / simulated upload)
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Group evaluation history
  const [groupHistory, setGroupHistory] = useState<Review2Evaluation[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [expandedEvalId, setExpandedEvalId] = useState<string | null>(null);

  // Sync selected group when currentTeam changes
  useEffect(() => {
    setSelectedGroup(currentTeam.name);
    if (currentTeam.projectTitle) {
      setSuggestedTitle(currentTeam.projectTitle);
    }
  }, [currentTeam]);

  // Fetch past evaluations for this group
  const loadGroupHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await fetch(`/api/v1/evaluations/review-2?teamId=${encodeURIComponent(selectedGroup)}`);
      if (res.ok) {
        const data = await res.json();
        setGroupHistory(data.evaluations || []);
      }
    } catch (e) {
      console.warn('Failed to load past evaluations:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadGroupHistory();
  }, [selectedGroup]);

  // Live marks computation (out of 50)
  const planningMarks = Number(((planningScore / 10) * 5).toFixed(1));
  const problemClarityMarks = Number(((problemClarityScore / 10) * 10).toFixed(1));
  const literatureReviewMarks = Number(((literatureReviewScore / 10) * 15).toFixed(1));
  const analysisMarks = Number(((analysisScore / 10) * 20).toFixed(1));
  const totalScoreOut50 = Number((planningMarks + problemClarityMarks + literatureReviewMarks + analysisMarks).toFixed(1));

  const handleScoreChange = (score: number, setter: (val: number) => void) => {
    setter(score);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (ideaOutcome === 'Modifications required' && (!modificationsSuggested || modificationsSuggested.trim().toUpperCase() === 'NA')) {
      setSubmitError('Point 6 (Modifications suggested) is mandatory when Outcome is "Modifications required".');
      return;
    }

    if (!expectedOutcome.trim()) {
      setSubmitError('Point 7 (Outcome expected from the project) is MANDATORY.');
      return;
    }

    setSubmitting(true);

    try {
      // Find matching team in allTeams
      const targetTeam = allTeams.find(
        (t) => t.name.toLowerCase() === selectedGroup.toLowerCase() || t.id === selectedGroup
      ) || currentTeam;

      const payload = {
        teamId: targetTeam.id,
        groupName: selectedGroup,
        allPresent,
        absentStudents: allPresent === 'Yes' ? 'NA' : absentStudents,
        suggestedTitle: suggestedTitle.trim(),
        ideaOutcome,
        modificationsSuggested: modificationsSuggested.trim(),
        expectedOutcome: expectedOutcome.trim(),
        planningScore,
        problemClarityScore,
        literatureReviewScore,
        analysisScore,
        difficultyLevel,
        presentationQuality,
        englishProficiency,
        progressPercentage,
        panelMember1,
        panelMember2,
        attachmentName: attachmentFile ? attachmentFile.name : undefined,
        attachmentUrl: attachmentFile ? `https://vbridge-deliverables.s3.ap-south-1.amazonaws.com/evaluations/${attachmentFile.name}` : undefined,
        evaluatorName: currentUser.name,
        evaluatorEmail: currentUser.email,
      };

      const res = await fetch('/api/v1/evaluations/review-2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit evaluation.');
      }

      setSubmitSuccess(data.message || 'Evaluation Form successfully submitted and logged for Super Admin.');
      loadGroupHistory();
      if (onSubmitted) onSubmitted();

      // Reset optional inputs
      setAttachmentFile(null);
    } catch (err: any) {
      setSubmitError(err.message || 'Error occurred while saving evaluation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* ─── Header & Institutional Notice Banner ─── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-semibold">
              <ClipboardCheck className="w-4 h-4 text-indigo-400" />
              <span>Official Academic Review • Term 2026-27</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display text-white">
              Evaluation Form TE Mini-Project Review-2 (2026-27)
            </h1>
            <p className="text-sm text-indigo-200/90 leading-relaxed max-w-2xl">
              Please fill the Form with utmost care. The excel generated shall be sent to higher authorities for audit purpose. Write detailed comments wherever applicable. The evaluation form for each group reviewed should be filled on the same day of the review.
            </p>
          </div>

          {/* Live Score Badge */}
          <div className="bg-slate-800/90 backdrop-blur-md border border-indigo-500/30 rounded-2xl p-4 text-center shrink-0 shadow-lg sm:w-44">
            <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
              Live Total Score
            </div>
            <div className="text-3xl font-black text-white mt-1">
              {totalScoreOut50}
              <span className="text-sm text-slate-400 font-normal"> / 50</span>
            </div>
            <div className="text-[10px] text-emerald-400 font-medium mt-1">
              Mapped TE Review Marks
            </div>
          </div>
        </div>

        {/* User Identity Notice */}
        <div className="mt-4 pt-4 border-t border-indigo-900/60 flex items-center gap-2 text-xs text-indigo-300/80">
          <Info className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>
            Logged in as <strong className="text-white">{currentUser.name}</strong> ({currentUser.email}). When you submit this form, higher authorities and Super Admin will see your credentials.
          </span>
        </div>
      </div>

      {/* Role Notice if Student */}
      {!isFacultyOrAdmin && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900 text-xs leading-relaxed">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">Student View Mode:</strong> This official evaluation form is submitted by faculty mentors and the designated review panel. You can preview the rubric criteria and review the finalized panel evaluation feedback below once evaluated.
          </div>
        </div>
      )}

      {/* ─── Success / Error Alerts ─── */}
      {submitSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-medium shadow-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{submitSuccess}</span>
        </div>
      )}

      {submitError && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl flex items-center gap-3 text-rose-800 text-sm font-medium shadow-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {/* ─── The Official Evaluation Form ─── */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Project Group Selection */}
        <Card padding="md" className="border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                1
              </span>
              <span>Select Project Group for Evaluation</span>
              <span className="text-rose-500 font-bold">*</span>
            </label>
            <span className="text-xs text-slate-400 font-mono">Required</span>
          </div>

          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            disabled={!isFacultyOrAdmin}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {allTeams.map((t) => (
              <option key={t.id} value={t.name}>
                {t.name} {t.projectTitle ? `— ${t.projectTitle}` : ''}
              </option>
            ))}
          </select>
        </Card>

        {/* 2 & 3. Attendance of Students */}
        <Card padding="md" className="border-slate-200 shadow-sm space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <span>Were all the students present for the review ?</span>
                <span className="text-rose-500 font-bold">*</span>
              </label>
              <span className="text-xs text-slate-400 font-mono">Required</span>
            </div>
            <p className="text-xs text-slate-500 italic pl-8">
              If &apos;No&apos;, Review panel can notify the absence to project guide via email with Project Co-ordinator and Division Co-ordinators in CC
            </p>
          </div>

          <div className="flex items-center gap-6 pl-8">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-sm text-slate-800">
              <input
                type="radio"
                name="allPresent"
                value="Yes"
                checked={allPresent === 'Yes'}
                onChange={() => setAllPresent('Yes')}
                disabled={!isFacultyOrAdmin}
                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span>Yes</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-medium text-sm text-slate-800">
              <input
                type="radio"
                name="allPresent"
                value="No"
                checked={allPresent === 'No'}
                onChange={() => setAllPresent('No')}
                disabled={!isFacultyOrAdmin}
                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-rose-600 font-semibold">No</span>
            </label>
          </div>

          {/* 3. Absent Students Name */}
          <div className="space-y-2 pt-2 border-t border-slate-100 pl-8">
            <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                3
              </span>
              <span>Names of Absent students if any</span>
            </label>
            <p className="text-xs text-slate-400">Write &apos;NA&apos; if all students were present</p>
            <input
              type="text"
              value={absentStudents}
              onChange={(e) => setAbsentStudents(e.target.value)}
              disabled={!isFacultyOrAdmin}
              placeholder="e.g. NA or Roll No / Name"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </Card>

        {/* 4. Suggested Title */}
        <Card padding="md" className="border-slate-200 shadow-sm space-y-2">
          <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
              4
            </span>
            <span>Enter the suggested Title of the Project</span>
          </label>
          <p className="text-xs text-slate-500 pl-8">
            Evaluators can suggest an appropriate title to the Group under review.
          </p>
          <div className="pl-8">
            <input
              type="text"
              value={suggestedTitle}
              onChange={(e) => setSuggestedTitle(e.target.value)}
              disabled={!isFacultyOrAdmin}
              placeholder="Suggested / Approved Project Title..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </Card>

        {/* 5. Outcome of Project Idea Presentation */}
        <Card padding="md" className="border-slate-200 shadow-sm space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                  5
                </span>
                <span>Outcome of Project Idea Presentation</span>
                <span className="text-rose-500 font-bold">*</span>
              </label>
              <span className="text-xs text-slate-400 font-mono">Required</span>
            </div>
            <p className="text-xs text-slate-500 italic pl-8 leading-relaxed">
              The comments written and the suggestions given are a testimony of your evaluation. Kindly select appropriate option very carefully. You may consider discussing with Project guide, Project Co-ordinator, Div Co-ordinators before giving your opinion.
            </p>
          </div>

          <div className="space-y-2 pl-8">
            <label className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
              ideaOutcome === 'Idea Approved'
                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
                : 'border-slate-200 hover:bg-slate-50 text-slate-800'
            }`}>
              <input
                type="radio"
                name="ideaOutcome"
                value="Idea Approved"
                checked={ideaOutcome === 'Idea Approved'}
                onChange={() => setIdeaOutcome('Idea Approved')}
                disabled={!isFacultyOrAdmin}
                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <div>
                <span className="font-bold text-sm">Idea Approved</span>
                <p className="text-xs opacity-75">Group is cleared to advance to full prototype implementation.</p>
              </div>
            </label>

            <label className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
              ideaOutcome === 'Modifications required'
                ? 'bg-amber-50/80 border-amber-300 text-amber-900'
                : 'border-slate-200 hover:bg-slate-50 text-slate-800'
            }`}>
              <input
                type="radio"
                name="ideaOutcome"
                value="Modifications required"
                checked={ideaOutcome === 'Modifications required'}
                onChange={() => setIdeaOutcome('Modifications required')}
                disabled={!isFacultyOrAdmin}
                className="w-4 h-4 text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <div>
                <span className="font-bold text-sm">Modifications required</span>
                <p className="text-xs opacity-75">Panel requires specific scope, architecture, or objectives revision (mandatory Point 6).</p>
              </div>
            </label>
          </div>
        </Card>

        {/* 6. Feedback By Panel - Modifications suggested */}
        <Card padding="md" className="border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                6
              </span>
              <span>Feedback By Panel - Modifications suggested (if any)</span>
              {ideaOutcome === 'Modifications required' && (
                <span className="text-rose-500 font-bold">*</span>
              )}
            </label>
            <span className="text-xs text-slate-400 font-mono">
              {ideaOutcome === 'Modifications required' ? 'Mandatory' : 'Optional'}
            </span>
          </div>
          <p className="text-xs text-slate-500 pl-8">
            #mandatory if point 5 is &ldquo;Modifications required&rdquo; (Otherwise Write NA)
          </p>
          <div className="pl-8">
            <textarea
              rows={3}
              value={modificationsSuggested}
              onChange={(e) => setModificationsSuggested(e.target.value)}
              disabled={!isFacultyOrAdmin}
              placeholder="Enter suggested modifications or NA..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </Card>

        {/* 7. Feedback By Panel - Outcome expected */}
        <Card padding="md" className="border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                7
              </span>
              <span>Feedback By Panel - Outcome expected from the project</span>
              <span className="text-rose-500 font-bold">*</span>
            </label>
            <span className="text-xs text-rose-500 font-bold font-mono">MANDATORY</span>
          </div>
          <p className="text-xs text-slate-500 pl-8 leading-relaxed">
            Please mention what is the final goal/ output that the group must achieve so as to consider the project as completed for submission at TE level.
          </p>
          <div className="pl-8">
            <textarea
              rows={3}
              required
              value={expectedOutcome}
              onChange={(e) => setExpectedOutcome(e.target.value)}
              disabled={!isFacultyOrAdmin}
              placeholder="e.g. End-to-end working hardware setup with live sensor dashboard, latency benchmarks, and final report with 15+ peer-reviewed citations..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </Card>

        {/* ─── Rating Scales: Points 8 to 14 ─── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span>Evaluation Rubric Criteria (Scale 1 to 10)</span>
            </h2>
            <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
              Total Mapped Marks: 50
            </span>
          </div>

          {/* 8. Project Planning */}
          <RubricScaleItem
            number={8}
            title="Project Planning"
            mappingLabel="Mapped to 5 Marks"
            mappedValue={planningMarks}
            maxMapped={5}
            value={planningScore}
            disabled={!isFacultyOrAdmin}
            onChange={(val) => handleScoreChange(val, setPlanningScore)}
          />

          {/* 9. Clarity of Problem Statement and Objectives */}
          <RubricScaleItem
            number={9}
            title="Clarity of Problem Statement and Objectives"
            mappingLabel="Mapped to 10 Marks"
            mappedValue={problemClarityMarks}
            maxMapped={10}
            value={problemClarityScore}
            disabled={!isFacultyOrAdmin}
            onChange={(val) => handleScoreChange(val, setProblemClarityScore)}
          />

          {/* 10. Literature Review */}
          <RubricScaleItem
            number={10}
            title="Literature Review"
            mappingLabel="Mapped to 15 Marks"
            mappedValue={literatureReviewMarks}
            maxMapped={15}
            value={literatureReviewScore}
            disabled={!isFacultyOrAdmin}
            onChange={(val) => handleScoreChange(val, setLiteratureReviewScore)}
          />

          {/* 11. Analysis - Execution / Real life application / Usability */}
          <RubricScaleItem
            number={11}
            title="Analysis - Execution / Real life application / Usability of project"
            mappingLabel="Mapped to 20 Marks"
            mappedValue={analysisMarks}
            maxMapped={20}
            value={analysisScore}
            disabled={!isFacultyOrAdmin}
            onChange={(val) => handleScoreChange(val, setAnalysisScore)}
          />

          {/* 12. Difficulty level of project */}
          <RubricScaleItem
            number={12}
            title="Difficulty level of project as per UG level"
            mappingLabel="Scale 1 to 10"
            value={difficultyLevel}
            disabled={!isFacultyOrAdmin}
            onChange={(val) => handleScoreChange(val, setDifficultyLevel)}
          />

          {/* 13. Quality of the Presentation */}
          <RubricScaleItem
            number={13}
            title="Quality of the Presentation"
            mappingLabel="Scale 1 to 10"
            value={presentationQuality}
            disabled={!isFacultyOrAdmin}
            onChange={(val) => handleScoreChange(val, setPresentationQuality)}
          />

          {/* 14. Whether the students were speaking in Proper English ? */}
          <RubricScaleItem
            number={14}
            title="Whether the students were speaking in Proper English ?"
            mappingLabel="Scale 1 to 10"
            value={englishProficiency}
            disabled={!isFacultyOrAdmin}
            onChange={(val) => handleScoreChange(val, setEnglishProficiency)}
          />
        </div>

        {/* 15. Progress Percentage */}
        <Card padding="md" className="border-slate-200 shadow-sm space-y-3">
          <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
              15
            </span>
            <span>How much percent of the Project is Completed?</span>
            <span className="text-rose-500 font-bold">*</span>
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pl-8">
            {['0-25%', '25-50%', '50-75%', '75-90%', '90-100%'].map((pct) => (
              <button
                type="button"
                key={pct}
                onClick={() => setProgressPercentage(pct)}
                disabled={!isFacultyOrAdmin}
                className={`py-2 px-3 rounded-xl font-bold text-xs transition-all border ${
                  progressPercentage === pct
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {pct}
              </button>
            ))}
          </div>
        </Card>

        {/* 16 & 17. Panel Members */}
        <Card padding="md" className="border-slate-200 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                  16
                </span>
                <span>Name of Panel Member 1</span>
                <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                type="text"
                required
                value={panelMember1}
                onChange={(e) => setPanelMember1(e.target.value)}
                disabled={!isFacultyOrAdmin}
                placeholder="Dr. Sheetal Patil"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                  17
                </span>
                <span>Name of Panel Member 2</span>
                <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                type="text"
                required
                value={panelMember2}
                onChange={(e) => setPanelMember2(e.target.value)}
                disabled={!isFacultyOrAdmin}
                placeholder="Prof. Amol Kulkarni"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </Card>

        {/* 18. File Upload Attachment */}
        <Card padding="md" className="border-slate-200 shadow-sm space-y-3">
          <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
              18
            </span>
            <span>Any particular comments apart from above feedback can be uploaded here (Optional)</span>
          </label>
          <p className="text-xs text-slate-500 pl-8">
            Upload file (Limit: 1 file, Max: 10MB • Types: Word, Excel, PPT, PDF, Image, Video, Audio)
          </p>

          <div className="pl-8">
            <label className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-indigo-50/20 transition-all">
              <Upload className="w-6 h-6 text-slate-400 mb-2" />
              <span className="text-xs font-semibold text-slate-700">
                {attachmentFile ? attachmentFile.name : 'Click to select or drag & drop file'}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">
                {attachmentFile ? `${(attachmentFile.size / 1024).toFixed(1)} KB` : 'DOCX, XLSX, PPTX, PDF, JPG, PNG up to 10MB'}
              </span>
              <input
                type="file"
                disabled={!isFacultyOrAdmin}
                onChange={(e) => {
                  if (e.target.files?.[0]) setAttachmentFile(e.target.files[0]);
                }}
                className="hidden"
              />
            </label>
          </div>
        </Card>

        {/* Submit Actions */}
        {isFacultyOrAdmin && (
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-100/80 p-5 rounded-2xl border border-slate-200">
            <div className="text-xs text-slate-600">
              Evaluations are immutably archived and synced to the <strong className="text-slate-900">Super Admin Audit Dashboard</strong> for NAAC/ABET compliance.
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              className="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Submitting & Archiving...' : 'Submit Evaluation to Super Admin'}</span>
            </Button>
          </div>
        )}
      </form>

      {/* ─── Historical Evaluations for This Group ─── */}
      <div className="mt-10 pt-6 border-t border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>Submitted Evaluation Records for {selectedGroup}</span>
          </h2>
          <span className="text-xs font-medium text-slate-500">
            {groupHistory.length} record{groupHistory.length !== 1 ? 's' : ''} found
          </span>
        </div>

        {loadingHistory ? (
          <div className="p-8 text-center text-slate-400 text-xs animate-pulse">
            Loading group evaluation history...
          </div>
        ) : groupHistory.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            No Review-2 evaluation form has been submitted for {selectedGroup} yet.
          </div>
        ) : (
          <div className="space-y-3">
            {groupHistory.map((item) => {
              const isExpanded = expandedEvalId === item.id;
              return (
                <Card key={item.id} padding="md" className="border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          item.ideaOutcome === 'Idea Approved'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {item.ideaOutcome}
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          Total Score: {item.totalMarks} / 50 Marks
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          • {new Date(item.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600">
                        Evaluated by <strong className="text-slate-800">{item.panelMember1}</strong> &amp; <strong className="text-slate-800">{item.panelMember2}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right text-xs">
                        <div className="text-slate-400">Progress Completed</div>
                        <div className="font-bold text-indigo-700">{item.progressPercentage}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setExpandedEvalId(isExpanded ? null : item.id)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Evaluation Detail Card */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 text-xs text-slate-700">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl font-mono text-[11px]">
                        <div>Planning: <strong>{item.planningMarks} / 5</strong></div>
                        <div>Problem Clarity: <strong>{item.problemClarityMarks} / 10</strong></div>
                        <div>Lit Review: <strong>{item.literatureReviewMarks} / 15</strong></div>
                        <div>Analysis: <strong>{item.analysisMarks} / 20</strong></div>
                      </div>

                      {item.suggestedTitle && (
                        <div>
                          <span className="font-bold text-slate-900">Suggested Title:</span> {item.suggestedTitle}
                        </div>
                      )}

                      <div>
                        <span className="font-bold text-slate-900">All Present:</span> {item.allPresent}
                        {item.absentStudents && item.absentStudents !== 'NA' && (
                          <span className="text-rose-600 ml-2"> (Absent: {item.absentStudents})</span>
                        )}
                      </div>

                      {item.modificationsSuggested && item.modificationsSuggested !== 'NA' && (
                        <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-900">
                          <strong className="block font-bold mb-0.5">Modifications Suggested by Panel:</strong>
                          {item.modificationsSuggested}
                        </div>
                      )}

                      <div className="p-2.5 bg-indigo-50 rounded-lg border border-indigo-100 text-indigo-900">
                        <strong className="block font-bold mb-0.5">Expected Outcome for TE Completion:</strong>
                        {item.expectedOutcome}
                      </div>

                      <div className="text-[11px] text-slate-400">
                        Record ID: <span className="font-mono">{item.id}</span> • Submitter: {item.submittedByEmail}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// Reusable scale selector from 1 to 10
interface RubricScaleItemProps {
  number: number;
  title: string;
  mappingLabel: string;
  mappedValue?: number;
  maxMapped?: number;
  value: number;
  disabled?: boolean;
  onChange: (val: number) => void;
}

const RubricScaleItem: React.FC<RubricScaleItemProps> = ({
  number,
  title,
  mappingLabel,
  mappedValue,
  maxMapped,
  value,
  disabled,
  onChange,
}) => {
  return (
    <Card padding="md" className="border-slate-200 shadow-2xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
            {number}
          </span>
          <span>{title}</span>
        </label>

        <div className="flex items-center gap-2 text-xs pl-8 sm:pl-0">
          <span className="text-slate-500 font-medium">{mappingLabel}</span>
          {mappedValue !== undefined && maxMapped !== undefined && (
            <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
              {mappedValue} / {maxMapped} M
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 pl-8">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
          <button
            type="button"
            key={score}
            disabled={disabled}
            onClick={() => onChange(score)}
            className={`py-2 rounded-xl font-bold text-xs transition-all border ${
              value === score
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm scale-105'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            {score}
          </button>
        ))}
      </div>
    </Card>
  );
};

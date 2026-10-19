import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import prisma from '@/lib/db/prisma';
import { getOptionalSession } from '@/lib/auth/get-session';

export interface Review2Evaluation {
  id: string;
  teamId: string;
  groupName: string;
  allPresent: 'Yes' | 'No';
  absentStudents: string;
  suggestedTitle: string;
  ideaOutcome: 'Idea Approved' | 'Modifications required';
  modificationsSuggested: string;
  expectedOutcome: string;
  planningScore: number;          // 1 - 10 (maps to 5 Marks)
  problemClarityScore: number;    // 1 - 10 (maps to 10 Marks)
  literatureReviewScore: number;  // 1 - 10 (maps to 15 Marks)
  analysisScore: number;          // 1 - 10 (maps to 20 Marks)
  difficultyLevel: number;        // 1 - 10
  presentationQuality: number;    // 1 - 10
  englishProficiency: number;     // 1 - 10
  progressPercentage: string;     // e.g. "50-75%"
  panelMember1: string;
  panelMember2: string;
  attachmentName?: string;
  attachmentUrl?: string;
  // Computed marks
  planningMarks: number;          // (planningScore / 10) * 5
  problemClarityMarks: number;    // (problemClarityScore / 10) * 10
  literatureReviewMarks: number;  // (literatureReviewScore / 10) * 15
  analysisMarks: number;          // (analysisScore / 10) * 20
  totalMarks: number;             // out of 50
  submittedByEmail: string;
  submittedByName: string;
  submittedAt: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'evaluations_review2.json');

// Default initial seed evaluations for demo realism
const INITIAL_DEMO_EVALUATIONS: Review2Evaluation[] = [
  {
    id: 'eval-rev2-001',
    teamId: 'team-mini-1',
    groupName: 'Mini 1',
    allPresent: 'Yes',
    absentStudents: 'NA',
    suggestedTitle: 'Edge AI Vision for Industrial Safety Inspection & PPE Compliance',
    ideaOutcome: 'Idea Approved',
    modificationsSuggested: 'NA',
    expectedOutcome: 'Working edge computer vision pipeline on NVIDIA Jetson detecting helmet and vest violations with <50ms latency.',
    planningScore: 9,
    problemClarityScore: 9,
    literatureReviewScore: 8,
    analysisScore: 9,
    difficultyLevel: 8,
    presentationQuality: 9,
    englishProficiency: 8,
    progressPercentage: '50-75%',
    panelMember1: 'Dr. Sheetal Patil',
    panelMember2: 'Prof. Amol Kulkarni',
    planningMarks: 4.5,
    problemClarityMarks: 9.0,
    literatureReviewMarks: 12.0,
    analysisMarks: 18.0,
    totalMarks: 43.5,
    submittedByEmail: 'sheetal.patil@vit.edu.in',
    submittedByName: 'Dr. Sheetal Patil',
    submittedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'eval-rev2-002',
    teamId: 'team-mini-6',
    groupName: 'Mini 6',
    allPresent: 'Yes',
    absentStudents: 'NA',
    suggestedTitle: 'Autonomous Telemetry & Vision Pipeline for Unmanned Inspection',
    ideaOutcome: 'Idea Approved',
    modificationsSuggested: 'Include sensor calibration benchmark metrics in intermediate draft.',
    expectedOutcome: 'Live telemetry ingestion dashboard with sensor fusion visualization and real-time alerts.',
    planningScore: 8,
    problemClarityScore: 8,
    literatureReviewScore: 9,
    analysisScore: 8,
    difficultyLevel: 9,
    presentationQuality: 8,
    englishProficiency: 9,
    progressPercentage: '50-75%',
    panelMember1: 'Dr. Sheetal Patil',
    panelMember2: 'Prof. S. R. Desai',
    planningMarks: 4.0,
    problemClarityMarks: 8.0,
    literatureReviewMarks: 13.5,
    analysisMarks: 16.0,
    totalMarks: 41.5,
    submittedByEmail: 'sheetal.patil@vit.edu.in',
    submittedByName: 'Dr. Sheetal Patil',
    submittedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

async function getStoredEvaluations(): Promise<Review2Evaluation[]> {
  const evalMap = new Map<string, Review2Evaluation>();

  // 1. Seed demo defaults
  for (const item of INITIAL_DEMO_EVALUATIONS) {
    evalMap.set(item.id, item);
  }

  // 2. Load from PostgreSQL audit_events
  try {
    const dbEvents = await prisma.auditEvent.findMany({
      where: { entityType: 'review_2_evaluation' },
      orderBy: { createdAt: 'desc' },
    });
    for (const evt of dbEvents) {
      if (evt.newValue && typeof evt.newValue === 'object') {
        const item = evt.newValue as unknown as Review2Evaluation;
        if (item.id && item.groupName) {
          evalMap.set(item.id, item);
        }
      }
    }
  } catch (dbErr) {
    console.warn('[Review-2 API] Error reading PostgreSQL audit events:', dbErr);
  }

  // 3. Load from local file
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = await fs.promises.readFile(DATA_FILE, 'utf-8');
      const fileEvals: Review2Evaluation[] = JSON.parse(raw);
      for (const item of fileEvals) {
        evalMap.set(item.id, item);
      }
    }
  } catch (err) {
    console.warn('[Review-2 API] Error reading evaluations file:', err);
  }

  return Array.from(evalMap.values()).sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );
}

async function saveStoredEvaluations(evals: Review2Evaluation[]): Promise<void> {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      await fs.promises.mkdir(DATA_DIR, { recursive: true });
    }
    await fs.promises.writeFile(DATA_FILE, JSON.stringify(evals, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Review-2 API] File write warning:', err);
  }
}

// GET /api/v1/evaluations/review-2
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get('teamId');

    const all = await getStoredEvaluations();

    if (!teamId) {
      return NextResponse.json({ success: true, evaluations: all });
    }

    const filtered = all.filter(
      (e) =>
        e.teamId.toLowerCase() === teamId.toLowerCase() ||
        e.groupName.toLowerCase() === teamId.toLowerCase() ||
        e.teamId.toLowerCase().includes(teamId.toLowerCase())
    );

    return NextResponse.json({
      success: true,
      evaluations: filtered,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch evaluations' },
      { status: 500 }
    );
  }
}

// POST /api/v1/evaluations/review-2
export async function POST(req: NextRequest) {
  try {
    const session = await getOptionalSession();
    const body = await req.json();

    const {
      teamId,
      groupName,
      allPresent,
      absentStudents,
      suggestedTitle,
      ideaOutcome,
      modificationsSuggested,
      expectedOutcome,
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
      attachmentName,
      attachmentUrl,
      evaluatorName,
      evaluatorEmail,
    } = body;

    const resolvedGroupName = (body.groupName || body.teamId || '').trim();
    const resolvedOutcome = body.outcome || body.ideaOutcome || 'Idea Approved';
    const resolvedModifications = (body.modificationsSuggested || '').trim();
    const resolvedAllPresent = body.allPresent || 'Yes';
    const resolvedExpectedOutcome = (body.expectedOutcome || 'Working prototype deliverable ready for Review-2').trim();

    // Rubric scores with aliases
    const rawPlanning = body.planningScore !== undefined ? body.planningScore : body.planning;
    const rawProblem = body.problemClarityScore !== undefined ? body.problemClarityScore : (body.problemStatementScore !== undefined ? body.problemStatementScore : body.problemStatement);
    const rawLiterature = body.literatureReviewScore !== undefined ? body.literatureReviewScore : body.literatureReview;
    const rawAnalysis = body.analysisScore !== undefined ? body.analysisScore : body.analysis;

    // Validation
    if (!resolvedGroupName) {
      return NextResponse.json(
        { success: false, error: 'Project group selection is required.' },
        { status: 400 }
      );
    }

    if (resolvedOutcome === 'Modifications required' && (!resolvedModifications || resolvedModifications.toUpperCase() === 'NA')) {
      return NextResponse.json(
        { success: false, error: 'Point 6 (Modifications suggested) is mandatory when Outcome is "Modifications required".' },
        { status: 400 }
      );
    }

    // Boundary validation for rubric scores (1 to 10 scale)
    const scoresToValidate = [
      { name: 'planning', val: rawPlanning },
      { name: 'problemStatement', val: rawProblem },
      { name: 'literatureReview', val: rawLiterature },
      { name: 'analysis', val: rawAnalysis },
      { name: 'difficultyLevel', val: body.difficultyLevel },
      { name: 'presentationQuality', val: body.presentationQuality },
      { name: 'englishProficiency', val: body.englishProficiency },
    ];

    for (const item of scoresToValidate) {
      if (item.val !== undefined && item.val !== null && item.val !== '') {
        const num = Number(item.val);
        if (isNaN(num) || num < 1 || num > 10) {
          return NextResponse.json(
            { success: false, error: `Score for ${item.name} must be between 1 and 10 (received ${item.val}).` },
            { status: 400 }
          );
        }
      }
    }

    // Marks computation
    const pScore = Number(rawPlanning !== undefined ? rawPlanning : 8);
    const prScore = Number(rawProblem !== undefined ? rawProblem : 8);
    const lScore = Number(rawLiterature !== undefined ? rawLiterature : 8);
    const aScore = Number(rawAnalysis !== undefined ? rawAnalysis : 8);

    const planningMarks = Number(((pScore / 10) * 5).toFixed(1));
    const problemClarityMarks = Number(((prScore / 10) * 10).toFixed(1));
    const literatureReviewMarks = Number(((lScore / 10) * 15).toFixed(1));
    const analysisMarks = Number(((aScore / 10) * 20).toFixed(1));
    const totalMarks = Number((planningMarks + problemClarityMarks + literatureReviewMarks + analysisMarks).toFixed(1));

    const newEval: Review2Evaluation = {
      id: `eval-rev2-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      teamId: body.teamId || resolvedGroupName,
      groupName: resolvedGroupName,
      allPresent: resolvedAllPresent === 'No' ? 'No' : 'Yes',
      absentStudents: (body.absentStudents || 'NA').trim(),
      suggestedTitle: (body.suggestedTitle || '').trim(),
      ideaOutcome: resolvedOutcome === 'Modifications required' ? 'Modifications required' : 'Idea Approved',
      modificationsSuggested: resolvedModifications || 'NA',
      expectedOutcome: resolvedExpectedOutcome,
      planningScore: pScore,
      problemClarityScore: prScore,
      literatureReviewScore: lScore,
      analysisScore: aScore,
      difficultyLevel: Math.min(10, Math.max(1, Number(body.difficultyLevel) || 8)),
      presentationQuality: Math.min(10, Math.max(1, Number(body.presentationQuality) || 8)),
      englishProficiency: Math.min(10, Math.max(1, Number(body.englishProficiency) || 8)),
      progressPercentage: body.progressPercentage || '50-75%',
      panelMember1: (body.panelMember1 || 'Dr. Sheetal Patil').trim(),
      panelMember2: (body.panelMember2 || 'Prof. Panel Evaluator').trim(),
      attachmentName: body.attachmentName || undefined,
      attachmentUrl: body.attachmentUrl || undefined,
      planningMarks,
      problemClarityMarks,
      literatureReviewMarks,
      analysisMarks,
      totalMarks,
      submittedByEmail: body.evaluatorEmail || session?.email || 'sheetal.patil@vit.edu.in',
      submittedByName: body.evaluatorName || session?.name || 'Dr. Sheetal Patil',
      submittedAt: new Date().toISOString(),
    };

    // 1. Save to PostgreSQL auditEvent
    try {
      await prisma.auditEvent.create({
        data: {
          entityType: 'review_2_evaluation',
          entityId: newEval.id,
          action: 'evaluation_submitted',
          newValue: newEval as any,
          reason: `TE Mini-Project Review-2 evaluation submitted for ${newEval.groupName}`,
        },
      });
    } catch (dbErr) {
      console.warn('[Review-2 API] DB audit log write warning:', dbErr);
    }

    // 2. Save to local JSON store
    const all = await getStoredEvaluations();
    all.unshift(newEval);
    await saveStoredEvaluations(all);

    return NextResponse.json({
      success: true,
      message: `Evaluation Form for ${newEval.groupName} submitted successfully. Results dispatched to Super Admin.`,
      evaluation: newEval,
    });
  } catch (err: any) {
    console.error('[Review-2 API] POST error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to submit evaluation' },
      { status: 500 }
    );
  }
}

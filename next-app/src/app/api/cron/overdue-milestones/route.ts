// POST/GET /api/cron/overdue-milestones — Evaluates milestone deadlines
// TASK-BE-016 & FR-070 to FR-075
// Secured by CRON_SECRET bearer token. Fully idempotent background sweeper.

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import eventBus from '@/lib/events/bus';
import { validateCronSecret } from '@/lib/api/cron-auth';

export async function GET(request: NextRequest) {
  return handleOverdueSweep(request);
}

export async function POST(request: NextRequest) {
  return handleOverdueSweep(request);
}

async function handleOverdueSweep(request: NextRequest): Promise<NextResponse> {
  const authError = validateCronSecret(request);
  if (authError) return authError;

  const now = new Date();
  const startTime = performance.now();

  try {
    // 1. Identify all active, un-submitted milestones whose deadline has passed
    const overdueCandidates = await prisma.milestone.findMany({
      where: {
        dueDate: { lt: now },
        status: { in: ['not_started', 'in_progress', 'blocked'] },
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        status: true,
        teamId: true,
      },
    });

    const updatedIds: string[] = [];

    if (overdueCandidates.length > 0) {
      // 2. Atomically update all candidates in a single SQL operation
      await prisma.milestone.updateMany({
        where: {
          id: { in: overdueCandidates.map((m) => m.id) },
        },
        data: { status: 'overdue' },
      });

      // 3. Emit past-tense domain events (Audit wildcard handler runs in background via after())
      for (const milestone of overdueCandidates) {
        updatedIds.push(milestone.id);
        await eventBus.publish({
          type: 'milestone.overdue',
          entityType: 'milestone',
          entityId: milestone.id,
          action: 'overdue',
          actorId: null, // system-originated sweep
          priorValue: { status: milestone.status },
          newValue: { status: 'overdue' },
          reason: 'Automated background cron deadline sweep detected past due date.',
          timestamp: new Date(),
        });
      }
    }

    const durationMs = Number((performance.now() - startTime).toFixed(2));

    return NextResponse.json({
      success: true,
      job: 'overdue-milestones',
      evaluatedCount: overdueCandidates.length,
      updatedCount: updatedIds.length,
      updatedMilestoneIds: updatedIds,
      timestamp: now.toISOString(),
      durationMs,
    });
  } catch (error: any) {
    console.error('[Cron:OverdueMilestones] Execution error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to complete overdue milestones cron sweep.',
          details: [{ message: error.message || 'Unknown database error' }],
          requestId: crypto.randomUUID(),
        },
      },
      { status: 500 }
    );
  }
}

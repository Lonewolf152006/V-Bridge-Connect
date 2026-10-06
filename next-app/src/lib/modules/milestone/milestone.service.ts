// VBridgeConnect — Milestone Service

import { milestoneRepository } from './milestone.repository';
import {
  validateMilestoneTransition,
  assertMilestoneTransitionRole,
  MilestoneTransitionError,
} from './milestone.state-machine';
import eventBus from '@/lib/events/bus';
import { type TokenPayload, AuthError } from '@/lib/auth/jwt';

export const milestoneService = {
  async create(
    data: {
      activityId: string;
      teamId?: string;
      title: string;
      description: string;
      stageNumber: number;
      dueDate: string;
      weightage?: number;
      deliverableType?: string;
      requiresMentorReview?: boolean;
    },
    user: TokenPayload
  ) {
    const milestone = await milestoneRepository.create({
      activity: { connect: { id: data.activityId } },
      team: data.teamId ? { connect: { id: data.teamId } } : undefined,
      title: data.title,
      description: data.description,
      stageNumber: data.stageNumber,
      status: 'not_started',
      dueDate: new Date(data.dueDate),
      weightage: data.weightage ?? 0,
      deliverableType: data.deliverableType ?? 'any',
      requiresMentorReview: data.requiresMentorReview ?? true,
    });

    await eventBus.publish({
      type: 'milestone.created',
      entityType: 'milestone',
      entityId: milestone.id,
      action: 'created',
      actorId: user.userId,
      newValue: { status: 'not_started', title: milestone.title },
      timestamp: new Date(),
    });

    return milestone;
  },

  async transition(
    milestoneId: string,
    verb: string,
    user: TokenPayload,
    options?: { reason?: string; category?: string }
  ) {
    const milestone = await milestoneRepository.findById(milestoneId);
    if (!milestone) throw new AuthError('Milestone not found', 404);

    const transition = validateMilestoneTransition(milestone.status, verb, false);
    assertMilestoneTransitionRole(transition, user.role);

    if (transition.requiresReason && !options?.reason) {
      throw new MilestoneTransitionError(
        `Transition "${verb}" requires a reason`,
        milestone.status,
        verb,
        []
      );
    }

    const priorStatus = milestone.status;

    const extra: Record<string, unknown> = {};
    if (verb === 'block') {
      extra.blockReason = options?.reason;
      extra.blockCategory = options?.category;
    }
    if (verb === 'waive') {
      extra.waiveReason = options?.reason;
    }

    const updated = await milestoneRepository.updateStatus(
      milestoneId,
      transition.to,
      extra as Parameters<typeof milestoneRepository.updateStatus>[2]
    );

    const eventType = `milestone.${verbToPastTense(verb)}`;
    await eventBus.publish({
      type: eventType,
      entityType: 'milestone',
      entityId: milestoneId,
      action: verbToPastTense(verb),
      actorId: user.userId,
      priorValue: { status: priorStatus },
      newValue: { status: transition.to },
      reason: options?.reason,
      timestamp: new Date(),
    });

    return updated;
  },

  /**
   * architecture.md §6: Milestone overdue sweep.
   * Every 15 minutes. System-derived — never manually set.
   * Finds milestones past due date and marks them overdue.
   */
  async runOverdueSweep() {
    const overdueMilestones = await milestoneRepository.findOverdueMilestones();
    const results = [];

    for (const milestone of overdueMilestones) {
      try {
        const transition = validateMilestoneTransition(
          milestone.status,
          'mark-overdue',
          true // system action
        );

        const priorStatus = milestone.status;
        await milestoneRepository.updateStatus(milestone.id, transition.to);

        await eventBus.publish({
          type: 'milestone.overdue',
          entityType: 'milestone',
          entityId: milestone.id,
          action: 'overdue',
          actorId: null, // system-originated
          priorValue: { status: priorStatus },
          newValue: { status: 'overdue' },
          timestamp: new Date(),
        });

        results.push({ milestoneId: milestone.id, status: 'marked_overdue' });
      } catch (error) {
        results.push({
          milestoneId: milestone.id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  },

  async findById(milestoneId: string) {
    return milestoneRepository.findByIdWithRelations(milestoneId);
  },

  async findByActivityId(activityId: string) {
    return milestoneRepository.findByActivityId(activityId);
  },

  async findByTeamId(teamId: string) {
    return milestoneRepository.findByTeamId(teamId);
  },
};

function verbToPastTense(verb: string): string {
  const mapping: Record<string, string> = {
    'start': 'started',
    'block': 'blocked',
    'unblock': 'unblocked',
    'submit': 'submitted',
    'request-changes': 'changes_requested',
    'accept': 'accepted',
    'resubmit': 'resubmitted',
    'mark-overdue': 'overdue',
    'waive': 'waived',
  };
  return mapping[verb] ?? verb.replace(/-/g, '_');
}

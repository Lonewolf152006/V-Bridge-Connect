// VBridgeConnect — Activity Service
// Orchestrates state transitions, emits domain events, delegates to repository.
// rules.md §2: Every transition emits a domain event via eventBus.publish().

import { type ActivityStatus } from '@prisma/client';
import { activityRepository } from './activity.repository';
import {
  validateActivityTransition,
  assertTransitionRole,
  ActivityTransitionError,
} from './activity.state-machine';
import eventBus, { type DomainEvent } from '@/lib/events/bus';
import { type TokenPayload, AuthError } from '@/lib/auth/jwt';

export const activityService = {
  /**
   * Create a new activity in draft status.
   * FR-001: One configurable activity template for all types.
   */
  async create(
    data: {
      title: string;
      description: string;
      type: string;
      departmentId: string;
      capacity: number;
      teamSizeMin?: number;
      teamSizeMax?: number;
      applicationDeadline?: string;
      startDate?: string;
      endDate?: string;
      visibility?: string;
      eligibility?: Record<string, unknown>;
      participationMode?: string;
      certificateEligible?: boolean;
    },
    user: TokenPayload
  ) {
    const activity = await activityRepository.create({
      title: data.title,
      description: data.description,
      type: data.type,
      status: 'draft',
      department: { connect: { id: data.departmentId } },
      owner: { connect: { id: user.userId } },
      capacity: data.capacity,
      teamSizeMin: data.teamSizeMin ?? 1,
      teamSizeMax: data.teamSizeMax ?? 5,
      applicationDeadline: data.applicationDeadline ? new Date(data.applicationDeadline) : undefined,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      visibility: data.visibility ?? 'department',
      eligibility: (data.eligibility as any) ?? undefined,
      participationMode: data.participationMode ?? 'team',
      certificateEligible: data.certificateEligible ?? true,
    });

    await eventBus.publish({
      type: 'activity.created',
      entityType: 'activity',
      entityId: activity.id,
      action: 'created',
      actorId: user.userId,
      newValue: { status: 'draft', title: activity.title },
      timestamp: new Date(),
    });

    return activity;
  },

  /**
   * Execute a state transition on an activity.
   * rules.md §2: State transitions are actions, not raw status PATCH.
   * Every transition validated against the state machine, emits a domain event.
   */
  async transition(
    activityId: string,
    verb: string,
    user: TokenPayload,
    options?: { reason?: string; idempotencyKey?: string }
  ) {
    const activity = await activityRepository.findById(activityId);
    if (!activity) {
      throw new AuthError('Activity not found', 404);
    }

    // Validate the transition against the state machine
    const transition = validateActivityTransition(activity.status, verb);

    // Check role authorization for this transition
    assertTransitionRole(transition, user.role);

    // If transition requires a reason, enforce it
    if (transition.requiresReason && !options?.reason) {
      throw new ActivityTransitionError(
        `Transition "${verb}" requires a reason`,
        activity.status,
        verb,
        []
      );
    }

    const priorStatus = activity.status;

    // Perform the status update
    const extra: Record<string, string | undefined> = {};
    if (verb === 'cancel') extra.cancellationReason = options?.reason;
    if (verb === 'archive') extra.archiveReason = options?.reason;

    const updated = await activityRepository.updateStatus(
      activityId,
      transition.to,
      extra
    );

    // Emit domain event — rules.md §5: entity.pastTenseVerb
    const eventType = `activity.${verbToPastTense(verb)}`;
    await eventBus.publish({
      type: eventType,
      entityType: 'activity',
      entityId: activityId,
      action: verbToPastTense(verb),
      actorId: user.userId,
      priorValue: { status: priorStatus },
      newValue: { status: transition.to },
      reason: options?.reason,
      timestamp: new Date(),
    });

    return updated;
  },

  async findById(activityId: string) {
    return activityRepository.findByIdWithRelations(activityId);
  },

  async findMany(filters: {
    departmentId?: string;
    status?: ActivityStatus;
    ownerId?: string;
    type?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    return activityRepository.findMany(filters);
  },

  /**
   * FR-006: Duplicate an activity — copies structure but never participant/submission data.
   */
  async duplicate(activityId: string, user: TokenPayload) {
    const original = await activityRepository.findByIdWithRelations(activityId);
    if (!original) throw new AuthError('Activity not found', 404);

    const duplicated = await activityRepository.create({
      title: `${original.title} (Copy)`,
      description: original.description,
      type: original.type,
      status: 'draft',
      department: { connect: { id: original.departmentId } },
      owner: { connect: { id: user.userId } },
      capacity: original.capacity,
      teamSizeMin: original.teamSizeMin,
      teamSizeMax: original.teamSizeMax,
      visibility: original.visibility,
      eligibility: original.eligibility ?? undefined,
      participationMode: original.participationMode,
      certificateEligible: original.certificateEligible,
    });

    await eventBus.publish({
      type: 'activity.duplicated',
      entityType: 'activity',
      entityId: duplicated.id,
      action: 'duplicated',
      actorId: user.userId,
      metadata: { originalId: activityId },
      newValue: { status: 'draft', title: duplicated.title },
      timestamp: new Date(),
    });

    return duplicated;
  },
};

/**
 * Convert a kebab-case verb to past tense for event naming.
 * rules.md §5: Event names use past tense.
 */
function verbToPastTense(verb: string): string {
  const mapping: Record<string, string> = {
    'submit-for-approval': 'submitted_for_approval',
    'approve': 'approved',
    'request-changes': 'changes_requested',
    'close-applications': 'applications_closed',
    'activate': 'activated',
    'mark-final-review': 'final_review_marked',
    'complete': 'completed',
    'cancel': 'cancelled',
    'archive': 'archived',
  };
  return mapping[verb] ?? verb.replace(/-/g, '_');
}

// VBridgeConnect — Application Service
// FR-010 to FR-015: Applications, review, selection, waitlisting, atomic capacity (QA-10)

import { applicationRepository } from './application.repository';
import {
  validateApplicationTransition,
  assertApplicationTransitionRole,
} from './application.state-machine';
import eventBus from '@/lib/events/bus';
import { type TokenPayload, AuthError } from '@/lib/auth/jwt';
import { assertActivityScope } from '@/lib/auth/rbac';
import prisma from '@/lib/db/prisma';

export interface CreateApplicationDTO {
  activityId: string;
  teamId?: string;
  status?: 'draft' | 'submitted';
  answers?: Record<string, unknown>;
  statementOfPurpose?: string;
  portfolioUrl?: string;
}

export interface TransitionApplicationDTO {
  decisionNote?: string;
  reviewerNote?: string;
  rejectionReason?: string;
  withdrawalReason?: string;
}

export const applicationService = {
  /**
   * Submit or draft a new application (FR-010).
   */
  async createApplication(dto: CreateApplicationDTO, user: TokenPayload) {
    // 1. Verify activity exists and is open for applications
    const activity = await prisma.activity.findUnique({
      where: { id: dto.activityId },
      select: {
        id: true,
        title: true,
        status: true,
        capacity: true,
        filledSeats: true,
        applicationDeadline: true,
      },
    });

    if (!activity) {
      throw new Error('Activity not found');
    }

    if (activity.status !== 'published') {
      throw new Error(`Cannot apply: activity is in "${activity.status}" state, must be "published"`);
    }

    if (activity.applicationDeadline && new Date() > new Date(activity.applicationDeadline)) {
      throw new Error('Application deadline has passed');
    }

    // 2. Check for duplicate application
    const existing = await applicationRepository.findExisting(dto.activityId, user.userId);
    if (existing) {
      throw new Error('You have already submitted an application for this activity');
    }

    const status = dto.status ?? 'submitted';

    // 3. Create application
    const app = await applicationRepository.create({
      activityId: dto.activityId,
      applicantId: user.userId,
      teamId: dto.teamId,
      status,
      answers: (dto.answers as any),
      statementOfPurpose: dto.statementOfPurpose,
      portfolioUrl: dto.portfolioUrl,
    });

    // 4. Publish event if submitted
    if (status === 'submitted') {
      await eventBus.publish({
        type: 'application.submitted',
        entityType: 'application',
        entityId: app.id,
        action: 'submitted',
        actorId: user.userId,
        newValue: { status: 'submitted', activityId: dto.activityId },
        metadata: { activityTitle: activity.title },
        timestamp: new Date(),
      });
    }

    return app;
  },

  /**
   * Get application by ID.
   * FR-064: Reviewer notes are private and never shown to the applicant.
   */
  async getById(id: string, user: TokenPayload) {
    const app = await applicationRepository.findById(id);
    if (!app) {
      throw new Error('Application not found');
    }

    // Authorization check
    if (user.role === 'student' && app.applicant.id !== user.userId) {
      throw new AuthError('Forbidden: you can only view your own application', 403);
    }

    if (user.role === 'coordinator' || user.role === 'industry_partner') {
      await assertActivityScope(user, app.activity.id);
    }

    // FR-064 & Architecture §8: Strip reviewer notes and private decision notes for students and industry partners
    if (user.role === 'student' || user.role === 'industry_partner') {
      const { reviewerNote, decisionNote, ...sanitized } = app;
      return sanitized;
    }

    return app;
  },

  /**
   * List applications for an activity.
   */
  async listByActivity(
    activityId: string,
    user: TokenPayload,
    filters?: { status?: any }
  ) {
    if (user.role !== 'super_admin') {
      await assertActivityScope(user, activityId);
    }
    const apps = await applicationRepository.findByActivityId(activityId, filters);
    if (user.role === 'student' || user.role === 'industry_partner') {
      return apps.map((a: any) => {
        const { reviewerNote, decisionNote, ...sanitized } = a;
        return sanitized;
      });
    }
    return apps;
  },

  /**
   * List applications for the current student.
   */
  async listMyApplications(user: TokenPayload) {
    return applicationRepository.findByApplicantId(user.userId);
  },

  /**
   * Transition an application's lifecycle state.
   * Actions: submit, open-review, shortlist, select, waitlist, reject, withdraw, promote.
   * Enforces QA-10 atomic capacity on selection/promotion.
   */
  async transition(
    applicationId: string,
    verb: string,
    user: TokenPayload,
    dto?: TransitionApplicationDTO
  ) {
    const app = await applicationRepository.findById(applicationId);
    if (!app) {
      throw new Error('Application not found');
    }

    // 1. State machine validation
    const transition = validateApplicationTransition(app.status, verb);
    assertApplicationTransitionRole(transition, user.role);

    // 2. Extra validation for students withdrawing
    if (verb === 'withdraw' && user.role === 'student' && app.applicant.id !== user.userId) {
      throw new AuthError('You can only withdraw your own application', 403);
    }

    // 3. Reason requirement check
    if (transition.requiresReason && !dto?.rejectionReason) {
      throw new Error(`Rejection reason is required for action "${verb}"`);
    }

    let updated;

    // 4. Handle atomic operations
    if (verb === 'select') {
      updated = await applicationRepository.selectWithCapacityLock(
        applicationId,
        app.activity.id,
        user.userId,
        dto?.decisionNote,
        dto?.reviewerNote
      );
    } else if (verb === 'promote') {
      updated = await applicationRepository.promoteWithCapacityLock(
        applicationId,
        app.activity.id,
        user.userId,
        dto?.decisionNote
      );
    } else if (verb === 'withdraw' && app.status === 'selected') {
      // If withdrawing after being selected, release the seat!
      updated = await applicationRepository.withdrawSelectedWithSeatRelease(
        applicationId,
        app.activity.id,
        dto?.withdrawalReason
      );
    } else {
      // Standard status update
      updated = await applicationRepository.update(applicationId, {
        status: transition.to,
        reviewerId: user.userId,
        reviewerNote: dto?.reviewerNote,
        decisionNote: dto?.decisionNote,
        rejectionReason: dto?.rejectionReason,
        withdrawalReason: dto?.withdrawalReason,
      });
    }

    // 5. Emit domain event: application.{pastTenseVerb}
    const pastTenseVerb =
      verb === 'open-review'
        ? 'under_review'
        : verb === 'submit'
        ? 'submitted'
        : verb === 'shortlist'
        ? 'shortlisted'
        : verb === 'select' || verb === 'promote'
        ? 'selected'
        : verb === 'waitlist'
        ? 'waitlisted'
        : verb === 'reject'
        ? 'rejected'
        : verb === 'withdraw'
        ? 'withdrawn'
        : `${verb}ed`;

    await eventBus.publish({
      type: `application.${pastTenseVerb}`,
      entityType: 'application',
      entityId: applicationId,
      action: pastTenseVerb,
      actorId: user.userId,
      priorValue: { status: app.status },
      newValue: { status: transition.to },
      reason: dto?.rejectionReason || dto?.withdrawalReason,
      metadata: {
        activityId: app.activity.id,
        applicantId: app.applicant.id,
        verb,
      },
      timestamp: new Date(),
    });

    return updated;
  },
};

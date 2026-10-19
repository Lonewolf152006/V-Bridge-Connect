import prisma from '@/lib/db/prisma';
import eventBus, { type DomainEvent } from '@/lib/events/bus';
import { sendWebPushToUser, isPushAllowedByAntiSpamRule } from '@/lib/push/webpush';

export const notificationService = {
  /**
   * Register event subscribers for notification-worthy events.
   */
  registerSubscribers(): void {
    // Activity published — notify department members
    eventBus.subscribe('activity.approved', async (event) => {
      await createNotification({
        event,
        title: 'Activity Published',
        body: `An activity has been approved and published.`,
        severity: 'info',
      });
    });

    // Application decision (Push Allowed: Decision)
    eventBus.subscribe('application.selected', async (event) => {
      if (event.metadata?.applicantId) {
        const userId = event.metadata.applicantId as string;
        await prisma.notification.create({
          data: {
            userId,
            title: 'Application Accepted',
            body: 'Your application has been selected!',
            severity: 'info',
            entityType: 'application',
            entityId: event.entityId,
          },
        });

        // Web push (PRD Anti-Spam Rule: Decision)
        if (isPushAllowedByAntiSpamRule(event.type, event.metadata)) {
          await sendWebPushToUser(userId, {
            title: 'Application Accepted',
            body: 'Congratulations! Your capstone application has been accepted.',
            url: `/projects/${event.entityId}`,
            category: 'decision',
          });
        }
      }
    });

    eventBus.subscribe('application.rejected', async (event) => {
      if (event.metadata?.applicantId) {
        const userId = event.metadata.applicantId as string;
        await prisma.notification.create({
          data: {
            userId,
            title: 'Application Update',
            body: 'Your application status has been updated.',
            severity: 'info',
            entityType: 'application',
            entityId: event.entityId,
          },
        });

        // Web push (PRD Anti-Spam Rule: Decision)
        if (isPushAllowedByAntiSpamRule(event.type, event.metadata)) {
          await sendWebPushToUser(userId, {
            title: 'Application Update',
            body: 'Your capstone project application status has been updated.',
            url: '/dashboard',
            category: 'decision',
          });
        }
      }
    });

    // Milestone overdue (Push Allowed: Deadline)
    eventBus.subscribe('milestone.overdue', async (event) => {
      await createNotification({
        event,
        title: 'Milestone Overdue',
        body: `A project milestone is now overdue. Please review immediately.`,
        severity: 'urgent',
      });
    });

    // Submission received
    eventBus.subscribe('submission.submitted', async (event) => {
      await createNotification({
        event,
        title: 'New Submission',
        body: 'A new submission has been received for review.',
        severity: 'info',
      });
    });

    // Certificate issued
    eventBus.subscribe('certificate.issued', async (event) => {
      if (event.metadata?.studentId) {
        const userId = event.metadata.studentId as string;
        await prisma.notification.create({
          data: {
            userId,
            title: 'Certificate Issued',
            body: 'A new certificate has been issued for you. View and download it now.',
            severity: 'info',
            entityType: 'certificate',
            entityId: event.entityId,
          },
        });

        // Web Push (PRD Anti-Spam: Decision / Outcome)
        if (isPushAllowedByAntiSpamRule(event.type, event.metadata)) {
          await sendWebPushToUser(userId, {
            title: 'Certificate Issued',
            body: 'Your university-verified certificate is now ready in your portfolio.',
            url: '/certificates',
            category: 'decision',
          });
        }
      }
    });

    // New direct message (Push Allowed: Direct Message)
    eventBus.subscribe('message.sent', async (event) => {
      if (event.metadata?.recipientIds) {
        const recipientIds = event.metadata.recipientIds as string[];
        for (const recipientId of recipientIds) {
          if (recipientId !== event.actorId) {
            await prisma.notification.create({
              data: {
                userId: recipientId,
                title: 'New Message',
                body: 'You have a new direct message.',
                severity: 'info',
                entityType: 'message',
                entityId: event.entityId,
              },
            });

            // Web Push (PRD Anti-Spam: Direct Message)
            if (isPushAllowedByAntiSpamRule(event.type, event.metadata)) {
              await sendWebPushToUser(recipientId, {
                title: 'New Direct Message',
                body: 'You received a new message on VBridgeConnect.',
                url: '/messages',
                category: 'direct_message',
              });
            }
          }
        }
      }
    });
  },
};

async function createNotification(params: {
  event: DomainEvent;
  title: string;
  body: string;
  severity: string;
}) {
  const { event, title, body, severity } = params;

  if (event.actorId) {
    try {
      await prisma.notification.create({
        data: {
          userId: event.actorId,
          title,
          body,
          severity,
          entityType: event.entityType,
          entityId: event.entityId,
        },
      });

      // Filter through PRD Anti-Spam Rule for Push
      if (isPushAllowedByAntiSpamRule(event.type, { severity, ...event.metadata })) {
        await sendWebPushToUser(event.actorId, {
          title,
          body,
          url: '/dashboard',
          category: severity === 'urgent' ? 'deadline' : 'general',
        });
      }
    } catch (error) {
      console.error('[Notification] Failed to create notification:', error);
    }
  }

  console.log(`[Notification] ${severity.toUpperCase()}: ${title} — ${body}`);
}

// VBridgeConnect — Notification Service
// Subscribes to specific domain events and creates in-app notifications.
// architecture.md §3: Subscribes to domain events, fans out to in-app and email channels.

import prisma from '@/lib/db/prisma';
import eventBus, { type DomainEvent } from '@/lib/events/bus';

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

    // Application decision
    eventBus.subscribe('application.selected', async (event) => {
      if (event.metadata?.applicantId) {
        await prisma.notification.create({
          data: {
            userId: event.metadata.applicantId as string,
            title: 'Application Accepted',
            body: 'Your application has been selected!',
            severity: 'info',
            entityType: 'application',
            entityId: event.entityId,
          },
        });
      }
    });

    eventBus.subscribe('application.rejected', async (event) => {
      if (event.metadata?.applicantId) {
        await prisma.notification.create({
          data: {
            userId: event.metadata.applicantId as string,
            title: 'Application Update',
            body: 'Your application status has been updated.',
            severity: 'info',
            entityType: 'application',
            entityId: event.entityId,
          },
        });
      }
    });

    // Milestone overdue
    eventBus.subscribe('milestone.overdue', async (event) => {
      await createNotification({
        event,
        title: 'Milestone Overdue',
        body: `A milestone is now overdue.`,
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
        await prisma.notification.create({
          data: {
            userId: event.metadata.studentId as string,
            title: 'Certificate Issued',
            body: 'A new certificate has been issued for you. View and download it now.',
            severity: 'info',
            entityType: 'certificate',
            entityId: event.entityId,
          },
        });
      }
    });

    // New direct message
    eventBus.subscribe('message.sent', async (event) => {
      if (event.metadata?.recipientIds) {
        const recipientIds = event.metadata.recipientIds as string[];
        for (const recipientId of recipientIds) {
          if (recipientId !== event.actorId) {
            await prisma.notification.create({
              data: {
                userId: recipientId,
                title: 'New Message',
                body: 'You have a new message.',
                severity: 'info',
                entityType: 'message',
                entityId: event.entityId,
              },
            });
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

  // If there's a specific actor, notify them (for now — in production, this would
  // look up the relevant users based on the entity)
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
    } catch (error) {
      console.error('[Notification] Failed to create notification:', error);
    }
  }

  // TODO: Add email notification via transactional email provider
  console.log(`[Notification] ${severity.toUpperCase()}: ${title} — ${body}`);
}

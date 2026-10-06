// VBridgeConnect — Audit Service
// architecture.md §3: Subscribes to EVERY domain event via the wildcard channel.
// Writes an immutable record. Nothing else in the system can delete or edit an audit row.
// rules.md §2: Every critical transition emits a domain event and writes an audit entry.

import prisma from '@/lib/db/prisma';
import eventBus, { type DomainEvent } from '@/lib/events/bus';

export const auditService = {
  /**
   * Register the wildcard subscriber.
   * Called once at app startup from the event registration module.
   */
  registerSubscriber(): void {
    eventBus.subscribe('*', async (event: DomainEvent) => {
      try {
        await prisma.auditEvent.create({
          data: {
            actorId: event.actorId,
            entityType: event.entityType,
            entityId: event.entityId,
            action: event.action,
            priorValue: event.priorValue ? JSON.parse(JSON.stringify(event.priorValue)) : undefined,
            newValue: event.newValue ? JSON.parse(JSON.stringify(event.newValue)) : undefined,
            reason: event.reason,
          },
        });
      } catch (error) {
        // Audit writes must never crash the main flow, but we log the failure
        console.error('[Audit] Failed to write audit event:', error);
      }
    });
  },
};

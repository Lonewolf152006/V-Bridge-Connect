// VBridgeConnect — In-Process Domain Event Bus
// architecture.md §3: In-process pub/sub. Named events + wildcard channel.
// Event names follow rules.md §5: {entity}.{pastTenseVerb} — always past tense.
//
// The Audit module subscribes to the wildcard channel ('*') and writes an
// immutable record for every event. No other module needs to know Audit exists.

import { runInBackground } from '@/lib/async/after-task';

export interface DomainEvent {
  type: string;           // e.g. 'activity.published', 'milestone.overdue'
  entityType: string;     // e.g. 'activity', 'milestone'
  entityId: string;
  action: string;         // e.g. 'published', 'overdue'
  actorId: string | null; // null = system-originated (e.g. overdue sweep)
  priorValue?: unknown;
  newValue?: unknown;
  reason?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

type EventHandler = (event: DomainEvent) => void | Promise<void>;

class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();
  private wildcardHandlers: EventHandler[] = [];

  /**
   * Subscribe to a specific event type (e.g. 'activity.published')
   * or to ALL events by passing '*'.
   */
  subscribe(eventType: string, handler: EventHandler): () => void {
    if (eventType === '*') {
      this.wildcardHandlers.push(handler);
      return () => {
        this.wildcardHandlers = this.wildcardHandlers.filter((h) => h !== handler);
      };
    }

    const existing = this.handlers.get(eventType) || [];
    existing.push(handler);
    this.handlers.set(eventType, existing);

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(eventType) || [];
      this.handlers.set(
        eventType,
        handlers.filter((h) => h !== handler)
      );
    };
  }

  /**
   * Publish a domain event. Runs immediate domain subscribers,
   * then schedules secondary wildcard subscribers (Audit ledger writes)
   * in the background using Next.js after() to prevent latency on critical path.
   */
  async publish(event: DomainEvent): Promise<void> {
    const specificHandlers = this.handlers.get(event.type) || [];
    for (const handler of specificHandlers) {
      try {
        await handler(event);
      } catch (error) {
        console.error(
          `[EventBus] Handler error for event "${event.type}":`,
          error
        );
      }
    }

    if (this.wildcardHandlers.length > 0) {
      runInBackground(async () => {
        for (const handler of this.wildcardHandlers) {
          try {
            await handler(event);
          } catch (error) {
            console.error(
              `[EventBus] Wildcard/Audit handler error for event "${event.type}":`,
              error
            );
          }
        }
      });
    }
  }

  /** Clear all handlers — used in tests */
  clearAll(): void {
    this.handlers.clear();
    this.wildcardHandlers = [];
  }
}

// Singleton — one event bus for the entire process
export const eventBus = new EventBus();
export default eventBus;

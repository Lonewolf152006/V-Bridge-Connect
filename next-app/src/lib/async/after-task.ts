// VBridgeConnect — Next.js 15/16 Background Task Dispatcher
// Offloads slow operations (audit persistence, notifications, email alerts)
// off the critical synchronous HTTP request path using Next.js after().

import { after } from 'next/server';

/**
 * Executes a task in the background after the HTTP response has been sent to the client.
 * Falls back to non-blocking promise execution if called outside a request context.
 */
export function runInBackground(task: () => Promise<void> | void): void {
  try {
    // Attempt Next.js after() scheduling
    after(async () => {
      try {
        await task();
      } catch (err) {
        console.error('[BackgroundTask] Error running scheduled after task:', err);
      }
    });
  } catch {
    // Fallback when called outside active Next.js request lifecycle
    Promise.resolve()
      .then(() => task())
      .catch((err) => {
        console.error('[BackgroundTask] Error in fallback background task:', err);
      });
  }
}

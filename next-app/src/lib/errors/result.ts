// ─── Result<T, E> — typed Server Action return type ────────────────────────
// Every Server Action returns Result<T> so the client never has to try/catch.

export type ActionError = {
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export type Result<T, E = ActionError> =
  | { success: true; data: T }
  | { success: false; error: E };

// ─── Helper constructors ────────────────────────────────────────────────────

export function ok<T>(data: T): Result<T> {
  return { success: true, data };
}

export function fail(
  code: string,
  message: string,
  fieldErrors?: Record<string, string[]>,
): Result<never> {
  return { success: false, error: { code, message, fieldErrors } };
}

/**
 * Wrap a Server Action body so all AppErrors become typed Result failures
 * and unexpected errors get a generic 500 response.
 */
export async function safeAction<T>(
  fn: () => Promise<T>,
): Promise<Result<T>> {
  try {
    const data = await fn();
    return ok(data);
  } catch (err: unknown) {
    // Import dynamically to avoid circular deps at module level
    const { AppError } = await import('./app-error');
    const appErr = AppError.from(err);
    return fail(appErr.code, appErr.message);
  }
}

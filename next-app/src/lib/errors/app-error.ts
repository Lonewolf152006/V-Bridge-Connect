// ─── AppError Hierarchy ─────────────────────────────────────────────────────
// Central error abstraction for the entire app. Each subclass carries an HTTP
// status code and a machine-readable `code` string for the Result<T,E> pattern.

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    statusCode: number,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }

  /** Factory for quick creation in catch blocks */
  static from(err: unknown, fallbackMessage = 'An unexpected error occurred'): AppError {
    if (err instanceof AppError) return err;
    if (err instanceof Error) {
      return new AppError(err.message, 'INTERNAL_ERROR', 500);
    }
    return new AppError(fallbackMessage, 'INTERNAL_ERROR', 500);
  }
}

// ─── Subclasses ─────────────────────────────────────────────────────────────

export class NotFoundError extends AppError {
  constructor(entity: string, id?: string) {
    super(
      id ? `${entity} with id "${id}" not found` : `${entity} not found`,
      'NOT_FOUND',
      404,
      { entity, id },
    );
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 'UNAUTHORIZED', 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 'FORBIDDEN', 403);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'CONFLICT', 409, details);
    this.name = 'ConflictError';
  }
}

export class ValidationError extends AppError {
  public readonly fieldErrors: Record<string, string[]>;

  constructor(
    message: string,
    fieldErrors: Record<string, string[]> = {},
  ) {
    super(message, 'VALIDATION_ERROR', 422, { fieldErrors });
    this.name = 'ValidationError';
    this.fieldErrors = fieldErrors;
  }
}

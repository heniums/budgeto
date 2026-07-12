/**
 * Domain errors carrying an HTTP status code and a stable machine-readable code.
 * The central error handler in `app.ts` maps these to JSON responses. Built as a
 * plain factory rather than a class hierarchy so the codebase stays functional.
 */
const APP_ERROR = Symbol.for('budgeto.appError');

export interface AppErrorShape {
  statusCode: number;
  code: string;
  name: string;
  message: string;
}

export type AppError = Error & AppErrorShape;

export function createError(
  message: string,
  statusCode: number,
  code: string,
): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.code = code;
  error.name = code;
  Object.defineProperty(error, APP_ERROR, { value: true });
  return error;
}

export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as Record<symbol, unknown>)[APP_ERROR] === true
  );
}

export function validationError(message = 'Validation failed'): AppError {
  return createError(message, 400, 'VALIDATION_ERROR');
}

export function conflictError(message = 'Resource conflict'): AppError {
  return createError(message, 409, 'CONFLICT');
}

export function unauthorizedError(message = 'Unauthorized'): AppError {
  return createError(message, 401, 'UNAUTHORIZED');
}

export function notFoundError(message = 'Not found'): AppError {
  return createError(message, 404, 'NOT_FOUND');
}

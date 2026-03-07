/**
 * Structured API error for consistent HTTP responses.
 * Throw from services; errorHandler maps to appropriate status.
 */
export class ApiError extends Error {
  readonly statusCode: number

  constructor(statusCode: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
  }

  toJson(): { error: string } {
    return { error: this.message }
  }
}

/** Create a 400 Bad Request error. */
export function badRequest(message: string): ApiError {
  return new ApiError(400, message)
}

/** Create a 401 Unauthorized error. */
export function unauthorized(message = 'Not authenticated'): ApiError {
  return new ApiError(401, message)
}

/** Create a 403 Forbidden error. */
export function forbidden(message = 'Forbidden'): ApiError {
  return new ApiError(403, message)
}

/** Create a 404 Not Found error. */
export function notFound(message = 'Not found'): ApiError {
  return new ApiError(404, message)
}

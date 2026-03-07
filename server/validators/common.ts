/**
 * Common validation helpers for request input.
 * Pure functions; return error messages or null.
 */

export type ValidationResult = { valid: true } | { valid: false; message: string }

/** Validate that a required string field is present and non-empty. */
export function validateRequired(
  value: unknown,
  fieldName: string,
): ValidationResult {
  if (value === undefined || value === null) {
    return { valid: false, message: `${fieldName} is required` }
  }
  if (typeof value !== 'string') {
    return { valid: false, message: `${fieldName} must be a string` }
  }
  if (value.trim().length === 0) {
    return { valid: false, message: `${fieldName} is required` }
  }
  return { valid: true }
}

/** Validate that a value is one of the allowed options. */
export function validateOneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fieldName: string,
): ValidationResult {
  if (value === undefined || value === null) {
    return { valid: false, message: `${fieldName} is required` }
  }
  if (typeof value !== 'string') {
    return { valid: false, message: `${fieldName} must be a string` }
  }
  if (!allowed.includes(value as T)) {
    return { valid: false, message: `${fieldName} must be one of: ${allowed.join(', ')}` }
  }
  return { valid: true }
}

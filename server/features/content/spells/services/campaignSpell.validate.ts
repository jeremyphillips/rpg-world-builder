/**
 * Authoritative HTTP body validation for campaign spell create/update.
 */
import { MAGIC_SCHOOL_OPTIONS } from '../../../../../src/features/content/shared/domain/vocab/magicSchools.vocab';
import type { AccessPolicyScope } from '../../../../../shared/domain/accessPolicy';

const VALID_SCOPES: AccessPolicyScope[] = ['public', 'dm', 'restricted'];
const VALID_SCHOOLS = MAGIC_SCHOOL_OPTIONS.map((o) => o.id);

export type SpellValidationError = {
  path: string;
  code: string;
  message: string;
};

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

function validateAccessPolicy(body: Record<string, unknown>, errors: SpellValidationError[]): void {
  if (body.accessPolicy === undefined || body.accessPolicy === null) return;
  const ap = body.accessPolicy as Record<string, unknown>;
  if (typeof ap !== 'object') {
    errors.push({ path: 'accessPolicy', code: 'INVALID_TYPE', message: 'accessPolicy must be an object' });
    return;
  }
  if (!VALID_SCOPES.includes(ap.scope as AccessPolicyScope)) {
    errors.push({
      path: 'accessPolicy.scope',
      code: 'INVALID_VALUE',
      message: `scope must be one of: ${VALID_SCOPES.join(', ')}`,
    });
  }
  if (ap.allowCharacterIds !== undefined && !Array.isArray(ap.allowCharacterIds)) {
    errors.push({
      path: 'accessPolicy.allowCharacterIds',
      code: 'INVALID_TYPE',
      message: 'allowCharacterIds must be an array',
    });
  }
}

/**
 * Validates a request body expected to match SpellInput (no `id`).
 */
export function validateSpellInputBody(body: Record<string, unknown>): SpellValidationError[] {
  const errors: SpellValidationError[] = [];

  if (typeof body.name !== 'string' || body.name.trim().length === 0) {
    errors.push({ path: 'name', code: 'REQUIRED', message: 'name is required' });
  } else if (body.name.trim().length > 200) {
    errors.push({ path: 'name', code: 'OUT_OF_RANGE', message: 'name must be 200 characters or fewer' });
  }

  if (!isPlainObject(body.description)) {
    errors.push({ path: 'description', code: 'INVALID_TYPE', message: 'description must be an object with full and summary' });
  } else {
    if (typeof body.description.full !== 'string') {
      errors.push({ path: 'description.full', code: 'INVALID_TYPE', message: 'description.full must be a string' });
    }
    if (typeof body.description.summary !== 'string') {
      errors.push({ path: 'description.summary', code: 'INVALID_TYPE', message: 'description.summary must be a string' });
    }
  }

  if (typeof body.school !== 'string' || !VALID_SCHOOLS.includes(body.school)) {
    errors.push({
      path: 'school',
      code: 'INVALID_VALUE',
      message: `school must be one of: ${VALID_SCHOOLS.join(', ')}`,
    });
  }

  const level = Number(body.level);
  if (!Number.isInteger(level) || level < 0 || level > 9) {
    errors.push({ path: 'level', code: 'INVALID_VALUE', message: 'level must be an integer 0–9 (0 = cantrip)' });
  }

  if (!Array.isArray(body.classes)) {
    errors.push({ path: 'classes', code: 'INVALID_TYPE', message: 'classes must be an array' });
  } else if (body.classes.some((x) => typeof x !== 'string')) {
    errors.push({ path: 'classes', code: 'INVALID_TYPE', message: 'classes must be an array of strings' });
  }

  if (!Array.isArray(body.effectGroups)) {
    errors.push({ path: 'effectGroups', code: 'INVALID_TYPE', message: 'effectGroups must be an array' });
  }

  if (!isPlainObject(body.castingTime)) {
    errors.push({ path: 'castingTime', code: 'INVALID_TYPE', message: 'castingTime must be an object' });
  } else {
    const ct = body.castingTime;
    if (typeof ct.canBeCastAsRitual !== 'boolean') {
      errors.push({ path: 'castingTime.canBeCastAsRitual', code: 'INVALID_TYPE', message: 'must be boolean' });
    }
    if (!isPlainObject(ct.normal)) {
      errors.push({ path: 'castingTime.normal', code: 'INVALID_TYPE', message: 'castingTime.normal is required' });
    } else {
      const n = ct.normal;
      if (typeof n.value !== 'number' || !Number.isFinite(n.value) || n.value < 0) {
        errors.push({ path: 'castingTime.normal.value', code: 'INVALID_VALUE', message: 'must be a non-negative number' });
      }
      if (typeof n.unit !== 'string' || n.unit.length === 0) {
        errors.push({ path: 'castingTime.normal.unit', code: 'INVALID_VALUE', message: 'unit is required' });
      }
    }
  }

  if (!isPlainObject(body.range)) {
    errors.push({ path: 'range', code: 'INVALID_TYPE', message: 'range must be an object' });
  } else if (typeof body.range.kind !== 'string') {
    errors.push({ path: 'range.kind', code: 'INVALID_VALUE', message: 'range.kind is required' });
  }

  if (!isPlainObject(body.duration)) {
    errors.push({ path: 'duration', code: 'INVALID_TYPE', message: 'duration must be an object' });
  } else if (typeof body.duration.kind !== 'string') {
    errors.push({ path: 'duration.kind', code: 'INVALID_VALUE', message: 'duration.kind is required' });
  }

  if (!isPlainObject(body.components)) {
    errors.push({ path: 'components', code: 'INVALID_TYPE', message: 'components must be an object' });
  }

  validateAccessPolicy(body, errors);

  if (body.imageKey !== undefined && body.imageKey !== null && typeof body.imageKey !== 'string') {
    errors.push({ path: 'imageKey', code: 'INVALID_TYPE', message: 'imageKey must be a string' });
  }

  return errors;
}

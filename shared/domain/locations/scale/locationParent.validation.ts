/**
 * Pure parent/child location scale pairing validation.
 * Uses explicit policy in `locationScale.policy` (not rank ordering alone).
 */
import { isAllowedParentScale } from './locationScale.policy';
import { isValidLocationScaleId } from './locationScale.rules';

export type HierarchyValidationError = {
  path: string;
  code: string;
  message: string;
};

/** Parent scale must be allowed for the child scale (explicit policy map). */
export function validateParentChildScales(
  parentScale: string,
  childScale: string,
): HierarchyValidationError | null {
  if (!isValidLocationScaleId(parentScale)) {
    return {
      path: 'parentId',
      code: 'INVALID_SCALE',
      message: `Parent has unknown scale "${parentScale}"`,
    };
  }
  if (!isValidLocationScaleId(childScale)) {
    return {
      path: 'scale',
      code: 'INVALID_SCALE',
      message: `Unknown scale "${childScale}"`,
    };
  }
  if (!isAllowedParentScale(parentScale, childScale)) {
    return {
      path: 'parentId',
      code: 'INVALID_NESTING',
      message: 'Parent scale is not allowed for this location scale',
    };
  }
  return null;
}

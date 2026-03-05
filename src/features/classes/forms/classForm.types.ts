/**
 * Form types for Class Create/Edit.
 * Extends CharacterClass shape — json fields use string for form representation.
 */
import type { CharacterClass } from '@/features/classes/domain/types';
import type { Visibility } from '@/shared/types/visibility';

export type ClassFormValues = Pick<CharacterClass, 'name' | 'description'> & {
  accessPolicy?: Visibility;
  /** JSON string for FormJsonField. */
  generation: string;
  /** JSON string for FormJsonField. */
  proficiencies: string;
  /** JSON string for FormJsonField. */
  progression: string;
  /** JSON string for FormJsonField. */
  definitions: string;
  /** JSON string for FormJsonField. */
  requirements: string;
};

/** Input for create/update — domain shape. */
export type ClassInput = Omit<CharacterClass, 'id'> & {
  id?: string;
  accessPolicy?: Visibility;
};

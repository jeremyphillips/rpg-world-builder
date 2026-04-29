/**
 * Form types for Class Create/Edit.
 * Extends CharacterClass shape — json fields use string for form representation.
 */
import type { CharacterClass } from '@/features/content/classes/domain/types';
import type { Visibility } from '@/shared/types/visibility';

export type ClassFormValues = Pick<CharacterClass, 'name' | 'description'> & {
  /** Form uses empty string when cleared; maps to null via field parse. */
  imageKey: string;
  accessPolicy?: Visibility;
  /** JSON string for AppFormJsonPreviewField. */
  generation: string;
  /** JSON string for AppFormJsonPreviewField. */
  proficiencies: string;
  /** JSON string for AppFormJsonPreviewField. */
  progression: string;
  /** JSON string for AppFormJsonPreviewField. */
  definitions: string;
  /** JSON string for AppFormJsonPreviewField. */
  requirements: string;
};

/** Input for create/update — domain shape. */
export type ClassInput = Omit<CharacterClass, 'id'> & {
  id?: string;
  accessPolicy?: Visibility;
};

/**
 * Form types for Class Create/Edit.
 * Extends CharacterClass shape — json fields use string for form representation.
 */
import type { CharacterClass } from '@/features/content/classes/domain/types';
import type { Visibility } from '@/shared/types/visibility';
import type { NamedDescriptionFormRow } from '@/features/content/shared/forms/groups/createNamedDescriptionGroup';

/** One authored subclass row; `features` and other extras merge-preserved via `__rowId`. */
export type ClassSubclassOptionFormRow = NamedDescriptionFormRow & {
  id: string;
};

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
  /** Structured subclass selection scaffold (paths `definitions.*` / patch parity). */
  definitionsId: string;
  definitionsName: string;
  /** Level when the player chooses a subclass; empty = none (domain `null`). */
  definitionsSelectionLevel: string;
  definitionsOptions: ClassSubclassOptionFormRow[];
  /** JSON string for AppFormJsonPreviewField. */
  requirements: string;
};

/** Input for create/update — domain shape. */
export type ClassInput = Omit<CharacterClass, 'id'> & {
  id?: string;
  accessPolicy?: Visibility;
};

import { DIE_FACE_DEFINITIONS } from '@/shared/domain/dice/dice.definitions';

/**
 * Select / RHF options for polyhedral die faces.
 * Co-locate with content forms; `shared/domain/dice` keeps `DIE_FACES` and parsing only.
 */
export const DIE_FACE_OPTIONS = DIE_FACE_DEFINITIONS.map((d) => ({
  value: String(d.id),
  label: d.label,
})) as ReadonlyArray<{ value: string; label: string }>;

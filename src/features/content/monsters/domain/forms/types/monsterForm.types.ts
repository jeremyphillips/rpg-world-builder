/**
 * Shared form types for Monster Create/Edit routes.
 */
import type { ContentFormValues } from '@/features/content/shared/domain/types';
import type { MonsterType, MonsterSizeCategory, MonsterSubtype } from '@/features/content/monsters/domain/types';
import type { NamedDescriptionFormRow } from '@/features/content/shared/forms/groups/createNamedDescriptionGroup';

/**
 * Form-side row for a monster trait. Carries an opaque `__rowId` (created at
 * load time) used by `mergePreserveExtras` to round-trip domain extras
 * (`trigger`, `effects`, `uses`, `resolution.caveats`, …) that the form does
 * not author yet.
 */
export type MonsterTraitFormRow = NamedDescriptionFormRow;

export type MonsterFormValues = ContentFormValues & {
  type: MonsterType | '';
  /** Subtype tag; options depend on `type` (see getMonsterFieldConfigs). */
  subtype: MonsterSubtype | '';
  sizeCategory: MonsterSizeCategory | '';
  /** Individual JSON fields for mechanics and lore subfields */
  description: string;
  languages: string;
  hitPoints: string;
  armorClass: string;
  movement: string;
  actions: string;
  bonusActions: string;
  legendaryActions: string;
  /** Phase 1: structured repeatable group; preserves extras via `mergePreserveExtras`. */
  traits: MonsterTraitFormRow[];
  abilities: string;
  senses: string;
  proficiencies: string;
  proficiencyBonus: string;
  equipment: string;
  immunities: string[];
  vulnerabilities: string[];
  alignment: string;
  challengeRating: string;
  xpValue: string;
};

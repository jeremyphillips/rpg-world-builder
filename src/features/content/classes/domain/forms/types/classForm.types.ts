/**
 * Form types for Class Create/Edit.
 * Extends CharacterClass shape — json fields use string for form representation.
 */
import type { CharacterClass } from '@/features/content/classes/domain/types';
import type { AttackProgression, SpellcastingAbility } from '@/features/content/classes/domain/types/progression.types';
import type { Visibility } from '@/shared/types/visibility';
import type { AbilityId } from '@/features/mechanics/domain/character';
import type { NamedDescriptionFormRow } from '@/features/content/shared/forms/groups/createNamedDescriptionGroup';

/** One authored subclass row; `features` and other extras merge-preserved via `__rowId`. */
export type ClassSubclassOptionFormRow = NamedDescriptionFormRow & {
  id: string;
};

/** One class feature row (`progression.features[]`); `effects` merges via extras. */
export type ClassProgressionFeatureFormRow = NamedDescriptionFormRow & {
  id: string;
  /** RHF numberText string */
  level: string;
};

export type ClassFormValues = Pick<CharacterClass, 'name' | 'description'> & {
  /** Form uses empty string when cleared; maps to null via field parse. */
  imageKey: string;
  accessPolicy?: Visibility;
  /** JSON string for AppFormJsonPreviewField. */
  generation: string;
  proficiencySkillsType: 'choice' | 'fixed';
  proficiencySkillsLevel: string;
  /** When `skills.type` is `choice`. */
  proficiencySkillsChoose: string;
  /** One skill id/token per line / comma-separated; maps to `proficiencies.skills.from`. */
  proficiencySkillsFromText: string;

  proficiencyWeaponsType: 'choice' | 'fixed';
  proficiencyWeaponsLevel: string;
  proficiencyWeaponsCategories: string[];
  proficiencyWeaponsItemsText: string;

  proficiencyArmorType: 'choice' | 'fixed';
  proficiencyArmorLevel: string;
  proficiencyArmorCategories: string[];
  proficiencyArmorItemsText: string;
  proficiencyArmorDisallowedMaterials: string[];

  proficiencyToolsType: 'choice' | 'fixed';
  proficiencyToolsLevel: string;
  proficiencyToolsItems: string[];

  /** Empty means all races. */
  requirementsAllowedRaceIds: string[];
  /** Empty means any alignment. */
  requirementsAllowedAlignmentIds: string[];

  requirementsMulticlassingJson: string;
  requirementsMinStatsJson: string;
  /** Hit die faces (select value text, e.g. `"8"`). */
  progressionHitDie: string;
  progressionAttackProgression: AttackProgression | '';
  progressionSpellcasting: SpellcastingAbility | '';
  progressionSavingThrows: AbilityId[];
  /** Comma-/space-separated class levels with an ASI (e.g. `4, 8, 12`). */
  progressionAsiLevels: string;
  progressionExtraAttackLevel: string;
  progressionFeatures: ClassProgressionFeatureFormRow[];
  /** Structured subclass selection scaffold (paths `definitions.*` / patch parity). */
  definitionsId: string;
  definitionsName: string;
  /** Level when the player chooses a subclass; empty = none (domain `null`). */
  definitionsSelectionLevel: string;
  definitionsOptions: ClassSubclassOptionFormRow[];
};

/** Input for create/update — domain shape. */
export type ClassInput = Omit<CharacterClass, 'id'> & {
  id?: string;
  accessPolicy?: Visibility;
};

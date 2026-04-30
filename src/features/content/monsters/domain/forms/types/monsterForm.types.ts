/**
 * Shared form types for Monster Create/Edit routes.
 */
import type { ContentFormValues } from '@/features/content/shared/domain/types';
import type {
  MonsterArmorClass,
  MonsterType,
  MonsterSizeCategory,
  MonsterSubtype,
} from '@/features/content/monsters/domain/types';
import type { NamedDescriptionFormRow } from '@/features/content/shared/forms/groups/createNamedDescriptionGroup';

/**
 * Form-side row for a monster trait. Carries an opaque `__rowId` (created at
 * load time) used by `mergePreserveExtras` to round-trip domain extras
 * (`trigger`, `effects`, `uses`, `resolution.caveats`, …) that the form does
 * not author yet.
 */
export type MonsterTraitFormRow = NamedDescriptionFormRow;

/** Phase 5 — MVP fields for specials in `mechanics.actions`. */
export type MonsterSpecialActionFormRow = NamedDescriptionFormRow;

/** Phase 5 — natural attacks expose `name` only; combat stats stay as extras on the domain row. */
export type MonsterNaturalActionFormRow = Pick<NamedDescriptionFormRow, '__rowId' | 'name'>;

/** Phase 5 — inline legendary `{ kind:'inline'; action.kind:'special' }` authoring surface. */
export type MonsterLegendarySpecialInlineFormRow = {
  __rowId?: string;
  name: string;
  description: string;
};
/** Phase 5 — inline legendary natural rows. */
export type MonsterLegendaryNaturalInlineFormRow = { __rowId?: string; name: string };

export type MonsterFormValues = ContentFormValues & {
  type: MonsterType | '';
  /** Subtype tag; options depend on `type` (see getMonsterFieldConfigs). */
  subtype: MonsterSubtype | '';
  sizeCategory: MonsterSizeCategory | '';
  /** Individual JSON fields for mechanics and lore subfields */
  description: string;
  languages: string;
  /** Phase 4: flat `mechanics.hitPoints.{count,die,modifier}` */
  hitPointsCount: string;
  hitPointsDie: string;
  hitPointsModifier: string;
  /** Phase 4: `mechanics.armorClass` — natural offset / fixed value; equipment refs preserved at save */
  armorClassKind: MonsterArmorClass['kind'] | '';
  armorClassNaturalOffset: string;
  armorClassFixedValue: string;
  /** Phase 4: `mechanics.movement` speeds (ft.) */
  movementGround: string;
  movementSwim: string;
  movementFly: string;
  movementClimb: string;
  movementBurrow: string;
  /** Phase 5: `mechanics.actions` specials / naturals; weapons pass through untouched. */
  specialActions: MonsterSpecialActionFormRow[];
  naturalActions: MonsterNaturalActionFormRow[];
  /** Phase 5: `mechanics.bonusActions` */
  bonusSpecialActions: MonsterSpecialActionFormRow[];
  bonusNaturalActions: MonsterNaturalActionFormRow[];
  /** Phase 5: `{ uses, timing, refresh, … }` JSON (`actions[]` live in repeatable groups below). */
  legendaryActionsMeta: string;
  /** Phase 5: inline legendary specials */
  legendarySpecialActions: MonsterLegendarySpecialInlineFormRow[];
  legendaryNaturalActions: MonsterLegendaryNaturalInlineFormRow[];
  /** Phase 1: structured repeatable group; preserves extras via `mergePreserveExtras`. */
  traits: MonsterTraitFormRow[];
  /** Phase 4: `mechanics.abilities` (abbreviated ids: str, dex, …) */
  abilityStr: string;
  abilityDex: string;
  abilityCon: string;
  abilityInt: string;
  abilityWis: string;
  abilityCha: string;
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

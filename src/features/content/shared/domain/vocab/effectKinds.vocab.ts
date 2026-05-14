/**
 * Central registry of mechanics `Effect['kind']` values with authoring / UX metadata.
 * Mirrors the runtime `Effect` union — do not add ids that are not valid `Effect` kinds.
 */
import type { Effect } from '@/features/mechanics/domain/effects/effects.types';

/** Single source of truth for effect kind string literals (shared across spells, monsters, encounter). */
export type EffectKind = Effect['kind'];

export type EffectKindCategory = 'core' | 'advanced' | 'internal';

export type EffectKindDefinition = {
  id: EffectKind;
  name: string;
  description: string;
  category: EffectKindCategory;
  /** Safe to surface in user-facing help, glossaries, or clear UI copy. */
  userFacing: boolean;
  /**
   * Offer as a normal choice in standard authoring pickers (spell effect kind select, etc.).
   * Narrow by design — expand deliberately as UIs gain structured editors per kind.
   */
  authorable: boolean;
};

export const EFFECT_KIND_DEFINITIONS = [
  {
    id: 'action',
    name: 'Action',
    description:
      'Grants or references a named special action (e.g. monster legendary actions). Often paired with activation-style flows.',
    category: 'advanced',
    userFacing: true,
    authorable: false,
  },
  {
    id: 'activation',
    name: 'Activation',
    description:
      'Bundles child effects behind a specific activation cost (e.g. action, bonus action, reaction).',
    category: 'advanced',
    userFacing: true,
    authorable: false,
  },
  {
    id: 'aura',
    name: 'Aura',
    description:
      'Defines an area around a creature with nested effects applied to qualifying targets inside the aura.',
    category: 'advanced',
    userFacing: true,
    authorable: false,
  },
  {
    id: 'check',
    name: 'Check',
    description:
      'Requires an ability or skill check (often with DC), with optional follow-up effects on success or failure.',
    category: 'core',
    userFacing: true,
    authorable: true,
  },
  {
    id: 'condition',
    name: 'Condition',
    description: 'Applies a named condition (e.g. frightened, poisoned) with optional save or escape rules.',
    category: 'core',
    userFacing: true,
    authorable: true,
  },
  {
    id: 'containment',
    name: 'Containment',
    description: 'Models space occupancy, enclosures, or cover-like containment (e.g. cage or confined volume).',
    category: 'advanced',
    userFacing: true,
    authorable: false,
  },
  {
    id: 'custom',
    name: 'Custom',
    description:
      'Escape hatch for edition- or data-specific payloads not modeled as structured effects yet. Prefer shared kinds when possible.',
    category: 'internal',
    userFacing: false,
    authorable: false,
  },
  {
    id: 'damage',
    name: 'Damage',
    description: 'Deals damage to a target, with optional scaling, type, and instances.',
    category: 'core',
    userFacing: true,
    authorable: true,
  },
  {
    id: 'death-outcome',
    name: 'Death outcome',
    description:
      'Resolves special outcomes when a creature is reduced to 0 HP by this action (e.g. turns to dust).',
    category: 'advanced',
    userFacing: true,
    authorable: false,
  },
  {
    id: 'emanation',
    name: 'Emanation',
    description:
      'Self-centered battlefield aura (attached emanation) with area template; drives encounter/grid setup as well as inner effects.',
    category: 'advanced',
    userFacing: true,
    authorable: false,
  },
  {
    id: 'extra-reaction',
    name: 'Extra reaction',
    description: 'Grants additional reactions under narrow constraints (e.g. opportunity attacks only).',
    category: 'advanced',
    userFacing: true,
    authorable: false,
  },
  {
    id: 'form',
    name: 'Form',
    description: 'Transforms shape or form (true form vs object), size limits, and equipment handling.',
    category: 'advanced',
    userFacing: true,
    authorable: false,
  },
  {
    id: 'formula',
    name: 'Formula',
    description:
      'Evaluates a structured formula effect (derived stats or scripted outcomes). More system-heavy than a plain modifier.',
    category: 'advanced',
    userFacing: true,
    authorable: false,
  },
  {
    id: 'grant',
    name: 'Grant',
    description:
      'Grants proficiencies or condition immunities as authored payloads (see grantType for the specific grant).',
    category: 'core',
    userFacing: true,
    authorable: true,
  },
  {
    id: 'hide-eligibility-grant',
    name: 'Hide eligibility',
    description:
      'Temporarily toggles hide-related eligibility flags for encounter stealth resolution — not a separate permission system.',
    category: 'internal',
    userFacing: false,
    authorable: false,
  },
  {
    id: 'hit-points',
    name: 'Hit points',
    description: 'Heals or deals direct HP adjustment via a dice/flat value, optionally with ability modifier.',
    category: 'core',
    userFacing: true,
    authorable: false,
  },
  {
    id: 'hold-breath',
    name: 'Hold breath',
    description: 'Tracks holding breath with a duration constraint (niche environmental or suffocation-adjacent rules).',
    category: 'advanced',
    userFacing: true,
    authorable: false,
  },
  {
    id: 'immunity',
    name: 'Immunity',
    description:
      'Grants immunity to a source action or named spells for a duration (see scope for the immunity shape).',
    category: 'core',
    userFacing: true,
    authorable: true,
  },
  {
    id: 'interval',
    name: 'Interval',
    description: 'Repeats nested effects on a turn/round/time interval; may hook spatial entry for auras.',
    category: 'advanced',
    userFacing: true,
    authorable: false,
  },
  {
    id: 'modifier',
    name: 'Modifier',
    description: 'Adds, sets, or multiplies a stat or derived value on a defined target (AC, saves, etc.).',
    category: 'advanced',
    userFacing: true,
    authorable: false,
  },
  {
    id: 'move',
    name: 'Move',
    description: 'Forces or permits movement (distance, forced, nearest space, grid semantics).',
    category: 'core',
    userFacing: true,
    authorable: true,
  },
  {
    id: 'note',
    name: 'Note',
    description: 'Carries explanatory or narrative text without structured mechanical resolution on its own.',
    category: 'internal',
    userFacing: true,
    authorable: true,
  },
  {
    id: 'regeneration',
    name: 'Regeneration',
    description:
      'Turn-based healing or recovery with hooks (e.g. suppressed by damage types, disabled at 0 HP).',
    category: 'core',
    userFacing: true,
    authorable: false,
  },
  {
    id: 'remove-classification',
    name: 'Remove classification',
    description:
      'Strips a marker/classification string from an entity — engine-oriented; rarely the primary user-facing spell row.',
    category: 'internal',
    userFacing: false,
    authorable: false,
  },
  {
    id: 'resource',
    name: 'Resource',
    description: 'Defines or recharges named uses (per rest, dice pools, max charges).',
    category: 'core',
    userFacing: true,
    authorable: true,
  },
  {
    id: 'roll-modifier',
    name: 'Roll modifier',
    description: 'Applies advantage or disadvantage to named roll categories.',
    category: 'advanced',
    userFacing: true,
    authorable: false,
  },
  {
    id: 'save',
    name: 'Save',
    description: 'Requires a saving throw, often with different nested effects on success or failure.',
    category: 'core',
    userFacing: true,
    authorable: true,
  },
  {
    id: 'spawn',
    name: 'Spawn',
    description: 'Summons or places creatures from the catalog or pools with placement and initiative rules.',
    category: 'core',
    userFacing: true,
    authorable: true,
  },
  {
    id: 'state',
    name: 'State',
    description:
      'Applies a named runtime state id with optional ongoing nested effects, escape rules, or repeat saves.',
    category: 'core',
    userFacing: true,
    authorable: true,
  },
  {
    id: 'targeting',
    name: 'Targeting',
    description:
      'Legacy targeting effect row in flat Effect lists. Prefer spell effect-group targeting metadata instead of a standalone effect row when authoring spells.',
    category: 'internal',
    userFacing: false,
    authorable: false,
  },
  {
    id: 'tracked-part',
    name: 'Tracked part',
    description:
      'Tracks severable or regrowing body parts (heads, limbs) with loss/regrowth hooks — specialized engine modeling.',
    category: 'internal',
    userFacing: false,
    authorable: false,
  },
  {
    id: 'trigger',
    name: 'Trigger',
    description: 'Causes nested effects to fire in response to a specified trigger with optional resource cost.',
    category: 'advanced',
    userFacing: true,
    authorable: false,
  },
  {
    id: 'visibility-rule',
    name: 'Visibility rule',
    description: 'Adjusts visibility or notice checks in an area (e.g. transparent wall, perception DC to notice).',
    category: 'advanced',
    userFacing: true,
    authorable: false,
  },
] as const satisfies ReadonlyArray<EffectKindDefinition>;

export type EffectKindDefinitionRow = (typeof EFFECT_KIND_DEFINITIONS)[number];

/** Effect kinds enabled for authoring pickers (`authorable: true` in the registry). */
export type AuthorableEffectKind = Extract<
  (typeof EFFECT_KIND_DEFINITIONS)[number],
  { readonly authorable: true }
>['id'];

/** Select options for spell/monster effect-kind fields — only `authorable` kinds, sorted by display name. */
export function getAuthorableEffectKindSelectOptions(): { value: string; label: string }[] {
  return [...EFFECT_KIND_DEFINITIONS]
    .filter((d) => d.authorable)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((d) => ({ value: d.id, label: d.name }));
}

const EFFECT_KIND_DEFINITION_BY_ID: ReadonlyMap<EffectKind, EffectKindDefinition> = new Map(
  EFFECT_KIND_DEFINITIONS.map((row) => [row.id, row]),
);

export function getEffectKindById(id: EffectKind): EffectKindDefinition | undefined {
  return EFFECT_KIND_DEFINITION_BY_ID.get(id);
}

export function getEffectKindName(id: EffectKind): string {
  return getEffectKindById(id)?.name ?? id;
}

export const EFFECT_KIND_IDS: readonly EffectKind[] = EFFECT_KIND_DEFINITIONS.map((d) => d.id);

/** Kinds suitable for standard authoring pickers. */
export const AUTHORABLE_EFFECT_KIND_IDS: readonly EffectKind[] = EFFECT_KIND_DEFINITIONS.filter(
  (d) => d.authorable,
).map((d) => d.id);

/** Kinds intended for user-facing help surfaces. */
export const USER_FACING_EFFECT_KIND_IDS: readonly EffectKind[] = EFFECT_KIND_DEFINITIONS.filter(
  (d) => d.userFacing,
).map((d) => d.id);

export function effectKindsInCategory(category: EffectKindCategory): readonly EffectKindDefinition[] {
  return EFFECT_KIND_DEFINITIONS.filter((d) => d.category === category);
}

/** Compile-time: registry ids ↔ mechanics `Effect['kind']` stay aligned. */
type _RegistryId = (typeof EFFECT_KIND_DEFINITIONS)[number]['id'];
type _Missing = Exclude<EffectKind, _RegistryId>;
type _Extra = Exclude<_RegistryId, EffectKind>;
type _EffectKindRegistryComplete = [_Missing] extends [never]
  ? [_Extra] extends [never]
    ? true
    : never
  : never;
const __effectKindRegistryAlignment: _EffectKindRegistryComplete = true;
void __effectKindRegistryAlignment;

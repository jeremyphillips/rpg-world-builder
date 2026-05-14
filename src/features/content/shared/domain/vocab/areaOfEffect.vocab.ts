/**
 * Canonical area-of-effect shape ids and PHB-style reference text for spells, rules UI, and authoring.
 * Runtime templates (`AreaOfEffectTemplate` in mechanics) keep `{ kind, size }`; this module owns stable
 * `kind` ids and display metadata only.
 *
 * **Data stability:** `id` values appear in authored effects. Do not rename without a migration strategy;
 * prefer adding new shapes.
 */

export const AREA_OF_EFFECT_DEFINITIONS = [
  {
    id: 'cone',
    name: 'Cone',
    rulesText: 'A cone extends in a direction you choose from its point of origin.',
  },
  {
    id: 'sphere',
    name: 'Sphere',
    rulesText: 'A sphere extends outward from a point of origin.',
  },
  {
    id: 'line',
    name: 'Line',
    rulesText: 'A line extends from its point of origin in a straight path for its full length.',
  },
  {
    id: 'square',
    name: 'Square',
    rulesText: 'A square covers a square area measured by the specified size.',
  },
  {
    id: 'cylinder',
    name: 'Cylinder',
    rulesText: 'A cylinder extends from a point of origin with a circular base and a specified height.',
  },
  {
    id: 'cube',
    name: 'Cube',
    rulesText: 'A cube extends from its point of origin and covers a cubic area of the specified size.',
  },
] as const;

export type AreaOfEffectKind = (typeof AREA_OF_EFFECT_DEFINITIONS)[number]['id'];

/** Full row shape for a canonical AoE kind (matches `AREA_OF_EFFECT_DEFINITIONS` entries). */
export type AreaOfEffectDefinition = (typeof AREA_OF_EFFECT_DEFINITIONS)[number];

export const AREA_OF_EFFECT_KINDS: readonly AreaOfEffectKind[] =
  AREA_OF_EFFECT_DEFINITIONS.map((r) => r.id);

const AREA_OF_EFFECT_DEFINITION_BY_ID: ReadonlyMap<AreaOfEffectKind, AreaOfEffectDefinition> =
  new Map(AREA_OF_EFFECT_DEFINITIONS.map((r) => [r.id, r]));

/** Lookup by id; undefined if unknown. */
export function getAreaOfEffectById(
  areaId: AreaOfEffectKind,
): AreaOfEffectDefinition | undefined {
  return AREA_OF_EFFECT_DEFINITION_BY_ID.get(areaId);
}

/** Rules reference line for tooltips and help; undefined if unknown. */
export function getAreaOfEffectRulesText(areaId: AreaOfEffectKind): string | undefined {
  return AREA_OF_EFFECT_DEFINITION_BY_ID.get(areaId)?.rulesText;
}

/** Resolve rules text when `key` matches an `AreaOfEffectKind` (e.g. dynamic keys from effects). */
export function getAreaOfEffectRulesTextForKey(key: string): string | undefined {
  if ((AREA_OF_EFFECT_KINDS as readonly string[]).includes(key)) {
    return getAreaOfEffectRulesText(key as AreaOfEffectKind);
  }
  return undefined;
}

export { AREA_OF_EFFECT_DEFINITION_BY_ID };

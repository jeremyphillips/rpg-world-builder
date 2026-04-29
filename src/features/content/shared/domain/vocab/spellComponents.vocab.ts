/**
 * Canonical spell component ids (V/S/M) and PHB-style reference text for rules UI and spell detail.
 * Authored spell shape (`SpellComponents` with optional booleans + material payload) stays in spell types;
 * this module owns stable component ids and display metadata only.
 */

export const SPELL_COMPONENT_DEFINITIONS = [
  {
    id: 'verbal',
    name: 'Verbal',
    rulesText: 'A Verbal component is spoken aloud as part of casting the spell.',
  },
  {
    id: 'somatic',
    name: 'Somatic',
    rulesText: 'A Somatic component requires a free hand to perform the spell’s gestures.',
  },
  {
    id: 'material',
    name: 'Material',
    rulesText:
      'A Material component requires the specified materials unless a feature or focus allows otherwise.',
  },
] as const;

export type SpellComponentId = (typeof SPELL_COMPONENT_DEFINITIONS)[number]['id'];

/** Full row shape for a spell component (matches `SPELL_COMPONENT_DEFINITIONS` entries). */
export type SpellComponentDefinition = (typeof SPELL_COMPONENT_DEFINITIONS)[number];

export const SPELL_COMPONENT_IDS: readonly SpellComponentId[] =
  SPELL_COMPONENT_DEFINITIONS.map((r) => r.id);

const SPELL_COMPONENT_DEFINITION_BY_ID: ReadonlyMap<SpellComponentId, SpellComponentDefinition> =
  new Map(SPELL_COMPONENT_DEFINITIONS.map((r) => [r.id, r]));

/** Lookup by id; undefined if unknown. */
export function getSpellComponentById(
  componentId: SpellComponentId,
): SpellComponentDefinition | undefined {
  return SPELL_COMPONENT_DEFINITION_BY_ID.get(componentId);
}

/** Rules reference line for tooltips and help; undefined if unknown. */
export function getSpellComponentRulesText(componentId: SpellComponentId): string | undefined {
  return SPELL_COMPONENT_DEFINITION_BY_ID.get(componentId)?.rulesText;
}

/** Resolve rules text when `key` matches a `SpellComponentId`. */
export function getSpellComponentRulesTextForKey(key: string): string | undefined {
  if ((SPELL_COMPONENT_IDS as readonly string[]).includes(key)) {
    return getSpellComponentRulesText(key as SpellComponentId);
  }
  return undefined;
}

export { SPELL_COMPONENT_DEFINITION_BY_ID };

/**
 * Short rules reminders for UI tooltips. Wording follows SRD-style concepts (paraphrased).
 */

export const RULES_CONCEPT_DEFINITIONS = [
  {
    id: 'concentration',
    name: 'Concentration',
    rulesText:
      'Some spells require you to maintain concentration in order to keep their magic active. If you cast another spell that requires concentration, your concentration on the first effect ends. You can end concentration at any time (no action required). Taking damage can interrupt concentration: make a Constitution saving throw (DC 10 or half the damage taken, whichever is higher). Being incapacitated or dying also ends your concentration.',
  },
  {
    id: 'ritual',
    name: 'Ritual',
    rulesText:
      'Certain spells can be cast as rituals. A ritual version takes 10 minutes longer to cast than the spell’s normal casting time, unless the spell already has a longer casting time (such as 1 hour). Whether ritual casting expends a spell slot depends on your class’s ritual casting feature; you must still provide any material components and follow any concentration requirements.',
  },
  {
    id: 'difficult-terrain',
    name: 'Difficult terrain',
    rulesText:
      'Difficult terrain costs 1 extra foot of movement for every foot you move. If you have more than one speed (such as walking and climbing), switching between them can change how much movement you have left. Multiple overlapping areas of difficult terrain do not stack.',
  },
  {
    id: 'cover',
    name: 'Cover',
    rulesText:
      'A target behind cover has a bonus to AC and Dexterity saving throws. With half cover, the bonus is +2; with three-quarters cover, +5; with total cover, you cannot be targeted directly. A target might have cover from only one direction; use the most protective cover that applies.',
  },
  {
    id: 'invisibility',
    name: 'Invisibility',
    rulesText:
      'An invisible creature is impossible to see without special senses; it can try to hide while being observed. Attack rolls against the creature have disadvantage, and the creature’s attack rolls have advantage. The effect ends if the creature attacks, casts a spell, or similar (unless the effect says otherwise).',
  },
  {
    id: 'line-of-sight',
    name: 'Line of sight',
    rulesText:
      'You must have a clear path to a target to target it with many spells and effects. Total cover blocks line of sight. An opaque barrier, such as a closed door or a thick wall, blocks sight even if you know the target is there.',
  },
  {
    id: 'obscurement',
    name: 'Obscurement',
    rulesText:
      'An area might be lightly obscured (dim light, patchy fog, moderate foliage), imposing disadvantage on Wisdom (Perception) checks that rely on sight. Heavily obscured areas block vision entirely; a creature effectively suffers the blinded condition when trying to see there.',
  },
  {
    id: 'proficiency',
    name: 'Proficiency',
    rulesText:
      'If you are proficient with something, you add your proficiency bonus to ability checks, saving throws, or attack rolls that use that proficiency, as specified by your class, race, feats, or other features. The bonus increases at higher character levels.',
  },
  {
    id: 'advantage',
    name: 'Advantage',
    rulesText:
      'When you have advantage on a d20 roll, roll two d20s and use the higher roll. If multiple circumstances grant advantage, you still roll only one extra die. Advantage and disadvantage cancel each other out on the same roll, no matter how many of each apply.',
  },
  {
    id: 'disadvantage',
    name: 'Disadvantage',
    rulesText:
      'When you have disadvantage on a d20 roll, roll two d20s and use the lower roll. If multiple circumstances impose disadvantage, you still roll only one extra die. Advantage and disadvantage cancel each other out on the same roll, no matter how many of each apply.',
  },
  {
    id: 'passive-perception',
    name: 'Passive Perception',
    rulesText:
      'Passive Perception is a score used to notice hidden threats without actively rolling. It equals 10 + all modifiers that normally apply to a Wisdom (Perception) check. If you have advantage on Perception, add +5; if you have disadvantage, subtract −5.',
  },
] as const;

export type RulesConceptId = (typeof RULES_CONCEPT_DEFINITIONS)[number]['id'];

const RULES_CONCEPT_BY_ID = new Map<RulesConceptId, (typeof RULES_CONCEPT_DEFINITIONS)[number]>(
  RULES_CONCEPT_DEFINITIONS.map((d) => [d.id, d]),
);

export function getRulesConcept(id: RulesConceptId): (typeof RULES_CONCEPT_DEFINITIONS)[number] {
  const def = RULES_CONCEPT_BY_ID.get(id);
  if (!def) throw new Error(`Unknown rules concept: ${id}`);
  return def;
}

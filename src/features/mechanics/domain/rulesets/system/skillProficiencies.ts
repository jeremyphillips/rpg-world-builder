/**
 * System skill proficiency catalog — code-defined skill entries per system ruleset.
 *
 * These are the "factory defaults" for skill proficiencies (SRD_CC_v5_2_1).
 */
import type { SkillProficiency, SkillProficiencyFields } from '@/features/content/skillProficiencies/domain/types'
import type { SystemRulesetId } from '../types/ruleset.types'
import { DEFAULT_SYSTEM_RULESET_ID } from '../ids/systemIds'

// ---------------------------------------------------------------------------
// Raw data (no type imports to allow derivation of SkillProficiencyId without circular deps)
// ---------------------------------------------------------------------------

export const SKILL_PROFICIENCIES_RAW = [
  {
    id: 'athletics',
    name: 'Athletics',
    ability: 'str',
    suggestedClasses: ['barbarian', 'fighter', 'paladin'],
    examples: [
      'Climbing a sheer cliff or scaling a castle wall',
      'Swimming across a rushing river or escaping a whirlpool',
      'Grappling an opponent or breaking free from restraints',
      'Jumping across a chasm or leaping onto a moving cart',
    ],
    tags: ['physical', 'strength', 'climbing', 'swimming', 'grappling', 'athletic'],
    description: 'Difficult situations you face while climbing, jumping, or swimming.',
  },
  {
    id: 'acrobatics',
    name: 'Acrobatics',
    ability: 'dex',
    suggestedClasses: ['bard', 'fighter', 'monk', 'rogue'],
    examples: [
      'Walking a tightrope or balancing on a narrow ledge',
      'Performing acrobatic stunts or tumbles in combat',
      'Slipping through a narrow gap or escaping grapples',
      'Landing safely after a fall or diving through a window',
    ],
    tags: ['balance', 'dexterity', 'tumbling', 'agility', 'escape', 'acrobatic'],
    description: 'Staying on your feet in tricky situations, like walking across a tightrope or icy surface.',
  },
  {
    id: 'sleight-of-hand',
    name: 'Sleight of Hand',
    ability: 'dex',
    suggestedClasses: ['bard', 'rogue'],
    examples: [
      'Picking a pocket or palming a small object',
      'Planting evidence on someone or concealing an item',
      'Performing magic tricks or card tricks',
      'Disarming a trap or stealing a key from a guard',
    ],
    tags: ['dexterity', 'thievery', 'stealth', 'manual', 'trickery', 'pickpocket'],
    description: 'Manual trickery, such as planting something on someone else or concealing an object on your person.',
  },
  {
    id: 'stealth',
    name: 'Stealth',
    ability: 'dex',
    suggestedClasses: ['bard', 'monk', 'ranger', 'rogue'],
    examples: [
      'Sneaking past guards or hiding in shadows',
      'Moving silently through a dungeon or forest',
      'Ambushing enemies from concealment',
      'Following someone without being noticed',
    ],
    tags: ['dexterity', 'sneaking', 'hiding', 'ambush', 'infiltration', 'silent'],
    description: 'Escaping notice by moving silently and hiding from view.',
  },
  {
    id: 'arcana',
    name: 'Arcana',
    ability: 'int',
    suggestedClasses: ['bard', 'sorcerer', 'warlock', 'wizard'],
    examples: [
      'Identifying a spell being cast or a magic item',
      'Recalling lore about planes of existence or eldritch symbols',
      'Understanding magical traps or arcane inscriptions',
      "Recognizing a creature's magical nature or origin",
    ],
    tags: ['intelligence', 'magic', 'spells', 'lore', 'arcane', 'knowledge'],
    description: 'Recall lore about spells, magic items, eldritch symbols, and planes of existence.',
  },
  {
    id: 'history',
    name: 'History',
    ability: 'int',
    suggestedClasses: ['bard', 'cleric', 'fighter', 'monk', 'paladin', 'warlock', 'wizard'],
    examples: [
      'Recalling legends about a fallen kingdom or ancient war',
      "Identifying a noble house's heraldry or historical artifact",
      'Knowing the customs of a foreign culture or bygone era',
      'Remembering the outcome of a past political conflict',
    ],
    tags: ['intelligence', 'lore', 'civilization', 'legends', 'artifacts', 'culture'],
    description: 'Recall lore about historical events, legendary people, ancient kingdoms, and past disputes.',
  },
  {
    id: 'investigation',
    name: 'Investigation',
    ability: 'int',
    suggestedClasses: ['bard', 'rogue', 'ranger', 'warlock', 'wizard'],
    examples: [
      'Searching a room for hidden doors or compartments',
      'Deciphering coded messages or piecing together clues',
      'Examining a crime scene for evidence',
      'Identifying the weak point in a structure or mechanism',
    ],
    tags: ['intelligence', 'search', 'deduction', 'clues', 'puzzles', 'analysis'],
    description: 'Looking for clues and making deductions based on those clues.',
  },
  {
    id: 'nature',
    name: 'Nature',
    ability: 'int',
    suggestedClasses: ['barbarian', 'druid', 'ranger', 'warlock'],
    examples: [
      'Identifying plants, animals, or natural hazards',
      'Predicting weather or understanding terrain',
      'Recalling lore about fey, elementals, or beasts',
      'Finding edible plants or safe paths through wilderness',
    ],
    tags: ['intelligence', 'wilderness', 'plants', 'animals', 'weather', 'ecology'],
    description: 'Recall lore about terrain, plants and animals, the weather, and natural cycles.',
  },
  {
    id: 'religion',
    name: 'Religion',
    ability: 'int',
    suggestedClasses: ['bard', 'cleric', 'monk', 'paladin', 'sorcerer', 'warlock', 'wizard'],
    examples: [
      'Identifying religious symbols or holy rites',
      'Recalling lore about deities, cults, or undead',
      "Recognizing a cleric's faith or a temple's purpose",
      'Understanding the hierarchy of a religious order',
    ],
    tags: ['intelligence', 'deities', 'faith', 'undead', 'rites', 'holy'],
    description: 'Recall lore about deities, rites and prayers, religious hierarchies, and holy symbols.',
  },
  {
    id: 'animal-handling',
    name: 'Animal Handling',
    ability: 'wis',
    suggestedClasses: ['barbarian', 'bard', 'druid', 'ranger'],
    examples: [
      'Calming a spooked horse or domesticated animal',
      "Intuiting an animal's intentions or mood",
      'Controlling a mount in combat or during a chase',
      'Training an animal or directing a beast companion',
    ],
    tags: ['wisdom', 'animals', 'mounts', 'nature', 'empathy', 'control'],
    description: "Calming domesticated animals, intuiting an animal's intentions, or controlling a mount.",
  },
  {
    id: 'insight',
    name: 'Insight',
    ability: 'wis',
    suggestedClasses: ['bard', 'cleric', 'druid', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer'],
    examples: [
      'Determining if someone is lying or hiding something',
      "Sensing an NPC's true intentions or motives",
      'Reading the mood of a room or social situation',
      "Predicting an opponent's next move in negotiation",
    ],
    tags: ['wisdom', 'perception', 'empathy', 'deception', 'social', 'intuition'],
    description: 'Determine the true intentions of a creature, such as searching out a lie or predicting a move.',
  },
  {
    id: 'medicine',
    name: 'Medicine',
    ability: 'wis',
    suggestedClasses: ['cleric', 'druid', 'paladin'],
    examples: [
      'Stabilizing a dying companion with a DC 10 check',
      'Diagnosing an illness or identifying a poison',
      'Treating wounds or setting broken bones',
      'Recognizing the cause of death or disease',
    ],
    tags: ['wisdom', 'healing', 'diagnosis', 'stabilize', 'wounds', 'care'],
    description: 'Stabilizing a dying companion or diagnosing an illness.',
  },
  {
    id: 'perception',
    name: 'Perception',
    ability: 'wis',
    suggestedClasses: ['barbarian', 'druid', 'fighter', 'ranger', 'rogue'],
    examples: [
      'Spotting a hidden enemy or ambush',
      'Hearing a conversation through a door',
      'Noticing a hidden object or secret door',
      'Keeping watch during a rest or travel',
    ],
    tags: ['wisdom', 'awareness', 'senses', 'spot', 'listen', 'vigilance'],
    description: 'Lets you spot, hear, or otherwise detect the presence of something.',
  },
  {
    id: 'survival',
    name: 'Survival',
    ability: 'wis',
    suggestedClasses: ['barbarian', 'druid', 'ranger'],
    examples: [
      'Following tracks through wilderness or urban terrain',
      'Hunting wild game or foraging for food',
      'Guiding the party through harsh terrain or weather',
      'Predicting weather or finding shelter',
    ],
    tags: ['wisdom', 'wilderness', 'tracking', 'hunting', 'navigation', 'foraging'],
    description: 'Follow tracks, hunt wild game, guide your group through frozen wastelands, and predict the weather.',
  },
  {
    id: 'deception',
    name: 'Deception',
    ability: 'cha',
    suggestedClasses: ['bard', 'rogue', 'sorcerer'],
    examples: [
      'Creating a disguise or false identity',
      'Lying convincingly to guards or nobles',
      'Creating a diversion or misdirection',
      'Forging documents or passing counterfeit coin',
    ],
    tags: ['charisma', 'lying', 'disguise', 'bluff', 'trickery', 'social'],
    description: 'Hiding the truth, either verbally or through actions, to mislead others.',
  },
  {
    id: 'intimidation',
    name: 'Intimidation',
    ability: 'cha',
    suggestedClasses: ['bard', 'fighter', 'paladin', 'rogue', 'sorcerer', 'warlock'],
    examples: [
      'Coercing information from a captive',
      'Inspiring fear to clear a path through a crowd',
      'Interrogating a prisoner through threats',
      'Convincing someone you are dangerous',
    ],
    tags: ['charisma', 'fear', 'coercion', 'threats', 'dominance', 'interrogation'],
    description: 'Influencing others through overt threats, hostile actions, and physical violence.',
  },
  {
    id: 'performance',
    name: 'Performance',
    ability: 'cha',
    suggestedClasses: ['bard', 'rogue'],
    examples: [
      'Entertaining a crowd with music, dance, or acting',
      'Earning coin by busking or performing in a tavern',
      'Impersonating someone through acting',
      'Rallying troops with an inspiring speech or song',
    ],
    tags: ['charisma', 'entertainment', 'music', 'acting', 'artistry', 'showmanship'],
    description: 'Delighting an audience with music, dance, acting, storytelling, or some other entertainment.',
  },
  {
    id: 'persuasion',
    name: 'Persuasion',
    ability: 'cha',
    suggestedClasses: ['bard', 'cleric', 'paladin', 'ranger', 'sorcerer'],
    examples: [
      'Negotiating a better price or favorable terms',
      'Convincing a guard to look the other way',
      'Rallying allies or inspiring loyalty',
      'Smoothly navigating a formal social gathering',
    ],
    tags: ['charisma', 'negotiation', 'diplomacy', 'charm', 'influence', 'social'],
    description: 'Influencing others with tact, social graces, or good nature.',
  },
] as const

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

export function toSystemSkillProficiency(
  systemId: SystemRulesetId,
  raw: SkillProficiencyFields & { id: string; name: string },
): SkillProficiency {
  return {
    ...raw,
    source: 'system',
    systemId,
    patched: false,
  };
}

// ---------------------------------------------------------------------------
// 5e v1 system skill proficiencies (SRD_CC_v5_2_1)
// ---------------------------------------------------------------------------

const SYSTEM_SKILL_PROFICIENCIES_SRD_CC_V5_2_1: readonly SkillProficiency[] =
  SKILL_PROFICIENCIES_RAW.map((r) =>
    toSystemSkillProficiency(DEFAULT_SYSTEM_RULESET_ID, r as unknown as SkillProficiencyFields & { id: string; name: string }),
  );

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const SYSTEM_SKILL_PROFICIENCIES_BY_SYSTEM_ID: Record<SystemRulesetId, readonly SkillProficiency[]> = {
  [DEFAULT_SYSTEM_RULESET_ID]: SYSTEM_SKILL_PROFICIENCIES_SRD_CC_V5_2_1,
}

export function getSystemSkillProficiencies(systemId: SystemRulesetId): readonly SkillProficiency[] {
  return SYSTEM_SKILL_PROFICIENCIES_BY_SYSTEM_ID[systemId] ?? []
}

export function getSystemSkillProficiency(systemId: SystemRulesetId, id: string): SkillProficiency | undefined {
  return getSystemSkillProficiencies(systemId).find((s) => s.id === id)
}

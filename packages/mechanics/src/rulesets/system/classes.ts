/**
 * System class catalog — code-defined class entries per system ruleset.
 *
 * These are the "factory defaults" for classes (SRD_CC_v5_2_1).
 * Campaign-owned custom classes would be stored in the DB and merged at runtime.
 */
import type { CharacterClass } from '@/features/content/classes/domain/types';
import type { SystemRulesetId } from '../types/ruleset.types';
import { DEFAULT_SYSTEM_RULESET_ID } from '../ids/systemIds';

// ---------------------------------------------------------------------------
// 5e v1 system classes (SRD_CC_v5_2_1)
// ---------------------------------------------------------------------------

const CLASSES_RAW: readonly CharacterClass[] = [
  {
    id: 'fighter',
    name: 'Fighter',
    description: 'A class of brave and skilled warriors.',
    definitions: {
      id: 'fighter_subclasses',
      name: 'Fighter Subclasses',
      selectionLevel: 3,
      options: [{ id: 'champion', name: 'Champion' }],
    },
    generation: { primaryAbilities: ['str', 'dex'] },
    progression: {
      hitDie: 10,
      attackProgression: 'good',
      savingThrows: ['str', 'con'],
      spellcasting: 'none',
      extraAttackLevel: 5,
      asiLevels: [4, 6, 8, 12, 14, 16, 19],
      features: [
        { id: 'fighting-style', level: 1, name: 'Fighting Style' },
        { id: 'second-wind', level: 1, name: 'Second Wind' },
        { id: 'action-surge', level: 2, name: 'Action Surge' },
        { id: 'martial-archetype', level: 3, name: 'Martial Archetype' },
        { id: 'extra-attack', level: 5, name: 'Extra Attack' },
        { id: 'indomitable', level: 9, name: 'Indomitable' },
        { id: 'extra-attack-2', level: 11, name: 'Extra Attack (2)' },
        { id: 'extra-attack-3', level: 20, name: 'Extra Attack (3)' },
      ],
    },
    proficiencies: {
      skills: { type: 'choice', choose: 2, level: 1 },
      weapons: { type: 'fixed', level: 1, categories: ['simple', 'martial'] },
      armor: { type: 'fixed', level: 1, categories: ['allArmor', 'shields'] },
    },
    requirements: {
      allowedRaces: ['human'],
      allowedAlignments: 'any',
      multiclassing: {
        note: 'Requires Strength or Dexterity of 13+',
        anyOf: [
          { all: [{ ability: 'str', min: 13 }] },
          { all: [{ ability: 'dex', min: 13 }] },
        ],
      },
    },
  },
  {
    id: 'cleric',
    name: 'Cleric',
    description: 'A class of holy and compassionate healers.',
    definitions: {
      id: 'cleric_subclasses',
      name: 'Cleric Subclasses',
      selectionLevel: 3,
      options: [
        { 
          id: 'life_domain',
          name: 'Life Domain',
          features: [
            {
              id: 'life_domain.feature.life_domain_spells',
              kind: 'spellcasting',
              mode: 'always_prepared',
              name: 'Life Domain Spells',
              level: 3,
              spellcastingClassId: 'cleric',
              grants: [
                { level: 3, spellIds: ['aid', 'bless', 'cure-wounds', 'lesser-restoration'] },
                { level: 5, spellIds: ['mass-healing-word', 'revivify'] },
                { level: 7, spellIds: ['aura-of-life', 'death-ward'] },
                { level: 9, spellIds: ['greater-restoration', 'mass-cure-wounds'] },
              ],
            }
          ],
        }
      ],
    },
    generation: { primaryAbilities: ['wis'] },
    progression: {
      hitDie: 8,
      attackProgression: 'average',
      savingThrows: ['wis', 'cha'],
      spellcasting: 'full',
      spellProgression: {
        ability: 'wis',
        type: 'prepared',
        cantripsKnown: 'standard3',
      },
      asiLevels: [4, 8, 12, 16, 19],
      features: [
        { id: 'spellcasting', level: 1, name: 'Spellcasting' },
        { id: 'divine-domain', level: 1, name: 'Divine Domain' },
        { id: 'channel-divinity', level: 2, name: 'Channel Divinity' },
        { id: 'destroy-undead', level: 5, name: 'Destroy Undead' },
        { id: 'divine-intervention', level: 10, name: 'Divine Intervention' },
        { id: 'divine-intervention-improvement', level: 20, name: 'Divine Intervention Improvement' },
      ],
    },
    proficiencies: {
      skills: { type: 'choice', choose: 2, level: 1 },
      weapons: { type: 'fixed', level: 1, categories: ['simple'] },
      armor: { type: 'fixed', level: 1, categories: ['light', 'medium', 'shields'] },
    },
    requirements: { allowedRaces: 'all', allowedAlignments: 'any' },
  },
  {
    id: 'rogue',
    name: 'Rogue',
    description: 'A class of cunning and stealthy thieves.',
    definitions: {
      id: 'rogue_subclasses',
      name: 'Rogue Subclasses',
      selectionLevel: 3,
      options: [
        { id: 'thief', name: 'Thief' },
      ],
    },
    generation: { primaryAbilities: ['dex'] },
    progression: {
      hitDie: 8,
      attackProgression: 'good',
      savingThrows: ['dex', 'int'],
      spellcasting: 'none',
      asiLevels: [4, 6, 8, 12, 14, 16, 19],
    },
    proficiencies: {
      skills: { type: 'choice', choose: 4, level: 1 },
      weapons: { type: 'fixed', level: 1, categories: ['simple'] },
      armor: { type: 'fixed', level: 1, categories: ['light'] },
      tools: { type: 'fixed', level: 1, items: ['thieves-tools'] },
    },
    requirements: { allowedRaces: 'all', allowedAlignments: 'any' },
  },
  {
    id: 'paladin',
    name: 'Paladin',
    description: 'A class of righteous and noble protectors.',
    definitions: {
      id: 'paladin_subclasses',
      name: 'Paladin Subclasses',
      selectionLevel: 3,
      options: [
        {
          id: 'oath_of_devotion',
          name: 'Oath of Devotion',
          features: [
            {
              id: 'oath_of_devotion.feature.sacred_weapon',
              name: 'Sacred Weapon',
              level: 3,
              kind: 'activation',
              activation: 'action',
              cost: { resource: 'channel_divinity', amount: 1 },
              effects: [
                {
                  kind: 'modifier',
                  target: 'attack_roll',
                  mode: 'add',
                  value: { ability: 'cha' },
                  duration: { kind: 'fixed', value: 1, unit: 'minute' },
                },
              ],
            },
            {
              id: 'oath_of_devotion.feature.turn_the_unholy',
              name: 'Turn the Unholy',
              kind: 'aura',
              level: 7,
              range: 10,
              affects: 'allies',
              effects: [{ kind: 'grant', grantType: 'condition-immunity', value: 'charmed' }],
            },
          ],
        },
      ],
    },
    generation: { primaryAbilities: ['str', 'cha'] },
    progression: {
      hitDie: 10,
      attackProgression: 'good',
      savingThrows: ['wis', 'cha'],
      spellcasting: 'half',
      spellProgression: {
        ability: 'cha',
        type: 'prepared',
      },
      extraAttackLevel: 5,
      asiLevels: [4, 6, 8, 12, 14, 16, 19],
    },
    proficiencies: {
      skills: { type: 'choice', choose: 2, level: 1 },
      weapons: { type: 'fixed', level: 1, categories: ['simple', 'martial'] },
      armor: { type: 'fixed', level: 1, categories: ['allArmor', 'shields'] },
    },
    requirements: { allowedRaces: 'all', allowedAlignments: 'any' },
  },
  {
    id: 'bard',
    name: 'Bard',
    description: 'A class of talented and charismatic storytellers.',
    definitions: {
      id: 'bard_subclasses',
      name: 'Bard Subclasses',
      selectionLevel: 3,
      options: [
        { id: 'college_of_lore', name: 'College of Lore' },
      ],
    },
    generation: { primaryAbilities: ['cha'] },
    progression: {
      hitDie: 8,
      attackProgression: 'good',
      savingThrows: ['dex', 'cha'],
      spellcasting: 'full',
      spellProgression: {
        ability: 'cha',
        type: 'prepared',
        cantripsKnown: 'standard2',
      },
      asiLevels: [4, 6, 8, 12, 14, 16, 19],
    },
    proficiencies: {
      skills: { type: 'choice', choose: 3, level: 1 },
      weapons: { type: 'fixed', level: 1, categories: ['simple'], items: [] },
      armor: { type: 'fixed', level: 1, categories: ['light'], items: [] },
    },
    requirements: { allowedRaces: 'all', allowedAlignments: 'any' },
  },
  {
    id: 'ranger',
    name: 'Ranger',
    description: 'A class of skilled and knowledgeable trackers.',
    definitions: {
      id: 'ranger_subclasses',
      name: 'Ranger Subclasses',
      selectionLevel: 3,
      options: [
        { id: 'hunter', name: 'Hunter' },
      ],
    },
    generation: { primaryAbilities: ['dex', 'wis'] },
    progression: {
      hitDie: 10,
      attackProgression: 'good',
      savingThrows: ['str', 'dex'],
      spellcasting: 'half',
      spellProgression: {
        ability: 'wis',
        type: 'prepared',
      },
      extraAttackLevel: 5,
      features: [
        { id: 'prime_hunter', name: 'Favored Enemy', level: 1 },
        { id: 'weapon_mastery', name: 'Weapon Mastery', level: 1 },
        { id: 'deft_explorer', name: 'Deft Explorer', level: 2 },
        { id: 'roving', name: 'Roving', level: 6, description: "Your Speed increases by 10 feet while you aren’t wearing Heavy armor. You also have a Climb Speed and a Swim Speed equal to your Speed."},
      ],
      asiLevels: [4, 6, 8, 12, 14, 16, 19],
    },
    proficiencies: {
      skills: { type: 'choice', choose: 3, level: 1 },
      weapons: { type: 'fixed', level: 1, categories: ['simple', 'martial'] },
      armor: { type: 'fixed', level: 1, categories: ['allArmor', 'shields'] },
    },
    requirements: { allowedRaces: 'all', allowedAlignments: 'any' },
  },
  {
    id: 'monk',
    name: 'Monk',
    description: 'A class of disciplined and focused martial artists.',
    definitions: {
      id: 'monk_subclasses',
      name: 'Monk Subclasses',
      selectionLevel: 3,
      options: [
        { id: 'way_of_the_open_hand', name: 'Way of the Open Hand' },
      ],
    },
    generation: { primaryAbilities: ['dex', 'wis'] },
    progression: {
      hitDie: 8,
      attackProgression: 'good',
      savingThrows: ['str', 'dex'],
      spellcasting: 'none',
      extraAttackLevel: 5,
      asiLevels: [4, 6, 8, 12, 14, 16, 19],
    },
    proficiencies: {
      skills: { type: 'choice', choose: 2, level: 1 },
      weapons: { type: 'fixed', level: 1, categories: ['simple'] },
      armor: { type: 'fixed', level: 1, categories: ['none'] },
    },
    requirements: { allowedRaces: 'all', allowedAlignments: 'any' },
  },
  {
    id: 'druid',
    name: 'Druid',
    description: 'A class of nature-loving and wise protectors.',
    definitions: {
      id: 'druid_subclasses',
      name: 'Druid Subclasses',
      selectionLevel: 3,
      options: [
        { id: 'circle_of_the_land', name: 'Circle of the Land' },
      ],
    },
    generation: { primaryAbilities: ['wis'] },
    progression: {
      hitDie: 8,
      attackProgression: 'good',
      savingThrows: ['int', 'wis'],
      spellcasting: 'full',
      spellProgression: {
        ability: 'wis',
        type: 'known',
        cantripsKnown: 'standard2',
      },
      asiLevels: [4, 6, 8, 12, 14, 16, 19],
    },
    proficiencies: {
      skills: { type: 'choice', choose: 2, level: 1 },
      weapons: { type: 'fixed', level: 1, categories: ['simple', 'martial'] },
      armor: { type: 'fixed', level: 1, categories: ['light', 'medium', 'shields'] },
    },
    requirements: { allowedRaces: 'all', allowedAlignments: 'any' },
  },
  {
    id: 'warlock',
    name: 'Warlock',
    description: 'A class of powerful and mysterious spellcasters.',
    definitions: {
      id: 'warlock_subclasses',
      name: 'Warlock Subclasses',
      selectionLevel: 3,
      options: [
        { id: 'fiend_patron', name: 'Fiend Patron' },
      ],
    },
    generation: { primaryAbilities: ['cha'] },
    progression: {
      hitDie: 8,
      attackProgression: 'average',
      savingThrows: ['wis', 'cha'],
      spellcasting: 'pact',
      spellProgression: {
        ability: 'cha',
        type: 'known',
        cantripsKnown: 'standard2',
        // spellsKnown: [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15],
        mysticArcanum: [
          { spellLevel: 6, grantedAtClassLevel: 11 },
          { spellLevel: 7, grantedAtClassLevel: 13 },
          { spellLevel: 8, grantedAtClassLevel: 15 },
          { spellLevel: 9, grantedAtClassLevel: 17 },
        ],
      },
      asiLevels: [4, 8, 12, 16, 19],
      features: [
        { id: 'otherworldly-patron', level: 1, name: 'Otherworldly Patron' },
        { id: 'pact-magic', level: 1, name: 'Pact Magic' },
        { id: 'eldritch-invocations', level: 2, name: 'Eldritch Invocations' },
        { id: 'pact-boon', level: 3, name: 'Pact Boon' },
        { id: 'mystic-arcanum', level: 11, name: 'Mystic Arcanum' },
        { id: 'eldritch-master', level: 20, name: 'Eldritch Master' },
      ],
    },
    proficiencies: {
      skills: { type: 'choice', choose: 2, level: 1 },
      weapons: { type: 'fixed', level: 1, categories: ['simple'] },
      armor: { type: 'fixed', level: 1, categories: ['light'] },
    },
    requirements: { allowedRaces: 'all', allowedAlignments: 'any' },
  },
  {
    id: 'sorcerer',
    name: 'Sorcerer',
    description: 'A class of powerful and mysterious spellcasters.',
    definitions: {
      id: 'sorcerer_subclasses',
      name: 'Sorcerer Subclasses',
      selectionLevel: 3,
      options: [
        {
          id: 'draconic_bloodline',
          name: 'Draconic Bloodline',
          features: [
            {
              name: 'Draconic Ancestry',
              id: 'draconic_bloodline.draconic_ancestry',
              kind: 'formula',
              target: 'armor_class',
              level: 1,
              condition: {
                kind: 'state',
                target: 'self',
                property: 'equipment.armorEquipped',
                equals: null,
              },
              formula: { base: 13, ability: 'dex' },
            },
            {
              name: 'Draconic Resilience',
              id: 'draconic_bloodline.draconic_resilience',
              kind: 'modifier',
              level: 1,
              target: 'hit_points_max',
              mode: 'add',
              value: { perLevel: 1 },
            },
          ],
        },
      ],
    },
    generation: { primaryAbilities: ['cha'] },
    progression: {
      hitDie: 6,
      attackProgression: 'poor',
      savingThrows: ['con', 'cha'],
      spellcasting: 'full',
      spellProgression: {
        ability: 'cha',
        type: 'known',
        cantripsKnown: 'standard4',
        // spellsKnown: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 13, 13, 14, 14, 15, 15, 15, 15],
      },
      asiLevels: [4, 8, 12, 16, 19],
      features: [
        { id: 'spellcasting', level: 1, name: 'Spellcasting' },
        { id: 'sorcerous-origin', level: 1, name: 'Sorcerous Origin' },
        { id: 'font-of-magic', level: 2, name: 'Font of Magic' },
        { id: 'metamagic', level: 3, name: 'Metamagic' },
        { id: 'sorcerous-restoration', level: 20, name: 'Sorcerous Restoration' },
      ],
    },
    proficiencies: {
      skills: { type: 'choice', choose: 2, level: 1 },
      weapons: {
        type: 'fixed',
        level: 1,
        items: ['dagger', 'dart', 'sling', 'quarterstaff', 'light-crossbow'],
      },
      armor: { type: 'fixed', level: 1, categories: [] },
    },
    requirements: { allowedRaces: 'all', allowedAlignments: 'any' },
  },
  {
    id: 'barbarian',
    name: 'Barbarian',
    description: 'A class of powerful and mysterious spellcasters.',
    definitions: {
      id: 'barbarian_subclasses',
      name: 'Barbarian Subclasses',
      selectionLevel: 3,
      options: [
        { id: 'berserker', name: 'Path of the Berserker', source: 'PHB' },
      ],
    },
    generation: { primaryAbilities: ['str', 'con'] },
    progression: {
      hitDie: 12,
      attackProgression: 'good',
      savingThrows: ['str', 'con'],
      spellcasting: 'none',
      extraAttackLevel: 5,
      asiLevels: [4, 6, 8, 12, 14, 16, 19],
      features: [
        {
          id: 'barbarian.feature.unarmored_defense',
          name: 'Unarmored Defense',
          level: 1,
          effects: [
            {
              kind: 'formula',
              target: 'armor_class',
              formula: { base: 10, abilities: ['dex', 'con'] },
              condition: {
                kind: 'state',
                target: 'self',
                property: 'equipment.armorEquipped',
                equals: null,
              },
            },
          ],
        },
        { id: 'barbarian.feature.rage', level: 1, name: 'Rage' },
        { id: 'barbarian.feature.reckless_attack', level: 2, name: 'Reckless Attack' },
        { id: 'barbarian.feature.danger_sense', level: 2, name: 'Danger Sense' },
        { id: 'barbarian.feature.primal_path', level: 3, name: 'Primal Path' },
        { id: 'barbarian.feature.extra_attack', level: 5, name: 'Extra Attack' },
        { id: 'barbarian.feature.fast_movement', level: 5, name: 'Fast Movement' },
        { id: 'barbarian.feature.feral_instinct', level: 7, name: 'Feral Instinct' },
        { id: 'barbarian.feature.brutal_critical', level: 9, name: 'Brutal Critical' },
        { id: 'barbarian.feature.relentless_rage', level: 11, name: 'Relentless Rage' },
        { id: 'barbarian.feature.persistent_rage', level: 15, name: 'Persistent Rage' },
        { id: 'barbarian.feature.indomitable_might', level: 18, name: 'Indomitable Might' },
        { id: 'barbarian.feature.primal_champion', level: 20, name: 'Primal Champion' },
      ],
    },
    proficiencies: {
      skills: { type: 'choice', choose: 2, level: 1 },
      weapons: { type: 'fixed', level: 1, categories: ['simple', 'martial'] },
      armor: { type: 'fixed', level: 1, categories: ['light', 'medium', 'shields'] },
    },
    requirements: { allowedRaces: 'all', allowedAlignments: 'any' },
  },
  {
    id: 'wizard',
    name: 'Wizard',
    description: 'A class of wise and powerful spellcasters.',
    definitions: {
      id: 'wizard_subclasses',
      name: 'Wizard Subclasses',
      selectionLevel: 3,
      options: [
        { id: 'evoker', name: 'Evoker' },
      ],
    },
    generation: { primaryAbilities: ['int'] },
    progression: {
      hitDie: 6,
      attackProgression: 'poor',
      savingThrows: ['int', 'wis'],
      spellcasting: 'full',
      spellProgression: {
        ability: 'int',
        type: 'prepared',
        cantripsKnown: 'standard3',
      },
      asiLevels: [4, 8, 12, 16, 19],
      features: [
        { id: 'wizard.feature.spellcasting', level: 1, name: 'Spellcasting' },
        { id: 'wizard.feature.arcane_recovery', level: 1, name: 'Arcane Recovery' },
        { id: 'wizard.feature.arcane_tradition', level: 2, name: 'Arcane Tradition' },
        { id: 'wizard.feature.spell_mastery', level: 18, name: 'Spell Mastery' },
        { id: 'wizard.feature.signature_spells', level: 20, name: 'Signature Spells' },
      ],
    },
    proficiencies: {
      skills: { type: 'choice', choose: 2, level: 1 },
      weapons: {
        type: 'fixed',
        level: 1,
        items: ['dagger', 'dart', 'sling', 'quarterstaff', 'light-crossbow'],
      },
      armor: { type: 'fixed', level: 1, categories: [] },
    },
    requirements: {
      allowedRaces: 'all',
      allowedAlignments: 'any',
      multiclassing: {
        note: 'Requires 13 Intelligence',
        anyOf: [{ all: [{ ability: 'int', min: 13 }] }],
      },
    },
  },
];

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const SYSTEM_CLASSES_BY_SYSTEM_ID: Record<SystemRulesetId, readonly CharacterClass[]> = {
  [DEFAULT_SYSTEM_RULESET_ID]: CLASSES_RAW,
};

export function getSystemClasses(systemId: SystemRulesetId): readonly CharacterClass[] {
  return SYSTEM_CLASSES_BY_SYSTEM_ID[systemId] ?? [];
}

export function getSystemClass(systemId: SystemRulesetId, classId: string): CharacterClass | undefined {
  return getSystemClasses(systemId).find((c) => c.id === classId);
}

/** Resolve class id to display name. Mirrors abilityIdToName pattern. */
export const classIdToName = (systemId: SystemRulesetId, id: string): string =>
  getSystemClass(systemId, id)?.name ?? id;

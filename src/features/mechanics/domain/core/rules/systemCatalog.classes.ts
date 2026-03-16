/**
 * System class catalog — code-defined class entries per system ruleset.
 *
 * These are the "factory defaults" for classes (SRD_CC_v5_2_1).
 * Campaign-owned custom classes would be stored in the DB and merged at runtime.
 */
import type { CharacterClass } from '@/features/content/classes/domain/types';
import type { SystemRulesetId } from './ruleset.types';
import { DEFAULT_SYSTEM_RULESET_ID } from './systemIds';
import { FULL_CASTER_SLOTS_5E, WARLOCK_PACT_SLOTS_5E } from '@/data/ruleSets/spellSlotTables';

// ---------------------------------------------------------------------------
// 5e v1 system classes (SRD_CC_v5_2_1)
// ---------------------------------------------------------------------------

const CLASSES_RAW: readonly CharacterClass[] = [
  {
    id: 'fighter',
    name: 'Fighter',
    description: 'A class of brave and skilled warriors.',
    definitions: {
      id: 'fighter.martial_archetype',
      name: 'Martial Archetype',
      selectionLevel: 3,
      options: [
        {
          id: 'fighter.martial_archetype.battle_master',
          name: 'Battle Master',
          source: 'PHB',
          features: [
            {
              name: 'Combat Superiority',
              id: 'fighter.martial_archetype.battle_master.combat_superiority',
              level: 3,
              features: [
                {
                  kind: 'resource',
                  resource: {
                    id: 'superiority_dice',
                    max: 4,
                    dice: 'd8',
                    recharge: 'short-rest',
                  },
                },
                {
                  id: 'fighter.battle_master.on_weapon_hit',
                  kind: 'trigger',
                  trigger: 'weapon-hit',
                  cost: { resource: 'superiority_dice', amount: 1 },
                  effects: [
                    {
                      kind: 'modifier',
                      target: 'damage',
                      mode: 'add',
                      value: { dice: 'superiority_dice' },
                    },
                    {
                      kind: 'save',
                      save: { ability: 'strength' },
                      onFail: [
                        {
                          kind: 'condition',
                          conditionId: 'prone',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        { id: 'fighter.battle_master.champion', name: 'Champion', source: 'PHB' },
        { id: 'fighter.battle_master.eldritch_knight', name: 'Eldritch Knight', source: 'PHB' },
      ],
    },
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
    generation: { primaryAbilities: ['str', 'con'] },
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
      id: 'divine_domain',
      name: 'Divine Domain',
      selectionLevel: 1,
      options: [
        { id: 'cleric.divine_domain.knowledge', name: 'Knowledge Domain', source: 'PHB' },
        { id: 'cleric.divine_domain.life', name: 'Life Domain', source: 'PHB' },
        { id: 'cleric.divine_domain.light', name: 'Light Domain', source: 'PHB' },
        { id: 'cleric.divine_domain.nature', name: 'Nature Domain', source: 'PHB' },
        { id: 'cleric.divine_domain.tempest', name: 'Tempest Domain', source: 'PHB' },
        { id: 'cleric.divine_domain.trickery', name: 'Trickery Domain', source: 'PHB' },
        { id: 'cleric.divine_domain.war', name: 'War Domain', source: 'PHB' },
      ],
    },
    generation: { primaryAbilities: ['wis', 'con'] },
    progression: {
      hitDie: 8,
      attackProgression: 'average',
      savingThrows: ['wis', 'cha'],
      spellcasting: 'full',
      spellProgression: {
        type: 'prepared',
        preparedFormula: 'wis+level',
        cantripsKnown: [3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
        spellSlots: FULL_CASTER_SLOTS_5E,
        maxSpellLevel: 9,
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
      id: 'rogue_specialization',
      name: 'Rogue Specialization',
      selectionLevel: 3,
      options: [
        { id: 'rogue.rogue_specialization.arcane_trickster', name: 'Arcane Trickster', source: 'PHB' },
        { id: 'rogue.rogue_specialization.assassin', name: 'Assassin', source: 'PHB' },
        { id: 'rogue.rogue_specialization.soulknife', name: 'Soulknife', source: 'TCOE' },
        { id: 'rogue.rogue_specialization.thief', name: 'Thief', source: 'PHB' },
      ],
    },
    generation: { primaryAbilities: ['dex', 'int'] },
    progression: {
      hitDie: 8,
      attackProgression: 'good',
      savingThrows: ['dex', 'int'],
      spellcasting: 'none',
      extraAttackLevel: 3,
      asiLevels: [4, 6, 8, 12, 14, 16, 19],
    },
    proficiencies: {
      skills: { type: 'choice', choose: 4, level: 1 },
      weapons: { type: 'fixed', level: 1, categories: ['simple'] },
      armor: { type: 'fixed', level: 1, categories: ['light'] },
    },
    requirements: { allowedRaces: 'all', allowedAlignments: 'any' },
  },
  {
    id: 'paladin',
    name: 'Paladin',
    description: 'A class of righteous and noble protectors.',
    definitions: {
      id: 'paladin.subclass.sacred_oath',
      name: 'Sacred Oath',
      selectionLevel: 3,
      options: [
        { id: 'paladin.subclass.sacred_oath.ancients', name: 'Oath of the Ancients', source: 'PHB' },
        {
          id: 'paladin.subclass.sacred_oath.oath_of_devotion',
          name: 'Oath of Devotion',
          source: 'PHB',
          features: [
            {
              id: 'paladin.subclass.sacred_oath.oath_of_devotion.sacred_weapon',
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
                  value: { ability: 'charisma' },
                  duration: { kind: 'fixed', value: 1, unit: 'minute' },
                },
              ],
            },
            {
              name: 'Turn the Unholy',
              kind: 'aura',
              level: 7,
              range: 10,
              affects: 'allies',
              effects: [{ kind: 'grant', grantType: 'condition-immunity', value: 'charmed' }],
            },
          ],
        },
        { id: 'paladin.subclass.sacred_oath.oath_of_vengeance', name: 'Oath of Vengeance', source: 'PHB' },
      ],
    },
    generation: { primaryAbilities: ['cha', 'con'] },
    progression: {
      hitDie: 8,
      attackProgression: 'good',
      savingThrows: ['cha', 'con'],
      spellcasting: 'none',
      extraAttackLevel: 3,
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
      id: 'bardic_college',
      name: 'Bardic College',
      selectionLevel: 3,
      options: [
        { id: 'bard.bardic_college.college_of_lore', name: 'College of Lore', source: 'PHB' },
        { id: 'bard.bardic_college.college_of_valor', name: 'College of Valor', source: 'PHB' },
      ],
    },
    generation: { primaryAbilities: ['cha', 'dex'] },
    progression: {
      hitDie: 8,
      attackProgression: 'good',
      savingThrows: ['cha', 'dex'],
      spellcasting: 'none',
      extraAttackLevel: 3,
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
      id: 'ranger_path',
      name: 'Ranger Path',
      selectionLevel: 3,
      options: [
        { id: 'ranger.ranger_path.beast_master', name: 'Beast Master', source: 'PHB' },
        { id: 'ranger.ranger_path.hunter', name: 'Hunter', source: 'PHB' },
      ],
    },
    generation: { primaryAbilities: ['str', 'dex'] },
    progression: {
      hitDie: 8,
      attackProgression: 'good',
      savingThrows: ['str', 'dex'],
      spellcasting: 'none',
      extraAttackLevel: 3,
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
      id: 'monastic_tradition',
      name: 'Monastic Tradition',
      selectionLevel: 3,
      options: [
        { id: 'monk.monastic_tradition.way_of_the_four_elements', name: 'Way of the Four Elements', source: 'PHB' },
        { id: 'monk.monastic_tradition.way_of_shadow', name: 'Way of Shadow', source: 'PHB' },
        { id: 'monk.monastic_tradition.way_of_the_open_hand', name: 'Way of the Open Hand', source: 'PHB' },
      ],
    },
    generation: { primaryAbilities: ['dex', 'con'] },
    progression: {
      hitDie: 8,
      attackProgression: 'good',
      savingThrows: ['dex', 'con'],
      spellcasting: 'none',
      extraAttackLevel: 3,
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
      id: 'druid_circle',
      name: 'Druid Circle',
      selectionLevel: 2,
      options: [
        { id: 'druid.druid_circle.circle_of_the_land', name: 'Circle of the Land', source: 'PHB' },
        { id: 'druid.druid_circle.circle_of_the_moon', name: 'Circle of the Moon', source: 'PHB' },
      ],
    },
    generation: { primaryAbilities: ['wis', 'con'] },
    progression: {
      hitDie: 8,
      attackProgression: 'good',
      savingThrows: ['wis', 'con'],
      spellcasting: 'none',
      extraAttackLevel: 3,
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
      id: 'warlock_patron',
      name: 'Warlock Patron',
      selectionLevel: 1,
      options: [
        { id: 'warlock.warlock_patron.archfey', name: 'The Archfey', source: 'PHB' },
        { id: 'warlock.warlock_patron.fiend', name: 'The Fiend', source: 'PHB' },
        { id: 'warlock.warlock_patron.great_old_one', name: 'The Great Old One', source: 'PHB' },
      ],
    },
    generation: { primaryAbilities: ['cha', 'con'] },
    progression: {
      hitDie: 8,
      attackProgression: 'average',
      savingThrows: ['wis', 'cha'],
      spellcasting: 'pact',
      spellProgression: {
        type: 'known',
        cantripsKnown: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
        spellsKnown: [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15],
        spellSlots: WARLOCK_PACT_SLOTS_5E,
        maxSpellLevel: 5,
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
      id: 'sorcerer_origin',
      name: 'Sorcerer Origin',
      selectionLevel: 1,
      options: [
        {
          id: 'sorcerer.sorcerer_origin.draconic_bloodline',
          name: 'Draconic Bloodline',
          source: 'PHB',
          features: [
            {
              name: 'Draconic Ancestry',
              id: 'sorcerer.sorcerer_origin.draconic_bloodline.draconic_ancestry',
              kind: 'formula',
              target: 'armor_class',
              level: 1,
              condition: {
                kind: 'state',
                target: 'self',
                property: 'equipment.armorEquipped',
                equals: null,
              },
              formula: { base: 13, ability: 'dexterity' },
            },
            {
              name: 'Draconic Resilience',
              id: 'sorcerer.sorcerer_origin.draconic_bloodline.draconic_resilience',
              kind: 'modifier',
              level: 1,
              target: 'hit_points_max',
              mode: 'add',
              value: { perLevel: 1 },
            },
          ],
        },
        { id: 'sorcerer.sorcerer_origin.draconic_bloodline.wild_magic', name: 'Wild Magic', source: 'PHB' },
      ],
    },
    generation: { primaryAbilities: ['cha', 'con'] },
    progression: {
      hitDie: 6,
      attackProgression: 'poor',
      savingThrows: ['con', 'cha'],
      spellcasting: 'full',
      spellProgression: {
        type: 'known',
        cantripsKnown: [4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
        spellsKnown: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 13, 13, 14, 14, 15, 15, 15, 15],
        spellSlots: FULL_CASTER_SLOTS_5E,
        maxSpellLevel: 9,
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
      id: 'barbarian_path',
      name: 'Barbarian Path',
      selectionLevel: 3,
      options: [
        { id: 'barbarian.barbarian_path.totem_warrior', name: 'Path of the Totem Warrior', source: 'PHB' },
        { id: 'barbarian.barbarian_path.berserker', name: 'Path of the Berserker', source: 'PHB' },
      ],
    },
    generation: { primaryAbilities: ['str', 'con'] },
    progression: {
      hitDie: 8,
      attackProgression: 'good',
      savingThrows: ['con', 'cha'],
      spellcasting: 'none',
      extraAttackLevel: 3,
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
              formula: { base: 10, abilities: ['dexterity', 'constitution'] },
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
      id: 'wizard.subclass.arcane_tradition',
      name: 'Arcane Tradition',
      selectionLevel: 2,
      options: [
        { id: 'wizard.subclass.arcane_tradition.school_of_abjuration', name: 'School of Abjuration', source: 'PHB' },
        { id: 'wizard.subclass.arcane_tradition.school_of_conjuration', name: 'School of Conjuration', source: 'PHB' },
        { id: 'wizard.subclass.arcane_tradition.school_of_divination', name: 'School of Divination', source: 'PHB' },
        { id: 'wizard.subclass.arcane_tradition.school_of_enchantment', name: 'School of Enchantment', source: 'PHB' },
        { id: 'wizard.subclass.arcane_tradition.school_of_evocation', name: 'School of Evocation', source: 'PHB' },
        { id: 'wizard.subclass.arcane_tradition.school_of_illusion', name: 'School of Illusion', source: 'PHB' },
        { id: 'wizard.subclass.arcane_tradition.school_of_necromancy', name: 'School of Necromancy', source: 'PHB' },
        { id: 'wizard.subclass.arcane_tradition.school_of_transmutation', name: 'School of Transmutation', source: 'PHB' },
      ],
    },
    generation: { primaryAbilities: ['con', 'int'] },
    progression: {
      hitDie: 6,
      attackProgression: 'poor',
      savingThrows: ['int', 'wis'],
      spellcasting: 'full',
      spellProgression: {
        type: 'prepared',
        preparedFormula: 'int+level',
        cantripsKnown: [3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
        spellSlots: FULL_CASTER_SLOTS_5E,
        maxSpellLevel: 9,
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

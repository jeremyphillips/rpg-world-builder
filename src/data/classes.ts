import type { CharacterClass } from './classes.types'

import {
  FIVE_E_WISDOM_SKILLS,
  FIVE_E_STRENGTH_SKILLS,
  FIVE_E_CHARISMA_SKILLS,
  FIVE_E_DEXTERITY_SKILLS,
  FIVE_E_INTELLIGENCE_SKILLS,
} from './proficiencies'

import { FULL_CASTER_SLOTS_5E, WARLOCK_PACT_SLOTS_5E } from './ruleSets/spellSlotTables'

export const classes: readonly CharacterClass[] = [
  { 
    id: 'fighter',
    name: 'Fighter',
    description: 'A class of brave and skilled warriors.',
    definitions: {
      name: 'Martial Archetype',
      selectionLevel: 3,
      options: [
        { id: 'arcane-archer', name: 'Arcane Archer', source: 'XGE' },
        { id: 'banneret', name: 'Banneret (Purple Dragon Knight)', source: 'SCAG' },
        {
          id: 'battle-master',
          name: 'Battle Master',
          source: 'PHB',
          features: [
            {
              id: 'battleMaster',
              name: 'Battle Master',
              features: [
                {
                  kind: 'resource',
                  resource: {
                    id: 'superiority_dice',
                    max: 4,
                    dice: 'd8',
                    recharge: 'short_rest'
                  }
                },
                {
                  kind: 'trigger',
                  trigger: 'on_weapon_hit',
                  cost: { resource: 'superiority_dice', amount: 1 },
                  effects: [
                    {
                      kind: 'modifier',
                      target: 'damage',
                      mode: 'add',
                      value: { dice: 'superiority_dice' }
                    },
                    {
                      kind: 'save',
                      ability: 'strength',
                      onFail: { applyCondition: 'prone' }
                    }
                  ]
                }  
              ]
            }
          ]
        },
        { id: 'cavalier', name: 'Cavalier', source: 'XGE' },
        { id: 'champion', name: 'Champion', source: 'PHB' },
        { id: 'echo-knight', name: 'Echo Knight', source: 'EGW' },
        { id: 'eldritch-knight', name: 'Eldritch Knight', source: 'PHB' },
        { id: 'psi-warrior', name: 'Psi Warrior', source: 'TCOE' },
        { id: 'rune-knight', name: 'Rune Knight', source: 'TCOE' },
        { id: 'samurai', name: 'Samurai', source: 'XGE' }
      ]
    },
    progression: {
      hitDie: 10,
      attackProgression: 'good',
      primaryAbilities: ['str', 'con'],
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
      skills: {
        type: 'choice',
        choose: 2,
        level: 1,
        from: [
          ...Object.keys(FIVE_E_STRENGTH_SKILLS),
          'acrobatics', 
          'history', 
          'insight', 
          'intimidation', 
          'perception', 
          'survival'
        ]
      },
      weapons: {
        type: 'fixed',
        level: 1,
        categories: [ 'simple', 'martial' ],
      },
      armor: {
        type: 'fixed',
        level: 1,
        categories: [ 'allArmor', 'shields' ],
      },
    },
    generation: {
      abilityPriority: ['strength', 'constitution']
    },
    requirements: {
      allowedRaces: ['human'],
      allowedAlignments: 'any',
      multiclassing: {
        note: 'Requires Strength or Dexterity of 13+',
        anyOf: [
          {
            all: [{ ability: 'strength', min: 13 }],
          },
          {
            all: [{ ability: 'dexterity', min: 13 }],
          },
        ],
      },
    } 
  },
  { 
    id: 'cleric', 
    name: 'Cleric', 
    description: 'A class of holy and compassionate healers.',
    definitions: {
      name: 'Divine Domain',
      selectionLevel: 1,
      options: [
        { id: 'arcana', name: 'Arcana Domain', source: 'SCAG' },
        { id: 'death', name: 'Death Domain', source: 'DMG' },
        { id: 'forge', name: 'Forge Domain', source: 'XGE' },
        { id: 'grave', name: 'Grave Domain', source: 'XGE' },
        { id: 'knowledge', name: 'Knowledge Domain', source: 'PHB' },
        { id: 'life', name: 'Life Domain', source: 'PHB' },
        { id: 'light', name: 'Light Domain', source: 'PHB' },
        { id: 'nature', name: 'Nature Domain', source: 'PHB' },
        { id: 'order', name: 'Order Domain', source: 'TCOE' },
        { id: 'peace', name: 'Peace Domain', source: 'TCOE' },
        { id: 'tempest', name: 'Tempest Domain', source: 'PHB' },
        { id: 'trickery', name: 'Trickery Domain', source: 'PHB' },
        { id: 'twilight', name: 'Twilight Domain', source: 'TCOE' },
        { id: 'war', name: 'War Domain', source: 'PHB' }
      ]
    },
    generation: {
      abilityPriority: ['wisdom', 'constitution']
    },
    progression: {
      hitDie: 8,
      attackProgression: 'average',
      primaryAbilities: ['wis', 'str'],
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
      skills: {
        type: 'choice',
        choose: 2,
        level: 1,
        from: [
          ...Object.keys(FIVE_E_WISDOM_SKILLS),
          'history', 'insight', 'medicine', 'religion'
        ]
      },
      weapons: {
        type: 'fixed',
        level: 1,
        categories: ['simple'],
      },
      armor: {
        type: 'fixed',
        level: 1,
        categories: [ 'light', 'medium', 'shields' ],
      },
    },
    requirements: {
      allowedRaces: 'all',
      allowedAlignments: 'any',
    } 
  },
  { 
    id: 'rogue', 
    name: 'Rogue', 
    description: 'A class of cunning and stealthy thieves.',
    definitions: {
      name: 'Rogue Specialization',
      selectionLevel: 3,
      options: [
        { id: 'arcane-trickster', name: 'Arcane Trickster', source: 'PHB' },
        { id: 'assassin', name: 'Assassin', source: 'PHB' },
        { id: 'inquisitive', name: 'Inquisitive', source: 'XGE' },
        { id: 'mastermind', name: 'Mastermind', source: 'XGE' },
        { id: 'phantom', name: 'Phantom', source: 'TCOE' },
        { id: 'scout', name: 'Scout', source: 'XGE' },
        { id: 'soulknife', name: 'Soulknife', source: 'TCOE' },
        { id: 'swashbuckler', name: 'Swashbuckler', source: 'XGE' },
        { id: 'thief', name: 'Thief', source: 'PHB' }
      ]
    },
    generation: {
      abilityPriority: ['dexterity', 'intelligence']
    },
    progression: {
      hitDie: 8,
      attackProgression: 'good',
      primaryAbilities: ['dexterity', 'intelligence'],
      savingThrows: ['dexterity', 'intelligence'],
      spellcasting: 'none',
      extraAttackLevel: 3,
      asiLevels: [4, 6, 8, 12, 14, 16, 19],
    },
    proficiencies: {
      skills: {
        type: 'choice',
        choose: 4,
        level: 1,
        from: [
          'acrobatics',
          'athletics',
          'deception',
          'insight',
          'intimidation',
          'investigation',
          'perception',
          'performance',
          'persuasion',
          'sleightOfHand',
          'stealth'
        ]
      },
      weapons: {
        type: 'fixed',
        level: 1,
        categories: ['simple'],
      },
      armor: {
        type: 'fixed',
        level: 1,
        categories: ['light'],
      },
    },
    requirements: {
      allowedRaces: 'all',
      allowedAlignments: 'any',
    } 
  },
  {
    id: 'paladin', 
    name: 'Paladin', 
    description: 'A class of righteous and noble protectors.',
    definitions: {
      name: 'Sacred Oath',
      selectionLevel: 3,
      options: [
        { id: 'ancients', name: 'Oath of the Ancients', source: 'PHB' },
        { id: 'conquest', name: 'Oath of Conquest', source: 'XGE' },
        { id: 'crown', name: 'Oath of the Crown', source: 'SCAG' },
        { 
          id: 'devotion', 
          name: 'Oath of Devotion', 
          source: 'PHB',
          features: [
            {
              name: 'Sacred Weapon',
              level: 3,
              type: 'active_buff',
              action: 'action',
              duration: '1 minute',
              resource: 'channel_divinity',
              // This allows your logic engine to find and apply the bonus
              effects: [{
                target: 'attack_roll',
                stat: 'charisma',
                type: 'additive'
              }]
            },
            {
              kind: 'aura',
              level: 7,
              range: 10,
              affects: 'allies',
              effects: [
                {
                  kind: 'grant',
                  grantType: 'condition_immunity',
                  value: 'charmed'
                }
              ]
            }
          ]
        },
        { id: 'glory', name: 'Oath of Glory', source: 'TCOE' },
        { id: 'redemption', name: 'Oath of Redemption', source: 'XGE' },
        { id: 'vengeance', name: 'Oath of Vengeance', source: 'PHB' },
        { id: 'watchers', name: 'Oath of the Watchers', source: 'TCOE' },
        { id: 'oathbreaker', name: 'Oathbreaker', source: 'DMG' }
      ]
    },
    generation: {
      abilityPriority: ['charisma', 'constitution']
    },
    progression: {
      hitDie: 8,
      attackProgression: 'good',
      primaryAbilities: ['charisma', 'constitution'],
      savingThrows: ['charisma', 'constitution'],
      spellcasting: 'none',
      extraAttackLevel: 3,
      asiLevels: [4, 6, 8, 12, 14, 16, 19],
    },
    proficiencies: {
      skills: {
        type: 'choice',
        choose: 2,
        level: 1,
        from: [
          'athletics',
          'insight',
          'intimidation',
          'medicine',
          'persuasion',
          'religion'
        ]
      },
      weapons: {
        type: 'fixed',
        level: 1,
        categories: ['simple', 'martial'],
      },
      armor: {
        type: 'fixed',
        level: 1,
        categories: ['allArmor', 'shields'],
      },
    },
    requirements: {
      allowedRaces: 'all',
      allowedAlignments: 'any',
    } 
  },
  { 
    id: 'bard',
    name: 'Bard',
    description: 'A class of talented and charismatic storytellers.',
    definitions: {
      name: 'Bardic College',
      selectionLevel: 3,
      options: [
        { id: 'creation', name: 'College of Creation', source: 'TCOE' },
        { id: 'eloquence', name: 'College of Eloquence', source: 'TCOE' },
        { id: 'glamour', name: 'College of Glamour', source: 'XGE' },
        { id: 'lore', name: 'College of Lore', source: 'PHB' },
        { id: 'spirits', name: 'College of Spirits', source: 'VRGR' },
        { id: 'swords', name: 'College of Swords', source: 'XGE' },
        { id: 'valor', name: 'College of Valor', source: 'PHB' },
        { id: 'whispers', name: 'College of Whispers', source: 'XGE' }
      ]
    },
    generation: {
      abilityPriority: ['charisma', 'dexterity']
    },
    progression: {
      hitDie: 8,
      attackProgression: 'good',
      primaryAbilities: ['charisma', 'dexterity'],
      savingThrows: ['charisma', 'dexterity'],
      spellcasting: 'none',
      extraAttackLevel: 3,
      asiLevels: [4, 6, 8, 12, 14, 16, 19],
    },
    proficiencies: {
      skills: {
        type: 'choice',
        choose: 3,
        level: 1,
        from: [
          ...Object.keys(FIVE_E_CHARISMA_SKILLS),
          ...Object.keys(FIVE_E_DEXTERITY_SKILLS),
          ...Object.keys(FIVE_E_INTELLIGENCE_SKILLS),
          ...Object.keys(FIVE_E_WISDOM_SKILLS),
          ...Object.keys(FIVE_E_STRENGTH_SKILLS),
        ],
      },
      weapons: {
        type: 'fixed',
        level: 1,
        categories: ['simple'],
        items: [],
      },
      armor: {
        type: 'fixed',
        level: 1,
        categories: ['light'],
        items: [],
      },
    },
    requirements: {
      allowedRaces: 'all',
      allowedAlignments: 'any',
    } 
  },
  { 
    id: 'ranger',
    name: 'Ranger',
    description: 'A class of skilled and knowledgeable trackers.',
    definitions: {
      name: 'Ranger Path',
      selectionLevel: 3,
      options: [
        { id: 'beast-master', name: 'Beast Master', source: 'PHB' },
        { id: 'fey-wanderer', name: 'Fey Wanderer', source: 'TCOE' },
        { id: 'gloom-stalker', name: 'Gloom Stalker', source: 'XGE' },
        { id: 'horizon-walker', name: 'Horizon Walker', source: 'XGE' },
        { id: 'hunter', name: 'Hunter', source: 'PHB' },
        { id: 'monster-slayer', name: 'Monster Slayer', source: 'XGE' },
        { id: 'swarmkeeper', name: 'Swarmkeeper', source: 'TCOE' },
        { id: 'drake-warden', name: 'Drakewarden', source: 'FTD' }
      ]
    },
    generation: {
      abilityPriority: ['strength', 'dexterity']
    },
    progression: {
      hitDie: 8,
      attackProgression: 'good',
      primaryAbilities: ['strength', 'dexterity'],
      savingThrows: ['strength', 'dexterity'],
      spellcasting: 'none',
      extraAttackLevel: 3,
      asiLevels: [4, 6, 8, 12, 14, 16, 19],
    },
    proficiencies: {
      skills: {
        type: 'choice',
        choose: 3,
        level: 1,
        from: [
          'animalHandling',
          'athletics',
          'insight',
          'investigation',
        ],
      },
      weapons: {
        type: 'fixed',
        level: 1,
        categories: ['simple', 'martial'],
      },
      armor: {
        type: 'fixed',
        level: 1,
        categories: ['allArmor', 'shields'],
      },
    },
    requirements: {
      allowedRaces: 'all',
      allowedAlignments: 'any',
    } 
  },
  { 
    id: 'monk', 
    name: 'Monk', 
    description: 'A class of disciplined and focused martial artists.',
    definitions: {
      name: 'Monastic Tradition',
      selectionLevel: 3,
      options: [
        { id: 'astral-self', name: 'Way of the Astral Self', source: 'TCOE' },
        { id: 'drunken-master', name: 'Way of the Drunken Master', source: 'XGE' },
        { id: 'four-elements', name: 'Way of the Four Elements', source: 'PHB' },
        { id: 'kensei', name: 'Way of the Kensei', source: 'XGE' },
        { id: 'long-death', name: 'Way of the Long Death', source: 'SCAG' },
        { id: 'mercy', name: 'Way of Mercy', source: 'TCOE' },
        { id: 'shadow', name: 'Way of Shadow', source: 'PHB' },
        { id: 'open-hand', name: 'Way of the Open Hand', source: 'PHB' },
        { id: 'sun-soul', name: 'Way of the Sun Soul', source: 'XGE' }
      ]
    },
    generation: {
      abilityPriority: ['dexterity', 'constitution']
    },
    progression: {
      hitDie: 8,
      attackProgression: 'good',
      primaryAbilities: ['dexterity', 'constitution'],
      savingThrows: ['dexterity', 'constitution'],
      spellcasting: 'none',
      extraAttackLevel: 3,
      asiLevels: [4, 6, 8, 12, 14, 16, 19],
    },
    proficiencies: {
      skills: {
        type: 'choice',
        choose: 2,
        level: 1,
        from: [
          'acrobatics',
          'athletics',
          'history',
          'insight',
        ],
      },
      weapons: {
        type: 'fixed',
        level: 1,
        categories: ['simple'],
      },
      armor: {
        type: 'fixed',
        level: 1,
        categories: ['none'],
      },
    },
    requirements: {
      allowedRaces: 'all',
      allowedAlignments: 'any',
    } 
  },
  { 
    id: 'druid', 
    name: 'Druid', 
    description: 'A class of nature-loving and wise protectors.',
    definitions: {
      name: 'Druid Circle',
      selectionLevel: 2,
      options: [
        { id: 'dreams', name: 'Circle of Dreams', source: 'XGE' },
        { id: 'land', name: 'Circle of the Land', source: 'PHB' },
        { id: 'moon', name: 'Circle of the Moon', source: 'PHB' },
        { id: 'shepherd', name: 'Circle of the Shepherd', source: 'XGE' },
        { id: 'spores', name: 'Circle of Spores', source: 'GGR' },
        { id: 'stars', name: 'Circle of the Stars', source: 'TCOE' },
        { id: 'wildfire', name: 'Circle of Wildfire', source: 'TCOE' }
      ]
    },
    generation: {
      abilityPriority: ['wisdom', 'constitution']
    },
    progression: {
      hitDie: 8,
      attackProgression: 'good',
      primaryAbilities: ['wisdom', 'constitution'],
      savingThrows: ['wisdom', 'constitution'],
      spellcasting: 'none',
      extraAttackLevel: 3,
      asiLevels: [4, 6, 8, 12, 14, 16, 19],
    },
    proficiencies: {
      skills: {
        type: 'choice',
        choose: 2,
        level: 1,
        from: [
          'arcana',
          'animalHandling',
          'insight',
          'medicine',
          'nature',
          'perception',
          'religion',
          'survival',
        ],
      },
      weapons: {
        type: 'fixed',
        level: 1,
        categories: ['simple', 'martial'],
      },
      armor: {
        type: 'fixed',
        level: 1,
        categories: ['light', 'medium', 'shields'],
        // disallowedMaterials: ['metal']
      },
    },
    requirements: {
      allowedRaces: 'all',
      allowedAlignments: 'any',
    } 
  },
  { 
    id: 'warlock', 
    name: 'Warlock', 
    description: 'A class of powerful and mysterious spellcasters.',
    definitions: {
      name: 'Warlock Patron',
      selectionLevel: 1,
      options: [
        { id: 'archfey', name: 'The Archfey', source: 'PHB' },
        { id: 'celestial', name: 'The Celestial', source: 'XGE' },
        { id: 'fathomless', name: 'The Fathomless', source: 'TCOE' },
        { id: 'fiend', name: 'The Fiend', source: 'PHB' },
        { id: 'genie', name: 'The Genie', source: 'TCOE' },
        { id: 'great-old-one', name: 'The Great Old One', source: 'PHB' },
        { 
          id: 'hexblade',
          name: 'The Hexblade', 
          source: 'XGE',
          features: [
            {
              name: 'Hex Warrior',
              description: 'Hex Warrior: Grants proficiency with Medium Armor, Shields, and Martial Weapons.',
              kind: 'grant',
              grantType: 'proficiency',
              level: 1,
              value: [
                { target: 'armor', categories: ['medium', 'shield'] },
                { target: 'weapon', categories: ['martial'] },
              ],
            }
          ]
        },
        { id: 'undead', name: 'The Undead', source: 'VRGR' },
        { id: 'undying', name: 'The Undying', source: 'SCAG' }
      ]
    },
    generation: {
      abilityPriority: ['charisma', 'constitution']
    },
    progression: {
      hitDie: 8,
      attackProgression: 'average',
      primaryAbilities: ['cha', 'con'],
      savingThrows: ['wis', 'cha'],
      spellcasting: 'pact',
      spellProgression: {
        type: 'known',
        cantripsKnown: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
        spellsKnown:   [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15],
        spellSlots: WARLOCK_PACT_SLOTS_5E,
        maxSpellLevel: 5,  // Pact slots cap at 5th; Mystic Arcanum covers 6th-9th
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
      skills: {
        type: 'choice',
        choose: 2,
        level: 1,
        from: [
          'arcana',
          'insight',
          'medicine',
          'religion',
          'survival',
        ],
      },
      weapons: {
        type: 'fixed',
        level: 1,
        categories: ['simple'],
      },
      armor: {
        type: 'fixed',
        level: 1,
        categories: ['light']
      },
    },
    requirements: {
      allowedRaces: 'all',
      allowedAlignments: 'any',
    } 
  },
  {
    id: 'sorcerer',
    name: 'Sorcerer',
    description: 'A class of powerful and mysterious spellcasters.',
    definitions: {
      name: 'Sorcerer Origin',
      selectionLevel: 1,
      options: [
        { id: 'aberrant-mind', name: 'Aberrant Mind', source: 'TCOE' },
        { id: 'clockwork-soul', name: 'Clockwork Soul', source: 'TCOE' },
        {
          id: 'draconic-bloodline',
          name: 'Draconic Bloodline',
          source: 'PHB',
          features: [
            {
              kind: 'formula',
              target: 'armor_class',
              level: 1,
              condition: { type: 'unarmored' },
              formula: {
                base: 13,
                ability: 'dexterity'
              }
            },
            {
              kind: 'modifier',
              level: 1,
              target: 'hp_max',
              mode: 'add',
              value: { perLevel: 1 }
            }
          ]
        },
        { id: 'shadow-magic', name: 'Shadow Magic', source: 'XGE' },
        { id: 'storm-sorcery', name: 'Storm Sorcery', source: 'SCAG' },
        { id: 'wild-magic', name: 'Wild Magic', source: 'PHB' }
      ]
    },
    generation: {
      abilityPriority: ['charisma', 'constitution']
    },
    progression: {
      hitDie: 6,
      attackProgression: 'poor',
      primaryAbilities: ['cha', 'con'],
      savingThrows: ['con', 'cha'],
      spellcasting: 'full',
      spellProgression: {
        type: 'known',
        cantripsKnown: [4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
        spellsKnown:   [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 13, 13, 14, 14, 15, 15, 15, 15],
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
      skills: {
        type: 'choice',
        choose: 2,
        level: 1,
        from: [
          'arcana',
          'insight',
          'medicine',
          'religion',
          'survival',
        ],
      },
      weapons: {
        type: 'fixed',
        level: 1,
        items: ['dagger', 'dart', 'sling', 'quarterstaff', 'light-crossbow']
      },
      armor: {
        type: 'fixed',
        level: 1,
        categories: [],
      },
    },
    requirements: {
      allowedRaces: 'all',
      allowedAlignments: 'any',
    } 
  },
  {
    id: 'barbarian',
    name: 'Barbarian',
    description: 'A class of powerful and mysterious spellcasters.',
    definitions: {
      name: 'Barbarian Path',
      selectionLevel: 3,
      options: [
        { id: 'ancestral-guardian', name: 'Path of the Ancestral Guardian', source: 'XGE' },
        { id: 'battlerager', name: 'Path of the Battlerager', source: 'SCAG' },
        { id: 'beast', name: 'Path of the Beast', source: 'TCOE' },
        { id: 'zealot', name: 'Path of the Zealot', source: 'XGE' },
        { id: 'storm-herald', name: 'Path of the Storm Herald', source: 'XGE' },
        { id: 'totem-warrior', name: 'Path of the Totem Warrior', source: 'PHB' },
        { id: 'berserker', name: 'Path of the Berserker', source: 'PHB' },
        { id: 'wild-magic', name: 'Path of Wild Magic', source: 'TCOE' }
      ]
    },
    generation: {
      abilityPriority: ['strength', 'constitution']
    },
    progression: {
      hitDie: 8,
      attackProgression: 'good',
      primaryAbilities: ['charisma', 'constitution'],
      savingThrows: ['charisma', 'constitution'],
      spellcasting: 'none',
      extraAttackLevel: 3,
      asiLevels: [4, 6, 8, 12, 14, 16, 19],
      features: [
        {
          id: 'unarmored-defense',
          name: 'Unarmored Defense',
          level: 1,
          effects: [
            {
              kind: 'formula',
              target: 'armor_class',
              formula: {
                base: 10,
                abilities: ['dexterity', 'constitution'],
              },
              source: 'barbarian.unarmored_defense',
              condition: {
                kind: 'state',
                target: 'self',
                property: 'equipment.armorEquipped',
                equals: null,
              }
            },
          ],
        },
        { id: 'rage', level: 1, name: 'Rage' },
        { id: 'unarmored-defense', level: 1, name: 'Unarmored Defense' },
        { id: 'reckless-attack', level: 2, name: 'Reckless Attack' },
        { id: 'danger-sense', level: 2, name: 'Danger Sense' },
        { id: 'primal-path', level: 3, name: 'Primal Path' },
        { id: 'extra-attack', level: 5, name: 'Extra Attack' },
        { id: 'fast-movement', level: 5, name: 'Fast Movement' },
        { id: 'feral-instinct', level: 7, name: 'Feral Instinct' },
        { id: 'brutal-critical', level: 9, name: 'Brutal Critical' },
        { id: 'relentless-rage', level: 11, name: 'Relentless Rage' },
        { id: 'persistent-rage', level: 15, name: 'Persistent Rage' },
        { id: 'indomitable-might', level: 18, name: 'Indomitable Might' },
        { id: 'primal-champion', level: 20, name: 'Primal Champion' },
      ]
    },
    proficiencies: {
      skills: {
        type: 'choice',
        choose: 2,
        level: 1,
        from: [
          'animalHandling',
          'athletics',
          'insight',
          'intimidation',
        ],
      },
      weapons: {
        type: 'fixed',
        level: 1,
        categories: ['simple', 'martial'],
      },
      armor: {
        type: 'fixed',
        level: 1,
        categories: ['light', 'medium', 'shields'],
      },
    },
    requirements: {
      allowedRaces: 'all',
      allowedAlignments: 'any',
    }
  },
  {
    id: 'wizard',
    name: 'Wizard',
    description: 'A class of wise and powerful spellcasters.',
    definitions: {
      name: 'Arcane Tradition',
      selectionLevel: 2,
      options: [
        { id: 'abjuration', name: 'School of Abjuration', source: 'PHB' },
        { id: 'bladesinging', name: 'Bladesinging', source: 'TCOE' },
        { id: 'chronurgy', name: 'Chronurgy Magic', source: 'EGW' },
        { id: 'conjuration', name: 'School of Conjuration', source: 'PHB' },
        { id: 'divination', name: 'School of Divination', source: 'PHB' },
        { id: 'enchantment', name: 'School of Enchantment', source: 'PHB' },
        { id: 'evocation', name: 'School of Evocation', source: 'PHB' },
        { id: 'graviturgy', name: 'Graviturgy Magic', source: 'EGW' },
        { id: 'illusion', name: 'School of Illusion', source: 'PHB' },
        { id: 'necromancy', name: 'School of Necromancy', source: 'PHB' },
        { id: 'order-of-scribes', name: 'Order of Scribes', source: 'TCOE' },
        { id: 'transmutation', name: 'School of Transmutation', source: 'PHB' },
        { id: 'war-magic', name: 'War Magic', source: 'XGE' }
      ]
    },
    generation: {
      abilityPriority: ['intelligence', 'constitution']
    },
    progression: {
      hitDie: 6,
      attackProgression: 'poor',
      primaryAbilities: ['int', 'con'],
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
        { id: 'spellcasting', level: 1, name: 'Spellcasting' },
        { id: 'arcane-recovery', level: 1, name: 'Arcane Recovery' },
        { id: 'arcane-tradition', level: 2, name: 'Arcane Tradition' },
        { id: 'spell-mastery', level: 18, name: 'Spell Mastery' },
        { id: 'signature-spells', level: 20, name: 'Signature Spells' },
      ],
    },
    proficiencies: {
      skills: {
        type: 'choice',
        choose: 2,
        level: 1,
        from: [
          'arcana',
          'history',
          'insight',
          'investigation',
        ],
      },
      weapons: {
        type: 'fixed',
        level: 1,
        items: ['dagger', 'dart', 'sling', 'quarterstaff', 'light-crossbow'],
      },
      armor: {
        type: 'fixed',
        level: 1,
        categories: [],
      },
    },
    requirements: {
      allowedRaces: 'all',
      allowedAlignments: 'any',
      multiclassing: {
        note: 'Requires 13 Intelligence',
        anyOf: [
          { all: [{ ability: 'intelligence', min: 13 }] },
        ],
      }
    } 
  }
] satisfies CharacterClass[]
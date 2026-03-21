import type { MonsterCatalogEntry } from '../types';

/** System catalog — ids whose `id` starts with `b`. */

export const MONSTERS_B: readonly MonsterCatalogEntry[] = [
  {
    id: 'adult-blue-dragon',
    name: 'Adult Blue Dragon',
    type: 'dragon',
    sizeCategory: 'huge',
    languages: [{ id: 'common' }, { id: 'draconic' }],
    description: {
      short: 'A proud blue dragon — lightning, arrogance, and storm given scaled form.',
      long: 'Adult blue dragons are vain tyrants of desert and storm. They hoard knowledge and wealth, and their breath can reduce armies to ash and ozone.',
    },
    mechanics: {
      hitPoints: { count: 17, die: 12, modifier: 102 },
      armorClass: { kind: 'natural', offset: 9 },
      movement: { ground: 40, burrow: 30, fly: 80 },
      abilities: { str: 25, dex: 10, con: 23, int: 16, wis: 15, cha: 20 },
      savingThrows: {
        dex: { proficiencyLevel: 1 },
        con: { proficiencyLevel: 1 },
        wis: { proficiencyLevel: 1 },
        cha: { proficiencyLevel: 1 },
      },
      proficiencies: {
        skills: { perception: { proficiencyLevel: 2 }, stealth: { proficiencyLevel: 1 } },
      },
      senses: {
        special: [
          { type: 'blindsight', range: 60 },
          { type: 'darkvision', range: 120 },
        ],
        passivePerception: 22,
      },
      proficiencyBonus: 5,
      immunities: ['lightning'],
      traits: [
        {
          name: 'Legendary Resistance',
          description:
            'Legendary Resistance (3/Day, or 4/Day in Lair). If the dragon fails a saving throw, it can choose to succeed instead.',
        },
        {
          name: 'Legendary Actions',
          description:
            'Legendary Action Uses: 3 (4 in Lair). Cloaked Flight: Spellcasting Invisibility on itself and fly up to half Fly Speed (cannot repeat until start of next turn). Sonic Boom: Spellcasting Shatter (cannot repeat until start of next turn). Tail Swipe: one Rend attack.',
          resolution: {
            caveats: ['Legendary action economy and spell sub-actions are not automated.'],
          },
        },
      ],
      actions: [
        {
          kind: 'special',
          name: 'Multiattack',
          description:
            'The dragon makes three Rend attacks. It can replace one attack with a use of Spellcasting to cast Shatter.',
          sequence: [{ actionName: 'Rend', count: 3 }],
          notes: 'One attack may be replaced with Shatter via Spellcasting.',
        },
        {
          kind: 'natural',
          name: 'Rend',
          attackType: 'claw',
          attackBonus: 12,
          reach: 10,
          damage: '2d8',
          damageBonus: 7,
          damageType: 'slashing',
          onHitEffects: [{ kind: 'damage', damage: '1d10', damageType: 'lightning' }],
        },
        {
          kind: 'special',
          name: 'Lightning Breath',
          description:
            'Dexterity Saving Throw: DC 19, each creature in a 90-foot-long, 5-foot-wide Line. Failure: 60 (11d10) Lightning damage. Success: Half damage.',
          save: { ability: 'dex', dc: 19 },
          damage: '11d10',
          damageType: 'lightning',
          halfDamageOnSave: true,
          recharge: { min: 5, max: 6 },
          resolution: { caveats: ['Line area not fully modeled.'] },
        },
        {
          kind: 'special',
          name: 'Spellcasting',
          description:
            'Charisma spell save DC 18. At Will: Detect Magic, Invisibility, Mage Hand, Shatter. 1/Day Each: Scrying, Sending. No Material components.',
          resolution: { caveats: ['Innate spell list not executed as combat actions.'] },
        },
      ],
      resolution: {
        caveats: ['Lair XP 18,000 vs wandering 15,000 is flavor-only in lore.'],
      },
    },
    lore: {
      alignment: 'le',
      challengeRating: 16,
      xpValue: 15000,
      intelligence: 'high',
    },
  },
  {
    id: 'adult-brass-dragon',
    name: 'Adult Brass Dragon',
    type: 'dragon',
    sizeCategory: 'huge',
    languages: [{ id: 'common' }, { id: 'draconic' }],
    description: {
      short: 'A conversational adult brass dragon — heat, sand, and curious pride.',
      long: 'Adult brass dragons favor sun-scorched wastes and ruins. They talk before they torch, and their breath can lull foes to magical sleep.',
    },
    mechanics: {
      hitPoints: { count: 15, die: 12, modifier: 75 },
      armorClass: { kind: 'natural', offset: 8 },
      movement: { ground: 40, burrow: 30, fly: 80 },
      abilities: { str: 23, dex: 10, con: 21, int: 14, wis: 13, cha: 17 },
      savingThrows: {
        dex: { proficiencyLevel: 1 },
        con: { proficiencyLevel: 1 },
        wis: { proficiencyLevel: 1 },
        cha: { proficiencyLevel: 1 },
      },
      proficiencies: {
        skills: {
          history: { proficiencyLevel: 1 },
          perception: { proficiencyLevel: 2 },
          persuasion: { proficiencyLevel: 1 },
          stealth: { proficiencyLevel: 1 },
        },
      },
      senses: {
        special: [
          { type: 'blindsight', range: 60 },
          { type: 'darkvision', range: 120 },
        ],
        passivePerception: 21,
      },
      proficiencyBonus: 5,
      immunities: ['fire'],
      traits: [
        {
          name: 'Legendary Resistance',
          description:
            'Legendary Resistance (3/Day, or 4/Day in Lair). If the dragon fails a saving throw, it can choose to succeed instead.',
        },
        {
          name: 'Legendary Actions',
          description:
            'Legendary Action Uses: 3 (4 in Lair). Blazing Light: Scorching Ray. Pounce: move half Speed + one Rend. Scorching Sands: Dex save DC 16 one target 120 ft., 6d8 Fire + half Speed (once per round cycle).',
          resolution: { caveats: ['Legendary actions not automated.'] },
        },
      ],
      actions: [
        {
          kind: 'special',
          name: 'Multiattack',
          description:
            'The dragon makes three Rend attacks. It can replace one attack with (A) Sleep Breath or (B) Spellcasting to cast Scorching Ray.',
          sequence: [{ actionName: 'Rend', count: 3 }],
        },
        {
          kind: 'natural',
          name: 'Rend',
          attackType: 'claw',
          attackBonus: 11,
          reach: 10,
          damage: '2d10',
          damageBonus: 6,
          damageType: 'slashing',
          onHitEffects: [{ kind: 'damage', damage: '1d8', damageType: 'fire' }],
        },
        {
          kind: 'special',
          name: 'Fire Breath',
          description:
            'Dexterity Saving Throw: DC 18, each creature in a 60-foot-long, 5-foot-wide Line. Failure: 45 (10d8) Fire damage. Success: Half damage.',
          save: { ability: 'dex', dc: 18 },
          damage: '10d8',
          damageType: 'fire',
          halfDamageOnSave: true,
          recharge: { min: 5, max: 6 },
        },
        {
          kind: 'special',
          name: 'Sleep Breath',
          description:
            'Constitution Saving Throw: DC 18, each creature in a 60-foot Cone. Failure: Incapacitated until end of next turn, then repeat save; second failure Unconscious 10 minutes (ends on damage or ally wake).',
          save: { ability: 'con', dc: 18 },
          resolution: { caveats: ['Cone sleep ladder not automated.'] },
        },
        {
          kind: 'special',
          name: 'Spellcasting',
          description:
            'Charisma spell save DC 16. At Will: Detect Magic, Minor Illusion, Scorching Ray, Shapechange (Beast or Humanoid only; no temp HP from spell; no concentration/temp HP to maintain), Speak with Animals. 1/Day Each: Detect Thoughts, Control Weather.',
          resolution: { caveats: ['Shapechange and spell list not executed in encounter.'] },
        },
      ],
      resolution: { caveats: ['Lair XP 11,500 vs wandering 10,000 is flavor-only.'] },
    },
    lore: {
      alignment: 'cg',
      challengeRating: 13,
      xpValue: 10000,
      intelligence: 'high',
    },
  },
  {
    id: 'adult-bronze-dragon',
    name: 'Adult Bronze Dragon',
    type: 'dragon',
    sizeCategory: 'huge',
    languages: [{ id: 'common' }, { id: 'draconic' }],
    description: {
      short: 'An adult bronze dragon — sea storm and justice in bronze scales.',
      long: 'Adult bronze dragons protect coasts and shallows. They duel with lightning breath and repulsive waves of force, and know many tricks of magic.',
    },
    mechanics: {
      hitPoints: { count: 17, die: 12, modifier: 102 },
      armorClass: { kind: 'natural', offset: 8 },
      movement: { ground: 40, fly: 80, swim: 40 },
      abilities: { str: 25, dex: 10, con: 23, int: 16, wis: 15, cha: 20 },
      savingThrows: {
        dex: { proficiencyLevel: 1 },
        con: { proficiencyLevel: 1 },
        wis: { proficiencyLevel: 1 },
        cha: { proficiencyLevel: 1 },
      },
      proficiencies: {
        skills: { insight: { proficiencyLevel: 1 }, perception: { proficiencyLevel: 2 }, stealth: { proficiencyLevel: 1 } },
      },
      senses: {
        special: [
          { type: 'blindsight', range: 60 },
          { type: 'darkvision', range: 120 },
        ],
        passivePerception: 22,
      },
      proficiencyBonus: 5,
      immunities: ['lightning'],
      traits: [
        {
          name: 'Amphibious',
          description: 'The dragon can breathe air and water.',
        },
        {
          name: 'Legendary Resistance',
          description:
            'Legendary Resistance (3/Day, or 4/Day in Lair). If the dragon fails a saving throw, it can choose to succeed instead.',
        },
        {
          name: 'Legendary Actions',
          description:
            'Legendary Action Uses: 3 (4 in Lair). Guiding Light: Guiding Bolt (level 2). Pounce: half Speed + Rend. Thunderclap: Con save DC 17, 20-ft sphere 90 ft., 3d6 Thunder + Deafened to end of next turn.',
          resolution: { caveats: ['Legendary actions not automated.'] },
        },
      ],
      actions: [
        {
          kind: 'special',
          name: 'Multiattack',
          description:
            'The dragon makes three Rend attacks. It can replace one attack with (A) Repulsion Breath or (B) Spellcasting to cast Guiding Bolt (level 2 version).',
          sequence: [{ actionName: 'Rend', count: 3 }],
        },
        {
          kind: 'natural',
          name: 'Rend',
          attackType: 'claw',
          attackBonus: 12,
          reach: 10,
          damage: '2d8',
          damageBonus: 7,
          damageType: 'slashing',
          onHitEffects: [{ kind: 'damage', damage: '1d10', damageType: 'lightning' }],
        },
        {
          kind: 'special',
          name: 'Lightning Breath',
          description:
            'Dexterity Saving Throw: DC 19, each creature in a 90-foot-long, 5-foot-wide Line. Failure: 55 (10d10) Lightning damage. Success: Half damage.',
          save: { ability: 'dex', dc: 19 },
          damage: '10d10',
          damageType: 'lightning',
          halfDamageOnSave: true,
          recharge: { min: 5, max: 6 },
        },
        {
          kind: 'special',
          name: 'Repulsion Breath',
          description:
            'Strength Saving Throw: DC 19, each creature in a 30-foot Cone. Failure: Pushed up to 60 feet away and Prone.',
          save: { ability: 'str', dc: 19 },
          onFail: [{ kind: 'condition', conditionId: 'prone' }],
          resolution: { caveats: ['Push distance and cone not fully modeled.'] },
        },
        {
          kind: 'special',
          name: 'Spellcasting',
          description:
            'Charisma spell save DC 17, +10 spell attacks. At Will: Detect Magic, Guiding Bolt (level 2), Shapechange (Beast or Humanoid only; no temp HP; no concentration/temp HP to maintain), Speak with Animals, Thaumaturgy. 1/Day Each: Detect Thoughts, Water Breathing.',
          resolution: { caveats: ['Spell list not executed in encounter.'] },
        },
      ],
      resolution: { caveats: ['Lair XP 15,000 vs wandering 13,000 is flavor-only.'] },
    },
    lore: {
      alignment: 'lg',
      challengeRating: 15,
      xpValue: 13000,
      intelligence: 'high',
    },
  },
  {
    id: 'ancient-blue-dragon',
    name: 'Ancient Blue Dragon',
    type: 'dragon',
    sizeCategory: 'gargantuan',
    languages: [{ id: 'common' }, { id: 'draconic' }],
    description: {
      short: 'An ancient blue dragon — a living hurricane of hubris and lightning.',
      long: 'Ancient blues are among the mightiest of chromatic wyrms, scouring deserts and sky with breath that shatters armies.',
    },
    mechanics: {
      hitPoints: { count: 26, die: 20, modifier: 208 },
      armorClass: { kind: 'natural', offset: 12 },
      movement: { ground: 40, burrow: 40, fly: 80 },
      abilities: { str: 29, dex: 10, con: 27, int: 18, wis: 17, cha: 25 },
      savingThrows: {
        dex: { proficiencyLevel: 1 },
        con: { proficiencyLevel: 1 },
        wis: { proficiencyLevel: 1 },
        cha: { proficiencyLevel: 1 },
      },
      proficiencies: {
        skills: { perception: { proficiencyLevel: 2 }, stealth: { proficiencyLevel: 1 } },
      },
      senses: {
        special: [
          { type: 'blindsight', range: 60 },
          { type: 'darkvision', range: 120 },
        ],
        passivePerception: 27,
      },
      proficiencyBonus: 7,
      immunities: ['lightning'],
      traits: [
        {
          name: 'Legendary Resistance',
          description:
            'Legendary Resistance (4/Day, or 5/Day in Lair). If the dragon fails a saving throw, it can choose to succeed instead.',
        },
        {
          name: 'Legendary Actions',
          description:
            'Legendary Action Uses: 3 (4 in Lair). Cloaked Flight (Invisibility + half fly). Sonic Boom: Shatter (level 3 version). Tail Swipe: one Rend.',
          resolution: { caveats: ['Legendary actions not automated.'] },
        },
      ],
      actions: [
        {
          kind: 'special',
          name: 'Multiattack',
          description:
            'The dragon makes three Rend attacks. It can replace one attack with Spellcasting to cast Shatter (level 3 version).',
          sequence: [{ actionName: 'Rend', count: 3 }],
        },
        {
          kind: 'natural',
          name: 'Rend',
          attackType: 'claw',
          attackBonus: 16,
          reach: 15,
          damage: '2d8',
          damageBonus: 9,
          damageType: 'slashing',
          onHitEffects: [{ kind: 'damage', damage: '2d10', damageType: 'lightning' }],
        },
        {
          kind: 'special',
          name: 'Lightning Breath',
          description:
            'Dexterity Saving Throw: DC 23, each creature in a 120-foot-long, 10-foot-wide Line. Failure: 88 (16d10) Lightning damage. Success: Half damage.',
          save: { ability: 'dex', dc: 23 },
          damage: '16d10',
          damageType: 'lightning',
          halfDamageOnSave: true,
          recharge: { min: 5, max: 6 },
        },
        {
          kind: 'special',
          name: 'Spellcasting',
          description:
            'Charisma spell save DC 22. At Will: Detect Magic, Invisibility, Mage Hand, Shatter (level 3). 1/Day Each: Scrying, Sending.',
          resolution: { caveats: ['Spell list not executed in encounter.'] },
        },
      ],
      resolution: { caveats: ['Lair XP 62,000 vs wandering 50,000 is flavor-only.'] },
    },
    lore: {
      alignment: 'le',
      challengeRating: 23,
      xpValue: 50000,
      intelligence: 'high',
    },
  },
  {
    id: 'ancient-brass-dragon',
    name: 'Ancient Brass Dragon',
    type: 'dragon',
    sizeCategory: 'gargantuan',
    languages: [{ id: 'common' }, { id: 'draconic' }],
    description: {
      short: 'An ancient brass dragon — desert sun and ancient riddles given colossal form.',
      long: 'Ancient brass dragons are sages and schemers of the wastes, as likely to bargain as to burn.',
    },
    mechanics: {
      hitPoints: { count: 19, die: 20, modifier: 133 },
      armorClass: { kind: 'natural', offset: 10 },
      movement: { ground: 40, burrow: 40, fly: 80 },
      abilities: { str: 27, dex: 10, con: 25, int: 16, wis: 15, cha: 22 },
      savingThrows: {
        dex: { proficiencyLevel: 1 },
        con: { proficiencyLevel: 1 },
        wis: { proficiencyLevel: 1 },
        cha: { proficiencyLevel: 1 },
      },
      proficiencies: {
        skills: {
          history: { proficiencyLevel: 1 },
          perception: { proficiencyLevel: 2 },
          persuasion: { proficiencyLevel: 1 },
          stealth: { proficiencyLevel: 1 },
        },
      },
      senses: {
        special: [
          { type: 'blindsight', range: 60 },
          { type: 'darkvision', range: 120 },
        ],
        passivePerception: 24,
      },
      proficiencyBonus: 6,
      immunities: ['fire'],
      traits: [
        {
          name: 'Legendary Resistance',
          description:
            'Legendary Resistance (4/Day, or 5/Day in Lair). If the dragon fails a saving throw, it can choose to succeed instead.',
        },
        {
          name: 'Legendary Actions',
          description:
            'Legendary Action Uses: 3 (4 in Lair). Blazing Light: Scorching Ray (level 3). Pounce. Scorching Sands: Dex DC 20, 8d8 Fire + half Speed.',
          resolution: { caveats: ['Legendary actions not automated.'] },
        },
      ],
      actions: [
        {
          kind: 'special',
          name: 'Multiattack',
          description:
            'The dragon makes three Rend attacks. It can replace one attack with (A) Sleep Breath or (B) Spellcasting to cast Scorching Ray (level 3 version).',
          sequence: [{ actionName: 'Rend', count: 3 }],
        },
        {
          kind: 'natural',
          name: 'Rend',
          attackType: 'claw',
          attackBonus: 14,
          reach: 15,
          damage: '2d10',
          damageBonus: 8,
          damageType: 'slashing',
          onHitEffects: [{ kind: 'damage', damage: '2d6', damageType: 'fire' }],
        },
        {
          kind: 'special',
          name: 'Fire Breath',
          description:
            'Dexterity Saving Throw: DC 21, each creature in a 90-foot-long, 5-foot-wide Line. Failure: 58 (13d8) Fire damage. Success: Half damage.',
          save: { ability: 'dex', dc: 21 },
          damage: '13d8',
          damageType: 'fire',
          halfDamageOnSave: true,
          recharge: { min: 5, max: 6 },
        },
        {
          kind: 'special',
          name: 'Sleep Breath',
          description:
            'Constitution Saving Throw: DC 21, each creature in a 90-foot Cone. Failure: Incapacitated then repeat; second failure Unconscious 10 minutes.',
          save: { ability: 'con', dc: 21 },
          resolution: { caveats: ['Sleep ladder not automated.'] },
        },
        {
          kind: 'special',
          name: 'Spellcasting',
          description:
            'Charisma spell save DC 20. At Will: Detect Magic, Minor Illusion, Scorching Ray (level 3), Shapechange (Beast or Humanoid only; no temp HP; no concentration/temp HP to maintain), Speak with Animals. 1/Day Each: Control Weather, Detect Thoughts.',
          resolution: { caveats: ['Spell list not executed.'] },
        },
      ],
      resolution: { caveats: ['Lair XP 33,000 vs wandering 25,000 is flavor-only.'] },
    },
    lore: {
      alignment: 'cg',
      challengeRating: 20,
      xpValue: 25000,
      intelligence: 'high',
    },
  },
  {
    id: 'ancient-bronze-dragon',
    name: 'Ancient Bronze Dragon',
    type: 'dragon',
    sizeCategory: 'gargantuan',
    languages: [{ id: 'common' }, { id: 'draconic' }],
    description: {
      short: 'An ancient bronze dragon — storm-lord of coasts and the deeps.',
      long: 'Ancient bronze dragons are legendary guardians and tacticians, wielding lightning and tide against any who threaten their domains.',
    },
    mechanics: {
      hitPoints: { count: 24, die: 20, modifier: 192 },
      armorClass: { kind: 'natural', offset: 12 },
      movement: { ground: 40, fly: 80, swim: 40 },
      abilities: { str: 29, dex: 10, con: 27, int: 18, wis: 17, cha: 25 },
      savingThrows: {
        dex: { proficiencyLevel: 1 },
        con: { proficiencyLevel: 1 },
        wis: { proficiencyLevel: 1 },
        cha: { proficiencyLevel: 1 },
      },
      proficiencies: {
        skills: { insight: { proficiencyLevel: 1 }, perception: { proficiencyLevel: 2 }, stealth: { proficiencyLevel: 1 } },
      },
      senses: {
        special: [
          { type: 'blindsight', range: 60 },
          { type: 'darkvision', range: 120 },
        ],
        passivePerception: 27,
      },
      proficiencyBonus: 7,
      immunities: ['lightning'],
      traits: [
        {
          name: 'Amphibious',
          description: 'The dragon can breathe air and water.',
        },
        {
          name: 'Legendary Resistance',
          description:
            'Legendary Resistance (4/Day, or 5/Day in Lair). If the dragon fails a saving throw, it can choose to succeed instead.',
        },
        {
          name: 'Legendary Actions',
          description:
            'Legendary Action Uses: 3 (4 in Lair). Guiding Light: Guiding Bolt (level 2). Pounce. Thunderclap: Con DC 22, sphere 120 ft., 3d8 Thunder + Deafened.',
          resolution: { caveats: ['Legendary actions not automated.'] },
        },
      ],
      actions: [
        {
          kind: 'special',
          name: 'Multiattack',
          description:
            'The dragon makes three Rend attacks. It can replace one attack with (A) Repulsion Breath or (B) Spellcasting to cast Guiding Bolt (level 2 version).',
          sequence: [{ actionName: 'Rend', count: 3 }],
        },
        {
          kind: 'natural',
          name: 'Rend',
          attackType: 'claw',
          attackBonus: 16,
          reach: 15,
          damage: '2d8',
          damageBonus: 9,
          damageType: 'slashing',
          onHitEffects: [{ kind: 'damage', damage: '2d8', damageType: 'lightning' }],
        },
        {
          kind: 'special',
          name: 'Lightning Breath',
          description:
            'Dexterity Saving Throw: DC 23, each creature in a 120-foot-long, 10-foot-wide Line. Failure: 82 (15d10) Lightning damage. Success: Half damage.',
          save: { ability: 'dex', dc: 23 },
          damage: '15d10',
          damageType: 'lightning',
          halfDamageOnSave: true,
          recharge: { min: 5, max: 6 },
        },
        {
          kind: 'special',
          name: 'Repulsion Breath',
          description:
            'Strength Saving Throw: DC 23, each creature in a 30-foot Cone. Failure: Pushed up to 60 feet and Prone.',
          save: { ability: 'str', dc: 23 },
          onFail: [{ kind: 'condition', conditionId: 'prone' }],
          resolution: { caveats: ['Cone push not fully modeled.'] },
        },
        {
          kind: 'special',
          name: 'Spellcasting',
          description:
            'Charisma spell save DC 22, +14 spell attacks. At Will: Detect Magic, Guiding Bolt (level 2), Shapechange (Beast or Humanoid only; no temp HP; no concentration/temp HP to maintain), Speak with Animals, Thaumaturgy. 1/Day Each: Detect Thoughts, Control Water, Scrying, Water Breathing.',
          resolution: { caveats: ['Spell list not executed.'] },
        },
      ],
      resolution: { caveats: ['Lair XP 50,000 vs wandering 41,000 is flavor-only.'] },
    },
    lore: {
      alignment: 'lg',
      challengeRating: 22,
      xpValue: 41000,
      intelligence: 'high',
    },
  },
  {
    id: 'blink-dog',
    name: 'Blink Dog',
    type: 'fey',
    sizeCategory: 'medium',
    languages: [{ id: 'common' }],
    description: {
      short: 'A fey hound that flickers through the planes to harry prey.',
      long: 'Blink dogs hunt in disciplined packs on the edges of the Feywild, blinking short distances to outflank foes.',
    },
    mechanics: {
      hitPoints: { count: 4, die: 8, modifier: 4 },
      armorClass: { kind: 'natural' },
      movement: { ground: 40 },
      abilities: { str: 12, dex: 17, con: 12, int: 10, wis: 13, cha: 11 },
      proficiencies: {
        skills: { perception: { proficiencyLevel: 1 }, stealth: { proficiencyLevel: 1 } },
      },
      senses: {
        special: [{ type: 'darkvision', range: 60 }],
        passivePerception: 15,
      },
      proficiencyBonus: 2,
      resolution: {
        caveats: [
          'Languages: Blink Dog; understands Elvish and Sylvan but cannot speak them (not encoded as separate ids).',
        ],
      },
      actions: [
        {
          kind: 'natural',
          name: 'Bite',
          attackType: 'bite',
          attackBonus: 5,
          reach: 5,
          damage: '1d4',
          damageBonus: 3,
          damageType: 'piercing',
        },
      ],
      bonusActions: [
        {
          kind: 'special',
          name: 'Teleport',
          description:
            'Teleport (Recharge 4–6). The dog teleports up to 40 feet to an unoccupied space it can see.',
          recharge: { min: 4, max: 6 },
          resolution: { caveats: ['Recharge and teleport destination not automated.'] },
        },
      ],
    },
    lore: {
      alignment: 'lg',
      challengeRating: 0.25,
      xpValue: 50,
      intelligence: 'average',
    },
  },
  {
    id: 'blue-dragon-wyrmling',
    name: 'Blue Dragon Wyrmling',
    type: 'dragon',
    sizeCategory: 'medium',
    languages: [{ id: 'draconic' }],
    description: {
      short: 'A small blue dragon wyrmling — sparks and vanity in miniature.',
      long: 'Blue wyrmlings are already dangerous, testing their lightning breath on anything that trespasses.',
    },
    mechanics: {
      hitPoints: { count: 10, die: 8, modifier: 20 },
      armorClass: { kind: 'natural', offset: 7 },
      movement: { ground: 30, burrow: 15, fly: 60 },
      abilities: { str: 17, dex: 10, con: 15, int: 12, wis: 11, cha: 15 },
      proficiencies: {
        skills: { perception: { proficiencyLevel: 2 }, stealth: { proficiencyLevel: 1 } },
      },
      senses: {
        special: [
          { type: 'blindsight', range: 10 },
          { type: 'darkvision', range: 60 },
        ],
        passivePerception: 14,
      },
      proficiencyBonus: 2,
      immunities: ['lightning'],
      actions: [
        {
          kind: 'special',
          name: 'Multiattack',
          description: 'The dragon makes two Rend attacks.',
          sequence: [{ actionName: 'Rend', count: 2 }],
        },
        {
          kind: 'natural',
          name: 'Rend',
          attackType: 'claw',
          attackBonus: 5,
          reach: 5,
          damage: '1d10',
          damageBonus: 3,
          damageType: 'slashing',
          onHitEffects: [{ kind: 'damage', damage: '1d6', damageType: 'lightning' }],
        },
        {
          kind: 'special',
          name: 'Lightning Breath',
          description:
            'Dexterity Saving Throw: DC 12, each creature in a 30-foot-long, 5-foot-wide Line. Failure: 21 (6d6) Lightning damage. Success: Half damage.',
          save: { ability: 'dex', dc: 12 },
          damage: '6d6',
          damageType: 'lightning',
          halfDamageOnSave: true,
          recharge: { min: 5, max: 6 },
        },
      ],
    },
    lore: {
      alignment: 'le',
      challengeRating: 3,
      xpValue: 700,
      intelligence: 'average',
    },
  },
  {
    id: 'bone-devil',
    name: 'Bone Devil',
    type: 'fiend',
    sizeCategory: 'large',
    languages: [{ id: 'infernal' }],
    description: {
      short: 'A skeletal fiend with a scorpion tail and a diplomat’s cruel smile.',
      long: 'Bone devils serve as infernal officers and inquisitors, blending melee savagery with poison and fear.',
    },
    mechanics: {
      hitPoints: { count: 17, die: 10, modifier: 68 },
      armorClass: { kind: 'natural', offset: 3 },
      movement: { ground: 40, fly: 40 },
      abilities: { str: 18, dex: 16, con: 18, int: 13, wis: 14, cha: 16 },
      savingThrows: {
        str: { proficiencyLevel: 1 },
        dex: { proficiencyLevel: 1 },
        con: { proficiencyLevel: 1 },
        int: { proficiencyLevel: 1 },
        wis: { proficiencyLevel: 1 },
        cha: { proficiencyLevel: 1 },
      },
      proficiencies: {
        skills: { deception: { proficiencyLevel: 1 }, insight: { proficiencyLevel: 1 } },
      },
      senses: {
        special: [{ type: 'darkvision', range: 120, notes: 'Unimpeded by magical Darkness' }],
        passivePerception: 12,
      },
      proficiencyBonus: 4,
      resistances: ['cold'],
      immunities: ['fire', 'poison', 'poisoned'],
      resolution: {
        caveats: ['Telepathy 120 ft. not a separate language row.'],
      },
      traits: [
        {
          name: 'Diabolical Restoration',
          description:
            'If the devil dies outside the Nine Hells, its body disappears in sulfurous smoke, and it gains a new body instantly, reviving with all its Hit Points somewhere in the Nine Hells.',
          resolution: { caveats: ['Revival not enforced in encounter.'] },
        },
        {
          name: 'Magic Resistance',
          description:
            'The devil has Advantage on saving throws against spells and other magical effects.',
          resolution: { caveats: ['Advantage vs spells not automated.'] },
        },
      ],
      actions: [
        {
          kind: 'special',
          name: 'Multiattack',
          description: 'The devil makes two Claw attacks and one Infernal Sting attack.',
          sequence: [
            { actionName: 'Claw', count: 2 },
            { actionName: 'Infernal Sting', count: 1 },
          ],
        },
        {
          kind: 'natural',
          name: 'Claw',
          attackType: 'claw',
          attackBonus: 8,
          reach: 10,
          damage: '2d8',
          damageBonus: 4,
          damageType: 'slashing',
        },
        {
          kind: 'natural',
          name: 'Infernal Sting',
          attackType: 'tail',
          attackBonus: 8,
          reach: 10,
          damage: '2d10',
          damageBonus: 4,
          damageType: 'piercing',
          onHitEffects: [{ kind: 'damage', damage: '4d8', damageType: 'poison' }],
          notes:
            'Target has Poisoned until start of devil’s next turn; while Poisoned, target can’t regain Hit Points.',
        },
      ],
    },
    lore: {
      alignment: 'le',
      challengeRating: 9,
      xpValue: 5000,
      intelligence: 'high',
    },
  },
  {
    id: 'brass-dragon-wyrmling',
    name: 'Brass Dragon Wyrmling',
    type: 'dragon',
    sizeCategory: 'medium',
    languages: [{ id: 'draconic' }],
    description: {
      short: 'A talkative brass wyrmling — heat and curiosity in a small package.',
      long: 'Brass wyrmlings favor sun-baked badlands and are as likely to parley as to breathe flame or sleep gas.',
    },
    mechanics: {
      hitPoints: { count: 4, die: 8, modifier: 4 },
      armorClass: { kind: 'natural', offset: 5 },
      movement: { ground: 30, burrow: 15, fly: 60 },
      abilities: { str: 15, dex: 10, con: 13, int: 10, wis: 11, cha: 13 },
      proficiencies: {
        skills: { perception: { proficiencyLevel: 2 }, stealth: { proficiencyLevel: 1 } },
      },
      senses: {
        special: [
          { type: 'blindsight', range: 10 },
          { type: 'darkvision', range: 60 },
        ],
        passivePerception: 14,
      },
      proficiencyBonus: 2,
      immunities: ['fire'],
      actions: [
        {
          kind: 'natural',
          name: 'Rend',
          attackType: 'claw',
          attackBonus: 4,
          reach: 5,
          damage: '1d10',
          damageBonus: 2,
          damageType: 'slashing',
        },
        {
          kind: 'special',
          name: 'Fire Breath',
          description:
            'Dexterity Saving Throw: DC 11, each creature in a 20-foot-long, 5-foot-wide Line. Failure: 14 (4d6) Fire damage. Success: Half damage.',
          save: { ability: 'dex', dc: 11 },
          damage: '4d6',
          damageType: 'fire',
          halfDamageOnSave: true,
          recharge: { min: 5, max: 6 },
        },
        {
          kind: 'special',
          name: 'Sleep Breath',
          description:
            'Constitution Saving Throw: DC 11, each creature in a 15-foot Cone. Failure: Incapacitated until end of next turn, then repeat save; second failure Unconscious 1 minute (ends on damage or ally wake).',
          save: { ability: 'con', dc: 11 },
          resolution: { caveats: ['Sleep ladder not automated.'] },
        },
      ],
    },
    lore: {
      alignment: 'cg',
      challengeRating: 1,
      xpValue: 200,
      intelligence: 'average',
    },
  },
  {
    id: 'bronze-dragon-wyrmling',
    name: 'Bronze Dragon Wyrmling',
    type: 'dragon',
    sizeCategory: 'medium',
    languages: [{ id: 'draconic' }],
    description: {
      short: 'A coastal bronze wyrmling — curious, amphibious, and already dangerous.',
      long: 'Bronze wyrmlings patrol shorelines and shallows, mixing lightning breath with repulsive waves of force.',
    },
    mechanics: {
      hitPoints: { count: 6, die: 8, modifier: 12 },
      armorClass: { kind: 'natural', offset: 5 },
      movement: { ground: 30, fly: 60, swim: 30 },
      abilities: { str: 17, dex: 10, con: 15, int: 12, wis: 11, cha: 15 },
      proficiencies: {
        skills: { perception: { proficiencyLevel: 2 }, stealth: { proficiencyLevel: 1 } },
      },
      senses: {
        special: [
          { type: 'blindsight', range: 10 },
          { type: 'darkvision', range: 60 },
        ],
        passivePerception: 14,
      },
      proficiencyBonus: 2,
      immunities: ['lightning'],
      traits: [
        {
          name: 'Amphibious',
          description: 'The dragon can breathe air and water.',
        },
      ],
      actions: [
        {
          kind: 'special',
          name: 'Multiattack',
          description: 'The dragon makes two Rend attacks.',
          sequence: [{ actionName: 'Rend', count: 2 }],
        },
        {
          kind: 'natural',
          name: 'Rend',
          attackType: 'claw',
          attackBonus: 5,
          reach: 5,
          damage: '1d10',
          damageBonus: 3,
          damageType: 'slashing',
        },
        {
          kind: 'special',
          name: 'Lightning Breath',
          description:
            'Dexterity Saving Throw: DC 12, each creature in a 40-foot-long, 5-foot-wide Line. Failure: 16 (3d10) Lightning damage. Success: Half damage.',
          save: { ability: 'dex', dc: 12 },
          damage: '3d10',
          damageType: 'lightning',
          halfDamageOnSave: true,
          recharge: { min: 5, max: 6 },
        },
        {
          kind: 'special',
          name: 'Repulsion Breath',
          description:
            'Strength Saving Throw: DC 12, each creature in a 30-foot Cone. Failure: Pushed up to 30 feet away and Prone.',
          save: { ability: 'str', dc: 12 },
          onFail: [{ kind: 'condition', conditionId: 'prone' }],
          resolution: { caveats: ['Cone push not fully modeled.'] },
        },
      ],
    },
    lore: {
      alignment: 'lg',
      challengeRating: 2,
      xpValue: 450,
      intelligence: 'average',
    },
  },
  {
    id: 'bugbear-stalker',
    name: 'Bugbear Stalker',
    type: 'fey',
    subtype: 'goblinoid',
    sizeCategory: 'medium',
    languages: [{ id: 'common' }, { id: 'goblin' }],
    description: {
      short: 'A fey bugbear ambusher that pins prey with javelins and a brutal morningstar.',
      long: 'Bugbear stalkers blend goblinoid cunning with fey swiftness, favoring hit-and-run strikes and cruel grapples.',
    },
    mechanics: {
      hitPoints: { count: 10, die: 8, modifier: 20 },
      armorClass: { kind: 'equipment', armorRefs: ['chain-shirt'] },
      movement: { ground: 30 },
      abilities: { str: 17, dex: 14, con: 14, int: 11, wis: 12, cha: 11 },
      proficiencies: {
        skills: { stealth: { proficiencyLevel: 2 }, survival: { proficiencyLevel: 1 } },
        weapons: { javelin: { proficiencyLevel: 1 }, morningstar: { proficiencyLevel: 1 } },
      },
      senses: {
        special: [{ type: 'darkvision', range: 60 }],
        passivePerception: 11,
      },
      proficiencyBonus: 2,
      traits: [
        {
          name: 'Abduct',
          description:
            'The bugbear needn’t spend extra movement to move a creature it is grappling.',
          trigger: { kind: 'while-moving-grappled-creature' },
          effects: [{ kind: 'move', ignoresExtraCostForGrappledCreature: true }],
        },
      ],
      actions: [
        {
          kind: 'special',
          name: 'Multiattack',
          description: 'The bugbear makes two Javelin or Morningstar attacks.',
          sequence: [{ actionName: 'Javelin', count: 2 }],
          notes: 'Each attack may be a Morningstar instead.',
        },
        { kind: 'weapon', weaponRef: 'javelin' },
        { kind: 'weapon', weaponRef: 'morningstar' },
      ],
      bonusActions: [
        {
          kind: 'special',
          name: 'Quick Grapple',
          description:
            'Dexterity Saving Throw: DC 13, one Medium or smaller creature within 10 feet. Failure: Grappled (escape DC 13).',
          save: { ability: 'dex', dc: 13 },
          onFail: [{ kind: 'condition', conditionId: 'grappled', targetSizeMax: 'medium', escapeDc: 13 }],
        },
      ],
      equipment: {
        weapons: {
          javelin: {
            weaponId: 'javelin',
            attackBonus: 5,
            damageOverride: '3d6',
            damageBonus: 3,
            reach: 10,
            notes: 'Melee or ranged 30/120 ft.; Gear lists six javelins.',
          },
          morningstar: {
            weaponId: 'morningstar',
            attackBonus: 5,
            damageBonus: 3,
            reach: 10,
            notes: 'Melee Attack +5 with Advantage if target is Grappled by the bugbear.',
          },
        },
        armor: {
          'chain-shirt': { armorId: 'chain-shirt' },
        },
      },
    },
    lore: {
      alignment: 'ce',
      challengeRating: 3,
      xpValue: 700,
      intelligence: 'average',
    },
  },
  {
    id: 'bugbear-warrior',
    name: 'Bugbear Warrior',
    type: 'fey',
    sizeCategory: 'medium',
    languages: [{ id: 'common' }, { id: 'goblin' }],
    description: {
      short: 'Stealthy, brutish goblinoids that delight in ambush and cruelty.',
      long: 'Bugbears are the largest of the goblinoid races, combining brute strength with a surprising talent for stealth. They prefer ambush over direct confrontation and bully weaker creatures into servitude.',
    },
    mechanics: {
      hitPoints: {
        count: 6,
        die: 8,
        modifier: +6,
      },
      armorClass: { kind: 'equipment', armorRefs: ['hide'] },
      movement: { ground: 30 },
      actions: [
        {
          kind: 'special',
          name: 'Grab',
          attackBonus: 4,
          reach: 10,
          damage: '2d6',
          damageBonus: 2,
          damageType: 'bludgeoning',
          description: 'If the target is a Medium or smaller creature, it has the Grappled condition with an escape DC of 12.',
          onSuccess: [
            { kind: 'condition', conditionId: 'grappled', targetSizeMax: 'medium', escapeDc: 12 },
          ],
        },
        { kind: 'weapon', weaponRef: 'light-hammer' },
      ],
      traits: [
        {
          name: 'Abduct',
          description:
            'The bugbear needn’t spend extra movement to move a creature it is grappling.',
          trigger: {
            kind: 'while-moving-grappled-creature',
          },
          effects: [
            {
              kind: 'move',
              ignoresExtraCostForGrappledCreature: true,
            },
          ],
        },
      ],
      proficiencies: {
        skills: { stealth: { proficiencyLevel: 2 }, survival: { proficiencyLevel: 1 } },
        weapons: { 'light-hammer': { proficiencyLevel: 1 } },
      },
      proficiencyBonus: 2,
      equipment: {
        weapons: {
          'light-hammer': {
            weaponId: 'light-hammer',
            attackBonus: 4,
            damageOverride: '3d4',
            reach: 10,
            notes: 'Has advantage if the target is grappled by the bugbear.',
          },
        },
        armor: {
          hide: { armorId: 'hide' },
        },
      },
      senses: {
        special: [{ type: 'darkvision', range: 60 }],
        passivePerception: 10,
      },
      abilities: { str: 15, dex: 14, con: 13, int: 8, wis: 11, cha: 9 },
    },
    lore: {
      alignment: 'ce',
      challengeRating: 1,
      xpValue: 200,
      intelligence: 'average',
    },
  },
  {
    id: 'young-blue-dragon',
    name: 'Young Blue Dragon',
    type: 'dragon',
    sizeCategory: 'large',
    languages: [{ id: 'common' }, { id: 'draconic' }],
    description: {
      short: 'A young blue dragon — storms follow in its wake.',
      long: 'Young blue dragons claim stretches of desert and badland, refining cruelty and hoarding slaves.',
    },
    mechanics: {
      hitPoints: { count: 16, die: 10, modifier: 64 },
      armorClass: { kind: 'natural', offset: 8 },
      movement: { ground: 40, burrow: 20, fly: 80 },
      abilities: { str: 21, dex: 10, con: 19, int: 14, wis: 13, cha: 17 },
      savingThrows: {
        dex: { proficiencyLevel: 1 },
        con: { proficiencyLevel: 1 },
        wis: { proficiencyLevel: 1 },
        cha: { proficiencyLevel: 1 },
      },
      proficiencies: {
        skills: { perception: { proficiencyLevel: 2 }, stealth: { proficiencyLevel: 1 } },
      },
      senses: {
        special: [
          { type: 'blindsight', range: 30 },
          { type: 'darkvision', range: 120 },
        ],
        passivePerception: 19,
      },
      proficiencyBonus: 4,
      immunities: ['lightning'],
      actions: [
        {
          kind: 'special',
          name: 'Multiattack',
          description: 'The dragon makes three Rend attacks.',
          sequence: [{ actionName: 'Rend', count: 3 }],
        },
        {
          kind: 'natural',
          name: 'Rend',
          attackType: 'claw',
          attackBonus: 9,
          reach: 10,
          damage: '2d6',
          damageBonus: 5,
          damageType: 'slashing',
          onHitEffects: [{ kind: 'damage', damage: '1d10', damageType: 'lightning' }],
        },
        {
          kind: 'special',
          name: 'Lightning Breath',
          description:
            'Dexterity Saving Throw: DC 16, each creature in a 60-foot-long, 5-foot-wide Line. Failure: 55 (10d10) Lightning damage. Success: Half damage.',
          save: { ability: 'dex', dc: 16 },
          damage: '10d10',
          damageType: 'lightning',
          halfDamageOnSave: true,
          recharge: { min: 5, max: 6 },
        },
      ],
    },
    lore: {
      alignment: 'le',
      challengeRating: 9,
      xpValue: 5000,
      intelligence: 'average',
    },
  },
  {
    id: 'young-brass-dragon',
    name: 'Young Brass Dragon',
    type: 'dragon',
    sizeCategory: 'large',
    languages: [{ id: 'common' }, { id: 'draconic' }],
    description: {
      short: 'A young brass dragon — heat, wind, and wheedling pride.',
      long: 'Young brass dragons carve territories in sun-blasted wastes, mixing fire with soporific breath.',
    },
    mechanics: {
      hitPoints: { count: 13, die: 10, modifier: 39 },
      armorClass: { kind: 'natural', offset: 7 },
      movement: { ground: 40, burrow: 20, fly: 80 },
      abilities: { str: 19, dex: 10, con: 17, int: 12, wis: 11, cha: 15 },
      savingThrows: {
        dex: { proficiencyLevel: 1 },
        con: { proficiencyLevel: 1 },
        wis: { proficiencyLevel: 1 },
        cha: { proficiencyLevel: 1 },
      },
      proficiencies: {
        skills: {
          perception: { proficiencyLevel: 2 },
          persuasion: { proficiencyLevel: 1 },
          stealth: { proficiencyLevel: 1 },
        },
      },
      senses: {
        special: [
          { type: 'blindsight', range: 30 },
          { type: 'darkvision', range: 120 },
        ],
        passivePerception: 16,
      },
      proficiencyBonus: 3,
      immunities: ['fire'],
      actions: [
        {
          kind: 'special',
          name: 'Multiattack',
          description:
            'The dragon makes three Rend attacks. It can replace two attacks with a use of Sleep Breath.',
          sequence: [{ actionName: 'Rend', count: 3 }],
          notes: 'Two attacks may be replaced by one Sleep Breath use.',
        },
        {
          kind: 'natural',
          name: 'Rend',
          attackType: 'claw',
          attackBonus: 7,
          reach: 10,
          damage: '2d10',
          damageBonus: 4,
          damageType: 'slashing',
        },
        {
          kind: 'special',
          name: 'Fire Breath',
          description:
            'Dexterity Saving Throw: DC 14, each creature in a 40-foot-long, 5-foot-wide Line. Failure: 38 (11d6) Fire damage. Success: Half damage.',
          save: { ability: 'dex', dc: 14 },
          damage: '11d6',
          damageType: 'fire',
          halfDamageOnSave: true,
          recharge: { min: 5, max: 6 },
        },
        {
          kind: 'special',
          name: 'Sleep Breath',
          description:
            'Constitution Saving Throw: DC 14, each creature in a 30-foot Cone. Failure: Incapacitated then repeat; second failure Unconscious 1 minute.',
          save: { ability: 'con', dc: 14 },
          resolution: { caveats: ['Sleep ladder not automated.'] },
        },
      ],
    },
    lore: {
      alignment: 'cg',
      challengeRating: 6,
      xpValue: 2300,
      intelligence: 'average',
    },
  },
  {
    id: 'young-bronze-dragon',
    name: 'Young Bronze Dragon',
    type: 'dragon',
    sizeCategory: 'large',
    languages: [{ id: 'common' }, { id: 'draconic' }],
    description: {
      short: 'A young bronze dragon — guardian of coasts and shoals.',
      long: 'Young bronze dragons challenge ships and serpents alike, mastering lightning and repulsive breath.',
    },
    mechanics: {
      hitPoints: { count: 15, die: 10, modifier: 60 },
      armorClass: { kind: 'natural', offset: 7 },
      movement: { ground: 40, fly: 80, swim: 40 },
      abilities: { str: 21, dex: 10, con: 19, int: 14, wis: 13, cha: 17 },
      savingThrows: {
        dex: { proficiencyLevel: 1 },
        con: { proficiencyLevel: 1 },
        wis: { proficiencyLevel: 1 },
        cha: { proficiencyLevel: 1 },
      },
      proficiencies: {
        skills: { insight: { proficiencyLevel: 1 }, perception: { proficiencyLevel: 2 }, stealth: { proficiencyLevel: 1 } },
      },
      senses: {
        special: [
          { type: 'blindsight', range: 30 },
          { type: 'darkvision', range: 120 },
        ],
        passivePerception: 17,
      },
      proficiencyBonus: 3,
      immunities: ['lightning'],
      traits: [
        {
          name: 'Amphibious',
          description: 'The dragon can breathe air and water.',
        },
      ],
      actions: [
        {
          kind: 'special',
          name: 'Multiattack',
          description:
            'The dragon makes three Rend attacks. It can replace one attack with a use of Repulsion Breath.',
          sequence: [{ actionName: 'Rend', count: 3 }],
        },
        {
          kind: 'natural',
          name: 'Rend',
          attackType: 'claw',
          attackBonus: 8,
          reach: 10,
          damage: '2d10',
          damageBonus: 5,
          damageType: 'slashing',
        },
        {
          kind: 'special',
          name: 'Lightning Breath',
          description:
            'Dexterity Saving Throw: DC 15, each creature in a 60-foot-long, 5-foot-wide Line. Failure: 49 (9d10) Lightning damage. Success: Half damage.',
          save: { ability: 'dex', dc: 15 },
          damage: '9d10',
          damageType: 'lightning',
          halfDamageOnSave: true,
          recharge: { min: 5, max: 6 },
        },
        {
          kind: 'special',
          name: 'Repulsion Breath',
          description:
            'Strength Saving Throw: DC 15, each creature in a 30-foot Cone. Failure: Pushed up to 40 feet away and Prone.',
          save: { ability: 'str', dc: 15 },
          onFail: [{ kind: 'condition', conditionId: 'prone' }],
          resolution: { caveats: ['Cone push not fully modeled.'] },
        },
      ],
    },
    lore: {
      alignment: 'lg',
      challengeRating: 8,
      xpValue: 3900,
      intelligence: 'average',
    },
  },
];

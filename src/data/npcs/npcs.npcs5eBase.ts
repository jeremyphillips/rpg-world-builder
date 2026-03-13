export type Npcs5eBase = Record<string, unknown> & { id: string }

export const npcs5eBase: readonly Npcs5eBase[] = [
  /* ────────────────────────────── */
  /* Commoners & Laborers           */
  /* ────────────────────────────── */
  {
    type: 'npc',
    edition: '5e',
    name: 'Commoner',
    id: 'commoner',
    race: 'Human',
    alignment: 'n',
    classes: [{ classId: 'fighter', level: 1 }],
    totalLevel: 1,
    xp: 0,
    abilityScores: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
    hitPoints: { total: 4 }
  },
  {
    type: 'npc',
    edition: '5e',
    name: 'Farmhand',
    id: 'farmhand',
    race: 'Human',
    alignment: 'ng',
    classes: [{ classId: 'fighter', level: 1 }],
    totalLevel: 1,
    xp: 0,
    abilityScores: { strength: 12, dexterity: 10, constitution: 11, intelligence: 9, wisdom: 10, charisma: 9 }
  },
  {
    type: 'npc',
    edition: '5e',
    name: 'Servant',
    id: 'servant',
    race: 'Human',
    alignment: 'n',
    classes: [{ classId: 'rogue', level: 1 }],
    totalLevel: 1,
    xp: 0,
    abilityScores: { strength: 9, dexterity: 12, constitution: 10, intelligence: 10, wisdom: 10, charisma: 11 }
  },

  /* ────────────────────────────── */
  /* Guards & Soldiers              */
  /* ────────────────────────────── */
  {
    type: 'npc',
    edition: '5e',
    name: 'Guard',
    id: 'guard',
    race: 'Human',
    alignment: 'ln',
    classes: [{ classId: 'fighter', level: 1 }],
    totalLevel: 1,
    xp: 0,
    abilityScores: { strength: 13, dexterity: 12, constitution: 12, intelligence: 10, wisdom: 11, charisma: 10 },
    hitPoints: { total: 11 },
    equipment: { weapons: ['spear', 'shortsword'] }
  },
  {
    type: 'npc',
    edition: '5e',
    name: 'City Guard',
    id: 'city-guard',
    race: 'Human',
    alignment: 'ln',
    classes: [{ classId: 'fighter', level: 2 }],
    totalLevel: 2,
    xp: 300,
    abilityScores: { strength: 14, dexterity: 12, constitution: 13, intelligence: 10, wisdom: 11, charisma: 10 },
    hitPoints: { total: 20 },
    equipment: { weapons: ['longsword', 'light-crossbow'] }
  },
  {
    type: 'npc',
    edition: '5e',
    name: 'Veteran',
    id: 'veteran',
    race: 'Human',
    alignment: 'ln',
    classes: [{ classId: 'fighter', level: 6 }],
    totalLevel: 6,
    xp: 14000,
    abilityScores: { strength: 16, dexterity: 13, constitution: 14, intelligence: 10, wisdom: 11, charisma: 10 },
    hitPoints: { total: 58 },
    equipment: { weapons: ['longsword', 'shortsword', 'longbow'] }
  },
  {
    type: 'npc',
    edition: '5e',
    name: 'Knight',
    id: 'knight',
    race: 'Human',
    alignment: 'lg',
    classes: [{ classId: 'fighter', level: 5 }],
    totalLevel: 5,
    xp: 6500,
    abilityScores: { strength: 16, dexterity: 11, constitution: 14, intelligence: 11, wisdom: 11, charisma: 15 },
    hitPoints: { total: 52 },
    equipment: { weapons: ['greatsword', 'lance', 'longsword'] }
  },
  {
    type: 'npc',
    edition: '5e',
    name: 'Mercenary',
    id: 'mercenary',
    race: 'Human',
    alignment: 'tn',
    classes: [{ classId: 'fighter', level: 3 }],
    totalLevel: 3,
    xp: 900,
    abilityScores: { strength: 15, dexterity: 12, constitution: 14, intelligence: 10, wisdom: 10, charisma: 9 },
    hitPoints: { total: 28 },
    equipment: { weapons: ['battleaxe', 'handaxe'] }
  },

  /* ────────────────────────────── */
  /* Criminals & Rogues              */
  /* ────────────────────────────── */
  {
    type: 'npc',
    edition: '5e',
    name: 'Bandit',
    id: 'bandit',
    race: 'Human',
    alignment: 'ce',
    classes: [{ classId: 'rogue', level: 1 }],
    totalLevel: 1,
    xp: 0,
    abilityScores: { strength: 11, dexterity: 12, constitution: 12, intelligence: 10, wisdom: 10, charisma: 10 },
    hitPoints: { total: 11 },
    equipment: { weapons: ['shortsword', 'shortbow'] }
  },
  {
    type: 'npc',
    edition: '5e',
    name: 'Thug',
    id: 'thug',
    race: 'Human',
    alignment: 'ne',
    classes: [{ classId: 'fighter', level: 2 }],
    totalLevel: 2,
    xp: 300,
    abilityScores: { strength: 15, dexterity: 11, constitution: 14, intelligence: 10, wisdom: 10, charisma: 9 },
    hitPoints: { total: 32 },
    equipment: { weapons: ['mace', 'heavy-crossbow'] }
  },
  {
    type: 'npc',
    edition: '5e',
    name: 'Spy',
    id: 'spy',
    race: 'Human',
    alignment: 'cn',
    classes: [{ classId: 'rogue', level: 3 }],
    totalLevel: 3,
    xp: 900,
    abilityScores: { strength: 10, dexterity: 15, constitution: 10, intelligence: 12, wisdom: 14, charisma: 16 },
    hitPoints: { total: 27 },
    equipment: { weapons: ['shortsword', 'hand-crossbow'], gear: ['thieves-tools'] }
  },
  {
    type: 'npc',
    edition: '5e',
    name: 'Assassin',
    id: 'assassin',
    race: 'Human',
    alignment: 'le',
    classes: [{ classId: 'rogue', level: 8 }],
    totalLevel: 8,
    xp: 34000,
    abilityScores: { strength: 11, dexterity: 16, constitution: 10, intelligence: 13, wisdom: 11, charisma: 10 },
    hitPoints: { total: 78 },
    equipment: { weapons: ['shortsword', 'hand-crossbow'], gear: ['thieves-tools'] }
  },
  {
    type: 'npc',
    edition: '5e',
    name: 'Pickpocket',
    id: 'pickpocket',
    race: 'Halfling',
    alignment: 'cn',
    classes: [{ classId: 'rogue', level: 2 }],
    totalLevel: 2,
    xp: 300,
    abilityScores: { strength: 8, dexterity: 16, constitution: 10, intelligence: 12, wisdom: 10, charisma: 14 },
    hitPoints: { total: 17 },
    equipment: { weapons: ['dagger'], gear: ['thieves-tools'] }
  },

  /* ────────────────────────────── */
  /* Religious & Faithful            */
  /* ────────────────────────────── */
  {
    type: 'npc',
    edition: '5e',
    name: 'Acolyte',
    id: 'acolyte',
    race: 'Human',
    alignment: 'lg',
    classes: [{ classId: 'cleric', level: 2 }],
    totalLevel: 2,
    xp: 300,
    abilityScores: { strength: 10, dexterity: 10, constitution: 12, intelligence: 13, wisdom: 16, charisma: 12 },
    hitPoints: { total: 22 },
    equipment: { weapons: ['mace', 'light-crossbow'] }
  },
  {
    type: 'npc',
    edition: '5e',
    name: 'Priest',
    id: 'priest',
    race: 'Human',
    alignment: 'lg',
    classes: [{ classId: 'cleric', level: 5 }],
    totalLevel: 5,
    xp: 6500,
    abilityScores: { strength: 12, dexterity: 10, constitution: 12, intelligence: 13, wisdom: 17, charisma: 13 },
    hitPoints: { total: 39 },
    equipment: { weapons: ['mace', 'warhammer'] }
  },
  {
    type: 'npc',
    edition: '5e',
    name: 'Cultist',
    id: 'cultist',
    race: 'Human',
    alignment: 'ne',
    classes: [{ classId: 'warlock', level: 1 }],
    totalLevel: 1,
    xp: 0,
    abilityScores: { strength: 11, dexterity: 12, constitution: 10, intelligence: 10, wisdom: 11, charisma: 14 },
    hitPoints: { total: 9 },
    equipment: { weapons: ['dagger', 'scimitar'] }
  },
  {
    type: 'npc',
    edition: '5e',
    name: 'Temple Guard',
    id: 'temple-guard',
    race: 'Human',
    alignment: 'lg',
    classes: [{ classId: 'paladin', level: 3 }],
    totalLevel: 3,
    xp: 900,
    abilityScores: { strength: 15, dexterity: 10, constitution: 14, intelligence: 10, wisdom: 12, charisma: 12 },
    hitPoints: { total: 31 },
    equipment: { weapons: ['longsword', 'spear'] }
  },

  /* ────────────────────────────── */
  /* Arcane Spellcasters             */
  /* ────────────────────────────── */
  {
    type: 'npc',
    edition: '5e',
    name: 'Apprentice Wizard',
    id: 'apprentice-wizard',
    race: 'Human',
    alignment: 'tn',
    classes: [{ classId: 'wizard', level: 1 }],
    totalLevel: 1,
    xp: 0,
    abilityScores: { strength: 8, dexterity: 14, constitution: 12, intelligence: 15, wisdom: 10, charisma: 10 },
    hitPoints: { total: 8 },
    equipment: { weapons: ['quarterstaff', 'dagger'], gear: ['spellbook-blank'] }
  },
  {
    type: 'npc',
    edition: '5e',
    name: 'Mage',
    id: 'mage',
    race: 'Human',
    alignment: 'n',
    classes: [{ classId: 'wizard', level: 6 }],
    totalLevel: 6,
    xp: 14000,
    abilityScores: { strength: 9, dexterity: 14, constitution: 11, intelligence: 17, wisdom: 12, charisma: 11 },
    hitPoints: { total: 40 },
    equipment: { weapons: ['dagger', 'quarterstaff'], gear: ['spellbook-blank'] }
  },
  {
    type: 'npc',
    edition: '5e',
    name: 'Archmage',
    id: 'archmage',
    race: 'Human',
    alignment: 'n',
    classes: [{ classId: 'wizard', level: 18 }],
    totalLevel: 18,
    xp: 265000,
    abilityScores: { strength: 10, dexterity: 14, constitution: 12, intelligence: 20, wisdom: 15, charisma: 16 },
    hitPoints: { total: 99 },
    equipment: { weapons: ['dagger', 'quarterstaff'], gear: ['spellbook-blank'] }
  },
  {
    type: 'npc',
    edition: '5e',
    name: 'Sorcerer',
    id: 'sorcerer',
    race: 'Half-Elf',
    alignment: 'cn',
    classes: [{ classId: 'sorcerer', level: 4 }],
    totalLevel: 4,
    xp: 2700,
    abilityScores: { strength: 9, dexterity: 14, constitution: 12, intelligence: 10, wisdom: 11, charisma: 16 },
    hitPoints: { total: 27 },
    equipment: { weapons: ['dagger', 'light-crossbow'] }
  },
  {
    type: 'npc',
    edition: '5e',
    name: 'Warlock',
    id: 'warlock',
    race: 'Tiefling',
    alignment: 'ne',
    classes: [{ classId: 'warlock', level: 4 }],
    totalLevel: 4,
    xp: 2700,
    abilityScores: { strength: 8, dexterity: 12, constitution: 12, intelligence: 13, wisdom: 10, charisma: 17 },
    hitPoints: { total: 31 },
    equipment: { weapons: ['dagger', 'light-crossbow'] }
  },

  /* ────────────────────────────── */
  /* Skilled Trades & Merchants     */
  /* ────────────────────────────── */
  {
    type: 'npc',
    edition: '5e',
    name: 'Blacksmith',
    id: 'blacksmith',
    race: 'Dwarf',
    alignment: 'ln',
    classes: [{ classId: 'fighter', level: 3 }],
    totalLevel: 3,
    xp: 900,
    abilityScores: { strength: 16, dexterity: 10, constitution: 15, intelligence: 10, wisdom: 10, charisma: 9 },
    hitPoints: { total: 31 },
    equipment: { weapons: ['warhammer', 'light-hammer'] }
  },
  {
    type: 'npc',
    edition: '5e',
    name: 'Merchant',
    id: 'merchant',
    race: 'Human',
    alignment: 'tn',
    classes: [{ classId: 'rogue', level: 2 }],
    totalLevel: 2,
    xp: 300,
    abilityScores: { strength: 10, dexterity: 12, constitution: 11, intelligence: 13, wisdom: 12, charisma: 14 },
    hitPoints: { total: 17 }
  },
  {
    type: 'npc',
    edition: '5e',
    name: 'Innkeeper',
    id: 'innkeeper',
    race: 'Human',
    alignment: 'ng',
    classes: [{ classId: 'rogue', level: 2 }],
    totalLevel: 2,
    xp: 300,
    abilityScores: { strength: 12, dexterity: 11, constitution: 13, intelligence: 11, wisdom: 12, charisma: 14 },
    hitPoints: { total: 22 },
    equipment: { weapons: ['club'] }
  },
  {
    type: 'npc',
    edition: '5e',
    name: 'Sage',
    id: 'sage',
    race: 'Human',
    alignment: 'n',
    classes: [{ classId: 'wizard', level: 4 }],
    totalLevel: 4,
    xp: 2700,
    abilityScores: { strength: 8, dexterity: 10, constitution: 10, intelligence: 18, wisdom: 14, charisma: 12 },
    hitPoints: { total: 22 },
    equipment: { weapons: ['quarterstaff'], gear: ['book'] }
  },
  {
    type: 'npc',
    edition: '5e',
    name: 'Herbalist',
    id: 'herbalist',
    race: 'Half-Elf',
    alignment: 'ng',
    classes: [{ classId: 'druid', level: 3 }],
    totalLevel: 3,
    xp: 900,
    abilityScores: { strength: 10, dexterity: 12, constitution: 12, intelligence: 14, wisdom: 16, charisma: 10 },
    hitPoints: { total: 24 }
  },

  /* ────────────────────────────── */
  /* Nobility & Leadership          */
  /* ────────────────────────────── */
  {
    type: 'npc',
    edition: '5e',
    name: 'Noble',
    id: 'noble',
    race: 'Human',
    alignment: 'ln',
    classes: [{ classId: 'bard', level: 1 }],
    totalLevel: 1,
    xp: 0,
    abilityScores: { strength: 10, dexterity: 12, constitution: 11, intelligence: 14, wisdom: 13, charisma: 16 },
    hitPoints: { total: 9 },
    equipment: { weapons: ['rapier'] }
  },
  {
    type: 'npc',
    edition: '5e',
    name: 'Courtier',
    id: 'courtier',
    race: 'Human',
    alignment: 'tn',
    classes: [{ classId: 'rogue', level: 4 }],
    totalLevel: 4,
    xp: 2700,
    abilityScores: { strength: 10, dexterity: 14, constitution: 10, intelligence: 14, wisdom: 12, charisma: 16 },
    hitPoints: { total: 27 },
    equipment: { weapons: ['rapier', 'dagger'] }
  },
  {
    type: 'npc',
    edition: '5e',
    name: 'Aristocrat',
    id: 'aristocrat',
    race: 'Human',
    alignment: 'le',
    classes: [{ classId: 'fighter', level: 4 }],
    totalLevel: 4,
    xp: 2700,
    abilityScores: { strength: 12, dexterity: 12, constitution: 12, intelligence: 13, wisdom: 11, charisma: 15 },
    hitPoints: { total: 36 },
    equipment: { weapons: ['rapier', 'shortsword'] }
  },

  /* ────────────────────────────── */
  /* Wilderness & Frontier           */
  /* ────────────────────────────── */
  {
    type: 'npc',
    edition: '5e',
    name: 'Scout',
    id: 'scout',
    race: 'Human',
    alignment: 'tn',
    classes: [{ classId: 'ranger', level: 2 }],
    totalLevel: 2,
    xp: 300,
    abilityScores: { strength: 12, dexterity: 14, constitution: 12, intelligence: 11, wisdom: 13, charisma: 9 },
    hitPoints: { total: 22 },
    equipment: { weapons: ['shortsword', 'shortbow'] }
  },
  {
    type: 'npc',
    edition: '5e',
    name: 'Hunter',
    id: 'hunter',
    race: 'Human',
    alignment: 'ng',
    classes: [{ classId: 'ranger', level: 4 }],
    totalLevel: 4,
    xp: 2700,
    abilityScores: { strength: 14, dexterity: 16, constitution: 14, intelligence: 10, wisdom: 14, charisma: 9 },
    hitPoints: { total: 36 },
    equipment: { weapons: ['longbow', 'shortsword'] }
  },
  {
    type: 'npc',
    edition: '5e',
    name: 'Druid',
    id: 'druid',
    race: 'Human',
    alignment: 'tn',
    classes: [{ classId: 'druid', level: 4 }],
    totalLevel: 4,
    xp: 2700,
    abilityScores: { strength: 10, dexterity: 12, constitution: 13, intelligence: 12, wisdom: 17, charisma: 11 },
    hitPoints: { total: 31 }
  },
  {
    type: 'npc',
    edition: '5e',
    name: 'Barbarian Warrior',
    id: 'barbarian-warrior',
    race: 'Human',
    alignment: 'cn',
    classes: [{ classId: 'barbarian', level: 5 }],
    totalLevel: 5,
    xp: 6500,
    abilityScores: { strength: 18, dexterity: 14, constitution: 16, intelligence: 9, wisdom: 12, charisma: 9 },
    hitPoints: { total: 55 },
    equipment: { weapons: ['greataxe', 'handaxe'] }
  },
  {
    type: 'npc',
    edition: '5e',
    name: 'Trapper',
    id: 'trapper',
    race: 'Human',
    alignment: 'n',
    classes: [{ classId: 'ranger', level: 3 }],
    totalLevel: 3,
    xp: 900,
    abilityScores: { strength: 13, dexterity: 14, constitution: 12, intelligence: 11, wisdom: 13, charisma: 8 },
    hitPoints: { total: 28 },
    equipment: { weapons: ['shortbow', 'handaxe'] }
  },

  /* ────────────────────────────── */
  /* Entertainers & Bards           */
  /* ────────────────────────────── */
  {
    type: 'npc',
    edition: '5e',
    name: 'Bard',
    id: 'bard',
    race: 'Human',
    alignment: 'cn',
    classes: [{ classId: 'bard', level: 4 }],
    totalLevel: 4,
    xp: 2700,
    abilityScores: { strength: 10, dexterity: 14, constitution: 12, intelligence: 12, wisdom: 10, charisma: 16 },
    hitPoints: { total: 27 },
    equipment: { weapons: ['rapier', 'dagger'] }
  },
  {
    type: 'npc',
    edition: '5e',
    name: 'Minstrel',
    id: 'minstrel',
    race: 'Half-Elf',
    alignment: 'cg',
    classes: [{ classId: 'bard', level: 2 }],
    totalLevel: 2,
    xp: 300,
    abilityScores: { strength: 9, dexterity: 14, constitution: 11, intelligence: 12, wisdom: 10, charisma: 15 },
    hitPoints: { total: 18 },
    equipment: { weapons: ['rapier'] }
  },
  {
    type: 'npc',
    edition: '5e',
    name: 'Jester',
    id: 'jester',
    race: 'Gnome',
    alignment: 'cn',
    classes: [{ classId: 'bard', level: 3 }],
    totalLevel: 3,
    xp: 900,
    abilityScores: { strength: 8, dexterity: 16, constitution: 11, intelligence: 14, wisdom: 10, charisma: 15 },
    hitPoints: { total: 21 },
    equipment: { weapons: ['dagger'] }
  },

  /* ────────────────────────────── */
  /* Martial Artists & Monks        */
  /* ────────────────────────────── */
  {
    type: 'npc',
    edition: '5e',
    name: 'Monk',
    id: 'monk',
    race: 'Human',
    alignment: 'lg',
    classes: [{ classId: 'monk', level: 5 }],
    totalLevel: 5,
    xp: 6500,
    abilityScores: { strength: 12, dexterity: 16, constitution: 14, intelligence: 10, wisdom: 16, charisma: 10 },
    hitPoints: { total: 38 }
  },
  {
    type: 'npc',
    edition: '5e',
    name: 'Martial Artist',
    id: 'martial-artist',
    race: 'Human',
    alignment: 'ln',
    classes: [{ classId: 'monk', level: 3 }],
    totalLevel: 3,
    xp: 900,
    abilityScores: { strength: 12, dexterity: 15, constitution: 13, intelligence: 10, wisdom: 14, charisma: 9 },
    hitPoints: { total: 24 }
  },

  /* ────────────────────────────── */
  /* Aquatic & Seafaring             */
  /* ────────────────────────────── */
  {
    type: 'npc',
    edition: '5e',
    name: 'Sailor',
    id: 'sailor',
    race: 'Human',
    alignment: 'cn',
    classes: [{ classId: 'fighter', level: 1 }],
    totalLevel: 1,
    xp: 0,
    abilityScores: { strength: 14, dexterity: 12, constitution: 13, intelligence: 10, wisdom: 11, charisma: 10 },
    hitPoints: { total: 12 },
    equipment: { weapons: ['shortsword', 'light-crossbow'] }
  },
  {
    type: 'npc',
    edition: '5e',
    name: 'Pirate',
    id: 'pirate',
    race: 'Human',
    alignment: 'ce',
    classes: [{ classId: 'rogue', level: 2 }],
    totalLevel: 2,
    xp: 300,
    abilityScores: { strength: 14, dexterity: 13, constitution: 12, intelligence: 10, wisdom: 10, charisma: 11 },
    hitPoints: { total: 22 },
    equipment: { weapons: ['scimitar', 'shortbow'] }
  },
  {
    type: 'npc',
    edition: '5e',
    name: 'Merchant Captain',
    id: 'merchant-captain',
    race: 'Human',
    alignment: 'ln',
    classes: [{ classId: 'fighter', level: 4 }],
    totalLevel: 4,
    xp: 2700,
    abilityScores: { strength: 14, dexterity: 12, constitution: 14, intelligence: 12, wisdom: 13, charisma: 14 },
    hitPoints: { total: 42 },
    equipment: { weapons: ['rapier', 'light-crossbow'] }
  },

  /* ────────────────────────────── */
  /* Diverse Races                   */
  /* ────────────────────────────── */
  {
    type: 'npc',
    edition: '5e',
    name: 'Dwarven Smith',
    id: 'dwarven-smith',
    race: 'Dwarf',
    alignment: 'lg',
    classes: [{ classId: 'fighter', level: 4 }],
    totalLevel: 4,
    xp: 2700,
    abilityScores: { strength: 17, dexterity: 10, constitution: 16, intelligence: 12, wisdom: 11, charisma: 9 },
    hitPoints: { total: 42 },
    equipment: { weapons: ['warhammer', 'battleaxe'] }
  },
  {
    type: 'npc',
    edition: '5e',
    name: 'Elven Archer',
    id: 'elven-archer',
    race: 'Elf',
    alignment: 'cg',
    classes: [{ classId: 'ranger', level: 4 }],
    totalLevel: 4,
    xp: 2700,
    abilityScores: { strength: 12, dexterity: 18, constitution: 12, intelligence: 12, wisdom: 14, charisma: 10 },
    hitPoints: { total: 33 },
    equipment: { weapons: ['longbow', 'shortsword'] }
  },
  {
    type: 'npc',
    edition: '5e',
    name: 'Halfling Burglar',
    id: 'halfling-burglar',
    race: 'Halfling',
    alignment: 'cn',
    classes: [{ classId: 'rogue', level: 4 }],
    totalLevel: 4,
    xp: 2700,
    abilityScores: { strength: 8, dexterity: 18, constitution: 12, intelligence: 14, wisdom: 12, charisma: 14 },
    hitPoints: { total: 27 },
    equipment: { weapons: ['shortsword', 'shortbow'], gear: ['thieves-tools'] }
  },
  {
    type: 'npc',
    edition: '5e',
    name: 'Dragonborn Soldier',
    id: 'dragonborn-soldier',
    race: 'Dragonborn',
    alignment: 'lg',
    classes: [{ classId: 'fighter', level: 5 }],
    totalLevel: 5,
    xp: 6500,
    abilityScores: { strength: 18, dexterity: 12, constitution: 16, intelligence: 10, wisdom: 12, charisma: 12 },
    hitPoints: { total: 49 },
    equipment: { weapons: ['greatsword', 'longbow'] }
  },
  {
    type: 'npc',
    edition: '5e',
    name: 'Tiefling Rogue',
    id: 'tiefling-rogue',
    race: 'Tiefling',
    alignment: 'cn',
    classes: [{ classId: 'rogue', level: 3 }],
    totalLevel: 3,
    xp: 900,
    abilityScores: { strength: 10, dexterity: 16, constitution: 12, intelligence: 13, wisdom: 10, charisma: 14 },
    hitPoints: { total: 24 },
    equipment: { weapons: ['rapier', 'hand-crossbow'], gear: ['thieves-tools'] }
  }
] as const

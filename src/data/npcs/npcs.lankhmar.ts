export type NpcLankhmar = Record<string, unknown> & { id: string }

export const npcsLankhmar: readonly NpcLankhmar[] = [
  {
    type: 'npc',
    edition: '2e',
    setting: 'lankhmar',
    name: 'Fafhrd',
    id: 'fafhrd',
    race: 'Human',
    alignment: 'cg',
    classes: [{ classId: 'warrior', level: 15 }],
    totalLevel: 15,
    xp: 2250000,
    abilityScores: {
      strength: 18,
      dexterity: 17,
      constitution: 18,
      intelligence: 15,
      wisdom: 15,
      charisma: 16
    },
    rules: {
      abilityScores: { strengthPercentile: 90 },
      thac0: 6,
      savingThrows: {
        paralyzationPoisonDeath: 5,
        rodStaffWand: 7,
        petrificationPolymorph: 6,
        breathWeapon: 5,
        spell: 8
      }
    },
    hitPoints: { total: 111, generationMethod: 'Max for 1-9, plus 3 per level thereafter' },
    armorClass: { base: 7, current: 7, calculation: 'Leather Armor (AC 8) - Dex Bonus (-1)' },
    proficiencies: [],
    equipment: { weapons: ['graywand-bastard-sword', 'heartseeker-longbow'] }
  },
  {
    type: 'npc',
    edition: '2e',
    setting: 'lankhmar',
    name: 'The Gray Mouser',
    id: 'gray-mouser',
    race: 'Human',
    alignment: 'cn',
    classes: [
      { classId: 'thief', level: 11 },
      { classId: 'wizard', level: 3 }
    ],
    totalLevel: 14,
    xp: 440000,
    abilityScores: {
      strength: 10,
      dexterity: 19,
      constitution: 15,
      intelligence: 17,
      wisdom: 10,
      charisma: 14
    },
    hitPoints: { total: 48 },
    armorClass: { base: 4, current: 4, calculation: 'Leather Armor (AC 8) - Dex Bonus (-4)' },
    rules: {
      thac0: 15,
      savingThrows: {
        paralyzationPoisonDeath: 10,
        rodStaffWand: 12,
        petrificationPolymorph: 11,
        breathWeapon: 12,
        spell: 13
      }
    },
    proficiencies: [],
    equipment: { weapons: ['scalpel', 'cats-claw'], gear: ['thieves-tools'] }
  },

  /* ────────────────────────────── */
  /* Patrons & Wizards               */
  /* ────────────────────────────── */
  {
    type: 'npc',
    edition: '2e',
    setting: 'lankhmar',
    name: 'Ningauble of the Seven Eyes',
    id: 'ningauble',
    race: 'Human',
    alignment: 'n',
    classes: [{ classId: 'wizard', level: 20 }],
    totalLevel: 20,
    xp: 6000000,
    abilityScores: { strength: 8, dexterity: 12, constitution: 14, intelligence: 20, wisdom: 18, charisma: 10 }
  },
  {
    type: 'npc',
    edition: '2e',
    setting: 'lankhmar',
    name: 'Sheelba of the Eyeless Face',
    id: 'sheelba',
    race: 'Human',
    alignment: 'n',
    classes: [{ classId: 'wizard', level: 18 }],
    totalLevel: 18,
    xp: 3750000,
    abilityScores: { strength: 9, dexterity: 14, constitution: 12, intelligence: 19, wisdom: 17, charisma: 8 }
  },
  {
    type: 'npc',
    edition: '2e',
    setting: 'lankhmar',
    name: 'Hristomilo',
    id: 'hristomilo',
    race: 'Human',
    alignment: 'ne',
    classes: [{ classId: 'wizard', level: 8 }],
    totalLevel: 8,
    xp: 25000,
    abilityScores: { strength: 8, dexterity: 12, constitution: 10, intelligence: 17, wisdom: 11, charisma: 9 }
  },

  /* ────────────────────────────── */
  /* Thieves' Guild                 */
  /* ────────────────────────────── */
  {
    type: 'npc',
    edition: '2e',
    setting: 'lankhmar',
    name: 'Krovas',
    id: 'krovas',
    race: 'Human',
    alignment: 'le',
    classes: [{ classId: 'thief', level: 14 }],
    totalLevel: 14,
    xp: 800000,
    abilityScores: { strength: 12, dexterity: 17, constitution: 14, intelligence: 16, wisdom: 13, charisma: 15 }
  },
  {
    type: 'npc',
    edition: '2e',
    setting: 'lankhmar',
    name: 'Fissif',
    id: 'fissif',
    race: 'Human',
    alignment: 'cn',
    classes: [{ classId: 'thief', level: 5 }],
    totalLevel: 5,
    xp: 5000,
    abilityScores: { strength: 11, dexterity: 15, constitution: 12, intelligence: 13, wisdom: 10, charisma: 9 }
  },
  {
    type: 'npc',
    edition: '2e',
    setting: 'lankhmar',
    name: 'Slevyas',
    id: 'slevyas',
    race: 'Human',
    alignment: 'le',
    classes: [{ classId: 'thief', level: 7 }],
    totalLevel: 7,
    xp: 15000,
    abilityScores: { strength: 13, dexterity: 16, constitution: 12, intelligence: 14, wisdom: 11, charisma: 10 }
  },
  {
    type: 'npc',
    edition: '2e',
    setting: 'lankhmar',
    name: 'Bannat',
    id: 'bannat',
    race: 'Human',
    alignment: 'le',
    classes: [{ classId: 'thief', level: 6 }],
    totalLevel: 6,
    xp: 10000
  },
  {
    type: 'npc',
    edition: '2e',
    setting: 'lankhmar',
    name: 'Pulg',
    id: 'pulg',
    race: 'Human',
    alignment: 'le',
    classes: [{ classId: 'thief', level: 4 }],
    totalLevel: 4,
    xp: 3000
  },
  {
    type: 'npc',
    edition: '2e',
    setting: 'lankhmar',
    name: 'Skel',
    id: 'skel',
    race: 'Human',
    alignment: 'ce',
    classes: [{ classId: 'thief', level: 3 }],
    totalLevel: 3,
    xp: 1500
  },

  /* ────────────────────────────── */
  /* Lovers & Companions             */
  /* ────────────────────────────── */
  {
    type: 'npc',
    edition: '2e',
    setting: 'lankhmar',
    name: 'Vlana',
    id: 'vlana',
    race: 'Human',
    alignment: 'cn',
    classes: [{ classId: 'thief', level: 6 }],
    totalLevel: 6,
    xp: 10000,
    abilityScores: { strength: 10, dexterity: 16, constitution: 11, intelligence: 14, wisdom: 12, charisma: 15 }
  },
  {
    type: 'npc',
    edition: '2e',
    setting: 'lankhmar',
    name: 'Ivrian',
    id: 'ivrian',
    race: 'Human',
    alignment: 'ng',
    classes: [{ classId: 'wizard', level: 1 }],
    totalLevel: 1,
    xp: 0,
    abilityScores: { strength: 8, dexterity: 12, constitution: 10, intelligence: 15, wisdom: 11, charisma: 16 }
  },

  /* ────────────────────────────── */
  /* Citizens & Merchants           */
  /* ────────────────────────────── */
  {
    type: 'npc',
    edition: '2e',
    setting: 'lankhmar',
    name: 'Jengao',
    id: 'jengao',
    race: 'Human',
    alignment: 'ln',
    classes: [{ classId: 'warrior', level: 2 }],
    totalLevel: 2,
    xp: 2000
  },
  {
    type: 'npc',
    edition: '2e',
    setting: 'lankhmar',
    name: 'Karstak Ovartamortes',
    id: 'karstak-ovartamortes',
    race: 'Human',
    alignment: 'le',
    classes: [{ classId: 'warrior', level: 8 }],
    totalLevel: 8,
    xp: 50000
  },
  {
    type: 'npc',
    edition: '2e',
    setting: 'lankhmar',
    name: 'Glavas Rho',
    id: 'glavas-rho',
    race: 'Human',
    alignment: 'lg',
    classes: [{ classId: 'priest', level: 7 }],
    totalLevel: 7,
    xp: 20000
  },
  {
    type: 'npc',
    edition: '2e',
    setting: 'lankhmar',
    name: 'Ourph',
    id: 'ourph',
    race: 'Human',
    alignment: 'tn',
    classes: [{ classId: 'warrior', level: 4 }],
    totalLevel: 4,
    xp: 4000
  },

  /* ────────────────────────────── */
  /* The Swords of Lankhmar          */
  /* ────────────────────────────── */
  {
    type: 'npc',
    edition: '2e',
    setting: 'lankhmar',
    name: 'Hisvet',
    id: 'hisvet',
    race: 'Human',
    alignment: 'ce',
    classes: [
      { classId: 'thief', level: 4 },
      { classId: 'wizard', level: 2 }
    ],
    totalLevel: 6,
    xp: 8000
  },
  {
    type: 'npc',
    edition: '2e',
    setting: 'lankhmar',
    name: 'Samanda',
    id: 'samanda',
    race: 'Human',
    alignment: 'le',
    classes: [{ classId: 'warrior', level: 6 }],
    totalLevel: 6,
    xp: 12000
  },
  {
    type: 'npc',
    edition: '2e',
    setting: 'lankhmar',
    name: 'Niss',
    id: 'niss',
    race: 'Human',
    alignment: 'cn',
    classes: [{ classId: 'thief', level: 3 }],
    totalLevel: 3,
    xp: 1500
  },
  {
    type: 'npc',
    edition: '2e',
    setting: 'lankhmar',
    name: 'Riss',
    id: 'riss',
    race: 'Human',
    alignment: 'cn',
    classes: [{ classId: 'thief', level: 2 }],
    totalLevel: 2,
    xp: 1500
  },

  /* ────────────────────────────── */
  /* Northerners & Family            */
  /* ────────────────────────────── */
  {
    type: 'npc',
    edition: '2e',
    setting: 'lankhmar',
    name: 'Mor',
    id: 'mor',
    race: 'Human',
    alignment: 'cn',
    classes: [{ classId: 'warrior', level: 10 }],
    totalLevel: 10,
    xp: 250000
  },
  {
    type: 'npc',
    edition: '2e',
    setting: 'lankhmar',
    name: 'Nole',
    id: 'nole',
    race: 'Human',
    alignment: 'ng',
    classes: [{ classId: 'warrior', level: 3 }],
    totalLevel: 3,
    xp: 2500
  },

  /* ────────────────────────────── */
  /* Court & Overlord               */
  /* ────────────────────────────── */
  {
    type: 'npc',
    edition: '2e',
    setting: 'lankhmar',
    name: 'The Overlord',
    id: 'overlord',
    race: 'Human',
    alignment: 'le',
    classes: [{ classId: 'warrior', level: 12 }],
    totalLevel: 12,
    xp: 500000
  },
  {
    type: 'npc',
    edition: '2e',
    setting: 'lankhmar',
    name: 'Essendinex',
    id: 'essendinex',
    race: 'Human',
    alignment: 'ln',
    classes: [{ classId: 'warrior', level: 5 }],
    totalLevel: 5,
    xp: 8000
  },
  {
    type: 'npc',
    edition: '2e',
    setting: 'lankhmar',
    name: 'Lamviar',
    id: 'lamviar',
    race: 'Human',
    alignment: 'tn',
    classes: [{ classId: 'thief', level: 4 }],
    totalLevel: 4,
    xp: 3000
  },

  /* ────────────────────────────── */
  /* Tavernkeepers & Commoners      */
  /* ────────────────────────────── */
  {
    type: 'npc',
    edition: '2e',
    setting: 'lankhmar',
    name: 'The Keeper',
    id: 'keeper',
    race: 'Human',
    alignment: 'tn',
    classes: [{ classId: 'warrior', level: 2 }],
    totalLevel: 2,
    xp: 2000
  },
  {
    type: 'npc',
    edition: '2e',
    setting: 'lankhmar',
    name: 'Durring',
    id: 'durring',
    race: 'Human',
    alignment: 'ng',
    classes: [{ classId: 'warrior', level: 3 }],
    totalLevel: 3,
    xp: 2500
  },
  {
    type: 'npc',
    edition: '2e',
    setting: 'lankhmar',
    name: 'Gnarfi',
    id: 'gnarfi',
    race: 'Human',
    alignment: 'ce',
    classes: [{ classId: 'thief', level: 3 }],
    totalLevel: 3,
    xp: 1500
  },
  {
    type: 'npc',
    edition: '2e',
    setting: 'lankhmar',
    name: 'Mouser\'s Wizard Master',
    id: 'mousers-wizard-master',
    race: 'Human',
    alignment: 'n',
    classes: [{ classId: 'wizard', level: 10 }],
    totalLevel: 10,
    xp: 250000
  },
  {
    type: 'npc',
    edition: '2e',
    setting: 'lankhmar',
    name: 'Adept of the Rats',
    id: 'adept-of-the-rats',
    race: 'Human',
    alignment: 'ce',
    classes: [{ classId: 'wizard', level: 6 }],
    totalLevel: 6,
    xp: 15000
  },
  {
    type: 'npc',
    edition: '2e',
    setting: 'lankhmar',
    name: 'Slivikin',
    id: 'slivikin',
    race: 'Human',
    alignment: 'ce',
    classes: [{ classId: 'wizard', level: 5 }],
    totalLevel: 5,
    xp: 10000
  }
] as const

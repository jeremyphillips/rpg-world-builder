import type { Setting } from './types'

export const settings: readonly Setting[] = [
  {
    id: 'alQadim',
    name: 'Al-Qadim',
    worldIds: [ 'toril' ],
    classes: [
      { id: 'priest', name: 'Priest' },
      { id: 'Rogue', name: 'Rogue' },
      { id: 'warrior', name: 'Warrior' },
      { id: 'wizard', name: 'Wizard' },
    ],
    races: [
      { id: 'human', name: 'Human' },
      { id: 'dwarf', name: 'Dwarf' },
      { id: 'elf', name: 'Elf' },
      { id: 'gnome', name: 'Gnome' },
      { id: 'halfElf', name: 'Half-Elf' },
      { id: 'halfOrc', name: 'Half-Orc' },
      { id: 'halfling', name: 'Halfling' }
    ]
  },
  {
    id: 'birthright',
    name: 'Birthright',
    editions: [ '2' ],
    worldIds: [ 'aebrynis' ],
    publicationYear: '1995',
    // races: [
    //   { id: 'human', name: 'Human' },
    // ],
  },
  {
    id: 'blackmoor',
    name: 'Blackmoor',
    worldIds: [ 'oerth' ],
    editions: [ 'odd', 'b', 'bx', 'becmi' ],
  },
  {
    id: 'darkSun',
    name: 'Dark Sun',
    worldId: [ 'athas' ],
    editions: [ '2', '3', '3.5', '4' ],
    raceOverrides: {
      add: ['aarakocra', 'dray', 'genasi', 'halfGiant', 'kalashtar', 'mul', 'pterran', 'thriKreen', 'tiefling' ],
      remove: ['gnome']
    },
    classOverrides: {
      add: ['gladiator']
    },
  },
  {
    id: 'dragonlance',
    name: 'Dragonlance',
    worldIds: [ 'krynn' ],
    editions: [ '1', '2', '3', '3.5', '4', '5' ],
  },
  {
    id: 'forgottenRealms',
    name: 'Forgotten Realms',
    worldIds: [ 'toril' ],
    editions: [ '1', '2', '3', '3.5', '4' ],
    // races: [
    //   { id: 'dragonborn', name: 'Dragonborn' },
    //   { id: 'tiefling', name: 'Tiefling' }
    // ]
  },
  {
    id: 'greyhawk',
    name: 'Greyhawk',
    worldIds: [ 'oerth' ],
  },
  {
    id: 'lankhmar',
    name: 'Lankhmar',
    worldIds: [ 'nehwon' ],
    editions: [ '1', '2' ],
    raceOverrides: {
      only: ['human']
    },
    classOverrides: {
      remove: ['druid', 'paladin'],

      subclassOverrides: {
        warrior: {
          remove: ['paladin']
        }
      }
    },
    locations: [
      // --- MAJOR REGIONS ---
      {
        id: 'coldWaste',
        settingId: 'lankhmar',
        name: 'The Cold Waste',
        type: 'region',
        description: 'The Cold Waste is a frozen wasteland that lies to the north of Lankhmar.',
        parentLocationId: undefined,
        visibility: { allCharacters: true, characterIds: [] }
      },
      {
        id: 'steppesOfMingols',
        settingId: 'lankhmar',
        name: 'Steppes of the Mingols',
        type: 'region',
        description: 'The Steppes of the Mingols are a vast and rolling plain that lies to the east of Lankhmar.',
        parentLocationId: undefined,
        visibility: { allCharacters: true, characterIds: [] }
      },
      {
        id: 'landOfEightCities',
        settingId: 'lankhmar',
        name: 'The Land of the Eight Cities',
        type: 'region',
        description: 'The Land of the Eight Cities is a region that lies to the south of Lankhmar.',
        parentLocationId: undefined,
        visibility: { allCharacters: true, characterIds: [] }
      },
      {
        id: 'shadowland',
        settingId: 'lankhmar',
        name: 'Shadowland',
        type: 'region',
        description: 'Shadowland is a region that lies to the west of Lankhmar.',
        parentLocationId: undefined,
        visibility: { allCharacters: true, characterIds: [] }
      },
      {
        id: 'sinkingLands',
        settingId: 'lankhmar',
        name: 'The Sinking Lands',
        type: 'region',
        description: 'The Sinking Lands is a region that lies to the south of Lankhmar.',
        parentLocationId: undefined,
        visibility: { allCharacters: true, characterIds: [] }
      },
      // --- CITIES & TOWNS ---
      {
        id: 'kvarchNar',
        settingId: 'lankhmar',
        name: 'Kvarch Nar',
        type: 'city',
        parentLocationId: 'landOfEightCities',
        visibility: { allCharacters: true, characterIds: [] }
      },
      {
        id: 'blum',
        settingId: 'lankhmar',
        name: 'Blüm',
        type: 'town',
        description: 'Blüm is a town that lies to the east of Lankhmar.',
        parentLocationId: undefined,
        visibility: { allCharacters: true, characterIds: [] }
      },
      {
        id: 'ilthmar',
        settingId: 'lankhmar',
        name: 'Ilthmar',
        type: 'city',
        description: 'Ilthmar is a city that lies to the west of Lankhmar.',
        parentLocationId: undefined,
        visibility: { allCharacters: true, characterIds: [] }
      },
      {
        id: 'oolHrusp',
        settingId: 'lankhmar',
        name: 'Ool Hrusp',
        type: 'city',
        description: 'Ool Hrusp is a city that lies to the north of Lankhmar.',
        parentLocationId: 'landOfEightCities',
        visibility: { allCharacters: true, characterIds: [] }
      },
      {
        id: 'gnamphNar',
        settingId: 'lankhmar',
        name: 'Gnamph Nar',
        type: 'city',
        description: 'Gnamph Nar is a city that lies to the north of Lankhmar.',
        parentLocationId: 'landOfEightCities',
        visibility: { allCharacters: true, characterIds: [] }
      },
      {
        id: 'illikVing',
        settingId: 'lankhmar',
        name: 'Illik-Ving',
        type: 'city',
        description: 'Illik-Ving is a city that lies to the north of Lankhmar.',
        parentLocationId: 'landOfEightCities',
        visibility: { allCharacters: true, characterIds: [] }
      },
      {
        id: 'horborixen',
        settingId: 'lankhmar',
        name: 'Horborixen',
        type: 'city',
        description: 'Horborixen is a city that lies to the west of Lankhmar.',
        parentLocationId: undefined,
        visibility: { allCharacters: true, characterIds: [] }
      },
      {
        id: 'quarmall',
        settingId: 'lankhmar',
        name: 'Quarmall',
        type: 'city',
        description: 'Quarmall is a city that lies to the south of Lankhmar.',
        parentLocationId: undefined,
        visibility: { allCharacters: true, characterIds: [] }
      },
    
      // --- LANDMARKS & DUNGEONS ---
      {
        id: 'stardock',
        settingId: 'lankhmar',
        name: 'Stardock',
        type: 'landmark',
        description: 'Stardock is a landmark that lies to the north of Lankhmar.',
        parentLocationId: undefined,
        visibility: { allCharacters: true, characterIds: [] }
      },
      {
        id: 'ningaublesCave',
        settingId: 'lankhmar',
        name: 'Ningauble\'s Cave',
        type: 'dungeon',
        description: 'Ningauble\'s Cave is a dungeon that lies to the north of Lankhmar.',
        parentLocationId: undefined,
        visibility: { allCharacters: true, characterIds: [] }
      }
    ]    
  },
  {
    id: 'mystara',
    name: 'Mystara',
    worldIds: [ 'mystara' ],
    editions: [ 'odd', 'b', 'bx', 'becmi', '1' ],
    aliasNames: [ 'Known World' ],
  },
  {
    id: 'planescape',
    name: 'Planescape',
    worldIds: [ '' ],
    editions: [ '2' ],
    classes: [
      { id: 'fighter', name: 'Fighter' },
      { id: 'mage', name: 'Mage' },
      { id: 'priest', name: 'Priest' },
      { id: 'thief', name: 'Thief' }
    ],
    raceOverrides: {
      only: ['aasimar', 'bariaur', 'bladeling', 'chaond', 'genasi', 'khaasta', 'modronOutcast', 'nathri', 'shad', 'tiefling', 'tuladhara', 'zenythri']
    }
  },
  {
    id: 'ravenloft',
    name: 'Ravenloft',
    worldIds: [ 'demiPlaneOfDread' ], // within  Shadowfell
    editions: [ '1', '2', '3', '3.5', '4', '5' ],
    classOverrides: {
      add: ['duskblade'],
    },
    classes: [
      { id: 'archivist', name: 'Archivist' },
      { id: 'barbarian', name: 'Barbarian' },
      { id: 'bard', name: 'Bard' },
      { id: 'beguiler', name: 'Beguiler' },
      { id: 'cleric', name: 'Cleric' },
      { id: 'druid', name: 'Druid' },
      { id: 'duskblade', name: 'Duskblade' },
      { id: 'favored_soul', name: 'Favored Soul' },
      { id: 'fighter', name: 'Fighter' },
      { id: 'healer', name: 'Healer' },
      { id: 'hexblade', name: 'Hexblade' },
      { id: 'monk', name: 'Monk' },
      { id: 'paladin', name: 'Paladin' },
      { id: 'ranger', name: 'Ranger' },
      { id: 'rogue', name: 'Rogue' },
      { id: 'shaman', name: 'Shaman' },
      { id: 'sorcerer', name: 'Sorcerer' },
      { id: 'voodan', name: 'Voodan' },
      { id: 'warlock', name: 'Warlock' },
      { id: 'warmage', name: 'Warmage' },
      { id: 'wizard', name: 'Wizard' }
    ],
    // races: [
    //   { id: 'human', name: 'Human' },
    //   { id: 'dwarf', name: 'Dwarf' },
    //   { id: 'elf', name: 'Elf' },
    //   { id: 'gnome', name: 'Gnome' },
    //   { id: 'halfElf', name: 'Half-Elf' },
    //   { id: 'halfOrc', name: 'Half-Orc' },
    //   { id: 'halfling', name: 'Halfling' }
    // ]
  },
  {
    id: 'spellJammer',
    name: 'Spell Jammer',
    editions: [ '2', '5' ],
    worldIds: [ 'toril', 'oerth', 'krynn', 'mystara' ], // Glyth, H'Catha, and Garden
    classes: [
      { id: 'thief', name: 'thief' },
      { id: 'fighter', name: 'Fighter' },
      { id: 'mage', name: 'Mage' },
      { id: 'cleric', name: 'Cleric' },
      { id: 'paladin', name: 'Paladin' },
      { id: 'ranger', name: 'Ranger' }
    ],
    // races: [
    //   { id: 'plasmoid', name: 'Plasmoid' },
    //   { id: 'thriKreen', name: 'Thri-kreen' },
    //   { id: 'giff', name: 'Giff' },
    //   { id: 'xixchil', name: 'Xixchil' },
    //   { id: 'elf', name: 'Elf' }, // Astral
    //   { id: 'scro', name: 'Scro' },
    //   { id: 'antilan', name: 'Antilan' },
    //   { id: 'gnome', name: 'Gnome' }, // Tinker & Auto
    //   { id: 'halfling', name: 'Halfling' },
    //   { id: 'human', name: 'Human' },
    //   { id: 'dwarf', name: 'Dwarf' },
    //   { id: 'hadozee', name: 'Hadozee' },
    //   { id: 'halfElf', name: 'Half-Elf' },
    //   { id: 'halfOrc', name: 'Half-Orc' }
    // ]
  }
  // TODO
  // Gazeteer
  // eberron
  // pointsOfLight
 ] as const

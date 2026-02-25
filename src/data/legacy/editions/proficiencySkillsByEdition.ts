export const FIVE_E_STRENGTH_SKILLS = {
  athletics: { name: 'Athletics', ability: 'strength', description: 'Difficult situations you face while climbing, jumping, or swimming.' }
};

export const FIVE_E_DEXTERITY_SKILLS = {
  acrobatics: { name: 'Acrobatics', ability: 'dexterity', description: 'Staying on your feet in tricky situations, like walking across a tightrope or icy surface.' },
  sleightOfHand: { name: 'Sleight of Hand', ability: 'dexterity', description: 'Manual trickery, such as planting something on someone else or concealing an object on your person.' },
  stealth: { name: 'Stealth', ability: 'dexterity', description: 'Escaping notice by moving silently and hiding from view.' }
};

export const FIVE_E_INTELLIGENCE_SKILLS = {
  arcana: { name: 'Arcana', ability: 'intelligence', description: 'Recall lore about spells, magic items, eldritch symbols, and planes of existence.' },
  history: { name: 'History', ability: 'intelligence', description: 'Recall lore about historical events, legendary people, ancient kingdoms, and past disputes.' },
  investigation: { name: 'Investigation', ability: 'intelligence', description: 'Looking for clues and making deductions based on those clues.' },
  nature: { name: 'Nature', ability: 'intelligence', description: 'Recall lore about terrain, plants and animals, the weather, and natural cycles.' },
  religion: { name: 'Religion', ability: 'intelligence', description: 'Recall lore about deities, rites and prayers, religious hierarchies, and holy symbols.' }
};

export const FIVE_E_WISDOM_SKILLS = {
  animalHandling: { name: 'Animal Handling', ability: 'wisdom', description: 'Calming domesticated animals, intuiting an animal’s intentions, or controlling a mount.' },
  insight: { name: 'Insight', ability: 'wisdom', description: 'Determine the true intentions of a creature, such as searching out a lie or predicting a move.' },
  medicine: { name: 'Medicine', ability: 'wisdom', description: 'Stabilizing a dying companion or diagnosing an illness.' },
  perception: { name: 'Perception', ability: 'wisdom', description: 'Lets you spot, hear, or otherwise detect the presence of something.' },
  survival: { name: 'Survival', ability: 'wisdom', description: 'Follow tracks, hunt wild game, guide your group through frozen wastelands, and predict the weather.' }
};

export const FIVE_E_CHARISMA_SKILLS = {
  deception: { name: 'Deception', ability: 'charisma', description: 'Hiding the truth, either verbally or through actions, to mislead others.' },
  intimidation: { name: 'Intimidation', ability: 'charisma', description: 'Influencing others through overt threats, hostile actions, and physical violence.' },
  performance: { name: 'Performance', ability: 'charisma', description: 'Delighting an audience with music, dance, acting, storytelling, or some other entertainment.' },
  persuasion: { name: 'Persuasion', ability: 'charisma', description: 'Influencing others with tact, social graces, or good nature.' }
};


export const TWOE_GENERAL_PROFICIENCY_SKILLS = {
  agriculture: { name: 'Agriculture', ability: 'intelligence', checkModifier: 0, baseCost: 1 },
  animalHandling: { name: 'Animal Handling', ability: 'wisdom', checkModifier: -1, baseCost: 1 },
  animalTraining: { name: 'Animal Training', ability: 'wisdom', checkModifier: 0, baseCost: 1 },
  artisticAbility: { name: 'Artistic Ability', ability: 'wisdom', checkModifier: 0, baseCost: 1 },
  blacksmithing: { name: 'Blacksmithing', ability: 'strength', checkModifier: 0, baseCost: 1 },
  brewing: { name: 'Brewing', ability: 'intelligence', checkModifier: 0, baseCost: 1 },
  carpentry: { name: 'Carpentry', ability: 'strength', checkModifier: 0, baseCost: 1 },
  cobbling: { name: 'Cobbling', ability: 'dexterity', checkModifier: 0, baseCost: 1 },
  cooking: { name: 'Cooking', ability: 'intelligence', checkModifier: 0, baseCost: 1 },
  dancing: { name: 'Dancing', ability: 'dexterity', checkModifier: 0, baseCost: 1 },
  directionSense: { name: 'Direction Sense', ability: 'wisdom', checkModifier: +1, baseCost: 1 },
  etiquette: { name: 'Etiquette', ability: 'charisma', checkModifier: 0, baseCost: 1 },
  fireBuilding: { name: 'Fire-building', ability: 'wisdom', checkModifier: -1, baseCost: 1 },
  fishing: { name: 'Fishing', ability: 'wisdom', checkModifier: -1, baseCost: 1 },
  heraldry: { name: 'Heraldry', ability: 'intelligence', checkModifier: 0, baseCost: 1 },
  languagesModern: { name: 'Languages, Modern', ability: 'intelligence', checkModifier: 0, baseCost: 1 },
  leatherworking: { name: 'Leatherworking', ability: 'intelligence', checkModifier: 0, baseCost: 1 },
  mining: { name: 'Mining', ability: 'wisdom', checkModifier: -3, baseCost: 2 },
  musicalInstrument: { name: 'Musical Instrument', ability: 'dexterity', checkModifier: -1, baseCost: 1 },
  pottery: { name: 'Pottery', ability: 'dexterity', checkModifier: -2, baseCost: 1 },
  ridingLandBased: { name: 'Riding, Land-based', ability: 'wisdom', checkModifier: +3, baseCost: 1 },
  ropeUse: { name: 'Rope Use', ability: 'dexterity', checkModifier: 0, baseCost: 1 },
  seamanship: { name: 'Seamanship', ability: 'dexterity', checkModifier: +1, baseCost: 1 },
  seamstressTailor: { name: 'Seamstress/Tailor', ability: 'dexterity', checkModifier: -1, baseCost: 1 },
  singing: { name: 'Singing', ability: 'charisma', checkModifier: 0, baseCost: 1 },
  stonemasonry: { name: 'Stonemasonry', ability: 'strength', checkModifier: -2, baseCost: 1 },
  swimming: { name: 'Swimming', ability: 'strength', checkModifier: 0, baseCost: 1 },
  weatherSense: { name: 'Weather Sense', ability: 'wisdom', checkModifier: -1, baseCost: 1 },
  weaving: { name: 'Weaving', ability: 'intelligence', checkModifier: -1, baseCost: 1 },
  winemaking: { name: 'Winemaking', ability: 'intelligence', checkModifier: 0, baseCost: 1 },
}

export const TWOE_PRIEST_GROUP_PROFICIENCY_SKILLS = {
  ancientHistory: { name: 'Ancient History', ability: 'intelligence', checkModifier: -1, baseCost: 1 },
  astrology: { name: 'Astrology', ability: 'intelligence', checkModifier: 0, baseCost: 2 },
  engineering: { name: 'Engineering', ability: 'intelligence', checkModifier: -3, baseCost: 2 },
  healing: { name: 'Healing', ability: 'wisdom', checkModifier: -2, baseCost: 2 },
  herbalism: { name: 'Herbalism', ability: 'intelligence', checkModifier: -2, baseCost: 2 },
  languagesAncient: { name: 'Languages, Ancient', ability: 'intelligence', checkModifier: 0, baseCost: 1 },
  localHistory: { name: 'Local History', ability: 'charisma', checkModifier: 0, baseCost: 1 },
  musicalInstrumentPriest: { name: 'Musical Instrument', ability: 'dexterity', checkModifier: -1, baseCost: 1 },
  readingWriting: { name: 'Reading/Writing', ability: 'intelligence', checkModifier: +1, baseCost: 1 },
  religion: { name: 'Religion', ability: 'wisdom', checkModifier: 0, baseCost: 1 },
  spellcraft: { name: 'Spellcraft', ability: 'intelligence', checkModifier: -2, baseCost: 1 },
}

export const TWOE_WARRIOR_GROUP_PROFICIENCY_SKILLS = {
  armorer: { name: 'Armorer', ability: 'intelligence', checkModifier: -2, baseCost: 2 },
  bowyerFletcher: { name: 'Bowyer/Fletcher', ability: 'dexterity', checkModifier: -1, baseCost: 1 },
  charioteering: { name: 'Charioteering', ability: 'dexterity', checkModifier: +2, baseCost: 1 },
  endurance: { name: 'Endurance', ability: 'constitution', checkModifier: 0, baseCost: 2 },
  navigation: { name: 'Navigation', ability: 'intelligence', checkModifier: -2, baseCost: 1 },
  ridingAirborne: { name: 'Riding, Airborne', ability: 'wisdom', checkModifier: -2, baseCost: 2 },
  setSnares: { name: 'Set Snares', ability: 'dexterity', checkModifier: -1, baseCost: 1 },
  tracking: { name: 'Tracking', ability: 'wisdom', checkModifier: 0, baseCost: 2 },
  weaponmithing: { name: 'Weaponsmithing', ability: 'intelligence', checkModifier: -3, baseCost: 3 },
}

export const TWOE_ROGUE_GROUP_PROFICIENCY_SKILLS = {
  appraising: { name: 'Appraising', ability: 'intelligence', checkModifier: 0, baseCost: 1 },
  burglary: { name: 'Burglary', ability: 'dexterity', checkModifier: 0, baseCost: 1 },
  climbing: { name: 'Climbing', ability: 'strength', checkModifier: 0, baseCost: 1 },
  disguise: { name: 'Disguise', ability: 'charisma', checkModifier: 0, baseCost: 1 },
  escapeArtist: { name: 'Escape Artist', ability: 'dexterity', checkModifier: 0, baseCost: 1 },
  stealth: { name: 'Stealth', ability: 'dexterity', checkModifier: 0, baseCost: 1 },
}

export const TWOE_WIZARD_GROUP_PROFICIENCY_SKILLS = {
  alchemy: { name: 'Alchemy', ability: 'intelligence', checkModifier: -3, baseCost: 2 },
  gemCutting: { name: 'Gem Cutting', ability: 'dexterity', checkModifier: -2, baseCost: 2 },
}
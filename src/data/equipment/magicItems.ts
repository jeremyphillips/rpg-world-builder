import type { MagicItem } from './magicItems.types'

/**
 * Cross-edition magic item catalog.
 *
 * This starter set of ~32 items focuses on the most iconic items that appear
 * in virtually every D&D edition (OD&D through 5e).  Each item's editionData
 * contains per-edition stats, rarity, cost, and attunement rules.
 *
 * Conventions:
 *   - `cost: '—'` means the item has no standard market price (DM-awarded)
 *   - `baseItemId` links to a mundane weapon/armor from the main catalog
 *   - 4e entries include `enhancementLevel` for level-gating
 *   - 1e/2e entries include `xpValue` and `gpValue` where known
 *   - When an item didn't exist in an edition, that edition is omitted
 */
export const magicItems: readonly MagicItem[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // WEAPONS — Enhancement bonuses
  // ═══════════════════════════════════════════════════════════════════════════
  // {
  //   id: 'dagger-plus-1',
  //   name: '+1 Dagger',
  //   slot: 'weapon',
  //   weight: '—',
  //   baseItemId: 'dagger',
  //   editionData: [
  //     {
  //       edition: '5e',
  //       cost: '1,000 gp',
  //       rarity: 'uncommon',
  //       requiresAttunement: false,
  //       bonus: 1,
  //       effect: '+1 bonus to attack and damage rolls'
  //     },
  //     {
  //       edition: '4e',
  //       cost: '360 gp',
  //       bonus: 1,
  //       enhancementLevel: 1,
  //       effect: '+1 enhancement bonus to attack and damage rolls'
  //     },
  //     {
  //       edition: '3e',
  //       cost: '2,000 gp',
  //       bonus: 1,
  //       effect: '+1 enhancement bonus to attack and damage rolls'
  //     },
  //     {
  //       edition: '2e',
  //       cost: '—',
  //       bonus: 1,
  //       xpValue: 400,
  //       gpValue: 2000,
  //       effect: '+1 bonus to attack and damage rolls'
  //     }
  //   ]
  // },
  // {
  //   id: 'weapon-plus-2',
  //   name: '+2 Weapon',
  //   slot: 'weapon',
  //   weight: '—',
  //   editionData: [
  //     {
  //       edition: '5e',
  //       cost: '4,000 gp',
  //       rarity: 'rare',
  //       requiresAttunement: false,
  //       bonus: 2,
  //       effect: '+2 bonus to attack and damage rolls'
  //     },
  //     {
  //       edition: '4e',
  //       cost: '1,800 gp',
  //       bonus: 2,
  //       enhancementLevel: 6,
  //       effect: '+2 enhancement bonus to attack and damage rolls'
  //     },
  //     {
  //       edition: '3e',
  //       cost: '8,000 gp',
  //       bonus: 2,
  //       effect: '+2 enhancement bonus to attack and damage rolls'
  //     },
  //     {
  //       edition: '2e',
  //       cost: '—',
  //       bonus: 2,
  //       xpValue: 800,
  //       gpValue: 4000,
  //       effect: '+2 bonus to attack and damage rolls'
  //     }
  //   ]
  // },
  // {
  //   id: 'weapon-plus-3',
  //   name: '+3 Weapon',
  //   slot: 'weapon',
  //   weight: '—',
  //   editionData: [
  //     {
  //       edition: '5e',
  //       cost: '16,000 gp',
  //       rarity: 'very-rare',
  //       requiresAttunement: false,
  //       bonus: 3,
  //       effect: '+3 bonus to attack and damage rolls'
  //     },
  //     {
  //       edition: '4e',
  //       cost: '9,000 gp',
  //       bonus: 3,
  //       enhancementLevel: 11,
  //       effect: '+3 enhancement bonus to attack and damage rolls'
  //     },
  //     {
  //       edition: '3e',
  //       cost: '18,000 gp',
  //       bonus: 3,
  //       effect: '+3 enhancement bonus to attack and damage rolls'
  //     },
  //     {
  //       edition: '2e',
  //       cost: '—',
  //       bonus: 3,
  //       xpValue: 1400,
  //       gpValue: 7000,
  //       effect: '+3 bonus to attack and damage rolls'
  //     }
  //   ]
  // },

  // ═══════════════════════════════════════════════════════════════════════════
  // WEAPONS — Named legendary weapons
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'flame-tongue',
    name: 'Flame Tongue',
    slot: 'weapon',
    weight: '—',
    editionData: [
      {
        edition: '5e',
        cost: '5,000 gp',
        rarity: 'rare',
        requiresAttunement: true,
        effect: 'While attuned, you can use a bonus action to speak the command word and cause flames to erupt, dealing an extra 2d6 fire damage on a hit'
      },
      {
        edition: '4e',
        cost: '3,400 gp',
        enhancementLevel: 9,
        bonus: 2,
        effect: 'Critical hit deals +1d6 fire damage per plus. Daily power: +1d6 fire damage on hit'
      },
      {
        edition: '3e',
        cost: '20,715 gp',
        bonus: 1,
        effect: '+1 flaming burst weapon; deals +1d6 fire damage (+1d10 on critical)'
      },
      {
        edition: '2e',
        cost: '—',
        xpValue: 900,
        gpValue: 4500,
        effect: 'Flaming blade deals +1d6 fire damage; sheds light in 10\' radius'
      }
    ]
  },
  {
    id: 'frost-brand',
    name: 'Frost Brand',
    slot: 'weapon',
    weight: '—',
    editionData: [
      {
        edition: '5e',
        cost: '22,000 gp',
        rarity: 'very-rare',
        requiresAttunement: true,
        bonus: 3,
        effect: 'Deals +1d6 cold damage on a hit. Grants resistance to fire damage. In freezing temperatures, sheds bright light in 10 ft'
      },
      {
        edition: '4e',
        cost: '45,000 gp',
        enhancementLevel: 16,
        bonus: 4,
        effect: 'Critical hit deals +1d8 cold damage per plus. Resist 5 fire'
      },
      {
        edition: '3e',
        cost: '54,815 gp',
        bonus: 3,
        effect: '+3 frost weapon; deals +1d6 cold damage, protects from fire (10 points), extinguishes fires'
      },
      {
        edition: '2e',
        cost: '—',
        xpValue: 1600,
        gpValue: 8000,
        effect: '+3 bonus, +6 vs fire-using/fire-dwelling creatures. Extinguishes fire in 10\' radius'
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ARMOR — Enhancement bonuses
  // ═══════════════════════════════════════════════════════════════════════════
  // {
  //   id: 'studded-leather-plus-1',
  //   name: '+1 Studded Leather Armor',
  //   slot: 'armor',
  //   weight: '—',
  //   baseItemId: 'studded-leather',
  //   editionData: [
  //     {
  //       edition: '5e',
  //       cost: '1,500 gp',
  //       rarity: 'uncommon',
  //       requiresAttunement: false,
  //       bonus: 1,
  //       effect: '+1 bonus to AC',
  //       effects: [{ kind: 'bonus', target: 'armor_class', value: 1 }]
  //     },
  //     {
  //       edition: '4e',
  //       cost: '360 gp',
  //       bonus: 1,
  //       enhancementLevel: 1,
  //       effect: '+1 enhancement bonus to AC',
  //       effects: [{ kind: 'bonus', target: 'armor_class', value: 1 }]
  //     },
  //     {
  //       edition: '3e',
  //       cost: '1,000 gp',
  //       bonus: 1,
  //       effect: '+1 enhancement bonus to AC',
  //       effects: [{ kind: 'bonus', target: 'armor_class', value: 1 }]
  //     },
  //     {
  //       edition: '2e',
  //       cost: '—',
  //       bonus: 1,
  //       xpValue: 400,
  //       gpValue: 2500,
  //       effect: '+1 bonus to AC (lowers AC by 1)',
  //       effects: [{ kind: 'bonus', target: 'armor_class', value: 1 }]
  //     }
  //   ]
  // },
  // {
  //   id: 'armor-plus-2',
  //   name: '+2 Armor',
  //   slot: 'armor',
  //   weight: '—',
  //   editionData: [
  //     {
  //       edition: '5e',
  //       cost: '6,000 gp',
  //       rarity: 'rare',
  //       requiresAttunement: false,
  //       bonus: 2,
  //       effect: '+2 bonus to AC',
  //       effects: [{ kind: 'bonus', target: 'armor_class', value: 2 }]
  //     },
  //     {
  //       edition: '4e',
  //       cost: '1,800 gp',
  //       bonus: 2,
  //       enhancementLevel: 6,
  //       effect: '+2 enhancement bonus to AC',
  //       effects: [{ kind: 'bonus', target: 'armor_class', value: 2 }]
  //     },
  //     {
  //       edition: '3e',
  //       cost: '4,000 gp',
  //       bonus: 2,
  //       effect: '+2 enhancement bonus to AC',
  //       effects: [{ kind: 'bonus', target: 'armor_class', value: 2 }]
  //     },
  //     {
  //       edition: '2e',
  //       cost: '—',
  //       bonus: 2,
  //       xpValue: 800,
  //       gpValue: 5000,
  //       effect: '+2 bonus to AC (lowers AC by 2)',
  //       effects: [{ kind: 'bonus', target: 'armor_class', value: 2 }]
  //     }
  //   ]
  // },

  // ═══════════════════════════════════════════════════════════════════════════
  // SHIELD
  // ═══════════════════════════════════════════════════════════════════════════
  // {
  //   id: 'shield-plus-1',
  //   name: '+1 Shield',
  //   slot: 'shield',
  //   weight: '6 lb.',
  //   baseItemId: 'shield-steel',
  //   editionData: [
  //     {
  //       edition: '5e',
  //       cost: '1,500 gp',
  //       rarity: 'uncommon',
  //       requiresAttunement: false,
  //       bonus: 1,
  //       effect: '+1 bonus to AC (in addition to shield\'s +2)',
  //       effects: [{ kind: 'bonus', target: 'armor_class', value: 1 }]
  //     },
  //     {
  //       edition: '4e',
  //       cost: '360 gp',
  //       bonus: 1,
  //       enhancementLevel: 1,
  //       effect: '+1 enhancement bonus to AC',
  //       effects: [{ kind: 'bonus', target: 'armor_class', value: 1 }]
  //     },
  //     {
  //       edition: '3e',
  //       cost: '1,000 gp',
  //       bonus: 1,
  //       effect: '+1 enhancement bonus to AC',
  //       effects: [{ kind: 'bonus', target: 'armor_class', value: 1 }]
  //     },
  //     {
  //       edition: '2e',
  //       cost: '—',
  //       bonus: 1,
  //       xpValue: 250,
  //       gpValue: 1500,
  //       effect: '+1 bonus to AC from shield',
  //       effects: [{ kind: 'bonus', target: 'armor_class', value: 1 }]
  //     }
  //   ]
  // },

  {
    id: 'shield-steel-plus-1',
    name: '+1 Shield (Steel)',
    slot: 'shield',
    weight: '6 lb.',
    baseItemId: 'shield-steel',
    editionData: [
      {
        edition: '5e',
        cost: '1,500 gp',
        rarity: 'uncommon',
        requiresAttunement: false,
        bonus: 1,
        effect: '+1 bonus to AC (in addition to shield\'s +2)',
        effects: [{ kind: 'bonus', target: 'armor_class', value: 1 }]
      },
      {
        edition: '4e',
        cost: '360 gp',
        bonus: 1,
        enhancementLevel: 1,
        effect: '+1 enhancement bonus to AC',
        effects: [{ kind: 'bonus', target: 'armor_class', value: 1 }]
      },
      {
        edition: '3e',
        cost: '1,000 gp',
        bonus: 1,
        effect: '+1 enhancement bonus to AC',
        effects: [{ kind: 'bonus', target: 'armor_class', value: 1 }]
      },
      {
        edition: '2e',
        cost: '—',
        bonus: 1,
        xpValue: 250,
        gpValue: 1500,
        effect: '+1 bonus to AC from shield',
        effects: [{ kind: 'bonus', target: 'armor_class', value: 1 }]
      }
    ]
  },
  // ═══════════════════════════════════════════════════════════════════════════
  // POTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'potion-of-healing',
    name: 'Potion of Healing',
    slot: 'potion',
    weight: '0.5 lb.',
    consumable: true,
    editionData: [
      {
        edition: '5e',
        cost: '50 gp',
        rarity: 'common',
        requiresAttunement: false,
        effect: 'Regain 2d4+2 hit points'
      },
      {
        edition: '4e',
        cost: '50 gp',
        enhancementLevel: 1,
        effect: 'Drink as minor action; spend a healing surge and regain +10 HP'
      },
      {
        edition: '3e',
        cost: '50 gp',
        effect: 'Cures 1d8+1 hit points'
      },
      {
        edition: '2e',
        cost: '—',
        xpValue: 200,
        gpValue: 400,
        effect: 'Restores 2d4+2 hit points'
      }
    ]
  },
  {
    id: 'potion-of-invisibility',
    name: 'Potion of Invisibility',
    slot: 'potion',
    weight: '0.5 lb.',
    consumable: true,
    editionData: [
      {
        edition: '5e',
        cost: '180 gp',
        rarity: 'very-rare',
        requiresAttunement: false,
        effect: 'Invisible for 1 hour. Effect ends early if you attack or cast a spell'
      },
      {
        edition: '4e',
        cost: '680 gp',
        enhancementLevel: 10,
        effect: 'Invisible until end of your next turn'
      },
      {
        edition: '3e',
        cost: '300 gp',
        effect: 'Invisibility as the spell for 3 minutes (CL 3)'
      },
      {
        edition: '2e',
        cost: '—',
        xpValue: 250,
        gpValue: 500,
        effect: 'Invisible for 24 hours or until an attack is made'
      }
    ]
  },
  {
    id: 'potion-of-speed',
    name: 'Potion of Speed',
    slot: 'potion',
    weight: '0.5 lb.',
    consumable: true,
    editionData: [
      {
        edition: '5e',
        cost: '400 gp',
        rarity: 'very-rare',
        requiresAttunement: false,
        effect: 'Haste effect for 1 minute (no concentration). +2 AC, advantage on Dex saves, extra action each turn'
      },
      {
        edition: '4e',
        cost: '680 gp',
        enhancementLevel: 10,
        effect: 'Gain +2 bonus to speed until end of encounter'
      },
      {
        edition: '3e',
        cost: '750 gp',
        effect: 'Haste as the spell for 5 rounds (CL 5)'
      },
      {
        edition: '2e',
        cost: '—',
        xpValue: 200,
        gpValue: 450,
        effect: 'Haste effect: double movement, +1 to initiative, extra attack for 5d4 rounds. Ages drinker 1 year'
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // RINGS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'ring-of-protection',
    name: 'Ring of Protection',
    slot: 'ring',
    weight: '—',
    editionData: [
      {
        edition: '5e',
        cost: '3,500 gp',
        rarity: 'rare',
        requiresAttunement: true,
        bonus: 1,
        effect: '+1 bonus to AC and saving throws'
      },
      {
        edition: '4e',
        cost: '840 gp',
        enhancementLevel: 3,
        effect: '+1 bonus to Fortitude, Reflex, and Will defenses'
      },
      {
        edition: '3e',
        cost: '2,000 gp',
        bonus: 1,
        effect: '+1 deflection bonus to AC'
      },
      {
        edition: '2e',
        cost: '—',
        bonus: 1,
        xpValue: 1000,
        gpValue: 5000,
        effect: '+1 bonus to AC and saving throws'
      }
    ]
  },
  {
    id: 'ring-of-invisibility',
    name: 'Ring of Invisibility',
    slot: 'ring',
    weight: '—',
    editionData: [
      {
        edition: '5e',
        cost: '50,000 gp',
        rarity: 'legendary',
        requiresAttunement: true,
        effect: 'Turn invisible as an action. Ends when you attack or cast a spell'
      },
      {
        edition: '3e',
        cost: '20,000 gp',
        effect: 'Invisibility as the spell at will'
      },
      {
        edition: '2e',
        cost: '—',
        xpValue: 1500,
        gpValue: 7500,
        effect: 'Invisible at will until the wearer attacks'
      }
    ]
  },
  {
    id: 'ring-of-spell-storing',
    name: 'Ring of Spell Storing',
    slot: 'ring',
    weight: '—',
    editionData: [
      {
        edition: '5e',
        cost: '24,000 gp',
        rarity: 'rare',
        requiresAttunement: true,
        charges: 5,
        effect: 'Stores up to 5 levels worth of spells. Any creature can cast stored spells using the original save DC and spell attack bonus'
      },
      {
        edition: '3e',
        cost: '50,000 gp',
        charges: 5,
        effect: 'Stores up to 5 spell levels; wearer can cast stored spells'
      },
      {
        edition: '2e',
        cost: '—',
        xpValue: 2500,
        gpValue: 12500,
        effect: 'Stores up to 5 spell levels contributed by the wearer'
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CLOAKS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'cloak-of-protection',
    name: 'Cloak of Protection',
    slot: 'cloak',
    weight: '1 lb.',
    editionData: [
      {
        edition: '5e',
        cost: '3,500 gp',
        rarity: 'uncommon',
        requiresAttunement: true,
        bonus: 1,
        effect: '+1 bonus to AC and saving throws'
      },
      {
        edition: '3e',
        cost: '2,500 gp',
        bonus: 1,
        effect: '+1 resistance bonus to all saving throws'
      },
      {
        edition: '2e',
        cost: '—',
        bonus: 1,
        xpValue: 1000,
        gpValue: 3000,
        effect: '+1 bonus to AC and saving throws'
      }
    ]
  },
  {
    id: 'cloak-of-elvenkind',
    name: 'Cloak of Elvenkind',
    slot: 'cloak',
    weight: '1 lb.',
    editionData: [
      {
        edition: '5e',
        cost: '5,000 gp',
        rarity: 'uncommon',
        requiresAttunement: true,
        effect: 'Advantage on Dexterity (Stealth) checks. Disadvantage on Wisdom (Perception) checks made to see you'
      },
      {
        edition: '3e',
        cost: '2,500 gp',
        effect: '+5 competence bonus to Hide checks'
      },
      {
        edition: '2e',
        cost: '—',
        xpValue: 1000,
        gpValue: 3000,
        effect: 'Near-invisibility in natural surroundings; 90% undetectable in woods, 70% elsewhere'
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BOOTS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'boots-of-elvenkind',
    name: 'Boots of Elvenkind',
    slot: 'boots',
    weight: '1 lb.',
    editionData: [
      {
        edition: '5e',
        cost: '2,500 gp',
        rarity: 'uncommon',
        requiresAttunement: false,
        effect: 'Steps make no sound. Advantage on Dexterity (Stealth) checks that rely on moving silently'
      },
      {
        edition: '3e',
        cost: '2,500 gp',
        effect: '+5 competence bonus to Move Silently checks'
      },
      {
        edition: '2e',
        cost: '—',
        xpValue: 1000,
        gpValue: 3000,
        effect: 'Move silently with 90% chance of success'
      }
    ]
  },
  {
    id: 'boots-of-speed',
    name: 'Boots of Speed',
    slot: 'boots',
    weight: '1 lb.',
    editionData: [
      {
        edition: '5e',
        cost: '4,000 gp',
        rarity: 'rare',
        requiresAttunement: true,
        effect: 'Click heels as a bonus action to double walking speed for 10 minutes. 3 uses/day'
      },
      {
        edition: '4e',
        cost: '1,800 gp',
        enhancementLevel: 6,
        effect: 'Minor action: gain +2 bonus to speed until end of turn. At-will'
      },
      {
        edition: '3e',
        cost: '12,000 gp',
        effect: 'Haste effect for up to 10 rounds/day (activatable). +30 ft speed, +1 attack, +1 AC'
      },
      {
        edition: '2e',
        cost: '—',
        xpValue: 2500,
        gpValue: 12500,
        effect: 'Haste: double movement and attacks for up to 10 rounds per day'
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GLOVES / BRACERS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'gauntlets-of-ogre-power',
    name: 'Gauntlets of Ogre Power',
    slot: 'gloves',
    weight: '1 lb.',
    editionData: [
      {
        edition: '5e',
        cost: '8,000 gp',
        rarity: 'uncommon',
        requiresAttunement: true,
        effect: 'Strength score becomes 19 while wearing these gauntlets'
      },
      {
        edition: '4e',
        cost: '1,800 gp',
        enhancementLevel: 6,
        effect: '+1 item bonus to Athletics checks and melee damage rolls'
      },
      {
        edition: '3e',
        cost: '4,000 gp',
        effect: '+2 enhancement bonus to Strength'
      },
      {
        edition: '2e',
        cost: '—',
        xpValue: 1000,
        gpValue: 6000,
        effect: 'Set Strength to 18/00 (exceptional). +3 to hit, +6 damage in melee'
      }
    ]
  },
  {
    id: 'bracers-of-defense',
    name: 'Bracers of Defense',
    slot: 'gloves',
    weight: '1 lb.',
    editionData: [
      {
        edition: '5e',
        cost: '6,000 gp',
        rarity: 'rare',
        requiresAttunement: true,
        bonus: 2,
        effect: '+2 bonus to AC while wearing no armor and not using a shield'
      },
      {
        edition: '4e',
        cost: '1,800 gp',
        enhancementLevel: 6,
        bonus: 1,
        effect: '+1 bonus to AC when not wearing heavy armor'
      },
      {
        edition: '3e',
        cost: '4,000 gp',
        bonus: 1,
        effect: '+1 armor bonus to AC (as if wearing armor, stacks with nothing)'
      },
      {
        edition: '2e',
        cost: '—',
        xpValue: 600,
        gpValue: 3000,
        effect: 'AC bonus (AC 6 to AC 2 depending on variant). Only for classes that cannot wear armor'
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BELTS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'belt-of-giant-strength',
    name: 'Belt of Giant Strength',
    slot: 'belt',
    weight: '1 lb.',
    editionData: [
      {
        edition: '5e',
        cost: '24,000 gp',
        rarity: 'very-rare',
        requiresAttunement: true,
        effect: 'Strength score becomes 23 (Hill Giant). Variants exist for higher STR (Frost: 25, Fire/Cloud: 27, Storm: 29)'
      },
      {
        edition: '3e',
        cost: '16,000 gp',
        effect: '+4 enhancement bonus to Strength'
      },
      {
        edition: '2e',
        cost: '—',
        xpValue: 2000,
        gpValue: 15000,
        effect: 'Grants Hill Giant Strength (19). Variants for other giant types'
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AMULETS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'amulet-of-health',
    name: 'Amulet of Health',
    slot: 'amulet',
    weight: '1 lb.',
    editionData: [
      {
        edition: '5e',
        cost: '8,000 gp',
        rarity: 'rare',
        requiresAttunement: true,
        effect: 'Constitution score becomes 19 while wearing this amulet'
      },
      {
        edition: '4e',
        cost: '520 gp',
        enhancementLevel: 2,
        effect: '+2 item bonus to Fortitude defense'
      },
      {
        edition: '3e',
        cost: '4,000 gp',
        effect: '+2 enhancement bonus to Constitution'
      },
      {
        edition: '2e',
        cost: '—',
        xpValue: 500,
        gpValue: 3000,
        effect: 'Immune to disease. (Known as Periapt of Health in 2e)'
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // HELMS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'helm-of-brilliance',
    name: 'Helm of Brilliance',
    slot: 'helm',
    weight: '3 lb.',
    editionData: [
      {
        edition: '5e',
        cost: '—',
        rarity: 'very-rare',
        requiresAttunement: true,
        effect: 'Studded with gems that allow casting fire-based spells. Gems are consumed on use. Resistance to fire damage'
      },
      {
        edition: '3e',
        cost: '125,000 gp',
        effect: 'Contains gem-powered fire spells: Fireball, Wall of Fire, Prismatic Spray. Flaming weapon aura'
      },
      {
        edition: '2e',
        cost: '—',
        xpValue: 2500,
        gpValue: 60000,
        effect: 'Gems power fire spells (Fireball, Wall of Fire). Undead within 30\' must save or be destroyed'
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // WONDROUS ITEMS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'bag-of-holding',
    name: 'Bag of Holding',
    slot: 'wondrous',
    weight: '15 lb.',
    editionData: [
      {
        edition: '5e',
        cost: '4,000 gp',
        rarity: 'uncommon',
        requiresAttunement: false,
        effect: 'Interior is larger than outside. Holds up to 500 lb. / 64 cu. ft. Always weighs 15 lb.'
      },
      {
        edition: '4e',
        cost: '1,000 gp',
        enhancementLevel: 5,
        effect: 'Holds up to 200 lb. / 20 cu. ft. Always weighs 1 lb.'
      },
      {
        edition: '3e',
        cost: '2,500 gp',
        effect: 'Type I: holds 250 lb. / 30 cu. ft. Always weighs 15 lb.'
      },
      {
        edition: '2e',
        cost: '—',
        xpValue: 5000,
        gpValue: 25000,
        effect: 'Holds 10,000 coins weight. Opening is 2\' across, 4\' deep. Always weighs 15 lb.'
      }
    ]
  },
  {
    id: 'portable-hole',
    name: 'Portable Hole',
    slot: 'wondrous',
    weight: '0 lb.',
    editionData: [
      {
        edition: '5e',
        cost: '20,000 gp',
        rarity: 'rare',
        requiresAttunement: false,
        effect: '6-foot diameter, 10-foot deep extradimensional hole. Placing inside a Bag of Holding destroys both and opens a gate to the Astral Plane'
      },
      {
        edition: '3e',
        cost: '20,000 gp',
        effect: '6\' diameter, 10\' deep. Can be folded like cloth'
      },
      {
        edition: '2e',
        cost: '—',
        xpValue: 5000,
        gpValue: 50000,
        effect: '6\' diameter, 10\' deep pit. Folds to pocket size. Do NOT put in a Bag of Holding'
      }
    ]
  },
  {
    id: 'decanter-of-endless-water',
    name: 'Decanter of Endless Water',
    slot: 'wondrous',
    weight: '2 lb.',
    editionData: [
      {
        edition: '5e',
        cost: '135,000 gp',
        rarity: 'uncommon',
        requiresAttunement: false,
        effect: 'Speak command word to produce 1 gallon (stream), 5 gallons (fountain), or 30 gallons/round (geyser)'
      },
      {
        edition: '3e',
        cost: '9,000 gp',
        effect: 'Stream (1 gal/round), Fountain (5 gal/round), Geyser (pushes creatures, 30 gal/round)'
      },
      {
        edition: '2e',
        cost: '—',
        xpValue: 1000,
        gpValue: 3000,
        effect: 'Produces fresh or salt water: stream, fountain, or geyser settings'
      }
    ]
  },
  {
    id: 'immovable-rod',
    name: 'Immovable Rod',
    slot: 'wondrous',
    weight: '2 lb.',
    editionData: [
      {
        edition: '5e',
        cost: '5,000 gp',
        rarity: 'uncommon',
        requiresAttunement: false,
        effect: 'Press button to magically fix the rod in place. Can hold up to 8,000 lb. DC 30 Strength check to move it'
      },
      {
        edition: '3e',
        cost: '5,000 gp',
        effect: 'Activated to hold firm in space. Holds 8,000 lb. DC 30 to move'
      },
      {
        edition: '2e',
        cost: '—',
        xpValue: 1000,
        gpValue: 5000,
        effect: 'Button press locks rod in space. Supports up to 8,000 lb.'
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // WANDS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'wand-of-magic-missiles',
    name: 'Wand of Magic Missiles',
    slot: 'wand',
    weight: '1 lb.',
    editionData: [
      {
        edition: '5e',
        cost: '8,000 gp',
        rarity: 'uncommon',
        requiresAttunement: false,
        charges: 7,
        recharges: '1d6+1 at dawn',
        effect: 'Expend 1–3 charges to cast Magic Missile. If last charge used, roll d20 — on a 1 the wand crumbles'
      },
      {
        edition: '4e',
        cost: '360 gp',
        enhancementLevel: 3,
        effect: '+1 bonus to attack and damage with arcane powers. Daily: Magic Missile as free action'
      },
      {
        edition: '3e',
        cost: '750 gp',
        charges: 50,
        effect: 'Casts Magic Missile (1st level, 1 missile) per charge. CL 1'
      },
      {
        edition: '2e',
        cost: '—',
        xpValue: 4000,
        gpValue: 35000,
        charges: 100,
        effect: 'Each charge fires a Magic Missile (one missile per charge spent)'
      }
    ]
  },
  {
    id: 'wand-of-fireballs',
    name: 'Wand of Fireballs',
    slot: 'wand',
    weight: '1 lb.',
    editionData: [
      {
        edition: '5e',
        cost: '32,000 gp',
        rarity: 'rare',
        requiresAttunement: 'by a spellcaster',
        charges: 7,
        recharges: '1d6+1 at dawn',
        effect: 'Expend 1–3 charges to cast Fireball (save DC 15). Extra charges increase level. Crumbles on a 1 if last charge used'
      },
      {
        edition: '3e',
        cost: '11,250 gp',
        charges: 50,
        effect: 'Casts Fireball (5th level, 5d6) per charge. CL 5'
      },
      {
        edition: '2e',
        cost: '—',
        xpValue: 4000,
        gpValue: 25000,
        charges: 100,
        effect: 'Each charge fires a 6d6 Fireball'
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // STAVES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'staff-of-healing',
    name: 'Staff of Healing',
    slot: 'staff',
    weight: '4 lb.',
    editionData: [
      {
        edition: '5e',
        cost: '13,000 gp',
        rarity: 'rare',
        requiresAttunement: 'by a bard, cleric, or druid',
        charges: 10,
        recharges: '1d6+4 at dawn',
        effect: 'Expend charges to cast Cure Wounds (1), Lesser Restoration (2), or Mass Cure Wounds (5)'
      },
      {
        edition: '3e',
        cost: '27,750 gp',
        charges: 50,
        effect: 'Contains Cure Light / Serious / Critical Wounds and Remove Disease spells'
      },
      {
        edition: '2e',
        cost: '—',
        xpValue: 4000,
        gpValue: 25000,
        charges: 25,
        effect: 'Cures 1d6+1 HP per charge. Usable by clerics and druids only'
      }
    ]
  },
  {
    id: 'staff-of-power',
    name: 'Staff of Power',
    slot: 'staff',
    weight: '4 lb.',
    editionData: [
      {
        edition: '5e',
        cost: '—',
        rarity: 'very-rare',
        requiresAttunement: 'by a sorcerer, warlock, or wizard',
        charges: 20,
        recharges: '2d8+4 at dawn',
        bonus: 2,
        effect: '+2 to AC, saving throws, and spell attack rolls. Expend charges for various spells. Retributive strike option'
      },
      {
        edition: '3e',
        cost: '211,000 gp',
        charges: 50,
        bonus: 2,
        effect: '+2 to AC and saving throws. Contains Wall of Force, Fireball, Lightning Bolt, and more'
      },
      {
        edition: '2e',
        cost: '—',
        xpValue: 12000,
        gpValue: 60000,
        charges: 25,
        effect: '+2 bonus on all saving throws. Contains multiple offensive spells. Can be broken for Retributive Strike'
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SCROLLS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'spell-scroll-1st',
    name: 'Spell Scroll (1st Level)',
    slot: 'scroll',
    weight: '0 lb.',
    consumable: true,
    editionData: [
      {
        edition: '5e',
        cost: '75 gp',
        rarity: 'common',
        requiresAttunement: false,
        effect: 'Contains one 1st-level spell. If the spell is on your class list, you can cast it. Save DC 13, attack bonus +5'
      },
      {
        edition: '3e',
        cost: '25 gp',
        effect: 'Contains one 1st-level spell at CL 1. Consumed on use'
      },
      {
        edition: '2e',
        cost: '—',
        xpValue: 100,
        gpValue: 300,
        effect: 'Contains one 1st-level spell. Usable by the appropriate class. Consumed on use'
      }
    ]
  },
  {
    id: 'spell-scroll-3rd',
    name: 'Spell Scroll (3rd Level)',
    slot: 'scroll',
    weight: '0 lb.',
    consumable: true,
    editionData: [
      {
        edition: '5e',
        cost: '200 gp',
        rarity: 'uncommon',
        requiresAttunement: false,
        effect: 'Contains one 3rd-level spell. Save DC 15, attack bonus +7'
      },
      {
        edition: '3e',
        cost: '375 gp',
        effect: 'Contains one 3rd-level spell at CL 5. Consumed on use'
      },
      {
        edition: '2e',
        cost: '—',
        xpValue: 300,
        gpValue: 1500,
        effect: 'Contains one 3rd-level spell. Consumed on use'
      }
    ]
  },
]

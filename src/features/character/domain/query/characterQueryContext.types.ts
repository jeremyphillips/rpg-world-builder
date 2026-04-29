export type CharacterQueryContext = {
  identity: {
    id: string
    name: string
    type: 'pc' | 'npc'
    raceId: string | null
    alignmentId: string | null
  }

  progression: {
    totalLevel: number
    classIds: ReadonlySet<string>
    classLevelsById: ReadonlyMap<string, number>
    xp: number
    levelUpPending: boolean
  }

  inventory: {
    weaponIds: ReadonlySet<string>
    armorIds: ReadonlySet<string>
    gearIds: ReadonlySet<string>
    magicItemIds: ReadonlySet<string>
    allEquipmentIds: ReadonlySet<string>
  }

  proficiencies: {
    skillIds: ReadonlySet<string>
  }

  spells: {
    knownSpellIds: ReadonlySet<string>
  }

  economy: {
    totalWealthCp: number
  }

  combat: {
    equippedArmorId: string | null
    equippedShieldId: string | null
    equippedMainHandWeaponId: string | null
    equippedOffHandWeaponId: string | null
  }
}

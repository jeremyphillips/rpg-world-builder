import { describe, expect, it } from 'vitest'

import { createEmptyCharacterQueryContext } from '../buildCharacterQueryContext'
import { getOwnedIdsForCampaignContentListKey } from '../ownedIdsForCampaignContentList'
import {
  canAffordCostCp,
  classLevel,
  getEquippedWeaponIds,
  getOwnedIdsForContentType,
  hasClass,
  isEquipped,
  isProficientInSkill,
  knowsSpell,
  meetsLevelRequirement,
  ownsAnyItem,
  ownsItem,
} from '../selectors'

describe('character query selectors', () => {
  const ctx = createEmptyCharacterQueryContext()
  ctx.inventory.weaponIds = new Set(['w1'])
  ctx.proficiencies.skillIds = new Set(['acrobatics'])
  ctx.spells.knownSpellIds = new Set(['magic-missile'])
  ctx.economy.totalWealthCp = 500
  ctx.progression.totalLevel = 4
  ctx.progression.classIds = new Set(['wizard'])
  ctx.progression.classLevelsById = new Map([['wizard', 4]])
  ctx.combat.equippedMainHandWeaponId = 'w1'
  ctx.combat.equippedArmorId = 'a1'

  it('inventory', () => {
    expect(ownsItem(ctx, 'weapons', 'w1')).toBe(true)
    expect(ownsAnyItem(ctx, 'weapons', ['x', 'w1'])).toBe(true)
    expect(getOwnedIdsForContentType(ctx, 'weapons')).toBe(ctx.inventory.weaponIds)
  })

  it('spells and proficiencies', () => {
    expect(knowsSpell(ctx, 'magic-missile')).toBe(true)
    expect(isProficientInSkill(ctx, 'acrobatics')).toBe(true)
  })

  it('economy and progression', () => {
    expect(canAffordCostCp(ctx, 400)).toBe(true)
    expect(canAffordCostCp(ctx, 600)).toBe(false)
    expect(hasClass(ctx, 'wizard')).toBe(true)
    expect(classLevel(ctx, 'wizard')).toBe(4)
    expect(meetsLevelRequirement(ctx, 4)).toBe(true)
    expect(meetsLevelRequirement(ctx, 5)).toBe(false)
  })

  it('combat', () => {
    expect(isEquipped(ctx, 'w1')).toBe(true)
    expect(isEquipped(ctx, 'a1')).toBe(true)
    expect(getEquippedWeaponIds(ctx)).toEqual(['w1'])
  })

  it('getOwnedIdsForCampaignContentListKey maps list keys to context slices', () => {
    expect(getOwnedIdsForCampaignContentListKey(ctx, 'spells')).toBe(ctx.spells.knownSpellIds)
    expect(getOwnedIdsForCampaignContentListKey(ctx, 'skillProficiencies')).toBe(ctx.proficiencies.skillIds)
    expect(getOwnedIdsForCampaignContentListKey(ctx, 'weapons')).toBe(ctx.inventory.weaponIds)
    expect(getOwnedIdsForCampaignContentListKey(ctx, 'gear')).toBe(ctx.inventory.gearIds)
    expect(getOwnedIdsForCampaignContentListKey(ctx, 'armor')).toBe(ctx.inventory.armorIds)
    expect(getOwnedIdsForCampaignContentListKey(ctx, 'magicItems')).toBe(ctx.inventory.magicItemIds)
  })
})

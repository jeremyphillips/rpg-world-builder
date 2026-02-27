import { useState, useMemo } from 'react'
import { useCharacterBuilder } from '@/features/characterBuilder/context'
import { useCampaignRules } from '@/app/providers/CampaignRulesProvider'
import { getMagicItemBudget } from '@/features/equipment/domain/magic-items/magicItems'
import { ButtonGroup } from '@/ui/elements'
import { ConfirmModal } from '@/ui/modals'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import type { MagicItemSlot, MagicItem, MagicItemRarity } from '@/data/equipment'
import type { EquipmentItemInstance } from '@/shared/types/character.core'
import type { EnchantableSlot } from '@/data/equipment/enchantments/enchantmentTemplates.types'
import { moneyToGp } from '@/features/equipment/domain/pricing/pricing'
import type { Coin, Money } from '@/data/equipment'

// ---------------------------------------------------------------------------
// Enhancement types & constants
// ---------------------------------------------------------------------------

type EnhancementGroup = 'weapons' | 'armor' | 'shields'

type ConfirmRemovalState = {
  open: boolean
  instanceKind: 'weapon' | 'armor'
  instanceId: string
}

const CLOSED_CONFIRM: ConfirmRemovalState = {
  open: false,
  instanceKind: 'weapon',
  instanceId: '',
}

const ENHANCEMENT_GROUPS: { id: EnhancementGroup; label: string }[] = [
  { id: 'weapons', label: 'Weapons' },
  { id: 'armor', label: 'Armor' },
  { id: 'shields', label: 'Shields' },
]

const GROUP_TO_SLOT: Record<EnhancementGroup, EnchantableSlot> = {
  weapons: 'weapon',
  armor: 'armor',
  shields: 'shield',
}

// ---------------------------------------------------------------------------
// Magic-item slot → group mapping
// ---------------------------------------------------------------------------

type ItemGroup = 'worn' | 'wondrous' | 'implements' | 'consumables' | 'weapon' | 'armor_shield'

const SLOT_TO_GROUP: Record<MagicItemSlot, ItemGroup> = {
  weapon: 'weapon',
  armor: 'armor_shield',
  shield: 'armor_shield',
  ring: 'worn',
  cloak: 'worn',
  boots: 'worn',
  gloves: 'worn',
  helm: 'worn',
  belt: 'worn',
  amulet: 'worn',
  wondrous: 'wondrous',
  wand: 'implements',
  staff: 'implements',
  rod: 'implements',
  potion: 'consumables',
  scroll: 'consumables',
}

const GROUP_OPTIONS: { id: ItemGroup; label: string }[] = [
  { id: 'weapon', label: 'Weapons' },
  { id: 'armor_shield', label: 'Armor & Shields' },
  { id: 'worn', label: 'Worn Items' },
  { id: 'wondrous', label: 'Wondrous' },
  { id: 'implements', label: 'Implements' },
  { id: 'consumables', label: 'Consumables' },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MagicItemsStep = () => {
  const [activeEnhGroup, setActiveEnhGroup] = useState<EnhancementGroup>('weapons')
  const [activeGroup, setActiveGroup] = useState<ItemGroup>('worn')
  const [confirmState, setConfirmState] = useState<ConfirmRemovalState>(CLOSED_CONFIRM)
  const [addCopyBaseId, setAddCopyBaseId] = useState('')

  const {
    state,
    updateMagicItems,
    updateWeaponInstance,
    updateArmorInstance,
    addWeaponInstance,
    addArmorInstance,
  } = useCharacterBuilder()

  const { catalog, ruleset } = useCampaignRules()

  const {
    step,
    totalLevel,
    equipment: selectedEquipment,
    wealth,
  } = state

  const magicItemBudget = ruleset.mechanics?.progression?.magicItemBudget
  const budgetTier = getMagicItemBudget(magicItemBudget, totalLevel ?? 1)

  // =========================================================================
  // Catalog lookups
  // =========================================================================

  // Catalog armor type hasn't been migrated yet; runtime data has `category`
  const isShieldBaseId = (baseId: string): boolean => {
    const item = catalog.armorById[baseId] as any
    return item?.category === 'shields'
  }

  const getBaseItemName = (baseId: string, kind: 'weapon' | 'armor'): string => {
    if (kind === 'weapon') return catalog.weaponsById[baseId]?.name ?? baseId
    return catalog.armorById[baseId]?.name ?? baseId
  }

  const getInstanceLabel = (inst: EquipmentItemInstance, kind: 'weapon' | 'armor'): string => {
    const name = getBaseItemName(inst.baseId, kind)
    if (!inst.enhancementTemplateId) return name
    const t = catalog.enhancementTemplatesById[inst.enhancementTemplateId]
    if (!t) return name
    const short = t.name.replace(' Enhancement', '')
    return `${name} (${short})`
  }

  const getEnhancementCostGp = (templateId: string | undefined): number => {
    if (!templateId) return 0
    const tpl = catalog.enhancementTemplatesById[templateId]
    if (!tpl) return 0
    return moneyToGp(tpl.cost as Money)
  }

  const asFinite = (n: unknown): number => {
    const x = typeof n === 'number' ? n : typeof n === 'string' ? Number(n) : NaN;
    return Number.isFinite(x) ? x : 0;
  };

  const sumEnhancementCost = (instances: any[]): number => {
    return instances.reduce((sum: number, inst: any) => {
      // wherever you compute enhancement cost:
      const costGp = getEnhancementCostGp(inst.enhancementTemplateId);
      return sum + asFinite(costGp);
    }, 0);
  };
  // =========================================================================
  // Enhancement data
  // =========================================================================

  const weaponInstances = selectedEquipment?.weaponInstances ?? []
  const allArmorInstances = selectedEquipment?.armorInstances ?? []
  const armorInstances = allArmorInstances.filter(i => !isShieldBaseId(i.baseId))
  const shieldInstances = allArmorInstances.filter(i => isShieldBaseId(i.baseId))

  const instancesForGroup: Record<EnhancementGroup, EquipmentItemInstance[]> = {
    weapons: weaponInstances,
    armor: armorInstances,
    shields: shieldInstances,
  }
  const activeInstances = instancesForGroup[activeEnhGroup]
  const activeInstanceKind: 'weapon' | 'armor' =
    activeEnhGroup === 'weapons' ? 'weapon' : 'armor'

  const slot = GROUP_TO_SLOT[activeEnhGroup]
  const availableTemplates = Object.values(catalog.enhancementTemplatesById).filter(
    t => t.appliesTo.includes(slot),
  )
  const templateIds = availableTemplates.map(t => t.id)

  // Budget
  const baseGp = wealth?.baseGp ?? 0

  const mundaneCostGp = useMemo(() => {
    const weapons = selectedEquipment?.weapons ?? []
    const armor = selectedEquipment?.armor ?? []
    const gear = selectedEquipment?.gear ?? []

    const costOf = (item: any) => moneyToGp(item?.cost as unknown as { coin: Coin; value: number })
    const wCost = weapons.reduce((sum, id) => sum + costOf(catalog.weaponsById[id]), 0)
    const aCost = armor.reduce((sum, id) => sum + costOf(catalog.armorById[id]), 0)
    const gCost = gear.reduce((sum, id) => sum + costOf(catalog.gearById[id]), 0)
    return wCost + aCost + gCost
  }, [selectedEquipment?.weapons, selectedEquipment?.armor, selectedEquipment?.gear, catalog])

  const totalEnhCost = sumEnhancementCost([...weaponInstances, ...allArmorInstances])
  const remainingGp = baseGp - mundaneCostGp - totalEnhCost
  
  const overBudget = remainingGp < 0
  console.log({
    baseGp,
    mundaneCostGp,
    totalEnhCost,
    baseGpIsNaN: Number.isNaN(baseGp),
    mundaneIsNaN: Number.isNaN(mundaneCostGp),
    enhIsNaN: Number.isNaN(totalEnhCost),
  });
  // Add-copy options
  const ownedWeaponBaseIds = [...new Set(selectedEquipment?.weapons ?? [])]
  const ownedArmorBaseIds = [
    ...new Set((selectedEquipment?.armor ?? []).filter(id => !isShieldBaseId(id))),
  ]
  const ownedShieldBaseIds = [
    ...new Set((selectedEquipment?.armor ?? []).filter(id => isShieldBaseId(id))),
  ]
  const addCopyOpts: Record<EnhancementGroup, { value: string; label: string }[]> = {
    weapons: ownedWeaponBaseIds.map(id => ({ value: id, label: getBaseItemName(id, 'weapon') })),
    armor: ownedArmorBaseIds.map(id => ({ value: id, label: getBaseItemName(id, 'armor') })),
    shields: ownedShieldBaseIds.map(id => ({ value: id, label: getBaseItemName(id, 'armor') })),
  }

  const hasAnyInstances = weaponInstances.length > 0 || allArmorInstances.length > 0

  // Disabled template IDs — those that would exceed the budget
  const computeDisabledIds = (
    currentTemplateId: string | undefined,
  ): Set<string> => {
    const disabled = new Set<string>()
    const currentCost = getEnhancementCostGp(currentTemplateId)
    const costWithoutThis = totalEnhCost - currentCost
    for (const tid of templateIds) {
      if (tid === currentTemplateId) continue
      const optCost = getEnhancementCostGp(tid)
      if (mundaneCostGp + costWithoutThis + optCost > baseGp) {
        disabled.add(tid)
      }
    }
    return disabled
  }

  // =========================================================================
  // Magic-items data — filtered by ruleset budget rarity ceiling
  // =========================================================================

  const RARITY_ORDER: MagicItemRarity[] = [
    'common', 'uncommon', 'rare', 'very-rare', 'legendary', 'artifact',
  ]

  const allMagicItems = useMemo(() => {
    const items = Object.values(catalog.magicItemsById) as MagicItem[]
    if (!budgetTier?.maxRarity) return items
    const maxIdx = RARITY_ORDER.indexOf(budgetTier.maxRarity)
    return items.filter(item => {
      if (!item.rarity) return true
      return RARITY_ORDER.indexOf(item.rarity) <= maxIdx
    })
  }, [catalog.magicItemsById, budgetTier])

  const selectedMagicItems = selectedEquipment?.magicItems ?? []

  const selectedPermanentCount = selectedMagicItems.filter(id => {
    const item = catalog.magicItemsById[id]
    return item && !item.consumable
  }).length

  const selectedConsumableCount = selectedMagicItems.filter(id => {
    const item = catalog.magicItemsById[id]
    return item?.consumable
  }).length

  const maxPermanent = budgetTier?.permanentItems
  const maxConsumable = budgetTier?.consumableItems
  const maxAttunement = budgetTier?.maxAttunement

  const selectedAttunedCount = selectedMagicItems.filter(id => {
    const item = catalog.magicItemsById[id]
    return item?.requiresAttunement
  }).length

  const visibleItems = allMagicItems.filter(
    item => SLOT_TO_GROUP[item.slot] === activeGroup,
  )

  const visibleGroupOptions = GROUP_OPTIONS.filter(g =>
    allMagicItems.some(item => SLOT_TO_GROUP[item.slot] === g.id),
  )

  const magicItemOptions = visibleItems.map(item => {
    const rarityLabel = item.rarity ? ` [${item.rarity}]` : ''
    const costLabel = item.cost ? ` (${item.cost.value} ${item.cost.coin})` : ''
    const isSelected = selectedMagicItems.includes(item.id)

    let disabled = false
    if (!isSelected) {
      const isConsumable = !!item.consumable
      if (isConsumable && maxConsumable != null && selectedConsumableCount >= maxConsumable) {
        disabled = true
      }
      if (!isConsumable && maxPermanent != null && selectedPermanentCount >= maxPermanent) {
        disabled = true
      }
      if (item.requiresAttunement && maxAttunement != null && selectedAttunedCount >= maxAttunement) {
        disabled = true
      }
    }

    return {
      id: item.id,
      label: `${item.name}${rarityLabel}${costLabel}`,
      disabled,
    }
  })

  const hasMagicItems = allMagicItems.length > 0

  // =========================================================================
  // Handlers
  // =========================================================================

  const handleEnhChange = (
    instId: string,
    kind: 'weapon' | 'armor',
    currentId: string | undefined,
    nextId: string,
  ) => {
    if (currentId && !nextId) {
      setConfirmState({ open: true, instanceKind: kind, instanceId: instId })
      return
    }
    const updater = kind === 'weapon' ? updateWeaponInstance : updateArmorInstance
    updater(instId, { enhancementTemplateId: nextId || undefined })
  }

  const handleConfirmRemoval = () => {
    const { instanceKind: kind, instanceId: id } = confirmState
    const updater = kind === 'weapon' ? updateWeaponInstance : updateArmorInstance
    updater(id, { enhancementTemplateId: undefined })
    setConfirmState(CLOSED_CONFIRM)
  }

  const handleAddCopy = () => {
    if (!addCopyBaseId) return
    if (activeEnhGroup === 'weapons') addWeaponInstance(addCopyBaseId)
    else addArmorInstance(addCopyBaseId)
    setAddCopyBaseId('')
  }

  // =========================================================================
  // Render
  // =========================================================================

  if (!hasAnyInstances && !hasMagicItems) {
    return (
      <>
        <h2>{step.name}</h2>
        <p>No enhancements or magic items available at this level.</p>
      </>
    )
  }

  return (
    <>
      <h2>Choose {step.name}</h2>

      {/* ---- Enhancements ---- */}
      {hasAnyInstances && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Enhancements
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Gold remaining: {remainingGp.toLocaleString()} gp
            {' · '}
            Enhancement total: {totalEnhCost.toLocaleString()} gp
          </Typography>

          {overBudget && (
            <Typography variant="body2" color="error" sx={{ mb: 1 }}>
              Over budget by {Math.abs(remainingGp).toLocaleString()} gp
            </Typography>
          )}

          <ButtonGroup
            options={ENHANCEMENT_GROUPS}
            value={activeEnhGroup}
            onChange={val => {
              setActiveEnhGroup(val as EnhancementGroup)
              setAddCopyBaseId('')
            }}
            size="sm"
          />

          {activeInstances.length > 0 ? (
            activeInstances.map(inst => {
              const disabled = computeDisabledIds(inst.enhancementTemplateId)

              return (
                <Box
                  key={inst.instanceId}
                  sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}
                >
                  <Typography sx={{ minWidth: 160, fontWeight: 500 }}>
                    {getInstanceLabel(inst, activeInstanceKind)}
                  </Typography>

                  <FormControl size="small" sx={{ minWidth: 220 }}>
                    <InputLabel>Enhancement</InputLabel>
                    <Select
                      label="Enhancement"
                      value={inst.enhancementTemplateId ?? ''}
                      onChange={e =>
                        handleEnhChange(
                          inst.instanceId,
                          activeInstanceKind,
                          inst.enhancementTemplateId,
                          e.target.value as string,
                        )
                      }
                    >
                      <MenuItem value="">No Enhancement</MenuItem>
                      {availableTemplates.map(t => {
                        const costSuffix = t.cost ? ` (${t.cost.value} ${t.cost.coin})` : ''
                        return (
                          <MenuItem
                            key={t.id}
                            value={t.id}
                            disabled={disabled.has(t.id)}
                          >
                            {t.name}
                            {costSuffix}
                          </MenuItem>
                        )
                      })}
                    </Select>
                  </FormControl>
                </Box>
              )
            })
          ) : (
            <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
              No {activeEnhGroup} to enhance.
            </Typography>
          )}

          {/* Add copy */}
          {addCopyOpts[activeEnhGroup].length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Add copy of…</InputLabel>
                <Select
                  label="Add copy of…"
                  value={addCopyBaseId}
                  onChange={e => setAddCopyBaseId(e.target.value as string)}
                >
                  {addCopyOpts[activeEnhGroup].map(o => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                size="small"
                disabled={!addCopyBaseId}
                onClick={handleAddCopy}
              >
                Add
              </Button>
            </Box>
          )}
        </Box>
      )}

      {/* ---- Magic Items ---- */}
      {hasMagicItems && (
        <>
          <Typography variant="h6" gutterBottom>
            Magic Items
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Permanent: {selectedPermanentCount}{maxPermanent != null ? ` / ${maxPermanent}` : ''}
            {' · '}
            Consumable: {selectedConsumableCount}{maxConsumable != null ? ` / ${maxConsumable}` : ''}
            {maxAttunement != null && (
              <>
                {' · '}
                Attuned: {selectedAttunedCount} / {maxAttunement}
              </>
            )}
            {budgetTier?.maxRarity && (
              <>
                {' · '}
                Max rarity: {budgetTier.maxRarity}
              </>
            )}
          </Typography>

          <ButtonGroup
            options={visibleGroupOptions}
            value={activeGroup}
            onChange={val => setActiveGroup(val as ItemGroup)}
            size="sm"
          />

          {magicItemOptions.length > 0 ? (
            <ButtonGroup
              options={magicItemOptions}
              value={selectedMagicItems}
              onChange={updateMagicItems}
              multiSelect
              autoSelectSingle={false}
              size="sm"
            />
          ) : (
            <p>No items in this category.</p>
          )}
        </>
      )}

      {/* ---- Confirm removal modal ---- */}
      <ConfirmModal
        open={confirmState.open}
        headline="Remove enhancement?"
        description="Remove the enhancement from this item? This will make it mundane."
        confirmLabel="Remove"
        cancelLabel="Cancel"
        onConfirm={handleConfirmRemoval}
        onCancel={() => setConfirmState(CLOSED_CONFIRM)}
      />
    </>
  )
}

export default MagicItemsStep

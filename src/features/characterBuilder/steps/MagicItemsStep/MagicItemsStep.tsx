import { useState, useMemo } from 'react'
import { useCharacterBuilder } from '@/features/characterBuilder/context'
import { ButtonGroup } from '@/ui/elements'
import { ConfirmModal } from '@/ui/modals'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import type { EditionId } from '@/data'
import { equipment as equipmentCatalog } from '@/data'
import type { MagicItemSlot } from '@/data/equipment/magicItems.types'
import type { ArmorEditionDatum } from '@/data/equipment/armor.types'
import type { EquipmentItemInstance } from '@/shared/types/character.core'
import type { EnchantableSlot } from '@/data/equipment/enchantments/enchantmentTemplates.types'
import {
  getAvailableMagicItems,
  getMagicItemBudget,
  resolveEquipmentEdition,
  getAvailableEnhancementTemplates,
  calculateEquipmentCost,
  resolveEnchantmentTemplateDatum,
} from '@/features/equipment/domain'

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
// Pure helpers
// ---------------------------------------------------------------------------

function parseGpCost(costStr: string | undefined): number {
  if (!costStr || costStr === '—') return 0
  const cleaned = costStr.replace(/,/g, '')
  const parts = cleaned.split(' ')
  const num = parseFloat(parts[0])
  if (isNaN(num)) return 0
  switch (parts[1]?.toLowerCase()) {
    case 'sp':
      return num / 10
    case 'cp':
      return num / 100
    default:
      return num
  }
}

function isShieldBaseId(baseId: string, equipEdition: string): boolean {
  const item = equipmentCatalog.armor.find(a => a.id === baseId)
  if (!item) return false
  const datum = item.editionData.find(d => d.edition === equipEdition) as
    | ArmorEditionDatum
    | undefined
  return (
    datum?.category === 'shields' ||
    (!datum?.category && item.name.toLowerCase().includes('shield'))
  )
}

function enhancementCostGp(templateId: string | undefined, edition: string): number {
  if (!templateId) return 0
  const template = equipmentCatalog.enchantments.enhancementTemplates.find(
    t => t.id === templateId,
  )
  if (!template) return 0
  const datum = resolveEnchantmentTemplateDatum(template, edition)
  return parseGpCost(datum?.cost)
}

function baseItemName(baseId: string, kind: 'weapon' | 'armor'): string {
  if (kind === 'weapon') {
    return equipmentCatalog.weapons.find(w => w.id === baseId)?.name ?? baseId
  }
  return equipmentCatalog.armor.find(a => a.id === baseId)?.name ?? baseId
}

function instanceLabel(inst: EquipmentItemInstance, kind: 'weapon' | 'armor'): string {
  const name = baseItemName(inst.baseId, kind)
  if (!inst.enhancementTemplateId) return name
  const t = equipmentCatalog.enchantments.enhancementTemplates.find(
    x => x.id === inst.enhancementTemplateId,
  )
  if (!t) return name
  const short = t.name.replace(' Enhancement', '')
  return `${name} (${short})`
}

function sumEnhancementCost(instances: EquipmentItemInstance[], edition: string): number {
  return instances.reduce(
    (sum, i) => sum + enhancementCostGp(i.enhancementTemplateId, edition),
    0,
  )
}

/** Returns template IDs that would push the build over budget for a given instance. */
function computeDisabledIds(
  templateIds: string[],
  currentTemplateId: string | undefined,
  totalEnhCost: number,
  mundaneCost: number,
  baseGp: number,
  edition: string,
): Set<string> {
  const disabled = new Set<string>()
  const currentCost = enhancementCostGp(currentTemplateId, edition)
  const costWithoutThis = totalEnhCost - currentCost
  for (const tid of templateIds) {
    if (tid === currentTemplateId) continue
    const optCost = enhancementCostGp(tid, edition)
    if (mundaneCost + costWithoutThis + optCost > baseGp) {
      disabled.add(tid)
    }
  }
  return disabled
}

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

  const {
    step,
    edition,
    equipment: selectedEquipment,
    totalLevel,
    wealth,
  } = state

  if (!edition) return null

  const characterLevel = totalLevel ?? 0
  const equipEdition = resolveEquipmentEdition(edition)

  // =========================================================================
  // Enhancement data
  // =========================================================================

  const weaponInstances = selectedEquipment?.weaponInstances ?? []
  const allArmorInstances = selectedEquipment?.armorInstances ?? []
  const armorInstances = allArmorInstances.filter(
    i => !isShieldBaseId(i.baseId, equipEdition),
  )
  const shieldInstances = allArmorInstances.filter(i =>
    isShieldBaseId(i.baseId, equipEdition),
  )

  const instancesForGroup: Record<EnhancementGroup, EquipmentItemInstance[]> = {
    weapons: weaponInstances,
    armor: armorInstances,
    shields: shieldInstances,
  }
  const activeInstances = instancesForGroup[activeEnhGroup]
  const activeInstanceKind: 'weapon' | 'armor' =
    activeEnhGroup === 'weapons' ? 'weapon' : 'armor'

  const slot = GROUP_TO_SLOT[activeEnhGroup]
  const availableTemplates = getAvailableEnhancementTemplates(edition, characterLevel).filter(
    t => t.appliesTo.includes(slot),
  )
  const templateIds = availableTemplates.map(t => t.id)

  // Budget
  const baseGp = wealth?.baseGp ?? 0

  const mundaneCostGp = useMemo(
    () =>
      calculateEquipmentCost(
        selectedEquipment?.weapons ?? [],
        selectedEquipment?.armor ?? [],
        selectedEquipment?.gear ?? [],
        equipmentCatalog.weapons,
        equipmentCatalog.armor,
        equipmentCatalog.gear,
        edition,
      ),
    [selectedEquipment?.weapons, selectedEquipment?.armor, selectedEquipment?.gear, edition],
  )

  const totalEnhCost = sumEnhancementCost(
    [...weaponInstances, ...allArmorInstances],
    edition,
  )
  const remainingGp = baseGp - mundaneCostGp - totalEnhCost
  const overBudget = remainingGp < 0

  // Add-copy options
  const ownedWeaponBaseIds = [...new Set(selectedEquipment?.weapons ?? [])]
  const ownedArmorBaseIds = [
    ...new Set((selectedEquipment?.armor ?? []).filter(id => !isShieldBaseId(id, equipEdition))),
  ]
  const ownedShieldBaseIds = [
    ...new Set((selectedEquipment?.armor ?? []).filter(id => isShieldBaseId(id, equipEdition))),
  ]
  const addCopyOpts: Record<EnhancementGroup, { value: string; label: string }[]> = {
    weapons: ownedWeaponBaseIds.map(id => ({ value: id, label: baseItemName(id, 'weapon') })),
    armor: ownedArmorBaseIds.map(id => ({ value: id, label: baseItemName(id, 'armor') })),
    shields: ownedShieldBaseIds.map(id => ({ value: id, label: baseItemName(id, 'armor') })),
  }

  const hasAnyInstances = weaponInstances.length > 0 || allArmorInstances.length > 0

  // =========================================================================
  // Magic-items data (unchanged logic)
  // =========================================================================

  const magicItemBudget = getMagicItemBudget(edition as EditionId, characterLevel)
  const availableMagicItems = getAvailableMagicItems(edition as EditionId, characterLevel)
  const selectedMagicItems = selectedEquipment?.magicItems ?? []

  const selectedPermanentCount = selectedMagicItems.filter(id => {
    const item = availableMagicItems.find(m => m.id === id)
    return item && !item.consumable
  }).length

  const selectedConsumableCount = selectedMagicItems.filter(id => {
    const item = availableMagicItems.find(m => m.id === id)
    return item?.consumable
  }).length

  const visibleItems = availableMagicItems.filter(
    item => SLOT_TO_GROUP[item.slot] === activeGroup,
  )

  const visibleGroupOptions = GROUP_OPTIONS.filter(g =>
    availableMagicItems.some(item => SLOT_TO_GROUP[item.slot] === g.id),
  )

  const magicItemOptions = visibleItems.map(item => {
    const datum = item.editionData.find(
      (d: { edition: string }) => d.edition === resolveEquipmentEdition(edition),
    )
    const isSelected = selectedMagicItems.includes(item.id)

    let disabled = false
    if (!isSelected && magicItemBudget) {
      if (item.consumable) {
        disabled = selectedConsumableCount >= magicItemBudget.consumableSlots
      } else {
        disabled = selectedPermanentCount >= magicItemBudget.permanentSlots
      }
    }

    const rarityLabel = datum?.rarity ? ` [${datum.rarity}]` : ''
    const costLabel = datum?.cost && datum.cost !== '—' ? ` (${datum.cost})` : ''

    return {
      id: item.id,
      label: `${item.name}${rarityLabel}${costLabel}`,
      disabled,
    }
  })

  const hasMagicItems = magicItemBudget && availableMagicItems.length > 0

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
        <p>No enhancements or magic items available for this edition and level.</p>
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
              const disabled = computeDisabledIds(
                templateIds,
                inst.enhancementTemplateId,
                totalEnhCost,
                mundaneCostGp,
                baseGp,
                edition,
              )

              return (
                <Box
                  key={inst.instanceId}
                  sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}
                >
                  <Typography sx={{ minWidth: 160, fontWeight: 500 }}>
                    {instanceLabel(inst, activeInstanceKind)}
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
                        const datum = resolveEnchantmentTemplateDatum(t, edition)
                        const costSuffix = datum?.cost ? ` (${datum.cost})` : ''
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
          <small>
            Permanent: {selectedPermanentCount} / {magicItemBudget.permanentSlots}
            {' · '}
            Consumable: {selectedConsumableCount} / {magicItemBudget.consumableSlots}
            {magicItemBudget.maxAttunement != null && (
              <> · Attunement slots: {magicItemBudget.maxAttunement}</>
            )}
          </small>

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

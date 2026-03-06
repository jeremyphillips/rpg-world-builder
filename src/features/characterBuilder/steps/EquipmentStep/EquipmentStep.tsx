import { useEffect, useRef } from 'react'
import { useCharacterBuilder } from '@/features/characterBuilder/context'
import { InvalidationNotice } from '@/features/characterBuilder/components'
import { ButtonGroup } from '@/ui/patterns'
import { useCampaignRules } from '@/app/providers/CampaignRulesProvider'
import {
  calculateEquipmentCostCp,
  getItemCostCp,
} from '@/features/equipment/domain'
import { moneyToCp, formatCp } from '@/shared/money'
import { collectIntrinsicEffects } from '@/features/character/domain/engine/collectCharacterEffects'
import {
  deriveEquipmentProficiency,
  evaluateEquipmentEligibility,
} from '@/features/mechanics/domain/proficiencies/proficiency-adapters'
import type { Character } from '@/features/character/domain/types'

import { calculateWealth } from '@/features/mechanics/domain/character/generation'

const EquipmentStep = () => {
  const initializedRef = useRef(false)

  const {
    state,
    setWealth,
    updateWeapons,
    updateArmor,
    updateGear,
    stepNotices,
    dismissNotice
  } = useCharacterBuilder()

  const { catalog, ruleset } = useCampaignRules()

  const { tiers: startingWealthTiers } = ruleset.mechanics.progression.starting.wealth

  const { 
    step, 
    classes: selectedClasses,
    equipment: selectedEquipment,
    totalLevel,
    wealth
  } = state

  const isEditMode = !!state.editMode

  useEffect(() => {
    if (initializedRef.current) return

    // Skip wealth initialization when editing an existing character
    if (isEditMode) {
      initializedRef.current = true
      return
    }

    // If baseBudget is already set, wealth was initialized on a previous mount — don't reset
    if (wealth?.baseBudget) {
      initializedRef.current = true
      return
    }

    // Look up the selected primary class's requirements
    const primaryClassId = selectedClasses[0]?.classId
    if (!primaryClassId) return

    // const wealthReq = getClassRequirement(primaryClassId)
    // if (!wealthReq?.startingWealth) return

    const resolved = calculateWealth(
      totalLevel ?? 0,
      startingWealthTiers ?? []
      // wealthReq.startingWealth
    )

    if (!resolved) return

    setWealth({
      gp: resolved.gp,
      sp: 0,
      cp: 0,
      baseBudget: { coin: 'gp', value: resolved.gp },
    })

    initializedRef.current = true
  }, [totalLevel, selectedClasses, setWealth, wealth?.baseBudget, isEditMode])

  const { 
    weapons: selectedWeapons = [], 
    armor: selectedArmor = [], 
    gear: selectedGear = [],
    weight: currentWeight 
  } = selectedEquipment || {}

  const activeIndex = state.activeClassIndex ?? 0
  const activeClass = selectedClasses[activeIndex]
  
  if (!activeClass) return null

  // Derive allowed equipment from the engine's collected effects.
  // Build a minimal Character shape from the builder state so the collector can read it.
  const characterLike = {
    classes: selectedClasses,
    totalLevel: totalLevel ?? 1,
  } as Character
  const intrinsicEffects = collectIntrinsicEffects(characterLike)
  const weaponProf = deriveEquipmentProficiency(intrinsicEffects, 'weapon')
  const armorProf  = deriveEquipmentProficiency(intrinsicEffects, 'armor')
  const gearProf   = { categories: ['all'], items: [] as string[] }

  const baseCp = moneyToCp(wealth?.baseBudget ?? undefined)

  const weaponsCatalog = Object.values(catalog.weaponsById)
  const armorCatalog = Object.values(catalog.armorById)
  const gearCatalog = Object.values(catalog.gearById)

  const currentCostCp = calculateEquipmentCostCp(
    selectedWeapons,
    selectedArmor,
    selectedGear,
    weaponsCatalog,
    armorCatalog,
    gearCatalog,
  )

  const buildOptions = (
    items: readonly any[],
    selected: string[],
    proficiency: { categories: string[]; items: string[] },
  ) => {
    return items
      .filter(item => item.cost && item.cost.value != null)
      .map(item => {
        const itemCp = getItemCostCp(item)
        const isSelected = selected.includes(item.id)
        const costWithoutThis = isSelected ? currentCostCp - itemCp : currentCostCp
        const wouldExceedBudget = costWithoutThis + itemCp > baseCp

        const eligibility = evaluateEquipmentEligibility(item, proficiency)
        const notProficient = !eligibility.allowed
        const disabled = !isSelected && (notProficient || wouldExceedBudget)

        const reasons: string[] = []
        if (notProficient) reasons.push(...eligibility.reasons)
        if (wouldExceedBudget) reasons.push('Exceeds budget')
        const tooltip = reasons.length > 0 ? reasons.join('; ') : undefined

        const costStr = `${item.cost.value} ${item.cost.coin}`

        return {
          id: item.id,
          label: `${item.name} (${costStr})`,
          disabled,
          tooltip,
        }
      })
  }

  const weaponOptions = buildOptions(weaponsCatalog, selectedWeapons, weaponProf)
  const armorOptions  = buildOptions(armorCatalog, selectedArmor, armorProf)
  const gearOptions   = buildOptions(gearCatalog, selectedGear, gearProf)

  const armorNotes: { id: string; text: string }[] = []
  const weaponNotes: { id: string; text: string }[] = []
  const gearNotes: { id: string; text: string }[] = []

  const equipmentNotices = stepNotices.get('equipment') ?? []

  return (
    <>
      <h2>Choose {step.name}</h2>
      <InvalidationNotice items={equipmentNotices} onDismiss={() => dismissNotice('equipment')} />
      {wealth &&
      <>
        <p>Budget remaining: {formatCp(baseCp - currentCostCp)} / {formatCp(baseCp)}</p>
      </>
      }
      <small>Current weight: {currentWeight} lbs.</small>

      <h4>Weapons</h4>
      <ButtonGroup
        options={weaponOptions}
        value={selectedWeapons}
        onChange={updateWeapons}
        multiSelect
        autoSelectSingle
        size='sm'
      />

      {weaponNotes.length > 0 && (
        <ul className="equipment-notes">
          {weaponNotes.map((note:{ id: string, text: string}) => (
            <li key={note.id}>{note.text}</li>
          ))}
        </ul>
      )}

      <h4>Armor</h4>
      <ButtonGroup
        options={armorOptions}
        value={selectedArmor ?? []}
        onChange={updateArmor}
        multiSelect
        autoSelectSingle
        size='sm'
      />

      {armorNotes.length > 0 && (
        <ul className="equipment-notes">
          {armorNotes.map((note: { id: string, text: string }) => (
            <li key={note.id}>{note.text}</li>
          ))}
        </ul>
      )}

      <h4>Gear</h4>
      <ButtonGroup
        options={gearOptions}
        value={selectedGear}
        onChange={updateGear}
        multiSelect
        autoSelectSingle={false}
        size="sm"
      />

      {gearNotes.length > 0 && (
        <ul className="equipment-notes">
          {gearNotes.map((note: { id: string, text: string }) => (
            <li key={note.id}>{note.text}</li>
          ))}
        </ul>
      )}

    </>
  )
}


export default EquipmentStep

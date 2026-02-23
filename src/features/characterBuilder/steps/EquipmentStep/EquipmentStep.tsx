import { useEffect, useRef } from 'react'
import { useCharacterBuilder } from '@/features/characterBuilder/context'
import { InvalidationNotice } from '@/features/characterBuilder/components'
import { ButtonGroup } from '@/ui/elements'
import { classes, equipment, type EditionId } from '@/data'
import { getById } from '@/domain/lookups'
import { getClassRequirement } from '@/features/mechanics/domain/character-build/rules'
import {
  calculateEquipmentCost,
  getItemCostGp,
  resolveEquipmentEdition
} from '@/features/equipment/domain'
import { getEquipmentNotes } from '@/features/equipment/ui/notes'
import { collectIntrinsicEffects } from '@/features/character/domain/engine/collectCharacterEffects'
import {
  deriveEquipmentProficiency,
  evaluateEquipmentEligibility,
} from '@/features/mechanics/domain/proficiencies/proficiency-adapters'
import type { Character } from '@/shared/types/character.core'

import { calculateWealth } from '@/domain/wealth'

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

  const { 
    step, 
    edition, 
    classes: selectedClasses,
    equipment: selectedEquipment,
    totalLevel,
    wealth
  } = state

  const isEditMode = !!state.editMode

  useEffect(() => {
    if (initializedRef.current) return
    if (!edition) return

    // Skip wealth initialization when editing an existing character
    if (isEditMode) {
      initializedRef.current = true
      return
    }

    // If baseGp is already set, wealth was initialized on a previous mount — don't reset
    if (wealth?.baseGp) {
      initializedRef.current = true
      return
    }

    // Look up the selected primary class's requirements (with edition fallback)
    const primaryClassId = selectedClasses[0]?.classId
    if (!primaryClassId) return

    const wealthReq = getClassRequirement(primaryClassId, edition as EditionId)
    if (!wealthReq?.startingWealth) return

    const resolved = calculateWealth(
      totalLevel ?? 0,
      edition as EditionId,
      wealthReq.startingWealth
    )

    if (!resolved) return

    setWealth({
      gp: resolved.gp,
      sp: 0,
      cp: 0
    })

    initializedRef.current = true
  }, [edition, totalLevel, selectedClasses, setWealth, wealth?.baseGp, isEditMode])

  const { 
    weapons: selectedWeapons = [], 
    armor: selectedArmor = [], 
    gear: selectedGear = [],
    weight: currentWeight 
  } = selectedEquipment || {}

  const activeIndex = state.activeClassIndex ?? 0
  const activeClass = selectedClasses[activeIndex]
  
  if (!activeClass) return null
  
  const {
    classId: selectedClassId,
    // classDefinitionId: selectedClassDefinitionId,
    // level: selectedLevel
  } = activeClass ?? {}

  if (!edition) return null

  const equipEdition = resolveEquipmentEdition(edition)

  // Derive allowed equipment from the engine's collected effects.
  // Build a minimal Character shape from the builder state so the collector can read it.
  const characterLike = {
    edition,
    classes: selectedClasses,
    totalLevel: totalLevel ?? 1,
  } as Character
  const intrinsicEffects = collectIntrinsicEffects(characterLike)
  const weaponProf = deriveEquipmentProficiency(intrinsicEffects, 'weapon')
  const armorProf  = deriveEquipmentProficiency(intrinsicEffects, 'armor')
  const gearProf   = { categories: ['all'], items: [] as string[] }

  const baseGp = wealth?.baseGp ?? 0

  const currentCost = calculateEquipmentCost(
    selectedWeapons,
    selectedArmor,
    selectedGear,
    equipment.weapons,
    equipment.armor,
    equipment.gear,
    edition
  )

  const buildOptions = (
    items: readonly any[],
    selected: string[],
    proficiency: { categories: string[]; items: string[] },
  ) => {
    return items
      .filter(item => {
        if (!Array.isArray(item.editionData)) return false
        return item.editionData.some((d: { edition: string }) => d.edition === equipEdition)
      })
      .map(item => {
        const cost = getItemCostGp(item, edition)
        const isSelected = selected.includes(item.id)
        const costWithoutThis = isSelected ? currentCost - cost : currentCost
        const wouldExceedGold = costWithoutThis + cost > baseGp

        const eligibility = evaluateEquipmentEligibility(item, edition, proficiency)
        const notProficient = !eligibility.allowed
        const disabled = !isSelected && (notProficient || wouldExceedGold)

        const reasons: string[] = []
        if (notProficient) reasons.push(...eligibility.reasons)
        if (wouldExceedGold) reasons.push('Exceeds gold budget')
        const tooltip = reasons.length > 0 ? reasons.join('; ') : undefined

        return {
          id: item.id,
          label: `${item.name} (${item.editionData.find((d: { edition: string; cost?: string }) => d.edition === equipEdition)?.cost ?? '—'})`,
          disabled,
          tooltip,
        }
      })
  }

  const weaponOptions = buildOptions(equipment.weapons, selectedWeapons, weaponProf)
  const armorOptions  = buildOptions(equipment.armor, selectedArmor, armorProf)
  const gearOptions   = buildOptions(equipment.gear, selectedGear, gearProf)

  const cls = selectedClassId ? getById(classes, selectedClassId) : undefined
  const requirements = cls?.requirements

  const armorNotes = requirements
    ? getEquipmentNotes({ requirements, edition, slot: 'armor' })
    : []

  const weaponNotes = requirements
    ? getEquipmentNotes({ requirements, edition, slot: 'weapons' })
    : []

  const gearNotes = requirements
    ? getEquipmentNotes({ requirements, edition, slot: 'tools' })
    : []

  const equipmentNotices = stepNotices.get('equipment') ?? []

  return (
    <>
      <h2>Choose {step.name}</h2>
      <InvalidationNotice items={equipmentNotices} onDismiss={() => dismissNotice('equipment')} />
      {wealth &&
      <>
        <p>Gold remaining: {Math.round((wealth.gp ?? 0) * 100) / 100} gp / {wealth.baseGp} gp</p>
        {/* <p>Wealth: {wealth.gp} gp, {wealth.sp} sp, {wealth.cp} cp</p> */}
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

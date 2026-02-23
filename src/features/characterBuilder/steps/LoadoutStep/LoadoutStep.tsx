import { useCharacterBuilder } from '@/features/characterBuilder/context'
import { equipment as equipmentCatalog } from '@/data'
import type { ArmorItem, ArmorEditionDatum } from '@/data/equipment/armor.types'
import type { WeaponItem } from '@/data/equipment/weapons.types'
import { resolveEquipmentEdition, getAvailableEnhancementTemplates } from '@/features/equipment/domain'
import { resolveLoadout } from '@/features/mechanics/domain/effects/sources/equipment-to-effects'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type SelectOption = { value: string; label: string }

const NONE_VALUE = ''

function getOwnedItemsByIds<T extends { id: string }>(
  catalog: readonly T[],
  ids: string[],
): T[] {
  return ids
    .map(id => catalog.find(item => item.id === id))
    .filter((item): item is T => item != null)
}

function partitionArmor(
  items: ArmorItem[],
  equipEdition: string,
): { armorItems: ArmorItem[]; shieldItems: ArmorItem[] } {
  const armorItems: ArmorItem[] = []
  const shieldItems: ArmorItem[] = []

  for (const item of items) {
    const datum = item.editionData.find(d => d.edition === equipEdition) as ArmorEditionDatum | undefined
    const isShield = datum?.category === 'shields'
      || (!datum?.category && item.name.toLowerCase().includes('shield'))

    if (isShield) {
      shieldItems.push(item)
    } else {
      armorItems.push(item)
    }
  }

  return { armorItems, shieldItems }
}

function armorToOption(item: ArmorItem, equipEdition: string): SelectOption {
  const datum = item.editionData.find(d => d.edition === equipEdition)
  const costSuffix = datum?.cost && datum.cost !== '—' ? ` (${datum.cost})` : ''
  return { value: item.id, label: `${item.name}${costSuffix}` }
}

function weaponToOption(item: WeaponItem, equipEdition: string): SelectOption {
  const datum = item.editionData.find(d => d.edition === equipEdition)
  const costSuffix = datum?.cost && datum.cost !== '—' ? ` (${datum.cost})` : ''
  return { value: item.id, label: `${item.name}${costSuffix}` }
}

// ---------------------------------------------------------------------------
// Reusable select row
// ---------------------------------------------------------------------------

const LoadoutSelect = ({
  label,
  value,
  options,
  allowNone,
  onChange,
}: {
  label: string
  value: string | undefined
  options: SelectOption[]
  allowNone?: boolean
  onChange: (val: string | undefined) => void
}) => (
  <div style={{ marginBottom: 8 }}>
    <label style={{ display: 'block', fontWeight: 600, marginBottom: 2 }}>{label}</label>
    <select
      value={value ?? NONE_VALUE}
      onChange={e => onChange(e.target.value || undefined)}
    >
      {allowNone && <option value={NONE_VALUE}>None</option>}
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </div>
)

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const LoadoutStep = () => {
  const { state, updateLoadout } = useCharacterBuilder()

  const {
    step,
    edition,
    equipment: selectedEquipment,
    totalLevel,
  } = state

  if (!edition) return null

  const level = totalLevel ?? 1
  const equipEdition = resolveEquipmentEdition(edition)
  const loadout = resolveLoadout(state.combat)

  const ownedWeapons = getOwnedItemsByIds(equipmentCatalog.weapons, selectedEquipment?.weapons ?? [])
  const ownedArmor = getOwnedItemsByIds(equipmentCatalog.armor, selectedEquipment?.armor ?? [])
  const { armorItems, shieldItems } = partitionArmor(ownedArmor, equipEdition)

  const weaponOpts = ownedWeapons.map(w => weaponToOption(w, equipEdition))
  const armorOpts = armorItems.map(a => armorToOption(a, equipEdition))
  const shieldOpts = shieldItems.map(s => armorToOption(s, equipEdition))
  const enhOpts = getAvailableEnhancementTemplates(edition, level).map(t => ({
    value: t.id,
    label: t.name,
  }))

  return (
    <>
      <h2>Choose {step.name}</h2>

      <h4>Equipped Items</h4>

      <LoadoutSelect
        label="Main-hand weapon"
        value={loadout.mainHandWeaponId}
        options={weaponOpts}
        allowNone
        onChange={val => updateLoadout({ mainHandWeaponId: val })}
      />

      <LoadoutSelect
        label="Off-hand weapon"
        value={loadout.offHandWeaponId}
        options={weaponOpts}
        allowNone
        onChange={val => updateLoadout({ offHandWeaponId: val })}
      />

      <LoadoutSelect
        label="Armor"
        value={loadout.armorId}
        options={armorOpts}
        allowNone
        onChange={val => updateLoadout({ armorId: val })}
      />

      <LoadoutSelect
        label="Shield"
        value={loadout.shieldId}
        options={shieldOpts}
        allowNone
        onChange={val => updateLoadout({ shieldId: val })}
      />

      {enhOpts.length > 0 && (
        <>
          <h4>Enhancements</h4>

          <LoadoutSelect
            label="Weapon enhancement"
            value={loadout.weaponEnhancementId}
            options={enhOpts}
            allowNone
            onChange={val => updateLoadout({ weaponEnhancementId: val })}
          />

          <LoadoutSelect
            label="Armor enhancement"
            value={loadout.armorEnhancementId}
            options={enhOpts}
            allowNone
            onChange={val => updateLoadout({ armorEnhancementId: val })}
          />

          <LoadoutSelect
            label="Shield enhancement"
            value={loadout.shieldEnhancementId}
            options={enhOpts}
            allowNone
            onChange={val => updateLoadout({ shieldEnhancementId: val })}
          />
        </>
      )}
    </>
  )
}

export default LoadoutStep

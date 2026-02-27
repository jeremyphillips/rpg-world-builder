import { useCharacterBuilder } from '@/features/characterBuilder/context'
import { equipment } from '@/data/equipment/equipment'
import type { ArmorItem } from '@/data/equipment'
import type { WeaponItem } from '@/data/equipment'
import { resolveLoadout } from '@/features/mechanics/domain/effects/sources/equipment-to-effects'
import { moneyToGp } from '@/features/equipment/domain/pricing/pricing'

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
): { armorItems: ArmorItem[]; shieldItems: ArmorItem[] } {
  const armorItems: ArmorItem[] = []
  const shieldItems: ArmorItem[] = []

  for (const item of items) {
    if (item.category === 'shields') {
      shieldItems.push(item)
    } else {
      armorItems.push(item)
    }
  }

  return { armorItems, shieldItems }
}

function armorToOption(item: ArmorItem): SelectOption {
  const costSuffix = item.cost ? ` (${moneyToGp(item.cost)} gp)` : ''
  return { value: item.id, label: `${item.name}${costSuffix}` }
}

function weaponToOption(item: WeaponItem): SelectOption {
  const costSuffix = item.cost ? ` (${moneyToGp(item.cost)} gp)` : ''
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
    equipment: selectedEquipment,
  } = state

  const loadout = resolveLoadout(state.combat)

  const ownedWeapons = getOwnedItemsByIds(equipment.weapons, selectedEquipment?.weapons ?? [])
  const ownedArmor = getOwnedItemsByIds(equipment.armor, selectedEquipment?.armor ?? [])
  const { armorItems, shieldItems } = partitionArmor(ownedArmor)

  const weaponOpts = ownedWeapons.map(w => weaponToOption(w))
  const armorOpts = armorItems.map(a => armorToOption(a))
  const shieldOpts = shieldItems.map(s => armorToOption(s))

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
    </>
  )
}

export default LoadoutStep

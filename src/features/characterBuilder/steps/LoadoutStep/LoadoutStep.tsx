import { useCharacterBuilder } from '@/features/characterBuilder/context'
import { useCampaignRules } from '@/app/providers/CampaignRulesProvider'
import type { Armor } from '@/features/content/shared/domain/types'
import type { Weapon } from '@/features/content/shared/domain/types'
import { resolveLoadout } from '@/features/mechanics/domain/effects/sources/equipment-to-effects'
import { formatMoney } from '@/shared/money'

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
  items: Armor[],
): { armorItems: Armor[]; shieldItems: Armor[] } {
  const armorItems: Armor[] = []
  const shieldItems: Armor[] = []

  for (const item of items) {
    if (item.category === 'shields') {
      shieldItems.push(item)
    } else {
      armorItems.push(item)
    }
  }

  return { armorItems, shieldItems }
}

function armorToOption(item: Armor): SelectOption {
  const costSuffix = item.cost ? ` (${formatMoney(item.cost)})` : ''
  return { value: item.id, label: `${item.name}${costSuffix}` }
}

function weaponToOption(item: Weapon): SelectOption {
  const costSuffix = item.cost ? ` (${formatMoney(item.cost)})` : ''
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
  const { catalog } = useCampaignRules()

  const {
    step,
    equipment: selectedEquipment,
  } = state

  const loadout = resolveLoadout(state.combat)

  const weaponsCatalog = Object.values(catalog.weaponsById)
  const armorCatalog = Object.values(catalog.armorById)
  const ownedWeapons = getOwnedItemsByIds(weaponsCatalog, selectedEquipment?.weapons ?? [])
  const ownedArmor = getOwnedItemsByIds(armorCatalog, selectedEquipment?.armor ?? [])
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

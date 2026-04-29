import type { Weapon } from '@/features/content/equipment/weapons/domain/types';
import { contentDetailMetaSpecs, contentDetailPatchedMetaSpecs } from '@/features/content/shared/domain';
import type { DetailSpec } from '@/features/content/shared/forms/registry';
import { formatMoney } from '@/shared/money';
import {
  WEAPON_CATEGORY_OPTIONS,
  WEAPON_DAMAGE_TYPE_OPTIONS,
  WEAPON_MODE_OPTIONS,
  WEAPON_PROPERTY_OPTIONS,
} from '@/features/content/equipment/weapons/domain/vocab/weapons.vocab';

export type WeaponDetailCtx = Record<string, never>;

function weaponCategoryLabel(category: Weapon['category']): string {
  return WEAPON_CATEGORY_OPTIONS.find((o) => o.id === category)?.name ?? category;
}

function weaponModeLabel(mode: Weapon['mode']): string {
  return WEAPON_MODE_OPTIONS.find((o) => o.id === mode)?.name ?? mode;
}

function weaponDamageTypeLabel(t: Weapon['damageType']): string {
  return WEAPON_DAMAGE_TYPE_OPTIONS.find((o) => o.id === t)?.name ?? t;
}

function weaponPropertiesFriendly(properties: Weapon['properties']): string {
  if (!properties?.length) return '—';
  return properties
    .map((id) => WEAPON_PROPERTY_OPTIONS.find((o) => o.id === id)?.name ?? id)
    .join(', ');
}

function weaponMasteryLabel(mastery: NonNullable<Weapon['mastery']>): string {
  return mastery.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Platform-admin advanced JSON: stable snapshot of persisted-relevant fields. */
function weaponAdvancedRecord(weapon: Weapon): Record<string, unknown> {
  const scopeMeta: Record<string, unknown> =
    weapon.source === 'system'
      ? { systemId: (weapon as Weapon & { systemId?: string }).systemId }
      : { campaignId: (weapon as Weapon & { campaignId?: string }).campaignId };

  return {
    id: weapon.id,
    name: weapon.name,
    source: weapon.source,
    patched: weapon.patched,
    ...scopeMeta,
    accessPolicy: weapon.accessPolicy,
    category: weapon.category,
    mode: weapon.mode,
    cost: weapon.cost,
    damage: weapon.damage,
    damageType: weapon.damageType,
    range: weapon.range,
    properties: weapon.properties,
    weight: weapon.weight,
    mastery: weapon.mastery,
    description: weapon.description,
    imageKey: weapon.imageKey,
  };
}

export const WEAPON_DETAIL_SPECS: DetailSpec<Weapon, WeaponDetailCtx>[] = [
  ...contentDetailMetaSpecs<Weapon, WeaponDetailCtx>(),
  ...contentDetailPatchedMetaSpecs<Weapon, WeaponDetailCtx>(),
  {
    key: 'category',
    label: 'Category',
    order: 40,
    render: (weapon) => weaponCategoryLabel(weapon.category),
  },
  {
    key: 'mode',
    label: 'Mode',
    order: 45,
    render: (weapon) => weaponModeLabel(weapon.mode),
  },
  {
    key: 'cost',
    label: 'Cost',
    order: 50,
    render: (weapon) => formatMoney(weapon.cost),
  },
  {
    key: 'damage',
    label: 'Damage',
    order: 55,
    render: (weapon) =>
      weapon.damage?.versatile
        ? `${weapon.damage.default} (${weapon.damage.versatile} versatile)`
        : weapon.damage?.default != null
          ? String(weapon.damage.default)
          : '—',
  },
  {
    key: 'damageType',
    label: 'Damage type',
    order: 60,
    render: (weapon) => weaponDamageTypeLabel(weapon.damageType),
  },
  {
    key: 'properties',
    label: 'Properties',
    order: 65,
    render: (weapon) => weaponPropertiesFriendly(weapon.properties),
  },
  {
    key: 'mastery',
    label: 'Mastery',
    order: 66,
    hidden: (w) => !w.mastery,
    render: (w) => (w.mastery ? weaponMasteryLabel(w.mastery) : '—'),
  },
  {
    key: 'range',
    label: 'Range',
    order: 70,
    render: (weapon) =>
      weapon.range
        ? `${weapon.range.normal}/${weapon.range.long ?? '—'} ft`
        : '—',
  },
  {
    key: 'weight',
    label: 'Weight',
    order: 75,
    render: (weapon) =>
      weapon.weight ? `${weapon.weight.value} ${weapon.weight.unit}` : '—',
  },
  {
    key: 'description',
    label: 'Description',
    order: 80,
    hidden: (weapon) => !weapon.description?.trim(),
    render: (weapon) => (
      <span style={{ whiteSpace: 'pre-line' }}>{weapon.description}</span>
    ),
  },
  {
    key: 'weaponRawRecord',
    label: 'Full record (JSON)',
    order: 2000,
    placement: 'advanced',
    rawAudience: 'platformOwner',
    getValue: (w) => weaponAdvancedRecord(w),
  },
];

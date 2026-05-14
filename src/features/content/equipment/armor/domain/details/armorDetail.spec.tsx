import type { Armor } from '@/features/content/equipment/armor/domain/types';
import { contentDetailMetaSpecs, contentDetailPatchedMetaSpecs } from '@/features/content/shared/domain';
import type { DetailSpec } from '@/features/content/shared/forms/registry';
import { formatMoney } from '@/shared/money';
import {
  ARMOR_CATEGORY_OPTIONS,
  ARMOR_MATERIAL_OPTIONS,
} from '@/features/content/equipment/armor/domain/vocab/armor.vocab';

export type ArmorDetailCtx = {
  dexLabel: string;
};

function armorCategoryLabel(category: Armor['category']): string {
  return ARMOR_CATEGORY_OPTIONS.find((o) => o.id === category)?.name ?? category;
}

function armorMaterialLabel(material: Armor['material']): string {
  return ARMOR_MATERIAL_OPTIONS.find((o) => o.id === material)?.name ?? material;
}

/** Platform-admin advanced JSON: stable snapshot of persisted-relevant fields. */
function armorAdvancedRecord(armor: Armor): Record<string, unknown> {
  const scopeMeta: Record<string, unknown> =
    armor.source === 'system'
      ? { systemId: (armor as Armor & { systemId?: string }).systemId }
      : { campaignId: (armor as Armor & { campaignId?: string }).campaignId };

  return {
    id: armor.id,
    name: armor.name,
    source: armor.source,
    patched: armor.patched,
    ...scopeMeta,
    accessPolicy: armor.accessPolicy,
    category: armor.category,
    material: armor.material,
    cost: armor.cost,
    baseAC: armor.baseAC,
    acBonus: armor.acBonus,
    dex: armor.dex,
    stealthDisadvantage: armor.stealthDisadvantage,
    minStrength: armor.minStrength,
    weight: armor.weight,
    description: armor.description,
    imageKey: armor.imageKey,
  };
}

export const ARMOR_DETAIL_SPECS: DetailSpec<Armor, ArmorDetailCtx>[] = [
  ...contentDetailMetaSpecs<Armor, ArmorDetailCtx>(),
  ...contentDetailPatchedMetaSpecs<Armor, ArmorDetailCtx>(),
  {
    key: 'category',
    label: 'Category',
    order: 40,
    render: (armor) => armorCategoryLabel(armor.category),
  },
  {
    key: 'material',
    label: 'Material',
    order: 45,
    render: (armor) => armorMaterialLabel(armor.material),
  },
  {
    key: 'cost',
    label: 'Cost',
    order: 50,
    render: (armor) => formatMoney(armor.cost),
  },
  {
    key: 'baseAC',
    label: 'Base AC',
    order: 55,
    render: (armor) => (armor.baseAC != null ? String(armor.baseAC) : '—'),
  },
  {
    key: 'acBonus',
    label: 'AC bonus',
    order: 60,
    render: (armor) => (armor.acBonus != null ? `+${armor.acBonus}` : '—'),
  },
  {
    key: 'dex',
    label: 'Dex contribution',
    order: 65,
    render: (_armor, ctx) => ctx.dexLabel,
  },
  {
    key: 'stealthDisadvantage',
    label: 'Stealth disadvantage',
    order: 70,
    render: (armor) => (armor.stealthDisadvantage ? 'Yes' : 'No'),
  },
  {
    key: 'minStrength',
    label: 'Min Strength',
    order: 75,
    render: (armor) =>
      armor.minStrength != null ? String(armor.minStrength) : '—',
  },
  {
    key: 'weight',
    label: 'Weight',
    order: 80,
    render: (armor) =>
      armor.weight ? `${armor.weight.value} ${armor.weight.unit}` : '—',
  },
  {
    key: 'description',
    label: 'Description',
    order: 85,
    hidden: (armor) => !armor.description?.trim(),
    render: (armor) => (
      <span style={{ whiteSpace: 'pre-line' }}>{armor.description}</span>
    ),
  },
  {
    key: 'armorRawRecord',
    label: 'Full record (JSON)',
    order: 2000,
    placement: 'advanced',
    rawAudience: 'platformOwner',
    getValue: (a) => armorAdvancedRecord(a),
  },
];

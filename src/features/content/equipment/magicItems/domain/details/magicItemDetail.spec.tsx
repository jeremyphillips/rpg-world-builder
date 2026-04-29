import type { MagicItem } from '@/features/content/equipment/magicItems/domain/types';
import { contentDetailMetaSpecs, contentDetailPatchedMetaSpecs } from '@/features/content/shared/domain';
import type { DetailSpec } from '@/features/content/shared/forms/registry';
import { formatMoney } from '@/shared/money';
import {
  MAGIC_ITEM_RARITY_OPTIONS,
  MAGIC_ITEM_SLOT_OPTIONS,
} from '@/features/content/equipment/magicItems/domain/vocab/magicItems.vocab';

export type MagicItemDetailCtx = Record<string, never>;

function magicItemSlotLabel(slot: MagicItem['slot']): string {
  return MAGIC_ITEM_SLOT_OPTIONS.find((o) => o.id === slot)?.name ?? slot;
}

function magicItemRarityLabel(rarity: MagicItem['rarity']): string {
  if (!rarity) return '—';
  return MAGIC_ITEM_RARITY_OPTIONS.find((o) => o.id === rarity)?.name ?? rarity;
}

const EFFECTS_SUMMARY_MAX = 6;

function magicItemEffectsSummary(effects: MagicItem['effects'] | undefined): string {
  if (!effects?.length) return '';
  const parts = effects.map((e) => {
    if (e && typeof e === 'object') {
      const text =
        'text' in e && typeof (e as { text?: unknown }).text === 'string'
          ? (e as { text: string }).text.trim()
          : '';
      if (text) return text;
      if ('kind' in e) return String((e as { kind: string }).kind);
    }
    return 'Effect';
  });
  const shown = parts.slice(0, EFFECTS_SUMMARY_MAX);
  const more =
    parts.length > EFFECTS_SUMMARY_MAX
      ? `\n(+${parts.length - EFFECTS_SUMMARY_MAX} more)`
      : '';
  return shown.join('\n') + more;
}

/** Platform-admin advanced JSON: stable snapshot of persisted-relevant fields. */
function magicItemAdvancedRecord(item: MagicItem): Record<string, unknown> {
  const scopeMeta: Record<string, unknown> =
    item.source === 'system'
      ? { systemId: (item as MagicItem & { systemId?: string }).systemId }
      : { campaignId: (item as MagicItem & { campaignId?: string }).campaignId };

  return {
    id: item.id,
    name: item.name,
    source: item.source,
    patched: item.patched,
    ...scopeMeta,
    accessPolicy: item.accessPolicy,
    slot: item.slot,
    baseItemId: item.baseItemId,
    consumable: item.consumable,
    rarity: item.rarity,
    requiresAttunement: item.requiresAttunement,
    charges: item.charges,
    cost: item.cost,
    weight: item.weight,
    description: item.description,
    imageKey: item.imageKey,
    effects: item.effects,
  };
}

export const MAGIC_ITEM_DETAIL_SPECS: DetailSpec<MagicItem, MagicItemDetailCtx>[] = [
  ...contentDetailMetaSpecs<MagicItem, MagicItemDetailCtx>(),
  ...contentDetailPatchedMetaSpecs<MagicItem, MagicItemDetailCtx>(),
  {
    key: 'slot',
    label: 'Slot',
    order: 40,
    render: (item) => magicItemSlotLabel(item.slot),
  },
  {
    key: 'rarity',
    label: 'Rarity',
    order: 45,
    render: (item) => magicItemRarityLabel(item.rarity),
  },
  {
    key: 'cost',
    label: 'Cost',
    order: 50,
    render: (item) => (item.cost ? formatMoney(item.cost) : '—'),
  },
  {
    key: 'requiresAttunement',
    label: 'Requires attunement',
    order: 55,
    render: (item) => (item.requiresAttunement ? 'Yes' : 'No'),
  },
  {
    key: 'consumable',
    label: 'Consumable',
    order: 56,
    hidden: (item) => !item.consumable,
    render: (item) => (item.consumable ? 'Yes' : 'No'),
  },
  {
    key: 'baseItemId',
    label: 'Base item ID',
    order: 57,
    hidden: (item) => !item.baseItemId,
    render: (item) => item.baseItemId ?? '—',
  },
  {
    key: 'charges',
    label: 'Charges',
    order: 60,
    render: (item) => (item.charges != null ? String(item.charges) : '—'),
  },
  {
    key: 'weight',
    label: 'Weight',
    order: 75,
    render: (item) =>
      item.weight ? `${item.weight.value} ${item.weight.unit}` : '—',
  },
  {
    key: 'effects',
    label: 'Effects',
    order: 90,
    hidden: (item) => !item.effects?.length,
    render: (item) => (
      <span style={{ whiteSpace: 'pre-line' }}>
        {magicItemEffectsSummary(item.effects)}
      </span>
    ),
  },
  {
    key: 'description',
    label: 'Description',
    order: 95,
    hidden: (item) => !item.description?.trim(),
    render: (item) => (
      <span style={{ whiteSpace: 'pre-line' }}>{item.description}</span>
    ),
  },
  {
    key: 'magicItemRawRecord',
    label: 'Full record (JSON)',
    order: 2000,
    placement: 'advanced',
    rawAudience: 'platformOwner',
    getValue: (item) => magicItemAdvancedRecord(item),
  },
];

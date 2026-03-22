import type { Monster } from '@/features/content/monsters/domain/types';
import type { DetailSpec } from '@/features/content/shared/forms/registry';
import { AppBadge } from '@/ui/primitives';
import { StructuredValue, VisibilityBadge } from '@/ui/patterns';
import {
  formatHitPointsWithAverage,
  formatMonsterArmorClassBreakdown,
  formatMovement,
} from '@/features/content/monsters/utils/formatters';
import { calculateMonsterArmorClass } from '../mechanics/calculateMonsterArmorClass';
import type { CreatureArmorCatalogEntry } from '@/features/mechanics/domain/equipment/armorClass';

export type MonsterDetailCtx = {
  armorById: Record<string, CreatureArmorCatalogEntry>;
};

export const MONSTER_DETAIL_SPECS: DetailSpec<Monster, MonsterDetailCtx>[] = [
  {
    key: 'source',
    label: 'Source',
    order: 10,
    render: (m) => (
      <AppBadge
        label={m.source}
        tone={m.source === 'system' ? 'info' : 'default'}
      />
    ),
  },
  {
    key: 'visibility',
    label: 'Visibility',
    order: 20,
    render: (m) =>
      m.accessPolicy && m.accessPolicy.scope !== 'public' ? (
        <VisibilityBadge visibility={m.accessPolicy} />
      ) : (
        'Public'
      ),
  },
  { key: 'name', label: 'Name', order: 30, render: (m) => m.name },
  { key: 'type', label: 'Type', order: 40, render: (m) => m.type ?? '—' },
  { key: 'subtype', label: 'Subtype', order: 50, render: (m) => m.subtype ?? '—' },
  { key: 'sizeCategory', label: 'Size Category', order: 60, render: (m) => m.sizeCategory ?? '—' },
  {
    key: 'description.long',
    label: 'Description',
    order: 70,
    render: (m) => m.description?.long ?? '—',
  },
  {
    key: 'hitPoints',
    label: 'Hit Points',
    order: 80,
    render: (m) =>
      m.mechanics?.hitPoints
        ? formatHitPointsWithAverage(m.mechanics.hitPoints)
        : '—',
  },
  {
    key: 'armorClass',
    label: 'Armor Class',
    order: 90,
    render: (m, ctx) =>
      formatMonsterArmorClassBreakdown(
        calculateMonsterArmorClass(m, ctx.armorById),
        { includePrefix: false },
      ),
  },
  {
    key: 'movement',
    label: 'Movement',
    order: 100,
    render: (m) =>
      m.mechanics?.movement
        ? formatMovement(m.mechanics.movement)
        : '—',
  },
  {
    key: 'actions',
    label: 'Actions',
    order: 110,
    render: (m) => <StructuredValue value={m.mechanics?.actions} />,
  },
  {
    key: 'bonusActions',
    label: 'Bonus Actions',
    order: 120,
    render: (m) => <StructuredValue value={m.mechanics?.bonusActions} />,
  },
  {
    key: 'legendaryActions',
    label: 'Legendary Actions',
    order: 125,
    render: (m) => <StructuredValue value={m.mechanics?.legendaryActions} />,
  },
  {
    key: 'traits',
    label: 'Traits',
    order: 130,
    render: (m) => <StructuredValue value={m.mechanics?.traits} />,
  },
  {
    key: 'abilities',
    label: 'Abilities',
    order: 140,
    render: (m) => <StructuredValue value={m.mechanics?.abilities} />,
  },
  {
    key: 'senses',
    label: 'Senses',
    order: 150,
    render: (m) => <StructuredValue value={m.mechanics?.senses} />,
  },
  {
    key: 'proficiencies',
    label: 'Proficiencies',
    order: 160,
    render: (m) => <StructuredValue value={m.mechanics?.proficiencies} />,
  },
  {
    key: 'equipment',
    label: 'Equipment',
    order: 170,
    render: (m) => <StructuredValue value={m.mechanics?.equipment} />,
  },
  {
    key: 'immunities',
    label: 'Immunities',
    order: 180,
    render: (m) => <StructuredValue value={m.mechanics?.immunities} />,
  },
  {
    key: 'vulnerabilities',
    label: 'Vulnerabilities',
    order: 190,
    render: (m) => <StructuredValue value={m.mechanics?.vulnerabilities} />,
  },
  {
    key: 'languages',
    label: 'Languages',
    order: 200,
    render: (m) => <StructuredValue value={m.languages} />,
  },
  {
    key: 'alignment',
    label: 'Alignment',
    order: 210,
    render: (m) => m.lore?.alignment ?? '—',
  },
  {
    key: 'challengeRating',
    label: 'Challenge Rating',
    order: 220,
    render: (m) => m.lore?.challengeRating ?? '—',
  },
  {
    key: 'xpValue',
    label: 'XP Value',
    order: 230,
    render: (m) => m.lore?.xpValue ?? '—',
  },
];

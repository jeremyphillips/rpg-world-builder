import type { Monster } from '@/features/content/monsters/domain/types';
import type { DetailSpec } from '@/features/content/shared/forms/registry';
import {
  MonsterAbilitiesSummary,
  MonsterActionsSummary,
  MonsterEquipmentSummary,
  MonsterImmunitiesSummary,
  MonsterLanguagesSummary,
  MonsterLegendaryActionsSummary,
  MonsterProficienciesSummary,
  MonsterResistancesSummary,
  MonsterSensesSummary,
  MonsterTraitsSummary,
  MonsterVulnerabilitiesSummary,
} from '@/features/content/monsters/components/views/MonsterView/sections';
import { AppBadge } from '@/ui/primitives';
import { VisibilityBadge } from '@/ui/patterns';
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

const structuredBoth: Pick<
  DetailSpec<Monster, MonsterDetailCtx>,
  'placement' | 'rawAudience' | 'hideIfEmpty' | 'isStructured'
> = {
  placement: 'both',
  rawAudience: 'platformOwner',
  hideIfEmpty: true,
  isStructured: true,
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
    getValue: (m) => m.mechanics?.actions,
    renderFriendly: (_v, m) => <MonsterActionsSummary monster={m} kind="actions" />,
    ...structuredBoth,
  },
  {
    key: 'bonusActions',
    label: 'Bonus Actions',
    order: 120,
    getValue: (m) => m.mechanics?.bonusActions,
    renderFriendly: (_v, m) => <MonsterActionsSummary monster={m} kind="bonusActions" />,
    ...structuredBoth,
  },
  {
    key: 'legendaryActions',
    label: 'Legendary Actions',
    order: 125,
    getValue: (m) => m.mechanics?.legendaryActions,
    renderFriendly: (_v, m) => <MonsterLegendaryActionsSummary monster={m} />,
    ...structuredBoth,
  },
  {
    key: 'traits',
    label: 'Traits',
    order: 130,
    getValue: (m) => m.mechanics?.traits,
    renderFriendly: (_v, m) => <MonsterTraitsSummary monster={m} />,
    ...structuredBoth,
  },
  {
    key: 'abilities',
    label: 'Abilities',
    order: 140,
    getValue: (m) => m.mechanics?.abilities,
    renderFriendly: (_v, m) => <MonsterAbilitiesSummary monster={m} />,
    ...structuredBoth,
  },
  {
    key: 'senses',
    label: 'Senses',
    order: 150,
    getValue: (m) => m.mechanics?.senses,
    renderFriendly: (_v, m) => <MonsterSensesSummary monster={m} />,
    ...structuredBoth,
  },
  {
    key: 'proficiencies',
    label: 'Proficiencies',
    order: 160,
    getValue: (m) => {
      const proficiencies = m.mechanics?.proficiencies;
      const savingThrows = m.mechanics?.savingThrows;
      if (!proficiencies && !savingThrows) return undefined;
      return { proficiencies, savingThrows };
    },
    renderFriendly: (_v, m) => <MonsterProficienciesSummary monster={m} />,
    ...structuredBoth,
  },
  {
    key: 'equipment',
    label: 'Equipment',
    order: 170,
    getValue: (m) => m.mechanics?.equipment,
    renderFriendly: (_v, m) => <MonsterEquipmentSummary monster={m} />,
    ...structuredBoth,
  },
  {
    key: 'immunities',
    label: 'Immunities',
    order: 180,
    getValue: (m) => m.mechanics?.immunities,
    renderFriendly: (_v, m) => <MonsterImmunitiesSummary monster={m} />,
    ...structuredBoth,
  },
  {
    key: 'resistances',
    label: 'Resistances',
    order: 185,
    getValue: (m) => m.mechanics?.resistances,
    renderFriendly: (_v, m) => <MonsterResistancesSummary monster={m} />,
    ...structuredBoth,
  },
  {
    key: 'vulnerabilities',
    label: 'Vulnerabilities',
    order: 190,
    getValue: (m) => m.mechanics?.vulnerabilities,
    renderFriendly: (_v, m) => <MonsterVulnerabilitiesSummary monster={m} />,
    ...structuredBoth,
  },
  {
    key: 'languages',
    label: 'Languages',
    order: 200,
    getValue: (m) => m.languages,
    renderFriendly: (_v, m) => <MonsterLanguagesSummary monster={m} />,
    ...structuredBoth,
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

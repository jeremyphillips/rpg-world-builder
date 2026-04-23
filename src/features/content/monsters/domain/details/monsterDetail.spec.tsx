import type { Monster } from '@/features/content/monsters/domain/types';
import { contentDetailMetaSpecs, contentDetailPatchedMetaSpecs } from '@/features/content/shared/domain';
import { structuredMainAndAdvanced, type DetailSpec } from '@/features/content/shared/forms/registry';
import { getAlignmentDisplayName } from '@/features/content/shared/domain/vocab/alignment.vocab';
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
import {
  formatHitPointsWithAverage,
  formatMonsterArmorClassBreakdown,
  formatMovement,
} from '@/features/content/monsters/utils/formatters';
import { formatMonsterChallengeRatingLine } from '@/features/content/monsters/domain/details/display/monsterChallengeRatingDisplay';
import {
  getMonsterSubtypeDisplayName,
  getMonsterTypeDisplayName,
} from '@/features/content/monsters/domain/details/display/monsterTaxonomyDisplay';
import { calculateMonsterArmorClass } from '../mechanics/calculateMonsterArmorClass';
import type { CreatureArmorCatalogEntry } from '@/features/mechanics/domain/equipment/armorClass';

export type MonsterDetailCtx = {
  armorById: Record<string, CreatureArmorCatalogEntry>;
};

export const MONSTER_DETAIL_SPECS: DetailSpec<Monster, MonsterDetailCtx>[] = [
  ...contentDetailMetaSpecs<Monster, MonsterDetailCtx>(),
  ...contentDetailPatchedMetaSpecs<Monster, MonsterDetailCtx>(),
  // { key: 'name', label: 'Name', order: 30, render: (m) => m.name },
  { key: 'type', label: 'Type', order: 40, render: (m) => getMonsterTypeDisplayName(m.type) },
  { key: 'subtype', label: 'Subtype', order: 50, render: (m) => getMonsterSubtypeDisplayName(m.subtype) },
  { key: 'sizeCategory', label: 'Size Category', order: 60, render: (m) => m.sizeCategory ?? '—' },
  {
    key: 'abilities',
    label: 'Abilities',
    order: 65,
    getValue: (m) => m.mechanics?.abilities,
    renderFriendly: (_v, m) => <MonsterAbilitiesSummary monster={m} />,
    ...structuredMainAndAdvanced,
  },
  // TODO: determine if this should display
  // {
  //   key: 'description.long',
  //   label: 'Description',
  //   order: 70,
  //   render: (m) => m.description?.long ?? '—',
  // },
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
    ...structuredMainAndAdvanced,
  },
  {
    key: 'bonusActions',
    label: 'Bonus Actions',
    order: 120,
    getValue: (m) => m.mechanics?.bonusActions,
    renderFriendly: (_v, m) => <MonsterActionsSummary monster={m} kind="bonusActions" />,
    ...structuredMainAndAdvanced,
  },
  {
    key: 'legendaryActions',
    label: 'Legendary Actions',
    order: 125,
    getValue: (m) => m.mechanics?.legendaryActions,
    renderFriendly: (_v, m) => <MonsterLegendaryActionsSummary monster={m} />,
    ...structuredMainAndAdvanced,
  },
  {
    key: 'traits',
    label: 'Traits',
    order: 130,
    getValue: (m) => m.mechanics?.traits,
    renderFriendly: (_v, m) => <MonsterTraitsSummary monster={m} />,
    ...structuredMainAndAdvanced,
  },
  {
    key: 'senses',
    label: 'Senses',
    order: 150,
    getValue: (m) => m.mechanics?.senses,
    renderFriendly: (_v, m) => <MonsterSensesSummary monster={m} />,
    ...structuredMainAndAdvanced,
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
    ...structuredMainAndAdvanced,
  },
  {
    key: 'equipment',
    label: 'Equipment',
    order: 170,
    getValue: (m) => m.mechanics?.equipment,
    renderFriendly: (_v, m) => <MonsterEquipmentSummary monster={m} />,
    ...structuredMainAndAdvanced,
  },
  {
    key: 'immunities',
    label: 'Immunities',
    order: 180,
    getValue: (m) => m.mechanics?.immunities,
    renderFriendly: (_v, m) => <MonsterImmunitiesSummary monster={m} />,
    ...structuredMainAndAdvanced,
  },
  {
    key: 'resistances',
    label: 'Resistances',
    order: 185,
    getValue: (m) => m.mechanics?.resistances,
    renderFriendly: (_v, m) => <MonsterResistancesSummary monster={m} />,
    ...structuredMainAndAdvanced,
  },
  {
    key: 'vulnerabilities',
    label: 'Vulnerabilities',
    order: 190,
    getValue: (m) => m.mechanics?.vulnerabilities,
    renderFriendly: (_v, m) => <MonsterVulnerabilitiesSummary monster={m} />,
    ...structuredMainAndAdvanced,
  },
  {
    key: 'languages',
    label: 'Languages',
    order: 200,
    getValue: (m) => m.languages,
    renderFriendly: (_v, m) => <MonsterLanguagesSummary monster={m} />,
    ...structuredMainAndAdvanced,
  },
  {
    key: 'alignment',
    label: 'Alignment',
    order: 210,
    render: (m) => {
      const id = m.lore?.alignment;
      if (id == null) return '—';
      return getAlignmentDisplayName(id) ?? id;
    },
  },
  {
    key: 'challengeRating',
    label: 'Challenge Rating',
    order: 220,
    getValue: (m) => {
      const cr = m.lore?.challengeRating;
      if (cr === undefined) return undefined;
      return {
        challengeRating: cr,
        xpValue: m.lore?.xpValue,
        proficiencyBonus: m.mechanics?.proficiencyBonus,
      };
    },
    renderFriendly: (_v, m) => formatMonsterChallengeRatingLine(m),
    ...structuredMainAndAdvanced,
  },
];

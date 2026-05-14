import { Fragment } from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/rulesets/ids/systemIds';
import { getSystemArmor } from '@/features/mechanics/domain/rulesets/system/armor';
import { getSystemMonster } from '@/features/mechanics/domain/rulesets/system/monsters';
import { buildDetailItemsFromSpecs } from '@/features/content/shared/forms/registry';

import {
  MonsterAbilitiesSummary,
  MonsterLanguagesSummary,
  MonsterSensesSummary,
  MonsterTraitsSummary,
} from '@/features/content/monsters/components/views/MonsterView/sections';
import { MONSTER_DETAIL_SPECS, type MonsterDetailCtx } from './monsterDetail.spec';

function buildArmorById() {
  return Object.fromEntries(
    getSystemArmor(DEFAULT_SYSTEM_RULESET_ID).map((armor) => [armor.id, armor]),
  );
}

describe('monster detail presentation', () => {
  const armorById = buildArmorById();
  const ctx: MonsterDetailCtx = { armorById };

  const aboleth = getSystemMonster(DEFAULT_SYSTEM_RULESET_ID, 'aboleth');
  const goblin = getSystemMonster(DEFAULT_SYSTEM_RULESET_ID, 'goblin-warrior');

  it('buildDetailItemsFromSpecs main section excludes meta-only fields', () => {
    expect(goblin).toBeDefined();
    const main = buildDetailItemsFromSpecs(MONSTER_DETAIL_SPECS, goblin!, ctx, { section: 'main' });
    expect(main.find((row) => row.label === 'Source')).toBeUndefined();
    expect(main.find((row) => row.label === 'Visibility')).toBeUndefined();
  });

  it('buildDetailItemsFromSpecs meta section includes source for any viewer but gates visibility', () => {
    expect(goblin).toBeDefined();
    const metaPlayer = buildDetailItemsFromSpecs(MONSTER_DETAIL_SPECS, goblin!, ctx, {
      section: 'meta',
      viewer: { isPlatformAdmin: false, campaignRole: null },
    });
    expect(metaPlayer.find((row) => row.label === 'Source')).toBeDefined();
    expect(metaPlayer.find((row) => row.label === 'Visibility')).toBeUndefined();

    const metaDm = buildDetailItemsFromSpecs(MONSTER_DETAIL_SPECS, goblin!, ctx, {
      section: 'meta',
      viewer: { isPlatformAdmin: false, campaignRole: 'dm' },
    });
    expect(metaDm.find((row) => row.label === 'Visibility')).toBeDefined();
  });

  it('buildDetailItemsFromSpecs meta gates Patched row to privileged content-meta viewers', () => {
    expect(goblin).toBeDefined();
    const patched = { ...goblin!, patched: true as boolean };
    const metaPlayer = buildDetailItemsFromSpecs(MONSTER_DETAIL_SPECS, patched, ctx, {
      section: 'meta',
      viewer: { isPlatformAdmin: false, campaignRole: null },
    });
    expect(metaPlayer.find((row) => row.label === 'Patched')).toBeUndefined();

    const metaDm = buildDetailItemsFromSpecs(MONSTER_DETAIL_SPECS, patched, ctx, {
      section: 'meta',
      viewer: { isPlatformAdmin: false, campaignRole: 'dm' },
    });
    expect(metaDm.find((row) => row.label === 'Patched')).toBeDefined();
  });

  it('buildDetailItemsFromSpecs main section includes friendly Actions content for a system monster', () => {
    expect(aboleth).toBeDefined();
    const main = buildDetailItemsFromSpecs(MONSTER_DETAIL_SPECS, aboleth!, ctx, { section: 'main' });
    const actions = main.find((row) => row.label === 'Actions');
    expect(actions?.value).toBeDefined();
    render(<Fragment>{actions?.value}</Fragment>);
    expect(screen.getByRole('heading', { level: 3, name: 'Multiattack' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Tentacle' })).toBeInTheDocument();
  });

  it('buildDetailItemsFromSpecs advanced section is empty for non–platform admins (platformOwner raw rows)', () => {
    expect(goblin).toBeDefined();
    const advanced = buildDetailItemsFromSpecs(MONSTER_DETAIL_SPECS, goblin!, ctx, {
      section: 'advanced',
      viewer: { isPlatformAdmin: false },
    });
    expect(advanced).toHaveLength(0);
  });

  it('buildDetailItemsFromSpecs advanced section includes raw rows for platform admins when data exists', () => {
    expect(goblin).toBeDefined();
    const advanced = buildDetailItemsFromSpecs(MONSTER_DETAIL_SPECS, goblin!, ctx, {
      section: 'advanced',
      viewer: { isPlatformAdmin: true },
    });
    expect(advanced.length).toBeGreaterThan(0);
    const actions = advanced.find((row) => row.label === 'Actions');
    expect(actions?.value).toBeDefined();
  });

  it('advanced structured fields render default raw JSON in a pre for platform admins', () => {
    expect(goblin).toBeDefined();
    const advanced = buildDetailItemsFromSpecs(MONSTER_DETAIL_SPECS, goblin!, ctx, {
      section: 'advanced',
      viewer: { isPlatformAdmin: true },
    });
    const actions = advanced.find((row) => row.label === 'Actions');
    const { container } = render(<Fragment>{actions?.value}</Fragment>);
    const pre = container.querySelector('pre');
    expect(pre).toBeTruthy();
    expect(pre?.textContent).toMatch(/"kind"\s*:/);
  });

  it('MonsterAbilitiesSummary renders ability abbreviations and scores', () => {
    expect(goblin).toBeDefined();
    render(<MonsterAbilitiesSummary monster={goblin!} />);
    const strBlock = screen.getByText('STR').parentElement;
    expect(strBlock).toBeTruthy();
    expect(within(strBlock!).getByText('8')).toBeInTheDocument();
  });

  it('MonsterSensesSummary resolves darkvision and passive Perception for aboleth', () => {
    expect(aboleth).toBeDefined();
    render(<MonsterSensesSummary monster={aboleth!} />);
    expect(screen.getByText(/Darkvision\s+120\s+ft\./i)).toBeInTheDocument();
    expect(screen.getByText(/passive Perception\s+20/i)).toBeInTheDocument();
  });

  it('MonsterLanguagesSummary shows resolved language label', () => {
    expect(aboleth).toBeDefined();
    render(<MonsterLanguagesSummary monster={aboleth!} />);
    expect(screen.getByText(/Common/i)).toBeInTheDocument();
  });

  it('MonsterTraitsSummary lists trait names from the stat block', () => {
    expect(aboleth).toBeDefined();
    render(<MonsterTraitsSummary monster={aboleth!} />);
    expect(screen.getByText('Amphibious')).toBeInTheDocument();
    expect(screen.getByText('Legendary Resistance', { exact: true })).toBeInTheDocument();
  });
});

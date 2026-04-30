import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch } from '@/app/api';
import { getContentPatch, getEntryPatch } from '@/features/content/shared/domain/contentPatchRepo';
import type { CampaignCatalogAdmin } from '@/features/mechanics/domain/rulesets/campaign/buildCatalog';
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/rulesets/ids/systemIds';
import { getSystemMonster } from '@/features/mechanics/domain/rulesets/system/monsters';
import { fetchMonsterDetailEntry } from './monsterRepo';

vi.mock('@/app/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/app/api')>();
  return {
    ...actual,
    apiFetch: vi.fn(),
  };
});

vi.mock('@/features/content/shared/domain/contentPatchRepo', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/content/shared/domain/contentPatchRepo')>();
  return {
    ...actual,
    getContentPatch: vi.fn().mockResolvedValue(null),
    getEntryPatch: vi.fn().mockReturnValue(null),
  };
});

vi.mock('@/features/mechanics/domain/rulesets/system/monsters', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/mechanics/domain/rulesets/system/monsters')>();
  return {
    ...actual,
    getSystemMonster: vi.fn(),
  };
});

describe('fetchMonsterDetailEntry', () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
    vi.mocked(getContentPatch).mockClear();
    vi.mocked(getEntryPatch).mockClear();
    vi.mocked(getSystemMonster).mockReset();
    vi.mocked(getContentPatch).mockResolvedValue(null);
    vi.mocked(getEntryPatch).mockReturnValue(null);
  });

  const catalogWithMonsters = (
    monstersAllById: NonNullable<CampaignCatalogAdmin['monstersAllById']>,
  ): CampaignCatalogAdmin =>
    ({ monstersAllById }) as CampaignCatalogAdmin;

  it('system catalog entry does not call campaign monster GET', async () => {
    vi.mocked(getSystemMonster).mockReturnValue({
      id: 'goblin',
      name: 'Goblin',
    } as ReturnType<typeof getSystemMonster>);

    const catalog = catalogWithMonsters({
      goblin: { id: 'goblin', name: 'Goblin', source: 'system' },
    });

    const out = await fetchMonsterDetailEntry(
      'camp-1',
      DEFAULT_SYSTEM_RULESET_ID,
      'goblin',
      catalog,
    );

    expect(out).toMatchObject({ id: 'goblin', name: 'Goblin' });
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it('campaign catalog entry loads from campaign API only', async () => {
    vi.mocked(apiFetch).mockResolvedValue({
      monster: {
        _id: 'mongo1',
        campaignId: 'camp-1',
        monsterId: 'homebrew-x',
        name: 'Homebrew',
        data: { id: 'homebrew-x' },
        createdAt: '',
        updatedAt: '',
      },
    });

    const catalog = catalogWithMonsters({
      'homebrew-x': {
        id: 'homebrew-x',
        name: 'Homebrew',
        source: 'campaign',
        campaignId: 'camp-1',
      },
    });

    const out = await fetchMonsterDetailEntry(
      'camp-1',
      DEFAULT_SYSTEM_RULESET_ID,
      'homebrew-x',
      catalog,
    );

    expect(out?.source).toBe('campaign');
    expect(apiFetch).toHaveBeenCalledTimes(1);
    expect(String(vi.mocked(apiFetch).mock.calls[0]?.[0])).toContain(
      '/api/campaigns/camp-1/monsters/homebrew-x',
    );
  });

  it('when catalog has no meta for key, tries campaign then system', async () => {
    vi.mocked(apiFetch).mockRejectedValue(new ApiError('missing', 404));
    vi.mocked(getSystemMonster).mockReturnValue({
      id: 'only-system',
      name: 'Sys',
    } as ReturnType<typeof getSystemMonster>);

    const catalog = catalogWithMonsters({});

    const out = await fetchMonsterDetailEntry(
      'camp-1',
      DEFAULT_SYSTEM_RULESET_ID,
      'only-system',
      catalog,
    );

    expect(out).toMatchObject({ id: 'only-system' });
    expect(apiFetch).toHaveBeenCalledTimes(1);
    expect(getSystemMonster).toHaveBeenCalledWith(DEFAULT_SYSTEM_RULESET_ID, 'only-system');
  });
});

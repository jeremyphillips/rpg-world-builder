import { describe, expect, it, vi } from 'vitest';
import { resolveCatalogSourcedCampaignEntry } from './resolveCatalogSourcedCampaignEntry';

type Row = { id: string; source?: 'campaign' | 'system' };

function row(id: string, source?: Row['source']): Row {
  return source === undefined ? { id } : { id, source };
}

describe('resolveCatalogSourcedCampaignEntry', () => {
  it('uses getCampaign only when meta.source is campaign', async () => {
    const getCampaign = vi.fn().mockResolvedValue(row('a', 'campaign'));
    const loadSystemWithPatch = vi.fn();
    const out = await resolveCatalogSourcedCampaignEntry<Row, Row>({
      meta: row('a', 'campaign'),
      getCampaign,
      loadSystemWithPatch,
      systemRowExists: () => true,
      loadCatalogOnly: vi.fn(),
    });
    expect(out).toEqual(row('a', 'campaign'));
    expect(getCampaign).toHaveBeenCalledTimes(1);
    expect(loadSystemWithPatch).not.toHaveBeenCalled();
  });

  it('uses loadSystemWithPatch only when meta.source is system', async () => {
    const getCampaign = vi.fn();
    const loadSystemWithPatch = vi.fn().mockResolvedValue(row('b', 'system'));
    const out = await resolveCatalogSourcedCampaignEntry<Row, Row>({
      meta: row('b', 'system'),
      getCampaign,
      loadSystemWithPatch,
      systemRowExists: () => false,
      loadCatalogOnly: vi.fn(),
    });
    expect(out).toEqual(row('b', 'system'));
    expect(getCampaign).not.toHaveBeenCalled();
    expect(loadSystemWithPatch).toHaveBeenCalledTimes(1);
  });

  it('when meta has no source but system row exists, uses loadSystemWithPatch', async () => {
    const getCampaign = vi.fn();
    const loadSystemWithPatch = vi.fn().mockResolvedValue(row('c', 'system'));
    const loadCatalogOnly = vi.fn();
    const out = await resolveCatalogSourcedCampaignEntry<Row, Row>({
      meta: row('c'),
      getCampaign,
      loadSystemWithPatch,
      systemRowExists: () => true,
      loadCatalogOnly,
    });
    expect(out).toEqual(row('c', 'system'));
    expect(getCampaign).not.toHaveBeenCalled();
    expect(loadCatalogOnly).not.toHaveBeenCalled();
  });

  it('when meta has no source and no system row, uses loadCatalogOnly', async () => {
    const getCampaign = vi.fn();
    const loadSystemWithPatch = vi.fn();
    const loadCatalogOnly = vi.fn().mockResolvedValue(row('d'));
    const out = await resolveCatalogSourcedCampaignEntry<Row, Row>({
      meta: row('d'),
      getCampaign,
      loadSystemWithPatch,
      systemRowExists: () => false,
      loadCatalogOnly,
    });
    expect(out).toEqual(row('d'));
    expect(getCampaign).not.toHaveBeenCalled();
    expect(loadSystemWithPatch).not.toHaveBeenCalled();
    expect(loadCatalogOnly).toHaveBeenCalledWith(row('d'));
  });

  it('when meta is absent, tries getCampaign then loadSystemWithPatch', async () => {
    const getCampaign = vi.fn().mockResolvedValue(null);
    const loadSystemWithPatch = vi.fn().mockResolvedValue(row('e', 'system'));
    const out = await resolveCatalogSourcedCampaignEntry<Row, Row>({
      meta: undefined,
      getCampaign,
      loadSystemWithPatch,
      systemRowExists: () => true,
      loadCatalogOnly: vi.fn(),
    });
    expect(out).toEqual(row('e', 'system'));
    expect(getCampaign).toHaveBeenCalledTimes(1);
    expect(loadSystemWithPatch).toHaveBeenCalledTimes(1);
  });

  it('when meta is absent and campaign returns a row, does not call system load', async () => {
    const getCampaign = vi.fn().mockResolvedValue(row('f', 'campaign'));
    const loadSystemWithPatch = vi.fn();
    const out = await resolveCatalogSourcedCampaignEntry<Row, Row>({
      meta: undefined,
      getCampaign,
      loadSystemWithPatch,
      systemRowExists: () => true,
      loadCatalogOnly: vi.fn(),
    });
    expect(out).toEqual(row('f', 'campaign'));
    expect(getCampaign).toHaveBeenCalledTimes(1);
    expect(loadSystemWithPatch).not.toHaveBeenCalled();
  });
});

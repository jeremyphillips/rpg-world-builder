import { describe, expect, it } from 'vitest';
import type { CampaignContentPatch } from './contentPatch.types';
import {
  mergeSystemCampaignWithPatches,
  resolveSystemEntryWithPatch,
  summariesFromCatalogWithPatches,
} from './patchedContentResolution';

type TestRow = {
  id: string;
  name: string;
  source: 'system' | 'campaign';
  patched?: boolean;
};

describe('mergeSystemCampaignWithPatches', () => {
  const system: TestRow[] = [
    { id: 'a', name: 'A', source: 'system' },
    { id: 'b', name: 'B', source: 'system' },
  ];
  const campaign: TestRow[] = [
    { id: 'b', name: 'B-custom', source: 'campaign' },
  ];

  it('replaces system row when campaign has same id', () => {
    const merged = mergeSystemCampaignWithPatches(system, campaign, {});
    expect(merged.find((r) => r.id === 'b')).toMatchObject({
      name: 'B-custom',
      source: 'campaign',
    });
    expect(merged.find((r) => r.id === 'a')).toMatchObject({ name: 'A' });
  });

  it('applies patch and sets patched when no campaign override', () => {
    const patches = { a: { name: 'A+' } };
    const merged = mergeSystemCampaignWithPatches(system, campaign, patches);
    expect(merged.find((r) => r.id === 'a')).toMatchObject({
      name: 'A+',
      patched: true,
    });
  });

  it('does not patch campaign-owned replacement row', () => {
    const patches = { b: { name: 'should-not-apply' } };
    const merged = mergeSystemCampaignWithPatches(system, campaign, patches);
    expect(merged.find((r) => r.id === 'b')).toMatchObject({
      name: 'B-custom',
      source: 'campaign',
    });
  });
});

describe('resolveSystemEntryWithPatch', () => {
  it('returns entry unchanged when patch is null or undefined', () => {
    const row = { id: 'x', name: 'X', source: 'system' as const };
    expect(resolveSystemEntryWithPatch(row, null)).toBe(row);
    expect(resolveSystemEntryWithPatch(row, undefined)).toBe(row);
  });

  it('merges patch and sets patched', () => {
    const row = { id: 'x', name: 'X', source: 'system' as const };
    const out = resolveSystemEntryWithPatch(row, { name: 'X+' });
    expect(out).toMatchObject({ name: 'X+', patched: true });
  });
});

describe('summariesFromCatalogWithPatches', () => {
  const patchDoc: CampaignContentPatch = {
    campaignId: 'c',
    patches: { races: { r1: { name: 'R1+' } } },
  };

  const catalog: Record<string, TestRow> = {
    r1: { id: 'r1', name: 'R1', source: 'system' },
    r2: { id: 'r2', name: 'R2', source: 'system', patched: true },
  };

  it('marks patched for system rows with a patch map entry', () => {
    const summaries = summariesFromCatalogWithPatches({
      catalogById: catalog,
      patchDoc,
      contentTypeKey: 'races',
      allowedIds: undefined,
      toSummary: (e, allowed) => ({ id: e.id, allowed, patched: e.patched }),
    });
    const r1 = summaries.find((s) => s.id === 'r1');
    expect(r1?.patched).toBe(true);
    expect(r1?.allowed).toBe(true);
  });

  it('respects allowedIds when provided', () => {
    const summaries = summariesFromCatalogWithPatches({
      catalogById: catalog,
      patchDoc,
      contentTypeKey: 'races',
      allowedIds: ['r2'],
      toSummary: (e, allowed) => ({ id: e.id, allowed }),
    });
    expect(summaries.find((s) => s.id === 'r1')?.allowed).toBe(false);
    expect(summaries.find((s) => s.id === 'r2')?.allowed).toBe(true);
  });
});

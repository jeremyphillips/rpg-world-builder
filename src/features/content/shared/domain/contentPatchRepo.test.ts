import { describe, expect, it } from 'vitest';
import {
  getEntryPatch,
  getPatchMapForType,
  hasEntryPatch,
} from './contentPatchRepo';
import type { CampaignContentPatch } from './patches/contentPatch.types';

const sampleDoc: CampaignContentPatch = {
  campaignId: 'c1',
  patches: {
    races: { elf: { name: 'Elf+' } },
    monsters: { goblin: { name: 'Goblin+' } },
  },
};

describe('getPatchMapForType', () => {
  it('returns empty object when doc or type map is missing', () => {
    expect(getPatchMapForType(undefined, 'races')).toEqual({});
    expect(getPatchMapForType(null, 'races')).toEqual({});
    expect(getPatchMapForType({ campaignId: 'x', patches: {} }, 'races')).toEqual({});
  });

  it('returns the patch record for the content type', () => {
    expect(getPatchMapForType(sampleDoc, 'races')).toEqual({ elf: { name: 'Elf+' } });
  });
});

describe('hasEntryPatch', () => {
  it('returns false when no patch for id', () => {
    expect(hasEntryPatch(sampleDoc, 'races', 'dwarf')).toBe(false);
    expect(hasEntryPatch(undefined, 'races', 'elf')).toBe(false);
  });

  it('returns true when a patch exists', () => {
    expect(hasEntryPatch(sampleDoc, 'races', 'elf')).toBe(true);
  });
});

describe('getEntryPatch', () => {
  it('accepts undefined doc', () => {
    expect(getEntryPatch(undefined, 'races', 'elf')).toBeNull();
  });

  it('returns the entry patch or null', () => {
    expect(getEntryPatch(sampleDoc, 'races', 'elf')).toEqual({ name: 'Elf+' });
    expect(getEntryPatch(sampleDoc, 'races', 'missing')).toBeNull();
  });
});

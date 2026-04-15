import { describe, expect, it } from 'vitest';
import { normalizeRawCampaignSpellToCanonical } from './campaignSpell.normalize';

describe('normalizeRawCampaignSpellToCanonical', () => {
  it('maps legacy string description and flags to nested defaults', () => {
    const out = normalizeRawCampaignSpellToCanonical({
      name: 'Test',
      description: 'Legacy full text',
      school: 'evocation',
      level: 3,
      classes: ['wizard'],
      ritual: true,
      concentration: true,
      effectGroups: [],
    });
    expect(out.description).toEqual({ full: 'Legacy full text', summary: '' });
    expect(out.castingTime.canBeCastAsRitual).toBe(true);
    expect(out.duration.kind).toBe('timed');
    if (out.duration.kind === 'timed') {
      expect(out.duration.concentration).toBe(true);
    }
  });

  it('passes through canonical nested fields', () => {
    const out = normalizeRawCampaignSpellToCanonical({
      name: 'X',
      description: { full: 'f', summary: 's' },
      school: 'abjuration',
      level: 0,
      classes: [],
      castingTime: {
        normal: { value: 1, unit: 'action' },
        canBeCastAsRitual: false,
      },
      range: { kind: 'self' },
      duration: { kind: 'instantaneous' },
      components: {},
      effectGroups: [],
    });
    expect(out.description.summary).toBe('s');
    expect(out.duration.kind).toBe('instantaneous');
  });
});

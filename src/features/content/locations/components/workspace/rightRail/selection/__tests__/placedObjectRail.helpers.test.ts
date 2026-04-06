import { describe, expect, it } from 'vitest';

import type { Location } from '@/features/content/locations/domain/model/location';

import {
  formatCellPlacementLine,
  legacyMapObjectKindTitle,
  shouldShowLinkedIdentityForPlacedObject,
} from '../placedObjectRail.helpers';

function loc(partial: Pick<Location, 'id' | 'name' | 'scale'>): Location {
  return partial as Location;
}

describe('shouldShowLinkedIdentityForPlacedObject', () => {
  it('returns true when family has linkedScale and linked location scale matches', () => {
    expect(
      shouldShowLinkedIdentityForPlacedObject('city', 'loc-1', loc({ id: 'loc-1', name: 'Rivendell', scale: 'city' })),
    ).toBe(true);
  });

  it('returns false when linked location scale does not match family linkedScale', () => {
    expect(
      shouldShowLinkedIdentityForPlacedObject('city', 'loc-1', loc({ id: 'loc-1', name: 'X', scale: 'site' })),
    ).toBe(false);
  });

  it('returns false when family has no linkedScale (e.g. table)', () => {
    expect(
      shouldShowLinkedIdentityForPlacedObject('table', 'loc-1', loc({ id: 'loc-1', name: 'Y', scale: 'floor' })),
    ).toBe(false);
  });

  it('returns false when no linked location id', () => {
    expect(shouldShowLinkedIdentityForPlacedObject('city', undefined, undefined)).toBe(false);
  });
});

describe('formatCellPlacementLine', () => {
  it('formats parsed grid cell ids as Cell x,y', () => {
    expect(formatCellPlacementLine('3,4')).toBe('Cell 3,4');
  });

  it('falls back to raw id when parse fails', () => {
    expect(formatCellPlacementLine('not-a-grid-cell')).toBe('Cell not-a-grid-cell');
  });
});

describe('legacyMapObjectKindTitle', () => {
  it('maps persisted map object kinds to display titles', () => {
    expect(legacyMapObjectKindTitle('stairs')).toBe('Stairs');
    expect(legacyMapObjectKindTitle('table')).toBe('Table');
  });
});

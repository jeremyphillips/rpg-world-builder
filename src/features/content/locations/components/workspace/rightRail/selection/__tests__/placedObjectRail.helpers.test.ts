import { describe, expect, it } from 'vitest';

import type { Location } from '@/features/content/locations/domain/model/location';
import type { AuthoredPlacedObjectVariantPresentation } from '@/features/content/locations/domain/model/placedObjects/locationPlacedObject.registry';

import {
  buildCellFillSelectionRailViewModel,
  cellFillCategoryToSectionLabel,
  cellFillPresentationRowsFromPresentation,
  formatCellPlacementLine,
  formatEdgePlacementLine,
  legacyMapObjectKindTitle,
  presentationRecordToMetadataRows,
  presentationRowsFromPresentation,
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

describe('formatEdgePlacementLine', () => {
  it('formats interior between edges', () => {
    expect(formatEdgePlacementLine('between:1,1|2,1')).toBe('Between Cell 1,1 and Cell 2,1');
  });

  it('formats perimeter edges', () => {
    expect(formatEdgePlacementLine('perimeter:11,2|E')).toBe('Cell 11,2 · east edge');
  });

  it('falls back when id is not a known square edge shape', () => {
    expect(formatEdgePlacementLine('opaque-id')).toBe('Edge opaque-id');
  });
});

describe('presentationRowsFromPresentation', () => {
  it('builds title-case labels and prettifies values', () => {
    expect(
      presentationRowsFromPresentation({
        material: 'wood',
        form: 'single-leaf',
      }),
    ).toEqual([
      { label: 'Material', value: 'wood' },
      { label: 'Form', value: 'single leaf' },
    ]);
  });

  it('returns empty when presentation is undefined', () => {
    expect(presentationRowsFromPresentation(undefined)).toEqual([]);
  });

  it('matches presentationRecordToMetadataRows for the same record', () => {
    const rec = { material: 'wood', form: 'single-leaf' } as AuthoredPlacedObjectVariantPresentation;
    expect(presentationRowsFromPresentation(rec)).toEqual(presentationRecordToMetadataRows(rec));
  });
});

describe('cellFillCategoryToSectionLabel', () => {
  it('maps terrain and surface', () => {
    expect(cellFillCategoryToSectionLabel('terrain')).toBe('Terrain');
    expect(cellFillCategoryToSectionLabel('surface')).toBe('Surface');
  });
});

describe('cellFillPresentationRowsFromPresentation', () => {
  it('forest variant shows biome and density', () => {
    expect(
      cellFillPresentationRowsFromPresentation({
        biome: 'temperate',
        density: 'dense',
      }),
    ).toEqual([
      { label: 'Biome', value: 'temperate' },
      { label: 'Density', value: 'dense' },
    ]);
  });

  it('floor variant shows material', () => {
    expect(cellFillPresentationRowsFromPresentation({ material: 'stone' })).toEqual([
      { label: 'Material', value: 'stone' },
    ]);
  });
});

describe('buildCellFillSelectionRailViewModel', () => {
  it('uses resolved variant label and cell placement', () => {
    const vm = buildCellFillSelectionRailViewModel('13,1', {
      familyId: 'forest',
      variantId: 'temperate_dense',
    });
    expect(vm.categoryLabel).toBe('Terrain');
    expect(vm.title).toBe('Dense forest');
    expect(vm.placementLine).toBe('Cell 13,1');
    expect(vm.metadataRows).toEqual([
      { label: 'Biome', value: 'temperate' },
      { label: 'Density', value: 'dense' },
    ]);
  });

  it('resolves floor stone variant', () => {
    const vm = buildCellFillSelectionRailViewModel('6,1', { familyId: 'floor', variantId: 'stone' });
    expect(vm.categoryLabel).toBe('Surface');
    expect(vm.title).toBe('Stone floor');
    expect(vm.placementLine).toBe('Cell 6,1');
    expect(vm.metadataRows).toEqual([{ label: 'Material', value: 'stone' }]);
  });
});

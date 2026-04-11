// @vitest-environment node
import { describe, expect, it } from 'vitest';

import {
  BUILDING_MAP_VARIANT_COMPACT,
  BUILDING_MAP_VARIANT_WIDE,
  deriveBuildingObjectRecommendation,
  getCompatibleMapVariantsForBuildingForm,
} from '../../building/deriveBuildingObjectRecommendation';

describe('deriveBuildingObjectRecommendation', () => {
  it('uses explicit buildingFormClass and maps compact forms to compact map variant', () => {
    const r = deriveBuildingObjectRecommendation({
      meta: { primaryType: 'business', primarySubtype: 'warehouse' },
      buildingFormClass: 'compact_small',
    });
    expect(r.buildingFormId).toBe('compact_small');
    expect(r.recommendedMapVariantIds).toEqual([BUILDING_MAP_VARIANT_COMPACT]);
  });

  it('maps wide form classes to wide map variant', () => {
    expect(getCompatibleMapVariantsForBuildingForm('wide_large')).toEqual([BUILDING_MAP_VARIANT_WIDE]);
  });

  it('infers warehouse as wide_large + wide map variant', () => {
    const r = deriveBuildingObjectRecommendation({
      meta: { primaryType: 'business', primarySubtype: 'warehouse' },
    });
    expect(r.buildingFormId).toBe('wide_large');
    expect(r.recommendedMapVariantIds).toEqual([BUILDING_MAP_VARIANT_WIDE]);
  });

  it('infers house-like residence as compact_small', () => {
    const r = deriveBuildingObjectRecommendation({
      meta: { primaryType: 'residence', primarySubtype: 'house' },
    });
    expect(r.buildingFormId).toBe('compact_small');
    expect(r.recommendedMapVariantIds).toEqual([BUILDING_MAP_VARIANT_COMPACT]);
  });

  it('infers blacksmith as wide_medium', () => {
    const r = deriveBuildingObjectRecommendation({
      meta: { primaryType: 'business', primarySubtype: 'blacksmith' },
    });
    expect(r.buildingFormId).toBe('wide_medium');
    expect(r.recommendedMapVariantIds).toEqual([BUILDING_MAP_VARIANT_WIDE]);
  });
});

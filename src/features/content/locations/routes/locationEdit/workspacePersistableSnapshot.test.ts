import { describe, expect, it } from 'vitest';

import { stableStringify } from '@/features/content/locations/components/locationGridDraft.utils';
import { INITIAL_LOCATION_GRID_DRAFT } from '@/features/content/locations/components/locationGridDraft.types';
import { LOCATION_FORM_DEFAULTS } from '@/features/content/locations/domain';
import type { LocationContentItem } from '@/features/content/locations/domain/repo/locationRepo';

import {
  buildCampaignWorkspacePersistableParts,
  serializeLocationWorkspacePersistableSnapshot,
} from './workspacePersistableSnapshot';

const baseForm = () => structuredClone(LOCATION_FORM_DEFAULTS);

describe('serializeLocationWorkspacePersistableSnapshot', () => {
  it('is stable for identical inputs', () => {
    const form = baseForm();
    form.scale = 'world';
    const a = serializeLocationWorkspacePersistableSnapshot(
      form,
      INITIAL_LOCATION_GRID_DRAFT,
      [],
      null,
    );
    const b = serializeLocationWorkspacePersistableSnapshot(
      structuredClone(form),
      structuredClone(INITIAL_LOCATION_GRID_DRAFT),
      [],
      null,
    );
    expect(a).toBe(b);
  });

  it('changes when a form field changes', () => {
    const form = baseForm();
    form.scale = 'world';
    form.name = 'A';
    const before = serializeLocationWorkspacePersistableSnapshot(
      form,
      INITIAL_LOCATION_GRID_DRAFT,
      [],
      null,
    );
    form.name = 'B';
    const after = serializeLocationWorkspacePersistableSnapshot(
      form,
      INITIAL_LOCATION_GRID_DRAFT,
      [],
      null,
    );
    expect(before).not.toBe(after);
  });

  it('changes when map cell fill changes', () => {
    const form = baseForm();
    form.scale = 'world';
    const draftA = { ...INITIAL_LOCATION_GRID_DRAFT };
    const draftB = {
      ...INITIAL_LOCATION_GRID_DRAFT,
      cellFillByCellId: { '0,0': 'plains' },
    };
    const before = serializeLocationWorkspacePersistableSnapshot(
      form,
      draftA,
      [],
      null,
    );
    const after = serializeLocationWorkspacePersistableSnapshot(form, draftB, [], null);
    expect(before).not.toBe(after);
  });

  it('changes when building stair connections change (building loc)', () => {
    const form = baseForm();
    form.scale = 'building';
    const loc = {
      source: 'campaign',
      scale: 'building',
      buildingProfile: {},
    } as unknown as LocationContentItem;

    const empty = serializeLocationWorkspacePersistableSnapshot(
      form,
      INITIAL_LOCATION_GRID_DRAFT,
      [],
      loc,
    );
    const withConn = serializeLocationWorkspacePersistableSnapshot(
      form,
      INITIAL_LOCATION_GRID_DRAFT,
      [
        {
          id: 'c1',
          kind: 'stairs',
          buildingLocationId: 'b1',
          endpointA: {
            floorLocationId: 'f1',
            cellId: '0,0',
            objectId: 'o1',
          },
          endpointB: {
            floorLocationId: 'f2',
            cellId: '1,1',
            objectId: 'o2',
          },
        },
      ],
      loc,
    );
    expect(empty).not.toBe(withConn);
  });

  it('serialize matches stableStringify of buildCampaignWorkspacePersistableParts', () => {
    const form = baseForm();
    form.scale = 'world';
    const parts = buildCampaignWorkspacePersistableParts(
      form,
      INITIAL_LOCATION_GRID_DRAFT,
      [],
      null,
    );
    expect(serializeLocationWorkspacePersistableSnapshot(form, INITIAL_LOCATION_GRID_DRAFT, [], null)).toBe(
      stableStringify({ location: parts.locationInput, map: parts.mapBootstrapPayload }),
    );
  });
});

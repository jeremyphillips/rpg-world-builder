import { describe, expect, it } from 'vitest';

import { stableStringify } from '@/features/content/locations/components/locationGridDraft.utils';
import { INITIAL_LOCATION_GRID_DRAFT } from '@/features/content/locations/components/locationGridDraft.types';
import { LOCATION_FORM_DEFAULTS } from '@/features/content/locations/domain';
import type { LocationContentItem } from '@/features/content/locations/domain/repo/locationRepo';

import {
  buildHomebrewWorkspacePersistableParts,
  buildMapWorkspacePersistablePayloadFromGridDraft,
  mapWorkspacePersistableTokenFromGridDraft,
  serializeLocationWorkspacePersistableSnapshot,
} from './workspacePersistableSnapshot';

const baseForm = () => structuredClone(LOCATION_FORM_DEFAULTS);

const buildingLoc = {
  source: 'campaign',
  scale: 'building',
  buildingProfile: {},
} as unknown as LocationContentItem;

const sampleStairConnection = {
  id: 'c1',
  kind: 'stairs' as const,
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
};

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

  it('does not change snapshot when name differs only by outer whitespace (trim policy)', () => {
    const form = baseForm();
    form.scale = 'world';
    form.name = '  My Place  ';
    const spaced = serializeLocationWorkspacePersistableSnapshot(
      form,
      INITIAL_LOCATION_GRID_DRAFT,
      [],
      null,
    );
    form.name = 'My Place';
    const trimmed = serializeLocationWorkspacePersistableSnapshot(
      form,
      INITIAL_LOCATION_GRID_DRAFT,
      [],
      null,
    );
    expect(spaced).toBe(trimmed);
  });

  it('map slice: region name spacing-only does not change snapshot (aligned with save normalization)', () => {
    const form = baseForm();
    form.scale = 'world';
    const draftLoose = {
      ...INITIAL_LOCATION_GRID_DRAFT,
      regionEntries: [{ id: 'r1', name: '  Zone  ', colorKey: 'regionRed' }],
    };
    const draftTight = {
      ...INITIAL_LOCATION_GRID_DRAFT,
      regionEntries: [{ id: 'r1', name: 'Zone', colorKey: 'regionRed' }],
    };
    expect(
      serializeLocationWorkspacePersistableSnapshot(form, draftLoose, [], null),
    ).toBe(serializeLocationWorkspacePersistableSnapshot(form, draftTight, [], null));
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

    const empty = serializeLocationWorkspacePersistableSnapshot(
      form,
      INITIAL_LOCATION_GRID_DRAFT,
      [],
      buildingLoc,
    );
    const withConn = serializeLocationWorkspacePersistableSnapshot(
      form,
      INITIAL_LOCATION_GRID_DRAFT,
      [sampleStairConnection],
      buildingLoc,
    );
    expect(empty).not.toBe(withConn);
  });

  it('serialize matches stableStringify of buildHomebrewWorkspacePersistableParts', () => {
    const form = baseForm();
    form.scale = 'world';
    const parts = buildHomebrewWorkspacePersistableParts(
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

describe('mapWorkspacePersistablePayload (shared homebrew + system grid token)', () => {
  it('token matches stableStringify of map slice from buildHomebrewWorkspacePersistableParts', () => {
    const form = baseForm();
    form.scale = 'world';
    const draft = {
      ...INITIAL_LOCATION_GRID_DRAFT,
      pathEntries: [{ id: 'p1', kind: 'road' as const, cellIds: ['0,0', '1,0'] }],
    };
    const { mapBootstrapPayload } = buildHomebrewWorkspacePersistableParts(form, draft, [], null);
    expect(mapWorkspacePersistableTokenFromGridDraft(draft)).toBe(stableStringify(mapBootstrapPayload));
  });

  it('buildMapWorkspacePersistablePayloadFromGridDraft matches mapBootstrapPayload from parts', () => {
    const form = baseForm();
    form.scale = 'world';
    const draft = INITIAL_LOCATION_GRID_DRAFT;
    const parts = buildHomebrewWorkspacePersistableParts(form, draft, [], null);
    expect(buildMapWorkspacePersistablePayloadFromGridDraft(draft)).toEqual(parts.mapBootstrapPayload);
  });
});

/**
 * Matrix: each row is a distinct persistable dimension; snapshot must change when only that dimension changes.
 *
 * **Slices covered:** location form (`form slice`), map authoring (`map slice`), building stair connections (`regression` row).
 */
describe('workspacePersistableSnapshot matrix', () => {
  const worldForm = () => {
    const f = baseForm();
    f.scale = 'world';
    return f;
  };

  const snap = (
    form: ReturnType<typeof baseForm>,
    draft: typeof INITIAL_LOCATION_GRID_DRAFT,
    stairs: readonly (typeof sampleStairConnection)[] = [],
    loc: LocationContentItem | null = null,
  ) => serializeLocationWorkspacePersistableSnapshot(form, draft, stairs, loc);

  it('form slice: name change (world scale omits category in LocationInput)', () => {
    const f = worldForm();
    const base = snap(f, INITIAL_LOCATION_GRID_DRAFT);
    f.name = `${f.name}-edited`;
    expect(snap(f, INITIAL_LOCATION_GRID_DRAFT)).not.toBe(base);
  });

  it('map slice: object metadata (label) on a cell', () => {
    const f = worldForm();
    const emptyObjs = { ...INITIAL_LOCATION_GRID_DRAFT };
    const withLabel = {
      ...INITIAL_LOCATION_GRID_DRAFT,
      objectsByCellId: {
        '0,0': [{ id: 'obj-1', kind: 'marker' as const, label: 'Pin A' }],
      },
    };
    expect(snap(f, emptyObjs)).not.toBe(snap(f, withLabel));
  });

  it('map slice: pathEntries', () => {
    const f = worldForm();
    const noPath = { ...INITIAL_LOCATION_GRID_DRAFT };
    const withPath = {
      ...INITIAL_LOCATION_GRID_DRAFT,
      pathEntries: [{ id: 'p1', kind: 'road' as const, cellIds: ['0,0', '1,0'] }],
    };
    expect(snap(f, noPath)).not.toBe(snap(f, withPath));
  });

  it('map slice: edgeEntries', () => {
    const f = worldForm();
    const noEdge = { ...INITIAL_LOCATION_GRID_DRAFT };
    const withEdge = {
      ...INITIAL_LOCATION_GRID_DRAFT,
      edgeEntries: [{ edgeId: 'between:0,0|0,1', kind: 'wall' as const }],
    };
    expect(snap(f, noEdge)).not.toBe(snap(f, withEdge));
  });

  it('map slice: regionEntries', () => {
    const f = worldForm();
    const noRegion = { ...INITIAL_LOCATION_GRID_DRAFT };
    const withRegion = {
      ...INITIAL_LOCATION_GRID_DRAFT,
      regionEntries: [
        {
          id: 'r1',
          name: 'Zone',
          colorKey: 'regionRed',
        },
      ],
    };
    expect(snap(f, noRegion)).not.toBe(snap(f, withRegion));
  });

  it('regression: building stair connections only (grid unchanged)', () => {
    const f = baseForm();
    f.scale = 'building';
    const draft = INITIAL_LOCATION_GRID_DRAFT;
    const without = snap(f, draft, [], buildingLoc);
    const withStairs = snap(f, draft, [sampleStairConnection], buildingLoc);
    expect(without).not.toBe(withStairs);
  });
});

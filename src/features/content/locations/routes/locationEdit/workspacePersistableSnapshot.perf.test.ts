// @vitest-environment node
/**
 * Synthetic timing for `serializeLocationWorkspacePersistableSnapshot` (Node).
 * Results inform docs/reference/location-workspace.md — not a substitute for Chrome DevTools
 * on real edit sessions, but a repeatable baseline for map-payload cost.
 */
import { describe, expect, it } from 'vitest';

import {
  INITIAL_LOCATION_GRID_DRAFT,
  type LocationGridDraftState,
} from '@/features/content/locations/components/authoring/draft/locationGridDraft.types';
import { LOCATION_FORM_DEFAULTS } from '@/features/content/locations/domain';

import { serializeLocationWorkspacePersistableSnapshot } from './workspacePersistableSnapshot';

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)]!;
}

function timeSerializeMs(
  iterations: number,
  fn: () => void,
): { medianMs: number; maxMs: number } {
  const samples: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now();
    fn();
    samples.push(performance.now() - t0);
  }
  return { medianMs: median(samples), maxMs: Math.max(...samples) };
}

/** Sparse typical authoring: modest paths, edges, regions, cell paints. */
function buildMediumDraft(): LocationGridDraftState {
  const pathEntries = Array.from({ length: 40 }, (_, p) => ({
    id: `path-${p}`,
    kind: 'road' as const,
    cellIds: Array.from({ length: 35 }, (_, i) => `${i},${p % 20}`),
  }));
  const edgeEntries = Array.from({ length: 120 }, (_, e) => ({
    edgeId: `between:${e},0|${e + 1},0`,
    kind: 'wall' as const,
  }));
  const regionEntries = Array.from({ length: 25 }, (_, r) => ({
    id: `region-${r}`,
    name: `R${r}`,
    colorKey: 'regionRed' as const,
  }));
  const fill = { familyId: 'plains' as const, variantId: 'temperate_open' as const };
  const cellFillByCellId: Record<string, typeof fill> = {};
  for (let c = 0; c < 180; c++) {
    cellFillByCellId[`${c % 30},${Math.floor(c / 30)}`] = fill;
  }
  return {
    ...INITIAL_LOCATION_GRID_DRAFT,
    pathEntries,
    edgeEntries,
    regionEntries,
    cellFillByCellId,
  };
}

/** Stress: large path chains + many edges (worst-case style, not typical UX). */
function buildStressDraft(): LocationGridDraftState {
  const pathEntries = Array.from({ length: 25 }, (_, p) => ({
    id: `path-${p}`,
    kind: 'river' as const,
    cellIds: Array.from({ length: 200 }, (_, i) => `${i},${p}`),
  }));
  const edgeEntries = Array.from({ length: 800 }, (_, e) => ({
    edgeId: `between:c${e}|c${e + 1}`,
    kind: 'door' as const,
  }));
  return {
    ...INITIAL_LOCATION_GRID_DRAFT,
    pathEntries,
    edgeEntries,
    regionEntries: Array.from({ length: 40 }, (_, r) => ({
      id: `reg-${r}`,
      name: `Region ${r}`,
      colorKey: 'regionBlue' as const,
    })),
  };
}

const baseForm = () => structuredClone(LOCATION_FORM_DEFAULTS);

describe('workspace snapshot serialize (perf smoke)', () => {
  it('minimal draft: median single serialize is well under 1ms (Node)', () => {
    const form = baseForm();
    form.scale = 'world';
    const { medianMs, maxMs } = timeSerializeMs(80, () =>
      serializeLocationWorkspacePersistableSnapshot(
        form,
        INITIAL_LOCATION_GRID_DRAFT,
        [],
        null,
      ),
    );
    expect(medianMs).toBeLessThan(1);
    expect(maxMs).toBeLessThan(20);
  });

  it('medium draft: median remains small on typical-sized authoring payloads', () => {
    const form = baseForm();
    form.scale = 'world';
    const draft = buildMediumDraft();
    const { medianMs, maxMs } = timeSerializeMs(60, () =>
      serializeLocationWorkspacePersistableSnapshot(form, draft, [], null),
    );
    expect(medianMs).toBeLessThan(15);
    expect(maxMs).toBeLessThan(80);
  });

  it('stress draft: still completes within a generous bound (guards pathological growth)', () => {
    const form = baseForm();
    form.scale = 'world';
    const draft = buildStressDraft();
    const { medianMs, maxMs } = timeSerializeMs(40, () =>
      serializeLocationWorkspacePersistableSnapshot(form, draft, [], null),
    );
    expect(medianMs).toBeLessThan(80);
    expect(maxMs).toBeLessThan(250);
  });
});

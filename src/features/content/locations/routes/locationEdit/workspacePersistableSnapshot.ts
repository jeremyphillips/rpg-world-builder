import {
  buildPersistableMapPayloadFromGridDraft,
  stableStringify,
} from '@/features/content/locations/components/authoring/draft/locationGridDraft.utils';
import type { LocationGridDraftState } from '@/features/content/locations/components/authoring/draft/locationGridDraft.types';
import type { LocationFormValues } from '@/features/content/locations/domain';
import { toLocationInput } from '@/features/content/locations/domain';
import type { LocationContentItem } from '@/features/content/locations/domain/repo/locationRepo';
import type { LocationInput } from '@/features/content/locations/domain/model/location';
import type { LocationVerticalStairConnection } from '@/shared/domain/locations';

/**
 * **Homebrew persistable assembly** (this module)
 *
 * Slices that feed `buildHomebrewWorkspacePersistableParts` / `serializeLocationWorkspacePersistableSnapshot`:
 * - **Location** — `toLocationInput(values)` plus {@link mergeBuildingProfileForSave} for building stair connections.
 * - **Map** — {@link buildMapWorkspacePersistablePayloadFromGridDraft} (also {@link mapWorkspacePersistableTokenFromGridDraft} for system grid projections in `locationWorkspaceAuthoringAdapters.ts`).
 *
 * Map dirty comparison uses the same payload as save: `gridDraftPersistableEquals` delegates to {@link buildPersistableMapPayloadFromGridDraft} in `locationGridDraft.utils.ts`. See `locationWorkspaceNormalizationPolicy.ts` and `docs/reference/location-workspace.md`.
 */

/**
 * Persistable location + map payload for **homebrew** location edit (`source === 'campaign'`) — **single source of truth** for:
 * - `locationRepo.updateEntry` input
 * - `bootstrapDefaultLocationMap` options
 * - dirty snapshot stringification
 */
export type HomebrewWorkspacePersistableParts = {
  locationInput: LocationInput;
  /** Pass to `bootstrapDefaultLocationMap` as the last argument (`options`). */
  mapBootstrapPayload: ReturnType<typeof buildPersistableMapPayloadFromGridDraft>;
};

/**
 * Persistable **map** payload from grid draft: sorted `excludedCellIds` + normalized authoring fields.
 * Used by homebrew save/bootstrap and by system workspace `draftProjection` / `persistedBaselineProjection` grid tokens — keep a single implementation.
 */
export function buildMapWorkspacePersistablePayloadFromGridDraft(
  gridDraft: LocationGridDraftState,
): HomebrewWorkspacePersistableParts['mapBootstrapPayload'] {
  return buildPersistableMapPayloadFromGridDraft(gridDraft);
}

/** Stable string token for the map slice (for system contract projections and parity tests). */
export function mapWorkspacePersistableTokenFromGridDraft(gridDraft: LocationGridDraftState): string {
  return stableStringify(buildMapWorkspacePersistablePayloadFromGridDraft(gridDraft));
}

/**
 * Builds the same persistable location + map payloads used by save and dirty detection.
 * Keep in sync with {@link useLocationEditSaveActions} `handleHomebrewSubmit`.
 */
export function buildHomebrewWorkspacePersistableParts(
  values: LocationFormValues,
  gridDraft: LocationGridDraftState,
  buildingStairConnections: readonly LocationVerticalStairConnection[],
  loc: LocationContentItem | null,
): HomebrewWorkspacePersistableParts {
  const input = toLocationInput(values);
  const locationInput = mergeBuildingProfileForSave(input, loc, buildingStairConnections);
  const mapBootstrapPayload = buildMapWorkspacePersistablePayloadFromGridDraft(gridDraft);
  return { locationInput, mapBootstrapPayload };
}

/**
 * Single persistable string for homebrew location edit: merged location input (as saved) + map bootstrap payload.
 */
export function serializeLocationWorkspacePersistableSnapshot(
  values: LocationFormValues,
  gridDraft: LocationGridDraftState,
  buildingStairConnections: readonly LocationVerticalStairConnection[],
  loc: LocationContentItem | null,
): string {
  const { locationInput, mapBootstrapPayload } = buildHomebrewWorkspacePersistableParts(
    values,
    gridDraft,
    buildingStairConnections,
    loc,
  );
  return stableStringify({ location: locationInput, map: mapBootstrapPayload });
}

function mergeBuildingProfileForSave(
  input: LocationInput,
  loc: LocationContentItem | null,
  buildingStairConnections: readonly LocationVerticalStairConnection[],
): LocationInput {
  if (!loc || loc.source !== 'campaign' || loc.scale !== 'building') {
    return input;
  }
  return {
    ...input,
    buildingProfile: {
      ...(loc.buildingProfile ?? {}),
      ...(input.buildingProfile ?? {}),
      stairConnections: [...buildingStairConnections],
    },
  };
}

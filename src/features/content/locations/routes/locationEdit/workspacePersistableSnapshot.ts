import {
  normalizedAuthoringPayloadFromGridDraft,
  stableStringify,
} from '@/features/content/locations/components/locationGridDraft.utils';
import type { LocationGridDraftState } from '@/features/content/locations/components/locationGridDraft.types';
import type { LocationFormValues } from '@/features/content/locations/domain';
import { toLocationInput } from '@/features/content/locations/domain';
import type { LocationContentItem } from '@/features/content/locations/domain/repo/locationRepo';
import type { LocationInput } from '@/features/content/locations/domain/types';
import type { LocationVerticalStairConnection } from '@/shared/domain/locations';

/**
 * Persistable location + map payload for campaign edit — **single source of truth** for:
 * - `locationRepo.updateEntry` input
 * - `bootstrapDefaultLocationMap` options
 * - dirty snapshot stringification
 */
export type CampaignWorkspacePersistableParts = {
  locationInput: LocationInput;
  /** Pass to `bootstrapDefaultLocationMap` as the last argument (`options`). */
  mapBootstrapPayload: {
    excludedCellIds: string[];
  } & ReturnType<typeof normalizedAuthoringPayloadFromGridDraft>;
};

/**
 * Builds the same persistable location + map payloads used by save and dirty detection.
 * Keep in sync with {@link useLocationEditSaveActions} `handleCampaignSubmit`.
 */
export function buildCampaignWorkspacePersistableParts(
  values: LocationFormValues,
  gridDraft: LocationGridDraftState,
  buildingStairConnections: readonly LocationVerticalStairConnection[],
  loc: LocationContentItem | null,
): CampaignWorkspacePersistableParts {
  const input = toLocationInput(values);
  const locationInput = mergeBuildingProfileForSave(input, loc, buildingStairConnections);
  const normalized = normalizedAuthoringPayloadFromGridDraft(gridDraft);
  const mapBootstrapPayload: CampaignWorkspacePersistableParts['mapBootstrapPayload'] = {
    excludedCellIds: [...gridDraft.excludedCellIds].sort(),
    ...normalized,
  };
  return { locationInput, mapBootstrapPayload };
}

/**
 * Single persistable string for campaign location edit: merged location input (as saved) + map bootstrap payload.
 */
export function serializeLocationWorkspacePersistableSnapshot(
  values: LocationFormValues,
  gridDraft: LocationGridDraftState,
  buildingStairConnections: readonly LocationVerticalStairConnection[],
  loc: LocationContentItem | null,
): string {
  const { locationInput, mapBootstrapPayload } = buildCampaignWorkspacePersistableParts(
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

import type { RefObject } from 'react';

import { stableStringify } from '@/features/content/locations/components/locationGridDraft.utils';
import type { LocationGridDraftState } from '@/features/content/locations/components/locationGridDraft.types';
import type { LocationFormValues } from '@/features/content/locations/domain';
import type { LocationContentItem } from '@/features/content/locations/domain/repo/locationRepo';
import type { LocationVerticalStairConnection } from '@/shared/domain/locations';

import { getHomebrewWorkspaceSaveBlockReason } from './homebrewWorkspaceSaveGate';
import { isSystemLocationWorkspaceDirty } from './systemLocationWorkspaceDirty';
import {
  mapWorkspacePersistableTokenFromGridDraft,
  serializeLocationWorkspacePersistableSnapshot,
} from './workspacePersistableSnapshot';
import type { LocationWorkspaceAuthoringContract } from './locationWorkspaceAuthoringContract';

/**
 * Patch rail validation gate — mirrors {@link useSystemPatchActions} `savePatch` (validate before persist).
 */
export function getSystemPatchWorkspaceSaveGate(
  validationApiRef: RefObject<{ validateAll: () => boolean } | null>,
): { canSave: boolean; saveBlockReason: string | null } {
  const ok = validationApiRef.current?.validateAll() ?? true;
  if (ok) return { canSave: true, saveBlockReason: null };
  return {
    canSave: false,
    saveBlockReason: 'Fix validation errors before saving.',
  };
}

/** Full-draft / snapshot-based campaign location editing (`source === 'campaign'`). */
export function buildHomebrewLocationWorkspaceAuthoringContract(params: {
  loc: LocationContentItem | null;
  activeFloorId: string | null;
  values: LocationFormValues;
  gridDraft: LocationGridDraftState;
  buildingStairConnections: readonly LocationVerticalStairConnection[];
  workspacePersistBaseline: string | null;
}): LocationWorkspaceAuthoringContract {
  const {
    loc,
    activeFloorId,
    values,
    gridDraft,
    buildingStairConnections,
    workspacePersistBaseline,
  } = params;

  const draftSnapshot = serializeLocationWorkspacePersistableSnapshot(
    values,
    gridDraft,
    buildingStairConnections,
    loc,
  );
  const saveBlockReason = getHomebrewWorkspaceSaveBlockReason(loc, activeFloorId, values);
  const isDirty =
    workspacePersistBaseline !== null && draftSnapshot !== workspacePersistBaseline;

  return {
    mode: 'homebrew',
    isDirty,
    canSave: saveBlockReason === null,
    saveBlockReason,
    draftProjection: draftSnapshot,
    persistedBaselineProjection: workspacePersistBaseline,
  };
}

/** System entry patch + shared grid draft baselines (`source === 'system'`). */
export function buildSystemLocationWorkspaceAuthoringContract(params: {
  isPatchDriverDirty: boolean;
  isGridDraftDirty: boolean;
  patchDocument: Record<string, unknown>;
  patchBaseline: Record<string, unknown>;
  gridDraft: LocationGridDraftState;
  gridDraftBaseline: LocationGridDraftState;
  validationApiRef: RefObject<{ validateAll: () => boolean } | null>;
}): LocationWorkspaceAuthoringContract {
  const {
    isPatchDriverDirty,
    isGridDraftDirty,
    patchDocument,
    patchBaseline,
    gridDraft,
    gridDraftBaseline,
    validationApiRef,
  } = params;

  const { canSave, saveBlockReason } = getSystemPatchWorkspaceSaveGate(validationApiRef);
  const isDirty = isSystemLocationWorkspaceDirty(isPatchDriverDirty, isGridDraftDirty);

  return {
    mode: 'system',
    isDirty,
    canSave,
    saveBlockReason,
    draftProjection: stableStringify({
      patch: patchDocument,
      grid: mapWorkspacePersistableTokenFromGridDraft(gridDraft),
    }),
    persistedBaselineProjection: stableStringify({
      patch: patchBaseline,
      grid: mapWorkspacePersistableTokenFromGridDraft(gridDraftBaseline),
    }),
  };
}

/**
 * Normalization intent for homebrew workspace **dirty comparison** vs **save**
 * (`docs/reference/location-workspace.md`, section *Normalization policy*).
 *
 * Rules are implemented in the linked modules — this file is the **review anchor** (grep `LOCATION_WORKSPACE_NORMALIZATION`).
 */

/** Taxonomy from the workspace reference doc. */
export type LocationWorkspaceNormalizationPolicy =
  | 'normalized for compare and save'
  | 'normalized for save only'
  | 'raw / whitespace-significant'
  | 'custom';

/**
 * Declared policy per persistable slice. Default is **normalized for compare and save** (one shaped value for
 * `serializeLocationWorkspacePersistableSnapshot` and `handleHomebrewSubmit`).
 */
export const LOCATION_WORKSPACE_NORMALIZATION = {
  locationForm: {
    policy: 'normalized for compare and save' satisfies LocationWorkspaceNormalizationPolicy,
    compareSite: 'serializeLocationWorkspacePersistableSnapshot → buildHomebrewWorkspacePersistableParts → toLocationInput',
    saveSite: 'same',
    whitespace:
      'Name and description use trim via form registry parse (`getNameDescriptionFieldSpecs`). Building profile strings trimmed in toLocationInput / buildingProfileFromFormValues.',
  },
  mapSlice: {
    policy: 'normalized for compare and save' satisfies LocationWorkspaceNormalizationPolicy,
    compareSite:
      'serializeLocationWorkspacePersistableSnapshot map half; system grid dirty: gridDraftPersistableEquals → buildPersistableMapPayloadFromGridDraft',
    saveSite: 'handleHomebrewSubmit → same buildPersistableMapPayloadFromGridDraft shape',
    whitespace:
      'Region rows: normalizeRegionAuthoringEntry (trim id/name/description). Cell objects: cellDraftToCellEntries trims labels and ids. Path/edge/region arrays are sorted by stable id in buildPersistableMapPayloadFromGridDraft.',
  },
  buildingStairConnections: {
    policy: 'normalized for compare and save' satisfies LocationWorkspaceNormalizationPolicy,
    compareSite: 'mergeBuildingProfileForSave in workspacePersistableSnapshot',
    saveSite: 'same',
    whitespace: 'Structured data; no string normalization.',
  },
} as const;

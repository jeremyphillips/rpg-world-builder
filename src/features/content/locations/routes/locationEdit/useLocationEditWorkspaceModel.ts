import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';

import { useCharacters } from '@/features/character/hooks/useCharacters';
import { useCampaignMembers } from '@/features/campaign/hooks';
import { useCanvasZoom, useCanvasPan } from '@/ui/hooks';
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import {
  locationRepo,
  validateLocationChange,
  type LocationFormValues,
  getLocationFieldConfigs,
  LOCATION_FORM_DEFAULTS,
  locationToFormValues,
  buildBuildingSubtypeSelectOptions,
  buildCharacterEntityPickerOptions,
  canApplyRegionPaint,
  shouldSwitchRailToMapForPaintDomain,
  upsertRegionEntry,
  applyScaleToLocationFormUiPolicy,
  buildLocationFormUiPolicy,
  getAllowedCellUnitOptionsForScale,
  getDefaultGeometryForScale,
  isLocationScaleSelected,
  listFloorChildren,
  useLocationFormCampaignData,
  useLocationFormDependentFieldEffects,
  getGroupedDrawPaletteForScale,
  getPaintPaletteSectionsForScale,
  getPlacePaletteItemsForScale,
  getPlacementModeForFamily,
  resolveDrawSelectionToAction,
  resolvePlacementCellClick,
  resolvePlacementEdgeFeatureKind,
  resolvePlacedKindToAction,
  applyEraseTargetToDraft,
  resolveEraseTargetAtCell,
  computeHexEdgeConstraintPatch,
  useLocationMapEditorState,
} from '@/features/content/locations/domain';
import { useEditRouteFeedbackState } from '@/features/content/shared/hooks/useEditRouteFeedbackState';
import { useResetEditFeedbackOnChange } from '@/features/content/shared/hooks/useResetEditFeedbackOnChange';
import { useCampaignEntryFormReset } from '@/features/content/shared/hooks/useCampaignEntryFormReset';
import { useSystemEntryPatchState } from '@/features/content/shared/hooks/useSystemEntryPatchState';
import { useAccessPolicyField } from '@/features/content/shared/hooks/useAccessPolicyField';
import { usePatchDriverState } from '@/features/content/shared/hooks/usePatchDriverState';
import { useEntryDeleteAction } from '@/features/content/shared/hooks/useEntryDeleteAction';
import {
  type LocationScaleId,
  type LocationVerticalStairConnection,
} from '@/shared/domain/locations';
import type { LocationMapEdgeAuthoringEntry, LocationMapRegionAuthoringEntry } from '@/shared/domain/locations';
import {
  LOCATION_MAP_DEFAULT_REGION_NAME,
  LOCATION_MAP_REGION_COLOR_KEYS,
} from '@/shared/domain/locations/map/locationMapRegion.constants';
import type { LocationMapRegionColorKey } from '@/features/content/locations/domain/model/map/locationMapRegionColors.types';
import { resolveLeftMapChromeWidthPx } from '@/features/content/locations/domain/presentation/map/locationEditorWorkspaceUiTokens';
import {
  applyEdgeStrokeToDraft,
  type LocationMapEditorMode,
  type LocationMapPaintState,
} from '@/features/content/locations/domain/authoring/editor';
import type { LocationEdgeFeatureKindId } from '@/features/content/locations/domain/model/map/locationEdgeFeature.types';
import type { LocationContentItem } from '@/features/content/locations/domain/repo/locationRepo';
import { parseGridCellId } from '@/shared/domain/grid/gridCellIds';
import { getNeighborPoints } from '@/shared/domain/grid/gridHelpers';
import { GRID_SIZE_PRESETS } from '@/shared/domain/grid/gridPresets';
import {
  shouldAutoSwitchRailToMapForMode,
  selectedCellIdForMapSelection,
  INITIAL_LOCATION_GRID_DRAFT,
  gridDraftPersistableEquals,
  type LocationCellObjectDraft,
  type LocationGridDraftState,
  type LocationEditorRailSection,
} from '@/features/content/locations/components';

import { useLocationMapHydration } from './useLocationMapHydration';
import { useLocationEditSaveActions } from './useLocationEditSaveActions';
import { serializeLocationWorkspacePersistableSnapshot } from './workspacePersistableSnapshot';
import type { LocationWorkspaceAuthoringContract } from './locationWorkspaceAuthoringContract';
import {
  buildHomebrewLocationWorkspaceAuthoringContract,
  buildSystemLocationWorkspaceAuthoringContract,
} from './locationWorkspaceAuthoringAdapters';
import {
  applyDeleteForMapSelection,
  applyRemoveEdgeFromDraft,
  applyRemoveEdgeRunFromDraft,
  applyRemovePathFromDraft,
  applyRemoveRegionFromDraft,
} from './mapSessionDraft.helpers';
import { useLocationEditBuildingStairHandlers } from './useLocationEditBuildingStairHandlers';

export type UseLocationEditWorkspaceModelParams = {
  locationId: string | undefined;
  loc: LocationContentItem | null;
};

export function useLocationEditWorkspaceModel({
  locationId,
  loc,
}: UseLocationEditWorkspaceModelParams) {
  const navigate = useNavigate();
  const { campaignId, campaign } = useActiveCampaign();
  const { approvedCharacters: policyCharacters } = useCampaignMembers();
  const { characters: characterPickerSource } = useCharacters({ type: 'all' });

  const viewer = campaign?.viewer;
  const canDelete = Boolean(
    locationId && campaignId && (viewer?.isPlatformAdmin || viewer?.isOwner),
  );

  const methods = useForm<LocationFormValues>({
    defaultValues: LOCATION_FORM_DEFAULTS,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });
  const {
    reset,
    setValue,
    watch,
    getValues,
    handleSubmit,
  } = methods;

  const {
    saving,
    success,
    errors,
    setSaving,
    setSuccess,
    setErrors,
    clearFeedback,
  } = useEditRouteFeedbackState();

  const [gridDraft, setGridDraft] = useState<LocationGridDraftState>(
    INITIAL_LOCATION_GRID_DRAFT,
  );
  const gridDraftRef = useRef(gridDraft);
  useLayoutEffect(() => {
    gridDraftRef.current = gridDraft;
  }, [gridDraft]);
  const [gridDraftBaseline, setGridDraftBaseline] = useState<LocationGridDraftState>(() =>
    structuredClone(INITIAL_LOCATION_GRID_DRAFT),
  );
  const [workspacePersistBaseline, setWorkspacePersistBaseline] = useState<string | null>(null);
  const isGridDraftDirty = useMemo(
    () => !gridDraftPersistableEquals(gridDraft, gridDraftBaseline),
    [gridDraft, gridDraftBaseline],
  );
  const [railSection, setRailSection] = useState<LocationEditorRailSection>('location');
  const [rightRailOpen, setRightRailOpen] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeFloorId, setActiveFloorId] = useState<string | null>(null);
  const [locationListRefreshKey, setLocationListRefreshKey] = useState(0);
  const [buildingStairConnections, setBuildingStairConnections] = useState<LocationVerticalStairConnection[]>([]);
  const buildingStairConnectionsRef = useRef<LocationVerticalStairConnection[]>([]);
  buildingStairConnectionsRef.current = buildingStairConnections;

  const { zoom, zoomControlProps, wheelContainerRef, bindResetPan } = useCanvasZoom();
  const { pan, isDragging, consumeClickSuppressionAfterPan, pointerHandlers, resetPan } = useCanvasPan();
  useEffect(() => {
    bindResetPan(resetPan);
  }, [bindResetPan, resetPan]);

  const isSystem = loc?.source === 'system';
  const isCampaign = loc?.source === 'campaign';
  const isBuildingWorkspace = Boolean(
    loc && loc.source === 'campaign' && loc.scale === 'building',
  );

  const {
    initialPatch,
    setInitialPatch,
    hasExistingPatch,
    onPatchChange,
  } = useSystemEntryPatchState(
    campaignId ?? undefined,
    locationId,
    loc,
    !!isSystem,
    'locations',
  );

  useCampaignEntryFormReset(loc, isCampaign ?? false, reset, locationToFormValues);
  useResetEditFeedbackOnChange(watch, clearFeedback);

  const watchedScale = watch('scale');
  const watchedBuildingPrimaryType = watch('buildingPrimaryType');
  const scaleForFormRules =
    (loc?.source === 'system' && loc ? loc.scale : undefined) ??
    (String(watchedScale ?? '').trim() !== '' ? watchedScale : undefined) ??
    (loc?.source === 'campaign' && loc ? loc.scale : undefined) ??
    '';

  const {
    campaignHasWorldLocation,
    parentLocationOptions,
    locations,
  } = useLocationFormCampaignData(
    campaignId ?? undefined,
    scaleForFormRules,
    locationId,
    locationListRefreshKey,
  );

  const floorChildren = useMemo(() => {
    if (!locationId || !loc || loc.source !== 'campaign' || loc.scale !== 'building') {
      return [];
    }
    return listFloorChildren(locations, locationId);
  }, [locations, locationId, loc]);

  useEffect(() => {
    if (!isBuildingWorkspace) return;
    if (floorChildren.length === 0) {
      setActiveFloorId(null);
      return;
    }
    setActiveFloorId((prev) => {
      if (prev && floorChildren.some((f) => f.id === prev)) return prev;
      return floorChildren[0].id;
    });
  }, [isBuildingWorkspace, floorChildren]);

  useEffect(() => {
    if (!loc || loc.source !== 'campaign' || loc.scale !== 'building') {
      setBuildingStairConnections([]);
      return;
    }
    setBuildingStairConnections(loc.buildingProfile?.stairConnections ?? []);
  }, [loc]);

  const mapAuthoringScaleForUi = isBuildingWorkspace ? 'floor' : scaleForFormRules;

  const locationUiPolicy = useMemo(
    () =>
      applyScaleToLocationFormUiPolicy(
        buildLocationFormUiPolicy('edit', campaignHasWorldLocation),
        scaleForFormRules,
      ),
    [campaignHasWorldLocation, scaleForFormRules],
  );

  const gridCellUnitOptions = useMemo(
    () => getAllowedCellUnitOptionsForScale(mapAuthoringScaleForUi),
    [mapAuthoringScaleForUi],
  );
  const buildingSubtypeSelectOptions = useMemo(
    () => buildBuildingSubtypeSelectOptions(watchedBuildingPrimaryType),
    [watchedBuildingPrimaryType],
  );
  const buildingProfileEntityPickerOptions = useMemo(
    () => buildCharacterEntityPickerOptions(characterPickerSource),
    [characterPickerSource],
  );

  useLocationFormDependentFieldEffects(
    scaleForFormRules,
    locations,
    locationId,
    getValues,
    setValue,
    true,
    watchedBuildingPrimaryType,
  );

  const gridPreset = watch('gridPreset');
  const gridColumns = watch('gridColumns');
  const gridRows = watch('gridRows');
  const gridGeometry =
    watch('gridGeometry') || getDefaultGeometryForScale(mapAuthoringScaleForUi);

  useEffect(() => {
    const cols = Number(gridColumns);
    const rows = Number(gridRows);
    const valid =
      Number.isInteger(cols) && cols > 0 && Number.isInteger(rows) && rows > 0;
    if (!valid) {
      setGridDraft(INITIAL_LOCATION_GRID_DRAFT);
      setGridDraftBaseline(structuredClone(INITIAL_LOCATION_GRID_DRAFT));
      setWorkspacePersistBaseline(
        serializeLocationWorkspacePersistableSnapshot(
          getValues(),
          INITIAL_LOCATION_GRID_DRAFT,
          buildingStairConnectionsRef.current,
          loc,
        ),
      );
    }
  }, [gridColumns, gridRows, getValues, loc]);

  useEffect(() => {
    if (!gridPreset) return;
    const p = GRID_SIZE_PRESETS[gridPreset as keyof typeof GRID_SIZE_PRESETS];
    if (p) {
      setValue('gridColumns', String(p.columns));
      setValue('gridRows', String(p.rows));
    }
  }, [gridPreset, setValue]);

  useLocationMapHydration({
    campaignId,
    locationId,
    loc,
    activeFloorId,
    setValue,
    getValues,
    setGridDraft,
    setGridDraftBaseline,
    buildingStairConnectionsRef,
    setWorkspacePersistBaseline,
  });

  const watchAll = watch();

  const fieldConfigs = useMemo(
    () =>
      getLocationFieldConfigs({
        policyCharacters,
        parentLocationOptions,
        buildingSubtypeSelectOptions,
        buildingProfileEntityPickerOptions,
        gridCellUnitOptions,
        includeGridBootstrap: Boolean(
          loc &&
            loc.source === 'campaign' &&
            (!isBuildingWorkspace || Boolean(activeFloorId)),
        ),
        locationUiPolicy,
      }),
    [
      policyCharacters,
      parentLocationOptions,
      buildingSubtypeSelectOptions,
      buildingProfileEntityPickerOptions,
      gridCellUnitOptions,
      loc,
      locationUiPolicy,
      isBuildingWorkspace,
      activeFloorId,
    ],
  );

  const showMapGridAuthoring = isBuildingWorkspace
    ? Boolean(activeFloorId)
    : isLocationScaleSelected(watchedScale);

  const mapHostScaleResolved = useMemo((): LocationScaleId => {
    if (isBuildingWorkspace) return 'floor';
    if (loc?.scale === 'building') return 'floor';
    const raw = (String(scaleForFormRules || '').trim() || 'world') as LocationScaleId;
    if (raw === 'building') return 'floor';
    return raw;
  }, [isBuildingWorkspace, loc?.scale, scaleForFormRules]);

  const mapHostLocationIdResolved = useMemo(() => {
    if (isBuildingWorkspace) return activeFloorId ?? '';
    return locationId ?? '';
  }, [isBuildingWorkspace, activeFloorId, locationId]);

  const mapEditor = useLocationMapEditorState();
  const { setMode: setMapEditorMode } = mapEditor;

  const handlePaintChange = useCallback(
    (next: LocationMapPaintState) => {
      mapEditor.setActivePaint(next);
      if (shouldSwitchRailToMapForPaintDomain(next.domain)) {
        setRailSection('map');
      }
    },
    [mapEditor.setActivePaint, setRailSection],
  );

  const handleUpdateRegionEntry = useCallback(
    (
      regionId: string,
      patch: Partial<Pick<LocationMapRegionAuthoringEntry, 'name' | 'description' | 'colorKey'>>,
    ) => {
      setGridDraft((prev) => {
        const cur = prev.regionEntries.find((r) => r.id === regionId);
        if (!cur) return prev;
        return {
          ...prev,
          regionEntries: upsertRegionEntry(prev.regionEntries, { ...cur, ...patch }),
        };
      });
    },
    [],
  );

  const handleCreateRegionPaint = useCallback(() => {
    const id = crypto.randomUUID();
    const colorKey = LOCATION_MAP_REGION_COLOR_KEYS[0];
    const name = LOCATION_MAP_DEFAULT_REGION_NAME;
    setGridDraft((prev) => ({
      ...prev,
      regionEntries: upsertRegionEntry(prev.regionEntries, { id, colorKey, name }),
    }));
    mapEditor.setActivePaint((p) => (p ? { ...p, domain: 'region', activeRegionId: id } : p));
    setRailSection('map');
  }, [mapEditor.setActivePaint, setRailSection]);

  const handleSelectActiveRegionPaint = useCallback(
    (regionId: string) => {
      mapEditor.setActivePaint((p) => {
        if (!p) return p;
        const trimmed = regionId.trim();
        return {
          ...p,
          domain: 'region',
          activeRegionId: trimmed === '' ? null : trimmed,
        };
      });
      setRailSection('map');
    },
    [mapEditor.setActivePaint, setRailSection],
  );

  const handleActiveRegionColorKeyChange = useCallback(
    (colorKey: LocationMapRegionColorKey) => {
      const id = mapEditor.activePaint?.activeRegionId?.trim();
      if (!id) return;
      setGridDraft((prev) => {
        const cur = prev.regionEntries.find((r) => r.id === id);
        if (!cur) return prev;
        return {
          ...prev,
          regionEntries: upsertRegionEntry(prev.regionEntries, { ...cur, colorKey }),
        };
      });
    },
    [mapEditor.activePaint?.activeRegionId],
  );

  const handleEditRegionInSelection = useCallback(() => {
    const id = mapEditor.activePaint?.activeRegionId?.trim();
    if (!id) return;
    const ms = { type: 'region' as const, regionId: id };
    setGridDraft((prev) => ({
      ...prev,
      mapSelection: ms,
      selectedCellId: selectedCellIdForMapSelection(ms),
    }));
    setRailSection('selection');
  }, [mapEditor.activePaint?.activeRegionId]);

  useEffect(() => {
    const p = mapEditor.activePaint;
    if (!p || p.domain !== 'region' || !p.activeRegionId?.trim()) return;
    const id = p.activeRegionId.trim();
    const ok = gridDraft.regionEntries.some((r) => r.id === id);
    if (!ok) {
      mapEditor.setActivePaint({ ...p, activeRegionId: null });
    }
  }, [gridDraft.regionEntries, mapEditor.activePaint, mapEditor.setActivePaint]);

  const handleMapEditorModeChange = useCallback(
    (mode: LocationMapEditorMode) => {
      setMapEditorMode(mode);
      if (shouldAutoSwitchRailToMapForMode(mode)) {
        setRailSection('map');
      }
    },
    [setMapEditorMode],
  );

  const focusSelectionRailSection = useCallback(() => {
    setRailSection('selection');
  }, []);

  const paintPaletteSections = useMemo(
    () => getPaintPaletteSectionsForScale(mapHostScaleResolved),
    [mapHostScaleResolved],
  );

  const placePaletteItems = useMemo(
    () => getPlacePaletteItemsForScale(mapHostScaleResolved),
    [mapHostScaleResolved],
  );

  const drawPaletteItems = useMemo(() => {
    const all = getGroupedDrawPaletteForScale(mapHostScaleResolved);
    if (gridGeometry === 'hex') {
      return all.filter((i) => i.category === 'path');
    }
    return all;
  }, [mapHostScaleResolved, gridGeometry]);

  const mapPlaceSuppressesCanvasPanOnCells =
    mapEditor.mode === 'place' ||
    (mapEditor.mode === 'draw' && mapEditor.activeDraw?.category === 'path') ||
    (mapEditor.mode === 'paint' &&
      mapEditor.activePaint != null &&
      canApplyRegionPaint(mapEditor.activePaint, gridDraft.regionEntries));

  const mapPlaceObjectDragStrokeEnabled =
    mapEditor.mode === 'place' &&
    mapEditor.activePlace?.category === 'map-object' &&
    getPlacementModeForFamily(mapEditor.activePlace.kind) === 'cell';

  const placeEdgeAuthoringActive = useMemo(() => {
    if (mapEditor.mode !== 'place') return false;
    if (gridGeometry === 'hex') return false;
    const ap = mapEditor.activePlace;
    if (!ap || ap.category !== 'map-object') return false;
    if (getPlacementModeForFamily(ap.kind) !== 'edge') return false;
    return resolvePlacementEdgeFeatureKind(ap, mapHostScaleResolved) != null;
  }, [mapEditor.mode, mapEditor.activePlace, gridGeometry, mapHostScaleResolved]);

  const placeEdgeFeatureKind = useMemo((): LocationEdgeFeatureKindId | null => {
    if (!placeEdgeAuthoringActive || !mapEditor.activePlace || mapEditor.activePlace.category !== 'map-object') {
      return null;
    }
    return resolvePlacementEdgeFeatureKind(mapEditor.activePlace, mapHostScaleResolved);
  }, [placeEdgeAuthoringActive, mapEditor.activePlace, mapHostScaleResolved]);

  useEffect(() => {
    mapEditor.setPathAnchorCellId(null);
  }, [gridColumns, gridRows, mapEditor.setPathAnchorCellId]);

  useEffect(() => {
    if (mapEditor.mode !== 'draw') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      mapEditor.setPathAnchorCellId(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mapEditor.mode, mapEditor.setPathAnchorCellId]);

  /** Hex maps do not support edge tools/selection; clear stale edge draw + selection (data preserved). */
  useEffect(() => {
    if (gridGeometry !== 'hex') return;
    const draft = gridDraftRef.current;
    const { draftPatch, clearActiveDrawEdge } = computeHexEdgeConstraintPatch(
      gridGeometry,
      draft.mapSelection,
      mapEditor.activeDraw,
    );
    if (clearActiveDrawEdge) {
      mapEditor.setActiveDraw(null);
    }
    if (draftPatch) {
      setGridDraft((prev) => ({ ...prev, ...draftPatch }));
    }
  }, [gridGeometry, mapEditor.activeDraw, mapEditor.setActiveDraw]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      const t = e.target;
      if (t instanceof HTMLElement) {
        if (t.closest('input, textarea, select, [contenteditable="true"]')) return;
      }
      if (mapEditor.mode !== 'select') return;
      const next = applyDeleteForMapSelection(gridDraftRef.current);
      if (!next) return;
      e.preventDefault();
      setGridDraft(next);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mapEditor.mode]);

  const showMapEditorChrome = showMapGridAuthoring;

  const leftMapChromeWidthPx = useMemo(
    () => resolveLeftMapChromeWidthPx({ showMapEditorChrome }),
    [showMapEditorChrome],
  );

  const { policyValue, handlePolicyChange } = useAccessPolicyField<LocationFormValues>(watch, setValue);

  const driver = usePatchDriverState(
    loc ? (loc as unknown as Record<string, unknown>) : null,
    initialPatch,
    onPatchChange,
    clearFeedback,
  );

  const validationApiRef = useRef<{ validateAll: () => boolean } | null>(null);

  /** Region metadata (and future debounced persistable fields) register `flush` here for Save / boundaries. */
  const flushDebouncedPersistableFieldsRef = useRef<(() => void) | null>(null);

  const authoringContract = useMemo((): LocationWorkspaceAuthoringContract | null => {
    if (!loc) return null;
    if (loc.source === 'system') {
      if (!driver) return null;
      return buildSystemLocationWorkspaceAuthoringContract({
        isPatchDriverDirty: driver.isDirty(),
        isGridDraftDirty,
        patchDocument: driver.getPatch(),
        patchBaseline: initialPatch,
        gridDraft,
        gridDraftBaseline,
        validationApiRef,
      });
    }
    if (loc.source === 'campaign') {
      return buildHomebrewLocationWorkspaceAuthoringContract({
        loc,
        activeFloorId,
        values: watchAll,
        gridDraft,
        buildingStairConnections,
        workspacePersistBaseline,
      });
    }
    return null;
  }, [
    loc,
    driver,
    initialPatch,
    isGridDraftDirty,
    gridDraft,
    gridDraftBaseline,
    validationApiRef,
    activeFloorId,
    watchAll,
    buildingStairConnections,
    workspacePersistBaseline,
  ]);

  const isWorkspaceDirty = Boolean(
    authoringContract?.mode === 'homebrew' && authoringContract.isDirty,
  );

  const homebrewWorkspaceSaveBlockReason =
    authoringContract?.mode === 'homebrew' ? authoringContract.saveBlockReason : null;

  const homebrewWorkspaceCanSave = homebrewWorkspaceSaveBlockReason === null;

  const saveActions = useLocationEditSaveActions({
    campaignId,
    locationId,
    loc,
    activeFloorId,
    locations,
    gridDraftRef,
    setGridDraftBaseline,
    reset,
    getValues,
    handleSubmit,
    feedback: { setSaving, setSuccess, setErrors },
    driver,
    setInitialPatch,
    validationApiRef,
    floorChildren,
    onFloorCreated: () => setLocationListRefreshKey((k) => k + 1),
    setActiveFloorId,
    buildingStairConnectionsRef,
    setBuildingStairConnections,
    setWorkspacePersistBaseline,
  });

  const {
    addingFloor,
    handleHomebrewSubmit,
    handleHomebrewFormSaveClick,
    handleAddFloor,
    handlePatchSave,
    handleRemovePatch,
  } = saveActions;

  const handleDelete = useEntryDeleteAction({
    campaignId: campaignId ?? undefined,
    entryId: locationId,
    deleteEntry: (cid, eid) => locationRepo.deleteEntry(cid, eid).then(() => {}),
    navigate,
    backPath: `/campaigns/${campaignId}/world/locations`,
  });

  const handleValidateDelete = useCallback(async () => {
    if (!campaignId || !locationId) return { allowed: true as const };
    return validateLocationChange({ campaignId, locationId, mode: 'delete' });
  }, [campaignId, locationId]);

  /**
   * Header Delete: with Select tool + map entity selected, remove it from the draft.
   * Otherwise validate and open delete-location confirmation.
   */
  const handleRequestDelete = useCallback(async () => {
    if (mapEditor.mode === 'select') {
      const next = applyDeleteForMapSelection(gridDraft);
      if (next) {
        setGridDraft(next);
        return;
      }
    }
    const result = await handleValidateDelete();
    if (result.allowed) setDeleteConfirmOpen(true);
  }, [mapEditor.mode, gridDraft, handleValidateDelete]);

  const handleBack = useCallback(
    () => navigate(`/campaigns/${campaignId}/world/locations`),
    [navigate, campaignId],
  );

  const handleUpdateLinkedLocation = useCallback(
    (cellId: string, linkedId: string | undefined) => {
      setGridDraft((prev) => {
        const nextLinks = { ...prev.linkedLocationByCellId };
        if (linkedId) nextLinks[cellId] = linkedId;
        else delete nextLinks[cellId];
        return { ...prev, linkedLocationByCellId: nextLinks };
      });
    },
    [],
  );

  const handleUpdateCellObjects = useCallback(
    (cellId: string, objects: LocationCellObjectDraft[]) => {
      setGridDraft((prev) => {
        const next = { ...prev.objectsByCellId };
        if (objects.length === 0) delete next[cellId];
        else next[cellId] = objects;
        return { ...prev, objectsByCellId: next };
      });
    },
    [],
  );

  const handleEraseCell = useCallback(
    (cellId: string) => {
      const cols = Number(gridColumns);
      const rows = Number(gridRows);
      const skipEdgeTargets = gridGeometry === 'hex';
      setGridDraft((prev) => {
        const target = resolveEraseTargetAtCell(cellId, prev, cols, rows, {
          skipEdgeTargets,
        });
        if (!target) return prev;
        return applyEraseTargetToDraft(prev, target, cellId, () => crypto.randomUUID());
      });
    },
    [gridColumns, gridRows, gridGeometry],
  );

  const {
    handleRemovePlacedObject,
    handleLinkStairPair,
    handleUnlinkStairEndpoint,
  } = useLocationEditBuildingStairHandlers({
    campaignId: campaignId ?? undefined,
    isBuildingWorkspace,
    activeFloorId,
    locationId,
    loc,
    floorChildren,
    buildingStairConnections,
    setBuildingStairConnections,
    setGridDraft,
  });

  const handleRemovePathFromMap = useCallback((pathId: string) => {
    setGridDraft((prev) => applyRemovePathFromDraft(prev, pathId));
  }, []);

  const handleRemoveEdgeFromMap = useCallback((edgeId: string) => {
    setGridDraft((prev) => applyRemoveEdgeFromDraft(prev, edgeId));
  }, []);

  const handleRemoveEdgeRunFromMap = useCallback((edgeIds: readonly string[]) => {
    setGridDraft((prev) => applyRemoveEdgeRunFromDraft(prev, edgeIds));
  }, []);

  const handleRemoveRegionFromMap = useCallback((regionId: string) => {
    setGridDraft((prev) => applyRemoveRegionFromDraft(prev, regionId));
  }, []);

  const handleAuthoringCellClick = useCallback(
    (cellId: string) => {
      if (mapEditor.mode === 'place' && mapEditor.activePlace) {
        if (
          mapEditor.activePlace.category === 'map-object' &&
          getPlacementModeForFamily(mapEditor.activePlace.kind) === 'edge'
        ) {
          return;
        }
        const outcome = resolvePlacementCellClick(mapEditor.activePlace, cellId, mapHostScaleResolved);
        if (outcome.kind === 'unsupported') return;
        if (outcome.kind === 'append-object') {
          setGridDraft((prev) => {
            const existing = prev.objectsByCellId[outcome.cellId] ?? [];
            const obj: (typeof existing)[number] = {
              id: crypto.randomUUID(),
              ...outcome.objectDraft,
            };
            return {
              ...prev,
              objectsByCellId: {
                ...prev.objectsByCellId,
                [outcome.cellId]: [...existing, obj],
              },
            };
          });
        }
        return;
      }

      if (mapEditor.mode === 'draw' && mapEditor.activeDraw?.category === 'path') {
        const res = resolveDrawSelectionToAction(mapEditor.activeDraw);
        if (res.type !== 'path') return;
        const anchor = mapEditor.pathAnchorCellId;
        if (!anchor) {
          mapEditor.setPathAnchorCellId(cellId);
          return;
        }
        if (anchor === cellId) {
          mapEditor.setPathAnchorCellId(null);
          return;
        }
        const pa = parseGridCellId(anchor);
        const pb = parseGridCellId(cellId);
        if (!pa || !pb) {
          mapEditor.setPathAnchorCellId(cellId);
          return;
        }
        const geom = (gridGeometry === 'hex' ? 'hex' : 'square') as 'square' | 'hex';
        const neighbors = getNeighborPoints(
          { geometry: geom, columns: Number(gridColumns), rows: Number(gridRows) },
          pa,
        );
        if (!neighbors.some((n) => n.x === pb.x && n.y === pb.y)) {
          mapEditor.setPathAnchorCellId(cellId);
          return;
        }
        setGridDraft((prev) => {
          const pathKind = res.pathKind;
          const candidates = prev.pathEntries.filter((p) => p.kind === pathKind);
          let extendId: string | undefined;
          for (let i = candidates.length - 1; i >= 0; i--) {
            const p = candidates[i];
            if (p.cellIds[p.cellIds.length - 1]?.trim() === anchor.trim()) {
              extendId = p.id;
              break;
            }
          }
          if (extendId) {
            return {
              ...prev,
              pathEntries: prev.pathEntries.map((p) =>
                p.id === extendId ? { ...p, cellIds: [...p.cellIds, cellId] } : p,
              ),
            };
          }
          return {
            ...prev,
            pathEntries: [
              ...prev.pathEntries,
              {
                id: crypto.randomUUID(),
                kind: pathKind,
                cellIds: [anchor, cellId],
              },
            ],
          };
        });
        mapEditor.setPathAnchorCellId(cellId);
      }
    },
    [
      mapEditor.mode,
      mapEditor.activePlace,
      mapEditor.activeDraw,
      mapHostScaleResolved,
      mapEditor.pathAnchorCellId,
      mapEditor.setPathAnchorCellId,
      gridGeometry,
      gridColumns,
      gridRows,
    ],
  );

  const handleEdgeStrokeCommit = useCallback(
    (edgeIds: string[], edgeKind: LocationEdgeFeatureKindId) => {
      if (edgeIds.length === 0) return;
      let enriched: { authoredPlaceKindId: string; variantId: string } | undefined;
      if (placeEdgeAuthoringActive && mapEditor.activePlace) {
        const res = resolvePlacedKindToAction(mapEditor.activePlace, mapHostScaleResolved);
        if (res.type === 'edge') {
          enriched = { authoredPlaceKindId: res.placedKind, variantId: res.variantId };
        }
      }
      setGridDraft((prev) => ({
        ...prev,
        edgeEntries: applyEdgeStrokeToDraft(prev.edgeEntries, edgeIds, edgeKind, enriched),
      }));
    },
    [placeEdgeAuthoringActive, mapEditor.activePlace, mapHostScaleResolved],
  );

  const handleEraseEdge = useCallback((edgeId: string) => {
    setGridDraft((prev) => ({
      ...prev,
      edgeEntries: prev.edgeEntries.filter((e) => e.edgeId !== edgeId),
    }));
  }, []);

  const handlePatchEdgeEntry = useCallback(
    (edgeId: string, patch: Partial<Pick<LocationMapEdgeAuthoringEntry, 'label'>>) => {
      setGridDraft((prev) => ({
        ...prev,
        edgeEntries: prev.edgeEntries.map((e) => (e.edgeId === edgeId ? { ...e, ...patch } : e)),
      }));
    },
    [],
  );

  return {
    campaignId,
    locationId,
    loc,
    canDelete,
    methods,
    saving,
    success,
    errors,
    isWorkspaceDirty,
    homebrewWorkspaceCanSave,
    homebrewWorkspaceSaveBlockReason,
    authoringContract,
    gridDraft,
    setGridDraft,
    isGridDraftDirty,
    railSection,
    setRailSection,
    rightRailOpen,
    setRightRailOpen,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    deleting,
    setDeleting,
    activeFloorId,
    setActiveFloorId,
    addingFloor,
    zoom,
    zoomControlProps,
    wheelContainerRef,
    pan,
    isDragging,
    consumeClickSuppressionAfterPan,
    pointerHandlers,
    isSystem,
    isBuildingWorkspace,
    floorChildren,
    watchedScale,
    scaleForFormRules,
    fieldConfigs,
    showMapGridAuthoring,
    mapHostScaleResolved,
    mapHostLocationIdResolved,
    mapEditor,
    handlePaintChange,
    handleUpdateRegionEntry,
    handleCreateRegionPaint,
    handleSelectActiveRegionPaint,
    handleActiveRegionColorKeyChange,
    handleEditRegionInSelection,
    handleMapEditorModeChange,
    focusSelectionRailSection,
    paintPaletteSections,
    placePaletteItems,
    drawPaletteItems,
    mapPlaceSuppressesCanvasPanOnCells,
    mapPlaceObjectDragStrokeEnabled,
    placeEdgeAuthoringActive,
    placeEdgeFeatureKind,
    showMapEditorChrome,
    leftMapChromeWidthPx,
    policyValue,
    handlePolicyChange,
    policyCharacters,
    driver,
    validationApiRef,
    flushDebouncedPersistableFieldsRef,
    hasExistingPatch,
    handleHomebrewSubmit,
    handleHomebrewFormSaveClick,
    handleAddFloor,
    handlePatchSave,
    handleRemovePatch,
    handleDelete,
    handleValidateDelete,
    handleRequestDelete,
    handleBack,
    handleUpdateLinkedLocation,
    handleUpdateCellObjects,
    handleEraseCell,
    handleRemovePlacedObject,
    handleRemovePathFromMap,
    handleRemoveEdgeFromMap,
    handleRemoveEdgeRunFromMap,
    handleRemoveRegionFromMap,
    handlePatchEdgeEntry,
    handleAuthoringCellClick,
    handleEdgeStrokeCommit,
    handleEraseEdge,
    gridColumns,
    gridRows,
    gridGeometry,
    locations,
    buildingStairConnections,
    handleLinkStairPair,
    handleUnlinkStairEndpoint,
  };
}

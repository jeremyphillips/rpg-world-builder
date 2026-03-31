import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FormProvider, useForm } from 'react-hook-form';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { useCharacters } from '@/features/character/hooks/useCharacters';
import { useCampaignMembers } from '@/features/campaign/hooks';
import { useCanvasZoom, useCanvasPan } from '@/ui/hooks';
import {
  locationRepo,
  validateLocationChange,
  type LocationContentItem,
  type LocationFormValues,
  type LocationInput,
  getLocationFieldConfigs,
  LOCATION_FORM_DEFAULTS,
  locationToFormValues,
  toLocationInput,
  buildBuildingSubtypeSelectOptions,
  buildCharacterEntityPickerOptions,
  listLocationMaps,
  validateGridBootstrap,
  bootstrapDefaultLocationMap,
  cellDraftToCellEntries,
  cellEntriesToDraft,
  pickMapGridFormValues,
  applyScaleToLocationFormUiPolicy,
  buildLocationFormUiPolicy,
  getAllowedCellUnitOptionsForScale,
  getDefaultGeometryForScale,
  getDefaultCellUnitForScale,
  isLocationScaleSelected,
  listFloorChildren,
  nextSortOrder,
  useLocationFormCampaignData,
  useLocationFormDependentFieldEffects,
  getGroupedPlacePaletteForScale,
  getPaintPaletteItemsForScale,
  resolvePlacedKindToAction,
  resolveEraseTargetAtCell,
  useLocationMapEditorState,
} from '@/features/content/locations/domain';
import { useCampaignContentEntry } from '@/features/content/shared/hooks/useCampaignContentEntry';
import { ConditionalFormRenderer, ConfirmModal, VisibilityField } from '@/ui/patterns';
import { AppAlert, AppBadge } from '@/ui/primitives';
import { useEditRouteFeedbackState } from '@/features/content/shared/hooks/useEditRouteFeedbackState';
import { useResetEditFeedbackOnChange } from '@/features/content/shared/hooks/useResetEditFeedbackOnChange';
import { useCampaignEntryFormReset } from '@/features/content/shared/hooks/useCampaignEntryFormReset';
import { useSystemEntryPatchState } from '@/features/content/shared/hooks/useSystemEntryPatchState';
import { useAccessPolicyField } from '@/features/content/shared/hooks/useAccessPolicyField';
import { usePatchDriverState } from '@/features/content/shared/hooks/usePatchDriverState';
import { useSystemPatchActions } from '@/features/content/shared/hooks/useSystemPatchActions';
import { useEntryDeleteAction } from '@/features/content/shared/hooks/useEntryDeleteAction';
import {
  canPlaceObjectKindOnHostScale,
  getAllowedLinkedLocationOptions,
  normalizePathSegmentEndpoints,
  type LocationScaleId,
} from '@/shared/domain/locations';
import { makeUndirectedSquareEdgeKey } from '@/shared/domain/grid/gridEdgeIds';
import { parseGridCellId } from '@/shared/domain/grid/gridCellIds';
import { GRID_SIZE_PRESETS } from '@/shared/domain/grid/gridPresets';
import {
  LocationGridAuthoringSection,
  LocationCellAuthoringPanel,
  LocationEditorWorkspace,
  LocationEditorHeader,
  LocationEditorCanvas,
  LocationEditorRightRail,
  LocationEditorMapRailTabs,
  LocationAncestryBreadcrumbs,
  BuildingFloorStrip,
  INITIAL_LOCATION_GRID_DRAFT,
  gridDraftPersistableEquals,
  LocationMapEditorLinkedLocationModal,
  LocationMapEditorPaintTray,
  LocationMapEditorPlacePanel,
  LocationMapEditorToolbar,
  LOCATION_EDITOR_PAINT_TRAY_WIDTH_PX,
  LOCATION_EDITOR_TOOLBAR_WIDTH_PX,
  type LocationCellObjectDraft,
  type LocationGridDraftState,
} from '@/features/content/locations/components';

const FORM_ID = 'location-edit-form';

export default function LocationEditRoute() {
  const { campaignId, campaign } = useActiveCampaign();
  const { locationId } = useParams<{ locationId: string }>();
  const navigate = useNavigate();
  const { approvedCharacters: policyCharacters } = useCampaignMembers();
  const { characters: characterPickerSource } = useCharacters({ type: 'all' });

  const viewer = campaign?.viewer;
  const canDelete = Boolean(
    locationId && campaignId && (viewer?.isPlatformAdmin || viewer?.isOwner),
  );

  const { entry: loc, loading, error, notFound } = useCampaignContentEntry<LocationContentItem>({
    campaignId: campaignId ?? undefined,
    entryId: locationId,
    fetchEntry: locationRepo.getEntry,
  });

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
    formState: { isDirty },
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
  /** Last saved / server-hydrated persistable map state (enables Save when only the grid changed). */
  const [gridDraftBaseline, setGridDraftBaseline] = useState<LocationGridDraftState>(() =>
    structuredClone(INITIAL_LOCATION_GRID_DRAFT),
  );
  const isGridDraftDirty = useMemo(
    () => !gridDraftPersistableEquals(gridDraft, gridDraftBaseline),
    [gridDraft, gridDraftBaseline],
  );
  /** 0 = Metadata, 1 = Cell — switched when user selects a map cell */
  const [mapRailTab, setMapRailTab] = useState(0);
  const [rightRailOpen, setRightRailOpen] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeFloorId, setActiveFloorId] = useState<string | null>(null);
  const [addingFloor, setAddingFloor] = useState(false);
  const [locationListRefreshKey, setLocationListRefreshKey] = useState(0);

  const { zoom, zoomControlProps, wheelContainerRef, bindResetPan } = useCanvasZoom();
  const { pan, isDragging, pointerHandlers, resetPan } = useCanvasPan();
  useEffect(() => { bindResetPan(resetPan) }, [bindResetPan, resetPan]);

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
  /** Avoid empty scale before RHF reset: invalid scale uses FALLBACK_POLICY (hideParent) and sanitize clears parentId. */
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
    }
  }, [gridColumns, gridRows]);

  useEffect(() => {
    if (!gridPreset) return;
    const p = GRID_SIZE_PRESETS[gridPreset as keyof typeof GRID_SIZE_PRESETS];
    if (p) {
      setValue('gridColumns', String(p.columns));
      setValue('gridRows', String(p.rows));
    }
  }, [gridPreset, setValue]);

  useEffect(() => {
    if (!campaignId || !locationId || !loc || loc.source !== 'campaign') return;
    if (loc.scale === 'building') return;
    let cancelled = false;
    listLocationMaps(campaignId, locationId)
      .then((maps) => {
        if (cancelled) return;
        const def = maps.find((m) => m.isDefault) ?? maps[0];
        if (def) {
          setValue('gridPreset', '');
          setValue('gridColumns', String(def.grid.width));
          setValue('gridRows', String(def.grid.height));
          setValue('gridCellUnit', String(def.grid.cellUnit));
          setValue('gridGeometry', def.grid.geometry ?? getDefaultGeometryForScale(loc!.scale));
          const next = {
            selectedCellId: null,
            excludedCellIds: def.layout?.excludedCellIds ?? [],
            ...cellEntriesToDraft(def.cellEntries),
            pathSegments: def.pathSegments ?? [],
            edgeFeatures: def.edgeFeatures ?? [],
          };
          setGridDraft(next);
          setGridDraftBaseline(structuredClone(next));
        } else {
          setGridDraft(INITIAL_LOCATION_GRID_DRAFT);
          setGridDraftBaseline(structuredClone(INITIAL_LOCATION_GRID_DRAFT));
        }
      })
      .catch(() => {
        if (cancelled) return;
        setGridDraft(INITIAL_LOCATION_GRID_DRAFT);
        setGridDraftBaseline(structuredClone(INITIAL_LOCATION_GRID_DRAFT));
      });
    return () => {
      cancelled = true;
    };
  }, [campaignId, locationId, loc?.scale, loc?.source, setValue]);

  useEffect(() => {
    if (!campaignId || !locationId || !loc || loc.source !== 'campaign') return;
    if (loc.scale !== 'building') return;
    if (!activeFloorId) {
      setGridDraft(INITIAL_LOCATION_GRID_DRAFT);
      setGridDraftBaseline(structuredClone(INITIAL_LOCATION_GRID_DRAFT));
      return;
    }
    let cancelled = false;
    listLocationMaps(campaignId, activeFloorId)
      .then((maps) => {
        if (cancelled) return;
        const def = maps.find((m) => m.isDefault) ?? maps[0];
        if (def) {
          setValue('gridPreset', '');
          setValue('gridColumns', String(def.grid.width));
          setValue('gridRows', String(def.grid.height));
          setValue('gridCellUnit', String(def.grid.cellUnit));
          setValue('gridGeometry', def.grid.geometry ?? getDefaultGeometryForScale('floor'));
          const next = {
            selectedCellId: null,
            excludedCellIds: def.layout?.excludedCellIds ?? [],
            ...cellEntriesToDraft(def.cellEntries),
            pathSegments: def.pathSegments ?? [],
            edgeFeatures: def.edgeFeatures ?? [],
          };
          setGridDraft(next);
          setGridDraftBaseline(structuredClone(next));
        } else {
          setGridDraft(INITIAL_LOCATION_GRID_DRAFT);
          setGridDraftBaseline(structuredClone(INITIAL_LOCATION_GRID_DRAFT));
        }
      })
      .catch(() => {
        if (cancelled) return;
        setGridDraft(INITIAL_LOCATION_GRID_DRAFT);
        setGridDraftBaseline(structuredClone(INITIAL_LOCATION_GRID_DRAFT));
      });
    return () => {
      cancelled = true;
    };
  }, [campaignId, activeFloorId, locationId, loc?.scale, loc?.source, setValue]);

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

  /**
   * Map vocabulary (paint / place palettes, placement resolver) for the **floor grid**.
   * Building *locations* use `scale: 'building'` on the entity, but authored map content policy
   * lives under `floor` (walls, doors, floor objects). `LOCATION_SCALE_MAP_CONTENT_POLICY.building`
   * is empty — always resolve building maps to `floor` so Place options are not blank.
   */
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

  const paintPaletteItems = useMemo(
    () => getPaintPaletteItemsForScale(mapHostScaleResolved),
    [mapHostScaleResolved],
  );

  const placePaletteItems = useMemo(
    () => getGroupedPlacePaletteForScale(mapHostScaleResolved),
    [mapHostScaleResolved],
  );

  /** Path/link/object placement also needs this: otherwise canvas pan steals pointerdown and clicks often miss cells. */
  const mapPlaceSuppressesCanvasPanOnCells = mapEditor.mode === 'place';

  const mapPlaceObjectDragStrokeEnabled =
    mapEditor.mode === 'place' && mapEditor.activePlace?.category === 'object';

  useEffect(() => {
    mapEditor.setPathAnchorCellId(null);
    mapEditor.setEdgeAnchorCellId(null);
  }, [gridColumns, gridRows, mapEditor.setPathAnchorCellId, mapEditor.setEdgeAnchorCellId]);

  useEffect(() => {
    if (mapEditor.mode !== 'place') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      mapEditor.setPathAnchorCellId(null);
      mapEditor.setEdgeAnchorCellId(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mapEditor.mode, mapEditor.setPathAnchorCellId, mapEditor.setEdgeAnchorCellId]);

  /** Options for the pending linked-location modal (city / building / site per resolver). */
  const linkModalSelectOptions = useMemo(() => {
    if (!campaignId || !loc || loc.source !== 'campaign') return [];
    const p = mapEditor.pendingPlacement;
    if (!p || p.type !== 'linked-location') return [];
    const targetScale = p.linkedScale;
    const campaignLocations = locations.filter((l) => l.source === 'campaign');
    const host = {
      id: mapHostLocationIdResolved || '__host__',
      scale: mapHostScaleResolved,
      name: loc.name,
      source: 'campaign' as const,
      campaignId,
    };
    return getAllowedLinkedLocationOptions(host, campaignLocations, {
      campaignId,
      excludeLocationId: mapHostLocationIdResolved || undefined,
    })
      .filter((l) => l.scale === targetScale)
      .map((l) => ({ value: l.id, label: l.name }));
  }, [
    campaignId,
    loc,
    locations,
    mapHostLocationIdResolved,
    mapHostScaleResolved,
    mapEditor.pendingPlacement,
  ]);

  const showMapEditorChrome = showMapGridAuthoring;

  const leftMapChromeWidthPx = showMapEditorChrome
    ? LOCATION_EDITOR_TOOLBAR_WIDTH_PX +
      (mapEditor.mode === 'paint' ? LOCATION_EDITOR_PAINT_TRAY_WIDTH_PX : 0)
    : 0;

  const { policyValue, handlePolicyChange } = useAccessPolicyField<LocationFormValues>(watch, setValue);

  const driver = usePatchDriverState(
    loc ? (loc as unknown as Record<string, unknown>) : null,
    initialPatch,
    onPatchChange,
    clearFeedback,
  );

  const validationApiRef = useRef<{ validateAll: () => boolean } | null>(null);

  const handleCampaignSubmit = useCallback(
    async (values: LocationFormValues) => {
      if (!campaignId || !locationId || !loc) return;
      if (loc.source === 'campaign' && loc.scale === 'building') {
        if (!activeFloorId) {
          setErrors([
            {
              path: '',
              code: 'VALIDATION',
              message: 'Add a floor before saving.',
            },
          ]);
          return;
        }
        const err = validateGridBootstrap(values);
        if (err) {
          setErrors([{ path: '', code: 'VALIDATION', message: err }]);
          return;
        }
        setSaving(true);
        setSuccess(false);
        setErrors([]);
        try {
          const input = toLocationInput(values);
          const updated = await locationRepo.updateEntry(campaignId, locationId, input);
          const floorName =
            locations.find((l) => l.id === activeFloorId)?.name ?? 'Floor';
          await bootstrapDefaultLocationMap(
            campaignId,
            activeFloorId,
            floorName,
            'floor',
            values,
            {
              excludedCellIds: gridDraft.excludedCellIds,
              cellEntries: cellDraftToCellEntries(
                gridDraft.linkedLocationByCellId,
                gridDraft.objectsByCellId,
                gridDraft.cellFillByCellId,
              ),
              pathSegments: gridDraft.pathSegments.map((s) => {
                const { startCellId, endCellId } = normalizePathSegmentEndpoints(
                  s.startCellId,
                  s.endCellId,
                );
                return { ...s, startCellId, endCellId };
              }),
              edgeFeatures: gridDraft.edgeFeatures,
            },
          );
          reset({
            ...locationToFormValues(updated),
            ...pickMapGridFormValues(values),
          });
          setGridDraftBaseline(structuredClone(gridDraft));
          setSuccess(true);
        } catch (e) {
          setErrors([
            { path: '', code: 'SAVE_FAILED', message: (e as Error).message },
          ]);
        } finally {
          setSaving(false);
        }
        return;
      }
      const err = validateGridBootstrap(values);
      if (err) {
        setErrors([{ path: '', code: 'VALIDATION', message: err }]);
        return;
      }
      setSaving(true);
      setSuccess(false);
      setErrors([]);
      try {
        const input = toLocationInput(values);
        const updated = await locationRepo.updateEntry(campaignId, locationId, input);
        await bootstrapDefaultLocationMap(
          campaignId,
          locationId,
          updated.name,
          updated.scale as LocationScaleId,
          values,
          {
            excludedCellIds: gridDraft.excludedCellIds,
            cellEntries: cellDraftToCellEntries(
              gridDraft.linkedLocationByCellId,
              gridDraft.objectsByCellId,
              gridDraft.cellFillByCellId,
            ),
            pathSegments: gridDraft.pathSegments.map((s) => {
              const { startCellId, endCellId } = normalizePathSegmentEndpoints(
                s.startCellId,
                s.endCellId,
              );
              return { ...s, startCellId, endCellId };
            }),
            edgeFeatures: gridDraft.edgeFeatures,
          },
        );
        reset({
          ...locationToFormValues(updated),
          ...pickMapGridFormValues(values),
        });
        setGridDraftBaseline(structuredClone(gridDraft));
        setSuccess(true);
      } catch (e) {
        setErrors([
          { path: '', code: 'SAVE_FAILED', message: (e as Error).message },
        ]);
      } finally {
        setSaving(false);
      }
    },
    [
      campaignId,
      locationId,
      loc,
      activeFloorId,
      locations,
      reset,
      setSaving,
      setSuccess,
      setErrors,
      gridDraft.excludedCellIds,
      gridDraft.linkedLocationByCellId,
      gridDraft.objectsByCellId,
      gridDraft.cellFillByCellId,
      gridDraft.pathSegments,
      gridDraft.edgeFeatures,
    ],
  );

  const handleCampaignFormSaveClick = useCallback(() => {
    void handleSubmit(handleCampaignSubmit)();
  }, [handleSubmit, handleCampaignSubmit]);

  const handleAddFloor = useCallback(async () => {
    if (!campaignId || !locationId || !loc || loc.source !== 'campaign' || loc.scale !== 'building') {
      return;
    }
    if (addingFloor) return;
    setAddingFloor(true);
    setErrors([]);
    try {
      const sort = nextSortOrder(floorChildren);
      const floorIndex = floorChildren.length + 1;
      const input: LocationInput = {
        name: `Floor ${floorIndex}`,
        scale: 'floor',
        parentId: locationId,
        category: 'interior',
        sortOrder: sort,
      };
      const created = await locationRepo.createEntry(campaignId, input);
      const v = getValues();
      const hasGrid =
        Number(v.gridColumns) > 0 && Number(v.gridRows) > 0;
      const preset = GRID_SIZE_PRESETS.medium;
      const bootstrapValues: LocationFormValues = {
        ...LOCATION_FORM_DEFAULTS,
        ...v,
        name: created.name,
        scale: 'floor',
        parentId: locationId,
        category: 'interior',
        gridPreset: hasGrid ? v.gridPreset : '',
        gridColumns: hasGrid ? v.gridColumns : String(preset.columns),
        gridRows: hasGrid ? v.gridRows : String(preset.rows),
        gridCellUnit: v.gridCellUnit || getDefaultCellUnitForScale('floor'),
        gridGeometry: getDefaultGeometryForScale('floor'),
      };
      await bootstrapDefaultLocationMap(
        campaignId,
        created.id,
        created.name,
        'floor',
        bootstrapValues,
        {
          excludedCellIds: INITIAL_LOCATION_GRID_DRAFT.excludedCellIds,
          cellEntries: cellDraftToCellEntries(
            INITIAL_LOCATION_GRID_DRAFT.linkedLocationByCellId,
            INITIAL_LOCATION_GRID_DRAFT.objectsByCellId,
            INITIAL_LOCATION_GRID_DRAFT.cellFillByCellId,
          ),
          pathSegments: INITIAL_LOCATION_GRID_DRAFT.pathSegments,
          edgeFeatures: INITIAL_LOCATION_GRID_DRAFT.edgeFeatures,
        },
      );
      setLocationListRefreshKey((k) => k + 1);
      setActiveFloorId(created.id);
    } catch (e) {
      setErrors([
        { path: '', code: 'SAVE_FAILED', message: (e as Error).message },
      ]);
    } finally {
      setAddingFloor(false);
    }
  }, [
    campaignId,
    locationId,
    loc,
    addingFloor,
    floorChildren,
    getValues,
    setErrors,
  ]);

  const { savePatch: handlePatchSave, removePatch: handleRemovePatch } =
    useSystemPatchActions({
      campaignId: campaignId ?? undefined,
      entryId: locationId,
      collectionKey: 'locations',
      driver,
      setInitialPatch,
      validationApiRef,
      feedback: { setSaving, setSuccess, setErrors },
    });

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

  const handleBack = useCallback(
    () => navigate(`/campaigns/${campaignId}/world/locations`),
    [navigate, campaignId],
  );

  const handleUpdateLinkedLocation = useCallback(
    (cellId: string, locationId: string | undefined) => {
      setGridDraft((prev) => {
        const nextLinks = { ...prev.linkedLocationByCellId };
        if (locationId) nextLinks[cellId] = locationId;
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
      setGridDraft((prev) => {
        const target = resolveEraseTargetAtCell(cellId, prev, cols, rows);
        if (!target) return prev;
        if (target.type === 'edge') {
          return {
            ...prev,
            edgeFeatures: prev.edgeFeatures.filter((e) => e.id !== target.featureId),
          };
        }
        if (target.type === 'object') {
          const objs = prev.objectsByCellId[target.cellId] ?? [];
          const nextObjs = objs.filter((o) => o.id !== target.objectId);
          const nextMap = { ...prev.objectsByCellId };
          if (nextObjs.length === 0) delete nextMap[target.cellId];
          else nextMap[target.cellId] = nextObjs;
          return { ...prev, objectsByCellId: nextMap };
        }
        if (target.type === 'path') {
          return {
            ...prev,
            pathSegments: prev.pathSegments.filter((s) => s.id !== target.segmentId),
          };
        }
        const nextLinks = { ...prev.linkedLocationByCellId };
        delete nextLinks[target.cellId];
        return { ...prev, linkedLocationByCellId: nextLinks };
      });
    },
    [gridColumns, gridRows],
  );

  const handlePlaceCell = useCallback(
    (cellId: string) => {
      const ap = mapEditor.activePlace;
      if (!ap) return;
      const res = resolvePlacedKindToAction(ap, mapHostScaleResolved);
      if (res.type === 'unsupported') return;
      if (res.type === 'link') {
        mapEditor.setPendingPlacement({
          type: 'linked-location',
          objectKind: res.objectKind,
          hostScale: mapHostScaleResolved,
          linkedScale: res.linkedScale,
          targetCellId: cellId,
        });
        return;
      }
      if (res.type === 'object') {
        if (!canPlaceObjectKindOnHostScale(mapHostScaleResolved, res.objectKind)) return;
        setGridDraft((prev) => {
          const existing = prev.objectsByCellId[cellId] ?? [];
          return {
            ...prev,
            objectsByCellId: {
              ...prev.objectsByCellId,
              [cellId]: [...existing, { id: crypto.randomUUID(), kind: res.objectKind }],
            },
          };
        });
        return;
      }
      if (res.type === 'path') {
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
        if (
          !pa ||
          !pb ||
          Math.abs(pa.x - pb.x) + Math.abs(pa.y - pb.y) !== 1
        ) {
          mapEditor.setPathAnchorCellId(cellId);
          return;
        }
        const { startCellId, endCellId } = normalizePathSegmentEndpoints(anchor, cellId);
        setGridDraft((prev) => ({
          ...prev,
          pathSegments: [
            ...prev.pathSegments,
            {
              id: crypto.randomUUID(),
              kind: res.pathKind,
              startCellId,
              endCellId,
            },
          ],
        }));
        // Clear anchor after each segment (like edges) so the preview stops; place another
        // segment with two fresh clicks. Esc also clears a pending first click.
        mapEditor.setPathAnchorCellId(null);
        return;
      }
      if (res.type === 'edge') {
        const anchor = mapEditor.edgeAnchorCellId;
        if (!anchor) {
          mapEditor.setEdgeAnchorCellId(cellId);
          return;
        }
        if (anchor === cellId) {
          mapEditor.setEdgeAnchorCellId(null);
          return;
        }
        const pa = parseGridCellId(anchor);
        const pb = parseGridCellId(cellId);
        if (
          !pa ||
          !pb ||
          Math.abs(pa.x - pb.x) + Math.abs(pa.y - pb.y) !== 1
        ) {
          mapEditor.setEdgeAnchorCellId(cellId);
          return;
        }
        const edgeId = makeUndirectedSquareEdgeKey(anchor, cellId);
        setGridDraft((prev) => ({
          ...prev,
          edgeFeatures: [
            ...prev.edgeFeatures.filter((e) => e.edgeId !== edgeId),
            {
              id: crypto.randomUUID(),
              kind: res.edgeKind,
              edgeId,
            },
          ],
        }));
        mapEditor.setEdgeAnchorCellId(null);
      }
    },
    [
      mapEditor.activePlace,
      mapEditor.pathAnchorCellId,
      mapEditor.edgeAnchorCellId,
      mapEditor.setPendingPlacement,
      mapEditor.setPathAnchorCellId,
      mapEditor.setEdgeAnchorCellId,
      mapHostScaleResolved,
    ],
  );

  const focusCellRailTab = useCallback(() => setMapRailTab(1), []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (error || notFound || !loc) {
    return <AppAlert tone="danger">{error ?? 'Location not found.'}</AppAlert>;
  }

  const ancestryBreadcrumbs = (
    <LocationAncestryBreadcrumbs
      locations={locations}
      campaignId={campaignId ?? undefined}
      currentLocationId={locationId}
      parentId={loc.parentId}
    />
  );

  const activeFloorName =
    activeFloorId && locations.find((l) => l.id === activeFloorId)?.name;
  const mapHostLocationId = isBuildingWorkspace ? activeFloorId ?? '' : locationId!;
  const mapHostScale = isBuildingWorkspace ? 'floor' : scaleForFormRules;
  const mapHostName = activeFloorName ?? loc.name;
  const buildingNeedsFloor = isBuildingWorkspace && floorChildren.length === 0;

  if (isSystem && driver) {
    return (
      <LocationEditorWorkspace
        header={
          <LocationEditorHeader
            title={`Patch: ${loc.name}`}
            ancestryBreadcrumbs={ancestryBreadcrumbs}
            saving={saving}
            dirty={driver.isDirty() || isGridDraftDirty}
            isNew={false}
            onSave={handlePatchSave}
            onBack={handleBack}
            errors={errors}
            success={success}
            rightRailOpen={rightRailOpen}
            onToggleRightRail={() => setRightRailOpen((o) => !o)}
          />
        }
        canvas={
          <Box
            sx={{
              display: 'flex',
              flex: 1,
              minHeight: 0,
              overflow: 'hidden',
              width: '100%',
            }}
          >
            {showMapEditorChrome && (
              <>
                <LocationMapEditorToolbar
                  mode={mapEditor.mode}
                  onModeChange={mapEditor.setMode}
                />
                {mapEditor.mode === 'paint' && (
                  <LocationMapEditorPaintTray
                    items={paintPaletteItems}
                    activePaint={mapEditor.activePaint}
                    onSelectSwatch={mapEditor.setActivePaint}
                  />
                )}
              </>
            )}
            <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex' }}>
              <LocationEditorCanvas
                zoom={zoom}
                pan={pan}
                panHandlers={pointerHandlers}
                isDragging={isDragging}
                wheelContainerRef={wheelContainerRef}
                zoomControlProps={zoomControlProps}
              >
                {showMapGridAuthoring ? (
                  <LocationGridAuthoringSection
                    gridColumns={gridColumns}
                    gridRows={gridRows}
                    gridGeometry={gridGeometry}
                    draft={gridDraft}
                    setDraft={setGridDraft}
                    locations={locations}
                    campaignId={campaignId ?? undefined}
                    hostLocationId={locationId}
                    hostScale={scaleForFormRules}
                    hostName={loc.name}
                    onCellFocusRail={focusCellRailTab}
                    mapEditorMode={mapEditor.mode}
                    activePaint={mapEditor.activePaint}
                    leftChromeWidthPx={leftMapChromeWidthPx}
                    onPlaceCellClick={handlePlaceCell}
                    onEraseCellClick={handleEraseCell}
                    placePathAnchorCellId={mapEditor.pathAnchorCellId}
                    placeEdgeAnchorCellId={mapEditor.edgeAnchorCellId}
                    suppressCanvasPanOnCells={mapPlaceSuppressesCanvasPanOnCells}
                    placeObjectDragStrokeEnabled={mapPlaceObjectDragStrokeEnabled}
                  />
                ) : null}
              </LocationEditorCanvas>
            </Box>
          </Box>
        }
        rightRail={
          <LocationEditorRightRail open={rightRailOpen}>
            <LocationEditorMapRailTabs
              tabIndex={mapRailTab}
              onTabChange={setMapRailTab}
              metadata={
                <Stack spacing={2}>
                  {mapEditor.mode === 'place' && (
                    <LocationMapEditorPlacePanel
                      items={placePaletteItems}
                      activePlace={mapEditor.activePlace}
                      onSelectPlace={mapEditor.setActivePlace}
                    />
                  )}
                  <Typography variant="subtitle1" fontWeight={600}>
                    Patching: {loc.name}
                  </Typography>
                  {loc.patched && (
                    <AppBadge label="Patched" tone="warning" size="small" />
                  )}
                  <ConditionalFormRenderer
                    fields={fieldConfigs}
                    driver={{
                      kind: 'patch',
                      getValue: driver.getValue,
                      setValue: driver.setValue,
                      unsetValue: driver.unsetValue,
                    }}
                    onValidationApi={(api) => {
                      validationApiRef.current = api;
                    }}
                  />
                  {hasExistingPatch && (
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={handleRemovePatch}
                      disabled={saving}
                      sx={{ alignSelf: 'flex-start' }}
                    >
                      Remove patch
                    </Button>
                  )}
                </Stack>
              }
              cellPanel={
                <LocationCellAuthoringPanel
                  selectedCellId={gridDraft.selectedCellId}
                  hostLocationId={locationId}
                  hostScale={scaleForFormRules}
                  hostName={loc.name}
                  campaignId={campaignId ?? undefined}
                  locations={locations}
                  linkedLocationByCellId={gridDraft.linkedLocationByCellId}
                  objectsByCellId={gridDraft.objectsByCellId}
                  onUpdateLinkedLocation={handleUpdateLinkedLocation}
                  onUpdateCellObjects={handleUpdateCellObjects}
                />
              }
            />
          </LocationEditorRightRail>
        }
      />
    );
  }

  return (
    <FormProvider {...methods}>
      <LocationEditorWorkspace
        header={
          <LocationEditorHeader
            title={loc.name}
            ancestryBreadcrumbs={ancestryBreadcrumbs}
            saving={saving}
            dirty={isDirty || isGridDraftDirty}
            isNew={false}
            formId={FORM_ID}
            onSave={handleCampaignFormSaveClick}
            onBack={handleBack}
            errors={errors}
            success={success}
            rightRailOpen={rightRailOpen}
            onToggleRightRail={() => setRightRailOpen((o) => !o)}
            saveDisabled={isBuildingWorkspace && !activeFloorId}
            actions={
              canDelete ? (
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={async () => {
                    const result = await handleValidateDelete();
                    if (result.allowed) setDeleteConfirmOpen(true);
                  }}
                  disabled={saving || deleting}
                >
                  Delete
                </Button>
              ) : undefined
            }
          />
        }
        canvas={
          isBuildingWorkspace ? (
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <BuildingFloorStrip
                floors={floorChildren}
                activeFloorId={activeFloorId}
                onSelectFloor={setActiveFloorId}
                onAddFloor={handleAddFloor}
                adding={addingFloor}
                disabled={saving}
              />
              <Box
                sx={{
                  flex: 1,
                  minHeight: 0,
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'row',
                  overflow: 'hidden',
                }}
              >
                {showMapEditorChrome && (
                  <>
                    <LocationMapEditorToolbar
                      mode={mapEditor.mode}
                      onModeChange={mapEditor.setMode}
                    />
                    {mapEditor.mode === 'paint' && (
                      <LocationMapEditorPaintTray
                        items={paintPaletteItems}
                        activePaint={mapEditor.activePaint}
                        onSelectSwatch={mapEditor.setActivePaint}
                      />
                    )}
                  </>
                )}
                <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex' }}>
                  <LocationEditorCanvas
                    zoom={zoom}
                    pan={pan}
                    panHandlers={pointerHandlers}
                    isDragging={isDragging}
                    wheelContainerRef={wheelContainerRef}
                    zoomControlProps={zoomControlProps}
                  >
                    {buildingNeedsFloor ? (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          px: 2,
                          minHeight: 120,
                        }}
                      >
                        <Typography variant="body2" color="text.secondary" textAlign="center">
                          No floors yet. Use &quot;Add floor&quot; above to create the first map.
                        </Typography>
                      </Box>
                    ) : showMapGridAuthoring ? (
                      <LocationGridAuthoringSection
                        gridColumns={gridColumns}
                        gridRows={gridRows}
                        gridGeometry={gridGeometry}
                        draft={gridDraft}
                        setDraft={setGridDraft}
                        locations={locations}
                        campaignId={campaignId ?? undefined}
                        hostLocationId={mapHostLocationId}
                        hostScale={mapHostScale}
                        hostName={mapHostName}
                        onCellFocusRail={focusCellRailTab}
                        mapEditorMode={mapEditor.mode}
                        activePaint={mapEditor.activePaint}
                        leftChromeWidthPx={leftMapChromeWidthPx}
                        onPlaceCellClick={handlePlaceCell}
                        onEraseCellClick={handleEraseCell}
                        placePathAnchorCellId={mapEditor.pathAnchorCellId}
                        placeEdgeAnchorCellId={mapEditor.edgeAnchorCellId}
                        suppressCanvasPanOnCells={mapPlaceSuppressesCanvasPanOnCells}
                        placeObjectDragStrokeEnabled={mapPlaceObjectDragStrokeEnabled}
                      />
                    ) : null}
                  </LocationEditorCanvas>
                </Box>
              </Box>
            </Box>
          ) : (
            <Box
              sx={{
                display: 'flex',
                flex: 1,
                minHeight: 0,
                overflow: 'hidden',
                width: '100%',
              }}
            >
              {showMapEditorChrome && (
                <>
                  <LocationMapEditorToolbar
                    mode={mapEditor.mode}
                    onModeChange={mapEditor.setMode}
                  />
                  {mapEditor.mode === 'paint' && (
                    <LocationMapEditorPaintTray
                      items={paintPaletteItems}
                      activePaint={mapEditor.activePaint}
                      onSelectSwatch={mapEditor.setActivePaint}
                    />
                  )}
                </>
              )}
              <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex' }}>
                <LocationEditorCanvas
                  zoom={zoom}
                  pan={pan}
                  panHandlers={pointerHandlers}
                  isDragging={isDragging}
                  wheelContainerRef={wheelContainerRef}
                  zoomControlProps={zoomControlProps}
                >
                  {showMapGridAuthoring ? (
                    <LocationGridAuthoringSection
                      gridColumns={gridColumns}
                      gridRows={gridRows}
                      gridGeometry={gridGeometry}
                      draft={gridDraft}
                      setDraft={setGridDraft}
                      locations={locations}
                      campaignId={campaignId ?? undefined}
                      hostLocationId={locationId}
                      hostScale={scaleForFormRules}
                      hostName={loc.name}
                      onCellFocusRail={focusCellRailTab}
                      mapEditorMode={mapEditor.mode}
                      activePaint={mapEditor.activePaint}
                      leftChromeWidthPx={leftMapChromeWidthPx}
                      onPlaceCellClick={handlePlaceCell}
                      onEraseCellClick={handleEraseCell}
                      placePathAnchorCellId={mapEditor.pathAnchorCellId}
                      placeEdgeAnchorCellId={mapEditor.edgeAnchorCellId}
                      suppressCanvasPanOnCells={mapPlaceSuppressesCanvasPanOnCells}
                      placeObjectDragStrokeEnabled={mapPlaceObjectDragStrokeEnabled}
                    />
                  ) : null}
                </LocationEditorCanvas>
              </Box>
            </Box>
          )
        }
        rightRail={
          <LocationEditorRightRail open={rightRailOpen}>
            <LocationEditorMapRailTabs
              tabIndex={mapRailTab}
              onTabChange={setMapRailTab}
              metadata={
                <Stack spacing={2}>
                  {mapEditor.mode === 'place' && (
                    <LocationMapEditorPlacePanel
                      items={placePaletteItems}
                      activePlace={mapEditor.activePlace}
                      onSelectPlace={mapEditor.setActivePlace}
                    />
                  )}
                  {isBuildingWorkspace && activeFloorId ? (
                    <Typography variant="caption" color="text.secondary">
                      Map and cells: {activeFloorName ?? 'Floor'} (save updates this floor).
                    </Typography>
                  ) : null}
                  <form
                    key="location-form"
                    id={FORM_ID}
                    onSubmit={methods.handleSubmit(handleCampaignSubmit)}
                    noValidate
                  >
                    <ConditionalFormRenderer fields={fieldConfigs} />
                  </form>
                  {policyValue && (
                    <VisibilityField
                      value={policyValue}
                      onChange={handlePolicyChange}
                      characters={policyCharacters}
                    />
                  )}
                </Stack>
              }
              cellPanel={
                <LocationCellAuthoringPanel
                  selectedCellId={gridDraft.selectedCellId}
                  hostLocationId={mapHostLocationId}
                  hostScale={mapHostScale}
                  hostName={mapHostName}
                  campaignId={campaignId ?? undefined}
                  locations={locations}
                  linkedLocationByCellId={gridDraft.linkedLocationByCellId}
                  objectsByCellId={gridDraft.objectsByCellId}
                  onUpdateLinkedLocation={handleUpdateLinkedLocation}
                  onUpdateCellObjects={handleUpdateCellObjects}
                />
              }
            />
          </LocationEditorRightRail>
        }
      />

      <LocationMapEditorLinkedLocationModal
        open={mapEditor.pendingPlacement != null}
        pending={mapEditor.pendingPlacement}
        options={linkModalSelectOptions}
        onConfirm={(linkedLocationId) => {
          const p = mapEditor.pendingPlacement;
          if (!p || p.type !== 'linked-location') return;
          const cellId = p.targetCellId;
          setGridDraft((prev) => ({
            ...prev,
            linkedLocationByCellId: {
              ...prev.linkedLocationByCellId,
              [cellId]: linkedLocationId,
            },
          }));
          mapEditor.setPendingPlacement(null);
        }}
        onCancel={() => mapEditor.setPendingPlacement(null)}
      />

      <ConfirmModal
        open={deleteConfirmOpen}
        headline="Delete Location"
        description="Are you sure you want to delete this location? This action cannot be undone."
        confirmLabel="Delete"
        confirmColor="error"
        loading={deleting}
        onConfirm={async () => {
          setDeleting(true);
          try {
            await handleDelete();
          } finally {
            setDeleting(false);
            setDeleteConfirmOpen(false);
          }
        }}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </FormProvider>
  );
}

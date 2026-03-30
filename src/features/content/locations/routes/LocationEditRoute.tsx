import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FormProvider, useForm } from 'react-hook-form';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
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
import type { LocationScaleId } from '@/shared/domain/locations';
import { GRID_SIZE_PRESETS } from '@/shared/domain/grid/gridPresets';
import {
  LocationGridAuthoringSection,
  LocationEditorWorkspace,
  LocationEditorHeader,
  LocationEditorCanvas,
  LocationEditorRightRail,
  LocationEditorMapRailTabs,
  LocationAncestryBreadcrumbs,
  BuildingFloorStrip,
  INITIAL_LOCATION_GRID_DRAFT,
  type LocationGridDraftState,
} from '@/features/content/locations/components';

const FORM_ID = 'location-edit-form';

export default function LocationEditRoute() {
  const { campaignId, campaign } = useActiveCampaign();
  const { locationId } = useParams<{ locationId: string }>();
  const navigate = useNavigate();
  const { approvedCharacters: policyCharacters } = useCampaignMembers();

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
  const { reset, setValue, watch, getValues, formState: { isDirty } } = methods;

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
  const scaleForFormRules =
    (loc?.source === 'system' && loc ? loc.scale : undefined) ?? watchedScale;

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
  useLocationFormDependentFieldEffects(
    scaleForFormRules,
    locations,
    locationId,
    getValues,
    setValue,
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
    if (!valid) setGridDraft(INITIAL_LOCATION_GRID_DRAFT);
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
    listLocationMaps(campaignId, locationId).then((maps) => {
      if (cancelled) return;
      const def = maps.find((m) => m.isDefault) ?? maps[0];
      if (def) {
        setValue('gridPreset', '');
        setValue('gridColumns', String(def.grid.width));
        setValue('gridRows', String(def.grid.height));
        setValue('gridCellUnit', String(def.grid.cellUnit));
        setValue('gridGeometry', def.grid.geometry ?? getDefaultGeometryForScale(loc!.scale));
        setGridDraft({
          selectedCellId: null,
          excludedCellIds: def.layout?.excludedCellIds ?? [],
          ...cellEntriesToDraft(def.cellEntries),
          cellModalCellId: null,
        });
      } else {
        setGridDraft(INITIAL_LOCATION_GRID_DRAFT);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [campaignId, locationId, loc, setValue]);

  useEffect(() => {
    if (!campaignId || !locationId || !loc || loc.source !== 'campaign') return;
    if (loc.scale !== 'building') return;
    if (!activeFloorId) {
      setGridDraft(INITIAL_LOCATION_GRID_DRAFT);
      return;
    }
    let cancelled = false;
    listLocationMaps(campaignId, activeFloorId).then((maps) => {
      if (cancelled) return;
      const def = maps.find((m) => m.isDefault) ?? maps[0];
      if (def) {
        setValue('gridPreset', '');
        setValue('gridColumns', String(def.grid.width));
        setValue('gridRows', String(def.grid.height));
        setValue('gridCellUnit', String(def.grid.cellUnit));
        setValue('gridGeometry', def.grid.geometry ?? getDefaultGeometryForScale('floor'));
        setGridDraft({
          selectedCellId: null,
          excludedCellIds: def.layout?.excludedCellIds ?? [],
          ...cellEntriesToDraft(def.cellEntries),
          cellModalCellId: null,
        });
      } else {
        setGridDraft(INITIAL_LOCATION_GRID_DRAFT);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [campaignId, activeFloorId, locationId, loc, setValue]);

  const fieldConfigs = useMemo(
    () =>
      getLocationFieldConfigs({
        policyCharacters,
        parentLocationOptions,
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
              ),
            },
          );
          reset({
            ...locationToFormValues(updated),
            ...pickMapGridFormValues(values),
          });
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
            ),
          },
        );
        reset({
          ...locationToFormValues(updated),
          ...pickMapGridFormValues(values),
        });
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
    ],
  );

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
          ),
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
            dirty={driver.isDirty()}
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
              />
            ) : null}
          </LocationEditorCanvas>
        }
        rightRail={
          <LocationEditorRightRail open={rightRailOpen}>
            <LocationEditorMapRailTabs
              selectedCellId={gridDraft.selectedCellId}
              metadata={
                <Stack spacing={2}>
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
            dirty={isDirty}
            isNew={false}
            formId={FORM_ID}
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
                  flexDirection: 'column',
                }}
              >
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
                    />
                  ) : null}
                </LocationEditorCanvas>
              </Box>
            </Box>
          ) : (
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
                />
              ) : null}
            </LocationEditorCanvas>
          )
        }
        rightRail={
          <LocationEditorRightRail open={rightRailOpen}>
            <LocationEditorMapRailTabs
              selectedCellId={gridDraft.selectedCellId}
              metadata={
                <Stack spacing={2}>
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
            />
          </LocationEditorRightRail>
        }
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

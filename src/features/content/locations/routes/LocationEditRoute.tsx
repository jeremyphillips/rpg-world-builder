import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FormProvider, useForm } from 'react-hook-form';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { EntryEditorLayout } from '@/features/content/shared/components';
import { useCampaignMembers } from '@/features/campaign/hooks';
import {
  locationRepo,
  validateLocationChange,
  type LocationContentItem,
  type LocationFormValues,
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
  isLocationScaleSelected,
  useLocationFormCampaignData,
  useLocationFormDependentFieldEffects,
} from '@/features/content/locations/domain';
import { useCampaignContentEntry } from '@/features/content/shared/hooks/useCampaignContentEntry';
import { ConditionalFormRenderer } from '@/ui/patterns';
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

  const isSystem = loc?.source === 'system';
  const isCampaign = loc?.source === 'campaign';

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
  } = useLocationFormCampaignData(campaignId ?? undefined, scaleForFormRules, locationId);

  const locationUiPolicy = useMemo(
    () =>
      applyScaleToLocationFormUiPolicy(
        buildLocationFormUiPolicy('edit', campaignHasWorldLocation),
        scaleForFormRules,
      ),
    [campaignHasWorldLocation, scaleForFormRules],
  );

  const gridCellUnitOptions = useMemo(
    () => getAllowedCellUnitOptionsForScale(scaleForFormRules),
    [scaleForFormRules],
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
    let cancelled = false;
    listLocationMaps(campaignId, locationId).then((maps) => {
      if (cancelled) return;
      const def = maps.find((m) => m.isDefault) ?? maps[0];
      if (def) {
        setValue('gridPreset', '');
        setValue('gridColumns', String(def.grid.width));
        setValue('gridRows', String(def.grid.height));
        setValue('gridCellUnit', String(def.grid.cellUnit));
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

  const fieldConfigs = useMemo(
    () =>
      getLocationFieldConfigs({
        policyCharacters,
        parentLocationOptions,
        gridCellUnitOptions,
        includeGridBootstrap: Boolean(loc && loc.source === 'campaign'),
        locationUiPolicy,
      }),
    [policyCharacters, parentLocationOptions, gridCellUnitOptions, loc, locationUiPolicy],
  );

  const showMapGridAuthoring = isLocationScaleSelected(watchedScale);

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
      if (!campaignId || !locationId) return;
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
      reset,
      setSaving,
      setSuccess,
      setErrors,
      gridDraft.excludedCellIds,
      gridDraft.linkedLocationByCellId,
      gridDraft.objectsByCellId,
    ],
  );

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

  if (isSystem && driver) {
    return (
      <EntryEditorLayout
        title={loc.name}
        typeLabel="Location patch"
        isNew={false}
        saving={saving}
        dirty={driver.isDirty()}
        success={success}
        errors={errors}
        onSave={handlePatchSave}
        onBack={handleBack}
      >
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
      </EntryEditorLayout>
    );
  }

  return (
    <FormProvider {...methods}>
      <EntryEditorLayout
        title={loc.name}
        typeLabel="Location"
        isNew={false}
        saving={saving}
        dirty={isDirty}
        success={success}
        errors={errors}
        formId={FORM_ID}
        onBack={handleBack}
        canDelete={canDelete}
        onDelete={handleDelete}
        validateDelete={handleValidateDelete}
        showPolicyField
        policyValue={policyValue}
        onPolicyChange={handlePolicyChange}
        policyCharacters={policyCharacters}
      >
        <Stack spacing={2}>
          <form
            key="location-form"
            id={FORM_ID}
            onSubmit={methods.handleSubmit(handleCampaignSubmit)}
            noValidate
          >
            <ConditionalFormRenderer fields={fieldConfigs} />
          </form>
          {showMapGridAuthoring ? (
            <LocationGridAuthoringSection
              key="location-grid-authoring"
              gridColumns={gridColumns}
              gridRows={gridRows}
              draft={gridDraft}
              setDraft={setGridDraft}
              locations={locations}
              campaignId={campaignId ?? undefined}
              hostLocationId={locationId}
              hostScale={scaleForFormRules}
              hostName={loc.name}
            />
          ) : null}
        </Stack>
      </EntryEditorLayout>
    </FormProvider>
  );
}

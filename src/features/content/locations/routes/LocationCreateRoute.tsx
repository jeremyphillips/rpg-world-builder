import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormProvider, useForm } from 'react-hook-form';
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { EntryEditorLayout } from '@/features/content/shared/components';
import { useCampaignMembers } from '@/features/campaign/hooks';
import { useAccessPolicyField } from '@/features/content/shared/hooks/useAccessPolicyField';
import type { ValidationError } from '@/features/content/shared/hooks/editRoute.types';
import {
  locationRepo,
  type LocationFormValues,
  getLocationFieldConfigs,
  LOCATION_FORM_DEFAULTS,
  toLocationInput,
  validateGridBootstrap,
  bootstrapDefaultLocationMap,
  cellDraftToCellEntries,
  applyScaleToLocationFormUiPolicy,
  buildLocationFormUiPolicy,
  getAllowedCellUnitOptionsForScale,
  isLocationScaleSelected,
  useLocationFormCampaignData,
  useLocationFormDefaultWorldScale,
  useLocationFormDependentFieldEffects,
} from '@/features/content/locations/domain';
import {
  LocationGridAuthoringSection,
  INITIAL_LOCATION_GRID_DRAFT,
  type LocationGridDraftState,
} from '@/features/content/locations/components';
import { ConditionalFormRenderer } from '@/ui/patterns';
import Stack from '@mui/material/Stack';
import { GRID_SIZE_PRESETS } from '@/shared/domain/grid/gridPresets';
import type { LocationScaleId } from '@/shared/domain/locations';

const FORM_ID = 'location-create-form';

export default function LocationCreateRoute() {
  const { campaignId } = useActiveCampaign();
  const navigate = useNavigate();
  const { approvedCharacters: policyCharacters } = useCampaignMembers();

  const methods = useForm<LocationFormValues>({
    defaultValues: LOCATION_FORM_DEFAULTS,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });
  const { setValue, watch, getValues, formState: { isDirty } } = methods;

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [gridDraft, setGridDraft] = useState<LocationGridDraftState>(
    INITIAL_LOCATION_GRID_DRAFT,
  );

  const { policyValue, handlePolicyChange } =
    useAccessPolicyField<LocationFormValues>(watch, setValue);

  const scale = watch('scale');
  const {
    campaignHasWorldLocation,
    parentLocationOptions,
    loading: locationsLoading,
    locations,
  } = useLocationFormCampaignData(campaignId ?? undefined, scale);

  const locationUiPolicy = useMemo(
    () =>
      applyScaleToLocationFormUiPolicy(
        buildLocationFormUiPolicy('create', campaignHasWorldLocation),
        scale,
      ),
    [campaignHasWorldLocation, scale],
  );

  const gridCellUnitOptions = useMemo(() => getAllowedCellUnitOptionsForScale(scale), [scale]);

  useLocationFormDependentFieldEffects(scale, locations, undefined, getValues, setValue);
  useLocationFormDefaultWorldScale(
    campaignId,
    locationsLoading,
    campaignHasWorldLocation,
    locations.length,
    setValue,
  );

  const gridPreset = watch('gridPreset');
  const gridColumns = watch('gridColumns');
  const gridRows = watch('gridRows');
  const locationNameDraft = watch('name');

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

  const fieldConfigs = useMemo(
    () =>
      getLocationFieldConfigs({
        policyCharacters,
        parentLocationOptions,
        gridCellUnitOptions,
        locationUiPolicy,
      }),
    [policyCharacters, parentLocationOptions, gridCellUnitOptions, locationUiPolicy],
  );

  const showMapGridAuthoring = isLocationScaleSelected(scale);

  const handleSubmit = useCallback(
    async (values: LocationFormValues) => {
      if (!campaignId) return;
      const err = validateGridBootstrap(values);
      if (err) {
        setErrors([{ path: '', code: 'VALIDATION', message: err }]);
        return;
      }
      setSaving(true);
      setErrors([]);
      try {
        const input = toLocationInput(values);
        const created = await locationRepo.createEntry(campaignId, input);
        await bootstrapDefaultLocationMap(
          campaignId,
          created.id,
          created.name,
          created.scale as LocationScaleId,
          values,
          {
            excludedCellIds: gridDraft.excludedCellIds,
            cellEntries: cellDraftToCellEntries(
              gridDraft.linkedLocationByCellId,
              gridDraft.objectsByCellId,
            ),
          },
        );
        navigate(`/campaigns/${campaignId}/world/locations/${created.id}`, { replace: true });
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
      navigate,
      gridDraft.excludedCellIds,
      gridDraft.linkedLocationByCellId,
      gridDraft.objectsByCellId,
    ],
  );

  const handleBack = useCallback(() => {
    navigate(`/campaigns/${campaignId}/world/locations`);
  }, [navigate, campaignId]);

  return (
    <FormProvider {...methods}>
      <EntryEditorLayout
        typeLabel="Location"
        isNew
        saving={saving}
        dirty={isDirty}
        success={false}
        errors={errors}
        formId={FORM_ID}
        onBack={handleBack}
        showPolicyField
        policyValue={policyValue}
        onPolicyChange={handlePolicyChange}
        policyCharacters={policyCharacters}
      >
        <Stack spacing={2}>
          <form
            key="location-form"
            id={FORM_ID}
            onSubmit={methods.handleSubmit(handleSubmit)}
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
              hostScale={scale}
              hostName={String(locationNameDraft ?? '').trim() || undefined}
            />
          ) : null}
        </Stack>
      </EntryEditorLayout>
    </FormProvider>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormProvider, useForm } from 'react-hook-form';
import Stack from '@mui/material/Stack';

import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
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
  getDefaultGeometryForScale,
  isLocationScaleSelected,
  useLocationFormCampaignData,
  useLocationFormDefaultWorldScale,
  useLocationFormDependentFieldEffects,
} from '@/features/content/locations/domain';
import {
  LocationGridAuthoringSection,
  LocationEditorWorkspace,
  LocationEditorHeader,
  LocationEditorCanvas,
  LocationEditorRightRail,
  LocationEditorMapRailTabs,
  INITIAL_LOCATION_GRID_DRAFT,
  type LocationGridDraftState,
} from '@/features/content/locations/components';
import { ConditionalFormRenderer, VisibilityField } from '@/ui/patterns';
import { useCanvasZoom, useCanvasPan } from '@/ui/hooks';
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
  const [rightRailOpen, setRightRailOpen] = useState(true);

  const { zoom, zoomControlProps, wheelContainerRef, bindResetPan } = useCanvasZoom();
  const { pan, isDragging, pointerHandlers, resetPan } = useCanvasPan();
  useEffect(() => { bindResetPan(resetPan) }, [bindResetPan, resetPan]);

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

  const gridGeometry = useMemo(
    () => getDefaultGeometryForScale(scale),
    [scale],
  );

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
      <LocationEditorWorkspace
        header={
          <LocationEditorHeader
            title="New Location"
            saving={saving}
            dirty={isDirty}
            isNew
            formId={FORM_ID}
            onBack={handleBack}
            errors={errors}
            success={false}
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
                hostScale={scale}
                hostName={String(locationNameDraft ?? '').trim() || undefined}
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
                  <form
                    key="location-form"
                    id={FORM_ID}
                    onSubmit={methods.handleSubmit(handleSubmit)}
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
    </FormProvider>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import {
  locationRepo,
  type LocationFormValues,
  validateGridBootstrap,
  bootstrapDefaultLocationMap,
  cellDraftToCellEntries,
  buildLocationFormValuesFromSetup,
  toLocationInput,
  useLocationFormCampaignData,
} from '@/features/content/locations/domain';
import {
  LocationEditorWorkspace,
  LocationEditorHeader,
  LocationEditorCanvas,
  LocationEditorRightRail,
  LocationCreateSetupModal,
  INITIAL_LOCATION_GRID_DRAFT,
} from '@/features/content/locations/components';
import type { LocationCreateSetupDraft } from '@/features/content/locations/domain';
import { useCanvasZoom, useCanvasPan } from '@/ui/hooks';
import type { LocationScaleId } from '@/shared/domain/locations';

export default function LocationCreateRoute() {
  const { campaignId } = useActiveCampaign();
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [rightRailOpen, setRightRailOpen] = useState(true);

  const { zoom, zoomControlProps, wheelContainerRef, bindResetPan } = useCanvasZoom();
  const { pan, isDragging, pointerHandlers, resetPan } = useCanvasPan();
  useEffect(() => {
    bindResetPan(resetPan);
  }, [bindResetPan, resetPan]);

  const {
    campaignHasWorldLocation,
    loading: locationsLoading,
    locations,
  } = useLocationFormCampaignData(campaignId ?? undefined, '');

  const handleBack = useCallback(() => {
    navigate(`/campaigns/${campaignId}/world/locations`);
  }, [navigate, campaignId]);

  const handleSetupComplete = useCallback(
    async (draft: LocationCreateSetupDraft) => {
      if (!campaignId) return;
      setCreateError(null);
      const values: LocationFormValues = buildLocationFormValuesFromSetup(
        draft,
        locations,
      );
      const err = validateGridBootstrap(values);
      if (err) {
        setCreateError(err);
        return;
      }
      setSaving(true);
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
            excludedCellIds: INITIAL_LOCATION_GRID_DRAFT.excludedCellIds,
            cellEntries: cellDraftToCellEntries(
              INITIAL_LOCATION_GRID_DRAFT.linkedLocationByCellId,
              INITIAL_LOCATION_GRID_DRAFT.objectsByCellId,
            ),
          },
        );
        navigate(
          `/campaigns/${campaignId}/world/locations/${created.id}/edit`,
          { replace: true },
        );
      } catch (e) {
        setCreateError((e as Error).message);
      } finally {
        setSaving(false);
      }
    },
    [campaignId, locations, navigate],
  );

  return (
    <>
      <LocationCreateSetupModal
        open
        campaignHasWorldLocation={campaignHasWorldLocation}
        locationsLoading={locationsLoading}
        locations={locations}
        saving={saving}
        submitError={createError}
        onCancel={handleBack}
        onComplete={handleSetupComplete}
      />
      <LocationEditorWorkspace
        header={
          <LocationEditorHeader
            title="New Location"
            saving={saving}
            dirty={false}
            isNew
            hideSaveButton
            onBack={handleBack}
            errors={[]}
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
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 120,
                px: 2,
              }}
            >
              <Typography variant="body2" color="text.secondary" textAlign="center">
                {saving
                  ? 'Creating location…'
                  : 'Finish setup in the dialog to create this location and open the map editor.'}
              </Typography>
            </Box>
          </LocationEditorCanvas>
        }
        rightRail={
          <LocationEditorRightRail open={rightRailOpen}>
            <Typography variant="body2" color="text.secondary" sx={{ p: 2.5 }}>
              Location details and map authoring are available after the location is created.
            </Typography>
          </LocationEditorRightRail>
        }
      />
    </>
  );
}

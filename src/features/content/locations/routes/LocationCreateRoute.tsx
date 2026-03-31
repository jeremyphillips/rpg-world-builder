import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

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
  LocationCreateSetupFormDialog,
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
  /** Prevents overlapping create/bootstrap if submit fires twice before React re-renders. */
  const persistInFlightRef = useRef(false);

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
      if (persistInFlightRef.current) return;
      setCreateError(null);
      const values: LocationFormValues = buildLocationFormValuesFromSetup(
        draft,
        locations,
      );
      const err = validateGridBootstrap(values);
      if (err) {
        setCreateError(`Please fix: ${err}`);
        return;
      }
      persistInFlightRef.current = true;
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
              INITIAL_LOCATION_GRID_DRAFT.cellFillByCellId,
            ),
            pathSegments: INITIAL_LOCATION_GRID_DRAFT.pathSegments,
            edgeFeatures: INITIAL_LOCATION_GRID_DRAFT.edgeFeatures,
          },
        );
        navigate(
          `/campaigns/${campaignId}/world/locations/${created.id}/edit`,
          { replace: true },
        );
      } catch (e) {
        setCreateError(
          `Could not create the location or default map. ${(e as Error).message}`,
        );
      } finally {
        persistInFlightRef.current = false;
        setSaving(false);
      }
    },
    [campaignId, locations, navigate],
  );

  return (
    <>
      <LocationCreateSetupFormDialog
        open
        campaignHasWorldLocation={campaignHasWorldLocation}
        locationsLoading={locationsLoading}
        locations={locations}
        saving={saving}
        submitError={createError}
        onCancel={handleBack}
        onComplete={handleSetupComplete}
      />
      <Box
        aria-busy={locationsLoading || saving}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          opacity: 0.68,
          pointerEvents: 'none',
          transition: 'opacity 0.2s ease',
        }}
      >
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
              <Stack
                alignItems="center"
                justifyContent="center"
                spacing={1.5}
                sx={{ minHeight: 140, maxWidth: 360, mx: 'auto', px: 2 }}
              >
                <LockOutlinedIcon sx={{ fontSize: 28, color: 'text.disabled' }} aria-hidden />
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  {saving
                    ? 'Saving your location and default map…'
                    : 'Complete setup in the dialog to create this location. The map editor opens on the next screen after you continue.'}
                </Typography>
                <Typography variant="caption" color="text.disabled" textAlign="center">
                  You cannot edit the map from this screen — this layout previews where the editor will appear.
                </Typography>
              </Stack>
            </LocationEditorCanvas>
          }
          rightRail={
            <LocationEditorRightRail open={rightRailOpen}>
              <Typography variant="body2" color="text.secondary" sx={{ p: 2.5 }}>
                Metadata and grid tools unlock after setup, on the location editor screen.
              </Typography>
            </LocationEditorRightRail>
          }
        />
      </Box>
    </>
  );
}

import type { ReactNode } from 'react';
import { FormProvider, type UseFormReturn } from 'react-hook-form';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { LocationFormValues } from '@/features/content/locations/domain';
import type { ValidationError } from '@/features/content/shared/hooks/editRoute.types';
import { ConditionalFormRenderer, ConfirmModal } from '@/ui/patterns';
import type { FieldConfig } from '@/ui/patterns/form/form.types';
import type { LocationMapEditorLinkedLocationModalProps } from '@/features/content/locations/components/mapEditor/LocationMapEditorLinkedLocationModal';
import { LocationMapEditorLinkedLocationModal } from '@/features/content/locations/components/mapEditor/LocationMapEditorLinkedLocationModal';

import type { BuildingFloorStripProps } from './BuildingFloorStrip';
import { BuildingFloorStrip } from './BuildingFloorStrip';
import type { LocationEditorRailSection } from './locationEditorRail.types';
import { LocationEditorHeader } from './LocationEditorHeader';
import { LocationEditorRailSectionTabs } from './LocationEditorRailSectionTabs';
import { LocationEditorRightRail } from './LocationEditorRightRail';
import { LocationEditorWorkspace } from './LocationEditorWorkspace';

export type LocationEditCampaignWorkspaceProps = {
  form: UseFormReturn<LocationFormValues>;
  formId: string;
  onCampaignSubmit: (values: LocationFormValues) => void | Promise<void>;
  headerTitle: string;
  ancestryBreadcrumbs: ReactNode;
  saving: boolean;
  dirty: boolean;
  errors: ValidationError[];
  success: boolean;
  rightRailOpen: boolean;
  onToggleRightRail: () => void;
  onSaveClick: () => void;
  onBack: () => void;
  saveDisabled?: boolean;
  canDelete?: boolean;
  /** Validate then open delete confirmation (e.g. async gate + set modal open). */
  onRequestDelete?: () => void | Promise<void>;
  deleteLoading?: boolean;
  /** When set, wraps the map column with the building floor strip + flex column. */
  buildingFloorStrip: BuildingFloorStripProps | null;
  mapCanvasColumn: ReactNode;
  railSection: LocationEditorRailSection;
  onRailSectionChange: (section: LocationEditorRailSection) => void;
  fieldConfigs: FieldConfig[];
  showFloorRailHint: boolean;
  floorRailHintLabel?: string | null;
  policyPanel: ReactNode | null;
  mapAuthoringPanel: ReactNode;
  selectionPanel: ReactNode;
  linkedLocationModal: LocationMapEditorLinkedLocationModalProps;
  deleteConfirm: {
    open: boolean;
    loading: boolean;
    onConfirm: () => void;
    onCancel: () => void;
  };
};

export function LocationEditCampaignWorkspace({
  form,
  formId,
  onCampaignSubmit,
  headerTitle,
  ancestryBreadcrumbs,
  saving,
  dirty,
  errors,
  success,
  rightRailOpen,
  onToggleRightRail,
  onSaveClick,
  onBack,
  saveDisabled,
  canDelete,
  onRequestDelete,
  deleteLoading,
  buildingFloorStrip,
  mapCanvasColumn,
  railSection,
  onRailSectionChange,
  fieldConfigs,
  showFloorRailHint,
  floorRailHintLabel,
  policyPanel,
  mapAuthoringPanel,
  selectionPanel,
  linkedLocationModal,
  deleteConfirm,
}: LocationEditCampaignWorkspaceProps) {
  const canvas =
    buildingFloorStrip != null ? (
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <BuildingFloorStrip {...buildingFloorStrip} />
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
          {mapCanvasColumn}
        </Box>
      </Box>
    ) : (
      mapCanvasColumn
    );

  return (
    <FormProvider {...form}>
      <LocationEditorWorkspace
        header={
          <LocationEditorHeader
            title={headerTitle}
            ancestryBreadcrumbs={ancestryBreadcrumbs}
            saving={saving}
            dirty={dirty}
            isNew={false}
            formId={formId}
            onSave={onSaveClick}
            onBack={onBack}
            errors={errors}
            success={success}
            rightRailOpen={rightRailOpen}
            onToggleRightRail={onToggleRightRail}
            saveDisabled={saveDisabled}
            actions={
              canDelete ? (
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={() => void onRequestDelete?.()}
                  disabled={saving || deleteLoading}
                >
                  Delete
                </Button>
              ) : undefined
            }
          />
        }
        canvas={canvas}
        rightRail={
          <LocationEditorRightRail open={rightRailOpen}>
            <LocationEditorRailSectionTabs
              section={railSection}
              onSectionChange={onRailSectionChange}
              locationPanel={
                <Stack spacing={2}>
                  {showFloorRailHint ? (
                    <Typography variant="caption" color="text.secondary">
                      Map and cells: {floorRailHintLabel ?? 'Floor'} (save updates this floor).
                    </Typography>
                  ) : null}
                  <form
                    key="location-form"
                    id={formId}
                    onSubmit={form.handleSubmit(onCampaignSubmit)}
                    noValidate
                  >
                    <ConditionalFormRenderer fields={fieldConfigs} />
                  </form>
                  {policyPanel}
                </Stack>
              }
              mapPanel={mapAuthoringPanel}
              selectionPanel={selectionPanel}
            />
          </LocationEditorRightRail>
        }
      />

      <LocationMapEditorLinkedLocationModal {...linkedLocationModal} />

      <ConfirmModal
        open={deleteConfirm.open}
        headline="Delete Location"
        description="Are you sure you want to delete this location? This action cannot be undone."
        confirmLabel="Delete"
        confirmColor="error"
        loading={deleteConfirm.loading}
        onConfirm={deleteConfirm.onConfirm}
        onCancel={deleteConfirm.onCancel}
      />
    </FormProvider>
  );
}

import type { ReactNode } from 'react';
import { FormProvider, type UseFormReturn } from 'react-hook-form';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

import type { LocationFormValues } from '@/features/content/locations/domain';
import type { ValidationError } from '@/features/content/shared/hooks/editRoute.types';
import { ConfirmModal } from '@/ui/patterns';
import { AppAlert } from '@/ui/primitives';
import type { FieldConfig } from '@/ui/patterns/form/form.types';
import type { BuildingFloorStripProps } from './BuildingFloorStrip';
import { BuildingFloorStrip } from './BuildingFloorStrip';
import type { LocationEditorRailSection } from './rightRail/types';
import { LocationTab } from './rightRail/tabs/location/LocationTab';
import { LocationEditorHeader } from './header/LocationEditorHeader';
import { LocationEditorRailSectionTabs } from './rightRail/LocationEditorRailSectionTabs';
import { LocationEditorRightRail } from './rightRail/LocationEditorRightRail';
import { LocationEditorWorkspace } from './LocationEditorWorkspace';

export type LocationEditHomebrewWorkspaceProps = {
  form: UseFormReturn<LocationFormValues>;
  formId: string;
  onHomebrewSubmit: (values: LocationFormValues) => void | Promise<void>;
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
  /** When true, Save stays disabled (invalid grid bootstrap, building with no floor, etc.). */
  saveDisabled?: boolean;
  /** Tooltip when Save is disabled while `dirty` (why save is blocked). */
  saveDisabledReason?: string | null;
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
  /** When editing a city, linkage health for child buildings (Location tab). */
  cityLinkagePanel?: ReactNode | null;
  selectionPanel: ReactNode;
  deleteConfirm: {
    open: boolean;
    loading: boolean;
    errorMessage?: string | null;
    onConfirm: () => void | Promise<void>;
    onCancel: () => void;
  };
};

/** User-authored location edit shell (`source === 'campaign'` in storage). */
export function LocationEditHomebrewWorkspace({
  form,
  formId,
  onHomebrewSubmit,
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
  saveDisabledReason,
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
  cityLinkagePanel,
  selectionPanel,
  deleteConfirm,
}: LocationEditHomebrewWorkspaceProps) {
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
            saveDisabledReason={saveDisabledReason}
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
                <LocationTab
                  form={form}
                  formId={formId}
                  onHomebrewSubmit={onHomebrewSubmit}
                  fieldConfigs={fieldConfigs}
                  showFloorRailHint={showFloorRailHint}
                  floorRailHintLabel={floorRailHintLabel}
                  policyPanel={policyPanel}
                  cityLinkagePanel={cityLinkagePanel}
                />
              }
              selectionPanel={selectionPanel}
            />
          </LocationEditorRightRail>
        }
      />

      <ConfirmModal
        open={deleteConfirm.open}
        headline="Delete Location"
        description="This removes this location, any child locations, their maps, and related link data. This cannot be undone."
        confirmLabel="Delete"
        confirmColor="error"
        loading={deleteConfirm.loading}
        onConfirm={deleteConfirm.onConfirm}
        onCancel={deleteConfirm.onCancel}
      >
        {deleteConfirm.errorMessage ? (
          <AppAlert tone="danger">{deleteConfirm.errorMessage}</AppAlert>
        ) : null}
      </ConfirmModal>
    </FormProvider>
  );
}

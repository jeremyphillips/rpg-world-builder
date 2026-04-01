import type { MutableRefObject, ReactNode } from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

import type { PatchDriver } from '@/features/content/shared/editor/patchDriver';
import type { ValidationError } from '@/features/content/shared/hooks/editRoute.types';
import { ConditionalFormRenderer } from '@/ui/patterns';
import type { FieldConfig } from '@/ui/patterns/form/form.types';
import { AppBadge } from '@/ui/primitives';

import type { LocationEditorRailSection } from './locationEditorRail.types';
import { LocationEditorHeader } from './LocationEditorHeader';
import { LocationEditorRailSectionTabs } from './LocationEditorRailSectionTabs';
import { LocationEditorRightRail } from './LocationEditorRightRail';
import { LocationEditorWorkspace } from './LocationEditorWorkspace';

export type LocationEditSystemPatchWorkspaceProps = {
  locationName: string;
  locationPatched?: boolean;
  ancestryBreadcrumbs: ReactNode;
  saving: boolean;
  dirty: boolean;
  errors: ValidationError[];
  success: boolean;
  rightRailOpen: boolean;
  onToggleRightRail: () => void;
  onSave: () => void;
  onBack: () => void;
  fieldConfigs: FieldConfig[];
  patchDriver: PatchDriver;
  validationApiRef: MutableRefObject<{ validateAll: () => boolean } | null>;
  hasExistingPatch: boolean;
  onRemovePatch: () => void;
  railSection: LocationEditorRailSection;
  onRailSectionChange: (section: LocationEditorRailSection) => void;
  mapCanvasColumn: ReactNode;
  mapAuthoringPanel: ReactNode;
  selectionPanel: ReactNode;
};

export function LocationEditSystemPatchWorkspace({
  locationName,
  locationPatched,
  ancestryBreadcrumbs,
  saving,
  dirty,
  errors,
  success,
  rightRailOpen,
  onToggleRightRail,
  onSave,
  onBack,
  fieldConfigs,
  patchDriver,
  validationApiRef,
  hasExistingPatch,
  onRemovePatch,
  railSection,
  onRailSectionChange,
  mapCanvasColumn,
  mapAuthoringPanel,
  selectionPanel,
}: LocationEditSystemPatchWorkspaceProps) {
  return (
    <LocationEditorWorkspace
      header={
        <LocationEditorHeader
          title={`Patch: ${locationName}`}
          ancestryBreadcrumbs={ancestryBreadcrumbs}
          saving={saving}
          dirty={dirty}
          isNew={false}
          onSave={onSave}
          onBack={onBack}
          errors={errors}
          success={success}
          rightRailOpen={rightRailOpen}
          onToggleRightRail={onToggleRightRail}
        />
      }
      canvas={mapCanvasColumn}
      rightRail={
        <LocationEditorRightRail open={rightRailOpen}>
          <LocationEditorRailSectionTabs
            section={railSection}
            onSectionChange={onRailSectionChange}
            locationPanel={
              <Stack spacing={2}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Patching: {locationName}
                </Typography>
                {locationPatched ? <AppBadge label="Patched" tone="warning" size="small" /> : null}
                <ConditionalFormRenderer
                  fields={fieldConfigs}
                  driver={{
                    kind: 'patch',
                    getValue: patchDriver.getValue,
                    setValue: patchDriver.setValue,
                    unsetValue: patchDriver.unsetValue,
                  }}
                  onValidationApi={(api) => {
                    validationApiRef.current = api;
                  }}
                />
                {hasExistingPatch ? (
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={onRemovePatch}
                    disabled={saving}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    Remove patch
                  </Button>
                ) : null}
              </Stack>
            }
            mapPanel={mapAuthoringPanel}
            selectionPanel={selectionPanel}
          />
        </LocationEditorRightRail>
      }
    />
  );
}

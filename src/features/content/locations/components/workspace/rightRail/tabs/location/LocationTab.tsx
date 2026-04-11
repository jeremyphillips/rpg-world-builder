import type { ReactNode } from 'react';
import type { UseFormReturn } from 'react-hook-form';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { LocationFormValues } from '@/features/content/locations/domain';
import { ConditionalFormRenderer } from '@/ui/patterns';
import type { FieldConfig } from '@/ui/patterns/form/form.types';

export type LocationTabProps = {
  form: UseFormReturn<LocationFormValues>;
  formId: string;
  onHomebrewSubmit: (values: LocationFormValues) => void | Promise<void>;
  fieldConfigs: FieldConfig[];
  showFloorRailHint: boolean;
  floorRailHintLabel?: string | null;
  policyPanel: ReactNode | null;
  /** City location edit: optional linkage health (above the metadata form). */
  cityLinkagePanel?: ReactNode | null;
};

/**
 * Homebrew Location rail tab: single form boundary (RHF submit / validation unchanged from inline workspace).
 */
export function LocationTab({
  form,
  formId,
  onHomebrewSubmit,
  fieldConfigs,
  showFloorRailHint,
  floorRailHintLabel,
  policyPanel,
  cityLinkagePanel,
}: LocationTabProps) {
  return (
    <Stack spacing={2}>
      {cityLinkagePanel}
      {showFloorRailHint ? (
        <Typography variant="caption" color="text.secondary">
          Map and cells: {floorRailHintLabel ?? 'Floor'} (save updates this floor).
        </Typography>
      ) : null}
      <form key="location-form" id={formId} onSubmit={form.handleSubmit(onHomebrewSubmit)} noValidate>
        <ConditionalFormRenderer fields={fieldConfigs} />
      </form>
      {policyPanel}
    </Stack>
  );
}

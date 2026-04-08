import OptionPickerField from '@/ui/patterns/form/OptionPickerField';
import type { SelectOption } from '@/ui/patterns/form/form.types';

import type { LocationScaleId } from '@/shared/domain/locations';

import { linkedTargetPickerFieldLabel } from './linkedLocationPickerFieldLabel';

export type LinkedLocationPickerFieldProps = {
  linkedScale: LocationScaleId;
  options: SelectOption[];
  value: string | undefined;
  onChange: (nextLocationId: string | undefined) => void;
  campaignId?: string;
  /** When `source !== 'campaign'`, link targets are unavailable. */
  hostEditLocationSource?: string;
};

export function LinkedLocationPickerField({
  linkedScale,
  options,
  value,
  onChange,
  campaignId,
  hostEditLocationSource,
}: LinkedLocationPickerFieldProps) {
  return (
    <OptionPickerField
      label={linkedTargetPickerFieldLabel(linkedScale)}
      options={options}
      value={value ? [value] : []}
      onChange={(next) => {
        onChange(next[0]);
      }}
      maxItems={1}
      helperText={
        !campaignId || hostEditLocationSource !== 'campaign'
          ? 'Link targets are available for campaign locations only.'
          : options.length === 0
            ? 'No locations match this link type for the current map.'
            : undefined
      }
      emptyMessage="No locations available."
    />
  );
}

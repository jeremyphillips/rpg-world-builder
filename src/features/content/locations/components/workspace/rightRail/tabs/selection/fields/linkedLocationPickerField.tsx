import OptionPickerField from '@/ui/patterns/form/OptionPickerField';
import type { PickerOption } from '@/ui/patterns/form/OptionPickerField';

import type { LocationScaleId } from '@/shared/domain/locations';

import { linkedTargetPickerFieldLabel } from './linkedLocationPickerFieldLabel';

export type LinkedLocationPickerFieldProps = {
  linkedScale: LocationScaleId;
  options: PickerOption[];
  value: string | undefined;
  onChange: (nextLocationId: string | undefined) => void;
  campaignId?: string;
  /** When `source !== 'campaign'`, link targets are unavailable. */
  hostEditLocationSource?: string;
  /** When set, overrides default helper text (e.g. loading state for placement scan). */
  helperText?: string;
};

export function LinkedLocationPickerField({
  linkedScale,
  options,
  value,
  onChange,
  campaignId,
  hostEditLocationSource,
  helperText: helperTextProp,
}: LinkedLocationPickerFieldProps) {
  const helperText =
    helperTextProp ??
    (!campaignId || hostEditLocationSource !== 'campaign'
      ? 'Link targets are available for campaign locations only.'
      : options.length === 0
        ? 'No locations match this link type for the current map.'
        : undefined);

  return (
    <OptionPickerField
      label={linkedTargetPickerFieldLabel(linkedScale)}
      options={options}
      value={value ? [value] : []}
      onChange={(next) => {
        onChange(next[0]);
      }}
      maxItems={1}
      helperText={helperText}
      emptyMessage="No locations available."
    />
  );
}

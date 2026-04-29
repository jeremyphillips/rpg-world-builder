import { Controller, useFormContext } from 'react-hook-form';

import { AppSelect, type SelectOption } from '@/ui/primitives';
import type { MuiTextFieldSize } from '@/ui/sizes';
import { formGridStretchOutlinedSx, useFormLayoutStretch } from './FormLayoutStretchContext';

export type AppFormSelectProps = {
  name: string;
  label: string;
  options: SelectOption[];
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  /** Passed to MUI `FormControl` / `Select`. Default `medium` matches `AppFormTextField`. */
  size?: MuiTextFieldSize;
  /** Fires after the field value updates (e.g. action selects without submitting a form). */
  onAfterChange?: (value: string) => void;
};

/**
 * react-hook-form adapter: binds {@link AppSelect} via `Controller` + `useFormContext`.
 * Must render under `FormProvider`.
 */
export default function AppFormSelect({
  name,
  label,
  options,
  required,
  disabled,
  placeholder,
  size = 'medium',
  onAfterChange,
}: AppFormSelectProps) {
  const { control } = useFormContext();
  const stretch = useFormLayoutStretch();

  return (
    <Controller
      name={name}
      control={control}
      rules={{
        required: required ? `${label} is required` : false,
      }}
      render={({ field, fieldState }) => (
        <AppSelect
          label={label}
          options={options}
          value={field.value}
          onChange={(v) => {
            field.onChange(v);
            onAfterChange?.(v);
          }}
          onBlur={field.onBlur}
          name={field.name}
          inputRef={field.ref}
          error={!!fieldState.error}
          helperText={fieldState.error?.message}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          size={size}
          sx={stretch ? formGridStretchOutlinedSx : undefined}
        />
      )}
    />
  );
}

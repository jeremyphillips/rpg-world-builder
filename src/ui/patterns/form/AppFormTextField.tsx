import { Controller, useFormContext } from 'react-hook-form';
import type { RegisterOptions } from 'react-hook-form';
import { formGridStretchOutlinedSx, useFormLayoutStretch } from './FormLayoutStretchContext';
import { AppTextField } from '@/ui/primitives';

export type AppFormTextFieldProps = {
  name: string;
  label: string;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  disabled?: boolean;
  type?: 'text' | 'email' | 'password' | 'number' | 'datetime-local';
  rules?: RegisterOptions;
  size?: 'small' | 'medium' | 'large';
  /** Fires after the field value updates (e.g. sync workspace draft without form submit). */
  onAfterChange?: (value: string) => void;
};

/**
 * react-hook-form adapter: binds {@link AppTextField} via `Controller` + `useFormContext`.
 * Must render under `FormProvider`.
 */
export default function AppFormTextField({
  name,
  label,
  required,
  multiline,
  rows = 4,
  placeholder,
  disabled,
  type = 'text',
  rules,
  size = 'medium',
  onAfterChange,
}: AppFormTextFieldProps) {
  const { control } = useFormContext();
  const stretch = useFormLayoutStretch();

  return (
    <Controller
      name={name}
      control={control}
      rules={{
        ...(rules ?? {}),
        required: required ? `${label} is required` : false,
      }}
      render={({ field, fieldState }) => (
        <AppTextField
          {...field}
          onChange={(e) => {
            const v = e.target.value;
            field.onChange(e);
            onAfterChange?.(v);
          }}
          label={label}
          required={required}
          fullWidth
          sx={stretch && !multiline ? formGridStretchOutlinedSx : undefined}
          size={size}
          multiline={multiline}
          rows={multiline ? rows : undefined}
          placeholder={placeholder}
          disabled={disabled}
          type={type}
          error={!!fieldState.error}
          helperText={fieldState.error?.message}
          slotProps={
            type === 'datetime-local'
              ? { inputLabel: { shrink: true } }
              : undefined
          }
        />
      )}
    />
  );
}

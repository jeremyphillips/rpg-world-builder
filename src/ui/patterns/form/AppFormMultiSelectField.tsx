import { Controller, useFormContext } from 'react-hook-form';

import {
  AppMultiSelectField,
  type MultiSelectOption,
  type AppMultiSelectFieldDisplayMode,
} from '@/ui/primitives';
import { formGridStretchOutlinedSx, useFormLayoutStretch } from './FormLayoutStretchContext';

export type AppFormMultiSelectFieldProps<TValue extends string = string> = {
  name: string;
  label: string;
  options: MultiSelectOption<TValue>[];
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  displayMode?: AppMultiSelectFieldDisplayMode;
  summaryText?: (selectedOptions: MultiSelectOption<TValue>[]) => string;
  size?: 'small' | 'medium';
  /** Fires after the field value updates. */
  onAfterChange?: (value: TValue[]) => void;
};

/**
 * react-hook-form adapter: binds {@link AppMultiSelectField} via `Controller` + `useFormContext`.
 * Must render under `FormProvider`.
 */
export default function AppFormMultiSelectField<TValue extends string = string>({
  name,
  label,
  options,
  required,
  disabled,
  placeholder,
  displayMode,
  summaryText,
  size = 'medium',
  onAfterChange,
}: AppFormMultiSelectFieldProps<TValue>) {
  const { control } = useFormContext();
  const stretch = useFormLayoutStretch();

  return (
    <Controller
      name={name}
      control={control}
      rules={{
        validate: (v: unknown) => {
          if (!required) return true;
          if (Array.isArray(v) && v.length > 0) return true;
          return `${label} is required`;
        },
      }}
      render={({ field, fieldState }) => (
        <AppMultiSelectField<TValue>
          label={label}
          options={options}
          value={Array.isArray(field.value) ? (field.value as TValue[]) : []}
          onChange={(next) => {
            field.onChange(next);
            onAfterChange?.(next);
          }}
          onBlur={field.onBlur}
          inputRef={field.ref}
          name={field.name}
          error={!!fieldState.error}
          helperText={fieldState.error?.message}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          displayMode={displayMode}
          summaryText={summaryText}
          size={size}
          sx={stretch ? formGridStretchOutlinedSx : undefined}
        />
      )}
    />
  );
}

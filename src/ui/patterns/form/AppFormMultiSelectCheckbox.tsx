import { Controller, useFormContext } from 'react-hook-form';

import {
  AppMultiSelectCheckbox,
  type MultiSelectFieldDisplayMode,
  type MultiSelectOption,
} from '@/ui/primitives';
import type { MuiTextFieldSize } from '@/ui/sizes';
import { formGridStretchOutlinedSx, useFormLayoutStretch } from './FormLayoutStretchContext';

export type AppFormMultiSelectCheckboxProps<TValue extends string = string> = {
  name: string;
  label: string;
  options: MultiSelectOption<TValue>[];
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  displayMode?: MultiSelectFieldDisplayMode;
  summaryText?: (selectedOptions: MultiSelectOption<TValue>[]) => string;
  size?: MuiTextFieldSize;
  /** Fires after the field value updates. */
  onAfterChange?: (value: TValue[]) => void;
};

/**
 * react-hook-form adapter: binds {@link AppMultiSelectCheckbox} via `Controller` + `useFormContext`.
 * Must render under `FormProvider`.
 */
export default function AppFormMultiSelectCheckbox<TValue extends string = string>({
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
}: AppFormMultiSelectCheckboxProps<TValue>) {
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
        <AppMultiSelectCheckbox<TValue>
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

import { Controller, useFormContext } from 'react-hook-form';

import { AppCheckbox, type CheckboxOption } from '@/ui/primitives';

export type AppFormCheckboxProps =
  | {
      name: string;
      label: string;
      required?: boolean;
      disabled?: boolean;
      options?: undefined;
      row?: boolean;
      helperText?: string;
    }
  | {
      name: string;
      label: string;
      required?: boolean;
      disabled?: boolean;
      options: CheckboxOption[];
      row?: boolean;
      helperText?: string;
    };

/**
 * react-hook-form adapter: binds {@link AppCheckbox} via `Controller` + `useFormContext`.
 * Must render under `FormProvider`.
 */
export default function AppFormCheckbox({
  name,
  label,
  required,
  disabled,
  options,
  row,
  helperText,
}: AppFormCheckboxProps) {
  const { control } = useFormContext();

  if (!options) {
    return (
      <Controller
        name={name}
        control={control}
        rules={{
          validate: required
            ? (v) => v === true || `${label} is required`
            : undefined,
        }}
        render={({ field, fieldState }) => (
          <AppCheckbox
            label={label}
            checked={!!field.value}
            onChange={(checked) => field.onChange(checked)}
            onBlur={field.onBlur}
            inputRef={field.ref}
            disabled={disabled}
            error={!!fieldState.error}
            helperText={
              fieldState.error ? fieldState.error.message : helperText
            }
          />
        )}
      />
    );
  }

  return (
    <Controller
      name={name}
      control={control}
      rules={{
        validate: required
          ? (v: string[]) =>
              (Array.isArray(v) && v.length > 0) ||
              `At least one ${label.toLowerCase()} is required`
          : undefined,
      }}
      render={({ field, fieldState }) => {
        const selected: string[] = Array.isArray(field.value)
          ? field.value
          : [];

        return (
          <AppCheckbox
            label={label}
            options={options}
            value={selected}
            onChange={field.onChange}
            onBlur={field.onBlur}
            disabled={disabled}
            error={!!fieldState.error}
            row={row}
            helperText={
              fieldState.error ? fieldState.error.message : helperText
            }
          />
        );
      }}
    />
  );
}

import { Controller, useFormContext } from 'react-hook-form';

import { AppRadioGroup, type RadioOption } from '@/ui/primitives';

export type AppFormRadioGroupProps = {
  name: string;
  label: string;
  options: RadioOption[];
  required?: boolean;
  disabled?: boolean;
  row?: boolean;
};

/**
 * react-hook-form adapter: binds {@link AppRadioGroup} via `Controller` + `useFormContext`.
 * Must render under `FormProvider`.
 */
export default function AppFormRadioGroup({
  name,
  label,
  options,
  required,
  disabled,
  row,
}: AppFormRadioGroupProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      rules={{
        required: required ? `${label} is required` : false,
      }}
      render={({ field, fieldState }) => (
        <AppRadioGroup
          {...field}
          label={label}
          options={options}
          row={row}
          disabled={disabled}
          error={!!fieldState.error}
          helperText={fieldState.error?.message}
        />
      )}
    />
  );
}

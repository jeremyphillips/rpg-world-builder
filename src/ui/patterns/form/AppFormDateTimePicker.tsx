import { Controller, useFormContext } from 'react-hook-form';

import { AppDateTimePicker } from '@/ui/primitives';

export type AppFormDateTimePickerProps = {
  name: string;
  label: string;
  required?: boolean;
  disabled?: boolean;
};

/**
 * react-hook-form adapter: binds {@link AppDateTimePicker} via `Controller` + `useFormContext`.
 * Must render under `FormProvider`.
 */
export default function AppFormDateTimePicker({
  name,
  label,
  required,
  disabled,
}: AppFormDateTimePickerProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      rules={{
        required: required ? `${label} is required` : false,
      }}
      render={({ field, fieldState }) => (
        <AppDateTimePicker
          label={label}
          value={field.value}
          onChange={field.onChange}
          disabled={disabled}
          error={!!fieldState.error}
          helperText={fieldState.error?.message}
        />
      )}
    />
  );
}

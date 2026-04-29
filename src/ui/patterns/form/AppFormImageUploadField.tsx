import { Controller, useFormContext } from 'react-hook-form';

import { AppImageUploadField } from '@/ui/primitives';

export type AppFormImageUploadFieldProps = {
  name: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  maxHeight?: number;
};

/**
 * react-hook-form adapter: binds {@link AppImageUploadField} via `Controller` +
 * `useFormContext`. Must render under `FormProvider`.
 */
export default function AppFormImageUploadField({
  name,
  label,
  required,
  disabled,
  maxHeight,
}: AppFormImageUploadFieldProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      rules={{
        required: required ? `${label ?? 'Image'} is required` : false,
      }}
      render={({ field }) => (
        <AppImageUploadField
          value={field.value}
          onChange={field.onChange}
          label={label}
          disabled={disabled}
          maxHeight={maxHeight}
          required={required}
        />
      )}
    />
  );
}

import { TextField } from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';
import type { RegisterOptions } from 'react-hook-form';

type FormTextFieldProps = {
  name: string;
  label: string;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  disabled?: boolean;
  type?: 'text' | 'email' | 'password' | 'number';
  rules?: RegisterOptions;
};

export default function FormTextField({
  name,
  label,
  required,
  multiline,
  rows = 4,
  placeholder,
  disabled,
  type = 'text',
  rules,
}: FormTextFieldProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      rules={{
        ...(rules ?? {}),
        required: required ? `${label} is required` : false,
      }}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          label={label}
          required={required}
          fullWidth
          multiline={multiline}
          rows={multiline ? rows : undefined}
          placeholder={placeholder}
          disabled={disabled}
          type={type}
          error={!!fieldState.error}
          helperText={fieldState.error?.message}
        />
      )}
    />
  );
}

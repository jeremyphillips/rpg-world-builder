import { useEffect, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { AppJsonPreviewField } from '@/ui/primitives';

export type AppFormJsonPreviewFieldProps = {
  name: string;
  label: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  helperText?: string;
  minRows?: number;
  maxRows?: number;
};

const stringify = (v: unknown): string =>
  v != null && typeof v === 'object'
    ? JSON.stringify(v, null, 2)
    : typeof v === 'string'
      ? v
      : '';

/**
 * react-hook-form adapter: JSON value in form state with string editing + parse in `AppJsonPreviewField`.
 * Must render under `FormProvider`.
 */
export default function AppFormJsonPreviewField({
  name,
  label,
  required,
  disabled,
  placeholder,
  helperText,
  minRows = 4,
  maxRows = 16,
}: AppFormJsonPreviewFieldProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      rules={{
        validate: (v) => {
          if (required && (v == null || v === '')) {
            return `${label} is required`;
          }
          return true;
        },
      }}
      render={({ field, fieldState }) => (
        <AppFormJsonPreviewFieldInner
          field={field}
          fieldState={fieldState}
          label={label}
          disabled={disabled}
          placeholder={placeholder}
          helperText={helperText}
          minRows={minRows}
          maxRows={maxRows}
        />
      )}
    />
  );
}

function AppFormJsonPreviewFieldInner({
  field,
  fieldState,
  label,
  disabled,
  placeholder,
  helperText,
  minRows,
  maxRows,
}: {
  field: { value: unknown; onChange: (v: unknown) => void };
  fieldState: { error?: { message?: string } };
  label: string;
  disabled?: boolean;
  placeholder?: string;
  helperText?: string;
  minRows: number;
  maxRows: number;
}) {
  const [text, setText] = useState(() => stringify(field.value));

  useEffect(() => {
    setText(stringify(field.value));
  }, [field.value]);

  const handleChange = (next: string) => {
    setText(next);
    if (next.trim().length === 0) {
      field.onChange(undefined);
      return;
    }
    try {
      field.onChange(JSON.parse(next));
    } catch {
      // Invalid JSON: do not commit. AppJsonPreviewField shows inline error.
    }
  };

  return (
    <AppJsonPreviewField
      label={label}
      value={text}
      onChange={handleChange}
      disabled={disabled}
      placeholder={placeholder}
      helperText={fieldState.error?.message ?? helperText}
      minRows={minRows}
      maxRows={maxRows}
    />
  );
}

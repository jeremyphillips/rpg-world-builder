import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { useId } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

export type SelectOption = {
  label: string;
  value: string;
};

type FormSelectFieldProps = {
  name: string;
  label: string;
  options: SelectOption[];
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  /** Passed to MUI `FormControl` / `Select`. */
  size?: 'small' | 'medium';
  /** Fires after the field value updates (e.g. action selects without submitting a form). */
  onAfterChange?: (value: string) => void;
};

export default function FormSelectField({
  name,
  label,
  options,
  required,
  disabled,
  placeholder,
  size,
  onAfterChange,
}: FormSelectFieldProps) {
  const { control } = useFormContext();
  const labelId = useId();

  return (
    <Controller
      name={name}
      control={control}
      rules={{
        required: required ? `${label} is required` : false,
      }}
      render={({ field, fieldState }) => (
        <FormControl
          fullWidth
          size={size}
          error={!!fieldState.error}
          disabled={disabled}
          variant="outlined"
        >
          <InputLabel id={labelId} {...(placeholder ? { shrink: true } : {})}>
            {label}
          </InputLabel>
          <Select
            {...field}
            value={field.value ?? ''}
            labelId={labelId}
            label={label}
            displayEmpty
            onChange={(e) => {
              const v = e.target.value as string;
              field.onChange(v);
              onAfterChange?.(v);
            }}
            renderValue={
              placeholder
                ? (selected) => {
                    if (selected === '' || selected == null) {
                      return (
                        <Box component="span" sx={{ color: 'text.secondary' }}>
                          {placeholder}
                        </Box>
                      );
                    }
                    const opt = options.find((o) => o.value === selected);
                    return opt?.label ?? String(selected);
                  }
                : undefined
            }
          >
            {placeholder && (
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
            )}
            {options.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
          {fieldState.error && (
            <FormHelperText>{fieldState.error.message}</FormHelperText>
          )}
        </FormControl>
      )}
    />
  );
}

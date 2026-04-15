import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { useId, useState, type FocusEvent, type Ref } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import type { ControllerFieldState } from 'react-hook-form';
import { formGridStretchOutlinedSx, useFormLayoutStretch } from './FormLayoutStretchContext';

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
  /** Passed to MUI `FormControl` / `Select`. Default `medium` matches `AppFormTextField`; theme sets `MuiSelect` to `small`. */
  size?: 'small' | 'medium';
  /** Fires after the field value updates (e.g. action selects without submitting a form). */
  onAfterChange?: (value: string) => void;
};

type RhfField = {
  name: string;
  value: unknown;
  onChange: (...event: unknown[]) => void;
  onBlur: (e?: FocusEvent<HTMLElement>) => void;
  ref: Ref<unknown>;
};

type InnerProps = {
  field: RhfField;
  fieldState: ControllerFieldState;
  labelId: string;
  label: string;
  options: SelectOption[];
  disabled?: boolean;
  placeholder?: string;
  size?: 'small' | 'medium';
  onAfterChange?: (value: string) => void;
};

/**
 * Outlined `Select` + `displayEmpty` + custom `renderValue` placeholder:
 * if `InputLabel` is not shrunk while the empty placeholder is shown, the label and
 * placeholder text occupy the same space. Shrink when there is a value, the menu is
 * open, the control is focused, or we show a placeholder for an empty value (needs
 * floating label — do not leave shrink false when `placeholder` + empty).
 */
function FormSelectFieldInner({
  field,
  fieldState,
  labelId,
  label,
  options,
  disabled,
  placeholder,
  size,
  onAfterChange,
}: InnerProps) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const stretch = useFormLayoutStretch();

  const hasValue = field.value !== '' && field.value != null;
  const showPlaceholder = Boolean(placeholder) && !hasValue;
  const shrink = Boolean(hasValue) || open || focused || showPlaceholder;

  return (
    <FormControl
      fullWidth
      size={size}
      error={!!fieldState.error}
      disabled={disabled}
      variant="outlined"
      sx={stretch ? formGridStretchOutlinedSx : undefined}
    >
      <InputLabel id={labelId} shrink={shrink}>
        {label}
      </InputLabel>
      <Select
        {...field}
        value={field.value ?? ''}
        labelId={labelId}
        label={label}
        displayEmpty
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          field.onBlur(e);
          setFocused(false);
        }}
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
      {fieldState.error && <FormHelperText>{fieldState.error.message}</FormHelperText>}
    </FormControl>
  );
}

export default function FormSelectField({
  name,
  label,
  options,
  required,
  disabled,
  placeholder,
  size = 'medium',
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
        <FormSelectFieldInner
          field={field}
          fieldState={fieldState}
          labelId={labelId}
          label={label}
          options={options}
          disabled={disabled}
          placeholder={placeholder}
          size={size}
          onAfterChange={onAfterChange}
        />
      )}
    />
  );
}

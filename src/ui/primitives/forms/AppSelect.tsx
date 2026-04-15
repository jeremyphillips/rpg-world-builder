import type { FocusEvent, Ref } from 'react';
import { useId, useState } from 'react';

import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import type { SxProps, Theme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

/**
 * AppSelect empty-state contract (outlined MUI Select):
 *
 * - With `placeholder`: `displayEmpty` + a single `renderValue` path for empty vs selected; the label
 *   shrinks while empty (`showPlaceholder`) so the placeholder matches standard outlined behavior.
 * - Without `placeholder`: no custom `renderValue`; empty value uses plain MUI label/select (label may sit
 *   in-field until focus/open). Callers must not add screen-level wrappers to simulate placeholder.
 */

export type SelectOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

export type AppSelectProps = {
  label: string;
  options: SelectOption[];
  value: unknown;
  onChange: (value: string) => void;
  onBlur?: (e: FocusEvent<HTMLElement>) => void;
  name?: string;
  /** For RHF / Controller: forwarded to the underlying `Select`. */
  inputRef?: Ref<unknown>;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  /** When set with `placeholder`, the empty option is display-only (not selectable). */
  emptyMenuItemDisabled?: boolean;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  /** Applied to `FormControl` (e.g. grid stretch from form layout context). */
  sx?: SxProps<Theme>;
};

/** Outlined select; see file-level contract. For RHF see `AppFormSelect`. */
export function AppSelect({
  label,
  options,
  value,
  onChange,
  onBlur,
  name,
  inputRef,
  error,
  helperText,
  disabled,
  required,
  placeholder,
  emptyMenuItemDisabled = false,
  size = 'medium',
  fullWidth = true,
  sx,
}: AppSelectProps) {
  const labelId = useId();
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);

  const hasValue = value !== '' && value != null;
  const showPlaceholder = Boolean(placeholder) && !hasValue;
  const shrink = Boolean(hasValue) || open || focused || showPlaceholder;

  return (
    <FormControl
      fullWidth={fullWidth}
      size={size}
      error={error}
      disabled={disabled}
      required={required}
      variant="outlined"
      sx={sx}
    >
      <InputLabel id={labelId} shrink={shrink}>
        {label}
      </InputLabel>
      <Select
        ref={inputRef}
        name={name}
        value={value ?? ''}
        labelId={labelId}
        label={label}
        displayEmpty
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          onBlur?.(e);
          setFocused(false);
        }}
        onChange={(e) => onChange(e.target.value as string)}
        renderValue={
          placeholder
            ? (selected) => {
                if (selected === '' || selected == null) {
                  return (
                    <Typography component="span" variant="inherit" color="text.secondary" sx={{ lineHeight: 'inherit' }}>
                      {placeholder}
                    </Typography>
                  );
                }
                const opt = options.find((o) => o.value === selected);
                return opt?.label ?? String(selected);
              }
            : undefined
        }
      >
        {placeholder && (
          <MenuItem value="" disabled={emptyMenuItemDisabled}>
            <em>{placeholder}</em>
          </MenuItem>
        )}
        {options.map((opt) => (
          <MenuItem key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </MenuItem>
        ))}
      </Select>
      {helperText ? <FormHelperText>{helperText}</FormHelperText> : null}
    </FormControl>
  );
}

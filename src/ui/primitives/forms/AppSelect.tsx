import type { FocusEvent, ReactNode, Ref } from 'react';
import { useId, useState } from 'react';

import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import type { SelectChangeEvent, SelectProps } from '@mui/material/Select';
import type { SxProps, Theme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import type { MuiTextFieldSize } from '@/ui/sizes';

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

type AppSelectBase = {
  label: string;
  onBlur?: (e: FocusEvent<HTMLElement>) => void;
  name?: string;
  /** For RHF / Controller: forwarded to the underlying `Select`. */
  inputRef?: Ref<unknown>;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  size?: MuiTextFieldSize;
  fullWidth?: boolean;
  /** Applied to `FormControl` (e.g. grid stretch from form layout context). */
  sx?: SxProps<Theme>;
  /** Renders after the label text inside `InputLabel` (e.g. info icon). */
  labelEndAdornment?: ReactNode;
};

export type AppSelectSingleProps = AppSelectBase & {
  multiple?: false;
  options: SelectOption[];
  value: unknown;
  onChange: (value: string) => void;
  placeholder?: string;
  /** When set with `placeholder`, the empty option is display-only (not selectable). */
  emptyMenuItemDisabled?: boolean;
};

export type AppSelectMultiProps = AppSelectBase & {
  multiple: true;
  value: string[];
  onChange: (value: string[]) => void;
  /** Closed-field display (e.g. summary or chips). */
  renderValue: () => ReactNode;
  /** Typically `MenuItem` rows (e.g. with checkboxes). */
  children: ReactNode;
  placeholder?: string;
  /** When true (default), `InputLabel` stays shrunk when the selection is empty but `renderValue` still shows text. */
  shrinkWhenEmpty?: boolean;
  MenuProps?: SelectProps<string[]>['MenuProps'];
};

export type AppSelectProps = AppSelectSingleProps | AppSelectMultiProps;

/** Outlined select; see file-level contract. For RHF see `AppFormSelect`. */
export function AppSelect(props: AppSelectProps) {
  if (props.multiple === true) {
    return <AppSelectMulti {...props} />;
  }
  return <AppSelectSingle {...props} />;
}

function AppSelectMulti({
  label,
  value,
  onChange,
  renderValue,
  children,
  onBlur,
  name,
  inputRef,
  error,
  helperText,
  disabled,
  required,
  placeholder,
  shrinkWhenEmpty = true,
  size = 'medium',
  fullWidth = true,
  sx,
  labelEndAdornment,
  MenuProps,
}: AppSelectMultiProps) {
  const labelId = useId();
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);

  const shrink =
    open || focused || value.length > 0 || Boolean(placeholder) || shrinkWhenEmpty;

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
        {labelEndAdornment ? (
          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
            <span>{label}</span>
            {labelEndAdornment}
          </Box>
        ) : (
          label
        )}
      </InputLabel>
      <Select<string[]>
        inputRef={inputRef}
        name={name}
        size={size}
        multiple
        labelId={labelId}
        label={label}
        value={value}
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        displayEmpty
        renderValue={renderValue}
        onChange={(e: SelectChangeEvent<string[]>) => {
          const v = e.target.value;
          onChange(typeof v === 'string' ? v.split(',') : v);
        }}
        MenuProps={MenuProps}
      >
        {children}
      </Select>
      {helperText ? <FormHelperText>{helperText}</FormHelperText> : null}
    </FormControl>
  );
}

function AppSelectSingle({
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
  labelEndAdornment,
}: AppSelectSingleProps) {
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
        {labelEndAdornment ? (
          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
            <span>{label}</span>
            {labelEndAdornment}
          </Box>
        ) : (
          label
        )}
      </InputLabel>
      <Select
        ref={inputRef}
        name={name}
        size={size}
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
        {/* Skip `value: ''` in the list when placeholder supplies the empty row (avoids duplicate "All"). */}
        {(placeholder ? options.filter((o) => o.value !== '') : options).map((opt) => (
          <MenuItem key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </MenuItem>
        ))}
      </Select>
      {helperText ? <FormHelperText>{helperText}</FormHelperText> : null}
    </FormControl>
  );
}

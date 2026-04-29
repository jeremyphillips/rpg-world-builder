import type { FocusEvent, ReactNode, Ref } from 'react';
import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import type { SxProps, Theme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';

import type { MuiTextFieldSize } from '@/ui/sizes';

import { AppSelect } from './AppSelect';
import {
  defaultMultiSelectSummary,
  getSelectedMultiSelectOptions,
  type MultiSelectFieldDisplayMode,
  type MultiSelectOption,
} from './multiSelectFieldShared';

export type AppMultiSelectCheckboxProps<TValue extends string = string> = {
  label: string;
  options: MultiSelectOption<TValue>[];
  value: TValue[];
  onChange: (value: TValue[]) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  /** Default `summary`: compact count text; `chips` shows selected options as chips (MUI Chip, outlined/small to match `AppBadge`). */
  displayMode?: MultiSelectFieldDisplayMode;
  /** Override default summary (`None selected` / `1 selected` / `N selected`). Do not include the field `label` here — it is shown by the floating label. */
  summaryText?: (selectedOptions: MultiSelectOption<TValue>[]) => string;
  size?: MuiTextFieldSize;
  fullWidth?: boolean;
  /** For RHF / Controller: forwarded to the underlying `Select`. */
  inputRef?: Ref<unknown>;
  name?: string;
  onBlur?: (e: FocusEvent<HTMLElement>) => void;
  sx?: SxProps<Theme>;
  /** Renders after the field label (e.g. info icon). */
  labelEndAdornment?: ReactNode;
};

/**
 * Multi-select using **AppSelect** (`multiple`) + **MenuItem** checkboxes (no Autocomplete search input).
 * Prefer this for compact filters and bounded option lists.
 */
export function AppMultiSelectCheckbox<TValue extends string = string>({
  label,
  options,
  value,
  onChange,
  placeholder,
  disabled,
  required,
  error,
  helperText,
  displayMode = 'summary',
  summaryText,
  size = 'medium',
  fullWidth = true,
  inputRef,
  name,
  onBlur,
  sx,
  labelEndAdornment,
}: AppMultiSelectCheckboxProps<TValue>) {
  const resolvedValue = useMemo(() => value ?? [], [value]);

  const selectedOptions = useMemo(
    () => getSelectedMultiSelectOptions(resolvedValue, options),
    [resolvedValue, options],
  );

  const summaryLine = useMemo(() => {
    if (summaryText) return summaryText(selectedOptions);
    if (selectedOptions.length === 0 && placeholder) {
      return placeholder;
    }
    return defaultMultiSelectSummary(selectedOptions);
  }, [summaryText, selectedOptions, placeholder]);

  const renderClosedValue = () => {
    if (displayMode === 'chips') {
      if (selectedOptions.length === 0) {
        return (
          <Typography component="span" variant="body2" color="text.secondary" sx={{ lineHeight: 'inherit' }}>
            {placeholder ?? 'None selected'}
          </Typography>
        );
      }
      return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, py: 0.25 }}>
          {selectedOptions.map((o) => (
            <Chip key={o.value} label={o.label} size="small" variant="outlined" />
          ))}
        </Box>
      );
    }
    return (
      <Typography component="span" variant="body2" color="text.primary" sx={{ lineHeight: 'inherit' }}>
        {summaryLine}
      </Typography>
    );
  };

  return (
    <AppSelect
      multiple
      label={label}
      labelEndAdornment={labelEndAdornment}
      value={resolvedValue as string[]}
      onChange={(next) => onChange(next as TValue[])}
      renderValue={renderClosedValue}
      size={size}
      fullWidth={fullWidth}
      error={error}
      disabled={disabled}
      required={required}
      helperText={helperText}
      name={name}
      inputRef={inputRef}
      onBlur={onBlur}
      sx={sx}
      placeholder={placeholder}
      MenuProps={{
        autoFocus: false,
        slotProps: { paper: { sx: { maxHeight: 320 } } },
      }}
    >
      {options.map((opt) => {
        const checked = resolvedValue.includes(opt.value);
        return (
          <MenuItem sx={{ pl: 0, pr: 1 }} key={opt.value} value={opt.value} disabled={opt.disabled} dense>
            <Checkbox
              icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
              checkedIcon={<CheckBoxIcon fontSize="small" />}
              sx={{ mr: 1 }}
              checked={checked}
              tabIndex={-1}
              disableRipple
            />
            <ListItemText primary={opt.label} slotProps={{ primary: { variant: 'body2' } }} />
          </MenuItem>
        );
      })}
    </AppSelect>
  );
}

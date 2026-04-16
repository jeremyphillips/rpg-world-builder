import type { FocusEvent, ReactNode, Ref } from 'react';
import { useMemo } from 'react';

import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import type { AutocompleteRenderInputParams } from '@mui/material/Autocomplete';
import type { SxProps, Theme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';

import {
  defaultMultiSelectSummary,
  getSelectedMultiSelectOptions,
  type MultiSelectFieldDisplayMode,
  type MultiSelectOption,
} from './multiSelectFieldShared';

import type { AppMultiSelectSize } from '@/ui/sizes';

export type { MultiSelectOption, MultiSelectFieldDisplayMode };

export type AppMultiSelectDisplayMode = MultiSelectFieldDisplayMode;

export type AppMultiSelectProps<TValue extends string = string> = {
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
  size?: AppMultiSelectSize;
  fullWidth?: boolean;
  /** For RHF / Controller: forwarded to the text input. */
  inputRef?: Ref<HTMLInputElement>;
  name?: string;
  onBlur?: (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  sx?: SxProps<Theme>;
  /** Renders after the field label (e.g. info icon). */
  labelEndAdornment?: ReactNode;
};

/**
 * Multi-select built on MUI **Autocomplete** (`multiple`, `disableCloseOnSelect`), with checkbox-style options.
 * Prefer {@link AppMultiSelectCheckbox} for bounded lists where search/combobox typing is not desired.
 */
export function AppMultiSelect<TValue extends string = string>({
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
}: AppMultiSelectProps<TValue>) {
  const selectedOptions = useMemo(
    () => getSelectedMultiSelectOptions(value, options),
    [value, options],
  );

  const summaryString = summaryText
    ? summaryText(selectedOptions)
    : defaultMultiSelectSummary(selectedOptions);

  const renderInput = (params: AutocompleteRenderInputParams) => (
    <TextField
      {...params}
      name={name}
      inputRef={inputRef}
      onBlur={(e) => {
        params.inputProps?.onBlur?.(e as FocusEvent<HTMLInputElement>);
        onBlur?.(e);
      }}
      label={
        labelEndAdornment ? (
          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
            <span>{label}</span>
            {labelEndAdornment}
          </Box>
        ) : (
          label
        )
      }
      placeholder={placeholder}
      error={error}
      helperText={helperText}
      required={required}
      size={size}
      fullWidth={fullWidth}
      InputProps={{
        ...params.InputProps,
        startAdornment:
          displayMode === 'summary' ? (
            <Typography
              component="span"
              variant="body2"
              color="text.primary"
              sx={{ lineHeight: 'inherit', pl: 0.5 }}
            >
              {summaryString}
            </Typography>
          ) : (
            params.InputProps.startAdornment
          ),
      }}
    />
  );

  return (
    <Autocomplete<MultiSelectOption<TValue>, true, false, false>
      multiple
      disableCloseOnSelect
      options={options}
      value={selectedOptions}
      onChange={(_, newValue) => {
        onChange(newValue.map((o) => o.value));
      }}
      getOptionLabel={(o) => o.label}
      isOptionEqualToValue={(a, b) => a.value === b.value}
      getOptionDisabled={(o) => Boolean(o.disabled)}
      disabled={disabled}
      fullWidth={fullWidth}
      sx={sx}
      renderOption={(props, option, { selected }) => {
        const { key, ...optionProps } = props;
        return (
          <li key={key} {...optionProps}>
            <Checkbox
              icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
              checkedIcon={<CheckBoxIcon fontSize="small" />}
              sx={{ mr: 1 }}
              checked={selected}
              disabled={option.disabled}
            />
            {option.label}
          </li>
        );
      }}
      renderTags={
        displayMode === 'chips'
          ? (tagValue, getTagProps) =>
              tagValue.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option.value}
                  label={option.label}
                  size="small"
                  variant="outlined"
                />
              ))
          : () => null
      }
      renderInput={renderInput}
    />
  );
}

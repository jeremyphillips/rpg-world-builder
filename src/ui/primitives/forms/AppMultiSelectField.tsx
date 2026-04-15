import type { FocusEvent, Ref } from 'react';
import { useMemo } from 'react';

import Autocomplete from '@mui/material/Autocomplete';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import type { AutocompleteRenderInputParams } from '@mui/material/Autocomplete';
import type { SxProps, Theme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';

export type MultiSelectOption<TValue extends string = string> = {
  value: TValue;
  label: string;
  disabled?: boolean;
};

export type AppMultiSelectFieldDisplayMode = 'summary' | 'chips';

export type AppMultiSelectFieldProps<TValue extends string = string> = {
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
  displayMode?: AppMultiSelectFieldDisplayMode;
  /** Override default summary (`None selected` / `1 selected` / `N selected`). Do not include the field `label` here — it is shown by the floating label. */
  summaryText?: (selectedOptions: MultiSelectOption<TValue>[]) => string;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  /** For RHF / Controller: forwarded to the text input. */
  inputRef?: Ref<HTMLInputElement>;
  name?: string;
  onBlur?: (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  sx?: SxProps<Theme>;
};

function defaultSummary<TValue extends string>(selected: MultiSelectOption<TValue>[]) {
  const n = selected.length;
  if (n === 0) return 'None selected';
  if (n === 1) return '1 selected';
  return `${n} selected`;
}

export function AppMultiSelectField<TValue extends string = string>({
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
}: AppMultiSelectFieldProps<TValue>) {
  const optionByValue = useMemo(() => {
    const m = new Map<TValue, MultiSelectOption<TValue>>();
    for (const o of options) {
      m.set(o.value, o);
    }
    return m;
  }, [options]);

  const selectedOptions = useMemo(() => {
    const out: MultiSelectOption<TValue>[] = [];
    for (const v of value) {
      const o = optionByValue.get(v);
      if (o) out.push(o);
    }
    return out;
  }, [value, optionByValue]);

  const summaryString = summaryText
    ? summaryText(selectedOptions)
    : defaultSummary(selectedOptions);

  const renderInput = (params: AutocompleteRenderInputParams) => (
    <TextField
      {...params}
      name={name}
      inputRef={inputRef}
      onBlur={(e) => {
        params.inputProps?.onBlur?.(e);
        onBlur?.(e);
      }}
      label={label}
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

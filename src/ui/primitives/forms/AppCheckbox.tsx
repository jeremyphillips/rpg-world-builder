import type { Ref } from 'react';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';

export type CheckboxOption = {
  label: string;
  value: string;
};

type AppCheckboxSingleProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  onBlur?: () => void;
  inputRef?: Ref<HTMLInputElement>;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  options?: undefined;
  row?: never;
};

type AppCheckboxGroupProps = {
  label: string;
  options: CheckboxOption[];
  value: string[];
  onChange: (next: string[]) => void;
  onBlur?: () => void;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  row?: boolean;
};

export type AppCheckboxProps = AppCheckboxSingleProps | AppCheckboxGroupProps;

/** Boolean toggle or multi-select group; for RHF see `AppFormCheckbox`. */
export function AppCheckbox(props: AppCheckboxProps) {
  if ('options' in props && props.options) {
    return <AppCheckboxGroupInner {...props} />;
  }
  return <AppCheckboxSingleInner {...props} />;
}

function AppCheckboxSingleInner({
  label,
  checked,
  onChange,
  onBlur,
  inputRef,
  disabled,
  error,
  helperText,
}: AppCheckboxSingleProps) {
  return (
    <FormControl error={error} disabled={disabled}>
      <FormControlLabel
        control={
          <Checkbox
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            onBlur={onBlur}
            inputRef={inputRef}
          />
        }
        label={label}
      />
      {helperText ? <FormHelperText error={!!error}>{helperText}</FormHelperText> : null}
    </FormControl>
  );
}

function AppCheckboxGroupInner({
  label,
  options,
  value,
  onChange,
  onBlur,
  disabled,
  error,
  helperText,
  row,
}: AppCheckboxGroupProps) {
  const selected = value;

  const handleToggle = (optValue: string) => {
    const next = selected.includes(optValue)
      ? selected.filter((v) => v !== optValue)
      : [...selected, optValue];
    onChange(next);
  };

  return (
    <FormControl error={error} disabled={disabled}>
      <FormLabel>{label}</FormLabel>
      <FormGroup row={row}>
        {options.map((opt) => (
          <FormControlLabel
            key={opt.value}
            control={
              <Checkbox
                checked={selected.includes(opt.value)}
                onChange={() => handleToggle(opt.value)}
                onBlur={onBlur}
              />
            }
            label={opt.label}
          />
        ))}
      </FormGroup>
      {helperText ? <FormHelperText error={!!error}>{helperText}</FormHelperText> : null}
    </FormControl>
  );
}

import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import type { RadioGroupProps } from '@mui/material/RadioGroup';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';

export type RadioOption = {
  label: string;
  value: string;
};

export type AppRadioGroupProps = Omit<RadioGroupProps, 'children'> & {
  label: string;
  options: RadioOption[];
  helperText?: string;
  error?: boolean;
  disabled?: boolean;
};

/**
 * App-level labeled radio group (MUI `FormControl` + `RadioGroup`). Use with controlled props
 * or spread RHF `field` onto the inner group. For react-hook-form wiring, see `AppFormRadioGroup`
 * in `@/ui/patterns/form/AppFormRadioGroup`.
 */
export function AppRadioGroup({
  label,
  options,
  helperText,
  error,
  disabled,
  row,
  ...radioGroupProps
}: AppRadioGroupProps) {
  return (
    <FormControl error={error} disabled={disabled}>
      <FormLabel>{label}</FormLabel>
      <RadioGroup row={row} {...radioGroupProps}>
        {options.map((opt) => (
          <FormControlLabel
            key={opt.value}
            value={opt.value}
            control={<Radio />}
            label={opt.label}
          />
        ))}
      </RadioGroup>
      {helperText ? <FormHelperText>{helperText}</FormHelperText> : null}
    </FormControl>
  );
}

import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup
} from '@mui/material'
import { Controller, useFormContext } from 'react-hook-form'

export type RadioOption = {
  label: string
  value: string
}

type FormRadioFieldProps = {
  name: string
  label: string
  options: RadioOption[]
  required?: boolean
  disabled?: boolean
  row?: boolean
}

export default function FormRadioField({
  name,
  label,
  options,
  required,
  disabled,
  row
}: FormRadioFieldProps) {
  const { control } = useFormContext()

  return (
    <Controller
      name={name}
      control={control}
      rules={{
        required: required ? `${label} is required` : false
      }}
      render={({ field, fieldState }) => (
        <FormControl error={!!fieldState.error} disabled={disabled}>
          <FormLabel>{label}</FormLabel>
          <RadioGroup {...field} row={row}>
            {options.map((opt) => (
              <FormControlLabel
                key={opt.value}
                value={opt.value}
                control={<Radio />}
                label={opt.label}
              />
            ))}
          </RadioGroup>
          {fieldState.error && (
            <FormHelperText>{fieldState.error.message}</FormHelperText>
          )}
        </FormControl>
      )}
    />
  )
}

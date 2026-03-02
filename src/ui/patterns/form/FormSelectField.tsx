import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select
} from '@mui/material'
import { Controller, useFormContext } from 'react-hook-form'

export type SelectOption = {
  label: string
  value: string
}

type FormSelectFieldProps = {
  name: string
  label: string
  options: SelectOption[]
  required?: boolean
  disabled?: boolean
  placeholder?: string
}

export default function FormSelectField({
  name,
  label,
  options,
  required,
  disabled,
  placeholder
}: FormSelectFieldProps) {
  const { control } = useFormContext()

  return (
    <Controller
      name={name}
      control={control}
      rules={{
        required: required ? `${label} is required` : false
      }}
      render={({ field, fieldState }) => (
        <FormControl fullWidth error={!!fieldState.error} disabled={disabled}>
          <InputLabel>{label}</InputLabel>
          <Select {...field} label={label} displayEmpty>
            {placeholder && (
              <MenuItem value="" disabled>
                {placeholder}
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
  )
}

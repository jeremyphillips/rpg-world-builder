import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel
} from '@mui/material'
import { Controller, useFormContext } from 'react-hook-form'

export type CheckboxOption = {
  label: string
  value: string
}

/**
 * Single checkbox (boolean toggle) when no `options` are provided.
 * Multi-select checkbox group when `options` are provided (value is string[]).
 */
type FormCheckboxFieldProps =
  | {
      name: string
      label: string
      required?: boolean
      disabled?: boolean
      options?: undefined
      row?: boolean
      helperText?: string
    }
  | {
      name: string
      label: string
      required?: boolean
      disabled?: boolean
      options: CheckboxOption[]
      row?: boolean
      helperText?: string
    }

export default function FormCheckboxField({
  name,
  label,
  required,
  disabled,
  options,
  row,
  helperText
}: FormCheckboxFieldProps) {
  const { control } = useFormContext()

  // Single boolean checkbox
  if (!options) {
    return (
      <Controller
        name={name}
        control={control}
        rules={{
          validate: required
            ? (v) => v === true || `${label} is required`
            : undefined
        }}
        render={({ field, fieldState }) => (
          <FormControl error={!!fieldState.error} disabled={disabled}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={!!field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  onBlur={field.onBlur}
                  ref={field.ref}
                />
              }
              label={label}
            />
            {fieldState.error && (
              <FormHelperText>{fieldState.error.message}</FormHelperText>
            )}
            {!fieldState.error && helperText && (
              <FormHelperText error={false}>{helperText}</FormHelperText>
            )}
          </FormControl>
        )}
      />
    )
  }

  // Multi-select checkbox group (value is string[])
  return (
    <Controller
      name={name}
      control={control}
      rules={{
        validate: required
          ? (v: string[]) =>
              (Array.isArray(v) && v.length > 0) ||
              `At least one ${label.toLowerCase()} is required`
          : undefined
      }}
      render={({ field, fieldState }) => {
        const selected: string[] = Array.isArray(field.value)
          ? field.value
          : []

        const handleToggle = (value: string) => {
          const next = selected.includes(value)
            ? selected.filter((v) => v !== value)
            : [...selected, value]
          field.onChange(next)
        }

        return (
          <FormControl error={!!fieldState.error} disabled={disabled}>
            <FormLabel>{label}</FormLabel>
            <FormGroup row={row}>
              {options.map((opt) => (
                <FormControlLabel
                  key={opt.value}
                  control={
                    <Checkbox
                      checked={selected.includes(opt.value)}
                      onChange={() => handleToggle(opt.value)}
                      onBlur={field.onBlur}
                    />
                  }
                  label={opt.label}
                />
              ))}
            </FormGroup>
            {fieldState.error && (
              <FormHelperText>{fieldState.error.message}</FormHelperText>
            )}
          </FormControl>
        )
      }}
    />
  )
}

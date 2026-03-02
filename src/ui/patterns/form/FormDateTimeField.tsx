import { Controller, useFormContext } from 'react-hook-form'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import dayjs from 'dayjs'

type FormDateTimeFieldProps = {
  name: string
  label: string
  required?: boolean
  disabled?: boolean
}

export default function FormDateTimeField({
  name,
  label,
  required,
  disabled,
}: FormDateTimeFieldProps) {
  const { control } = useFormContext()

  return (
    <Controller
      name={name}
      control={control}
      rules={{
        required: required ? `${label} is required` : false,
      }}
      render={({ field, fieldState }) => (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DateTimePicker
            label={label}
            value={field.value ? dayjs(field.value) : null}
            onChange={(v) => field.onChange(v?.toISOString() ?? null)}
            disabled={disabled}
            slotProps={{
              textField: {
                fullWidth: true,
                size: 'small',
                error: !!fieldState.error,
                helperText: fieldState.error?.message,
              },
            }}
          />
        </LocalizationProvider>
      )}
    />
  )
}

import { Controller, useFormContext } from 'react-hook-form'
import ImageUploadField from './ImageUploadField'

type FormImageUploadFieldProps = {
  name: string
  label?: string
  required?: boolean
  disabled?: boolean
  maxHeight?: number
}

export default function FormImageUploadField({
  name,
  label,
  required,
  disabled,
  maxHeight
}: FormImageUploadFieldProps) {
  const { control } = useFormContext()

  return (
    <Controller
      name={name}
      control={control}
      rules={{
        required: required ? `${label ?? 'Image'} is required` : false
      }}
      render={({ field }) => (
        <ImageUploadField
          value={field.value}
          onChange={field.onChange}
          label={label}
          disabled={disabled}
          maxHeight={maxHeight}
          required={required}
        />
      )}
    />
  )
}

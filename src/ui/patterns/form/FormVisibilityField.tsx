import { Controller, useFormContext } from 'react-hook-form'
import VisibilityField from './VisibilityField'

type FormVisibilityFieldProps = {
  name: string
  required?: boolean
  disabled?: boolean
  characters?: { id: string; name: string }[]
  allowHidden?: boolean
}

export default function FormVisibilityField({
  name,
  required,
  disabled,
  characters,
  allowHidden
}: FormVisibilityFieldProps) {
  const { control } = useFormContext()

  return (
    <Controller
      name={name}
      control={control}
      rules={{
        validate: required
          ? (v) => {
              if (!v) return 'Visibility is required'
              if (!v.allCharacters && v.characterIds.length === 0)
                return 'Select at least one visibility option'
              return true
            }
          : undefined
      }}
      render={({ field }) => (
        <VisibilityField
          value={field.value ?? { allCharacters: false, characterIds: [] }}
          onChange={field.onChange}
          disabled={disabled}
          characters={characters}
          allowHidden={allowHidden}
        />
      )}
    />
  )
}

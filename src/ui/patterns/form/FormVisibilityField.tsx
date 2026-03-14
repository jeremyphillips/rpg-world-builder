import { Controller, useFormContext } from 'react-hook-form'
import VisibilityField from './VisibilityField'
import type { Visibility } from '@/shared/types/visibility'

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
              if (v.scope === 'restricted' && (v.allowCharacterIds?.length ?? 0) === 0)
                return 'Select at least one visibility option'
              return true
            }
          : undefined
      }}
      render={({ field }) => (
        <VisibilityField
          value={(field.value as Visibility | undefined) ?? { scope: 'public', allowCharacterIds: [] }}
          onChange={field.onChange}
          disabled={disabled}
          characters={characters}
        />
      )}
    />
  )
}

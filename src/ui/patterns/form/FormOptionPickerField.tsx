import { Controller, useFormContext } from 'react-hook-form'
import type { RegisterOptions } from 'react-hook-form'

import OptionPickerField from './OptionPickerField'
import type { PickerOption } from './OptionPickerField'
import { pickerArrayToFormValue, pickerValueToArray } from './optionPickerBridge'

type FormOptionPickerFieldProps = {
  name: string
  label: string
  options: PickerOption[]
  /** When 'scalar', form value is a string (e.g. single id). When 'array', string[]. */
  valueMode?: 'scalar' | 'array'
  maxItems?: number
  placeholder?: string
  disabled?: boolean
  emptyMessage?: string
  noResultsMessage?: string
  renderSelectedAs?: 'chip' | 'card'
  helperText?: string
  rules?: RegisterOptions
}

export default function FormOptionPickerField({
  name,
  label,
  options,
  valueMode = 'array',
  maxItems,
  placeholder,
  disabled,
  emptyMessage,
  noResultsMessage,
  renderSelectedAs,
  helperText,
  rules,
}: FormOptionPickerFieldProps) {
  const { control } = useFormContext()

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => {
        const mergedHelper = fieldState.error?.message ?? helperText
        return (
          <OptionPickerField
            label={label}
            options={options}
            value={pickerValueToArray(field.value, valueMode)}
            onChange={(next) => {
              field.onChange(pickerArrayToFormValue(next, valueMode))
            }}
            onBlur={field.onBlur}
            maxItems={maxItems}
            placeholder={placeholder}
            disabled={disabled}
            emptyMessage={emptyMessage}
            noResultsMessage={noResultsMessage}
            renderSelectedAs={renderSelectedAs}
            helperText={mergedHelper}
            error={Boolean(fieldState.error)}
          />
        )
      }}
    />
  )
}

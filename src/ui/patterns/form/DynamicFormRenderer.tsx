import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import type { FieldConfig } from './form.types'
import DynamicField from './DynamicField'

type DynamicFormRendererProps = {
  fields: FieldConfig[]
  spacing?: number
}

/**
 * Pure rendering layer: takes a FieldConfig[] and renders the
 * correct field primitive for each entry. No business logic,
 * no fetching, no validation rules beyond what FieldConfig carries.
 */
export default function DynamicFormRenderer({
  fields,
  spacing = 3
}: DynamicFormRendererProps) {
  return (
    <Stack spacing={spacing}>
      {fields.map((field) =>
        field.type === 'hidden' ? (
          <DynamicField key={field.name} field={field} />
        ) : (
          <Box key={field.name}>
            <DynamicField field={field} />
          </Box>
        )
      )}
    </Stack>
  )
}

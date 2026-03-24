import { useEffect, useMemo, useRef } from 'react'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { FormSelectField } from '@/ui/patterns'
import {
  buildDefaultCasterOptions,
  type CasterOptionField,
} from '@/features/mechanics/domain/spells/caster-options'
import { ABILITIES } from '@/features/mechanics/domain/character/abilities/abilities'

const ABILITY_SELECT_OPTIONS = ABILITIES.map((a) => ({ label: a.name, value: a.id }))

type CasterOptionsFieldsProps = {
  /** Remount when the selected combat action changes (e.g. action id). */
  formKey: string
  fields: CasterOptionField[]
  value: Record<string, string>
  onChange: (next: Record<string, string>) => void
}

function CasterOptionsFieldsInner({ fields, value, onChange }: Omit<CasterOptionsFieldsProps, 'formKey'>) {
  const defaults = useMemo(() => buildDefaultCasterOptions(fields), [fields])
  const merged = useMemo(() => ({ ...defaults, ...value }), [defaults, value])

  const methods = useForm({ defaultValues: merged, values: merged })
  const watched = useWatch({ control: methods.control })
  const prevJson = useRef('')

  useEffect(() => {
    if (!watched || typeof watched !== 'object') return
    const next = watched as Record<string, string>
    const s = JSON.stringify(next)
    if (s === prevJson.current) return
    prevJson.current = s
    onChange(next)
  }, [watched, onChange])

  return (
    <FormProvider {...methods}>
      <Stack spacing={1.5} sx={{ pt: 1 }}>
        <Typography variant="caption" color="text.secondary">Caster options</Typography>
        {fields.map((field) =>
          field.kind === 'ability' ? (
            <FormSelectField
              key={field.id}
              name={field.id}
              label={field.label}
              options={ABILITY_SELECT_OPTIONS}
              required
            />
          ) : (
            <FormSelectField
              key={field.id}
              name={field.id}
              label={field.label}
              options={field.options.map((o) => ({ label: o.label, value: o.value }))}
              required
            />
          ),
        )}
      </Stack>
    </FormProvider>
  )
}

export function CasterOptionsFields({ formKey, fields, value, onChange }: CasterOptionsFieldsProps) {
  return (
    <CasterOptionsFieldsInner key={formKey} fields={fields} value={value} onChange={onChange} />
  )
}

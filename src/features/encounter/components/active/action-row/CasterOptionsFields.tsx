import { useEffect, useMemo, useRef } from 'react'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { AppFormCheckbox, AppFormSelect } from '@/ui/patterns'
import {
  buildDefaultCasterOptions,
  parseEnumMultiStored,
  serializeEnumMultiStored,
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

type CasterFormValues = Record<string, string | string[]>

function wireCasterFormToRecord(fields: CasterOptionField[], watched: CasterFormValues): Record<string, string> {
  const next: Record<string, string> = {}
  for (const f of fields) {
    if (f.kind === 'enum-multi') {
      const arr = watched[f.id]
      next[f.id] = Array.isArray(arr) ? serializeEnumMultiStored(arr) : ''
    } else {
      const s = watched[f.id]
      next[f.id] = typeof s === 'string' ? s : ''
    }
  }
  return next
}

function CasterOptionsFieldsInner({ fields, value, onChange }: Omit<CasterOptionsFieldsProps, 'formKey'>) {
  const defaults = useMemo(() => buildDefaultCasterOptions(fields), [fields])
  const merged = useMemo(() => {
    const out: CasterFormValues = { ...defaults }
    for (const f of fields) {
      if (f.kind === 'enum-multi') {
        out[f.id] = parseEnumMultiStored(value[f.id] ?? '')
      } else {
        out[f.id] = value[f.id] ?? defaults[f.id] ?? ''
      }
    }
    return out
  }, [defaults, fields, value])

  const methods = useForm<CasterFormValues>({ defaultValues: merged, values: merged })
  const watched = useWatch({ control: methods.control })
  const prevJson = useRef('')

  useEffect(() => {
    if (!watched || typeof watched !== 'object') return
    const next = wireCasterFormToRecord(fields, watched as CasterFormValues)
    const s = JSON.stringify(next)
    if (s === prevJson.current) return
    prevJson.current = s
    onChange(next)
  }, [watched, fields, onChange])

  return (
    <FormProvider {...methods}>
      <Stack spacing={1.5} sx={{ pt: 1 }}>
        <Typography variant="caption" color="text.secondary">Caster options</Typography>
        {fields.map((field) =>
          field.kind === 'ability' ? (
            <AppFormSelect
              key={field.id}
              name={field.id}
              label={field.label}
              options={ABILITY_SELECT_OPTIONS}
              required
            />
          ) : field.kind === 'enum-multi' ? (
            <AppFormCheckbox
              key={field.id}
              name={field.id}
              label={field.label}
              options={field.options.map((o) => ({ label: o.label, value: o.value }))}
              required
            />
          ) : (
            <AppFormSelect
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

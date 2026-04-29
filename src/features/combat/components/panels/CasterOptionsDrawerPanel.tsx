import { useEffect, useMemo, useRef } from 'react'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import {
  AppFormCheckbox,
  AppFormRadioGroup,
  AppFormSelect,
} from '@/ui/patterns'
import {
  buildDefaultCasterOptions,
  parseEnumMultiStored,
  serializeEnumMultiStored,
  type CasterOptionField,
} from '@/features/mechanics/domain/spells/caster-options'
import { ABILITIES } from '@/features/mechanics/domain/character/abilities/abilities'

const ABILITY_SELECT_OPTIONS = ABILITIES.map((a) => ({ label: a.name, value: a.id }))

export type CasterOptionsDrawerPanelProps = {
  formKey: string
  actionLabel: string
  fields: CasterOptionField[]
  value: Record<string, string>
  onChange: (next: Record<string, string>) => void
  onBack: () => void
}

type FormShape = Record<string, string | string[]>

function buildMergedFormValues(
  fields: CasterOptionField[],
  value: Record<string, string>,
): FormShape {
  const defaults = buildDefaultCasterOptions(fields)
  const out: FormShape = {}
  for (const f of fields) {
    if (f.kind === 'enum-multi') {
      out[f.id] = parseEnumMultiStored(value[f.id] ?? '')
    } else {
      out[f.id] = value[f.id] ?? defaults[f.id] ?? ''
    }
  }
  return out
}

function formShapeToWire(fields: CasterOptionField[], watched: FormShape): Record<string, string> {
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

function CasterOptionsDrawerPanelInner({
  actionLabel,
  fields,
  value,
  onChange,
  onBack,
}: Omit<CasterOptionsDrawerPanelProps, 'formKey'>) {
  const merged = useMemo(() => buildMergedFormValues(fields, value), [fields, value])

  const methods = useForm<FormShape>({ defaultValues: merged, values: merged })
  const watched = useWatch({ control: methods.control }) as FormShape | undefined
  const prevJson = useRef('')

  useEffect(() => {
    if (!watched || typeof watched !== 'object') return
    const next = formShapeToWire(fields, watched)
    const s = JSON.stringify(next)
    if (s === prevJson.current) return
    prevJson.current = s
    onChange(next)
  }, [watched, fields, onChange])

  return (
    <FormProvider {...methods}>
      <Stack spacing={2}>
        <Box>
          <Button variant="text" size="small" onClick={onBack} sx={{ mb: 1, px: 0 }}>
            Back
          </Button>
          <Typography component="h2" variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            Spell options
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {actionLabel}
          </Typography>
        </Box>

        <Stack spacing={2} sx={{ pt: 0.5 }}>
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
              <AppFormRadioGroup
                key={field.id}
                name={field.id}
                label={field.label}
                options={field.options.map((o) => ({ label: o.label, value: o.value }))}
                required
              />
            ),
          )}
        </Stack>
      </Stack>
    </FormProvider>
  )
}

export function CasterOptionsDrawerPanel({ formKey, ...rest }: CasterOptionsDrawerPanelProps) {
  return <CasterOptionsDrawerPanelInner key={formKey} {...rest} />
}

import { useEffect, useMemo, useState } from 'react'
import { Controller, type UseFormReturn } from 'react-hook-form'
import type { GameSession, GameSessionStatus } from '../domain/game-session.types'
import type { GameSessionPatch } from '../api/gameSessionApi'
import type { Location } from '@/features/content/locations/domain/types'
import type { PickerOption } from '@/ui/patterns/form/OptionPickerField'
import { ApiError } from '@/app/api'
import AppForm from '@/ui/patterns/form/AppForm'
import FormTextField from '@/ui/patterns/form/FormTextField'
import FormDateTimeField from '@/ui/patterns/form/FormDateTimeField'
import FormSelectField from '@/ui/patterns/form/FormSelectField'
import OptionPickerField from '@/ui/patterns/form/OptionPickerField'
import { AppAlert } from '@/ui/primitives'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

const STATUS_OPTIONS: { value: GameSessionStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'lobby', label: 'Lobby' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const STATUS_SELECT_OPTIONS = STATUS_OPTIONS.map((o) => ({
  label: o.label,
  value: o.value,
}))

type FormValues = {
  title: string
  status: GameSessionStatus
  /** ISO string from FormDateTimeField, or null when cleared */
  scheduledFor: string | null
  locationIds: string[]
  floorId: string
}

function buildDefaults(session: GameSession): FormValues {
  const hasLocation = Boolean(session.location.locationId)
  const floor =
    hasLocation && session.location.floorId && /^\d+$/.test(session.location.floorId)
      ? session.location.floorId
      : '1'
  return {
    title: session.title,
    status: session.status,
    scheduledFor: session.scheduledFor ?? null,
    locationIds: session.location.locationId ? [session.location.locationId] : [],
    floorId: floor,
  }
}

function floorCountForBuilding(buildingId: string, all: Location[]): number {
  const n = all.filter((l) => l.parentId === buildingId && l.scale === 'floor').length
  return Math.max(1, n)
}

type GameSessionSetupFormFieldsProps = {
  methods: UseFormReturn<FormValues>
  canEdit: boolean
  locations: Location[]
  buildingPickerOptions: PickerOption[]
}

function GameSessionSetupFormFields({
  methods,
  canEdit,
  locations,
  buildingPickerOptions,
}: GameSessionSetupFormFieldsProps) {
  const { watch, control, setValue, getValues, formState } = methods

  const locationIds = watch('locationIds')
  const selectedBuildingId = locationIds?.[0]

  const selectedBuilding = useMemo(
    () => (selectedBuildingId ? locations.find((l) => l.id === selectedBuildingId) : undefined),
    [locations, selectedBuildingId],
  )

  const isBuildingLocation = Boolean(selectedBuilding) && selectedBuilding!.scale === 'building'

  const floorCount = useMemo(() => {
    if (!selectedBuildingId || !isBuildingLocation) return 0
    return floorCountForBuilding(selectedBuildingId, locations)
  }, [selectedBuildingId, isBuildingLocation, locations])

  const floorOptions = useMemo(
    () =>
      Array.from({ length: floorCount }, (_, i) => ({
        value: String(i + 1),
        label: `Floor ${i + 1}`,
      })),
    [floorCount],
  )

  useEffect(() => {
    if (!isBuildingLocation || !selectedBuildingId) return
    const max = floorCount
    const current = getValues('floorId')
    const n = current ? Number.parseInt(current, 10) : NaN
    if (!current || Number.isNaN(n) || n < 1 || n > max) {
      setValue('floorId', '1')
    }
  }, [isBuildingLocation, selectedBuildingId, floorCount, getValues, setValue])

  return (
    <>
      <FormTextField name="title" label="Session title" required size="small" disabled={!canEdit} />
      <FormSelectField
        name="status"
        label="Status"
        options={STATUS_SELECT_OPTIONS}
        size="small"
        disabled={!canEdit}
      />
      <FormDateTimeField name="scheduledFor" label="Scheduled start" disabled={!canEdit} />

      <Controller
        name="locationIds"
        control={control}
        defaultValue={[]}
        render={({ field }) => (
          <OptionPickerField
            label="Location (building)"
            options={buildingPickerOptions}
            value={field.value ?? []}
            onChange={field.onChange}
            maxItems={1}
            disabled={!canEdit}
            renderSelectedAs="card"
            placeholder="Search buildings…"
            helperText="Only building-scale locations are listed."
            emptyMessage="No building locations in this campaign."
          />
        )}
      />

      {isBuildingLocation && (
        <FormSelectField name="floorId" label="Floor" options={floorOptions} size="small" disabled={!canEdit} />
      )}

      <Box>
        <Button type="submit" variant="contained" disabled={!canEdit || formState.isSubmitting}>
          {formState.isSubmitting ? 'Saving…' : 'Save'}
        </Button>
      </Box>
    </>
  )
}

type GameSessionSetupViewProps = {
  session: GameSession
  canEdit: boolean
  locations: Location[]
  onSave: (patch: GameSessionPatch) => Promise<void>
}

export function GameSessionSetupView({ session, canEdit, locations, onSave }: GameSessionSetupViewProps) {
  const [saveError, setSaveError] = useState<string | null>(null)

  const buildingPickerOptions: PickerOption[] = useMemo(
    () =>
      locations
        .filter((l) => l.scale === 'building')
        .map((l) => ({
          value: l.id,
          label: l.name,
          description: l.category,
        })),
    [locations],
  )

  return (
    <Stack spacing={2}>
      <Typography variant="h5" component="h1">
        Session setup
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Plan and configure this live session. Changes are saved to the server.
      </Typography>

      {!canEdit && (
        <AppAlert tone="info">
          Only campaign DMs and owners can edit session setup. Players can use the lobby tab to view
          session details.
        </AppAlert>
      )}

      {saveError && (
        <AppAlert tone="danger" onClose={() => setSaveError(null)}>
          {saveError}
        </AppAlert>
      )}

      <Card variant="outlined">
        <CardContent>
          <AppForm<FormValues>
            key={`${session.id}-${session.updatedAt ?? ''}`}
            defaultValues={buildDefaults(session)}
            useFormOptions={{ shouldUnregister: true }}
            spacing={2}
            onSubmit={async (vals) => {
              setSaveError(null)
              if (!canEdit) return
              try {
                const locId = vals.locationIds[0] ?? null
                const building = locId ? locations.find((l) => l.id === locId) : null
                const isBuilding = building?.scale === 'building'
                await onSave({
                  title: vals.title.trim(),
                  status: vals.status,
                  scheduledFor: vals.scheduledFor
                    ? new Date(vals.scheduledFor).toISOString()
                    : null,
                  locationId: locId,
                  locationLabel: null,
                  buildingId: null,
                  floorId: isBuilding ? (vals.floorId || '1') : null,
                })
              } catch (err) {
                if (err instanceof ApiError) {
                  setSaveError(err.message)
                } else {
                  setSaveError('Failed to save')
                }
              }
            }}
          >
            {(methods) => (
              <GameSessionSetupFormFields
                methods={methods}
                canEdit={canEdit}
                locations={locations}
                buildingPickerOptions={buildingPickerOptions}
              />
            )}
          </AppForm>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>
            Participants
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {session.participants.length} participant(s). Join flow and character assignment will
            build on this list later.
          </Typography>
        </CardContent>
      </Card>
    </Stack>
  )
}

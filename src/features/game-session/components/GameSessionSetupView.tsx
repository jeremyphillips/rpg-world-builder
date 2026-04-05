import { useEffect, useMemo, useState } from 'react'
import {
  Controller,
  FormProvider,
  useForm,
  type Control,
  type UseFormReturn,
} from 'react-hook-form'
import CloseIcon from '@mui/icons-material/Close'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { ApiError } from '@/app/api'
import { SelectEncounterOpponentModal } from '@/features/encounter/components'
import type { OpponentOption } from '@/features/encounter/types'
import { LocationSummaryCard } from '@/features/content/locations/components'
import type { Location } from '@/features/content/locations/domain/model/location'
import type { GameSessionPatch } from '../api/gameSessionApi'
import type { GameSession, GameSessionStatus } from '../domain/game-session.types'
import FormDateTimeField from '@/ui/patterns/form/FormDateTimeField'
import FormSelectField from '@/ui/patterns/form/FormSelectField'
import FormTextField from '@/ui/patterns/form/FormTextField'
import {
  ConfirmModal,
  EntitySummaryCard,
  SelectedEntitiesLane,
  SelectEntityModal,
  type SelectEntityOption,
} from '@/ui/patterns'
import { AppAlert, AppAvatar } from '@/ui/primitives'
import { resolveImageUrl } from '@/shared/lib/media'

const STATUS_LABEL: Record<GameSessionStatus, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  lobby: 'In lobby',
  active: 'Active',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

function statusChipColor(
  status: GameSessionStatus,
): 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning' {
  switch (status) {
    case 'draft':
      return 'default'
    case 'scheduled':
      return 'info'
    case 'lobby':
      return 'primary'
    case 'active':
      return 'success'
    case 'completed':
      return 'secondary'
    case 'cancelled':
      return 'error'
    default:
      return 'default'
  }
}

/** Form fields only — lifecycle `status` is set by Save draft / Schedule session / Open now actions. */
type FormValues = {
  title: string
  /** ISO string from FormDateTimeField, or null when cleared */
  scheduledFor: string | null
  locationIds: string[]
  floorId: string
  /** `monster:id` / `npc:id` keys (encounter opponent vocabulary). */
  opponentRefKeys: string[]
}

function buildDefaults(session: GameSession): FormValues {
  const hasLocation = Boolean(session.location.locationId)
  const floor =
    hasLocation && session.location.floorId && /^\d+$/.test(session.location.floorId)
      ? session.location.floorId
      : '1'
  return {
    title: session.title,
    scheduledFor: session.scheduledFor ?? null,
    locationIds: session.location.locationId ? [session.location.locationId] : [],
    floorId: floor,
    opponentRefKeys: [...session.opponentRefKeys],
  }
}

function floorCountForBuilding(buildingId: string, all: Location[]): number {
  const n = all.filter((l) => l.parentId === buildingId && l.scale === 'floor').length
  return Math.max(1, n)
}

type GameSessionBuildingLocationFieldProps = {
  control: Control<FormValues>
  campaignId: string | undefined
  locations: Location[]
  buildingSelectOptions: SelectEntityOption[]
  canEdit: boolean
}

function GameSessionBuildingLocationField({
  control,
  campaignId,
  locations,
  buildingSelectOptions,
  canEdit,
}: GameSessionBuildingLocationFieldProps) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <Controller
      name="locationIds"
      control={control}
      defaultValue={[]}
      render={({ field }) => {
        const selectedId = field.value?.[0]
        const selectedLoc = selectedId ? locations.find((l) => l.id === selectedId) : undefined
        const parentName =
          selectedLoc?.parentId != null
            ? locations.find((p) => p.id === selectedLoc.parentId)?.name
            : undefined

        const detailLink =
          campaignId && selectedId
            ? `/campaigns/${campaignId}/world/locations/${selectedId}`
            : '#'

        return (
          <>
            <SelectedEntitiesLane
              title="Location (building)"
              description="Only building-scale locations are listed."
              actionLabel={selectedId ? 'Change building' : 'Select building'}
              onAction={() => setModalOpen(true)}
              emptyMessage="No building selected yet."
              hasSelection={Boolean(selectedId)}
              actionDisabled={!canEdit}
            >
              {selectedId && selectedLoc?.scale === 'building' ? (
                <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ width: '100%' }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <LocationSummaryCard
                      link={detailLink}
                      name={selectedLoc.name}
                      scale={selectedLoc.scale}
                      imageUrl={
                        selectedLoc.imageKey ? resolveImageUrl(selectedLoc.imageKey) : undefined
                      }
                      parentName={parentName}
                    />
                  </Box>
                  <IconButton
                    size="small"
                    aria-label="Clear building"
                    onClick={() => field.onChange([])}
                    disabled={!canEdit}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ) : selectedId ? (
                <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ width: '100%' }}>
                  <Typography variant="body2" color="error" sx={{ flex: 1 }}>
                    This location is missing or is not a building-scale location.
                  </Typography>
                  <IconButton
                    size="small"
                    aria-label="Clear building"
                    onClick={() => field.onChange([])}
                    disabled={!canEdit}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ) : null}
            </SelectedEntitiesLane>

            <SelectEntityModal
              open={modalOpen}
              onClose={() => setModalOpen(false)}
              headline="Location (building)"
              subheadline="Choose a building for this session."
              options={buildingSelectOptions}
              selectedIds={selectedId ? [selectedId] : []}
              onApply={(ids) => {
                field.onChange(ids.slice(0, 1))
              }}
              maxSelections={1}
              filterPlaceholder="Search buildings…"
              footerNote={
                buildingSelectOptions.length === 0
                  ? 'No building locations in this campaign.'
                  : undefined
              }
            />
          </>
        )
      }}
    />
  )
}

type GameSessionOpponentsFieldProps = {
  control: Control<FormValues>
  monsterSelectOptions: SelectEntityOption[]
  npcSelectOptions: SelectEntityOption[]
  opponentOptionsByKey: Record<string, OpponentOption>
  canEdit: boolean
}

function GameSessionOpponentsField({
  control,
  monsterSelectOptions,
  npcSelectOptions,
  opponentOptionsByKey,
  canEdit,
}: GameSessionOpponentsFieldProps) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <Controller
      name="opponentRefKeys"
      control={control}
      defaultValue={[]}
      render={({ field }) => {
        const keys = field.value ?? []
        return (
          <>
            <SelectedEntitiesLane
              title="Monsters"
              description="Choose monsters and NPCs from the campaign catalog (same sources as encounter opponent selection)."
              actionLabel={keys.length > 0 ? 'Edit monsters & NPCs' : 'Add monsters & NPCs'}
              onAction={() => setModalOpen(true)}
              emptyMessage="No monsters or NPCs selected yet."
              hasSelection={keys.length > 0}
              actionDisabled={!canEdit}
            >
              <Stack spacing={1.5} sx={{ width: '100%' }}>
                {keys.map((key) => {
                  const opt = opponentOptionsByKey[key]
                  return (
                    <Paper key={key} variant="outlined" sx={{ p: 1.5 }}>
                      <Stack direction="row" alignItems="flex-start" spacing={1}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          {opt ? (
                            <EntitySummaryCard
                              avatar={
                                <AppAvatar
                                  src={resolveImageUrl(opt.imageKey ?? opt.imageUrl)}
                                  name={opt.label}
                                  size="sm"
                                />
                              }
                              title={opt.label}
                              subtitle={opt.subtitle}
                              titleVariant="body2"
                            />
                          ) : (
                            <Typography variant="body2" color="error">
                              Unknown entry: {key}
                            </Typography>
                          )}
                        </Box>
                        <IconButton
                          size="small"
                          aria-label="Remove from list"
                          onClick={() => field.onChange(keys.filter((k) => k !== key))}
                          disabled={!canEdit}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Paper>
                  )
                })}
              </Stack>
            </SelectedEntitiesLane>

            <SelectEncounterOpponentModal
              open={modalOpen}
              onClose={() => setModalOpen(false)}
              headline="Select monsters & NPCs"
              monsterOptions={monsterSelectOptions}
              npcOptions={npcSelectOptions}
              selectedOpponentKeys={keys}
              onApply={(next) => {
                field.onChange(next)
              }}
            />
          </>
        )
      }}
    />
  )
}

function buildPatch(
  vals: FormValues,
  locations: Location[],
  status: GameSessionStatus,
): GameSessionPatch {
  const locId = vals.locationIds[0] ?? null
  const building = locId ? locations.find((l) => l.id === locId) : null
  const isBuilding = building?.scale === 'building'
  return {
    title: vals.title.trim(),
    status,
    scheduledFor: vals.scheduledFor ? new Date(vals.scheduledFor).toISOString() : null,
    locationId: locId,
    locationLabel: null,
    buildingId: null,
    floorId: isBuilding ? (vals.floorId || '1') : null,
    opponentRefKeys: vals.opponentRefKeys,
  }
}

type GameSessionSetupFormFieldsProps = {
  methods: UseFormReturn<FormValues>
  sessionStatus: GameSessionStatus
  canEdit: boolean
  campaignId: string | undefined
  locations: Location[]
  buildingSelectOptions: SelectEntityOption[]
  monsterSelectOptions: SelectEntityOption[]
  npcSelectOptions: SelectEntityOption[]
  opponentOptionsByKey: Record<string, OpponentOption>
  saving: boolean
  onSaveDraft: () => void
  onScheduleSession: () => void
  onOpenNow: () => void
}

function GameSessionSetupFormFields({
  methods,
  sessionStatus,
  canEdit,
  campaignId,
  locations,
  buildingSelectOptions,
  monsterSelectOptions,
  npcSelectOptions,
  opponentOptionsByKey,
  saving,
  onSaveDraft,
  onScheduleSession,
  onOpenNow,
}: GameSessionSetupFormFieldsProps) {
  const { watch, control, setValue, getValues } = methods

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
      <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          Current status
        </Typography>
        <Chip
          size="small"
          label={STATUS_LABEL[sessionStatus]}
          color={statusChipColor(sessionStatus)}
          variant={sessionStatus === 'draft' ? 'outlined' : 'filled'}
        />
      </Stack>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
        Use the buttons below to save a draft, schedule with a start time, or open the session to the
        lobby now. Status is updated by those actions, not by a separate control.
      </Typography>

      <FormTextField name="title" label="Session title" required size="small" disabled={!canEdit} />
      <FormDateTimeField name="scheduledFor" label="Scheduled start" disabled={!canEdit} />
      <Typography variant="caption" color="text.secondary" display="block">
        Planned start is for display and planning only. The lobby does not open automatically at this
        time — use Open now when you are ready to gather players.
      </Typography>

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems="stretch"
        sx={{ width: '100%' }}
      >
        <Box sx={{ flex: { md: 1 }, minWidth: 0 }}>
          <Stack spacing={2}>
            <GameSessionBuildingLocationField
              control={control}
              campaignId={campaignId}
              locations={locations}
              buildingSelectOptions={buildingSelectOptions}
              canEdit={canEdit}
            />
            {isBuildingLocation && (
              <FormSelectField
                name="floorId"
                label="Floor"
                options={floorOptions}
                size="small"
                disabled={!canEdit}
              />
            )}
          </Stack>
        </Box>
        <Box sx={{ flex: { md: 1 }, minWidth: 0 }}>
          <GameSessionOpponentsField
            control={control}
            monsterSelectOptions={monsterSelectOptions}
            npcSelectOptions={npcSelectOptions}
            opponentOptionsByKey={opponentOptionsByKey}
            canEdit={canEdit}
          />
        </Box>
      </Stack>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ pt: 1 }}>
        <Button
          type="button"
          variant="outlined"
          disabled={!canEdit || saving}
          onClick={onSaveDraft}
        >
          {saving ? 'Saving…' : 'Save draft'}
        </Button>
        <Button
          type="button"
          variant="contained"
          color="primary"
          disabled={!canEdit || saving}
          onClick={onScheduleSession}
        >
          {saving ? 'Saving…' : 'Schedule session'}
        </Button>
        <Button
          type="button"
          variant="contained"
          color="secondary"
          disabled={!canEdit || saving}
          onClick={onOpenNow}
        >
          {saving ? 'Saving…' : 'Open now'}
        </Button>
      </Stack>
    </>
  )
}

type GameSessionSetupViewProps = {
  session: GameSession
  canEdit: boolean
  /** Campaign id for location detail links in the building summary card. */
  campaignId: string | undefined
  locations: Location[]
  monsterSelectOptions: SelectEntityOption[]
  npcSelectOptions: SelectEntityOption[]
  opponentOptionsByKey: Record<string, OpponentOption>
  onSave: (patch: GameSessionPatch) => Promise<void>
  /** Permanently delete this session (campaign owner / platform admin route + API). */
  onDelete: () => Promise<void>
}

export function GameSessionSetupView({
  session,
  canEdit,
  campaignId,
  locations,
  monsterSelectOptions,
  npcSelectOptions,
  opponentOptionsByKey,
  onSave,
  onDelete,
}: GameSessionSetupViewProps) {
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const methods = useForm<FormValues>({
    shouldUnregister: true,
    defaultValues: buildDefaults(session),
  })

  const { reset, getValues } = methods

  useEffect(() => {
    reset(buildDefaults(session))
  }, [session, reset])

  const buildingSelectOptions: SelectEntityOption[] = useMemo(
    () =>
      locations
        .filter((l) => l.scale === 'building')
        .map((l) => ({
          id: l.id,
          label: l.name,
          subtitle: l.category,
          imageKey: l.imageKey ?? null,
        })),
    [locations],
  )

  async function runAction(status: GameSessionStatus, validate: () => string | null) {
    setSaveError(null)
    if (!canEdit) return
    const err = validate()
    if (err) {
      setSaveError(err)
      return
    }
    setSaving(true)
    try {
      const vals = getValues()
      await onSave(buildPatch(vals, locations, status))
    } catch (e) {
      if (e instanceof ApiError) {
        setSaveError(e.message)
      } else {
        setSaveError('Failed to save')
      }
    } finally {
      setSaving(false)
    }
  }

  const onSaveDraft = () =>
    runAction('draft', () => {
      const title = (getValues('title') ?? '').trim()
      if (!title) return 'Session title is required.'
      return null
    })

  const onScheduleSession = () =>
    runAction('scheduled', () => {
      const title = (getValues('title') ?? '').trim()
      if (!title) return 'Session title is required.'
      if (!getValues('scheduledFor')) return 'Set a scheduled start time to schedule this session.'
      return null
    })

  const onOpenNow = () =>
    runAction('lobby', () => {
      const title = (getValues('title') ?? '').trim()
      if (!title) return 'Session title is required.'
      return null
    })

  async function handleConfirmDelete() {
    setDeleteError(null)
    setDeleting(true)
    try {
      await onDelete()
      setDeleteConfirmOpen(false)
    } catch (e) {
      if (e instanceof ApiError) {
        setDeleteError(e.message)
      } else {
        setDeleteError('Failed to delete session')
      }
    } finally {
      setDeleting(false)
    }
  }

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

      {deleteError && (
        <AppAlert tone="danger" onClose={() => setDeleteError(null)}>
          {deleteError}
        </AppAlert>
      )}

      <Card variant="outlined">
        <CardContent>
          <FormProvider {...methods}>
            <Box
              component="form"
              onSubmit={(e) => {
                e.preventDefault()
              }}
            >
              <Stack spacing={2}>
                <GameSessionSetupFormFields
                  methods={methods}
                  sessionStatus={session.status}
                  canEdit={canEdit}
                  campaignId={campaignId}
                  locations={locations}
                  buildingSelectOptions={buildingSelectOptions}
                  monsterSelectOptions={monsterSelectOptions}
                  npcSelectOptions={npcSelectOptions}
                  opponentOptionsByKey={opponentOptionsByKey}
                  saving={saving}
                  onSaveDraft={onSaveDraft}
                  onScheduleSession={onScheduleSession}
                  onOpenNow={onOpenNow}
                />
              </Stack>
            </Box>
          </FormProvider>
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

      {canEdit && (
        <Card variant="outlined" sx={{ borderColor: 'error.light' }}>
          <CardContent>
            <Typography variant="subtitle2" color="error" gutterBottom>
              Danger zone
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Permanently delete this game session and any linked active encounter data. This cannot be
              undone.
            </Typography>
            <Button
              type="button"
              variant="outlined"
              color="error"
              disabled={saving || deleting}
              onClick={() => {
                setDeleteError(null)
                setDeleteConfirmOpen(true)
              }}
            >
              Delete session
            </Button>
          </CardContent>
        </Card>
      )}

      <ConfirmModal
        open={deleteConfirmOpen}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={() => void handleConfirmDelete()}
        headline="Delete this game session?"
        description={`“${session.title}” will be removed permanently, including any linked combat encounter.`}
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        cancelLabel="Cancel"
        confirmColor="error"
        loading={deleting}
        size="compact"
      />
    </Stack>
  )
}

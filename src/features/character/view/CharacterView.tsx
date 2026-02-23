import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CharacterDoc } from '@/shared'
import type { EditionId } from '@/data'
import { editions, equipment } from '@/data'
import { getMagicItemBudget } from '@/features/equipment/domain'
import { resolveEquipmentEdition } from '@/features/equipment/domain'
import type { MagicItem, MagicItemEditionDatum } from '@/data/equipment/magicItems.types'
import { ROUTES } from '@/app/routes'
import { useCharacterBuilder } from '@/features/characterBuilder/context'
import { CharacterBuilderWizard } from '@/features/characterBuilder/components'
import { AppModal } from '@/ui/modals'
import type { StepId } from '@/features/characterBuilder/types'
import { getProficiencySlotSummary } from '@/features/character/domain/validation'
import type { CampaignSummary, PendingMembership } from '@/shared/types/campaign.types'
import type { 
  CharacterNarrative, 
  UseCharacterActionsReturn 
} from '@/features/character/hooks'

import {
  CharacterAlerts,
  IdentityBanner,
  AbilityScoresCard,
  CombatStatsCard,
  ProficienciesCard,
  EquipmentCard,
  MagicItemsCard,
  ClassFeaturesCard,
  SpellsCard,
  NarrativeCard
} from './sections'

import { CharacterModalManager } from '@/features/character/modals'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import Alert from '@mui/material/Alert'


// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CharacterViewProps = {
  character: CharacterDoc
  campaigns: CampaignSummary[]
  pendingMemberships: PendingMembership[]
  isOwner: boolean
  /** True when the current user is a campaign admin (DM) for one of this character's campaigns. */
  isAdmin: boolean
  /** True when the current user is a platform admin or superadmin. */
  isPlatformAdmin?: boolean
  ownerName?: string
  error: string | null
  success: string | null
  setError: React.Dispatch<React.SetStateAction<string | null>>

  // Form state
  name: string
  imageKey: string | null
  setImageKey: React.Dispatch<React.SetStateAction<string | null>>
  narrative: CharacterNarrative
  race: string
  alignment: string
  totalLevel: number
  alignmentOptions: { id: string; label: string }[]
  raceOptions: { id: string; label: string }[]

  // Actions
  actions: UseCharacterActionsReturn

  // Breadcrumbs
  breadcrumbs: { label: string; to?: string }[]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CharacterView({
  character,
  campaigns,
  pendingMemberships,
  isOwner,
  isAdmin,
  isPlatformAdmin = false,
  ownerName,
  error,
  success,
  setError,
  name,
  imageKey,
  setImageKey,
  narrative,
  race,
  alignment,
  totalLevel,
  alignmentOptions,
  raceOptions,
  actions
}: CharacterViewProps) {
  const navigate = useNavigate()

  // ── UI toggle state ────────────────────────────────────────────────
  const [awardXpOpen, setAwardXpOpen] = useState(false)
  const [levelUpOpen, setLevelUpOpen] = useState(false)
  const [cancelLevelUpOpen, setCancelLevelUpOpen] = useState(false)
  const [statusAction, setStatusAction] = useState<{
    campaignMemberId: string
    campaignName: string
    newStatus: 'inactive' | 'deceased'
  } | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editWealthOpen, setEditWealthOpen] = useState(false)

  // ── Single-step edit via builder ────────────────────────────────────
  const [editingStep, setEditingStep] = useState<StepId | null>(null)
  const { state: builderState, loadCharacterIntoBuilder, resetState: resetBuilder } = useCharacterBuilder()

  const STEP_FIELDS: Partial<Record<StepId, (s: typeof builderState) => Record<string, unknown>>> = {
    alignment: (s) => ({ alignment: s.alignment }),
    equipment: (s) => ({ equipment: s.equipment, wealth: s.wealth }),
    magicItems: (s) => ({ equipment: s.equipment }),
    proficiencies: (s) => ({ proficiencies: s.proficiencies }),
  }

  const profSlots = useMemo(
    () => getProficiencySlotSummary(character.classes, character.edition, character.proficiencies),
    [character.classes, character.edition, character.proficiencies],
  )

  const openStepEditor = useCallback((stepId: StepId) => {
    loadCharacterIntoBuilder(character, stepId)
    setEditingStep(stepId)
  }, [character, loadCharacterIntoBuilder])

  const handleStepSave = useCallback(async () => {
    if (!editingStep) return
    const extractor = STEP_FIELDS[editingStep]
    if (!extractor) return
    await actions.saveCharacter(extractor(builderState))
    setEditingStep(null)
    resetBuilder()
  }, [editingStep, builderState, actions, resetBuilder])

  const handleStepCancel = useCallback(() => {
    setEditingStep(null)
    resetBuilder()
  }, [resetBuilder])

  // ── Derived values ─────────────────────────────────────────────────
  const canEditAll = isAdmin || isPlatformAdmin
  const canEdit = isOwner || isAdmin || isPlatformAdmin
  const activeCampaignCount = campaigns.filter(c => (c.characterStatus ?? 'active') === 'active').length

  const filledClasses = (character.classes ?? []).filter((c) => c.classId)
  const isMulticlass = filledClasses.length > 1
  const currentLevel = character.totalLevel ?? character.level ?? 1
  const primaryClassId = filledClasses[0]?.classId
  const editionObj = editions.find(e => e.id === character.edition)
  const maxLevel = editionObj?.progression?.maxLevel ?? 20

  const hasStats = character.abilityScores && Object.values(character.abilityScores).some(v => v != null)

  // Magic items
  const charMagicItemIds = character.equipment?.magicItems ?? []
  const effectiveEdition = character.edition ? resolveEquipmentEdition(character.edition) : undefined
  const magicItemBudget = getMagicItemBudget(character.edition as EditionId, currentLevel)

  const resolvedMagicItems = charMagicItemIds
    .map(itemId => {
      const item = equipment.magicItems.find((m: MagicItem) => m.id === itemId)
      if (!item) return null
      const datum = effectiveEdition
        ? item.editionData.find((d: MagicItemEditionDatum) => d.edition === effectiveEdition)
        : undefined
      return { item, datum }
    })
    .filter(Boolean) as { item: MagicItem; datum?: MagicItemEditionDatum }[]

  const permanentMagicCount = resolvedMagicItems.filter(r => !r.item.consumable).length
  const consumableMagicCount = resolvedMagicItems.filter(r => r.item.consumable).length

  // ── Modal-closing action wrappers ──────────────────────────────────
  const onCancelLevelUp = async () => {
    await actions.handleCancelLevelUp(currentLevel, primaryClassId)
    setCancelLevelUpOpen(false)
  }

  const onStatusChange = async () => {
    if (!statusAction) return
    await actions.handleCharacterStatusChange(statusAction)
    setStatusAction(null)
  }

  const onDeleteCharacter = async () => {
    try {
      await actions.handleDeleteCharacter()
      navigate(ROUTES.CHARACTERS)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete character')
      setDeleteOpen(false)
    }
  }

  const onEditWealthSave = async (wealth: { gp: number; sp: number; cp: number }) => {
    const currentBaseGp = character.wealth?.baseGp ?? 0
    const newBaseGp = Math.max(currentBaseGp, wealth.gp)
    await actions.saveCharacter({
      wealth: { ...character.wealth, gp: wealth.gp, sp: wealth.sp, cp: wealth.cp, baseGp: newBaseGp },
    })
  }

  return (
    <Box sx={{ maxWidth: 920, mx: 'auto' }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {/* Alerts: pending approvals + level-up banner */}
      <CharacterAlerts
        character={character}
        pendingMemberships={pendingMemberships}
        isOwner={isOwner}
        isAdmin={canEditAll}
        ownerName={ownerName}
        approvingId={actions.approvingId}
        onApprove={actions.handleApprove}
        onReject={actions.handleReject}
        onBeginLevelUp={() => setLevelUpOpen(true)}
        onCancelLevelUp={() => setCancelLevelUpOpen(true)}
      />

      {/* Identity banner */}
      <IdentityBanner
        character={character}
        filledClasses={filledClasses}
        campaigns={campaigns}
        imageKey={imageKey}
        name={name}
        totalLevel={totalLevel}
        alignmentOptions={alignmentOptions}
        raceOptions={raceOptions}
        canEdit={canEdit}
        canEditAll={canEditAll}
        isOwner={isOwner}
        isAdmin={isAdmin}
        onSave={actions.saveCharacter}
        onSetImageKey={setImageKey}
        onAwardXpOpen={() => setAwardXpOpen(true)}
        onSetStatusAction={setStatusAction}
        onReactivate={actions.handleReactivate}
        onEditAlignment={canEdit ? () => openStepEditor('alignment') : undefined}
      />

      {/* Row 2: Ability Scores | Combat + Class Stats | Proficiencies */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {hasStats && (
          <Grid size={{ xs: 12, md: 2 }}>
            <AbilityScoresCard abilityScores={character.abilityScores!} />
          </Grid>
        )}
        <Grid size={{ xs: 12, md: hasStats ? 6 : 7 }}>
          <CombatStatsCard
            character={character}
            filledClasses={filledClasses}
            isMulticlass={isMulticlass}
            canEdit={canEdit}
            canEditAll={canEditAll}
            race={race}
            alignment={alignment}
            raceOptions={raceOptions}
            alignmentOptions={alignmentOptions}
            onSave={actions.saveCharacter}
          />
        </Grid>
        <Grid size={{ xs: 12, md: hasStats ? 4 : 5 }}>
          <ProficienciesCard
            proficiencies={character.proficiencies}
            wealth={character.wealth}
            edition={character.edition}
            onEdit={canEdit ? () => openStepEditor('proficiencies') : undefined}
            editDisabled={!profSlots.hasAvailableSlots || profSlots.allFilled}
            onEditWealth={canEditAll ? () => setEditWealthOpen(true) : undefined}
          />
        </Grid>
      </Grid>

      {/* Row 3: Equipment | Magic Items */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <EquipmentCard
            equipment={character.equipment}
            onEdit={canEdit ? () => openStepEditor('equipment') : undefined}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <MagicItemsCard
            resolvedMagicItems={resolvedMagicItems}
            magicItemBudget={magicItemBudget}
            permanentCount={permanentMagicCount}
            consumableCount={consumableMagicCount}
            onEdit={canEdit ? () => openStepEditor('magicItems') : undefined}
          />
        </Grid>
      </Grid>

      {/* Class Features */}
      <ClassFeaturesCard
        character={character}
        filledClasses={filledClasses}
        isMulticlass={isMulticlass}
      />

      {/* Spells */}
      <SpellsCard
        spells={character.spells ?? []}
        edition={character.edition}
      />

      {/* Narrative */}
      {narrative && (
        <NarrativeCard
          narrative={narrative}
          canEdit={canEdit}
          onSave={actions.saveCharacter}
        />
      )}

      {/* Delete character (owner only) */}
      {isOwner && (
        <Box sx={{ mt: 4, mb: 2 }}>
          <Divider sx={{ mb: 3 }} />
          <Button
            variant="text"
            color="error"
            onClick={() => setDeleteOpen(true)}
          >
            Delete Character
          </Button>
        </Box>
      )}

      {/* Modals */}
      <CharacterModalManager
        character={character}
        currentLevel={currentLevel}
        maxLevel={maxLevel}
        primaryClassId={primaryClassId}
        activeCampaignCount={activeCampaignCount}
        isOwner={isOwner}
        isAdmin={isAdmin}
        awardXpOpen={awardXpOpen}
        onAwardXpClose={() => setAwardXpOpen(false)}
        onAwardXp={actions.handleAwardXp}
        levelUpOpen={levelUpOpen}
        onLevelUpClose={() => setLevelUpOpen(false)}
        onLevelUpComplete={actions.handleLevelUpComplete}
        cancelLevelUpOpen={cancelLevelUpOpen}
        onCancelLevelUpClose={() => setCancelLevelUpOpen(false)}
        onCancelLevelUp={onCancelLevelUp}
        deleteOpen={deleteOpen}
        onDeleteClose={() => setDeleteOpen(false)}
        onDeleteConfirm={onDeleteCharacter}
        statusAction={statusAction}
        onStatusActionClose={() => setStatusAction(null)}
        onStatusActionConfirm={onStatusChange}
        editWealthOpen={editWealthOpen}
        onEditWealthClose={() => setEditWealthOpen(false)}
        onEditWealthSave={onEditWealthSave}
      />

      {/* Single-step edit modal — reuses CharacterBuilderWizard in edit mode */}
      <AppModal
        open={!!editingStep}
        onClose={handleStepCancel}
        headline={`Edit ${editingStep ? editingStep.charAt(0).toUpperCase() + editingStep.slice(1) : ''}`}
      >
        <CharacterBuilderWizard
          editStepId={editingStep ?? undefined}
          onSave={handleStepSave}
          onCancel={handleStepCancel}
          onGenerate={() => {}}
        >
          {({ content, actions: wizardActions }) => (
            <Box>
              {content}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                {wizardActions}
              </Box>
            </Box>
          )}
        </CharacterBuilderWizard>
      </AppModal>
    </Box>
  )
}

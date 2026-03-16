import { useEffect, useMemo, useRef, type ReactNode } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'

import { AppBadge } from '@/ui/primitives'
import { PresentableEffectsHeaderChips, PresentableEffectsList } from './PresentableEffectsList'
import { useCampaignRules } from '@/app/providers/CampaignRulesProvider'
import { useCharacter, useCombatStats } from '@/features/character/hooks'
import { toCharacterForEngine, type CharacterDetailDto } from '@/features/character/read-model'
import { calculateMonsterArmorClass } from '@/features/content/monsters/domain/mechanics/calculateMonsterArmorClass'
import type { Monster } from '@/features/content/monsters/domain/types'
import type { Spell } from '@/features/content/spells/domain/types/spell.types'
import { formatHitPointsWithAverage, formatMovement } from '@/features/content/monsters/utils/formatters'
import {
  buildActiveMonsterEffects,
  buildMonsterContextTriggers,
  buildMonsterTurnHooks,
  monsterHasFormTriggers,
  monsterSupportedManualTriggers,
  type ManualEnvironmentContext,
  type ManualMonsterTriggerContext,
  type MonsterFormContext,
  type CombatantAttackEntry,
  type CombatantInstance,
  type CombatantSide,
} from '@/features/mechanics/domain/encounter'
import {
  buildSpellCombatActions,
  getCharacterSpellcastingStats,
  buildCharacterCombatantInstance,
  buildMonsterExecutableActions,
  buildMonsterAttackEntries,
  buildMonsterCombatantInstance,
  buildMonsterEffectLabels,
  buildTurnHooksFromEffects,
  formatCharacterSubtitle,
  formatEffectLabel,
  formatMonsterOptionSubtitle,
  formatSigned,
  toAbilityModifier,
} from '../helpers'

function StatChips({
  items,
}: {
  items: { label: string; value: string | number }[]
}) {
  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      {items.map((item) => (
        <AppBadge
          key={item.label}
          label={`${item.label}: ${item.value}`}
          tone="default"
          variant="outlined"
          size="small"
        />
      ))}
    </Stack>
  )
}

function AttackList({
  attacks,
}: {
  attacks: CombatantAttackEntry[]
}) {
  if (attacks.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No attack entries loaded yet.
      </Typography>
    )
  }

  return (
    <Stack spacing={1}>
      {attacks.map((attack) => (
        <Box
          key={attack.id}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            p: 1.25,
            bgcolor: 'background.default',
          }}
        >
          <Stack direction="row" justifyContent="space-between" spacing={1} flexWrap="wrap" useFlexGap>
            <Typography variant="body2" fontWeight={600}>
              {attack.name}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {typeof attack.attackBonus === 'number' && (
                <AppBadge label={`To hit ${formatSigned(attack.attackBonus)}`} tone="default" size="small" />
              )}
              {attack.damage && (
                <AppBadge
                  label={
                    attack.damageType
                      ? `${attack.damage} ${attack.damageType}`
                      : attack.damage
                  }
                  tone="default"
                  variant="outlined"
                  size="small"
                />
              )}
            </Stack>
          </Stack>
          {attack.notes && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block' }}>
              {attack.notes}
            </Typography>
          )}
        </Box>
      ))}
    </Stack>
  )
}

type ActiveActionControlsProps = {
  availableActions: { id: string; label: string; resolutionMode: string; kind: string }[]
  availableTargets: { id: string; label: string }[]
  selectedActionId: string
  onSelectedActionIdChange: (value: string) => void
  selectedTargetId: string
  onSelectedTargetIdChange: (value: string) => void
  onResolveAction: () => void
}

function ActiveActionControls({
  availableActions,
  availableTargets,
  selectedActionId,
  onSelectedActionIdChange,
  selectedTargetId,
  onSelectedTargetIdChange,
  onResolveAction,
}: ActiveActionControlsProps) {
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Turn Action
      </Typography>
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {availableActions.length > 0 ? (
            availableActions.map((action) => (
              <AppBadge
                key={action.id}
                label={`${action.label} (${action.kind.replaceAll('_', ' ')})`}
                size="small"
                tone={action.id === selectedActionId ? 'primary' : 'default'}
                variant={action.id === selectedActionId ? 'filled' : 'outlined'}
              />
            ))
          ) : (
            <AppBadge label="No actions available" tone="default" variant="outlined" size="small" />
          )}
        </Stack>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            select
            fullWidth
            label="Action"
            value={selectedActionId}
            onChange={(event) => onSelectedActionIdChange(event.target.value)}
            disabled={availableActions.length === 0}
            size="small"
          >
            {availableActions.map((action) => (
              <MenuItem key={action.id} value={action.id}>
                {action.label} ({action.kind.replaceAll('_', ' ')}, {action.resolutionMode.replaceAll('_', ' ')})
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            fullWidth
            label="Target"
            value={selectedTargetId}
            onChange={(event) => onSelectedTargetIdChange(event.target.value)}
            disabled={availableTargets.length === 0}
            size="small"
          >
            {availableTargets.map((target) => (
              <MenuItem key={target.id} value={target.id}>
                {target.label}
              </MenuItem>
            ))}
          </TextField>
          <Button
            variant="contained"
            onClick={onResolveAction}
            disabled={!selectedActionId || availableActions.length === 0 || availableTargets.length === 0}
          >
            Resolve Action
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}

function EffectList({
  labels,
}: {
  labels: string[]
}) {
  if (labels.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No active effects surfaced yet.
      </Typography>
    )
  }

  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      {labels.map((label, index) => (
        <AppBadge key={`${label}-${index}`} label={label} tone="default" variant="outlined" size="small" />
      ))}
    </Stack>
  )
}

function ContextTriggerList({
  triggers,
}: {
  triggers: { id: string; traitName: string; label: string; status: 'matched' | 'inactive' | 'manual' }[]
}) {
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Deferred Triggers
      </Typography>
      {triggers.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          None.
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {triggers.map((trigger) => (
            <Paper key={trigger.id} variant="outlined" sx={{ p: 1.25 }}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <AppBadge label={trigger.traitName} tone="default" variant="outlined" size="small" />
                <AppBadge label={trigger.label} tone="primary" variant="outlined" size="small" />
                <AppBadge
                  label={
                    trigger.status === 'matched'
                      ? 'Matched by context'
                      : trigger.status === 'inactive'
                        ? 'Context not met'
                        : 'Manual event'
                  }
                  tone={trigger.status === 'matched' ? 'success' : trigger.status === 'inactive' ? 'default' : 'warning'}
                  variant="outlined"
                  size="small"
                />
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  )
}

function triggerButtonLabel(trigger: keyof ManualMonsterTriggerContext): string {
  switch (trigger) {
    case 'allyNearTarget':
      return 'Ally Near Target'
    case 'contact':
      return 'Contact'
    case 'movingGrappledCreature':
      return 'Moving Grappled Creature'
  }
}

export function CharacterCombatantCard({
  runtimeId,
  characterId,
  side,
  sourceKind,
  runtimeCombatant,
  onResolved,
  onRemove,
  onPassTurn,
  isActive = false,
  activeActionControls,
}: {
  runtimeId: string
  characterId: string
  side: CombatantSide
  sourceKind: 'pc' | 'npc'
  runtimeCombatant?: CombatantInstance
  onResolved: (combatant: CombatantInstance | null) => void
  onRemove: () => void
  onPassTurn: () => void
  isActive?: boolean
  activeActionControls?: ActiveActionControlsProps
}) {
  const { character, loading, error } = useCharacter(characterId)
  const onResolvedRef = useRef(onResolved)
  onResolvedRef.current = onResolved

  useEffect(() => {
    if (!loading && !character) {
      onResolvedRef.current(null)
    }
  }, [character, loading])

  if (loading) {
    return (
      <Paper sx={{ p: 2.5 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <CircularProgress size={18} />
          <Typography variant="body2" color="text.secondary">
            Loading {sourceKind === 'pc' ? 'party member' : 'NPC'}…
          </Typography>
        </Stack>
      </Paper>
    )
  }

  if (!character) {
    return (
      <Paper sx={{ p: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <Typography variant="body2" color="error">
            {error ?? 'Character could not be loaded.'}
          </Typography>
          <Button size="small" color="inherit" onClick={onRemove} startIcon={<DeleteOutlineIcon />}>
            Remove
          </Button>
        </Stack>
      </Paper>
    )
  }

  return (
    <LoadedCharacterCombatantCard
      runtimeId={runtimeId}
      side={side}
      character={character}
      sourceKind={sourceKind}
      runtimeCombatant={runtimeCombatant}
      onResolved={onResolved}
      onRemove={onRemove}
      onPassTurn={onPassTurn}
      isActive={isActive}
      activeActionControls={activeActionControls}
    />
  )
}

function LoadedCharacterCombatantCard({
  runtimeId,
  side,
  character,
  sourceKind,
  runtimeCombatant,
  onResolved,
  onRemove,
  onPassTurn,
  isActive = false,
  activeActionControls,
}: {
  runtimeId: string
  side: CombatantSide
  character: CharacterDetailDto
  sourceKind: 'pc' | 'npc'
  runtimeCombatant?: CombatantInstance
  onResolved: (combatant: CombatantInstance) => void
  onRemove: () => void
  onPassTurn: () => void
  isActive?: boolean
  activeActionControls?: ActiveActionControlsProps
}) {
  const { catalog } = useCampaignRules()
  const engineCharacter = useMemo(() => toCharacterForEngine(character), [character])
  const combatStats = useCombatStats(engineCharacter)
  const effectLabels = useMemo(
    () => combatStats.activeEffects.map((effect) => effect.text ?? formatEffectLabel(effect)),
    [combatStats.activeEffects],
  )
  const attacks = useMemo<CombatantAttackEntry[]>(
    () =>
      combatStats.attacks.map((attack) => ({
        id: `${character.id}-${attack.weaponId}-${attack.hand}`,
        name: attack.name,
        attackBonus: attack.attackBonus,
        attackBreakdown: attack.attackBreakdown,
        damage: attack.damage,
        damageType: attack.damageType,
        damageBreakdown: attack.damageBreakdown,
      })),
    [character.id, combatStats.attacks],
  )
  const turnHooks = useMemo(
    () => buildTurnHooksFromEffects(combatStats.activeEffects),
    [combatStats.activeEffects],
  )
  const spellStats = useMemo(
    () => getCharacterSpellcastingStats(character),
    [character],
  )
  const spellActions = useMemo(
    () =>
      buildSpellCombatActions({
        runtimeId,
        spellIds: character.spells,
        spellsById: catalog.spellsById as Record<string, Spell>,
        spellSaveDc: spellStats.spellSaveDc,
        spellAttackBonus: spellStats.spellAttackBonus,
        casterLevel: character.level ?? 1,
      }),
    [catalog.spellsById, character.spells, character.level, runtimeId, spellStats],
  )
  const combatant = useMemo(
    () =>
      buildCharacterCombatantInstance({
        runtimeId,
        side,
        sourceKind,
        character,
        combatStats,
        attacks,
        extraActions: spellActions,
        turnHooks,
      }),
    [attacks, character, combatStats, runtimeId, side, sourceKind, spellActions, turnHooks],
  )
  const onResolvedRef = useRef(onResolved)
  onResolvedRef.current = onResolved

  useEffect(() => {
    onResolvedRef.current(combatant)
  }, [combatant])

  const displayCombatant = runtimeCombatant ?? combatant
  const canPassTurn =
    !displayCombatant.turnResources?.actionAvailable ||
    !displayCombatant.turnResources?.bonusActionAvailable
  const isDefeated = displayCombatant.stats.currentHitPoints === 0

  return (
    <Paper
      sx={{
        p: 2.5,
        border: isActive ? '2px solid' : undefined,
        borderColor: isActive ? 'primary.main' : undefined,
        opacity: isDefeated ? 0.5 : 1,
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="h6">{character.name}</Typography>
              <AppBadge label={sourceKind === 'pc' ? 'Party' : 'NPC'} tone="primary" size="small" />
              {isActive && <AppBadge label="Active Turn" tone="success" size="small" />}
              {displayCombatant && (
                <PresentableEffectsHeaderChips combatant={displayCombatant} />
              )}
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {formatCharacterSubtitle(character)}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            {isActive && (
              <Button size="small" variant="outlined" onClick={onPassTurn} disabled={!canPassTurn}>
                Pass turn
              </Button>
            )}
            <Button size="small" color="inherit" onClick={onRemove}>
              <DeleteOutlineIcon fontSize="small" />
            </Button>
          </Stack>
        </Stack>

        <StatChips
          items={[
            { label: 'AC', value: displayCombatant.stats.armorClass },
            {
              label: 'HP',
              value: `${displayCombatant.stats.currentHitPoints} / ${displayCombatant.stats.maxHitPoints}`,
            },
            { label: 'Init', value: formatSigned(displayCombatant.stats.initiativeModifier) },
            { label: 'Move', value: `${displayCombatant.turnResources?.movementRemaining ?? 0} ft` },
          ]}
        />

        {isActive && activeActionControls && <ActiveActionControls {...activeActionControls} />}

        <Divider />

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Attacks
          </Typography>
          <AttackList attacks={attacks} />
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Active Effects
          </Typography>
          <EffectList labels={effectLabels} />
        </Box>

        <PresentableEffectsList combatant={displayCombatant} />
      </Stack>
    </Paper>
  )
}

export function MonsterCombatantCard({
  monster,
  runtimeId,
  runtimeCombatant,
  environmentContext,
  currentForm,
  manualTriggerContext,
  onFormChange,
  onManualTriggerChange,
  onResolved,
  onAddCopy,
  onRemove,
  onPassTurn,
  isActive = false,
  activeActionControls,
}: {
  monster: Monster
  runtimeId: string
  runtimeCombatant?: CombatantInstance
  environmentContext: ManualEnvironmentContext
  currentForm: MonsterFormContext
  manualTriggerContext: ManualMonsterTriggerContext
  onFormChange: (form: MonsterFormContext) => void
  onManualTriggerChange: (trigger: keyof ManualMonsterTriggerContext, active: boolean) => void
  onResolved: (combatant: CombatantInstance) => void
  onAddCopy: () => void
  onRemove: () => void
  onPassTurn: () => void
  isActive?: boolean
  activeActionControls?: ActiveActionControlsProps
}) {
  const { catalog } = useCampaignRules()
  const dexterityScore = monster.mechanics.abilities?.dexterity
  const initiativeModifier = toAbilityModifier(dexterityScore)
  const armorClass = calculateMonsterArmorClass(monster, catalog.armorById).value
  const averageHitPoints =
    Math.floor(monster.mechanics.hitPoints.count * ((monster.mechanics.hitPoints.die + 1) / 2)) +
    (monster.mechanics.hitPoints.modifier ?? 0)

  const activeEffects = useMemo(
    () =>
      buildActiveMonsterEffects(monster, {
        environment: environmentContext,
        form: currentForm,
        manual: manualTriggerContext,
      }),
    [currentForm, environmentContext, manualTriggerContext, monster],
  )
  const attacks = useMemo(
    () => buildMonsterAttackEntries(monster, catalog.weaponsById, activeEffects),
    [activeEffects, monster, catalog.weaponsById],
  )
  const executableActions = useMemo(
    () => buildMonsterExecutableActions(monster, catalog.weaponsById, activeEffects),
    [activeEffects, monster, catalog.weaponsById],
  )
  const effectLabels = useMemo(
    () =>
      buildMonsterEffectLabels(monster, {
        environment: environmentContext,
        form: currentForm,
        manual: manualTriggerContext,
      }),
    [currentForm, environmentContext, manualTriggerContext, monster],
  )
  const turnHooks = useMemo(() => buildMonsterTurnHooks(monster), [monster])
  const contextTriggers = useMemo(
    () =>
      buildMonsterContextTriggers(monster, {
        environment: environmentContext,
        form: currentForm,
        manual: manualTriggerContext,
      }),
    [currentForm, environmentContext, manualTriggerContext, monster],
  )
  const hasFormTriggers = useMemo(() => monsterHasFormTriggers(monster), [monster])
  const supportedManualTriggers = useMemo(() => {
    return monsterSupportedManualTriggers(monster)
  }, [monster])
  const combatant = useMemo(
    () =>
      buildMonsterCombatantInstance({
        runtimeId,
        monster,
        attacks,
        actions: executableActions,
        initiativeModifier,
        armorClass,
        currentHitPoints: averageHitPoints,
        activeEffects,
        turnHooks,
      }),
    [activeEffects, armorClass, attacks, averageHitPoints, executableActions, initiativeModifier, monster, runtimeId, turnHooks],
  )
  const onResolvedRef = useRef(onResolved)
  onResolvedRef.current = onResolved

  useEffect(() => {
    onResolvedRef.current(combatant)
  }, [combatant])

  const displayCombatant = runtimeCombatant ?? combatant
  const canPassTurn =
    !displayCombatant.turnResources?.actionAvailable ||
    !displayCombatant.turnResources?.bonusActionAvailable
  const isDefeated = displayCombatant.stats.currentHitPoints === 0

  return (
    <Paper
      sx={{
        p: 2.5,
        border: isActive ? '2px solid' : undefined,
        borderColor: isActive ? 'primary.main' : undefined,
        opacity: isDefeated ? 0.5 : 1,
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="h6">{monster.name}</Typography>
              <AppBadge label="Monster" tone="danger" size="small" />
              {isActive && <AppBadge label="Active Turn" tone="success" size="small" />}
              <PresentableEffectsHeaderChips combatant={displayCombatant} />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {formatMonsterOptionSubtitle(monster)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Runtime ID: {runtimeId}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button size="small" onClick={onAddCopy}>
              +
            </Button>
            {isActive && (
              <Button size="small" variant="outlined" onClick={onPassTurn} disabled={!canPassTurn}>
                Pass turn
              </Button>
            )}
            <Button size="small" color="inherit" onClick={onRemove}>
              <DeleteOutlineIcon fontSize="small" />
            </Button>
          </Stack>
        </Stack>

        <StatChips
          items={[
            { label: 'AC', value: displayCombatant.stats.armorClass },
            {
              label: 'HP',
              value: `${displayCombatant.stats.currentHitPoints} / ${displayCombatant.stats.maxHitPoints}`,
            },
            { label: 'Init', value: formatSigned(displayCombatant.stats.initiativeModifier) },
            { label: 'Speed', value: formatMovement(monster.mechanics.movement) },
            { label: 'Move', value: `${displayCombatant.turnResources?.movementRemaining ?? 0} ft` },
          ]}
        />

        {isActive && activeActionControls && <ActiveActionControls {...activeActionControls} />}

        <Typography variant="body2" color="text.secondary">
          {formatHitPointsWithAverage(monster.mechanics.hitPoints)}
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <AppBadge
            label={`Environment: ${environmentContext === 'sunlight' ? 'Sunlight' : 'Normal'}`}
            tone="default"
            variant="outlined"
            size="small"
          />
          {hasFormTriggers && (
            <TextField
              select
              label="Form"
              value={currentForm}
              onChange={(event) => onFormChange(event.target.value as MonsterFormContext)}
              size="small"
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="true-form">True Form</MenuItem>
              <MenuItem value="object">Object</MenuItem>
            </TextField>
          )}
        </Stack>

        {supportedManualTriggers.length > 0 && (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {supportedManualTriggers.map((trigger) => (
              <Button
                key={trigger}
                size="small"
                variant={manualTriggerContext[trigger] ? 'contained' : 'outlined'}
                onClick={() => onManualTriggerChange(trigger, !manualTriggerContext[trigger])}
              >
                {triggerButtonLabel(trigger)}
              </Button>
            ))}
          </Stack>
        )}

        <Divider />

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Attacks
          </Typography>
          <AttackList attacks={attacks} />
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Active Effects
          </Typography>
          <EffectList labels={effectLabels} />
        </Box>

        <PresentableEffectsList combatant={displayCombatant} />
        <ContextTriggerList triggers={contextTriggers} />
      </Stack>
    </Paper>
  )
}

export function CombatLane({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <Paper sx={{ p: 3, minHeight: 320 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h5">{title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Box>
        {children}
      </Stack>
    </Paper>
  )
}


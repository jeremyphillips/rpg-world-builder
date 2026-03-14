import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'

import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider'
import { useCampaignRules } from '@/app/providers/CampaignRulesProvider'
import { ROUTES } from '@/app/routes'
import { useCampaignParty } from '@/features/campaign/hooks'
import { useCharacter, useCharacters, useCombatStats } from '@/features/character/hooks'
import { toCharacterForEngine, type CharacterDetailDto } from '@/features/character/read-model'
import { calculateMonsterArmorClass } from '@/features/content/monsters/domain/mechanics/calculateMonsterArmorClass'
import type { Monster } from '@/features/content/monsters/domain/types'
import { formatHitPointsWithAverage, formatMovement } from '@/features/content/monsters/utils/formatters'
import type { DiceOrFlat } from '@/features/mechanics/domain/dice'
import type { Effect } from '@/features/mechanics/domain/effects/effects.types'
import {
  addConditionToCombatant,
  addStateToCombatant,
  advanceEncounterTurn,
  applyDamageToCombatant,
  applyHealingToCombatant,
  createEncounterState,
  removeConditionFromCombatant,
  removeStateFromCombatant,
  type CombatantAttackEntry,
  type CombatantInstance,
  type CombatantSide,
  type EncounterState,
} from '@/features/mechanics/domain/encounter'
import { AppAlert } from '@/ui/primitives'

type PartyOption = {
  id: string
  label: string
  subtitle: string
}

type EnemyOption = {
  key: string
  sourceId: string
  kind: 'npc' | 'monster'
  label: string
  subtitle: string
}

type EnemyRosterEntry = {
  runtimeId: string
  sourceKey: string
  sourceId: string
  kind: 'npc' | 'monster'
  label: string
}

function formatSigned(value: number): string {
  return value >= 0 ? `+${value}` : String(value)
}

function toAbilityModifier(score: number | null | undefined): number {
  return Math.floor(((score ?? 10) - 10) / 2)
}

function formatDice(value: DiceOrFlat | undefined): string | undefined {
  if (value == null) return undefined
  return String(value)
}

function formatEffectLabel(effect: Effect): string {
  switch (effect.kind) {
    case 'condition':
      return `Condition: ${effect.conditionId}`
    case 'custom':
      return effect.id
    case 'damage':
      return `Damage: ${formatDice(effect.damage) ?? '—'}`
    case 'grant':
      return effect.grantType === 'condition_immunity'
        ? `Immunity: ${effect.value}`
        : 'Proficiency grant'
    case 'modifier':
      return `Modifier: ${effect.target}`
    case 'resource':
      return `Resource: ${effect.resource.id}`
    case 'save':
      return `Save: ${effect.save.ability}`
    case 'state':
      return `State: ${effect.stateId}`
    case 'trigger':
      return `Trigger: ${effect.trigger}`
    default:
      return effect.kind.replaceAll('_', ' ')
  }
}

function formatCharacterSubtitle(character: CharacterDetailDto): string {
  const raceName = character.race?.name ?? 'Unknown race'
  const classes = character.classes.length > 0
    ? character.classes.map((cls) => `${cls.className} ${cls.level}`).join(' / ')
    : 'No class levels'

  return `${raceName} • ${classes}`
}

function formatPartyOptionSubtitle(option: {
  race: { name: string } | null
  classes: { className: string; level: number }[]
  ownerName?: string
}): string {
  const classLabel = option.classes.length > 0
    ? option.classes.map((cls) => `${cls.className} ${cls.level}`).join(' / ')
    : 'No class levels'
  const ownerLabel = option.ownerName ? ` • ${option.ownerName}` : ''
  return `${option.race?.name ?? 'Unknown race'} • ${classLabel}${ownerLabel}`
}

function formatNpcOptionSubtitle(option: {
  race?: string | null
  classes?: { className?: string; level: number }[]
}): string {
  const classLabel = option.classes && option.classes.length > 0
    ? option.classes.map((cls) => `${cls.className ?? 'Class'} ${cls.level}`).join(' / ')
    : 'No class levels'
  return `${option.race ?? 'Unknown race'} • ${classLabel}`
}

function formatMonsterOptionSubtitle(monster: Monster): string {
  const typeLabel = monster.type ?? 'monster'
  const sizeLabel = monster.sizeCategory ?? 'size unknown'
  const challengeRating = monster.lore?.challengeRating ?? '—'
  return `CR ${challengeRating} • ${sizeLabel} ${typeLabel}`
}

function buildMonsterAttackEntries(
  monster: Monster,
  weaponsById: Record<string, { name: string; damage?: { default?: DiceOrFlat }; damageType?: string }>,
): CombatantAttackEntry[] {
  const actions = monster.mechanics.actions ?? []

  return actions.map((action, index) => {
    if (action.kind === 'weapon') {
      const equippedWeapon = monster.mechanics.equipment?.weapons?.[action.weaponRef]
      const weaponId = equippedWeapon?.weaponId ?? action.weaponRef
      const weapon = weaponsById[weaponId]

      return {
        id: `${monster.id}-weapon-${action.weaponRef}-${index}`,
        name: equippedWeapon?.aliasName ?? weapon?.name ?? action.weaponRef,
        attackBonus: equippedWeapon?.attackBonus,
        damage: formatDice(equippedWeapon?.damageOverride ?? weapon?.damage?.default),
        damageType: weapon?.damageType,
        notes: equippedWeapon?.notes,
      }
    }

    if (action.kind === 'natural') {
      return {
        id: `${monster.id}-natural-${index}`,
        name: action.name ?? action.attackType,
        attackBonus: action.attackBonus,
        damage: formatDice(action.damage),
        damageType: action.damageType,
        notes: action.notes,
      }
    }

    return {
      id: `${monster.id}-special-${index}`,
      name: action.name,
      attackBonus: action.attackBonus,
      damage: formatDice(action.damage),
      damageType: action.damageType,
      notes: [action.description, action.notes].filter(Boolean).join(' '),
    }
  })
}

function buildMonsterEffectLabels(monster: Monster): string[] {
  return (monster.mechanics.traits ?? []).flatMap((trait) =>
    (trait.effects ?? []).map((effect) => `${trait.name}: ${formatEffectLabel(effect)}`),
  )
}

function formatRuntimeLabel(name: string, runtimeId: string, sourceId: string): string {
  return runtimeId === sourceId ? name : `${name} (${runtimeId})`
}

function buildCharacterCombatantInstance(args: {
  runtimeId: string
  side: CombatantSide
  sourceKind: 'pc' | 'npc'
  character: CharacterDetailDto
  combatStats: ReturnType<typeof useCombatStats>
  attacks: CombatantAttackEntry[]
}): CombatantInstance {
  const { runtimeId, side, sourceKind, character, combatStats, attacks } = args

  return {
    instanceId: runtimeId,
    side,
    source: {
      kind: sourceKind,
      sourceId: character.id,
      label: formatRuntimeLabel(character.name, runtimeId, character.id),
    },
    stats: {
      armorClass: combatStats.armorClass,
      maxHitPoints: combatStats.maxHp,
      currentHitPoints: character.hitPoints.total,
      initiativeModifier: combatStats.initiative,
      dexterityScore: character.abilityScores.dexterity,
    },
    attacks,
    activeEffects: combatStats.activeEffects,
    conditions: [],
    states: [],
  }
}

function buildMonsterCombatantInstance(args: {
  runtimeId: string
  monster: Monster
  attacks: CombatantAttackEntry[]
  initiativeModifier: number
  armorClass: number
  currentHitPoints: number
}): CombatantInstance {
  const { runtimeId, monster, attacks, initiativeModifier, armorClass, currentHitPoints } = args

  return {
    instanceId: runtimeId,
    side: 'enemies',
    source: {
      kind: 'monster',
      sourceId: monster.id,
      label: formatRuntimeLabel(monster.name, runtimeId, monster.id),
    },
    stats: {
      armorClass,
      maxHitPoints: currentHitPoints,
      currentHitPoints,
      initiativeModifier,
      dexterityScore: monster.mechanics.abilities?.dexterity ?? undefined,
      speeds: monster.mechanics.movement,
    },
    attacks,
    activeEffects: (monster.mechanics.traits ?? []).flatMap((trait) => trait.effects ?? []),
    conditions: [],
    states: [],
  }
}

function StatChips({
  items,
}: {
  items: { label: string; value: string | number }[]
}) {
  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      {items.map((item) => (
        <Chip
          key={item.label}
          label={`${item.label}: ${item.value}`}
          size="small"
          variant="outlined"
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
                <Chip label={`To hit ${formatSigned(attack.attackBonus)}`} size="small" />
              )}
              {attack.damage && (
                <Chip
                  label={
                    attack.damageType
                      ? `${attack.damage} ${attack.damageType}`
                      : attack.damage
                  }
                  size="small"
                  variant="outlined"
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
        <Chip key={`${label}-${index}`} label={label} size="small" variant="outlined" />
      ))}
    </Stack>
  )
}

function MarkerList({
  title,
  labels,
}: {
  title: string
  labels: string[]
}) {
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        {title}
      </Typography>
      {labels.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          None.
        </Typography>
      ) : (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {labels.map((label) => (
            <Chip key={label} label={label} size="small" variant="outlined" />
          ))}
        </Stack>
      )}
    </Box>
  )
}

function CharacterCombatantCard({
  runtimeId,
  characterId,
  side,
  sourceKind,
  runtimeCombatant,
  onResolved,
  onRemove,
  isActive = false,
}: {
  runtimeId: string
  characterId: string
  side: CombatantSide
  sourceKind: 'pc' | 'npc'
  runtimeCombatant?: CombatantInstance
  onResolved: (combatant: CombatantInstance | null) => void
  onRemove: () => void
  isActive?: boolean
}) {
  const { character, loading, error } = useCharacter(characterId)

  useEffect(() => {
    if (!loading && !character) {
      onResolved(null)
    }
  }, [character, loading, onResolved])

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
      isActive={isActive}
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
  isActive = false,
}: {
  runtimeId: string
  side: CombatantSide
  character: CharacterDetailDto
  sourceKind: 'pc' | 'npc'
  runtimeCombatant?: CombatantInstance
  onResolved: (combatant: CombatantInstance) => void
  onRemove: () => void
  isActive?: boolean
}) {
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
        damage: attack.damage,
        damageType: attack.damageType,
      })),
    [character.id, combatStats.attacks],
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
      }),
    [attacks, character, combatStats, runtimeId, side, sourceKind],
  )

  useEffect(() => {
    onResolved(combatant)
  }, [combatant, onResolved])

  const displayCombatant = runtimeCombatant ?? combatant

  return (
    <Paper
      sx={{
        p: 2.5,
        border: isActive ? '2px solid' : undefined,
        borderColor: isActive ? 'primary.main' : undefined,
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="h6">{character.name}</Typography>
              <Chip label={sourceKind === 'pc' ? 'Party' : 'NPC'} size="small" color="primary" />
              {isActive && <Chip label="Active Turn" size="small" color="success" />}
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {formatCharacterSubtitle(character)}
            </Typography>
          </Box>
          <Button size="small" color="inherit" onClick={onRemove} startIcon={<DeleteOutlineIcon />}>
            Remove
          </Button>
        </Stack>

        <StatChips
          items={[
            { label: 'AC', value: displayCombatant.stats.armorClass },
            {
              label: 'HP',
              value: `${displayCombatant.stats.currentHitPoints} / ${displayCombatant.stats.maxHitPoints}`,
            },
            { label: 'Init', value: formatSigned(displayCombatant.stats.initiativeModifier) },
          ]}
        />

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

        <MarkerList title="Conditions" labels={displayCombatant.conditions} />
        <MarkerList title="States" labels={displayCombatant.states} />
      </Stack>
    </Paper>
  )
}

function MonsterCombatantCard({
  monster,
  runtimeId,
  runtimeCombatant,
  onResolved,
  onAddCopy,
  onRemove,
  isActive = false,
}: {
  monster: Monster
  runtimeId: string
  runtimeCombatant?: CombatantInstance
  onResolved: (combatant: CombatantInstance) => void
  onAddCopy: () => void
  onRemove: () => void
  isActive?: boolean
}) {
  const { catalog } = useCampaignRules()
  const dexterityScore = monster.mechanics.abilities?.dexterity
  const initiativeModifier = toAbilityModifier(dexterityScore)
  const armorClass = calculateMonsterArmorClass(monster, catalog.armorById).value
  const averageHitPoints =
    Math.floor(monster.mechanics.hitPoints.count * ((monster.mechanics.hitPoints.die + 1) / 2)) +
    (monster.mechanics.hitPoints.modifier ?? 0)

  const attacks = useMemo(
    () => buildMonsterAttackEntries(monster, catalog.weaponsById),
    [monster, catalog.weaponsById],
  )
  const effectLabels = useMemo(() => buildMonsterEffectLabels(monster), [monster])
  const combatant = useMemo(
    () =>
      buildMonsterCombatantInstance({
        runtimeId,
        monster,
        attacks,
        initiativeModifier,
        armorClass,
        currentHitPoints: averageHitPoints,
      }),
    [armorClass, attacks, averageHitPoints, initiativeModifier, monster, runtimeId],
  )

  useEffect(() => {
    onResolved(combatant)
  }, [combatant, onResolved])

  const displayCombatant = runtimeCombatant ?? combatant

  return (
    <Paper
      sx={{
        p: 2.5,
        border: isActive ? '2px solid' : undefined,
        borderColor: isActive ? 'primary.main' : undefined,
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="h6">{monster.name}</Typography>
              <Chip label="Monster" size="small" color="error" />
              {isActive && <Chip label="Active Turn" size="small" color="success" />}
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {formatMonsterOptionSubtitle(monster)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Runtime ID: {runtimeId}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button size="small" onClick={onAddCopy} startIcon={<AddIcon />}>
              Add Copy
            </Button>
            <Button size="small" color="inherit" onClick={onRemove} startIcon={<DeleteOutlineIcon />}>
              Remove
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
          ]}
        />

        <Typography variant="body2" color="text.secondary">
          {formatHitPointsWithAverage(monster.mechanics.hitPoints)}
        </Typography>

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

        <MarkerList title="Conditions" labels={displayCombatant.conditions} />
        <MarkerList title="States" labels={displayCombatant.states} />
      </Stack>
    </Paper>
  )
}

function CombatLane({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
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

export default function CombatTestRoute() {
  const { campaignId, campaignName } = useActiveCampaign()
  const { catalog } = useCampaignRules()
  const { party, loading: loadingParty } = useCampaignParty('approved')
  const { characters: npcs, loading: loadingNpcs } = useCharacters({ type: 'npc' })

  const runtimeIdCounter = useRef(0)
  const nextRuntimeId = (prefix: string) => {
    runtimeIdCounter.current += 1
    return `${prefix}-${runtimeIdCounter.current}`
  }

  const partyOptions = useMemo<PartyOption[]>(
    () =>
      party.map((member) => ({
        id: member.id,
        label: member.name,
        subtitle: formatPartyOptionSubtitle(member),
      })),
    [party],
  )
  const monsterOptions = useMemo<EnemyOption[]>(
    () =>
      Object.values(catalog.monstersById)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((monster) => ({
          key: `monster:${monster.id}`,
          sourceId: monster.id,
          kind: 'monster' as const,
          label: monster.name,
          subtitle: formatMonsterOptionSubtitle(monster),
        })),
    [catalog.monstersById],
  )
  const npcOptions = useMemo<EnemyOption[]>(
    () =>
      npcs
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((npc) => ({
          key: `npc:${npc._id}`,
          sourceId: npc._id,
          kind: 'npc' as const,
          label: npc.name,
          subtitle: formatNpcOptionSubtitle({
            race: typeof npc.race === 'string' ? npc.race : null,
            classes: npc.classes?.map((cls) => ({
              className: cls.classId,
              level: cls.level,
            })),
          }),
        })),
    [npcs],
  )
  const enemyOptions = useMemo(
    () => [...npcOptions, ...monsterOptions].sort((a, b) => a.label.localeCompare(b.label)),
    [npcOptions, monsterOptions],
  )
  const enemyOptionsByKey = useMemo(
    () => Object.fromEntries(enemyOptions.map((option) => [option.key, option])),
    [enemyOptions],
  )
  const monstersById = catalog.monstersById

  const [selectedPartyIds, setSelectedPartyIds] = useState<string[]>([])
  const [enemyRoster, setEnemyRoster] = useState<EnemyRosterEntry[]>([])
  const [resolvedCombatantsById, setResolvedCombatantsById] = useState<Record<string, CombatantInstance>>({})
  const [encounterState, setEncounterState] = useState<EncounterState | null>(null)
  const [controlTargetId, setControlTargetId] = useState('')
  const [damageAmount, setDamageAmount] = useState('5')
  const [healingAmount, setHealingAmount] = useState('5')
  const [conditionInput, setConditionInput] = useState('poisoned')
  const [stateInput, setStateInput] = useState('concentrating')

  const selectedPartyOptions = useMemo(
    () => partyOptions.filter((option) => selectedPartyIds.includes(option.id)),
    [partyOptions, selectedPartyIds],
  )
  const selectedEnemyOptions = useMemo(() => {
    const uniqueKeys = Array.from(new Set(enemyRoster.map((entry) => entry.sourceKey)))
    return uniqueKeys
      .map((key) => enemyOptionsByKey[key])
      .filter((option): option is EnemyOption => Boolean(option))
  }, [enemyRoster, enemyOptionsByKey])

  const enemySourceCounts = useMemo(
    () =>
      enemyRoster.reduce<Record<string, number>>((counts, entry) => {
        counts[entry.sourceKey] = (counts[entry.sourceKey] ?? 0) + 1
        return counts
      }, {}),
    [enemyRoster],
  )
  const selectedCombatantIds = useMemo(
    () => [...selectedPartyIds, ...enemyRoster.map((entry) => entry.runtimeId)],
    [enemyRoster, selectedPartyIds],
  )
  const selectedCombatants = useMemo(
    () =>
      selectedCombatantIds
        .map((combatantId) => resolvedCombatantsById[combatantId])
        .filter((combatant): combatant is CombatantInstance => Boolean(combatant)),
    [resolvedCombatantsById, selectedCombatantIds],
  )
  const unresolvedCombatantCount = selectedCombatantIds.length - selectedCombatants.length
  const activeCombatantId = encounterState?.activeCombatantId ?? null
  const controlOptions = encounterState?.initiative ?? []

  useEffect(() => {
    const validIds = new Set(selectedCombatantIds)

    setResolvedCombatantsById((prev) =>
      Object.fromEntries(
        Object.entries(prev).filter(([combatantId]) => validIds.has(combatantId)),
      ),
    )
    setEncounterState(null)
  }, [selectedCombatantIds])

  useEffect(() => {
    if (!encounterState) {
      setControlTargetId('')
      return
    }

    const validIds = new Set(encounterState.initiativeOrder)
    if (!controlTargetId || !validIds.has(controlTargetId)) {
      setControlTargetId(encounterState.activeCombatantId ?? encounterState.initiativeOrder[0] ?? '')
    }
  }, [controlTargetId, encounterState])

  function handleResolvedCombatant(runtimeId: string, combatant: CombatantInstance | null) {
    setResolvedCombatantsById((prev) => {
      if (combatant == null) {
        if (!(runtimeId in prev)) return prev
        const next = { ...prev }
        delete next[runtimeId]
        return next
      }

      return {
        ...prev,
        [runtimeId]: combatant,
      }
    })
  }

  function handleStartEncounter() {
    if (selectedCombatants.length === 0 || unresolvedCombatantCount > 0) return
    setEncounterState(createEncounterState(selectedCombatants))
  }

  function handleNextTurn() {
    setEncounterState((prev) => (prev ? advanceEncounterTurn(prev) : prev))
  }

  function handleResetEncounter() {
    setEncounterState(null)
  }

  function parsePositiveAmount(value: string): number | null {
    const parsed = Number(value)
    if (!Number.isFinite(parsed) || parsed <= 0) return null
    return Math.floor(parsed)
  }

  function handleApplyDamage() {
    const amount = parsePositiveAmount(damageAmount)
    if (!encounterState || !controlTargetId || amount == null) return
    setEncounterState(applyDamageToCombatant(encounterState, controlTargetId, amount))
  }

  function handleApplyHealing() {
    const amount = parsePositiveAmount(healingAmount)
    if (!encounterState || !controlTargetId || amount == null) return
    setEncounterState(applyHealingToCombatant(encounterState, controlTargetId, amount))
  }

  function handleAddCondition() {
    if (!encounterState || !controlTargetId) return
    setEncounterState(addConditionToCombatant(encounterState, controlTargetId, conditionInput))
  }

  function handleRemoveCondition() {
    if (!encounterState || !controlTargetId) return
    setEncounterState(removeConditionFromCombatant(encounterState, controlTargetId, conditionInput))
  }

  function handleAddState() {
    if (!encounterState || !controlTargetId) return
    setEncounterState(addStateToCombatant(encounterState, controlTargetId, stateInput))
  }

  function handleRemoveState() {
    if (!encounterState || !controlTargetId) return
    setEncounterState(removeStateFromCombatant(encounterState, controlTargetId, stateInput))
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
        <Box>
          <Typography variant="h4">Combat Test</Typography>
          <Typography variant="body1" color="text.secondary">
            {campaignName ? `${campaignName} encounter sandbox` : 'Encounter sandbox'}
          </Typography>
        </Box>
        <Button
          component={Link}
          to={campaignId ? ROUTES.CAMPAIGN.replace(':id', campaignId) : ROUTES.CAMPAIGNS}
          startIcon={<ArrowBackIcon />}
          size="small"
        >
          Campaign
        </Button>
      </Stack>

      <AppAlert tone="info">
        This slice loads approved party members, campaign NPCs, and monsters into the sandbox, then starts a local encounter with auto-rolled initiative and a structured turn log.
      </AppAlert>

      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} flexWrap="wrap" useFlexGap>
            <Box>
              <Typography variant="h5">Encounter Controls</Typography>
              <Typography variant="body2" color="text.secondary">
                Start from the current lineup, step turn order, or reset to adjust the roster.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button
                variant="contained"
                onClick={handleStartEncounter}
                disabled={selectedCombatants.length === 0 || unresolvedCombatantCount > 0}
              >
                Start Encounter
              </Button>
              <Button
                variant="outlined"
                onClick={handleNextTurn}
                disabled={!encounterState}
              >
                Next Turn
              </Button>
              <Button
                variant="text"
                color="inherit"
                onClick={handleResetEncounter}
                disabled={!encounterState}
              >
                Reset
              </Button>
            </Stack>
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip label={`Selected: ${selectedCombatantIds.length}`} size="small" variant="outlined" />
            <Chip label={`Resolved: ${selectedCombatants.length}`} size="small" variant="outlined" />
            <Chip
              label={
                encounterState
                  ? `Round ${encounterState.roundNumber} • Turn ${encounterState.turnIndex + 1}`
                  : 'Encounter not started'
              }
              size="small"
              color={encounterState ? 'success' : 'default'}
            />
          </Stack>

          {unresolvedCombatantCount > 0 && (
            <Typography variant="body2" color="text.secondary">
              Waiting on {unresolvedCombatantCount} combatant{unresolvedCombatantCount === 1 ? '' : 's'} to finish loading before the encounter can start.
            </Typography>
          )}

          {encounterState?.activeCombatantId && (
            <Typography variant="body2" color="text.secondary">
              Active combatant: {encounterState.combatantsById[encounterState.activeCombatantId]?.source.label ?? encounterState.activeCombatantId}
            </Typography>
          )}

          <Divider />

          <Stack spacing={2}>
            <Typography variant="subtitle2">Test Actions</Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                select
                fullWidth
                label="Target Combatant"
                value={controlTargetId}
                onChange={(event) => setControlTargetId(event.target.value)}
                disabled={!encounterState}
              >
                {controlOptions.map((option) => (
                  <MenuItem key={option.combatantId} value={option.combatantId}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flex={1}>
                <TextField
                  label="Damage"
                  type="number"
                  value={damageAmount}
                  onChange={(event) => setDamageAmount(event.target.value)}
                  disabled={!encounterState}
                  sx={{ minWidth: 110 }}
                />
                <Button variant="outlined" onClick={handleApplyDamage} disabled={!encounterState || !controlTargetId}>
                  Apply Damage
                </Button>
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flex={1}>
                <TextField
                  label="Healing"
                  type="number"
                  value={healingAmount}
                  onChange={(event) => setHealingAmount(event.target.value)}
                  disabled={!encounterState}
                  sx={{ minWidth: 110 }}
                />
                <Button variant="outlined" onClick={handleApplyHealing} disabled={!encounterState || !controlTargetId}>
                  Apply Healing
                </Button>
              </Stack>
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flex={1}>
                <TextField
                  fullWidth
                  label="Condition"
                  value={conditionInput}
                  onChange={(event) => setConditionInput(event.target.value)}
                  disabled={!encounterState}
                />
                <Button variant="outlined" onClick={handleAddCondition} disabled={!encounterState || !controlTargetId}>
                  Add
                </Button>
                <Button variant="text" color="inherit" onClick={handleRemoveCondition} disabled={!encounterState || !controlTargetId}>
                  Remove
                </Button>
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flex={1}>
                <TextField
                  fullWidth
                  label="State Marker"
                  value={stateInput}
                  onChange={(event) => setStateInput(event.target.value)}
                  disabled={!encounterState}
                />
                <Button variant="outlined" onClick={handleAddState} disabled={!encounterState || !controlTargetId}>
                  Add
                </Button>
                <Button variant="text" color="inherit" onClick={handleRemoveState} disabled={!encounterState || !controlTargetId}>
                  Remove
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </Stack>
      </Paper>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' },
          gap: 3,
        }}
      >
        <CombatLane
          title="Party"
          description="Choose approved party members to append PC combatant cards with initiative, AC, HP, attacks, and surfaced active effects."
        >
          <Autocomplete<PartyOption, true, false, false>
            multiple
            options={partyOptions}
            value={selectedPartyOptions}
            loading={loadingParty}
            onChange={(_, nextValue) => setSelectedPartyIds(nextValue.map((option) => option.id))}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            getOptionLabel={(option) => option.label}
            noOptionsText="No approved party members found."
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <Stack spacing={0.25}>
                  <Typography variant="body2">{option.label}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.subtitle}
                  </Typography>
                </Stack>
              </Box>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Approved Party Members"
                placeholder="Search party members"
              />
            )}
          />

          <Stack spacing={2}>
            {selectedPartyIds.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No party combatants selected yet.
              </Typography>
            ) : (
              selectedPartyIds.map((characterId) => (
                <CharacterCombatantCard
                  key={characterId}
                  runtimeId={characterId}
                  characterId={characterId}
                  side="party"
                  sourceKind="pc"
                  runtimeCombatant={encounterState?.combatantsById[characterId]}
                  onResolved={(combatant) => handleResolvedCombatant(characterId, combatant)}
                  onRemove={() =>
                    setSelectedPartyIds((prev) => prev.filter((id) => id !== characterId))
                  }
                  isActive={activeCombatantId === characterId}
                />
              ))
            )}
          </Stack>
        </CombatLane>

        <CombatLane
          title="Enemies"
          description="Choose NPC or monster sources. Removing a source from the multiselect clears every copy, while selected monster cards can add duplicate runtime instances."
        >
          <Autocomplete<EnemyOption, true, false, false>
            multiple
            options={enemyOptions}
            value={selectedEnemyOptions}
            loading={loadingNpcs}
            onChange={(_, nextValue) => {
              const nextKeys = new Set(nextValue.map((option) => option.key))
              const previousKeys = new Set(enemyRoster.map((entry) => entry.sourceKey))

              setEnemyRoster([
                ...enemyRoster.filter((entry) => nextKeys.has(entry.sourceKey)),
                ...nextValue
                  .filter((option) => !previousKeys.has(option.key))
                  .map((option) => ({
                    runtimeId: nextRuntimeId(option.kind),
                    sourceKey: option.key,
                    sourceId: option.sourceId,
                    kind: option.kind,
                    label: option.label,
                  })),
              ])
            }}
            isOptionEqualToValue={(option, value) => option.key === value.key}
            getOptionLabel={(option) => option.label}
            noOptionsText="No NPC or monster options found."
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <Stack spacing={0.25}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2">{option.label}</Typography>
                    <Chip label={option.kind === 'npc' ? 'NPC' : 'Monster'} size="small" />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {option.subtitle}
                  </Typography>
                </Stack>
              </Box>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Enemy Sources"
                placeholder="Search NPCs and monsters"
              />
            )}
          />

          <Stack spacing={2}>
            {enemyRoster.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No enemy combatants selected yet.
              </Typography>
            ) : (
              enemyRoster.map((entry) => {
                if (entry.kind === 'npc') {
                  return (
                    <CharacterCombatantCard
                      key={entry.runtimeId}
                      runtimeId={entry.runtimeId}
                      characterId={entry.sourceId}
                      side="enemies"
                      sourceKind="npc"
                      runtimeCombatant={encounterState?.combatantsById[entry.runtimeId]}
                      onResolved={(combatant) => handleResolvedCombatant(entry.runtimeId, combatant)}
                      onRemove={() =>
                        setEnemyRoster((prev) =>
                          prev.filter((candidate) => candidate.runtimeId !== entry.runtimeId),
                        )
                      }
                      isActive={activeCombatantId === entry.runtimeId}
                    />
                  )
                }

                const monster = monstersById[entry.sourceId]
                if (!monster) {
                  return (
                    <Paper key={entry.runtimeId} sx={{ p: 2.5 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="error">
                          Monster `{entry.sourceId}` could not be resolved.
                        </Typography>
                        <Button
                          size="small"
                          color="inherit"
                          onClick={() =>
                            setEnemyRoster((prev) =>
                              prev.filter((candidate) => candidate.runtimeId !== entry.runtimeId),
                            )
                          }
                          startIcon={<DeleteOutlineIcon />}
                        >
                          Remove
                        </Button>
                      </Stack>
                    </Paper>
                  )
                }

                return (
                  <MonsterCombatantCard
                    key={entry.runtimeId}
                    monster={monster}
                    runtimeId={entry.runtimeId}
                    runtimeCombatant={encounterState?.combatantsById[entry.runtimeId]}
                    onResolved={(combatant) => handleResolvedCombatant(entry.runtimeId, combatant)}
                    onAddCopy={() =>
                      setEnemyRoster((prev) => [
                        ...prev,
                        {
                          runtimeId: nextRuntimeId('monster'),
                          sourceKey: entry.sourceKey,
                          sourceId: entry.sourceId,
                          kind: 'monster',
                          label: entry.label,
                        },
                      ])
                    }
                    onRemove={() =>
                      setEnemyRoster((prev) =>
                        prev.filter((candidate) => candidate.runtimeId !== entry.runtimeId),
                      )
                    }
                    isActive={activeCombatantId === entry.runtimeId}
                  />
                )
              })
            )}
          </Stack>

          {selectedEnemyOptions.length > 0 && (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {selectedEnemyOptions.map((option) => (
                <Chip
                  key={option.key}
                  label={`${option.label} × ${enemySourceCounts[option.key] ?? 0}`}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Stack>
          )}
        </CombatLane>
      </Box>

      <Paper sx={{ p: 3, minHeight: 220 }}>
        <Stack spacing={2}>
          <Typography variant="h5">Combat Log</Typography>
          <Typography variant="body2" color="text.secondary">
            Current setup: {selectedPartyIds.length} party combatant{selectedPartyIds.length === 1 ? '' : 's'} and {enemyRoster.length} enemy combatant{enemyRoster.length === 1 ? '' : 's'}.
          </Typography>

          {encounterState ? (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: '280px minmax(0, 1fr)' },
                gap: 3,
              }}
            >
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Initiative
                </Typography>
                <Stack spacing={1}>
                  {encounterState.initiative.map((entry, index) => (
                    <Paper
                      key={entry.combatantId}
                      variant="outlined"
                      sx={{
                        p: 1.25,
                        borderColor:
                          entry.combatantId === encounterState.activeCombatantId
                            ? 'primary.main'
                            : 'divider',
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" spacing={1}>
                        <Typography variant="body2" fontWeight={600}>
                          {index + 1}. {entry.label}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {entry.total}
                        </Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        d20 {entry.roll} {formatSigned(entry.modifier)}
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Events
                </Typography>
                <Stack spacing={1}>
                  {encounterState.log.map((entry) => (
                    <Paper key={entry.id} variant="outlined" sx={{ p: 1.25 }}>
                      <Stack direction="row" justifyContent="space-between" spacing={1} flexWrap="wrap" useFlexGap>
                        <Typography variant="body2" fontWeight={600}>
                          {entry.summary}
                        </Typography>
                        <Chip
                          label={`R${entry.round} T${entry.turn}`}
                          size="small"
                          variant="outlined"
                        />
                      </Stack>
                      {entry.details && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                          {entry.details}
                        </Typography>
                      )}
                    </Paper>
                  ))}
                </Stack>
              </Box>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Start the encounter to see initiative order and turn-by-turn log events.
            </Typography>
          )}
        </Stack>
      </Paper>
    </Stack>
  )
}

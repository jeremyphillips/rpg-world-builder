import { useEffect, useMemo, useRef } from 'react'

import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { useCampaignRules } from '@/app/providers/CampaignRulesProvider'
import CharacterAvatar from '@/features/character/components/CharacterAvatar'
import { formatCharacterDetailSubtitle } from '@/features/character/formatters'
import { useCharacter, useCombatStats } from '@/features/character/hooks'
import { toCharacterForEngine } from '@/features/character/read-model'
import type { Spell } from '@/features/content/spells/domain/types/spell.types'
import type { CombatantInstance, CombatantSide } from '@/features/mechanics/domain/encounter'
import type { CombatantPreviewCardProps, PreviewStat } from '../../../domain'
import {
  buildCharacterCombatantInstance,
  buildSpellCombatActions,
  buildTurnHooksFromEffects,
  formatSigned,
  getCharacterSpellcastingStats,
  getPreviewStatTooltip,
} from '../../../helpers'
import { CombatantPreviewCard } from '../../shared/cards/CombatantPreviewCard'

type AllyCombatantSetupPreviewCardProps = {
  characterId: string
  runtimeId: string
  side: CombatantSide
  sourceKind: 'pc' | 'npc'
  onResolved: (combatant: CombatantInstance | null) => void
  onRemove: () => void
}

export function AllyCombatantSetupPreviewCard({
  characterId,
  runtimeId,
  side,
  sourceKind,
  onResolved,
  onRemove,
}: AllyCombatantSetupPreviewCardProps) {
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
      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <CircularProgress size={16} />
          <Typography variant="body2" color="text.secondary">
            Loading{sourceKind === 'npc' ? ' NPC' : ''}…
          </Typography>
        </Stack>
      </Paper>
    )
  }

  if (!character) {
    return (
      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Typography variant="body2" color="error">
          {error ?? 'Character could not be loaded.'}
        </Typography>
      </Paper>
    )
  }

  return (
    <LoadedAllyCombatantSetupPreviewCard
      character={character}
      characterId={characterId}
      runtimeId={runtimeId}
      side={side}
      sourceKind={sourceKind}
      onResolved={onResolved}
      onRemove={onRemove}
    />
  )
}

type LoadedProps = AllyCombatantSetupPreviewCardProps & {
  character: NonNullable<ReturnType<typeof useCharacter>['character']>
}

function LoadedAllyCombatantSetupPreviewCard({
  character,
  characterId,
  runtimeId,
  side,
  sourceKind,
  onResolved,
  onRemove,
}: LoadedProps) {
  const { catalog, ruleset } = useCampaignRules()

  const engineCharacter = useMemo(() => toCharacterForEngine(character), [character])
  const combatStats = useCombatStats(engineCharacter)

  const attacks = useMemo(
    () =>
      combatStats.attacks.map((attack) => ({
        id: `${characterId}-${attack.weaponId}-${attack.hand}`,
        name: attack.name,
        attackBonus: attack.attackBonus,
        attackBreakdown: attack.attackBreakdown,
        damage: attack.damage,
        damageType: attack.damageType,
        damageBreakdown: attack.damageBreakdown,
        range: attack.range,
      })),
    [characterId, combatStats.attacks],
  )
  const turnHooks = useMemo(
    () => buildTurnHooksFromEffects(combatStats.activeEffects),
    [combatStats.activeEffects],
  )
  const spellStats = useMemo(
    () => getCharacterSpellcastingStats(character, ruleset),
    [character, ruleset],
  )
  const spellActions = useMemo(
    () =>
      buildSpellCombatActions({
        runtimeId,
        spellIds: character.spells,
        spellsById: catalog.spellsById as Record<string, Spell>,
        spellSaveDc: spellStats.spellSaveDc,
        spellAttackBonus: spellStats.spellAttackBonus,
        spellcastingAbilityModifier: spellStats.spellcastingAbilityModifier,
        casterLevel: character.level ?? 1,
        resources: character.resources,
      }),
    [catalog.spellsById, character, runtimeId, spellStats],
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

  if (!combatant) return null

  const stats: PreviewStat[] = [
    { label: 'AC', value: String(combatant.stats.armorClass), tooltip: getPreviewStatTooltip('AC') },
    {
      label: 'HP',
      value: `${combatant.stats.currentHitPoints}/${combatant.stats.maxHitPoints}`,
      tooltip: getPreviewStatTooltip('HP'),
    },
    { label: 'Init', value: formatSigned(combatant.stats.initiativeModifier), tooltip: getPreviewStatTooltip('Init') },
  ]
  const groundSpeed = combatant.stats.speeds?.ground
  if (groundSpeed != null) {
    stats.push({
      label: 'Move',
      value: `${groundSpeed} ft`,
      tooltip: getPreviewStatTooltip('Move'),
    })
  }

  const previewProps: CombatantPreviewCardProps = {
    id: runtimeId,
    kind: 'character',
    mode: 'setup',
    title: character.name,
    subtitle: formatCharacterDetailSubtitle(character),
    avatar: (
      <CharacterAvatar
        imageUrl={character.imageUrl ?? undefined}
        name={character.name}
        size="sm"
      />
    ),
    stats,
    secondaryActions: [{ id: 'remove', label: 'Remove', onClick: onRemove }],
  }

  return <CombatantPreviewCard {...previewProps} />
}

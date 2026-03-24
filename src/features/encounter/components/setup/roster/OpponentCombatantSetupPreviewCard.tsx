import { useEffect, useMemo, useRef } from 'react'

import { useCampaignRules } from '@/app/providers/CampaignRulesProvider'
import MonsterAvatar from '@/features/content/monsters/components/MonsterAvatar/MonsterAvatar'
import { formatMonsterIdentityLine } from '@/features/content/monsters/formatters'
import { calculateMonsterArmorClass } from '@/features/content/monsters/domain/mechanics/calculateMonsterArmorClass'
import { getAbilityScoreValue } from '@/features/mechanics/domain/character/abilities/abilityScoreMap'
import type { Monster } from '@/features/content/monsters/domain/types'
import {
  buildActiveMonsterEffects,
  buildMonsterTurnHooks,
  type ManualEnvironmentContext,
  type ManualMonsterTriggerContext,
  type MonsterFormContext,
  type CombatantInstance,
} from '@/features/mechanics/domain/encounter'
import type { CombatantPreviewCardProps, PreviewStat } from '../../../domain'
import { getAbilityModifier } from '@/features/mechanics/domain/abilities/getAbilityModifier'
import {
  buildMonsterAttackEntries,
  buildMonsterCombatantInstance,
  buildMonsterExecutableActions,
  formatSigned,
  getPreviewStatTooltip,
} from '../../../helpers'
import { CombatantPreviewCard } from '../../shared/cards/CombatantPreviewCard'

type OpponentCombatantSetupPreviewCardProps = {
  monster: Monster
  runtimeId: string
  environmentContext: ManualEnvironmentContext
  currentForm: MonsterFormContext
  manualTriggerContext: ManualMonsterTriggerContext
  onResolved: (combatant: CombatantInstance) => void
  onRemove: () => void
  onDuplicate: () => void
}

export function OpponentCombatantSetupPreviewCard({
  monster,
  runtimeId,
  environmentContext,
  currentForm,
  manualTriggerContext,
  onResolved,
  onRemove,
  onDuplicate,
}: OpponentCombatantSetupPreviewCardProps) {
  const { catalog } = useCampaignRules()

  const initiativeModifier = getAbilityModifier(
    getAbilityScoreValue(monster.mechanics.abilities, 'dex'),
  )
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
  const turnHooks = useMemo(() => buildMonsterTurnHooks(monster), [monster])

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

  const stats: PreviewStat[] = [
    { label: 'AC', value: String(armorClass), tooltip: getPreviewStatTooltip('AC') },
    { label: 'HP', value: String(averageHitPoints), tooltip: getPreviewStatTooltip('HP') },
    { label: 'Init', value: formatSigned(initiativeModifier), tooltip: getPreviewStatTooltip('Init') },
  ]
  const groundSpeed = monster.mechanics.movement?.ground
  if (groundSpeed != null) {
    stats.push({
      label: 'Move',
      value: `${groundSpeed} ft`,
      tooltip: getPreviewStatTooltip('Move'),
    })
  }

  const previewProps: CombatantPreviewCardProps = {
    id: runtimeId,
    kind: 'monster',
    mode: 'setup',
    title: monster.name,
    subtitle: formatMonsterIdentityLine(monster),
    avatar: <MonsterAvatar name={monster.name} size="sm" />,
    stats,
    secondaryActions: [
      { id: 'duplicate', label: 'Copy', onClick: onDuplicate },
      { id: 'remove', label: 'Remove', onClick: onRemove },
    ],
  }

  return <CombatantPreviewCard {...previewProps} />
}

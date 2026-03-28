import type { KeyboardEvent } from 'react'

import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'

import { AppAvatar } from '@/ui/primitives'
import { EntitySummaryCard } from '@/ui/patterns'

import type { CombatantPreviewCardProps, ViewerCombatantPresentationKind } from '../../../domain'
import { getCombatantPreviewCardOpacity } from '../../../domain/presentation-participation'
import { CombatantPreviewChipRow } from './combatant-badges'

export function CombatantPreviewCard({
  id: _id,
  kind: _kind,
  mode: _mode,
  title,
  subtitle,
  avatar,
  stats,
  chips,
  isCurrentTurn = false,
  isSelected = false,
  isDefeated = false,
  hasBattlefieldPresence = true,
  viewerPresentationKind = 'visible',
  primaryAction,
  secondaryActions,
  onClick,
}: CombatantPreviewCardProps) {
  const resolvedPresentation: ViewerCombatantPresentationKind = viewerPresentationKind ?? 'visible'
  const nonVisiblePresentation = resolvedPresentation !== 'visible'

  const borderColor = isCurrentTurn
    ? 'primary.main'
    : isSelected
      ? 'info.main'
      : 'divider'

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick()
    }
  }

  const avatarNode = avatar ?? <AppAvatar name={title} size="sm" />

  const visibilityLeadChip =
    resolvedPresentation === 'out-of-sight'
      ? ({ id: 'viewer-oos', label: 'Out of sight', tone: 'neutral' as const })
      : resolvedPresentation === 'hidden'
        ? ({ id: 'viewer-hidden', label: 'Hidden', tone: 'warning' as const })
        : null

  const chipsWithVisibility = visibilityLeadChip
    ? [visibilityLeadChip, ...(chips ?? [])]
    : chips

  const content = (
    <EntitySummaryCard
      avatar={avatarNode}
      title={title}
      subtitle={subtitle}
      stats={stats}
      chips={
        chipsWithVisibility && chipsWithVisibility.length > 0 ? (
          <CombatantPreviewChipRow chips={chipsWithVisibility} maxVisible={4} />
        ) : undefined
      }
      isCurrentTurn={isCurrentTurn}
      secondaryActions={secondaryActions}
      primaryAction={primaryAction}
    />
  )

  return (
    <Paper
      variant="outlined"
      sx={{
        border: '1px solid',
        borderColor,
        opacity: getCombatantPreviewCardOpacity({
          isDefeated,
          hasBattlefieldPresence,
          nonVisibleViewerPresentation: nonVisiblePresentation,
        }),
        overflow: 'hidden',
      }}
    >
      {onClick ? (
        <Box
          aria-label={`Select ${title}`}
          component="div"
          onClick={onClick}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          sx={{
            display: 'block',
            width: '100%',
            textAlign: 'left',
            p: 1.5,
            cursor: 'pointer',
          }}
        >
          {content}
        </Box>
      ) : (
        <Box sx={{ p: 1.5 }}>{content}</Box>
      )}
    </Paper>
  )
}

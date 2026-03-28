import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { AppBadge } from '@/ui/primitives'
import type { AppBadgeTone } from '@/ui/types'
import type { TurnOrderStatus, ViewerCombatantPresentationKind } from '../../../domain'
import { getTurnOrderRowOpacity } from '../../../domain/presentation-participation'

export type TurnOrderEntry = {
  combatantId: string
  label: string
  initiativeTotal: number
  status: TurnOrderStatus
  /** Banished / off-grid — dim row while still in initiative (not defeated). */
  isBattlefieldAbsent?: boolean
  /** Active viewer POV — same seam as grid token suppression. */
  presentationKind?: ViewerCombatantPresentationKind
}

type TurnOrderListProps = {
  entries: TurnOrderEntry[]
}

const STATUS_TONE: Record<TurnOrderStatus, AppBadgeTone> = {
  current: 'success',
  next: 'info',
  upcoming: 'default',
  acted: 'default',
  delayed: 'warning',
  defeated: 'danger',
}

const STATUS_LABEL: Record<TurnOrderStatus, string> = {
  current: 'Current',
  next: 'Next',
  upcoming: 'Upcoming',
  acted: 'Acted',
  delayed: 'Delayed',
  defeated: 'Defeated',
}

function TurnOrderRow({
  entry,
  orderIndex,
}: {
  entry: TurnOrderEntry
  orderIndex: number
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.25,
        borderColor:
          entry.status === 'current' ? 'primary.main' : 'divider',
        opacity: getTurnOrderRowOpacity({
          status: entry.status,
          isBattlefieldAbsent: entry.isBattlefieldAbsent ?? false,
          nonVisibleViewerPresentation:
            entry.presentationKind != null && entry.presentationKind !== 'visible',
        }),
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        spacing={1}
      >
        <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, flexShrink: 0 }}
          >
            {orderIndex + 1}.
          </Typography>
          <Typography variant="body2" noWrap>
            {entry.label}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
          <Typography variant="caption" color="text.secondary">
            {entry.initiativeTotal}
          </Typography>
          {entry.presentationKind === 'out-of-sight' && (
            <AppBadge label="Out of sight" tone="default" size="small" variant="outlined" />
          )}
          {entry.presentationKind === 'hidden' && (
            <AppBadge label="Hidden" tone="warning" size="small" variant="outlined" />
          )}
          <AppBadge
            label={STATUS_LABEL[entry.status]}
            tone={STATUS_TONE[entry.status]}
            size="small"
            variant={entry.status === 'current' ? 'filled' : 'outlined'}
          />
        </Stack>
      </Stack>
    </Paper>
  )
}

export function TurnOrderList({ entries }: TurnOrderListProps) {
  if (entries.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No initiative order yet.
      </Typography>
    )
  }

  const activeEntries = entries.filter((e) => e.status !== 'defeated')
  const defeatedEntries = entries.filter((e) => e.status === 'defeated')

  return (
    <Stack spacing={1}>
      {activeEntries.map((entry, index) => (
        <TurnOrderRow key={entry.combatantId} entry={entry} orderIndex={index} />
      ))}

      {defeatedEntries.length > 0 && (
        <>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: 'block',
              pt: activeEntries.length > 0 ? 1.5 : 0,
              pb: 0.5,
              letterSpacing: '0.08em',
              fontWeight: 600,
              textTransform: 'uppercase',
            }}
          >
            DEFEATED
          </Typography>
          {defeatedEntries.map((entry, index) => (
            <TurnOrderRow key={entry.combatantId} entry={entry} orderIndex={index} />
          ))}
        </>
      )}
    </Stack>
  )
}

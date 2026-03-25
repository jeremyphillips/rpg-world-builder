import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { areaTemplateRadiusFt } from '@/features/mechanics/domain/encounter/resolution/action/action-targeting'
import type { CombatActionDefinition } from '@/features/mechanics/domain/encounter/resolution/combat-action.types'
import { isSelfCenteredAreaAction, type AoeStep } from '../../../../helpers/area-grid-action'

import { formatAreaTemplateLabel, formatSpellRangeLine } from './aoePlacementFormat'

export type AoePlacementPanelProps = {
  action: CombatActionDefinition
  aoeStep: Exclude<AoeStep, 'none'>
  aoePlacementError?: string | null
  onDismissAoeError?: () => void
  aoeAffectedNames: string[]
  aoeAffectedTotal: number
  /** Count of creatures not listed (when list is capped). */
  aoeAffectedOverflow?: number
  onCancelAoe?: () => void
  onUndoAoeSelection?: () => void
}

export function AoePlacementPanel({
  action,
  aoeStep,
  aoePlacementError,
  onDismissAoeError,
  aoeAffectedNames,
  aoeAffectedTotal,
  aoeAffectedOverflow = 0,
  onCancelAoe,
  onUndoAoeSelection,
}: AoePlacementPanelProps) {
  const template = action.areaTemplate
  if (!template) return null

  const selfCentered = isSelfCenteredAreaAction(action)
  const metaLine = `${formatAreaTemplateLabel(template)} · ${formatSpellRangeLine(action)}`
  const approxFt = areaTemplateRadiusFt(template)

  return (
    <Stack spacing={2}>
      <header>
        <Typography component="h2" variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Placing {action.label}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {metaLine}
        </Typography>
        {selfCentered ? (
          <>
            <Typography variant="body2" color="text.secondary">
              Area centered on you. Resolve when ready.
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
              ~{approxFt} ft radius (Chebyshev grid)
            </Typography>
          </>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary">
              Choose a point on the grid. Hover to preview, click to lock. Click another valid cell to move the
              origin.
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
              ~{approxFt} ft radius (Chebyshev grid)
            </Typography>
            {aoeStep === 'confirm' && (
              <Stack component="nav" spacing={0.75} sx={{ mt: 1.5 }}>
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  onClick={() => onUndoAoeSelection?.()}
                  sx={{ alignSelf: 'flex-start', cursor: 'pointer' }}
                >
                  Undo selection
                </Link>
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  color="text.secondary"
                  onClick={() => onCancelAoe?.()}
                  sx={{ alignSelf: 'flex-start', cursor: 'pointer' }}
                >
                  Cancel {action.label}
                </Link>
              </Stack>
            )}
            {aoeStep === 'placing' && (
              <Link
                component="button"
                type="button"
                variant="body2"
                color="text.secondary"
                onClick={() => onCancelAoe?.()}
                sx={{ alignSelf: 'flex-start', cursor: 'pointer', mt: 1 }}
              >
                Cancel {action.label}
              </Link>
            )}
          </>
        )}
      </header>

      <section>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.75 }}>
          Creatures in area: {aoeAffectedTotal}
        </Typography>
        {aoeAffectedNames.length > 0 ? (
          <Box component="ul" sx={{ m: 0, pl: 2.5, color: 'text.secondary' }}>
            {aoeAffectedNames.map((name, idx) => (
              <li key={`${idx}-${name}`}>
                <Typography variant="body2" component="span">
                  {name}
                </Typography>
              </li>
            ))}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            None
          </Typography>
        )}
        {aoeAffectedOverflow > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            +{aoeAffectedOverflow} more
          </Typography>
        )}
      </section>

      {aoePlacementError && (
        <Alert severity="warning" onClose={onDismissAoeError}>
          {aoePlacementError}
        </Alert>
      )}

      {selfCentered && (
        <Link
          component="button"
          type="button"
          variant="body2"
          color="text.secondary"
          onClick={() => onCancelAoe?.()}
          sx={{ alignSelf: 'flex-start', cursor: 'pointer' }}
        >
          Cancel {action.label}
        </Link>
      )}
    </Stack>
  )
}

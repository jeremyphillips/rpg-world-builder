import type { ReactElement } from 'react'
import Box from '@mui/material/Box'
import type { TooltipProps } from '@mui/material/Tooltip'

import AppTooltip from './AppTooltip'

export type AppTooltipWrapProps = {
  /** When empty or whitespace-only, children render with no tooltip. */
  tooltip?: string
  children: ReactElement
  placement?: TooltipProps['placement']
}

/**
 * Wraps any inline child with {@link AppTooltip} when `tooltip` is non-empty.
 * Use for badges, icons, or other elements that need an optional hover explanation.
 */
export function AppTooltipWrap({ tooltip, children, placement = 'top' }: AppTooltipWrapProps) {
  if (!tooltip?.trim()) return children
  return (
    <AppTooltip title={tooltip} placement={placement}>
      <Box component="span" sx={{ display: 'inline-flex' }}>
        {children}
      </Box>
    </AppTooltip>
  )
}

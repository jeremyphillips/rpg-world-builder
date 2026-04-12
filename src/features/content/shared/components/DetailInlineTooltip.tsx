import type { ReactElement, ReactNode } from 'react'
import Box from '@mui/material/Box'
import type { TooltipProps } from '@mui/material/Tooltip'

import { AppTooltip } from '@/ui/primitives'

export type DetailInlineTooltipProps = {
  title: ReactNode
  children: ReactElement
  placement?: TooltipProps['placement']
}

/**
 * Inline hover help for detail rows and similar: wraps a trigger with {@link AppTooltip}
 * and a `cursor: help` span. Use from `DetailSpec.render` when the value is not plain text.
 */
export function DetailInlineTooltip({
  title,
  children,
  placement = 'top',
}: DetailInlineTooltipProps) {
  return (
    <AppTooltip title={title} placement={placement}>
      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', cursor: 'help' }}>
        {children}
      </Box>
    </AppTooltip>
  )
}

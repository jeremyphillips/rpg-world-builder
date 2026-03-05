import type { ReactElement, ReactNode } from 'react'
import Tooltip, { type TooltipProps } from '@mui/material/Tooltip'

export type AppTooltipProps = {
  title: ReactNode
  children: ReactElement
  placement?: TooltipProps['placement']
  disabled?: boolean
  enterDelay?: number
  leaveDelay?: number
  arrow?: boolean
}

export const AppTooltip = ({
  title,
  children,
  placement,
  disabled = false,
  enterDelay,
  leaveDelay,
  arrow = false,
}: AppTooltipProps) => {
  return (
    <Tooltip
      title={disabled ? '' : title}
      placement={placement}
      enterDelay={enterDelay}
      leaveDelay={leaveDelay}
      arrow={arrow}
    >
      {children}
    </Tooltip>
  )
}

export default AppTooltip

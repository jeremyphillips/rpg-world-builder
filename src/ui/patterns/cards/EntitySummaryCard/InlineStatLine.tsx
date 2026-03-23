import { Fragment } from 'react'

import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { AppTooltipWrap } from '@/ui/primitives'

export type InlineStatItem = {
  label: string
  value: string
  tooltip?: string
}

type InlineStatLineProps = {
  items: InlineStatItem[]
}

export function InlineStatLine({ items }: InlineStatLineProps) {
  if (items.length === 0) return null
  return (
    <Stack
      direction="row"
      component="div"
      flexWrap="wrap"
      useFlexGap
      columnGap={1}
      rowGap={0.25}
      sx={{ typography: 'caption' }}
    >
      {items.map((s, i) => (
        <Fragment key={`${s.label}-${i}`}>
          {i > 0 && (
            <Typography component="span" variant="caption" color="text.disabled" sx={{ userSelect: 'none' }}>
              ·
            </Typography>
          )}
          <AppTooltipWrap tooltip={s.tooltip}>
            <Typography component="span" variant="caption" color="text.secondary">
              {s.label}:{' '}
              <Box component="span" sx={{ color: 'text.primary', fontWeight: 600 }}>
                {s.value}
              </Box>
            </Typography>
          </AppTooltipWrap>
        </Fragment>
      ))}
    </Stack>
  )
}

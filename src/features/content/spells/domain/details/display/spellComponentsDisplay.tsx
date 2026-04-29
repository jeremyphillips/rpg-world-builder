import { Fragment } from 'react'
import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'

import type { Spell } from '@/features/content/spells/domain/types'
import { DetailInlineTooltip } from '@/features/content/shared/components/DetailInlineTooltip'

/**
 * Renders spell components as `V, S, M`. When a material component is present, a small info
 * icon shows the material description on hover.
 */
export function renderSpellComponentsDisplay(spell: Spell): ReactNode {
  const c = spell.components
  const parts: ReactNode[] = []
  if (c.verbal) parts.push('V')
  if (c.somatic) parts.push('S')
  if (c.material) parts.push('M')

  if (parts.length === 0) return '—'

  const letters = (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>
          {i > 0 && ', '}
          {p}
        </Fragment>
      ))}
    </>
  )

  if (!c.material) {
    return <span>{letters}</span>
  }

  const tooltip = c.material.description.trim()
  return (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
      <span>{letters}</span>
      {tooltip ? (
        <DetailInlineTooltip title={tooltip}>
          <InfoOutlinedIcon sx={{ fontSize: '1em', color: 'text.secondary', verticalAlign: 'middle' }} />
        </DetailInlineTooltip>
      ) : null}
    </Box>
  )
}

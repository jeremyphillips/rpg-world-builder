import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import LockIcon from '@mui/icons-material/Lock'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'

import type { Visibility } from '@/shared/types/visibility'
import { AppAlert } from '@/ui/primitives'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const DEFAULT_VISIBILITY_PUBLIC: Visibility = {
  scope: 'public',
  allowCharacterIds: [],
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const allowIds = (v: Visibility): string[] => v.allowCharacterIds ?? []

const SCOPE_META: Record<
  Visibility['scope'],
  { icon: React.ReactNode; label: string; chipLabel: string; color: 'success' | 'error' | 'warning' }
> = {
  public:     { icon: <VisibilityIcon fontSize="small" />,    label: 'Public (visible to all characters)', chipLabel: 'Public',     color: 'success' },
  dm:         { icon: <VisibilityOffIcon fontSize="small" />,  label: 'DM only',                           chipLabel: 'DM',         color: 'error' },
  restricted: { icon: <LockIcon fontSize="small" />,           label: 'Restricted (selected characters)',   chipLabel: 'Restricted', color: 'warning' },
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface VisibilityFieldProps {
  value: Visibility
  onChange: (visibility: Visibility) => void
  disabled?: boolean
  required?: boolean
  characters?: { id: string; name: string }[]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const VisibilityField = ({
  value,
  onChange,
  disabled = false,
  required = false,
  characters = [],
}: VisibilityFieldProps) => {
  const ids = allowIds(value)

  // ── Read-only display ───────────────────────────────────────────────
  if (disabled) {
    const meta = SCOPE_META[value.scope]
    const summary =
      value.scope === 'restricted'
        ? `Visible to ${ids.length} character${ids.length !== 1 ? 's' : ''}`
        : meta.label

    return (
      <Box>
        <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          Visibility{required && ' *'}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          {meta.icon}
          <Typography variant="body2">{summary}</Typography>
        </Stack>
      </Box>
    )
  }

  // ── Handlers ────────────────────────────────────────────────────────

  const handleScopeChange = (scope: Visibility['scope']) => {
    switch (scope) {
      case 'public':
        onChange({ scope: 'public', allowCharacterIds: [] })
        break
      case 'dm':
        onChange({ scope: 'dm', allowCharacterIds: [] })
        break
      case 'restricted':
        onChange({ scope: 'restricted', allowCharacterIds: ids })
        break
    }
  }

  const toggleCharacter = (charId: string) => {
    const current = new Set(ids)
    if (current.has(charId)) {
      current.delete(charId)
    } else {
      current.add(charId)
    }
    onChange({ scope: 'restricted', allowCharacterIds: Array.from(current) })
  }

  // ── Editable display ───────────────────────────────────────────────

  return (
    <Box>
      <Typography
        variant="overline"
        sx={{ display: 'block', mb: 0.5, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary' }}
      >
        Visibility{required && ' *'}
      </Typography>

      <RadioGroup
        value={value.scope}
        onChange={(e) => handleScopeChange(e.target.value as Visibility['scope'])}
      >
        <FormControlLabel
          value="public"
          control={<Radio size="small" />}
          label={
            <Stack direction="row" spacing={1} alignItems="center">
              <VisibilityIcon fontSize="small" />
              <Typography variant="body2">Public (visible to all characters)</Typography>
            </Stack>
          }
        />
        <FormControlLabel
          value="dm"
          control={<Radio size="small" />}
          label={
            <Stack direction="row" spacing={1} alignItems="center">
              <VisibilityOffIcon fontSize="small" />
              <Typography variant="body2">DM only</Typography>
            </Stack>
          }
        />
        <FormControlLabel
          value="restricted"
          control={<Radio size="small" />}
          label={
            <Stack direction="row" spacing={1} alignItems="center">
              <LockIcon fontSize="small" />
              <Typography variant="body2" color={characters.length === 0 ? 'text.disabled' : 'text.primary'}>
                Restricted (allow selected characters){characters.length === 0 ? ' — none in campaign' : ''}
              </Typography>
            </Stack>
          }
        />
      </RadioGroup>

      {value.scope === 'restricted' && ids.length === 0 && (
        <AppAlert tone="warning" sx={{ mt: 1 }}>
          Restricted is selected but no characters are allowed yet. Players will not see this until you add at least one character.
        </AppAlert>
      )}

      {value.scope === 'restricted' && (
        <Box sx={{ mt: 1, pl: 4 }}>
          {characters.length === 0 ? (
            <Typography variant="caption" color="text.secondary">
              No characters available to select.
            </Typography>
          ) : (
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              {characters.map((c) => (
                <Chip
                  key={c.id}
                  label={c.name}
                  size="small"
                  variant={ids.includes(c.id) ? 'filled' : 'outlined'}
                  color={ids.includes(c.id) ? 'primary' : 'default'}
                  onClick={() => toggleCharacter(c.id)}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Stack>
          )}
        </Box>
      )}
    </Box>
  )
}

export default VisibilityField

import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { AppBadge } from '@/ui/primitives'
import type { GroupedLogEntry } from '../../domain'
import { formatLogGroupHeader } from '../../domain'

type CombatLogEntryProps = {
  group: GroupedLogEntry
}

export function CombatLogEntryGroup({ group }: CombatLogEntryProps) {
  return (
    <Box>
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{ mb: 0.75 }}
      >
        <AppBadge
          label={formatLogGroupHeader(group)}
          tone="default"
          variant="outlined"
          size="small"
        />
      </Stack>

      <Stack spacing={0.5}>
        {group.entries.map((entry) => (
          <Box key={entry.id}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: entry.importance === 'headline' ? 600 : 400,
                color: entry.importance === 'debug' ? 'text.disabled' : 'text.primary',
              }}
            >
              {entry.message}
            </Typography>

            {entry.details && entry.details.length > 0 && (
              <Stack spacing={0.25} sx={{ pl: 2, mt: 0.25 }}>
                {entry.details.map((detail, i) => (
                  <Typography
                    key={i}
                    variant="caption"
                    color="text.secondary"
                  >
                    {detail}
                  </Typography>
                ))}
              </Stack>
            )}

            {entry.debugDetails && entry.debugDetails.length > 0 && (
              <Stack spacing={0.25} sx={{ pl: 2, mt: 0.25 }}>
                {entry.debugDetails.map((detail, i) => (
                  <Typography
                    key={i}
                    variant="caption"
                    color="text.disabled"
                    sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}
                  >
                    {detail}
                  </Typography>
                ))}
              </Stack>
            )}
          </Box>
        ))}
      </Stack>
    </Box>
  )
}

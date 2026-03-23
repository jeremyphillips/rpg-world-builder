import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

export type ActionRowBaseProps = {
  isSelected: boolean
  isAvailable?: boolean
  onSelect?: () => void
  name: React.ReactNode
  secondLine?: React.ReactNode
  badges: React.ReactNode
}

export function ActionRowBase({ isSelected, isAvailable = true, onSelect, name, secondLine, badges }: ActionRowBaseProps) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        opacity: isAvailable ? 1 : 0.5,
        cursor: onSelect ? 'pointer' : 'default',
        borderColor: isSelected ? 'primary.main' : 'divider',
        '&:hover': onSelect ? { bgcolor: 'action.hover' } : undefined,
      }}
      onClick={onSelect}
    >
      <Stack spacing={0.5}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{name}</Typography>
          </Box>
          <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }} alignItems="center">
            {badges}
          </Stack>
        </Stack>
        {secondLine}
      </Stack>
    </Paper>
  )
}

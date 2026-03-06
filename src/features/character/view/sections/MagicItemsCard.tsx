import type { MagicItem } from '@/features/content/shared/domain/types'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Chip from '@mui/material/Chip'
import EditIcon from '@mui/icons-material/Edit'
import { formatMoney } from '@/shared/money'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatAttunement(val: boolean | string | undefined): string | null {
  if (val === true) return 'Requires attunement'
  if (typeof val === 'string') return `Attunement ${val}`
  return null
}

function formatRarity(rarity: string): string {
  return rarity
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function formatSlot(slot: string): string {
  return slot.charAt(0).toUpperCase() + slot.slice(1)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type MagicItemsCardProps = {
  resolvedMagicItems: { item: MagicItem }[]
  permanentCount: number
  consumableCount: number
  onEdit?: () => void
}

export default function MagicItemsCard({
  resolvedMagicItems,
  permanentCount,
  consumableCount,
  onEdit,
}: MagicItemsCardProps) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
            Magic Items
          </Typography>
          {onEdit && (
            <Button
              size="small"
              startIcon={<EditIcon fontSize="small" />}
              onClick={onEdit}
            >
              Edit
            </Button>
          )}
        </Stack>

        {resolvedMagicItems.length > 0 ? (
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            {resolvedMagicItems.map(({ item }) => {
              const attunement = formatAttunement(item.requiresAttunement)
              return (
                <Box key={item.id}>
                  <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Typography variant="body2" fontWeight={600}>{item.name}</Typography>
                    {item.rarity && <Chip label={formatRarity(item.rarity)} size="small" variant="outlined" />}
                    <Chip label={formatSlot(item.slot)} size="small" variant="outlined" />
                    {item.consumable && <Chip label="Consumable" size="small" color="warning" variant="outlined" />}
                    {attunement && <Chip label={attunement} size="small" color="info" variant="outlined" />}
                    {item.bonus != null && <Chip label={`+${item.bonus}`} size="small" variant="outlined" />}
                  </Stack>
                  {item.effect && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: 'block' }}>{item.effect}</Typography>
                  )}
                  {item.charges != null && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      Charges: {item.charges}
                    </Typography>
                  )}
                  {item.cost && (
                    <Typography variant="caption" color="text.secondary" display="block">Value: {formatMoney(item.cost)}</Typography>
                  )}
                </Box>
              )
            })}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>—</Typography>
        )}

        {/* Item count summary */}
        {(permanentCount > 0 || consumableCount > 0) && (
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              {permanentCount} permanent · {consumableCount} consumable
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

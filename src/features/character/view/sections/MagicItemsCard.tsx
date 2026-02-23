import type { MagicItem, MagicItemEditionDatum } from '@/data/equipment/magicItems.types'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'
import EditIcon from '@mui/icons-material/Edit'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'

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

type MagicItemBudget = {
  permanentSlots: number
  consumableSlots: number
  maxAttunement?: number
}

type MagicItemsCardProps = {
  resolvedMagicItems: { item: MagicItem; datum?: MagicItemEditionDatum }[]
  magicItemBudget: MagicItemBudget | null
  permanentCount: number
  consumableCount: number
  onEdit?: () => void
}

export default function MagicItemsCard({
  resolvedMagicItems,
  magicItemBudget,
  permanentCount,
  consumableCount,
  onEdit,
}: MagicItemsCardProps) {
  const hasBudget = magicItemBudget != null
  const permanentSlotsAvail = hasBudget ? magicItemBudget.permanentSlots - permanentCount : 0
  const consumableSlotsAvail = hasBudget ? magicItemBudget.consumableSlots - consumableCount : 0
  const hasAvailableSlots = permanentSlotsAvail > 0 || consumableSlotsAvail > 0

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
            {resolvedMagicItems.map(({ item, datum }) => {
              const attunement = formatAttunement(datum?.requiresAttunement)
              return (
                <Box key={item.id}>
                  <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Typography variant="body2" fontWeight={600}>{item.name}</Typography>
                    {datum?.rarity && <Chip label={formatRarity(datum.rarity)} size="small" variant="outlined" />}
                    <Chip label={formatSlot(item.slot)} size="small" variant="outlined" />
                    {item.consumable && <Chip label="Consumable" size="small" color="warning" variant="outlined" />}
                    {attunement && <Chip label={attunement} size="small" color="info" variant="outlined" />}
                    {datum?.bonus != null && <Chip label={`+${datum.bonus}`} size="small" variant="outlined" />}
                  </Stack>
                  {datum?.effect && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: 'block' }}>{datum.effect}</Typography>
                  )}
                  {datum?.charges != null && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      Charges: {datum.charges}{datum.recharges ? ` (recharges ${datum.recharges})` : ''}
                    </Typography>
                  )}
                  {datum?.cost && datum.cost !== '—' && (
                    <Typography variant="caption" color="text.secondary" display="block">Value: {datum.cost}</Typography>
                  )}
                </Box>
              )
            })}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>—</Typography>
        )}

        {/* Budget summary */}
        {hasBudget && (
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Budget: {permanentCount} / {magicItemBudget.permanentSlots} permanent
              {' · '}{consumableCount} / {magicItemBudget.consumableSlots} consumable
              {magicItemBudget.maxAttunement != null && <> · {magicItemBudget.maxAttunement} attunement slots</>}
            </Typography>
            {hasAvailableSlots && (
              <Alert severity="info" icon={<InfoOutlinedIcon fontSize="small" />} sx={{ mt: 1, py: 0.25 }}>
                <Typography variant="caption">
                  This character can acquire
                  {permanentSlotsAvail > 0 && <> <strong>{permanentSlotsAvail}</strong> more permanent item{permanentSlotsAvail !== 1 ? 's' : ''}</>}
                  {permanentSlotsAvail > 0 && consumableSlotsAvail > 0 && ' and'}
                  {consumableSlotsAvail > 0 && <> <strong>{consumableSlotsAvail}</strong> more consumable{consumableSlotsAvail !== 1 ? 's' : ''}</>}
                  {' '}based on their level progression.
                </Typography>
              </Alert>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

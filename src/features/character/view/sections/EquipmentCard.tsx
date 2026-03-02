import type { CharacterDoc } from '@/shared'
import { getNameById } from '@/utils'
import { useCampaignRules } from '@/app/providers/CampaignRulesProvider'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Chip from '@mui/material/Chip'
import EditIcon from '@mui/icons-material/Edit'

type EquipmentCardProps = {
  equipment: CharacterDoc['equipment']
  onEdit?: () => void
}

export default function EquipmentCard({ equipment, onEdit }: EquipmentCardProps) {
  const { catalog } = useCampaignRules()
  const weaponsCatalog = Object.values(catalog.weaponsById)
  const armorCatalog = Object.values(catalog.armorById)
  const gearCatalog = Object.values(catalog.gearById)

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
            Equipment
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

        {/* Weapons */}
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>Weapons</Typography>
          {(equipment?.weapons ?? []).length > 0 ? (
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
              {(equipment?.weapons ?? []).map((w, i) => (
                <Chip key={i} label={getNameById(weaponsCatalog, w)} size="small" variant="outlined" />
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">—</Typography>
          )}
        </Box>

        {/* Armor */}
        <Box sx={{ mt: 1.5 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>Armor</Typography>
          {(equipment?.armor ?? []).length > 0 ? (
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
              {(equipment?.armor ?? []).map((a, i) => (
                <Chip key={i} label={getNameById(armorCatalog, a)} size="small" variant="outlined" />
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">—</Typography>
          )}
        </Box>

        {/* Gear */}
        <Box sx={{ mt: 1.5 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>Gear</Typography>
          {(equipment?.gear ?? []).length > 0 ? (
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
              {(equipment?.gear ?? []).map((g, i) => (
                <Chip key={i} label={getNameById(gearCatalog, g)} size="small" variant="outlined" />
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">—</Typography>
          )}
        </Box>

        {(equipment?.weight ?? 0) > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
            Total weight: {equipment?.weight ?? 0} {equipment?.weight?.unit ?? 'lbs'}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

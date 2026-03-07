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

type EquipmentItem = { id: string; name: string }
type EquipmentInput = {
  armor?: string[] | EquipmentItem[]
  weapons?: string[] | EquipmentItem[]
  gear?: string[] | EquipmentItem[]
  magicItems?: string[]
}

type EquipmentCardProps = {
  equipment: EquipmentInput | undefined
  onEdit?: () => void
}

function getLabel(item: string | EquipmentItem, catalog: { id: string; name: string }[]): string {
  return typeof item === 'object' ? item.name : getNameById(catalog, item)
}

export default function EquipmentCard({ equipment, onEdit }: EquipmentCardProps) {
  const { catalog } = useCampaignRules()
  const weaponsCatalog = Object.values(catalog.weaponsById)
  const armorCatalog = Object.values(catalog.armorById)
  const gearCatalog = Object.values(catalog.gearById)

  const weapons = (equipment?.weapons ?? []) as (string | EquipmentItem)[]
  const armor = (equipment?.armor ?? []) as (string | EquipmentItem)[]
  const gear = (equipment?.gear ?? []) as (string | EquipmentItem)[]

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
          {weapons.length > 0 ? (
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
              {weapons.map((w, i) => (
                <Chip key={i} label={getLabel(w, weaponsCatalog)} size="small" variant="outlined" />
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">—</Typography>
          )}
        </Box>

        {/* Armor */}
        <Box sx={{ mt: 1.5 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>Armor</Typography>
          {armor.length > 0 ? (
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
              {armor.map((a, i) => (
                <Chip key={i} label={getLabel(a, armorCatalog)} size="small" variant="outlined" />
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">—</Typography>
          )}
        </Box>

        {/* Gear */}
        <Box sx={{ mt: 1.5 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>Gear</Typography>
          {gear.length > 0 ? (
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
              {gear.map((g, i) => (
                <Chip key={i} label={getLabel(g, gearCatalog)} size="small" variant="outlined" />
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

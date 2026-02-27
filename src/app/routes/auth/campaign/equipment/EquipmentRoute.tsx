import { useEffect } from 'react'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import { Breadcrumbs } from '@/ui/elements'
import { useBreadcrumbs } from '@/hooks'
import { equipment } from '@/data/equipment/equipment'
import { EquipmentMediaTopCard } from '@/features/equipment/cards'
import { ROUTES } from '@/app/routes'
import { apiFetch } from '@/app/api'
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider'

export default function EquipmentRoute() {
  const { 
    campaignId: activeCampaignId, 
  } = useActiveCampaign()
  const weaponsFirst12 = equipment.weapons.slice(0, 12)
  const armorFirst12 = equipment.armor.slice(0, 12)
  const gearFirst12 = equipment.gear.slice(0, 12)
  

  useEffect(() => {
    if (!activeCampaignId) return
    apiFetch<{ campaign?: { identity: { edition?: string } } }>(`/api/campaigns/${activeCampaignId}`)
      .catch(() => {})
  }, [activeCampaignId])

  const equipmentLink = (itemId: string) =>
    activeCampaignId ? ROUTES.WORLD_EQUIPMENT_DETAILS.replace(':id', activeCampaignId).replace(':equipmentId', itemId) : undefined

  const breadcrumbs = useBreadcrumbs()

  const gridSx = {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' },
    gap: 2,
  } as const

  return (
    <Box>
      <Breadcrumbs items={breadcrumbs} />
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Equipment
      </Typography>

      <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
        Weapons
      </Typography>
      <Box sx={{ ...gridSx, mb: 4 }}>
        {weaponsFirst12.map((item) => (
          <EquipmentMediaTopCard
            key={item.id}
            name={item.name}
            subheadline={[item.damageType, item.cost].filter(Boolean).join(' · ')}
            link={equipmentLink(item.id)}
          />
        ))}
      </Box>

      <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
        Armor
      </Typography>
      <Box sx={{ ...gridSx, mb: 4 }}>
        {armorFirst12.map((item) => (
          <EquipmentMediaTopCard
            key={item.id}
            name={item.name}
            subheadline={[item.material, item.cost].filter(Boolean).join(' · ')}
            link={equipmentLink(item.id)}
          />
        ))}
      </Box>

      <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
        Gear
      </Typography>
      <Box sx={gridSx}>
        {gearFirst12.map((item) => (
          <EquipmentMediaTopCard
            key={item.id}
            name={item.name}
            subheadline={[item.category, item.cost].filter(Boolean).join(' · ')}
            link={equipmentLink(item.id)}
          />
        ))}
      </Box>
    </Box>
  )
}

import { useCampaignRules } from '@/app/providers/CampaignRulesProvider'
import { SpellHorizontalCard } from '@/features/content/spells/components'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Chip from '@mui/material/Chip'

type SpellsCardProps = {
  spells: string[]
}

export default function SpellsCard({ spells }: SpellsCardProps) {
  const { catalog } = useCampaignRules()

  if (spells.length === 0) return null

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
          Spells
        </Typography>
        <Stack spacing={1} sx={{ mt: 0.5 }}>
          {spells.map(spellId => {
            const spell = catalog.spellsById[spellId]
            if (!spell) return <Chip key={spellId} label={spellId} size="small" variant="outlined" />
            return <SpellHorizontalCard key={spellId} spell={spell} />
          })}
        </Stack>
      </CardContent>
    </Card>
  )
}

import type { CharacterDoc } from '@/features/character/domain/types'
import { StatCircle } from '@/ui/primitives'
import { ABILITY_UI } from '@/features/mechanics/domain/core/character/abilities'
import { Card, CardContent, Typography, Stack } from '@mui/material'

type AbilityScoresCardProps = {
  abilityScores: NonNullable<CharacterDoc['abilityScores']>
}

export default function AbilityScoresCard({ abilityScores }: AbilityScoresCardProps) {

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent sx={{ px: 1.5, py: 2, '&:last-child': { pb: 2 } }}>
        <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.6rem', display: 'block', textAlign: 'center', mb: 1 }}>
          Ability Scores
        </Typography>
        <Stack spacing={1} alignItems="center">
          {ABILITY_UI.map(({ key, label }) => (
            <StatCircle key={key} label={label} value={abilityScores[key]} />
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}

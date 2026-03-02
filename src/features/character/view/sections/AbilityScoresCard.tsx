import type { CharacterDoc } from '@/shared'
import { StatCircle } from '@/ui/primitives'

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
          <StatCircle label="Strength" value={abilityScores.strength} />
          <StatCircle label="Dexterity" value={abilityScores.dexterity} />
          <StatCircle label="Constitution" value={abilityScores.constitution} />
          <StatCircle label="Intelligence" value={abilityScores.intelligence} />
          <StatCircle label="Wisdom" value={abilityScores.wisdom} />
          <StatCircle label="Charisma" value={abilityScores.charisma} />
        </Stack>
      </CardContent>
    </Card>
  )
}

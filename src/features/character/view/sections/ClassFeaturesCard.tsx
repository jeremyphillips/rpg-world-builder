import type { CharacterDoc, CharacterClassInfo } from '@/features/character/domain/types'
import { classes as classesData } from '@/data/classes'
import { getById } from '@/utils'
import { getClassProgression, getSubclassFeatures } from '@/features/mechanics/domain/classes/progression'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Tooltip from '@mui/material/Tooltip'

function getClassName(classId?: string): string {
  if (!classId) return 'Unknown'
  const c = getById(classesData, classId)
  return c?.name ?? classId
}

type ClassFeaturesCardProps = {
  character: CharacterDoc
  filledClasses: CharacterClassInfo[]
  isMulticlass: boolean
}

export default function ClassFeaturesCard({
  character,
  filledClasses,
  isMulticlass,
}: ClassFeaturesCardProps) {
  const hasFeatures = filledClasses.some(cls => getClassProgression(cls.classId))
  if (!hasFeatures) return null

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
          Class Features
        </Typography>

        {filledClasses.map((cls, i) => {
          const prog = getClassProgression(cls.classId)
          if (!prog) return null
          const clsLevel = cls.level ?? character.totalLevel ?? 1
          const activeFeatures = (prog.features ?? []).filter(f => f.level <= clsLevel)
          const subFeatures = getSubclassFeatures(cls.classId, cls.subclassId, clsLevel)

          if (activeFeatures.length === 0 && subFeatures.length === 0) return null

          return (
            <Box key={i} sx={{ mt: 1, mb: i < filledClasses.length - 1 ? 2 : 0 }}>
              {isMulticlass && (
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                  {getClassName(cls.classId)} (Level {cls.level})
                </Typography>
              )}
              <Grid container spacing={2}>
                <Grid size={6}>
                  {activeFeatures.map((f, fi) => (
                    <FeatureRow key={fi} level={f.level} name={f.name} description={f.description} />
                  ))}
                </Grid>
                <Grid size={6}>
                  {subFeatures.map((f, fi) => (
                    <FeatureRow key={fi} level={f.level} name={f.name} description={f.description} />
                  ))}
                </Grid>
              </Grid>
            </Box>
          )
        })}
      </CardContent>
    </Card>
  )
}

const FeatureRow = ({ level, name, description }: { level: number; name: string; description?: string }) => {
  const content = (
    <Typography
      variant="body2"
      sx={description ? { cursor: 'help', textDecoration: 'underline dotted', textUnderlineOffset: 3 } : undefined}
    >
      <Typography component="span" variant="body2" color="text.secondary" sx={{ minWidth: 36, display: 'inline-block' }}>
        Lv {level}
      </Typography>
      {' '}{name}
    </Typography>
  )

  if (!description) return content

  return (
    <Tooltip title={description} arrow placement="top">
      {content}
    </Tooltip>
  )
}

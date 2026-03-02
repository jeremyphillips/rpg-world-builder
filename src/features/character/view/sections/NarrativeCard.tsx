import type { CharacterNarrative } from '@/features/character/hooks'
import { EditableTextField } from '@/ui/patterns'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'

type NarrativeCardProps = {
  narrative: CharacterNarrative
  canEdit: boolean
  onSave: (partial: Record<string, unknown>) => Promise<void>
}

export default function NarrativeCard({ narrative, canEdit, onSave }: NarrativeCardProps) {
  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
          Narrative
        </Typography>

        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <EditableTextField
              label="Personality Traits"
              value={narrative.personalityTraits.join(', ')}
              onSave={(v: string) =>
                onSave({
                  narrative: { ...narrative, personalityTraits: v.split(',').map((s: string) => s.trim()).filter(Boolean) },
                })
              }
              disabled={!canEdit}
              multiline
              minRows={2}
              helperText="Comma-separated"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <EditableTextField
              label="Ideals"
              value={narrative.ideals}
              onSave={(v: string) => onSave({ narrative: { ...narrative, ideals: v } })}
              disabled={!canEdit}
              multiline
              minRows={2}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <EditableTextField
              label="Bonds"
              value={narrative.bonds}
              onSave={(v: string) => onSave({ narrative: { ...narrative, bonds: v } })}
              disabled={!canEdit}
              multiline
              minRows={2}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <EditableTextField
              label="Flaws"
              value={narrative.flaws}
              onSave={(v: string) => onSave({ narrative: { ...narrative, flaws: v } })}
              disabled={!canEdit}
              multiline
              minRows={2}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <EditableTextField
              label="Backstory"
              value={narrative.backstory}
              onSave={(v: string) => onSave({ narrative: { ...narrative, backstory: v } })}
              disabled={!canEdit}
              multiline
              minRows={3}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

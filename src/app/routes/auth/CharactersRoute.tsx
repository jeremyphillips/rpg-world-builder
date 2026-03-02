import { Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import Avatar from '@mui/material/Avatar'
import Stack from '@mui/material/Stack'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import EditIcon from '@mui/icons-material/Edit'
import PersonIcon from '@mui/icons-material/Person'

import type { CharacterClassInfo } from '@/shared'
import { classes as classesData } from '@/data/classes'
import { resolveImageUrl } from '@/utils/image'
import { Breadcrumbs } from '@/ui/patterns'
import { useBreadcrumbs } from '@/hooks'
import { useCharacters } from '@/features/character/hooks'
import { CharacterBuilderLauncher } from '@/features/characterBuilder/components'
import { AppAlert } from '@/ui/primitives'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatClassLine(
  cls: CharacterClassInfo,
  isPrimary: boolean,
  isMulticlass: boolean,
): string {
  const classData = classesData.find((c) => c.id === cls.classId)
  const name = classData?.name ?? cls.classId ?? 'Unknown'

  let subclassName = ''
  if (cls.classDefinitionId && classData) {
    const options = (classData as any).definitions?.options as { id: string; name?: string }[] | undefined
    const sub = options?.find((d) => d.id === cls.classDefinitionId)
    if (sub?.name) subclassName = sub.name
  }

  let line = name
  if (subclassName) line += `, ${subclassName}`
  line += ` Level ${cls.level}`
  if (isPrimary && isMulticlass) line += ' (primary)'
  return line
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CharactersRoute() {
  const { characters, loading } = useCharacters()
  const breadcrumbs = useBreadcrumbs()

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Breadcrumbs items={breadcrumbs} />

      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h4">My Player Characters</Typography>
        <CharacterBuilderLauncher characterType="pc" />
      </Stack>

      {characters.length === 0 ? (
        <AppAlert tone="info">
          <h2>You have no player characters.</h2>
          <p>Create your first one!</p>
          <CharacterBuilderLauncher />
        </AppAlert>
      ) : (
        <Stack spacing={1.5}>
          {characters.map((c) => {
            const filledClasses = (c.classes ?? []).filter((cls) => cls.classId)
            const isMulticlass = filledClasses.length > 1
            const hasClasses = filledClasses.length > 0
            const avatarUrl = resolveImageUrl(c.imageKey)

            return (
              <Card key={c._id} variant="outlined">
                <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    {/* Avatar / thumbnail */}
                    <Avatar
                      src={avatarUrl}
                      sx={{
                        width: 64,
                        height: 64,
                        bgcolor: 'var(--mui-palette-primary-main)',
                        fontSize: '1.5rem',
                        flexShrink: 0,
                      }}
                    >
                      {avatarUrl ? null : <PersonIcon fontSize="large" />}
                    </Avatar>

                    {/* Info */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      {/* Name */}
                      <Typography variant="h6" fontWeight={700} noWrap>
                        {c.name || 'Unnamed Character'}
                      </Typography>

                      {/* Classes */}
                      {hasClasses ? (
                        filledClasses.map((cls, i) => (
                          <Typography key={i} variant="body2" color="text.secondary">
                            {formatClassLine(cls, i === 0, isMulticlass)}
                          </Typography>
                        ))
                      ) : (
                        c.class && (
                          <Typography variant="body2" color="text.secondary">
                            {c.class} Level {c.level ?? c.totalLevel ?? 1}
                          </Typography>
                        )
                      )}

                      {/* Race */}
                      {c.race && (
                        <Typography variant="body2" color="text.secondary">
                          {c.race}
                        </Typography>
                      )}

                      {/* Date */}
                      {c.createdAt && (
                        <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                          Created: {formatDate(c.createdAt)}
                        </Typography>
                      )}
                    </Box>

                    {/* Edit button */}
                    <CardActions sx={{ p: 0, flexShrink: 0 }}>
                      <Button
                        component={Link}
                        to={`/characters/${c._id}`}
                        size="small"
                        variant="outlined"
                        startIcon={<EditIcon />}
                      >
                        Edit
                      </Button>
                    </CardActions>
                  </Stack>
                </CardContent>
              </Card>
            )
          })}
        </Stack>
      )}
    </Box>
  )
}

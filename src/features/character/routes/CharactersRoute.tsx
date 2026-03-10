import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import CircularProgress from '@mui/material/CircularProgress'

/** Card summary from GET /api/characters/me (resolved race/class/subclass names). */
type CharacterCardSummary = {
  id: string
  name: string
  type?: string
  imageUrl: string | null
  race: { id: string; name: string } | null
  classes: Array<{
    classId: string
    className: string
    subclassId?: string | null
    subclassName?: string | null
    level: number
  }>
  campaign: { id: string; name: string } | null
}
import { AppPageHeader } from '@/ui/patterns'
import { useBreadcrumbs } from '@/app/navigation'
import { apiFetch } from '@/app/api'
import { CharacterBuilderLauncher } from '@/features/characterBuilder/components'
import { AppAlert } from '@/ui/primitives'
import { CharacterHorizontalCard } from '@/features/character/components'
// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CharactersRoute() {
  const [characters, setCharacters] = useState<CharacterCardSummary[]>([])
  const [loading, setLoading] = useState(true)
  const breadcrumbs = useBreadcrumbs()
  const userHasCharacters = characters.length > 0

  useEffect(() => {
    apiFetch<{ characters: CharacterCardSummary[] }>('/api/characters/me?type=pc')
      .then((data) => setCharacters(data.characters ?? []))
      .catch(() => setCharacters([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <AppPageHeader
        headline="My Player Characters"
        breadcrumbData={breadcrumbs}
        actions={userHasCharacters ? [
          <CharacterBuilderLauncher characterType="pc" />
        ] : []}
      />

      {!userHasCharacters ? (
        <AppAlert tone="info">
          <h2>You have no player characters.</h2>
          <p>Create your first one!</p>
          <CharacterBuilderLauncher />
        </AppAlert>
      ) : (
        <Stack spacing={1.5}>
          {characters.map((character) => (
            <CharacterHorizontalCard
              key={character.id}
              characterId={character.id}
              name={character.name}
              imageUrl={character.imageUrl ?? undefined}
              race={character.race ?? undefined}
              classes={character.classes}
              campaign={character.campaign ?? undefined}
            />
          ))}
        </Stack>
      )}
    </Box>
  )
}

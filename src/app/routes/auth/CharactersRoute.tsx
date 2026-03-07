import { useState, useEffect } from 'react'
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
import PersonIcon from '@mui/icons-material/Person'

/** Card summary from GET /api/characters/me */
type CharacterCardSummary = {
  id: string
  name: string
  type?: string
  imageKey?: string | null
  imageUrl?: string | null
  race?: string | null
  classes?: CharacterClassInfo[]
  campaign: { id: string; name: string } | null
  createdAt?: string | null
}
import { resolveImageUrl } from '@/utils/image'
import { AppPageHeader } from '@/ui/patterns'
import { useBreadcrumbs } from '@/hooks'
import { apiFetch } from '@/app/api'
import { CharacterBuilderLauncher } from '@/features/characterBuilder/components'
import { AppAlert } from '@/ui/primitives'
import type { CharacterClassInfo } from '@/features/character/domain/types'
import { CharacterHorizontalCard } from '@/features/character/cards'
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`
}

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
          {characters.map((character) => {
            const avatarUrl = character.imageUrl ?? resolveImageUrl(character.imageKey)
            const classLine = character.classes && character.classes.length > 0
              ? `${character.classes[0].classId}, Level ${character.classes[0].level}`
              : null

            return (
              <CharacterHorizontalCard 
                imageUrl={avatarUrl}
                key={character.id} 
                characterId={character.id} 
                name={character.name} 
                race={character.race ?? undefined} 
                classes={character.classes ?? [] as CharacterClassInfo[]}
                campaign={character.campaign}
              />
            )
          })}
        </Stack>
      )}
    </Box>
  )
}

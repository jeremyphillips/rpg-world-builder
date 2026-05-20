import { useCallback, useState, type ComponentType } from 'react'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'

type PublicHomeCharacterBuilderProps = {
  openOnMount?: boolean
}

export default function HomeRoute() {
  const [BuilderChunk, setBuilderChunk] = useState<ComponentType<PublicHomeCharacterBuilderProps> | null>(
    null,
  )
  const [loading, setLoading] = useState(false)

  const loadBuilder = useCallback(async () => {
    if (BuilderChunk || loading) return
    setLoading(true)
    try {
      const mod = await import('./PublicHomeCharacterBuilder')
      setBuilderChunk(() => mod.default)
    } finally {
      setLoading(false)
    }
  }, [BuilderChunk, loading])

  return (
    <div style={{ padding: 24 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Dungeon &amp; Dragons Character Generator
      </Typography>
      <p>Welcome! Create and manage your D&amp;D characters.</p>

      {BuilderChunk ? (
        <BuilderChunk openOnMount />
      ) : (
        <Button
          variant="contained"
          size="large"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AutoFixHighIcon />}
          onClick={() => void loadBuilder()}
          disabled={loading}
        >
          Create Character
        </Button>
      )}
    </div>
  )
}

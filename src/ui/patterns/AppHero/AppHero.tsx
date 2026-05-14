import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { AppContainer } from '@/ui/primitives'
interface AppHeroProps {
  headline: string
  subheadline: string
  image?: string
}

const AppHero = ({ headline, subheadline, image }: AppHeroProps) => (
  <Box
    sx={{
      position: 'relative',
      width: '100%',
      height: { xs: 240, md: 375 },
      overflow: 'hidden',
      borderRadius: 0,
      background: image
        ? undefined
        : 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)',
    }}
  >
    {image && (
      <Box
        component="img"
        src={image}
        alt=""
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    )}
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        background: image
          ? 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 40%, transparent 100%)'
          : 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
      }}
    />
    <Box
      sx={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        p: { xs: 2, md: 3 },
      }}
    >
      <AppContainer>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            color: 'white',
            fontWeight: 700,
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          }}
        >
          {headline}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: 'rgba(255,255,255,0.9)',
            mt: 0.5,
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          }}
        >
          {subheadline}
        </Typography>
      </AppContainer>
    </Box>
  </Box>
)

export default AppHero

import { createTheme } from '@mui/material/styles'
import { lightPalette, darkPalette } from './palette'
import { typography } from './typography'
import { components } from './components'

export { CONTROL_SIZES, type ControlSize } from './controlSizes'

const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'class',
  },
  colorSchemes: {
    light: { palette: lightPalette },
    dark: { palette: darkPalette },
  },
  typography,
  components,
  shape: {
    borderRadius: 8,
  },
})

export default theme

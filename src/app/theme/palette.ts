import type { PaletteOptions } from '@mui/material/styles'

import { colorPrimitives } from './colorPrimitives'

export const lightPalette: PaletteOptions = {
  mode: 'light',
  primary: {
    main: colorPrimitives.red[400], // Deep Red — dragon fire, war banners
    light: colorPrimitives.red[300],
    dark: colorPrimitives.red[500],
    contrastText: colorPrimitives.white,
  },
  secondary: {
    main: colorPrimitives.gold[200], // Gold — treasure, divine light
    light: colorPrimitives.gold[100],
    dark: colorPrimitives.gold[300],
    contrastText: colorPrimitives.gray[400],
  },
  background: {
    default: colorPrimitives.gray[100], // Parchment
    paper: colorPrimitives.white,
  },
  text: {
    primary: colorPrimitives.gray[400],
    secondary: colorPrimitives.gray[200],
  },
  divider: colorPrimitives.gray[200],
}

export const darkPalette: PaletteOptions = {
  mode: 'dark',
  primary: {
    main: colorPrimitives.red[200], // Ember Red — softer in the dark
    light: colorPrimitives.red[100],
    dark: colorPrimitives.red[400],
    contrastText: colorPrimitives.white,
  },
  secondary: {
    main: colorPrimitives.gold[200], // Gold stays consistent
    light: colorPrimitives.gold[100],
    dark: colorPrimitives.gold[300],
    contrastText: colorPrimitives.gray[400],
  },
  background: {
    default: colorPrimitives.gray[500], // Deep dungeon black
    paper: colorPrimitives.gray[300],
  },
  text: {
    primary: 'rgba(255, 255, 255, 0.87)',
    secondary: 'rgba(255, 255, 255, 0.60)',
  },
  divider: 'rgba(23, 14, 14, 0.12)',
}

import Container from '@mui/material/Container'
import type { ContainerProps } from '@mui/material/Container'

export type AppContainerProps = ContainerProps

/**
 * App-wide max-width column (`lg` by default). Root is a `div` unless `component` is set.
 * Under `AuthLayout`, the shell renders `<main>` — do not pass `component="main"` here.
 * `AuthLayout` wraps the outlet when the **leaf** route’s `handle.layoutWidth` is omitted or
 * `'contained'`. Set `'full'` on that leaf when the screen composes its own full-bleed hero plus
 * `AppContainer` (e.g. campaign hub index).
 */
export default function AppContainer({ maxWidth = 'lg', ...props }: AppContainerProps) {
  return <Container maxWidth={maxWidth} {...props} />
}

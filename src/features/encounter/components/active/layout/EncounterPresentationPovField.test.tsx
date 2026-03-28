import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, createTheme } from '@mui/material/styles'

import { EncounterPresentationPovField } from './EncounterPresentationPovField'

const theme = createTheme()

function renderPov(
  props: Partial<ComponentProps<typeof EncounterPresentationPovField>> & {
    simulatorViewerMode?: ComponentProps<typeof EncounterPresentationPovField>['simulatorViewerMode']
  } = {},
) {
  const onSimulatorViewerModeChange = props.onSimulatorViewerModeChange ?? vi.fn()
  render(
    <ThemeProvider theme={theme}>
      <EncounterPresentationPovField
        simulatorViewerMode={props.simulatorViewerMode ?? 'active-combatant'}
        onSimulatorViewerModeChange={onSimulatorViewerModeChange}
      />
    </ThemeProvider>,
  )
  return { onSimulatorViewerModeChange }
}

describe('EncounterPresentationPovField', () => {
  it('renders a select with label Viewing as and three POV options', async () => {
    const user = userEvent.setup()
    renderPov()

    const group = screen.getByRole('group', { name: /Viewing as/i })
    const combobox = within(group).getByRole('combobox')
    await user.click(combobox)

    const listbox = await screen.findByRole('listbox')
    expect(within(listbox).getAllByRole('option').map((o) => o.textContent)).toEqual([
      'Active combatant',
      'Selected combatant',
      'DM',
    ])
  })

  it('calls onSimulatorViewerModeChange when choosing DM', async () => {
    const user = userEvent.setup()
    const { onSimulatorViewerModeChange } = renderPov()

    const group = screen.getByRole('group', { name: /Viewing as/i })
    await user.click(within(group).getByRole('combobox'))
    await user.click(await screen.findByRole('option', { name: 'DM' }))

    expect(onSimulatorViewerModeChange).toHaveBeenCalledWith('dm')
  })

  it('calls onSimulatorViewerModeChange when choosing Selected combatant', async () => {
    const user = userEvent.setup()
    const { onSimulatorViewerModeChange } = renderPov()

    const group = screen.getByRole('group', { name: /Viewing as/i })
    await user.click(within(group).getByRole('combobox'))
    await user.click(await screen.findByRole('option', { name: 'Selected combatant' }))

    expect(onSimulatorViewerModeChange).toHaveBeenCalledWith('selected-combatant')
  })
})

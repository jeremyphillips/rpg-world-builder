import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import { LocationEditorRailSectionTabs } from '../LocationEditorRailSectionTabs';

const theme = createTheme();

describe('LocationEditorRailSectionTabs', () => {
  it('renders Location and Selection tabs only', () => {
    render(
      <ThemeProvider theme={theme}>
        <LocationEditorRailSectionTabs
          section="location"
          onSectionChange={vi.fn()}
          locationPanel={<div>loc-panel</div>}
          selectionPanel={<div>sel-panel</div>}
        />
      </ThemeProvider>,
    );
    expect(screen.getByRole('tab', { name: /location/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /selection/i })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /^map$/i })).not.toBeInTheDocument();
  });

  it('shows the matching panel for the active section', () => {
    render(
      <ThemeProvider theme={theme}>
        <LocationEditorRailSectionTabs
          section="selection"
          onSectionChange={vi.fn()}
          locationPanel={<div>loc-panel</div>}
          selectionPanel={<div>sel-panel</div>}
        />
      </ThemeProvider>,
    );
    expect(screen.getByText('sel-panel')).toBeInTheDocument();
    expect(screen.queryByText('loc-panel')).not.toBeInTheDocument();
  });

  it('calls onSectionChange when switching tabs', async () => {
    const user = userEvent.setup();
    const onSectionChange = vi.fn();
    render(
      <ThemeProvider theme={theme}>
        <LocationEditorRailSectionTabs
          section="location"
          onSectionChange={onSectionChange}
          locationPanel={<div>loc</div>}
          selectionPanel={<div>sel</div>}
        />
      </ThemeProvider>,
    );
    await user.click(screen.getByRole('tab', { name: /selection/i }));
    expect(onSectionChange).toHaveBeenCalledWith('selection');
  });
});

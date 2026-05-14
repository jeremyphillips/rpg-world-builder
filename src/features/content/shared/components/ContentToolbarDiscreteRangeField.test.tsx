import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import ContentToolbarDiscreteRangeField from './ContentToolbarDiscreteRangeField';

const theme = createTheme();

describe('ContentToolbarDiscreteRangeField', () => {
  it('renders disabled control when steps is empty', () => {
    render(
      <ThemeProvider theme={theme}>
        <ContentToolbarDiscreteRangeField
          label="CR"
          steps={[]}
          value={{ min: 0, max: 0 }}
          onChange={() => {}}
          formatValue={(n) => String(n)}
        />
      </ThemeProvider>,
    );
    expect(screen.getByRole('button', { name: /CR/ })).toBeDisabled();
  });

  it('opens popover and shows the field label', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ThemeProvider theme={theme}>
        <ContentToolbarDiscreteRangeField
          label="Level"
          steps={[1, 2, 3]}
          value={{ min: 1, max: 3 }}
          onChange={onChange}
          formatValue={(n) => String(n)}
        />
      </ThemeProvider>,
    );
    await user.click(screen.getByRole('button', { name: /Level/i }));
    const headings = screen.getAllByText('Level');
    expect(headings.length).toBeGreaterThanOrEqual(1);
  });
});

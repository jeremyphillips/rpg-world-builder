import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import { AppMultiSelect } from './AppMultiSelect';
import { AppMultiSelectCheckbox } from './AppMultiSelectCheckbox';
import AppFormMultiSelectCheckbox from '@/ui/patterns/form/AppFormMultiSelectCheckbox';

const theme = createTheme();

const OPTIONS = [
  { value: 'a' as const, label: 'Alpha' },
  { value: 'b' as const, label: 'Bravo' },
  { value: 'c' as const, label: 'Charlie' },
];

function renderWithTheme(ui: ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('AppMultiSelect (Autocomplete)', () => {
  it('summary mode: shows None selected, 1 selected, N selected', () => {
    const { rerender } = renderWithTheme(
      <AppMultiSelect label="Pick" options={OPTIONS} value={[]} onChange={() => {}} />,
    );
    expect(screen.getByText('None selected')).toBeInTheDocument();

    rerender(
      <ThemeProvider theme={theme}>
        <AppMultiSelect label="Pick" options={OPTIONS} value={['a']} onChange={() => {}} />
      </ThemeProvider>,
    );
    expect(screen.getByText('1 selected')).toBeInTheDocument();

    rerender(
      <ThemeProvider theme={theme}>
        <AppMultiSelect label="Pick" options={OPTIONS} value={['a', 'b', 'c']} onChange={() => {}} />
      </ThemeProvider>,
    );
    expect(screen.getByText('3 selected')).toBeInTheDocument();
  });

  it('summary text does not repeat the field label', () => {
    renderWithTheme(<AppMultiSelect label="Classes" options={OPTIONS} value={['a']} onChange={() => {}} />);
    const summary = screen.getByText('1 selected');
    expect(summary.textContent).not.toMatch(/Classes/i);
  });

  it('chips mode: shows option labels instead of count summary', async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <AppMultiSelect
        label="Pick"
        options={OPTIONS}
        value={['a', 'b']}
        onChange={() => {}}
        displayMode="chips"
      />,
    );
    expect(screen.queryByText('2 selected')).not.toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Bravo')).toBeInTheDocument();

    await user.click(screen.getByRole('combobox'));
    const listbox = await screen.findByRole('listbox');
    const options = within(listbox).getAllByRole('option');
    expect(options.length).toBeGreaterThanOrEqual(3);
    expect(within(options[0]!).getByRole('checkbox')).toBeInTheDocument();
  });

  it('calls onChange when toggling options', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithTheme(<AppMultiSelect label="Pick" options={OPTIONS} value={[]} onChange={onChange} />);
    await user.click(screen.getByRole('combobox'));
    const listbox = await screen.findByRole('listbox');
    await user.click(within(listbox).getByRole('option', { name: /Alpha/i }));
    expect(onChange).toHaveBeenCalledWith(['a']);
  });
});

describe('AppMultiSelectCheckbox (Select)', () => {
  it('summary mode: shows None selected, 1 selected, N selected', () => {
    const { rerender } = renderWithTheme(
      <AppMultiSelectCheckbox label="Pick" options={OPTIONS} value={[]} onChange={() => {}} />,
    );
    expect(screen.getByText('None selected')).toBeInTheDocument();

    rerender(
      <ThemeProvider theme={theme}>
        <AppMultiSelectCheckbox label="Pick" options={OPTIONS} value={['a']} onChange={() => {}} />
      </ThemeProvider>,
    );
    expect(screen.getByText('1 selected')).toBeInTheDocument();

    rerender(
      <ThemeProvider theme={theme}>
        <AppMultiSelectCheckbox label="Pick" options={OPTIONS} value={['a', 'b', 'c']} onChange={() => {}} />
      </ThemeProvider>,
    );
    expect(screen.getByText('3 selected')).toBeInTheDocument();
  });

  it('chips mode: shows option labels', () => {
    renderWithTheme(
      <AppMultiSelectCheckbox
        label="Pick"
        options={OPTIONS}
        value={['a', 'b']}
        onChange={() => {}}
        displayMode="chips"
      />,
    );
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Bravo')).toBeInTheDocument();
  });

  it('calls onChange when toggling options', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithTheme(<AppMultiSelectCheckbox label="Pick" options={OPTIONS} value={[]} onChange={onChange} />);
    await user.click(screen.getByRole('combobox'));
    const listbox = await screen.findByRole('listbox');
    await user.click(within(listbox).getByRole('option', { name: /Alpha/i }));
    expect(onChange).toHaveBeenCalledWith(['a']);
  });
});

describe('AppFormMultiSelectCheckbox', () => {
  function FormTest({ required = false }: { required?: boolean }) {
    const methods = useForm<{ items: string[] }>({ defaultValues: { items: [] } });
    return (
      <FormProvider {...methods}>
        <form noValidate onSubmit={methods.handleSubmit(() => {})}>
          <AppFormMultiSelectCheckbox name="items" label="Items" options={OPTIONS} required={required} />
          <button type="submit">Submit</button>
        </form>
      </FormProvider>
    );
  }

  it('required: shows error when empty on submit', async () => {
    const user = userEvent.setup();
    renderWithTheme(<FormTest required />);
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(await screen.findByText('Items is required')).toBeInTheDocument();
  });

  it('required: valid when at least one selected', async () => {
    const user = userEvent.setup();
    renderWithTheme(<FormTest required />);
    await user.click(screen.getByRole('combobox'));
    await user.click(within(await screen.findByRole('listbox')).getByRole('option', { name: /Alpha/i }));
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(screen.queryByText('Items is required')).not.toBeInTheDocument();
  });
});

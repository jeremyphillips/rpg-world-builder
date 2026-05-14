import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import { AppSelect } from './AppSelect';
import AppFormSelect from '@/ui/patterns/form/AppFormSelect';
import {
  FormLayoutStretchProvider,
  formGridStretchOutlinedSx,
} from '@/ui/patterns/form/FormLayoutStretchContext';

const theme = createTheme();

const OPTIONS = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B' },
];

function renderWithTheme(ui: ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

function inputLabelRoot(container: HTMLElement) {
  return container.querySelector('label.MuiInputLabel-root');
}

describe('AppSelect', () => {
  it('empty + placeholder: shows placeholder and shrinks label when blurred', () => {
    const { container } = renderWithTheme(
      <AppSelect
        label="Status"
        placeholder="Pick one"
        value=""
        onChange={() => {}}
        options={OPTIONS}
      />,
    );

    expect(screen.getByText('Pick one')).toBeInTheDocument();
    const label = inputLabelRoot(container);
    expect(label).toBeTruthy();
    expect(label!.className).toMatch(/MuiInputLabel-shrink/);
  });

  it('selected value + placeholder prop: shows option label, not placeholder', () => {
    renderWithTheme(
      <AppSelect
        label="Status"
        placeholder="Pick one"
        value="a"
        onChange={() => {}}
        options={OPTIONS}
      />,
    );

    expect(screen.getByRole('combobox')).toHaveTextContent('Option A');
    expect(screen.queryByText('Pick one')).not.toBeInTheDocument();
  });

  it('empty without placeholder: label is not shrunk when blurred', () => {
    const { container } = renderWithTheme(
      <AppSelect label="Status" value="" onChange={() => {}} options={OPTIONS} />,
    );

    const label = inputLabelRoot(container);
    expect(label).toBeTruthy();
    expect(label!.className).not.toMatch(/MuiInputLabel-shrink/);
  });

  it('stretch + placeholder empty: renders and keeps placeholder visible', () => {
    renderWithTheme(
      <FormLayoutStretchProvider value>
        <AppSelect
          label="Status"
          placeholder="Pick one"
          value=""
          onChange={() => {}}
          options={OPTIONS}
          sx={formGridStretchOutlinedSx}
        />
      </FormLayoutStretchProvider>,
    );

    const selectRoot = document.querySelector('.MuiSelect-select');
    expect(selectRoot).toBeTruthy();
    expect(window.getComputedStyle(selectRoot!).display).toBe('flex');
    expect(window.getComputedStyle(selectRoot!).alignItems).toBe('center');
    expect(screen.getByText('Pick one')).toBeInTheDocument();
  });

  it('stretch + selected value: shows selected label', () => {
    renderWithTheme(
      <FormLayoutStretchProvider value>
        <AppSelect
          label="Status"
          placeholder="Pick one"
          value="b"
          onChange={() => {}}
          options={OPTIONS}
          sx={formGridStretchOutlinedSx}
        />
      </FormLayoutStretchProvider>,
    );

    expect(screen.getByRole('combobox')).toHaveTextContent('Option B');
  });
});

describe('AppFormSelect + AppSelect (required)', () => {
  function RequiredSelectForm() {
    const methods = useForm<{ field: string }>({ defaultValues: { field: '' } });
    return (
      <FormProvider {...methods}>
        {/* Match AppForm: native required on Select must not block RHF validation */}
        <form noValidate onSubmit={methods.handleSubmit(() => {})}>
          <AppFormSelect
            name="field"
            label="Choose"
            placeholder="Select…"
            required
            options={OPTIONS}
          />
          <button type="submit">Submit</button>
        </form>
      </FormProvider>
    );
  }

  it('required: empty value shows validation error after submit', async () => {
    const user = userEvent.setup();
    renderWithTheme(<RequiredSelectForm />);

    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByText('Choose is required')).toBeInTheDocument();
  });

  it('required: selecting a value clears error on resubmit', async () => {
    const user = userEvent.setup();
    renderWithTheme(<RequiredSelectForm />);

    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(await screen.findByText('Choose is required')).toBeInTheDocument();

    await user.click(screen.getByRole('combobox'));
    const listbox = await screen.findByRole('listbox');
    await user.click(within(listbox).getByRole('option', { name: 'Option A' }));

    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(screen.queryByText('Choose is required')).not.toBeInTheDocument();
  });
});

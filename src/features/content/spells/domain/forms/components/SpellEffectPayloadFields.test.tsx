import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';

import { createDefaultSpellEffectFormRow } from '../assembly/spellEffectRow.assembly';
import type { SpellEffectFormRow, SpellFormValues } from '../types/spellForm.types';
import { SpellEffectPayloadFields } from './SpellEffectPayloadFields';

function TestWrapper({
  kind,
  rowOverrides,
  children,
}: {
  kind: string;
  rowOverrides?: Partial<SpellEffectFormRow>;
  children: (prefix: string) => ReactNode;
}) {
  const row: SpellEffectFormRow = {
    ...createDefaultSpellEffectFormRow(),
    kind: kind as SpellEffectFormRow['kind'],
    ...rowOverrides,
  };
  const methods = useForm<SpellFormValues>({
    defaultValues: {
      effectGroups: [
        {
          targeting: { selection: '', targetType: '' },
          effects: [row],
        },
      ],
    },
  });
  return <FormProvider {...methods}>{children('effectGroups.0.effects.0')}</FormProvider>;
}

describe('SpellEffectPayloadFields', () => {
  it('shows dice-mode damage fields under Damage with short labels', () => {
    render(
      <TestWrapper kind="damage">
        {(prefix) => <SpellEffectPayloadFields namePrefix={prefix} patchDriver={null} />}
      </TestWrapper>,
    );
    expect(screen.getByText(/^Damage$/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Format$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Count$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Face$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Modifier$/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/^Value$/i)).not.toBeInTheDocument();
  });

  it('shows Value in flat mode under Damage', () => {
    render(
      <TestWrapper kind="damage" rowOverrides={{ damageFormat: 'flat' }}>
        {(prefix) => <SpellEffectPayloadFields namePrefix={prefix} patchDriver={null} />}
      </TestWrapper>,
    );
    expect(screen.getByText(/^Damage$/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Format$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Value$/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/^Count$/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^Face$/i)).not.toBeInTheDocument();
  });

  it('shows note field when kind is note', () => {
    render(
      <TestWrapper kind="note">
        {(prefix) => <SpellEffectPayloadFields namePrefix={prefix} patchDriver={null} />}
      </TestWrapper>,
    );
    expect(screen.getByLabelText(/Note text/i)).toBeInTheDocument();
  });

  it('shows stub notice when kind is save', () => {
    render(
      <TestWrapper kind="save">
        {(prefix) => <SpellEffectPayloadFields namePrefix={prefix} patchDriver={null} />}
      </TestWrapper>,
    );
    expect(screen.getByText(/not be saved to the spell until supported/i)).toBeInTheDocument();
  });
});

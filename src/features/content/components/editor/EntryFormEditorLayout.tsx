/**
 * Shared editor wrapper: EntryEditorLayout + form + DynamicFormRenderer.
 * Supports RHF (create/edit) and patch driver modes.
 */
import { useCallback, useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { DynamicFormRenderer, type FormDriver } from '@/ui/patterns';
import type { FieldConfig } from '@/ui/patterns';
import type { Visibility } from '@/shared/types/visibility';
import EntryEditorLayout from '../EntryEditorLayout';
import { createPatchDriver } from '@/features/content/editor/patchDriver';

export type ValidationError = {
  path: string;
  code: string;
  message: string;
};

type BaseProps = {
  typeLabel: string;
  isNew: boolean;
  saving: boolean;
  /** When omitted, derived from form state (RHF) or driver (patch). */
  dirty?: boolean;
  success: boolean;
  errors: ValidationError[];
  formId: string;
  onBack?: () => void;
  fields: FieldConfig[];
  showPolicyField?: boolean;
  policyValue?: Visibility;
  onPolicyChange?: (next: Visibility) => void;
  policyCharacters?: { id: string; name: string }[];
  canDelete?: boolean;
  onDelete?: () => Promise<void> | void;
  validateDelete?: () => Promise<
    | { allowed: true }
    | { allowed: false; message: string; reason?: string; blockingEntities?: { id: string; label: string; to?: string }[] }
  >;
};

type CreateEditProps = BaseProps & {
  mode: 'create' | 'edit';
  defaultValues: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
};

type PatchProps = BaseProps & {
  mode: 'patch';
  base: Record<string, unknown>;
  initialPatch: Record<string, unknown>;
  onSavePatch: (patch: Record<string, unknown>) => void | Promise<void>;
  onRemovePatch?: () => void | Promise<void>;
};

export type EntryFormEditorLayoutProps = CreateEditProps | PatchProps;

const FORM_ID_PREFIX = 'entry-form-editor';

export default function EntryFormEditorLayout(
  props: EntryFormEditorLayoutProps
) {
  const {
    typeLabel,
    isNew,
    saving,
    success,
    errors,
    formId,
    onBack,
    fields,
    showPolicyField = false,
    policyValue,
    onPolicyChange,
    policyCharacters,
    canDelete = false,
    onDelete,
    validateDelete,
  } = props;

  if (props.mode === 'patch') {
    return (
      <EntryFormEditorLayoutPatch
        {...props}
        typeLabel={typeLabel}
        isNew={isNew}
        saving={saving}
        success={success}
        errors={errors}
        formId={formId}
        onBack={onBack}
        fields={fields}
        showPolicyField={showPolicyField}
        policyValue={policyValue}
        onPolicyChange={onPolicyChange}
        policyCharacters={policyCharacters}
        canDelete={canDelete}
        onDelete={onDelete}
        validateDelete={validateDelete}
      />
    );
  }

  return (
    <EntryFormEditorLayoutRHF
      {...props}
      typeLabel={typeLabel}
      isNew={isNew}
      saving={saving}
      success={success}
      errors={errors}
      formId={formId}
      onBack={onBack}
      fields={fields}
      showPolicyField={showPolicyField}
      policyValue={policyValue}
      onPolicyChange={onPolicyChange}
      policyCharacters={policyCharacters}
      canDelete={canDelete}
      onDelete={onDelete}
      validateDelete={validateDelete}
    />
  );
}

function EntryFormEditorLayoutRHF({
  typeLabel,
  isNew,
  saving,
  dirty,
  success,
  errors,
  formId,
  onBack,
  fields,
  showPolicyField,
  policyValue,
  onPolicyChange,
  policyCharacters,
  canDelete,
  onDelete,
  validateDelete,
  defaultValues,
  onSubmit,
}: CreateEditProps) {
  const methods = useForm({
    defaultValues: defaultValues as Record<string, unknown>,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });
  const { formState: { isDirty } } = methods;
  const resolvedDirty = dirty ?? isDirty;

  const handleSubmit = useCallback(
    async (values: Record<string, unknown>) => {
      await onSubmit(values);
    },
    [onSubmit]
  );

  return (
    <FormProvider {...methods}>
      <EntryEditorLayout
        typeLabel={typeLabel}
        isNew={isNew}
        saving={saving}
        dirty={resolvedDirty}
        success={success}
        errors={errors}
        formId={formId}
        onBack={onBack}
        showPolicyField={showPolicyField}
        policyValue={policyValue}
        onPolicyChange={onPolicyChange}
        policyCharacters={policyCharacters}
        canDelete={canDelete}
        onDelete={onDelete}
        validateDelete={validateDelete}
      >
        <form
          id={formId}
          onSubmit={methods.handleSubmit(handleSubmit)}
          noValidate
        >
          <DynamicFormRenderer fields={fields} />
        </form>
      </EntryEditorLayout>
    </FormProvider>
  );
}

function EntryFormEditorLayoutPatch({
  typeLabel,
  isNew,
  saving,
  success,
  errors,
  formId,
  onBack,
  fields,
  showPolicyField,
  policyValue,
  onPolicyChange,
  policyCharacters,
  canDelete,
  onDelete,
  validateDelete,
  base,
  initialPatch,
  onSavePatch,
}: PatchProps) {
  const [, setVersion] = useState(0);

  const driver = useMemo(() => {
    return createPatchDriver({
      base,
      initialPatch,
      onChange: () => setVersion((v) => v + 1),
    });
  }, [base, initialPatch]);

  const dirty = driver.isDirty();
  const formDriver: FormDriver = useMemo(
    () => ({
      kind: 'patch',
      getValue: (path) => driver.getValue(path),
      setValue: (path, value) => driver.setValue(path, value),
      unsetValue: (path) => driver.unsetValue(path),
    }),
    [driver]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      await onSavePatch(driver.getPatch());
    },
    [driver, onSavePatch]
  );

  const policyValueResolved = policyValue ?? (driver.getValue('accessPolicy') as Visibility | undefined);
  const handlePolicyChange = useCallback(
    (next: Visibility) => {
      driver.setValue('accessPolicy', next);
      onPolicyChange?.(next);
    },
    [driver, onPolicyChange]
  );

  return (
    <EntryEditorLayout
      typeLabel={typeLabel}
      isNew={isNew}
      saving={saving}
      dirty={dirty}
      success={success}
      errors={errors}
      formId={formId}
      onBack={onBack}
      showPolicyField={showPolicyField}
      policyValue={policyValueResolved}
      onPolicyChange={handlePolicyChange}
      policyCharacters={policyCharacters}
      canDelete={canDelete}
      onDelete={onDelete}
      validateDelete={validateDelete}
    >
      <form id={formId} onSubmit={handleSubmit} noValidate>
        <DynamicFormRenderer fields={fields} driver={formDriver} />
      </form>
    </EntryEditorLayout>
  );
}

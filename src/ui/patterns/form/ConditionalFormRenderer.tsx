/**
 * Wrapper around DynamicFormRenderer that filters fields by visibleWhen conditions.
 * Clears field values when they transition from visible to hidden.
 */
import { useRef, useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import type { FieldConfig } from './form.types';
import type { FormDriver } from './DynamicFormRenderer';
import type { PatchValidationApi } from './validation/PatchValidationContext';
import { evaluateCondition } from './conditions';
import { PatchValidationProvider } from './validation/PatchValidationContext';
import DynamicFormRenderer from './DynamicFormRenderer';

function getAtPath(obj: Record<string, unknown>, path: string): unknown {
  const segments = path.split('.');
  let current: unknown = obj;
  for (const seg of segments) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[seg];
  }
  return current;
}

function getFieldPath(field: FieldConfig): string {
  return 'path' in field && field.path ? field.path : field.name;
}

/** Path to unset when field becomes hidden. For patchBinding, use domainPath. */
function getFieldPathForUnset(field: FieldConfig): string {
  if (field.patchBinding) return field.patchBinding.domainPath;
  return getFieldPath(field);
}

type ConditionalFormRendererProps = {
  fields: FieldConfig[];
  spacing?: number;
  driver?: FormDriver;
  onValidationApi?: (api: PatchValidationApi) => void;
};

function ConditionalFormRendererPatch({
  fields,
  spacing,
  driver,
  onValidationApi,
}: ConditionalFormRendererProps & { driver: NonNullable<FormDriver> }) {
  const prevVisibleRef = useRef<Record<string, boolean>>({});
  const isInitialRenderRef = useRef(true);

  const getValue = (path: string) => driver.getValue(path);
  const visibleFields = fields.filter((f) => {
    if (!f.visibleWhen) return true;
    return evaluateCondition(f.visibleWhen, getValue);
  });

  useEffect(() => {
    if (isInitialRenderRef.current) {
      isInitialRenderRef.current = false;
      visibleFields.forEach((f) => {
        prevVisibleRef.current[f.name] = true;
      });
      return;
    }

    const nowVisible = new Set(visibleFields.map((f) => f.name));

    for (const field of fields) {
      const wasVisible = prevVisibleRef.current[field.name];
      const isVisible = nowVisible.has(field.name);

      if (wasVisible && !isVisible && driver.unsetValue) {
        driver.unsetValue(getFieldPathForUnset(field));
      }
      prevVisibleRef.current[field.name] = isVisible;
    }
  }, [fields, visibleFields, driver]);

  return (
    <PatchValidationProvider
      visibleFields={visibleFields}
      driver={driver}
      onValidationApi={onValidationApi}
    >
      <DynamicFormRenderer
        fields={visibleFields}
        spacing={spacing}
        driver={driver}
      />
    </PatchValidationProvider>
  );
}

function ConditionalFormRendererRHF({
  fields,
  spacing,
}: ConditionalFormRendererProps) {
  const { control, setValue, clearErrors } = useFormContext();
  const watchValues = useWatch({ control });

  const prevVisibleRef = useRef<Record<string, boolean>>({});
  const isInitialRenderRef = useRef(true);

  const getValue = (path: string) =>
    getAtPath((watchValues ?? {}) as Record<string, unknown>, path);

  const visibleFields = fields.filter((f) => {
    if (!f.visibleWhen) return true;
    return evaluateCondition(f.visibleWhen, getValue);
  });

  useEffect(() => {
    if (isInitialRenderRef.current) {
      isInitialRenderRef.current = false;
      visibleFields.forEach((f) => {
        prevVisibleRef.current[f.name] = true;
      });
      return;
    }

    const nowVisible = new Set(visibleFields.map((f) => f.name));

    for (const field of fields) {
      const wasVisible = prevVisibleRef.current[field.name];
      const isVisible = nowVisible.has(field.name);

      if (wasVisible && !isVisible) {
        const defaultValue = 'defaultValue' in field ? field.defaultValue : undefined;
        setValue(field.name, defaultValue ?? undefined, { shouldDirty: true });
        clearErrors(field.name);
      }
      prevVisibleRef.current[field.name] = isVisible;
    }
  }, [fields, visibleFields, setValue, clearErrors]);

  return (
    <DynamicFormRenderer
      fields={visibleFields}
      spacing={spacing}
    />
  );
}

export default function ConditionalFormRenderer(props: ConditionalFormRendererProps) {
  if (props.driver?.kind === 'patch') {
    return (
      <ConditionalFormRendererPatch
        {...props}
        driver={props.driver}
        onValidationApi={props.onValidationApi}
      />
    );
  }
  return <ConditionalFormRendererRHF {...props} />;
}

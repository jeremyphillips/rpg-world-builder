/**
 * Wrapper around DynamicFormRenderer that filters fields by visibleWhen conditions.
 * Clears field values when they transition from visible to hidden.
 */
import { useRef, useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import type { FieldConfig, FormLayoutNode } from './form.types';
import type { FormDriver } from './DynamicFormRenderer';
import type { PatchValidationApi } from './validation/PatchValidationContext';
import { evaluateCondition } from './conditions';
import { PatchValidationProvider } from './validation/PatchValidationContext';
import DynamicFormRenderer from './DynamicFormRenderer';

function isLeafFieldConfig(n: FormLayoutNode): n is FieldConfig {
  if ('type' in n && n.type === 'repeatable-group') return false;
  if ('type' in n && n.type === 'custom') return false;
  return true;
}

/**
 * `visibleWhen` paths are form field names (e.g. `castingTimeUnit`). Patch `driver.getValue(name)`
 * resolves domain keys on the merged entry, so map through `FieldConfig.path` / `patchBinding`
 * the same way `DriverField` does.
 */
function resolvePatchConditionValue(
  fields: FormLayoutNode[],
  path: string,
  driver: { getValue: (p: string) => unknown },
): unknown {
  const field = fields.find(
    (f) => isLeafFieldConfig(f) && f.name === path,
  ) as FieldConfig | undefined;
  if (field?.patchBinding) {
    const domainVal = driver.getValue(field.patchBinding.domainPath);
    return field.patchBinding.parse(domainVal);
  }
  if (field?.path) {
    return driver.getValue(field.path);
  }
  if (field) {
    return driver.getValue(field.name);
  }
  return driver.getValue(path);
}

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
  fields: FormLayoutNode[];
  spacing?: number;
  driver?: FormDriver;
  onValidationApi?: (api: PatchValidationApi) => void;
};

type PatchFormDriver = Extract<FormDriver, { kind: 'patch' }>;

function ConditionalFormRendererPatch({
  fields,
  spacing,
  driver,
  onValidationApi,
}: ConditionalFormRendererProps & { driver: PatchFormDriver }) {
  const prevVisibleRef = useRef<Record<string, boolean>>({});
  const isInitialRenderRef = useRef(true);

  const getValue = (path: string) => resolvePatchConditionValue(fields, path, driver);
  const visibleFields = fields.filter((f) => {
    if (!isLeafFieldConfig(f)) return true;
    if (!f.visibleWhen) return true;
    return evaluateCondition(f.visibleWhen, getValue);
  });

  const leafVisibleFields = visibleFields.filter(isLeafFieldConfig);

  useEffect(() => {
    if (isInitialRenderRef.current) {
      isInitialRenderRef.current = false;
      leafVisibleFields.forEach((f) => {
        prevVisibleRef.current[f.name] = true;
      });
      return;
    }

    const nowVisible = new Set(leafVisibleFields.map((f) => f.name));

    for (const field of fields) {
      if (!isLeafFieldConfig(field)) continue;
      const wasVisible = prevVisibleRef.current[field.name];
      const isVisible = nowVisible.has(field.name);

      if (wasVisible && !isVisible && driver.unsetValue) {
        driver.unsetValue(getFieldPathForUnset(field));
      }
      prevVisibleRef.current[field.name] = isVisible;
    }
  }, [fields, leafVisibleFields, driver]);

  return (
    <PatchValidationProvider
      visibleFields={leafVisibleFields}
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
    if (!isLeafFieldConfig(f)) return true;
    if (!f.visibleWhen) return true;
    return evaluateCondition(f.visibleWhen, getValue);
  });

  useEffect(() => {
    if (isInitialRenderRef.current) {
      isInitialRenderRef.current = false;
      visibleFields.filter(isLeafFieldConfig).forEach((f) => {
        prevVisibleRef.current[f.name] = true;
      });
      return;
    }

    const nowVisible = new Set(
      visibleFields.filter(isLeafFieldConfig).map((f) => f.name),
    );

    for (const field of fields) {
      if (!isLeafFieldConfig(field)) continue;
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

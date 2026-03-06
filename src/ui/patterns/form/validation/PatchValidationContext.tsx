/**
 * Context for patch-mode field validation.
 * Provides error state and validation API to DriverField and parent.
 */
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { FieldConfig } from '../form.types';
import type { PatchDriver } from '../DriverField';
import { validatePatchField, type PatchFieldErrors } from './patchValidation';

function getFieldPath(field: FieldConfig): string {
  return 'path' in field && field.path ? field.path : field.name;
}

/** Resolve value for validation. For patchBinding, use domain path + parse. */
function getFieldValueForValidation(field: FieldConfig, driver: PatchDriver): unknown {
  if (field.patchBinding) {
    return field.patchBinding.parse(driver.getValue(field.patchBinding.domainPath));
  }
  return driver.getValue(getFieldPath(field));
}

export type PatchValidationApi = {
  validateAll: () => boolean;
  getErrors: () => PatchFieldErrors;
};

type PatchValidationContextValue = {
  errors: PatchFieldErrors;
  getError: (name: string) => string | undefined;
  setError: (name: string, msg: string | undefined) => void;
  clearError: (name: string) => void;
  validateOne: (field: FieldConfig, getValue: (path: string) => unknown) => boolean;
};

const PatchValidationContext = createContext<PatchValidationContextValue | null>(null);

export function usePatchValidation(): PatchValidationContextValue | null {
  return useContext(PatchValidationContext);
}

type PatchValidationProviderProps = {
  visibleFields: FieldConfig[];
  driver: PatchDriver;
  onValidationApi?: (api: PatchValidationApi) => void;
  children: React.ReactNode;
};

export function PatchValidationProvider({
  visibleFields,
  driver,
  onValidationApi,
  children,
}: PatchValidationProviderProps) {
  const [errors, setErrors] = useState<PatchFieldErrors>({});

  const setError = useCallback((name: string, msg: string | undefined) => {
    setErrors((prev) => (prev[name] === msg ? prev : { ...prev, [name]: msg }));
  }, []);

  const clearError = useCallback((name: string) => {
    setErrors((prev) => (prev[name] === undefined ? prev : { ...prev, [name]: undefined }));
  }, []);

  const getError = useCallback(
    (name: string) => errors[name],
    [errors],
  );

  const validateOne = useCallback(
    (field: FieldConfig, getValue: (path: string) => unknown): boolean => {
      const value = field.patchBinding
        ? field.patchBinding.parse(driver.getValue(field.patchBinding.domainPath))
        : getValue(getFieldPath(field));
      const err = validatePatchField({ field, value });
      setError(field.name, err);
      return !err;
    },
    [driver, setError],
  );

  const validateAll = useCallback((): boolean => {
    let valid = true;
    const next: PatchFieldErrors = {};
    for (const field of visibleFields) {
      const value = getFieldValueForValidation(field, driver);
      const err = validatePatchField({ field, value });
      if (err) {
        next[field.name] = err;
        valid = false;
      }
    }
    setErrors(next);
    return valid;
  }, [driver, visibleFields]);

  const getErrors = useCallback(() => ({ ...errors }), [errors]);

  useEffect(() => {
    onValidationApi?.({ validateAll, getErrors });
  }, [onValidationApi, validateAll, getErrors]);

  const value: PatchValidationContextValue = {
    errors,
    getError,
    setError,
    clearError,
    validateOne,
  };

  return (
    <PatchValidationContext.Provider value={value}>
      {children}
    </PatchValidationContext.Provider>
  );
}

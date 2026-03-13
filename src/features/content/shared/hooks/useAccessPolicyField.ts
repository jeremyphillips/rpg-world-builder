import { useCallback } from 'react';
import type { UseFormSetValue } from 'react-hook-form';
import type { Visibility } from '@/shared/types/visibility';

type FormValuesWithAccessPolicy = { accessPolicy?: Visibility };

export function useAccessPolicyField<TFormValues extends FormValuesWithAccessPolicy>(
  watch: (name: string) => Visibility,
  setValue: UseFormSetValue<TFormValues>
) {
  const policyValue = watch('accessPolicy');
  const accessPolicyPath = 'accessPolicy' as Parameters<typeof setValue>[0];
  const handlePolicyChange = useCallback(
    (next: Visibility) => setValue(accessPolicyPath, next as any, { shouldDirty: true }),
    [accessPolicyPath, setValue]
  );

  return {
    policyValue,
    handlePolicyChange,
  };
}

import { useCallback } from 'react';

import type { BlockingEntity } from '@/features/content/shared/components';

export interface ValidationBlockedState {
  blockingEntities: BlockingEntity[];
  message?: string;
}

export interface UseValidatedAllowedToggleOptions {
  campaignId?: string | null;
  onToggleAllowed: (id: string, allowed: boolean) => void;
  setValidationBlocked: (value: ValidationBlockedState | null) => void;
  validateDisallow: (
    id: string,
  ) => Promise<{ allowed: boolean; blockingEntities?: BlockingEntity[]; message?: string }>;
}

/**
 * Returns a memoized handleToggleAllowed callback for campaign content list routes.
 * Encapsulates the validated disallow workflow: allow toggles immediately,
 * disallow toggles run content-specific validation first.
 */
export function useValidatedAllowedToggle({
  campaignId,
  onToggleAllowed,
  setValidationBlocked,
  validateDisallow,
}: UseValidatedAllowedToggleOptions) {
  return useCallback(
    async (id: string, allowed: boolean) => {
      setValidationBlocked(null);
      if (allowed) {
        onToggleAllowed(id, true);
        return;
      }
      if (!campaignId) return;
      const result = await validateDisallow(id);
      if (!result.allowed) {
        setValidationBlocked({
          blockingEntities: result.blockingEntities ?? [],
          message: result.message,
        });
        return;
      }
      onToggleAllowed(id, false);
    },
    [campaignId, onToggleAllowed, setValidationBlocked, validateDisallow],
  );
}

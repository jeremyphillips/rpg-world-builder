import { useCallback, useMemo } from 'react';

import { apiFetch } from '@/app/api';
import type { AuthUserPreferences, ContentListPreferencesKey } from '@/shared';
import { APP_DATA_GRID_ALLOWED_IN_CAMPAIGN_FILTER_ID } from '@/ui/patterns';

type UserWithPreferences = { preferences?: AuthUserPreferences } | null | undefined;

export interface UseContentListPreferencesParams {
  canManage: boolean;
  user: UserWithPreferences;
  refreshUser: () => Promise<void>;
  contentListKey: ContentListPreferencesKey;
}

/**
 * Reads/writes persisted UI prefs for campaign content list toolbars (e.g. hide disallowed via Allowed filter).
 * Extend this hook as more list-level preferences are added.
 */
export function useContentListPreferences({
  canManage,
  user,
  refreshUser,
  contentListKey,
}: UseContentListPreferencesParams): {
  initialFilterValues: { allowedInCampaign: string } | undefined;
  onFilterValueChange: (filterId: string, value: unknown) => Promise<void>;
} {
  const hideDisallowedPref = user?.preferences?.ui?.contentLists?.[contentListKey]?.hideDisallowed;

  const initialFilterValues = useMemo(() => {
    if (!canManage) return undefined;
    return {
      allowedInCampaign: hideDisallowedPref ? 'true' : 'all',
    };
  }, [canManage, hideDisallowedPref]);

  const onFilterValueChange = useCallback(
    async (filterId: string, value: unknown) => {
      if (filterId !== APP_DATA_GRID_ALLOWED_IN_CAMPAIGN_FILTER_ID) return;
      const allowed = String(value);
      const hideDisallowed = allowed === 'true';
      try {
        await apiFetch('/api/auth/me', {
          method: 'PATCH',
          body: {
            preferences: {
              ui: {
                contentLists: {
                  [contentListKey]: { hideDisallowed },
                },
              },
            },
          },
        });
        await refreshUser();
      } catch {
        // Runtime filter still applies; preference may not persist.
      }
    },
    [contentListKey, refreshUser],
  );

  return { initialFilterValues, onFilterValueChange };
}

import { useCallback, useMemo } from 'react';

import { apiFetch } from '@/app/api';
import type { AuthUserPreferences, ContentListPreferencesKey } from '@/shared';
import { APP_DATA_GRID_ALLOWED_IN_CAMPAIGN_FILTER_ID } from '@/ui/patterns';

type UserWithPreferences = { preferences?: AuthUserPreferences } | null | undefined;

export interface UseContentListPreferencesParams {
  canManage: boolean;
  user: UserWithPreferences;
  refreshUser: () => Promise<void>;
  /** When omitted, no persisted list prefs are applied (empty initial values, no-op change handler). */
  contentListKey?: ContentListPreferencesKey;
}

/**
 * Reads/writes persisted UI prefs for campaign content list toolbars (e.g. hide disallowed via Allowed filter).
 * Extend this hook as more list-level preferences are added.
 */
const noopOnFilterValueChange = async (_filterId: string, _value: unknown) => {};

export function useContentListPreferences({
  canManage,
  user,
  refreshUser,
  contentListKey,
}: UseContentListPreferencesParams): {
  initialFilterValues: { allowedInCampaign: string } | undefined;
  onFilterValueChange: (filterId: string, value: unknown) => Promise<void>;
} {
  const hideDisallowedPref = contentListKey
    ? user?.preferences?.ui?.contentLists?.[contentListKey]?.hideDisallowed
    : undefined;

  const initialFilterValues = useMemo(() => {
    if (!contentListKey || !canManage) return undefined;
    return {
      allowedInCampaign: hideDisallowedPref ? 'true' : 'all',
    };
  }, [canManage, contentListKey, hideDisallowedPref]);

  const onFilterValueChange = useCallback(
    async (filterId: string, value: unknown) => {
      if (!contentListKey) return;
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

  return {
    initialFilterValues,
    onFilterValueChange: contentListKey ? onFilterValueChange : noopOnFilterValueChange,
  };
}

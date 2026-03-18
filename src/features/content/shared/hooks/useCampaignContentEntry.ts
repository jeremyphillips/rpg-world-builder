import { useEffect, useState, useCallback } from 'react';
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/rulesets/ids/systemIds';
import type { SystemRulesetId } from '@/features/mechanics/domain/rulesets/types/ruleset.types';

export interface UseCampaignContentEntryResult<T> {
  entry: T | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
  /** Bump the internal key to re-fetch the entry. */
  refetch: () => void;
}

export interface UseCampaignContentEntryOptions<T> {
  campaignId: string | undefined;
  entryId: string | undefined;
  fetchEntry: (campaignId: string, systemId: SystemRulesetId, entryId: string) => Promise<T | null>;
  systemId?: SystemRulesetId;
}

export function useCampaignContentEntry<T>(
  options: UseCampaignContentEntryOptions<T>,
): UseCampaignContentEntryResult<T> {
  const {
    campaignId,
    entryId,
    fetchEntry,
    systemId = DEFAULT_SYSTEM_RULESET_ID,
  } = options;

  const [entry, setEntry] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    if (!campaignId || !entryId) return;
    let cancelled = false;

    setLoading(true);
    setError(null);
    setNotFound(false);

    fetchEntry(campaignId, systemId, entryId)
      .then((loaded) => {
        if (cancelled) return;
        if (!loaded) {
          setEntry(null);
          setNotFound(true);
        } else {
          setEntry(loaded);
          setNotFound(false);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError((err as Error).message);
        setEntry(null);
        setNotFound(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [campaignId, entryId, fetchEntry, systemId, refreshKey]);

  return { entry, loading, error, notFound, refetch };
}

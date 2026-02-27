import { useEffect, useState } from 'react';
import { DEFAULT_SYSTEM_ID } from '@/features/mechanics/domain/core/rules/campaignRulesetRepo';

export interface UseCampaignContentEntryResult<T> {
  entry: T | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
}

export interface UseCampaignContentEntryOptions<T> {
  campaignId: string | undefined;
  entryId: string | undefined;
  fetchEntry: (campaignId: string, systemId: string, entryId: string) => Promise<T | null>;
  systemId?: string;
}

export function useCampaignContentEntry<T>(
  options: UseCampaignContentEntryOptions<T>,
): UseCampaignContentEntryResult<T> {
  const {
    campaignId,
    entryId,
    fetchEntry,
    systemId = DEFAULT_SYSTEM_ID,
  } = options;

  const [entry, setEntry] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

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
  }, [campaignId, entryId, fetchEntry, systemId]);

  return { entry, loading, error, notFound };
}

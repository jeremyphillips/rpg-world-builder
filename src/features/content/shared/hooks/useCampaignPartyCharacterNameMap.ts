import { useEffect, useState } from 'react';

import { apiFetch } from '@/app/api';

type PartyCharacterRow = {
  id: string
  name?: string
}

/**
 * Fetches approved party characters and returns a map of character ID → name.
 * DM-only: use when canManage to show character names in restricted tooltips.
 */
export function useCampaignPartyCharacterNameMap(
  campaignId: string | null,
  enabled: boolean,
) {
  const [characterNameById, setCharacterNameById] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !campaignId) {
      setCharacterNameById({});
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const url = `/api/campaigns/${campaignId}/party?status=approved`;

    apiFetch<{ characters?: PartyCharacterRow[] }>(url, {
      signal: controller.signal,
    })
      .then((data) => {
        if (controller.signal.aborted) return;
        const rows = data.characters ?? [];
        const map: Record<string, string> = {};
        for (const c of rows) {
          map[c.id] = c.name ?? 'Unnamed character'
        }
        setCharacterNameById(map);
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setCharacterNameById({});
          setError(err instanceof Error ? err.message : 'Failed to load party');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [campaignId, enabled]);

  return { characterNameById, loading, error };
}

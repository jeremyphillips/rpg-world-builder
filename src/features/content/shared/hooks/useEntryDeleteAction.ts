import { useCallback } from 'react';
import type { NavigateFunction } from 'react-router-dom';

export function useEntryDeleteAction(params: {
  campaignId: string | undefined;
  entryId: string | undefined;
  deleteEntry: (campaignId: string, entryId: string) => Promise<void>;
  navigate: NavigateFunction;
  backPath: string;
}) {
  const { campaignId, entryId, deleteEntry, navigate, backPath } = params;

  return useCallback(async () => {
    if (!campaignId || !entryId) return;
    await deleteEntry(campaignId, entryId);
    navigate(backPath, { replace: true });
  }, [campaignId, entryId, deleteEntry, navigate, backPath]);
}

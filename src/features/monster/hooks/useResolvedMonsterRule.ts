import { useMemo } from "react";
import { useActiveCampaign } from "@/app/providers/ActiveCampaignProvider";
import type { Monster } from "@/data";
import { resolveEditionRule } from '@/features/mechanics/domain/resolution';

export function useResolvedMonsterRule(monster: Monster) {
  const { editionId } = useActiveCampaign();

  return useMemo(() => {
    if (!editionId) {
      return {
        resolved: null,
        hasNativeRule: false,
        hasConvertedRule: false
      };
    }

    const resolved = resolveEditionRule(monster, editionId);

    return {
      resolved,
      hasNativeRule: !!resolved && !resolved.converted,
      hasConvertedRule: !!resolved && resolved.converted
    };
  }, [monster, editionId]);
}
  
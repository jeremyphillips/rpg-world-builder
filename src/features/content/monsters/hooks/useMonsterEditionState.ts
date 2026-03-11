import type { Monster } from "@/features/content/monsters/domain/types/monster.types";
import type { EditionRule } from "@/features/mechanics/domain/edition";
import { useActiveCampaign } from "@/app/providers/ActiveCampaignProvider";
import { resolveEditionRule } from '@/features/mechanics/domain/resolution/resolveEditionRule';

 type MonsterEditionState =
  | { type: "loading" }
  | { type: "native"; rule: EditionRule }
  | { type: "converted"; rule: EditionRule; sourceEdition: string }
  | { type: "incompatible"; availableEditions: string[] };

  export function useMonsterEditionState(monster: Monster): MonsterEditionState {
    const {
        campaignId, 
        editionId,
        // TODO: add allowLegacy for monsters to Campaign config
        // allowLegacy 
    } =useActiveCampaign();
  
    if (!campaignId || !editionId) {
      return { type: "loading" };
    }
  
    const resolved = resolveEditionRule(monster, editionId);
  
    if (resolved?.rule && !resolved.converted) {
      return { type: "native", rule: resolved.rule };
    }
  
    if (resolved?.rule && resolved.converted) {
      return {
        type: "converted",
        rule: resolved.rule,
        sourceEdition: resolved.sourceEdition!
      };
    }
  
    return {
      type: "incompatible",
      availableEditions: monster.editionRules.map(r => r.edition)
    };
  }
  
import type { AbilityId, AbilityScoreValue } from '@/features/mechanics/domain/core/character'
import type { AlignmentId, RaceId } from '@/features/content/shared/domain/types'
import type { StartingWealth } from './class.types'

export interface Note {
  id: string
  text: string
}

export type AbilityRequirement = {
  ability: AbilityId;
  min: AbilityScoreValue;
};

export type AbilityRequirementGroup = {
  all: AbilityRequirement[];
};

export type RequirementExpr = {
  anyOf: AbilityRequirementGroup[];
  note?: string;
}

export interface ClassRequirement {
  allowedRaces: 'all' | RaceId[]
  allowedAlignments: 'any' | AlignmentId[]
  levelCaps?: Record<string, AbilityScoreValue | 'unlimited'>
  minStats?: RequirementExpr
  multiclassing?: RequirementExpr
  startingWealth?: StartingWealth
  generationNotes?: Note[]
}

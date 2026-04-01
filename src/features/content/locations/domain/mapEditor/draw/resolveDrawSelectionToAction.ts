import type { LocationEdgeFeatureKindId } from '@/features/content/locations/domain/mapContent/locationEdgeFeature.types';
import type { LocationPathFeatureKindId } from '@/features/content/locations/domain/mapContent/locationPathFeature.types';

import type { LocationMapActiveDrawSelection } from '../types/locationMapEditor.types';

export type ResolvedDrawKindAction =
  | { type: 'path'; pathKind: LocationPathFeatureKindId }
  | { type: 'edge'; edgeKind: LocationEdgeFeatureKindId }
  | { type: 'unsupported'; reason?: string };

export function resolveDrawSelectionToAction(
  selection: LocationMapActiveDrawSelection,
): ResolvedDrawKindAction {
  if (!selection) {
    return { type: 'unsupported', reason: 'no_selection' };
  }
  if (selection.category === 'path') {
    return { type: 'path', pathKind: selection.kind };
  }
  return { type: 'edge', edgeKind: selection.kind };
}

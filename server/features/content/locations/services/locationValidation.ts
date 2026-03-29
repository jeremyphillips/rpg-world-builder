/**
 * Single entry point for location feature validation helpers (re-exports + naming).
 * Pure map/scale checks re-export from shared domain; persistence-aware checks live in *Validation.ts modules.
 */

export {
  buildAncestorIdsFromParentRow,
  LOCATION_SCALE_ORDER,
  scaleRank,
  validateParentChildScales as validateLocationScaleNesting,
} from '../domain/locations.hierarchy';
export type { HierarchyValidationError, LocationScaleId } from '../domain/locations.hierarchy';

export {
  cellIdExistsOnMap,
  cellIdsOnMap,
  validateCellUnitForKind,
  validateGridDimensions,
  validateLocationMapCells,
  validateLocationMapInput,
  validateMapKind,
} from '../../../../../shared/domain/locations/locationMap.validation';
export { validateCellEntriesStructure } from '../../../../../shared/domain/locations/locationMapCellAuthoring.validation';

export type { LocationMapValidationError } from '../../../../../shared/domain/locations/locationMap.validation';
export type MapValidationError =
  import('../../../../../shared/domain/locations/locationMap.validation').LocationMapValidationError;

export {
  validateLocationTransitionInput,
  validateSourceCell,
  validateSourceMap,
  validateTargetLocation,
  validateTargetMapAndCells,
  validateTransitionKind,
} from './locationTransitionValidation';
export type { TransitionValidationError } from './locationTransitionValidation';

/**
 * Rich per-edge instance state — discriminated union (not a keyed bag).
 * Extend with new variants as more edge families gain typed instance state.
 */
export type LocationMapEdgeAuthoringState =
  | {
      family: 'door';
      v?: number;
    }
  | {
      family: 'window';
      v?: number;
    };

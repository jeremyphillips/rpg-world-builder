/**
 * Content feature type architecture — reference for authors (not imported by app runtime).
 *
 * Locations is the first template: see `shared/domain/locations/locationEntity.types.ts`,
 * `shared/domain/locations/building/locationBuilding.types.ts`, client
 * `src/features/content/locations/domain/model/location/location.types.ts`, and server
 * `server/features/content/locations/services/locations.service.ts` (`LocationDoc`).
 */

export {};

/*
 * -----------------------------------------------------------------------------
 * A. Placement
 * -----------------------------------------------------------------------------
 *
 * - `shared/domain/<feature>/` — types used by **both** client and server (field blocks,
 *   ids, nested profiles, validation helpers that are scale-agnostic).
 * - `src/features/content/<feature>/domain/...` — **client-only** (forms, UI projections,
 *   editor drafts, flattened setup values). Do not move these to shared unless the server
 *   truly needs the same shape.
 * - `server/features/content/<feature>/...` — **server-only** (persistence docs, request
 *   handlers, DB row shapes). Compose from shared where it stays readable.
 *
 * If only one layer needs a type, keep it in that layer. Shared is for real overlap.
 */

/*
 * -----------------------------------------------------------------------------
 * B. DRY
 * -----------------------------------------------------------------------------
 *
 * - Shared domain owns **reusable field blocks** (e.g. `LocationBaseFields`) and **nested
 *   profile** types (e.g. `LocationBuildingProfile`). Prefer composition over copy-paste.
 * - Client and server types should **extend, intersect, or `Pick`/`Omit`** from shared
 *   rather than re-listing the same fields — but stop before the type becomes unreadable.
 * - Avoid long chains of utility types; clarity beats cleverness.
 */

/*
 * -----------------------------------------------------------------------------
 * C. Naming
 * -----------------------------------------------------------------------------
 *
 * - `*BaseFields` — reusable shared field block for an entity (ids + core attributes).
 * - `*Profile` — nested scale- or domain-specific data (e.g. building, later city/world).
 * - `*Doc` — server persistence / row shape (often adds `campaignId`, timestamps, policies).
 * - `*FormValues` — client form state (often strings, flattened; not the domain entity).
 * - `*Summary` — UI list or lightweight projection.
 * - `*Input` — create/update payload where distinct from the full entity.
 */

/*
 * -----------------------------------------------------------------------------
 * D. Evolution
 * -----------------------------------------------------------------------------
 *
 * - Add scale- or mode-specific details as **optional nested profiles** on the shared
 *   entity before introducing a giant discriminated union across every scale.
 * - Use discriminated unions when **many consumers** need compile-time branching per variant.
 * - Keep **draft / editor / setup** types separate from the shared domain entity — forms
 *   are a view layer; map them explicitly in mappers.
 */

/*
 * -----------------------------------------------------------------------------
 * E. Example (Locations) — conceptual layout
 * -----------------------------------------------------------------------------
 *
 * ```ts
 * // shared/domain/locations/locationEntity.types.ts
 * interface LocationBaseFields {
 *   id: LocationId;
 *   name: string;
 *   scale: LocationScaleId;
 *   // ...
 *   buildingProfile?: LocationBuildingProfile;
 * }
 * type Location = LocationBaseFields;
 *
 * // Client: content shell + shared block
 * type ClientLocation = ContentItem & LocationBaseFields;
 *
 * // Client-only form (flattened strings, etc.)
 * type LocationFormValues = ContentFormValues & { scale: string; gridColumns: string; ... };
 *
 * // Server: shared fields + persistence
 * type LocationDoc = Omit<LocationBaseFields, 'ancestorIds'> & {
 *   campaignId: string;
 *   ancestorIds: string[];
 *   accessPolicy?: AccessPolicy;
 *   createdAt: string;
 *   updatedAt: string;
 * };
 * ```
 *
 * **Follow-up when adding city/world profiles:** define `LocationCityProfile` /
 * `LocationWorldProfile` in shared next to `LocationBuildingProfile`, add optional
 * `cityProfile?` / `worldProfile?` on `LocationBaseFields`, and wire persistence only
 * when the schema is ready — still avoid a full scale discriminated union until needed.
 */

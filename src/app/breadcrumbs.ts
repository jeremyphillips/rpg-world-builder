import { apiFetch } from './api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BreadcrumbRouteConfig {
  /** Static label, or a function that derives a label from route params */
  label: string
  /**
   * Async resolver for dynamic labels (e.g. entity names).
   * When provided, the static `label` is used as fallback while loading.
   */
  resolveLabel?: (params: Record<string, string>) => Promise<string>
}

// ---------------------------------------------------------------------------
// Async label resolvers
// ---------------------------------------------------------------------------

async function resolveCampaignName(params: Record<string, string>): Promise<string> {
  const id = params.id
  if (!id) return 'Campaign'
  const data = await apiFetch<{ campaign?: { identity?: { name?: string } } }>(
    `/api/campaigns/${id}`,
  )
  return data.campaign?.identity?.name ?? 'Campaign'
}

// ---------------------------------------------------------------------------
// Config map
//
// Each key is a route pattern (matching ROUTES values). The breadcrumb system
// walks from the root to the current URL, matching each ancestor path against
// this map to build the trail.
//
// To add breadcrumbs for a new route, add a single entry here — no changes
// needed in the route component itself.
// ---------------------------------------------------------------------------

export const BREADCRUMB_CONFIG: Record<string, BreadcrumbRouteConfig> = {
  // Top-level
  '/dashboard':                                    { label: 'Dashboard' },
  '/characters':                                   { label: 'Characters' },
  '/characters/new':                               { label: 'New Character' },
  '/characters/:id':                               { label: 'Character' },
  '/campaigns':                                    { label: 'Campaigns' },

  // Campaign subtree
  '/campaigns/:id':                                { label: 'Campaign', resolveLabel: resolveCampaignName },
  '/campaigns/:id/equipment':                      { label: 'Equipment' },
  '/campaigns/:id/equipment/:equipmentId':         { label: 'Details' },
  '/campaigns/:id/sessions':                       { label: 'Sessions' },
  '/campaigns/:id/sessions/:sessionId':            { label: 'Session' },
  '/campaigns/:id/messages':                       { label: 'Messages' },
  '/campaigns/:id/messages/:conversationId':       { label: 'Conversation' },

  // World subtree
  '/campaigns/:id/world':                          { label: 'World' },
  '/campaigns/:id/world/locations':                { label: 'Locations' },
  '/campaigns/:id/world/locations/:locationId':    { label: 'Location' },
  '/campaigns/:id/world/npcs':                     { label: 'NPCs' },
  '/campaigns/:id/world/npcs/:npcId':              { label: 'NPC' },
  '/campaigns/:id/world/monsters':                 { label: 'Monsters' },
  '/campaigns/:id/world/monsters/:monsterId':      { label: 'Monster' },

  // Equipment subtree
  '/campaigns/:id/world/equipment':                            { label: 'Equipment' },
  '/campaigns/:id/world/equipment/weapons':                    { label: 'Weapons' },
  '/campaigns/:id/world/equipment/weapons/new':                { label: 'New Weapon' },
  '/campaigns/:id/world/equipment/weapons/:weaponId':          { label: 'Weapon' },
  '/campaigns/:id/world/equipment/weapons/:weaponId/edit':     { label: 'Edit' },
  '/campaigns/:id/world/equipment/armor':                      { label: 'Armor' },
  '/campaigns/:id/world/equipment/armor/new':                  { label: 'New Armor' },
  '/campaigns/:id/world/equipment/armor/:armorId':             { label: 'Armor' },
  '/campaigns/:id/world/equipment/armor/:armorId/edit':        { label: 'Edit' },
  '/campaigns/:id/world/equipment/gear':                       { label: 'Gear' },
  '/campaigns/:id/world/equipment/gear/new':                   { label: 'New Gear' },
  '/campaigns/:id/world/equipment/gear/:gearId':               { label: 'Gear' },
  '/campaigns/:id/world/equipment/gear/:gearId/edit':          { label: 'Edit' },
  '/campaigns/:id/world/equipment/magic-items':                { label: 'Magic Items' },
  '/campaigns/:id/world/equipment/magic-items/new':            { label: 'New Magic Item' },
  '/campaigns/:id/world/equipment/magic-items/:magicItemId':   { label: 'Magic Item' },
  '/campaigns/:id/world/equipment/magic-items/:magicItemId/edit': { label: 'Edit' },
  '/campaigns/:id/world/races':                                { label: 'Races' },
  '/campaigns/:id/world/races/new':                            { label: 'New Race' },
  '/campaigns/:id/world/races/:raceId':                        { label: 'Race' },
  '/campaigns/:id/world/races/:raceId/edit':                   { label: 'Edit' },

  // Admin
  '/admin':                                        { label: 'Admin' },
  '/admin/invites':                                { label: 'Invites' },
  '/admin/brainstorming':                          { label: 'Brainstorming' },
  '/admin/settings':                               { label: 'Settings' },
}

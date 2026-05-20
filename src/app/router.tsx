import { createBrowserRouter, Outlet, Navigate } from 'react-router-dom'
import { ROUTES } from './routes'
import type { AppRouteHandle } from './routing/layoutWidth'
import { lazyRoute } from '@/app/routing/lazyRoute'
import { AppProviders } from './providers/AppProviders'
// MUI layouts — PublicLayout stays sync (tiny); AuthLayout lazy for public-path entry wins
import PublicLayout from './layouts/public/PublicLayout'

const AuthLayout = lazyRoute(() => import('./layouts/auth/AuthLayout'))
const CharacterProvidersLayout = lazyRoute(() => import('./providers/CharacterProvidersLayout'))

// Encounter + game-session: async chunks (pilot splitting)
const EncounterLayout = lazyRoute(() => import('@/features/encounter/routes/EncounterLayout'))
const EncounterIndexRedirect = lazyRoute(() => import('@/features/encounter/routes/EncounterIndexRedirect'))
const EncounterSetupRoute = lazyRoute(() => import('@/features/encounter/routes/EncounterSetupRoute'))
const EncounterActiveRoute = lazyRoute(() => import('@/features/encounter/routes/EncounterActiveRoute'))
const GameSessionListRoute = lazyRoute(() => import('@/features/game-session/routes/GameSessionListRoute'))
const GameSessionLayout = lazyRoute(() => import('@/features/game-session/routes/GameSessionLayout'))
const GameSessionIndexRedirect = lazyRoute(() => import('@/features/game-session/routes/GameSessionIndexRedirect'))
const GameSessionLobbyRoute = lazyRoute(() => import('@/features/game-session/routes/GameSessionLobbyRoute'))
const GameSessionSetupRoute = lazyRoute(() => import('@/features/game-session/routes/GameSessionSetupRoute'))
const GameSessionPlayRoute = lazyRoute(() => import('@/features/game-session/routes/GameSessionPlayRoute'))

// Campaign world subtree (equipment, content, NPCs — async chunk batch)
const WorldLayout = lazyRoute(() => import('@/features/campaign/routes/world/WorldLayout'))
const EquipmentHubRoute = lazyRoute(() => import('@/features/content/equipment/routes/EquipmentHubRoute'))

const WeaponsListRoute = lazyRoute(() => import('@/features/content/equipment/weapons/routes'), 'WeaponsListRoute')
const WeaponDetailRoute = lazyRoute(() => import('@/features/content/equipment/weapons/routes'), 'WeaponDetailRoute')
const WeaponCreateRoute = lazyRoute(() => import('@/features/content/equipment/weapons/routes'), 'WeaponCreateRoute')
const WeaponEditRoute = lazyRoute(() => import('@/features/content/equipment/weapons/routes'), 'WeaponEditRoute')

const ArmorListRoute = lazyRoute(() => import('@/features/content/equipment/armor/routes'), 'ArmorListRoute')
const ArmorDetailRoute = lazyRoute(() => import('@/features/content/equipment/armor/routes'), 'ArmorDetailRoute')
const ArmorCreateRoute = lazyRoute(() => import('@/features/content/equipment/armor/routes'), 'ArmorCreateRoute')
const ArmorEditRoute = lazyRoute(() => import('@/features/content/equipment/armor/routes'), 'ArmorEditRoute')

const GearListRoute = lazyRoute(() => import('@/features/content/equipment/gear/routes'), 'GearListRoute')
const GearDetailRoute = lazyRoute(() => import('@/features/content/equipment/gear/routes'), 'GearDetailRoute')
const GearCreateRoute = lazyRoute(() => import('@/features/content/equipment/gear/routes'), 'GearCreateRoute')
const GearEditRoute = lazyRoute(() => import('@/features/content/equipment/gear/routes'), 'GearEditRoute')

const MagicItemsListRoute = lazyRoute(() => import('@/features/content/equipment/magicItems/routes'), 'MagicItemsListRoute')
const MagicItemDetailRoute = lazyRoute(() => import('@/features/content/equipment/magicItems/routes'), 'MagicItemDetailRoute')
const MagicItemCreateRoute = lazyRoute(() => import('@/features/content/equipment/magicItems/routes'), 'MagicItemCreateRoute')
const MagicItemEditRoute = lazyRoute(() => import('@/features/content/equipment/magicItems/routes'), 'MagicItemEditRoute')

const ClassListRoute = lazyRoute(() => import('@/features/content/classes/routes'), 'ClassListRoute')
const ClassDetailRoute = lazyRoute(() => import('@/features/content/classes/routes'), 'ClassDetailRoute')
const ClassCreateRoute = lazyRoute(() => import('@/features/content/classes/routes'), 'ClassCreateRoute')
const ClassEditRoute = lazyRoute(() => import('@/features/content/classes/routes'), 'ClassEditRoute')

const RaceListRoute = lazyRoute(() => import('@/features/content/races/routes'), 'RaceListRoute')
const RaceDetailRoute = lazyRoute(() => import('@/features/content/races/routes'), 'RaceDetailRoute')
const RaceCreateRoute = lazyRoute(() => import('@/features/content/races/routes'), 'RaceCreateRoute')
const RaceEditRoute = lazyRoute(() => import('@/features/content/races/routes'), 'RaceEditRoute')

const LocationListRoute = lazyRoute(() => import('@/features/content/locations/routes'), 'LocationListRoute')
const LocationDetailRoute = lazyRoute(() => import('@/features/content/locations/routes'), 'LocationDetailRoute')
const LocationCreateRoute = lazyRoute(() => import('@/features/content/locations/routes'), 'LocationCreateRoute')
const LocationEditRoute = lazyRoute(() => import('@/features/content/locations/routes'), 'LocationEditRoute')

const NpcsRoute = lazyRoute(() => import('@/features/character/routes/NpcsRoute'))
const NpcRoute = lazyRoute(() => import('@/features/character/routes/NpcRoute'))

const MonsterListRoute = lazyRoute(() => import('@/features/content/monsters/routes'), 'MonsterListRoute')
const MonsterDetailRoute = lazyRoute(() => import('@/features/content/monsters/routes'), 'MonsterDetailRoute')
const MonsterCreateRoute = lazyRoute(() => import('@/features/content/monsters/routes'), 'MonsterCreateRoute')
const MonsterEditRoute = lazyRoute(() => import('@/features/content/monsters/routes'), 'MonsterEditRoute')

const SpellListRoute = lazyRoute(() => import('@/features/content/spells/routes'), 'SpellListRoute')
const SpellDetailRoute = lazyRoute(() => import('@/features/content/spells/routes'), 'SpellDetailRoute')
const SpellCreateRoute = lazyRoute(() => import('@/features/content/spells/routes'), 'SpellCreateRoute')
const SpellEditRoute = lazyRoute(() => import('@/features/content/spells/routes'), 'SpellEditRoute')

const SkillProficiencyListRoute = lazyRoute(
  () => import('@/features/content/skillProficiencies/routes'),
  'SkillProficiencyListRoute',
)
const SkillProficiencyDetailRoute = lazyRoute(
  () => import('@/features/content/skillProficiencies/routes'),
  'SkillProficiencyDetailRoute',
)
const SkillProficiencyCreateRoute = lazyRoute(
  () => import('@/features/content/skillProficiencies/routes'),
  'SkillProficiencyCreateRoute',
)
const SkillProficiencyEditRoute = lazyRoute(
  () => import('@/features/content/skillProficiencies/routes'),
  'SkillProficiencyEditRoute',
)

// Auth shell & campaign hub (outside world subtree)
const DashboardRoute = lazyRoute(() => import('@/features/campaign/routes/DashboardRoute'))
const UsersRoute = lazyRoute(() => import('@/features/user/routes/UsersRoute'))
const CharactersRoute = lazyRoute(() => import('@/features/character/routes/CharactersRoute'))
const CharacterRoute = lazyRoute(() => import('@/features/character/routes/CharacterRoute'))
const NewCharacterRoute = lazyRoute(() => import('@/features/character/routes/NewCharacterRoute'))
const CampaignsRoute = lazyRoute(() => import('@/features/campaign/routes/CampaignsRoute'))
const CampaignLayoutRoute = lazyRoute(() => import('@/features/campaign/routes/CampaignLayoutRoute'))
const CampaignHubRoute = lazyRoute(() => import('@/features/campaign/routes/CampaignHubRoute'))
const InviteRoute = lazyRoute(() => import('@/features/campaign/routes/InviteRoute'))
const RulesRoute = lazyRoute(() => import('@/features/campaign/routes/RulesRoute'))
const PartyRoute = lazyRoute(() => import('@/features/campaign/routes/PartyRoute'))
const SessionsRoute = lazyRoute(() => import('@/features/campaign/routes/sessions'), 'SessionsRoute')
const SessionRoute = lazyRoute(() => import('@/features/campaign/routes/sessions'), 'SessionRoute')
const MessagingRoute = lazyRoute(() => import('@/features/campaign/routes/messaging/MessagingRoute'))
const CampaignAdminInvitesRoute = lazyRoute(
  () => import('@/features/campaign/routes/admin/CampaignAdminInvitesRoute'),
)
const CampaignAdminSettingsRoute = lazyRoute(
  () => import('@/features/campaign/routes/admin/CampaignAdminSettingsRoute'),
)
const CampaignRulesetEditorRoute = lazyRoute(
  () => import('@/features/campaign/routes/admin/CampaignRulesetEditorRoute'),
)

/** Kept synchronous: small wrappers + every world edit route subtree. */
import AdminGuard from '@/features/campaign/routes/admin/AdminGuard'
import ContentManageGuard from '@/features/campaign/routes/ContentManageGuard'

import { HomeRoute, LoginRoute, RegisterRoute, AcceptInviteRoute } from './routes/public'

function RootLayout() {
  return (
    <AppProviders>
      <Outlet />
    </AppProviders>
  )
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { path: ROUTES.HOME, element: <HomeRoute /> },
          { path: ROUTES.LOGIN, element: <LoginRoute /> },
          { path: ROUTES.REGISTER, element: <RegisterRoute /> },
          { path: ROUTES.ACCEPT_INVITE, element: <AcceptInviteRoute /> },
        ],
      },
      {
        element: <AuthLayout />,
        children: [
          { path: ROUTES.DASHBOARD, element: <DashboardRoute /> },
          { path: ROUTES.USERS, element: <UsersRoute /> },
          {
            element: <CharacterProvidersLayout />,
            children: [
              { path: ROUTES.CHARACTERS, element: <CharactersRoute /> },
              { path: ROUTES.NEW_CHARACTER, element: <NewCharacterRoute /> },
              { path: ROUTES.CHARACTER, element: <CharacterRoute /> },
            ],
          },
          { path: ROUTES.CAMPAIGNS, element: <CampaignsRoute /> },
          {
            path: ROUTES.CAMPAIGN,
            element: <CampaignLayoutRoute />,
            children: [
              {
                index: true,
                element: <CampaignHubRoute />,
                handle: { layoutWidth: 'full' } satisfies AppRouteHandle,
              },
              {
                path: 'world',
                element: <WorldLayout />,
                children: [
                  { index: true, element: <Navigate to="locations" replace /> },
                  { path: 'equipment', element: <EquipmentHubRoute /> },
                  { path: 'equipment/weapons', element: <WeaponsListRoute /> },
                  { path: 'equipment/weapons/:weaponId', element: <WeaponDetailRoute /> },
                  { path: 'equipment/armor', element: <ArmorListRoute /> },
                  { path: 'equipment/armor/:armorId', element: <ArmorDetailRoute /> },
                  { path: 'equipment/gear', element: <GearListRoute /> },
                  { path: 'equipment/gear/:gearId', element: <GearDetailRoute /> },
                  { path: 'equipment/magic-items', element: <MagicItemsListRoute /> },
                  { path: 'equipment/magic-items/:magicItemId', element: <MagicItemDetailRoute /> },
                  { path: 'classes', element: <ClassListRoute /> },
                  { path: 'classes/:classId', element: <ClassDetailRoute /> },
                  { path: 'races', element: <RaceListRoute /> },
                  { path: 'races/:raceId', element: <RaceDetailRoute /> },
                  { path: 'locations', element: <LocationListRoute /> },
                  { path: 'locations/:locationId', element: <LocationDetailRoute /> },
                  { path: 'npcs', element: <NpcsRoute /> },
                  { path: 'npcs/:npcId', element: <NpcRoute /> },
                  { path: 'monsters', element: <MonsterListRoute /> },
                  { path: 'monsters/:monsterId', element: <MonsterDetailRoute /> },
                  { path: 'spells', element: <SpellListRoute /> },
                  { path: 'spells/:spellId', element: <SpellDetailRoute /> },
                  { path: 'skill-proficiencies', element: <SkillProficiencyListRoute /> },
                  { path: 'skill-proficiencies/:skillProficiencyId', element: <SkillProficiencyDetailRoute /> },
                  {
                    element: <ContentManageGuard />,
                    children: [
                      { path: 'equipment/weapons/new', element: <WeaponCreateRoute /> },
                      { path: 'equipment/weapons/:weaponId/edit', element: <WeaponEditRoute /> },
                      { path: 'equipment/armor/new', element: <ArmorCreateRoute /> },
                      { path: 'equipment/armor/:armorId/edit', element: <ArmorEditRoute /> },
                      { path: 'equipment/gear/new', element: <GearCreateRoute /> },
                      { path: 'equipment/gear/:gearId/edit', element: <GearEditRoute /> },
                      { path: 'equipment/magic-items/new', element: <MagicItemCreateRoute /> },
                      { path: 'equipment/magic-items/:magicItemId/edit', element: <MagicItemEditRoute /> },
                      { path: 'classes/new', element: <ClassCreateRoute /> },
                      { path: 'classes/:classId/edit', element: <ClassEditRoute /> },
                      { path: 'races/new', element: <RaceCreateRoute /> },
                      { path: 'races/:raceId/edit', element: <RaceEditRoute /> },
                      { path: 'locations/new', element: <LocationCreateRoute /> },
                      { path: 'locations/:locationId/edit', element: <LocationEditRoute /> },
                      { path: 'monsters/new', element: <MonsterCreateRoute /> },
                      { path: 'monsters/:monsterId/edit', element: <MonsterEditRoute /> },
                      { path: 'spells/new', element: <SpellCreateRoute /> },
                      { path: 'spells/:spellId/edit', element: <SpellEditRoute /> },
                      { path: 'skill-proficiencies/new', element: <SkillProficiencyCreateRoute /> },
                      { path: 'skill-proficiencies/:skillProficiencyId/edit', element: <SkillProficiencyEditRoute /> },
                    ],
                  },
                ],
              },
              { path: 'sessions', element: <SessionsRoute /> },
              { path: 'sessions/:sessionId', element: <SessionRoute /> },
              { path: 'game-sessions', element: <GameSessionListRoute /> },
              {
                path: 'game-sessions/:gameSessionId',
                element: <GameSessionLayout />,
                children: [
                  { index: true, element: <GameSessionIndexRedirect /> },
                  { path: 'lobby', element: <GameSessionLobbyRoute /> },
                  {
                    path: 'setup',
                    element: <AdminGuard />,
                    children: [{ index: true, element: <GameSessionSetupRoute /> }],
                  },
                  { path: 'play', element: <GameSessionPlayRoute /> },
                ],
              },
              { path: 'messages', element: <MessagingRoute /> },
              { path: 'messages/:conversationId', element: <MessagingRoute /> },
              { path: 'party', element: <PartyRoute /> },
              { path: 'rules', element: <RulesRoute /> },
              {
                element: <AdminGuard />,
                children: [
                  {
                    /*
                     * Encounter Simulator: DM/admin setup + active combat sandbox.
                     * Setup is not a player participation surface — future player flow belongs on a
                     * separate lobby/session route, not readonly setup.
                     */
                    path: 'encounter',
                    element: <EncounterLayout />,
                    children: [
                      { index: true, element: <EncounterIndexRedirect /> },
                      { path: 'setup', element: <EncounterSetupRoute /> },
                      { path: 'active', element: <EncounterActiveRoute /> },
                    ],
                  },
                ],
              },
              {
                path: 'admin',
                element: <AdminGuard />,
                children: [
                  { path: 'invites', element: <CampaignAdminInvitesRoute /> },
                  { path: 'settings', element: <CampaignAdminSettingsRoute /> },
                  { path: 'ruleset', element: <CampaignRulesetEditorRoute /> },
                ],
              },
            ],
          },
          { path: ROUTES.INVITE, element: <InviteRoute /> },
          // { path: ROUTES.ACCOUNT_SETTINGS, element: <AccountSettingsRoute /> },
          // {
          //   path: ROUTES.ADMIN,
          //   element: <AdminGuard />,
          //   children: [
          //     {
          //       element: <CampaignAdminRoute />,
          //       children: [
          //         { index: true, element: <Navigate to={ROUTES.ADMIN_INVITES} replace /> },
          //         { path: 'invites', element: <CampaignAdminInvitesRoute /> },
          //         { path: 'settings', element: <CampaignAdminSettingsRoute /> },
          //         { path: 'ruleset', element: <CampaignRulesetEditorRoute /> },
          //       ],
          //     },
          //   ],
          // },
        ],
      },
    ],
  },
])

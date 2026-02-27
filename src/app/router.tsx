import { createBrowserRouter, Outlet, Navigate } from 'react-router-dom'
import { ROUTES } from './routes'
import { AppProviders } from './providers'

// MUI Layouts
import PublicLayout from './layouts/PublicLayout'
import AuthLayout from './layouts/AuthLayout'

// Route components
import {
  CharacterBuilderRoute,
  LoginRoute,
  RegisterRoute,
  AcceptInviteRoute,
  DashboardRoute,
  UsersRoute,
  CharactersRoute,
  CharacterRoute,
  CampaignsRoute,
  CampaignRoute,
  InviteRoute,
  RulesRoute,
  PartyRoute,
  SessionsRoute,
  SessionRoute,
  MessagingRoute,
  WorldLayout,
  LocationsRoute,
  LocationRoute,
  NpcsRoute,
  NpcRoute,
  MonstersRoute,
  MonsterRoute,
  EquipmentRoute,
  EquipmentDetailsRoute,
  AdminGuard,
  CampaignAdminRoute,
  CampaignAdminInvitesRoute,
  CampaignAdminSettingsRoute,
  CampaignRulesetEditorRoute,
  RaceListRoute,
  RaceDetailRoute,
  RaceEditorRoute,
  AccountSettingsRoute,
  NewCharacterRoute,
} from './routes/index'

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
          { path: ROUTES.HOME, element: <CharacterBuilderRoute /> },
          { path: ROUTES.CHARACTER_BUILDER, element: <CharacterBuilderRoute /> },
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
          { path: ROUTES.CHARACTERS, element: <CharactersRoute /> },
          { path: ROUTES.NEW_CHARACTER, element: <NewCharacterRoute /> },
          { path: ROUTES.CHARACTER, element: <CharacterRoute /> },
          { path: ROUTES.CAMPAIGNS, element: <CampaignsRoute /> },
          {
            path: ROUTES.CAMPAIGN,
            element: <CampaignRoute />,
            children: [
              {
                path: 'world',
                element: <WorldLayout />,
                children: [
                  { index: true, element: <Navigate to="locations" replace /> },
                  { path: 'equipment', element: <EquipmentRoute /> },
                  { path: 'equipment/:equipmentId', element: <EquipmentDetailsRoute /> },
                  { path: 'locations', element: <LocationsRoute /> },
                  { path: 'locations/:locationId', element: <LocationRoute /> },
                  { path: 'npcs', element: <NpcsRoute /> },
                  { path: 'npcs/:npcId', element: <NpcRoute /> },
                  { path: 'monsters', element: <MonstersRoute /> },
                  { path: 'monsters/:monsterId', element: <MonsterRoute /> },
                  { path: 'races/new', element: <RaceEditorRoute /> },
                  { path: 'races/:raceId/edit', element: <RaceEditorRoute /> },
                  { path: 'races/:raceId', element: <RaceDetailRoute /> },
                  { path: 'races', element: <RaceListRoute /> },
                ],
              },
              { path: 'sessions', element: <SessionsRoute /> },
              { path: 'sessions/:sessionId', element: <SessionRoute /> },
              { path: 'messages', element: <MessagingRoute /> },
              { path: 'messages/:conversationId', element: <MessagingRoute /> },
              { path: 'party', element: <PartyRoute /> },
              { path: 'rules', element: <RulesRoute /> },
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
          // { path: ROUTES.INVITE, element: <InviteRoute /> },
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

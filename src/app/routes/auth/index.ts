export { CharactersRoute, CharacterRoute, NewCharacterRoute, NpcsRoute, NpcRoute } from '@/features/character/routes'
export {
  CampaignsRoute,
  DashboardRoute,
  CampaignRoute,
  PartyRoute,
  RulesRoute,
  WorldLayout,
  SessionsRoute,
  SessionRoute,
  MessagingRoute,
  AdminGuard,
  CampaignAdminRoute,
  CampaignAdminSettingsRoute,
  CampaignAdminInvitesRoute,
  CampaignRulesetEditorRoute,
  ContentManageGuard,
} from '@/features/campaign/routes'
export { default as EncounterLayout } from '@/features/encounter/routes/EncounterLayout'
export { default as EncounterIndexRedirect } from '@/features/encounter/routes/EncounterIndexRedirect'
export { default as EncounterSetupRoute } from '@/features/encounter/routes/EncounterSetupRoute'
export { default as EncounterActiveRoute } from '@/features/encounter/routes/EncounterActiveRoute'
export {
  LocationListRoute,
  LocationDetailRoute,
  LocationCreateRoute,
  LocationEditRoute,
} from '@/features/content/locations/routes'
export {
  MonsterListRoute,
  MonsterDetailRoute,
  MonsterEditRoute,
  MonsterCreateRoute,
} from '@/features/content/monsters/routes'
export {
  ClassListRoute,
  ClassDetailRoute,
  ClassCreateRoute,
  ClassEditRoute,
} from '@/features/content/classes/routes'
export {
  RaceListRoute,
  RaceDetailRoute,
  RaceCreateRoute,
  RaceEditRoute,
} from '@/features/content/races/routes'
export {
  SpellListRoute,
  SpellDetailRoute,
  SpellCreateRoute,
  SpellEditRoute,
} from '@/features/content/spells/routes'
export {
  SkillProficiencyListRoute,
  SkillProficiencyDetailRoute,
  SkillProficiencyCreateRoute,
  SkillProficiencyEditRoute,
} from '@/features/content/skillProficiencies/routes'
export {
  EquipmentHubRoute,
  WeaponsListRoute,
  ArmorListRoute,
  GearListRoute,
  MagicItemsListRoute,
  WeaponDetailRoute,
  ArmorDetailRoute,
  GearDetailRoute,
  MagicItemDetailRoute,
  WeaponEditRoute,
  ArmorEditRoute,
  GearEditRoute,
  MagicItemEditRoute,
  WeaponCreateRoute,
  ArmorCreateRoute,
  GearCreateRoute,
  MagicItemCreateRoute,
} from '@/features/content/equipment/routes'
export { InviteRoute } from '@/features/campaign/routes'
export { UsersRoute } from '@/features/user/routes'
export { AccountRoute, AccountSettingsRoute } from '@/features/account/routes'

import {
  ATMOSPHERE_TAGS,
  ENVIRONMENT_SETTINGS,
  LIGHTING_LEVELS,
  TERRAIN_MOVEMENT_TYPES,
  VISIBILITY_OBSCURED_LEVELS,
} from './environment.constants'

export type EncounterEnvironmentSetting = (typeof ENVIRONMENT_SETTINGS)[number]['id']
export type EncounterLightingLevel = (typeof LIGHTING_LEVELS)[number]['id']
export type EncounterTerrainMovement = (typeof TERRAIN_MOVEMENT_TYPES)[number]['id']
export type EncounterVisibilityObscured = (typeof VISIBILITY_OBSCURED_LEVELS)[number]['id']
export type EncounterAtmosphereTag = (typeof ATMOSPHERE_TAGS)[number]['id']

export type EncounterAtmosphere = {
  tags?: EncounterAtmosphereTag[]
  notes?: string
}

export type EncounterHazard = {
  id: string
  name: string
  type: 'damage' | 'movement' | 'visibility' | 'condition' | 'other'
  description?: string
  area?: string
  trigger?: 'start_of_turn' | 'enter' | 'end_of_turn' | 'manual'
}

export type EncounterVisibility = {
  obscured: EncounterVisibilityObscured
  causes?: Array<'fog' | 'smoke' | 'rain' | 'foliage' | 'magical'>
  notes?: string
}

export type EncounterTerrain = {
  movement: EncounterTerrainMovement[]
  cover?: Array<'none' | 'half' | 'three-quarters' | 'full'>
  notes?: string
}

export type EncounterLighting = {
  level: EncounterLightingLevel
  tags?: Array<'sunlight' | 'moonlight' | 'firelight' | 'magical-light'>
  notes?: string
}

export type EncounterEnvironment = {
  setting: EncounterEnvironmentSetting
  lighting?: EncounterLighting
  terrain?: EncounterTerrain
  visibility?: EncounterVisibility
  atmosphere?: EncounterAtmosphere
  hazards?: EncounterHazard
  tags?: string[]
  notes?: string
}

// TODO: define values in environment.constants.ts file { id, name, description } and export dynamic type.
// Then import the dynamic type here and use it in the EncounterEnvironment type.

export type EncounterAtmosphere = {
  tags?: Array<
    | 'high-wind'
    | 'underwater'
    | 'sacred-ground'
    | 'anti-magic'
    | 'extreme-cold'
    | 'extreme-heat'
  >;
  notes?: string;
};

export type EncounterHazard = {
  id: string;
  name: string;
  type: 'damage' | 'movement' | 'visibility' | 'condition' | 'other';
  description?: string;
  area?: string;
  trigger?: 'start_of_turn' | 'enter' | 'end_of_turn' | 'manual';
};

export type EncounterVisibility = {
  obscured: 'none' | 'light' | 'heavy';
  causes?: Array<'fog' | 'smoke' | 'rain' | 'foliage' | 'magical'>;
  notes?: string;
};

export type EncounterTerrain = {
  movement: Array<
    | 'normal'
    | 'difficult'
    | 'greater-difficult'
    | 'slippery'
    | 'climb-required'
    | 'swim-required'
  >;
  cover?: Array<'none' | 'half' | 'three-quarters' | 'full'>;
  notes?: string;
};

export type EncounterLighting = {
  level: 'bright' | 'dim' | 'darkness';
  tags?: Array<'sunlight' | 'moonlight' | 'firelight' | 'magical-light'>;
  notes?: string;
}

export type EncounterEnvironmentSetting =
  | 'indoors'
  | 'outdoors'
  | 'mixed'
  | 'other';

export type EncounterEnvironment = {
  setting: EncounterEnvironmentSetting;
  lighting?: EncounterLighting;
  terrain?: EncounterTerrain;
  visibility?: EncounterVisibility;
  hazards?: EncounterHazard;
  tags?: string[];
  notes?: string;
};
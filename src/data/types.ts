export type AlignmentId = 
  | 'lg' | 'ng' | 'cg' 
  | 'ln' | 'n'  | 'cn' 
  | 'le' | 'ne' | 'ce'
  | 'good' | 'unaligned' | 'evil'
  | 'law' | 'neutral' | 'chaos';

export interface Alignment {
  id: AlignmentId;
  name: string;
}

export type AlignmentList = Alignment[]

export type AbilityScoreMethod = '4d6-drop-lowest' | '3d6' | 'average' | 'custom'

export interface OverrideConfig {
  only?: string[]
  add?: string[]
  remove?: string[]
}

export interface ClassOverrideConfig extends OverrideConfig {
  subclassOverrides?: Record<string, OverrideConfig>
}

export interface World {
  id: string
  name: string
  settingId: string
  description?: string
}

export interface Visibility { 
  scope: 'public' | 'dm' | 'restricted'; 
  allowCharacterIds?: string[]; 
  allowFactionIds?: string[]
};

export interface MapMarker {
  locationId: string
  x: number
  y: number
}

export interface GameMap {
  id: string
  settingId: string
  name: string
  imageUrl: string
  markers: MapMarker[]
  visibility: {
    allCharacters: boolean
    characterIds: string[]
  }
}

export interface Setting {
  id: string
  name: string
  worlds?: string[]
  worldId?: string[]
  worldIds?: string[]
  editions?: string[]
  publicationYear?: string
  aliasNames?: string[]
  classes?: { id: string; name: string }[]
  races?: { id: string; name: string }[]
  raceOverrides?: OverrideConfig
  classOverrides?: ClassOverrideConfig
  locations?: Location[]
}

export type {
  Race,
  RaceId,
  RaceSummary,
  RaceInput,
} from '@/features/content/domain/types';

export type SettingId = 
  | 'alQadim'
  | 'birthright'
  | 'blackmoor'
  | 'darkSun'
  | 'dragonlance'
  | 'forgottenRealms'
  | 'greyhawk'
  | 'lankhmar'
  | 'mystara'
  | 'planescape'
  | 'ravenloft'
  | 'spellJammer';

export interface Setting {
  id: string;
  name: string;
  worldIds?: string[]; // Unified property name
  editions?: string[];
  publicationYear?: string;
  aliasNames?: string[];
  classes?: Array<{ id: string; name: string }>;
  races?: Array<{ id: string; name: string }>;
  raceOverrides?: {
    add?: string[];
    remove?: string[];
    only?: string[];
  };
  classOverrides?: ClassOverrideConfig
  locations?: Location[]; // Assuming Location type is defined elsewhere
}

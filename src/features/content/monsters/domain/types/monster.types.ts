import type { DiceOrFlat, DieFace } from "@/features/mechanics/domain/dice"
import type {
  ContentId,
  ContentSummary,
  ContentItem,
  ContentInput,
} from '@/features/content/shared/domain/types/content.types';
import type { AbilityScoreMapResolved } from "@/features/mechanics/domain/core/character/abilities.types";
import type { AbilityId } from "@/features/mechanics/domain/core/character/abilities.types";
import type { AlignmentId } from "@/features/content/shared/domain/types";
import type { WeaponDamageType } from "@/features/content/equipment/weapons/domain/vocab";
import type { CharacterProficiencies, Equipment } from "@/features/character/domain/types";

// TODO: create dynamic type
export type MonsterId = ContentId;

export type IntelligenceCategory =
  | 'non' // 0-1 (no intelligence)
  | 'semi' // 2-4
  | 'animal' // 2-4 (animal intelligence)
  | 'low' // 5-7
  | 'average' // 8-10 
  | 'very' // 11-12
  | 'high' // 13-14
  | 'exceptional' // 15+
  | 'low-to-average'
  | 'low-to-very'
  | 'semi-to-average'

export type AttackAbility = AbilityId

export type MonsterAttackType =
  // add WeaponId
  | 'claw'
  | 'bite'
  | 'beak'
  | 'tail'
  | 'wing'
  | 'horn'
  | 'hoof'
  | 'fang'
  | 'talon'
  | 'pseudopod'
  | 'slam'
  | 'constrict'
  | 'touch'

export type MonsterAppliedEffect =
  | { kind: 'condition'; condition: 'prone' }
  | { kind: 'text'; description: string };

export type MonsterOnHitEffect = 
  | {
    kind: 'save';
    save: {
      ability: AbilityId;
      dc: number;
    }
    onFail: MonsterAppliedEffect[];
    onSuccess?: MonsterAppliedEffect[];
  }
  | {
    kind: 'damage';
    damage: DiceOrFlat;
    damageType?: DamageType;
  }
  | {
    kind: 'condition';
    condition: ConditionId;
    targetSizeMax?: MonsterSizeCategory;
    escapeDc?: number;
    escapeCheckDisadvantage?: boolean;
  }


export type MonsterWeaponAction = {
  kind: 'weapon';
  weaponId: string;
  // only use if bonus is not calculated by the mechanics engine
  // ie: bonus does not match calculated dex/str bonus
  toHitBonus?: number;
  damageOverride?: DiceOrFlat;
  damageBonus?: number;
  reach?: number;
  aliasName?: string; // only used for display purposes
  notes?: string;
};

export type DamageType = 
  | WeaponDamageType
  | 'fire'
  | 'acid';

export type MonsterNaturalAttackAction = {
  kind: 'natural';
  name?: string;
  attackType: MonsterAttackType;
  damageBonus?: number;
  toHitBonus?: number;
  damage: DiceOrFlat;
  damageType?: DamageType;
  reach?: number;
  notes?: string;
  attackAbilityOverride?: AttackAbility;
  damageAbilityOverride?: AttackAbility | null;
  onHitEffects?: MonsterOnHitEffect[];
};

export type ConditionId =
  | 'blinded'
  | 'charmed'
  | 'deafened'
  | 'frightened'
  | 'grappled'
  | 'incapacitated'
  | 'invisible'
  | 'paralyzed'
  | 'petrified'
  | 'poisoned'
  | 'prone'
  | 'restrained'
  | 'stunned'
  | 'unconscious';

export type MonsterActionEffect =
  | { kind: 'damage'; damage: DiceOrFlat; damageType?: DamageType }
  | { kind: 'condition'; condition: ConditionId, targetSizeMax?: MonsterSizeCategory, escapeDc?: number }
  | { kind: 'move'; distance: number; forced?: boolean }
  | { kind: 'text'; description: string };

export type MonsterSpecialAction = {
  kind: 'special';
  name: string;
  description: string;
  toHitBonus?: number;
  reach?: number;
  damage?: DiceOrFlat;
  damageBonus?: number;
  damageType?: DamageType;
  save?: {
    ability: AbilityId;
    dc: number;
  };
  area?: { 
    kind: "cone" | "sphere" | "line" | "square" | "cylinder" | "cube";
    size: number
  }
  target?: "creatures-in-area"
  recharge?: {
    min: number;
    max: number;
  };
  halfDamageOnSave?: boolean;
  onFail?: MonsterActionEffect[];
  onSuccess?: MonsterActionEffect[];
  sequence?: { 
    actionName: string, 
    count: number 
  }[]
  notes?: string;
};

export type MonsterAction =
  | MonsterWeaponAction
  | MonsterNaturalAttackAction
  | MonsterSpecialAction;

export type MonsterMovement = {
  ground?: number
  climb?: number
  fly?: number
  swim?: number
  burrow?: number
}

export type MonsterSizeCategory = 
  | 'tiny'
  | 'small'
  | 'medium'
  | 'large'
  | 'huge'
  | 'gargantuan'

type MonsterLanguage = {
  id: string;
  speaks?: boolean;
};

export type SenseType =
  | 'darkvision'
  | 'blindsight'
  | 'tremorsense'
  | 'truesense'
  | 'normal'
  | 'infravision'
  | 'low-light'

export type MonsterSense = {
  type: SenseType;
  range?: number;
  notes?: string;
};

export type MonsterSenses = {
  special?: MonsterSense[];
  passivePerception?: number;
};

export type MonsterType =
  | 'aberration'
  | 'animal'
  | 'beast'
  | 'celestial'
  | 'construct'
  | 'dragon'
  | 'elemental'
  | 'fey'
  | 'fiend'
  | 'giant'
  | 'humanoid'
  | 'monstrosity'
  | 'ooze'
  | 'plant'
  | 'undead'
  | 'vermin'

export type MonsterSubtype =
  | 'aquatic'
  | 'gnome'

export type MonsterChallengeRating =
  | 0
  | 0.125
  | 0.25
  | 0.5
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20


export type MonsterTrait =
  | 'aggressive'
  | 'brave'
  | 'immune-to-poison'
  | 'immune-to-exhaustion'

export type MonsterProficiencies = CharacterProficiencies & {
  // TODO: reference weapon IDs
  weapons?: string[]
  skillBonuses?: {
    [key: string]: number;
  },
}

export type MonsterArmorClass =
  | {
      kind: 'equipment';
      // TODO: reference actual armor IDs
      // armorId?: string[];
      override?: number;
    }
  | {
      kind: 'natural';
      base: number;
      dexApplies?: boolean;
      maxDexBonus?: number | null;
      notes?: string;
      override?: number;
    }
  | {
      kind: 'fixed';
      value: number;
      notes?: string;
    };

export interface MonsterFields {
  id: string
  name: string
  type?: MonsterType
  subtype?: MonsterSubtype
  sizeCategory?: MonsterSizeCategory
  languages?: MonsterLanguage[]
  description?: {
    short?: string
    long?: string
  }

  mechanics: {
    hitPoints: {
      count: number;
      die: DieFace;
      modifier?: number;
    }
    hitDieSize: DieFace
    armorClass: MonsterArmorClass,
    // attackBonus?: number
    movement: MonsterMovement
    abilities?: AbilityScoreMapResolved
    traits?: string[]
    actions?: MonsterAction[]
    senses?: MonsterSenses
    proficiencies?: MonsterProficiencies
    proficiencyBonus?: number
    equipment?: Equipment
  }

  lore: {
    alignment?: AlignmentId
    xpValue?: number
    challengeRating?: MonsterChallengeRating
    // legacy editions
    intelligence?: IntelligenceCategory
  }
}

export type Monster = ContentItem & MonsterFields;

export type MonsterSummary = ContentSummary & MonsterFields & {
  /** Whether this Monster is enabled for the campaign (from content rule). */
  allowedInCampaign?: boolean;
};

export type MonsterInput = ContentInput & Partial<MonsterFields>;


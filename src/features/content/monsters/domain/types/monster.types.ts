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
import type { 
  CharacterProficiencies, 
  ProficiencySkillAdjustment,
  ProficiencyWeaponAdjustment
} from "@/features/character/domain/types";

// TODO: create dynamic type
export type MonsterId = ContentId;

// Legacy edition, ignore for now
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
  | MonsterConditionEffect
  | {
    kind: 'state';
    state: string;
    escape?: {
      dc: number;
      ability?: AbilityId;
      skill?: string;
      actionRequired?: boolean;
    };
    ongoingEffects?: MonsterEffect[];
    notes?: string;
  }
  | { kind: 'text'; description: string }


export type MonsterOnHitEffect = 
  | MonsterConditionEffect
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


export type MonsterWeaponAction = {
  kind: 'weapon';
  weaponRef: string;
};

export type MonsterEquippedWeapon = {
  weaponId: string;
  aliasName?: string;
  // attackBonus & damageBonus:
  // highly prefer to rely on stat modifiers instead
  // Use only if math does not work out or ambiguous
  attackBonus?: number;
  damageBonus?: number;
  // use if referenced weaponId damage does not match expected damage
  damageOverride?: DiceOrFlat;
  // use if range differs from referenced weaponId
  reach?: number;
  notes?: string;
};

export type MonsterEquippedArmor = {
  armorId: string;
  aliasName?: string; // only used for display purposes
  notes?: string;
  acModifier?: number;
};

export type MonsterEquipment = {
  weapons?: Record<string, MonsterEquippedWeapon>;
  armor?: Record<string, MonsterEquippedArmor>;
};

export type DamageType = 
  | WeaponDamageType
  | 'fire'
  | 'acid'
  | 'radiant'
  | 'necrotic';

export type MonsterNaturalAttackAction = {
  kind: 'natural';
  name?: string;
  attackType: MonsterAttackType;
  damageBonus?: number;
  attackBonus?: number;
  damage: DiceOrFlat;
  damageType?: DamageType;
  reach?: number;
  notes?: string;
  attackAbilityOverride?: AttackAbility;
  damageAbilityOverride?: AttackAbility | null;
  onHitEffects?: MonsterOnHitEffect[];
  rules?: MonsterActionRule[];
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

export type MonsterConditionEffect = {
  kind: 'condition';
  condition: ConditionId;
  targetSizeMax?: MonsterSizeCategory;
  escapeDc?: number;
  escapeCheckDisadvantage?: boolean;
};

export type MonsterRollModifierEffect = {
  kind: 'roll-modifier';
  appliesTo: TraitRollTarget | TraitRollTarget[];
  modifier: 'advantage' | 'disadvantage';
};

export type MonsterEffect =
  | MonsterConditionEffect
  | MonsterRollModifierEffect
  | { kind: 'damage'; damage: DiceOrFlat; damageType?: DamageType }
  | {
      kind: 'state';
      state: string;
      targetSizeMax?: MonsterSizeCategory;
      escape?: {
        dc: number;
        ability?: AbilityId;
        skill?: string;
        actionRequired?: boolean;
      };
      ongoingEffects?: MonsterEffect[];
      notes?: string;
    }
  | {
    kind: 'move';
    distance?: number;
    forced?: boolean;
    toNearestUnoccupiedSpace?: boolean;
    withinFeetOfSource?: number;
    failIfNoSpace?: boolean;
    movesWithSource?: boolean;
    ignoresExtraCostForGrappledCreature?: boolean;
  }
  | {
      kind: 'form';
      form: 'true-form' | 'object';
      allowedSizes?: MonsterSizeCategory[];
      canReturnToTrueForm?: boolean;
      retainsStatistics?: boolean;
      equipmentTransforms?: boolean;
      notes?: string;
    }
  | { kind: 'text'; description: string }
  | { kind: 'action'; action: 'disengage' | 'hide' }
  | { kind: 'limb'; mode: 'sever' | 'grow'; count: number }
  | { kind: 'spawn'; creature: string; count: number; location: 'self-space' | 'self-cell'; actsWhen: 'immediately-after-source-turn' }
  | { kind: 'resource'; resource: 'exhaustion'; mode: 'set' | 'add'; value: 'per-missing-limb' }
  | { kind: 'hit-points'; mode: 'heal' | 'damage'; value: number }

export type MonsterRuleDuration =
  | {
      kind: 'fixed';
      value: number;
      unit: 'round' | 'minute' | 'hour' | 'day';
    }
  | {
      kind: 'until-end-of-source-next-turn';
    };

export type MonsterActionRule =
  | {
      kind: 'targeting';
      target: 'one-creature';
      targetType?: 'creature';
      rangeFeet: number;
      requiresSight?: boolean;
    }
  | {
      kind: 'apply-state';
      trigger: 'on-hit' | 'on-failed-save';
      state: string;
      targetType?: 'creature';
      duration?: MonsterRuleDuration;
      ongoingEffects?: MonsterEffect[];
      notes?: string;
    }
  | {
      kind: 'duration';
      trigger: 'on-hit' | 'on-failed-save';
      appliesTo:
        | {
            kind: 'condition';
            condition: ConditionId;
          }
        | {
            kind: 'state';
            state: string;
          };
      duration: MonsterRuleDuration;
    }
  | {
      kind: 'interval-effect';
      state: string;
      every: {
        value: number;
        unit: 'hour' | 'day';
      };
      effects: MonsterEffect[];
    }
  | {
      kind: 'immunity-on-success';
      trigger: 'on-successful-save';
      scope: 'source-action';
      duration: MonsterRuleDuration;
      notes?: string;
    }
  | {
      kind: 'death-outcome';
      trigger: 'reduced-to-0-hit-points-by-this-action';
      targetType?: 'creature';
      outcome: 'turns-to-dust';
    };

export type MonsterActionTrigger =
| {
    when: 'after-dealing-damage';
    targetState?: 'bloodied';
  };

export type MonsterTriggeredSave = {
  ability: AbilityId;
  dc:
    | number
    | {
        kind: '5-plus-damage-taken';
      };
  except?: {
    damageTypes?: DamageType[];
    criticalHit?: boolean;
  };
  onSuccess?: MonsterEffect[];
  onFail?: MonsterEffect[];
};

export type TraitRollTarget =
  | 'attack-rolls'
  | 'ability-checks'
  | 'saving-throws';

/*------------------------------------------------------------*/
/* Traits                                                      */
/*------------------------------------------------------------*/

export type MonsterTraitActionModifier = {
  actionName: string;
  trigger: {
    kind: 'enters-space';
  };
  saveModifier?: 'advantage' | 'disadvantage';
};

export type MonsterTraitCheckRule = {
  name?: string;
  actor: 'nearby-creature';
  distanceFeet?: number;
  actionRequired?: boolean;
  check: {
    ability: AbilityId;
    skill?: string;
    dc: number;
  };
  onSuccess?: MonsterEffect[];
  onFail?: MonsterEffect[];
  target?: 'creature-inside' | 'object-inside';
};

type MonsterContainmentRule = {
  fillsEntireSpace?: boolean;
  canContainCreatures?: boolean;
  creatureCover?: 'total-cover';
  capacity?: {
    large?: number;
    mediumOrSmall?: number;
  };
};

type MonsterVisibilityRule = {
  transparent?: boolean;
  noticeCheck?: {
    ability: AbilityId;
    skill?: string;
    dc: number;
    unlessWitnessedMoveOrAction?: boolean;
  };
};

export type MonsterTraitRule =
  | {
      kind: 'hold-breath';
      duration: {
        value: number;
        unit: 'round' | 'minute' | 'hour' | 'day';
      };
    }
  | {
      kind: 'tracked-part';
      part: 'head' | 'limb';
      initialCount: number;
      loss?: {
        trigger: 'damage-taken-in-single-turn';
        minDamage: number;
        count: number;
      };
      deathWhenCountReaches?: number;
      regrowth?: {
        trigger: 'end-of-turn';
        requiresLivingPart?: boolean;
        countPerPartLostSinceLastTurn: number;
        suppressedByDamageTypes?: DamageType[];
        healHitPoints?: number;
      };
    }
  | {
      kind: 'extra-reaction';
      appliesTo: 'opportunity-attacks-only';
      count: {
        kind: 'per-part-beyond';
        part: 'head' | 'limb';
        baseline: number;
      };
    };

export type MonsterTrait = {
  name: string;
  description: string;
  trigger?: MonsterTraitTrigger | MonsterTraitTrigger[];
  requirements?: MonsterTraitRequirement[];
  save?: MonsterTriggeredSave;
  effects?: MonsterEffect[];
  rules?: MonsterTraitRule[];
  modifiesAction?: MonsterTraitActionModifier[];
  checks?: MonsterTraitCheckRule[];
  containment?: MonsterContainmentRule;
  visibility?: MonsterVisibilityRule;
  uses?: {
    count: number;
    period: 'day';
  }
  suppression?: {
    ifTookDamageTypes?: DamageType[];
    duration: 'next-turn';
  }
  notes?: string;
};  

export type MonsterTraitRequirement =
  | { kind: 'self-state'; state: 'bloodied' }
  | { kind: 'damage-taken-this-turn'; damageType?: DamageType; min?: number }
  | { kind: 'hit-points-equals'; value: number };

export type MonsterTraitTrigger =
  | { kind: 'start-of-turn' }
  | { kind: 'end-of-turn' }
  | {
      kind: 'ally-near-target';
      withinFeet: number;
      allyConditionNot?: ConditionId;
    }
  | {
      kind: 'in-environment';
      environment: 'sunlight';
    }
  | {
      kind: 'in-form';
      form: 'object' | 'true-form';
    }
  | {
      kind: 'while-moving-grappled-creature';
    }
  | {
      kind: 'reduced-to-0-hp';
    } 
  | {
      kind: 'contact';
    }

export type MonsterSpecialAction = {
  kind: 'special';
  name: string;
  description: string;
  attackBonus?: number;
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
  target?: "creatures-in-area" | 'creatures-entered-during-move'
  movement?: {
    upToSpeed?: boolean;
    upToSpeedFraction?: 0.5 | 1;
    noOpportunityAttacks?: boolean;
    canEnterCreatureSpaces?: boolean;
    targetSizeMax?: MonsterSizeCategory;
    straightTowardVisibleEnemy?: boolean;
  };
  recharge?: {
    min: number;
    max: number;
  };
  uses?: {
    count: number;
    period: 'day';
  };
  trigger?: MonsterActionTrigger;
  halfDamageOnSave?: boolean;
  onFail?: MonsterEffect[];
  onSuccess?: MonsterEffect[];
  effects?: MonsterEffect[];
  rules?: MonsterActionRule[];
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
  | 0 | 0.125 | 0.25 | 0.5 | 1
  | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 
  | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 
  | 19 | 20 | 21 | 22 | 23 | 24

export type MonsterProficiencies = CharacterProficiencies & {
  // TODO: reference weapon IDs
  weapons?: Record<string, ProficiencyWeaponAdjustment>
}

// Armor class base should be calculated taking into account dex bonus
// If monster has no armor and expected AC does not match,
// Use 'natural' with base AC and dexApplies set to true
export type MonsterArmorClassBase = {
  dexApplies?: boolean; // highly prefer to set this true
  maxDexBonus?: number | null;
  notes?: string;
  override?: number; // last resort
}

export type MonsterArmorClass =
  | {
      kind: 'equipment';
      armorRefs?: string[]; // TODO: reference actual armor IDs
    } & MonsterArmorClassBase
  | {
      kind: 'natural';
      base?: number;
    } & MonsterArmorClassBase
  | {
      kind: 'fixed';
      value: number;
    } & Pick<MonsterArmorClassBase, 'notes'>

export type ImmunityType =
  | 'fire'
  | 'acid'
  | 'poison'
  | 'necrotic'
  | 'radiant'
  | 'psychic'
  | 'force'
  | 'charmed'
  | 'exhaustion'
  | 'blinded'
  | 'deafened'
  | 'frightened'
  | 'paralyzed'
  | 'poisoned'
  | 'prone'
  | 'restrained'
  | 'stunned'
  | 'unconscious'

export type VulnerabilityType =
  | 'bludgeoning'
  | 'fire'

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
    armorClass: MonsterArmorClass,
    movement: MonsterMovement
    abilities?: AbilityScoreMapResolved
    // set only if ability mod and save values differ
    // example: dex 10 / mod: +0, save: +4
    savingThrows?: Partial<Record<AbilityId, ProficiencySkillAdjustment>>;
    traits?: MonsterTrait[]
    actions?: MonsterAction[]
    bonusActions?: MonsterAction[]
    senses?: MonsterSenses
    // Leverage proficencyLevel to arrive at expected skill modifier.
    // example: Perception +5 can be achieved with proficiencyLevel: 2, wis + 1 mod & proficiencyBonus: 2 
    // (proficiencyLevel * proficiencyBonus) + mod = expected skill modifier
    proficiencies?: MonsterProficiencies
    proficiencyBonus: number
    equipment?: MonsterEquipment
    immunities?: ImmunityType[]
    vulnerabilities?: VulnerabilityType[]
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


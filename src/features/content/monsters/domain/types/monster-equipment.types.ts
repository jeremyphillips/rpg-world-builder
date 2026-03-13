import type { DiceOrFlat } from "@/features/mechanics/domain/dice";

export type MonsterWeaponAction = {
  kind: 'weapon';
  weaponRef: string;
};

export type MonsterEquippedWeapon = {
  weaponId: string;
  aliasName?: string;
  attackBonus?: number;
  damageBonus?: number;
  damageOverride?: DiceOrFlat;
  reach?: number;
  notes?: string;
};

export type MonsterEquippedArmor = {
  armorId: string;
  aliasName?: string;
  notes?: string;
  acModifier?: number;
};

export type MonsterEquipment = {
  weapons?: Record<string, MonsterEquippedWeapon>;
  armor?: Record<string, MonsterEquippedArmor>;
};

export type MonsterArmorClassBase = {
  dexApplies?: boolean;
  maxDexBonus?: number | null;
  notes?: string;
  override?: number;
};

export type MonsterArmorClass =
  | {
      kind: 'equipment';
      armorRefs?: string[];
    } & MonsterArmorClassBase
  | {
      kind: 'natural';
      base?: number;
    } & MonsterArmorClassBase
  | {
      kind: 'fixed';
      value: number;
    } & Pick<MonsterArmorClassBase, 'notes'>;

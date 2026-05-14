import type { DiceOrFlat } from '@/shared/domain/dice';

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
      /** Points above unarmored AC baseline (`MONSTER_UNARMORED_AC_BASELINE`); omit when 0. */
      offset?: number;
    } & MonsterArmorClassBase
  | {
      kind: 'fixed';
      value: number;
    } & Pick<MonsterArmorClassBase, 'notes'>;

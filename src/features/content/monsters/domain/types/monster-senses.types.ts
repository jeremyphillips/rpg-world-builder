export type SenseType =
  | 'darkvision'
  | 'blindsight'
  | 'tremorsense'
  | 'truesense'
  | 'normal'
  | 'infravision'
  | 'low-light';

export type MonsterSense = {
  type: SenseType;
  range?: number;
  notes?: string;
};

export type MonsterSenses = {
  special?: MonsterSense[];
  passivePerception?: number;
};

export type VisibilityScope = 'public' | 'dm' | 'restricted';

export interface Visibility { 
  scope: VisibilityScope
  allowCharacterIds?: string[]; 
  allowFactionIds?: string[]
};

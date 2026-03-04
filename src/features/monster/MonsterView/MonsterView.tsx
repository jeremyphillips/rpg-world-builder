import { type Monster } from '@/data/monsters'
// import { useResolvedMonsterRule } from '../hooks/useResolvedMonsterRule'
import { MonsterHeader, MonsterEditionRulesSection } from './sections'


export default function EditionRuleDetail({ monster }: { monster: Monster }) {
  
  // TODO: Determine if we need to resolve the monster rule for the active edition
  // Resolve: native match, converted match, or nothing
  // const { resolved, hasNativeRule, hasConvertedRule } =
  //   useResolvedMonsterRule(monster);

  return (
    <>
      <MonsterHeader monster={monster} />
      <MonsterEditionRulesSection monster={monster} />
    </>
  )
}
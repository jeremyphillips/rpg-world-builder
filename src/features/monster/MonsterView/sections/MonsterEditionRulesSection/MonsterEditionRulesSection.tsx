import { useMonsterEditionState } from '../../../hooks'
import { EditionRuleDetail } from '../EditionRuleDetail/EditionRuleDetail'
import { type Monster } from '@/data/monsters'
import { AppAlert } from '@/ui/primitives'

export function MonsterEditionRulesSection({ monster }: { monster: Monster }) {
  const state = useMonsterEditionState(monster);

  switch (state.type) {
    case "loading":
      return <AppAlert tone="info">Loading campaign edition...</AppAlert>;

    case "native":
      return <EditionRuleDetail editionRule={state.rule} />;

    case "converted":
      return (
        <>
          <AppAlert tone="info" sx={{ mb: 3 }}>
            You are viewing stats converted from{" "}
            {/* {editionName(state.sourceEdition)}. */}
          </AppAlert>
          <EditionRuleDetail editionRule={state.rule} />
        </>
      );

    case "incompatible":
      return (
        <AppAlert tone="warning">
          This monster's rules are only available for{" "}
          {/* {state.availableEditions.map(editionName).join(", ")}. */}
        </AppAlert>
      );
  }
}

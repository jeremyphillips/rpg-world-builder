import { useMonsterEditionState } from '../../../hooks'
import { EditionRuleDetail } from '../EditionRuleDetail/EditionRuleDetail'
import { Alert } from '@mui/material'
import { type Monster } from '@/data'
// import { getNameById } from '@/utils'
// import { editions } from '@/data'

//const editionName = (id: string) => getNameById(editions as unknown as { id: string; name: string }[], id) ?? id

export function MonsterEditionRulesSection({ monster }: { monster: Monster }) {
  const state = useMonsterEditionState(monster);
  //const { editionName } = useEditionHelpers();

  switch (state.type) {
    case "loading":
      return <Alert severity="info">Loading campaign edition...</Alert>;

    case "native":
      return <EditionRuleDetail editionRule={state.rule} />;

    case "converted":
      return (
        <>
          <Alert severity="info" sx={{ mb: 3 }}>
            You are viewing stats converted from{" "}
            {/* {editionName(state.sourceEdition)}. */}
          </Alert>
          <EditionRuleDetail editionRule={state.rule} />
        </>
      );

    case "incompatible":
      return (
        <Alert severity="warning">
          This monster's rules are only available for{" "}
          {/* {state.availableEditions.map(editionName).join(", ")}. */}
        </Alert>
      );
  }
}

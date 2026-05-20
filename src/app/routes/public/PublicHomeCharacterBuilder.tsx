import CharacterBuilderLauncher from '@/features/characterBuilder/components/CharacterBuilderLauncher/CharacterBuilderLauncher'
import { CharacterProviders } from '@/app/providers/CharacterProviders'

type PublicHomeCharacterBuilderProps = {
  /** Open the builder modal as soon as providers mount (after load-on-click). */
  openOnMount?: boolean
}

/** Lazy chunk: rules + builder UI for public home only. */
export default function PublicHomeCharacterBuilder({
  openOnMount = true,
}: PublicHomeCharacterBuilderProps) {
  return (
    <CharacterProviders>
      <CharacterBuilderLauncher openOnMount={openOnMount} />
    </CharacterProviders>
  )
}

import { useEffect, useState } from 'react'
import Button from '@mui/material/Button'
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'

import { useCharacterBuilder } from '@/features/characterBuilder/context'
import { ChatContainer } from '@/chat'
import type { CharacterType } from '@/features/character/domain/types'
import type { MuiButtonSize } from '@/ui/sizes'

type CharacterBuilderLauncherProps = {
  buttonLabel?: string
  variant?: 'contained' | 'outlined' | 'text'
  size?: MuiButtonSize
  onCharacterCreated?: (character: unknown) => void
  characterType?: CharacterType
  /** Open builder modal on mount (e.g. after public home load-on-click). */
  openOnMount?: boolean
}

const CharacterBuilderLauncher = ({
  characterType = 'pc',
  buttonLabel = 'Create Character',
  variant = 'contained',
  size = 'large',
  openOnMount = false,
}: CharacterBuilderLauncherProps) => {
  const [isModalOpen, setModalOpen] = useState(false)
  const { openBuilder } = useCharacterBuilder()

  useEffect(() => {
    if (!openOnMount) return
    openBuilder(characterType)
    setModalOpen(true)
  }, [openOnMount, characterType, openBuilder])

  return (
    <>
      <Button
        variant={variant}
        size={size}
        startIcon={<AutoFixHighIcon />}
        onClick={() => {
          openBuilder(characterType)
          setModalOpen(true)
        }}
      >
        {buttonLabel}
      </Button>

      <ChatContainer
        isModalOpen={isModalOpen}
        onCloseModal={() => setModalOpen(false)}
      />
    </>
  )
}

export default CharacterBuilderLauncher

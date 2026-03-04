import { useState } from 'react'
import Button from '@mui/material/Button'
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'

import { useCharacterBuilder } from '@/features/characterBuilder/context'
import { ChatContainer } from '@/chat'
import type { CharacterType } from '@/features/character/domain/types'

type CharacterBuilderLauncherProps = {
  buttonLabel?: string
  variant?: 'contained' | 'outlined' | 'text'
  size?: 'small' | 'medium' | 'large'
  onCharacterCreated?: (character: unknown) => void
  characterType?: CharacterType
}

const CharacterBuilderLauncher = ({
  characterType = 'pc',
  buttonLabel = 'Create Character',
  variant = 'contained',
  size = 'large',
}: CharacterBuilderLauncherProps) => {
  const [isModalOpen, setModalOpen] = useState(false)
  const { openBuilder } = useCharacterBuilder()

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

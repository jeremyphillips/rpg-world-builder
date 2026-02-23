import { useState } from 'react'
import useChat from '../hooks/useChat'
import type { ChatMessage } from '../types'
import { useCharacterBuilder } from '@/features/characterBuilder/context'
import { CharacterBuilderWizard } from '@/features/characterBuilder/components'
import type { AbilityScoreMode } from '@/features/characterBuilder/components/CharacterBuilderWizard/CharacterBuilderWizard'
import { AppModal, ConfirmModal } from '@/ui/modals'
import { apiFetch } from '@/app/api'
import { type CharacterClassInfo } from '@/shared'
import { editions, classes as classesData } from '@/data'
import { generateAbilityScores, prioritizeAbilityScores } from '@/features/mechanics/domain/generation/ability-scores'
import { generateHitPoints } from '@/features/mechanics/domain/progression'
import { LoadingOverlay } from '@/ui/elements'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import type { AbilityScoreMethod } from '@/data/types'
import type { AbilityScores } from '@/shared/types/character.core'
import type { CharacterBuilderState } from '@/features/characterBuilder/types'

// ---------------------------------------------------------------------------
// ChatMessageItem
// ---------------------------------------------------------------------------
const ChatMessageItem = ({ message }: { message: ChatMessage }) => {
  if (message.role === 'assistant') {
    const jsonMatch = message.content.match(/```json([\s\S]*?)```/i)
    let prettyJson = message.content

    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1])
        prettyJson = JSON.stringify(parsed, null, 2)
      } catch (err) {
        console.error('Failed to parse JSON from assistant message', err)
      }
    }

    return (
      <Box sx={{ my: 1, p: 2, bgcolor: 'var(--mui-palette-action-hover)', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 0.5, display: 'block' }}>
          AI Response
        </Typography>
        <pre style={{ overflowX: 'auto', margin: 0, fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>
          {prettyJson}
        </pre>
      </Box>
    )
  }

  return (
    <Box sx={{ my: 1, p: 2, bgcolor: 'var(--mui-palette-primary-main)', color: '#fff', borderRadius: 1 }}>
      <Typography variant="caption" fontWeight={600} sx={{ mb: 0.5, display: 'block', opacity: 0.8 }}>
        Prompt Sent
      </Typography>
      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>
        {message.content.slice(0, 200)}…
      </Typography>
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Parse AI response into structured data
// ---------------------------------------------------------------------------
function parseAiResponse(message: ChatMessage): Record<string, unknown> | null {
  try {
    // Try extracting JSON from markdown code fences first
    const fenceMatch = message.content.match(/```(?:json)?\s*([\s\S]*?)```/i)
    if (fenceMatch) {
      return JSON.parse(fenceMatch[1])
    }
    // Try parsing the whole content as JSON
    return JSON.parse(message.content)
  } catch {
    console.warn('Could not parse AI response as JSON')
    return null
  }
}

// ---------------------------------------------------------------------------
// Ability score generation helpers
// ---------------------------------------------------------------------------

function getEditionAbilityScoreMethod(editionId: string | undefined): AbilityScoreMethod {
  const ed = editions.find(e => e.id === editionId)
  return ed?.generation?.abilityScoreMethod ?? '4d6-drop-lowest'
}

function getClassAbilityPriority(classId: string | undefined): (keyof AbilityScores)[] {
  if (!classId) return []
  const cls = classesData.find(c => c.id === classId)
  return cls?.generation?.abilityPriority ?? []
}

/**
 * Resolve ability scores based on the selected mode.
 * - 'default': generate using the edition method, prioritized by class
 * - 'ai': return null scores so the AI generates them
 * - 'custom': placeholder (TODO: implement custom score entry UI)
 */
function resolveAbilityScores(
  mode: AbilityScoreMode,
  builderState: CharacterBuilderState,
): AbilityScores | null {
  if (mode === 'ai') return null

  // TODO: implement custom score entry UI
  if (mode === 'custom') return null

  const method = getEditionAbilityScoreMethod(builderState.edition)
  const primaryClassId = builderState.classes[0]?.classId
  const priority = getClassAbilityPriority(primaryClassId)

  if (priority.length > 0) {
    return prioritizeAbilityScores(method, priority)
  }
  return generateAbilityScores(method)
}

// ---------------------------------------------------------------------------
// Merge builder state + AI result into a character document
// ---------------------------------------------------------------------------
function mergeCharacterData(
  builderState: CharacterBuilderState,
  aiResult: Record<string, unknown> | null,
  abilityScoreMode: AbilityScoreMode,
) {
  // The AI response may be wrapped in { character: { ... } }
  const ai = (aiResult && typeof aiResult === 'object' && 'character' in aiResult
    ? (aiResult as any).character
    : aiResult) ?? {}

  const builderSkills = builderState?.proficiencies?.skills ?? []
  const proficiencies = builderSkills.length > 0
    ? { skills: builderSkills }
    : (ai.proficiencies ?? { skills: [] })

  const generatedScores = resolveAbilityScores(abilityScoreMode, builderState)

  return {
    type: builderState.type,
    name: (builderState.name && builderState.name.trim()) || ai.name || '',
    // Builder state (source of truth for selections)
    race: builderState.race ?? '',
    classes: builderState.classes,
    level: builderState.totalLevel || 1,
    totalLevel: builderState.totalLevel || 1,
    alignment: builderState.alignment ?? '',
    edition: builderState.edition ?? '',
    setting: builderState.setting ?? '',
    xp: builderState.xp ?? 0,
    equipment: builderState.equipment ?? { armor: [], weapons: [], gear: [], weight: 0 },
    proficiencies: proficiencies,
    // Wealth: merge AI overrides onto builder state
    wealth: {
      ...builderState.wealth,
      ...(ai.wealth ?? {}),
    },

    // Hit points generated from builder state
    hitPoints: generateHitPoints(builderState.classes, builderState.edition, builderState.hitPointMode),

    // Ability scores: use generated scores when available, otherwise fall back to AI
    abilityScores: generatedScores ?? ai.stats ?? {},
    armorClass: ai.armorClass ?? {},
    narrative: ai.narrative ?? {},

    // Full AI response stored for reference
    ai: aiResult ?? {},

    // Traceability
    generation: {
      model: 'gpt-4o-mini',
      promptVersion: '1.0',
      createdAt: new Date().toISOString(),
    },
  }
}

// ---------------------------------------------------------------------------
// Save character to DB (if user is logged in)
// ---------------------------------------------------------------------------
async function saveCharacterToDb(data: {
  builderState: CharacterBuilderState
  aiResult: Record<string, unknown> | null
  abilityScoreMode: AbilityScoreMode
}): Promise<boolean> {
  try {
    await apiFetch('/api/auth/me')
    const characterData = mergeCharacterData(data.builderState, data.aiResult, data.abilityScoreMode)
    await apiFetch('/api/characters', { method: 'POST', body: characterData })
    return true
  } catch (err) {
    console.error('Failed to save character:', err)
    return false
  }
}

// ---------------------------------------------------------------------------
// ChatContainer
// ---------------------------------------------------------------------------
interface ChatContainerProps {
  isModalOpen: boolean
  onCloseModal: () => void
}

const ChatContainer = ({ isModalOpen, onCloseModal }: ChatContainerProps) => {
  const { state, isComplete, resetState } = useCharacterBuilder()

  const {
    sendMessage,
    messages,
    error
  } = useChat()

  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const [confirmClose, setConfirmClose] = useState(false)
  const [abilityScoreMode] = useState<AbilityScoreMode>('default')

  const formatPrompt = (s: CharacterBuilderState) => {
    const scores = resolveAbilityScores(abilityScoreMode, s)
    const method = getEditionAbilityScoreMethod(s.edition)

    const baseCharacter = {
      character: {
        type: s.type ?? 'pc',
        name: (s.name && s.name.trim()) || '',

        edition: s.edition ?? '',
        setting: s.setting,

        race: s.race,
        classes: s.classes.map((cls: CharacterClassInfo, i: number) => ({
          id: cls.classId,
          name: cls.classId,
          level: cls.level,
          subclass: {
            id: cls.classDefinitionId,
            name: cls.classDefinitionId,
          },
          isStartingClass: i === 0,
        })),
        alignment: s.alignment,
        abilityScores: scores ?? {
          strength: null,
          dexterity: null,
          constitution: null,
          intelligence: null,
          wisdom: null,
          charisma: null,
        },
        hitPoints: {
          total: null,
          generationMethod: method,
        },
        armorClass: {
          base: 10,
          current: null,
          calculation: '',
        },
        requirements: {
          minStats: { strength: 9 },
        },
        proficiencies: { skills: [] },
        equipment: {
          weapons: s?.equipment?.weapons,
          armor: s?.equipment?.armor,
          gear: s?.equipment?.gear,
        },
        derivedMetrics: {
          proficiencyBonus: null,
        },
        narrative: {
          personalityTraits: [],
          ideals: '',
          bonds: '',
          flaws: '',
          backstory: '',
        },
        xp: s.xp,
      },
    }

    return `You are an expert D&D GM. Return a character object in valid JSON format exactly matching this structure: 

    ${JSON.stringify(baseCharacter, null, 2)}

    Do NOT include anything outside this JSON.`
  }

  // ── Generate handler ─────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!isComplete(state)) return

    setGenerating(true)
    setGenError(null)

    try {
      // 1. Send to AI and wait for response
      const response = await sendMessage(formatPrompt(state))

      // 2. Parse AI result
      const aiResult = response ? parseAiResponse(response) : null

      // 3. Save merged character to DB (only if logged in)
      await saveCharacterToDb({
        builderState: state,
        aiResult,
        abilityScoreMode,
      })

      // 4. Only clear state + close modal after persistence succeeds
      resetState()
      onCloseModal()
    } catch (err: any) {
      setGenError(err.message ?? 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <>
      <CharacterBuilderWizard onGenerate={handleGenerate} isGenerating={generating}>
        {({ content, actions }) => (
          <AppModal
            open={isModalOpen}
            onClose={generating ? () => {} : () => setConfirmClose(true)}
            size="full"
            showCloseButton={!generating}
            closeOnBackdropClick={!generating}
            closeOnEsc={!generating}
            loading={generating}
            actions={actions}
          >
            {content}
          </AppModal>
        )}
      </CharacterBuilderWizard>

      <ConfirmModal
        open={confirmClose}
        headline="Discard character?"
        description="Your current progress will be lost if you close the builder."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        confirmColor="error"
        onConfirm={() => {
          setConfirmClose(false)
          resetState()
          onCloseModal()
        }}
        onCancel={() => setConfirmClose(false)}
      />

      {/* Generation loader overlay inside the modal */}
      <LoadingOverlay
        open={generating && isModalOpen}
        headline="Generating character…"
        subtext="Consulting the sages"
      />

      {/* Errors */}
      {(error || genError) && (
        <Alert severity="error" sx={{ my: 2 }}>
          {genError ?? error}
        </Alert>
      )}

      {/* Message history */}
      {messages.map((message, i) => (
        <ChatMessageItem key={i} message={message} />
      ))}
    </>
  )
}

export default ChatContainer

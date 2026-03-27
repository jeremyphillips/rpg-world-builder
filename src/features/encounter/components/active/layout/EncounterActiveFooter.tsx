// import Box from '@mui/material/Box'
// import Button from '@mui/material/Button'
// import Paper from '@mui/material/Paper'
// import Stack from '@mui/material/Stack'
// import Typography from '@mui/material/Typography'

// import { AppBadge } from '@/ui/primitives'

// type TurnResources = {
//   actionAvailable: boolean
//   bonusActionAvailable: boolean
//   reactionAvailable: boolean
//   movementRemaining: number
// }

// export type InteractionMode = 'select-target' | 'move'

// type EncounterActiveFooterProps = {
//   turnResources: TurnResources | null
//   selectedActionLabel: string | null
//   selectedTargetLabel: string | null
//   canResolveAction: boolean
//   interactionMode?: InteractionMode
//   onToggleInteractionMode?: () => void
//   onResolveAction: () => void
//   onEndTurn: () => void
// }

// function getActionStateLine(
//   actionLabel: string | null,
//   targetLabel: string | null,
// ): string {
//   if (!actionLabel) return 'No action selected'
//   if (!targetLabel) return `Selected: ${actionLabel} \u2014 No target selected`
//   return `Selected: ${actionLabel} \u2192 ${targetLabel}`
// }

// export function EncounterActiveFooter({
//   turnResources,
//   selectedActionLabel,
//   selectedTargetLabel,
//   canResolveAction,
//   interactionMode = 'select-target',
//   onToggleInteractionMode,
//   onResolveAction,
//   onEndTurn,
// }: EncounterActiveFooterProps) {
//   const stateLine = interactionMode === 'move'
//     ? `Move mode \u2014 ${turnResources?.movementRemaining ?? 0} ft remaining`
//     : getActionStateLine(selectedActionLabel, selectedTargetLabel)

//   const canMove = (turnResources?.movementRemaining ?? 0) > 0

//   return (
//     <Paper
//       square
//       elevation={4}
//       sx={{ px: 4, py: 2, borderTop: '1px solid', borderColor: 'divider' }}
//     >
//       <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
//         <Box sx={{ minWidth: 0 }}>
//           {turnResources && (
//             <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
//               <AppBadge
//                 label={`Action: ${turnResources.actionAvailable ? 'available' : 'spent'}`}
//                 tone={turnResources.actionAvailable ? 'success' : 'default'}
//                 variant="outlined"
//                 size="small"
//               />
//               <AppBadge
//                 label={`Bonus: ${turnResources.bonusActionAvailable ? 'available' : 'spent'}`}
//                 tone={turnResources.bonusActionAvailable ? 'success' : 'default'}
//                 variant="outlined"
//                 size="small"
//               />
//               <AppBadge
//                 label={`Movement: ${turnResources.movementRemaining} ft`}
//                 tone={interactionMode === 'move' ? 'success' : 'default'}
//                 variant="outlined"
//                 size="small"
//               />
//               <AppBadge
//                 label={`Reaction: ${turnResources.reactionAvailable ? 'available' : 'spent'}`}
//                 tone={turnResources.reactionAvailable ? 'success' : 'default'}
//                 variant="outlined"
//                 size="small"
//               />
//             </Stack>
//           )}
//           <Typography variant="h3" color="text.secondary" noWrap>
//             {stateLine}
//           </Typography>
//         </Box>

//         <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
//           {onToggleInteractionMode && (
//             <Button
//               variant={interactionMode === 'move' ? 'contained' : 'outlined'}
//               color={interactionMode === 'move' ? 'success' : 'inherit'}
//               size="large"
//               disabled={!canMove && interactionMode !== 'move'}
//               onClick={onToggleInteractionMode}
//             >
//               {interactionMode === 'move' ? 'Cancel Move' : 'Move'}
//             </Button>
//           )}
//           <Button
//             variant="contained"
//             size="large"
//             disabled={!canResolveAction || interactionMode === 'move'}
//             onClick={onResolveAction}
//           >
//             Resolve Action
//           </Button>
//           <Button variant="outlined" size="large" onClick={onEndTurn}>
//             End Turn
//           </Button>
//         </Stack>
//       </Stack>
//     </Paper>
//   )
// }

import type { AlignmentList } from './types'

export const standardAlignments: AlignmentList = [
  { id: 'lg', name: 'Lawful Good' },
  { id: 'ng', name: 'Neutral Good' },
  { id: 'cg', name: 'Chaotic Good' },
  { id: 'ln', name: 'Lawful Neutral' },
  { id: 'n',  name: 'Neutral' },
  { id: 'cn', name: 'Chaotic Neutral' },
  { id: 'le', name: 'Lawful Evil' },
  { id: 'ne', name: 'Neutral Evil' },
  { id: 'ce', name: 'Chaotic Evil' }
]

export const fourEAlignments: AlignmentList = [
  { id: 'lg', name: 'Lawful Good' },
  { id: 'good', name: 'Good' },
  { id: 'unaligned', name: 'Unaligned' },
  { id: 'evil', name: 'Evil' },
  { id: 'ce', name: 'Chaotic Evil' }
]

export const basicAlignments: AlignmentList = [
  { id: 'law', name: 'Lawful' },
  { id: 'neutral', name: 'Neutral' },
  { id: 'chaos', name: 'Chaotic' }
]

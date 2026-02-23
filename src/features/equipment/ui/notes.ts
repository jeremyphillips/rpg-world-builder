import { type ClassRequirement } from "@/data"

export const getEquipmentNotes = ({
  requirements,
  edition,
  slot
}: {
  requirements: ClassRequirement[]
  edition: string
  slot: 'armor' | 'weapons' | 'tools'
}) => {
  const req = requirements.find(r => r.edition === edition)
  if (!req) return []

  return req.equipment?.[slot]?.notes ?? []
}

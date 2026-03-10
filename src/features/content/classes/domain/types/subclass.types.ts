export type SubclassFeature = {
  name: string
  level: number
  description?: string
  kind?: string
  [key: string]: unknown
}

export interface Subclass {
  id: string
  name: string
  source?: string
  features?: SubclassFeature[]
}

export interface SubclassSelection {
  id: string
  name: string
  selectionLevel: number | null
  options: Subclass[]
}

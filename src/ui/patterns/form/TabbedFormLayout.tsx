import { useState } from 'react'
import { Box, Tab, Tabs } from '@mui/material'
import DynamicFormRenderer from './DynamicFormRenderer'
import type { FieldConfig, FormSection } from './form.types'

type TabbedFormLayoutProps = {
  sections: FormSection[]
  fields: FieldConfig[]
  /** Spacing between fields within a tab panel */
  spacing?: number
}

/**
 * Groups `FieldConfig[]` by their `section` id and renders each group
 * as a tab panel using DynamicFormRenderer.
 *
 * All fields stay mounted (hidden via `display: none`) so react-hook-form
 * tracks every value regardless of active tab. A single submit button
 * outside this component submits all tab values at once.
 */
export default function TabbedFormLayout({
  sections,
  fields,
  spacing = 3
}: TabbedFormLayoutProps) {
  const [activeTab, setActiveTab] = useState(0)

  const fieldsBySection = new Map<string, FieldConfig[]>()
  for (const section of sections) {
    fieldsBySection.set(section.id, [])
  }
  for (const field of fields) {
    const sectionId = field.section ?? sections[0]?.id
    if (!sectionId) continue
    const list = fieldsBySection.get(sectionId)
    if (list) {
      list.push(field)
    }
  }

  return (
    <Box>
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
      >
        {sections.map((s) => (
          <Tab key={s.id} label={s.label} />
        ))}
      </Tabs>

      {sections.map((section, index) => {
        const sectionFields = fieldsBySection.get(section.id) ?? []
        return (
          <Box
            key={section.id}
            role="tabpanel"
            sx={{ display: activeTab === index ? 'block' : 'none' }}
          >
            <DynamicFormRenderer fields={sectionFields} spacing={spacing} />
          </Box>
        )
      })}
    </Box>
  )
}

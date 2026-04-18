import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { KeyValueSection, type KeyValueItem } from '@/ui/patterns';

export type ContentDetailAdvancedAccordionProps = {
  items: KeyValueItem[];
  /** Title for the KeyValueSection inside the expanded panel (e.g. "Advanced monster data"). */
  sectionTitle: string;
  /**
   * Prefix for stable id / aria-controls (`{idPrefix}-advanced-header`, `{idPrefix}-advanced-content`).
   * Use kebab-case, e.g. `magic-item`, `skill-proficiency`.
   */
  idPrefix: string;
};

/**
 * Collapsed-by-default accordion for platform-admin advanced detail rows (typically raw JSON).
 * Returns null when items is empty — pass advancedItems from buildContentDetailSectionsFromSpecs directly.
 */
export default function ContentDetailAdvancedAccordion({
  items,
  sectionTitle,
  idPrefix,
}: ContentDetailAdvancedAccordionProps) {
  if (items.length === 0) return null;

  const headerId = `${idPrefix}-advanced-header`;
  const regionId = `${idPrefix}-advanced-content`;

  return (
    <Accordion
      defaultExpanded={false}
      disableGutters
      sx={{ mt: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls={regionId} id={headerId}>
        <Typography component="span" variant="subtitle1" fontWeight={600}>
          Advanced
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <KeyValueSection title={sectionTitle} items={items} columns={1} dense />
      </AccordionDetails>
    </Accordion>
  );
}

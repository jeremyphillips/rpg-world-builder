import type { CampaignTagsConfig } from '@/shared/types/ruleset'

export const CAMPAIGN_TAG_OPTIONS: CampaignTagsConfig = [
  {
    id: 'tone',
    name: 'Tone',
    options: [
      { id: 'gritty', name: 'Gritty', description: 'Harsh world, consequences matter' },
      { id: 'heroic', name: 'Heroic', description: 'Cinematic heroes and big wins' },
      { id: 'dark', name: 'Dark', description: 'Bleak, horror-leaning themes' },
      { id: 'whimsical', name: 'Whimsical', description: 'Playful, strange, or comedic' },
      { id: 'serious', name: 'Serious', description: 'Grounded, dramatic roleplay' },
      { id: 'cozy', name: 'Cozy', description: 'Low-stakes, relaxing adventures' },
    ],
  },

  {
    id: 'playstyle',
    name: 'Playstyle',
    options: [
      { id: 'combat-heavy', name: 'Combat Heavy' },
      { id: 'roleplay-heavy', name: 'Roleplay Heavy' },
      { id: 'exploration-heavy', name: 'Exploration Heavy' },
      { id: 'story-driven', name: 'Story Driven' },
      { id: 'sandbox', name: 'Sandbox' },
      { id: 'episodic', name: 'Episodic' },
    ],
  },

  {
    id: 'structure',
    name: 'Structure',
    options: [
      { id: 'dungeon-crawl', name: 'Dungeon Crawl' },
      { id: 'hexcrawl', name: 'Hexcrawl' },
      { id: 'intrigue', name: 'Intrigue / Politics' },
      { id: 'mystery', name: 'Mystery / Investigation' },
    ],
  },

  {
    id: 'difficulty',
    name: 'Difficulty & Rules',
    options: [
      { id: 'hardcore', name: 'Hardcore', description: 'High lethality, limited safety nets' },
      { id: 'tactical', name: 'Tactical', description: 'Positioning and mechanics matter' },
      { id: 'rules-light', name: 'Rules Light' },
      { id: 'rules-strict', name: 'Rules Strict' },
    ],
  },

  {
    id: 'magic',
    name: 'Magic Level',
    options: [
      { id: 'low-magic', name: 'Low Magic' },
      { id: 'high-magic', name: 'High Magic' },
    ],
  },

  {
    id: 'genre',
    name: 'Genre',
    options: [
      { id: 'epic-fantasy', name: 'Epic Fantasy' },
      { id: 'sword-and-sorcery', name: 'Sword & Sorcery' },
      { id: 'weird-fantasy', name: 'Weird Fantasy' },
      { id: 'steampunk', name: 'Steampunk' },
      { id: 'pirates', name: 'Pirates' },
      { id: 'planar', name: 'Planar / Multiverse' },
    ],
  },

  {
    id: 'content',
    name: 'Content',
    options: [
      { id: 'horror', name: 'Horror' },
      { id: 'dark-humor', name: 'Dark Humor' },
      { id: 'romance', name: 'Romance' },
      { id: 'family-friendly', name: 'Family Friendly' },
      { id: 'mature-themes', name: 'Mature Themes' },
    ],
  },
]
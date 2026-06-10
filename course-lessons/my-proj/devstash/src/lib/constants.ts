export const ITEMS_PER_PAGE = 21
export const COLLECTIONS_PER_PAGE = 21
export const DASHBOARD_COLLECTIONS_LIMIT = 6
export const DASHBOARD_RECENT_ITEMS_LIMIT = 10
export const FREE_TIER_ITEM_LIMIT = 50
export const FREE_TIER_COLLECTION_LIMIT = 3

export const FREE_FEATURES = [
  { text: '50 items', check: true },
  { text: '3 collections', check: true },
  { text: 'Snippets, prompts, commands, notes, links', check: true },
  { text: 'Full-text search', check: true },
  { text: 'File & image uploads', check: false },
  { text: 'AI features', check: false },
  { text: 'Export data', check: false },
]

export const PRO_FEATURES = [
  'Unlimited items',
  'Unlimited collections',
  'All item types including files & images',
  'AI auto-tagging & summaries',
  'AI code explanation',
  'Prompt optimizer',
  'Export (JSON / ZIP)',
]

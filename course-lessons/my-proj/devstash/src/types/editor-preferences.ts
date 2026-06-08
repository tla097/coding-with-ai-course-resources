export interface EditorPreferences {
  fontSize: number
  tabSize: number
  wordWrap: boolean
  minimap: boolean
  theme: 'vs-dark' | 'monokai' | 'github-dark'
}

export const DEFAULT_EDITOR_PREFERENCES: EditorPreferences = {
  fontSize: 13,
  tabSize: 2,
  wordWrap: true,
  minimap: false,
  theme: 'vs-dark',
}

export const FONT_SIZE_OPTIONS = [11, 12, 13, 14, 16, 18, 20] as const
export const TAB_SIZE_OPTIONS = [2, 4, 8] as const
export const THEME_OPTIONS = ['vs-dark', 'monokai', 'github-dark'] as const

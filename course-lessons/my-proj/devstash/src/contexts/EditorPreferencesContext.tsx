'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { updateEditorPreferences } from '@/actions/editor-preferences'
import {
  type EditorPreferences,
  DEFAULT_EDITOR_PREFERENCES,
} from '@/types/editor-preferences'
import { toast } from 'sonner'

interface EditorPreferencesContextValue {
  preferences: EditorPreferences
  updatePreference: <K extends keyof EditorPreferences>(
    key: K,
    value: EditorPreferences[K],
  ) => Promise<void>
}

const EditorPreferencesContext = createContext<EditorPreferencesContextValue>({
  preferences: DEFAULT_EDITOR_PREFERENCES,
  updatePreference: async () => {},
})

export function useEditorPreferences() {
  return useContext(EditorPreferencesContext)
}

interface Props {
  children: React.ReactNode
  initialPreferences: EditorPreferences
}

export function EditorPreferencesProvider({ children, initialPreferences }: Props) {
  const [preferences, setPreferences] = useState<EditorPreferences>(initialPreferences)

  const updatePreference = useCallback(
    async <K extends keyof EditorPreferences>(key: K, value: EditorPreferences[K]) => {
      const next = { ...preferences, [key]: value }
      setPreferences(next)
      const result = await updateEditorPreferences(next)
      if (result.success) {
        toast.success('Editor preferences saved')
      } else {
        setPreferences(preferences)
        toast.error('Failed to save preferences')
      }
    },
    [preferences],
  )

  return (
    <EditorPreferencesContext.Provider value={{ preferences, updatePreference }}>
      {children}
    </EditorPreferencesContext.Provider>
  )
}

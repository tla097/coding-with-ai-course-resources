'use client'

import { useEditorPreferences } from '@/contexts/EditorPreferencesContext'
import {
  FONT_SIZE_OPTIONS,
  TAB_SIZE_OPTIONS,
  THEME_OPTIONS,
} from '@/types/editor-preferences'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

export default function EditorPreferencesForm() {
  const { preferences, updatePreference } = useEditorPreferences()

  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-6">
      <div>
        <h2 className="text-base font-semibold">Editor Preferences</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Customize the code editor appearance. Changes are saved automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Font Size */}
        <div className="space-y-2">
          <Label htmlFor="font-size">Font Size</Label>
          <Select
            value={String(preferences.fontSize)}
            onValueChange={v => updatePreference('fontSize', Number(v))}
          >
            <SelectTrigger id="font-size">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_SIZE_OPTIONS.map(size => (
                <SelectItem key={size} value={String(size)}>
                  {size}px
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tab Size */}
        <div className="space-y-2">
          <Label htmlFor="tab-size">Tab Size</Label>
          <Select
            value={String(preferences.tabSize)}
            onValueChange={v => updatePreference('tabSize', Number(v))}
          >
            <SelectTrigger id="tab-size">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TAB_SIZE_OPTIONS.map(size => (
                <SelectItem key={size} value={String(size)}>
                  {size} spaces
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Theme */}
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="theme">Theme</Label>
          <Select
            value={preferences.theme}
            onValueChange={v =>
              updatePreference('theme', v as typeof THEME_OPTIONS[number])
            }
          >
            <SelectTrigger id="theme">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {THEME_OPTIONS.map(theme => (
                <SelectItem key={theme} value={theme}>
                  {theme}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        {/* Word Wrap */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="word-wrap" className="text-sm font-medium">
              Word Wrap
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Wrap long lines to fit the editor width
            </p>
          </div>
          <Switch
            id="word-wrap"
            checked={preferences.wordWrap}
            onCheckedChange={v => updatePreference('wordWrap', v)}
          />
        </div>

        {/* Minimap */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="minimap" className="text-sm font-medium">
              Minimap
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Show a miniature code overview on the right side
            </p>
          </div>
          <Switch
            id="minimap"
            checked={preferences.minimap}
            onCheckedChange={v => updatePreference('minimap', v)}
          />
        </div>
      </div>
    </div>
  )
}

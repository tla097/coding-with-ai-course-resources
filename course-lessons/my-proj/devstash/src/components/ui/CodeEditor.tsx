'use client'

import dynamic from 'next/dynamic'
import { useState, useMemo } from 'react'
import { Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useEditorPreferences } from '@/contexts/EditorPreferencesContext'
import type Monaco from 'monaco-editor'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-[#1e1e1e] animate-pulse" />,
})

function registerCustomThemes(monaco: typeof Monaco) {
  monaco.editor.defineTheme('monokai', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '75715e', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'f92672' },
      { token: 'string', foreground: 'e6db74' },
      { token: 'number', foreground: 'ae81ff' },
      { token: 'type', foreground: '66d9e8' },
      { token: 'function', foreground: 'a6e22e' },
    ],
    colors: {
      'editor.background': '#272822',
      'editor.foreground': '#f8f8f2',
      'editor.lineHighlightBackground': '#3e3d32',
      'editorCursor.foreground': '#f8f8f0',
      'editor.selectionBackground': '#49483e',
    },
  })

  monaco.editor.defineTheme('github-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '8b949e', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'ff7b72' },
      { token: 'string', foreground: 'a5d6ff' },
      { token: 'number', foreground: '79c0ff' },
      { token: 'type', foreground: 'ffa657' },
      { token: 'function', foreground: 'd2a8ff' },
    ],
    colors: {
      'editor.background': '#0d1117',
      'editor.foreground': '#c9d1d9',
      'editor.lineHighlightBackground': '#161b22',
      'editorCursor.foreground': '#c9d1d9',
      'editor.selectionBackground': '#388bfd26',
    },
  })
}

interface Props {
  value: string
  onChange?: (value: string) => void
  language?: string | null
  readOnly?: boolean
}

const MIN_HEIGHT = 120
const MAX_HEIGHT = 400
const LINE_HEIGHT = 19
const PADDING = 24

export default function CodeEditor({ value, onChange, language, readOnly = false }: Props) {
  const [copied, setCopied] = useState(false)
  const { preferences } = useEditorPreferences()

  const height = useMemo(() => {
    const lines = value ? value.split('\n').length : 1
    return Math.min(Math.max(lines * LINE_HEIGHT + PADDING, MIN_HEIGHT), MAX_HEIGHT)
  }, [value])

  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const monacoLanguage = language?.toLowerCase() ?? 'plaintext'

  return (
    <div className="rounded-lg border border-[#3c3c3c] overflow-hidden">
      {/* macOS-style title bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#2d2d2d] border-b border-[#3c3c3c]">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <div className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex items-center gap-2.5">
          {language && (
            <span className="text-[11px] text-[#858585] font-mono">{language}</span>
          )}
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 text-[11px] text-[#858585] hover:text-[#cccccc] transition-colors"
            title="Copy to clipboard"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <MonacoEditor
        height={height}
        value={value}
        language={monacoLanguage}
        theme={preferences.theme}
        beforeMount={registerCustomThemes}
        onChange={readOnly ? undefined : v => onChange?.(v ?? '')}
        options={{
          readOnly,
          minimap: { enabled: preferences.minimap },
          scrollBeyondLastLine: false,
          fontSize: preferences.fontSize,
          tabSize: preferences.tabSize,
          lineNumbers: readOnly ? 'off' : 'on',
          folding: false,
          wordWrap: preferences.wordWrap ? 'on' : 'off',
          automaticLayout: true,
          scrollbar: {
            vertical: 'auto',
            horizontal: 'hidden',
            verticalScrollbarSize: 6,
            useShadows: false,
          },
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          overviewRulerBorder: false,
          padding: { top: 12, bottom: 12 },
          renderLineHighlight: readOnly ? 'none' : 'line',
          contextmenu: false,
        }}
      />
    </div>
  )
}

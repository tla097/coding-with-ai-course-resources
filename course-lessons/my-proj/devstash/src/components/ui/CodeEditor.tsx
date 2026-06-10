'use client'

import dynamic from 'next/dynamic'
import { useState, useMemo, useEffect } from 'react'
import { Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useEditorPreferences } from '@/contexts/EditorPreferencesContext'
import { explainCode } from '@/actions/ai'
import { BASE_MD_COMPONENTS } from '@/lib/markdown-components'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'
import { EditorToolbar } from '@/components/ui/EditorToolbar'
import { EditorTabButton } from '@/components/ui/EditorTabButton'
import { ProAiButton } from '@/components/ui/ProAiButton'
import type Monaco from 'monaco-editor'
import type { Components } from 'react-markdown'

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

const MD_COMPONENTS: Components = {
  ...BASE_MD_COMPONENTS,
  h1: ({ children }) => <h1 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#e8e8e8', marginTop: '1em', marginBottom: '0.5em', lineHeight: 1.3 }}>{children}</h1>,
  h2: ({ children }) => <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#e8e8e8', marginTop: '1em', marginBottom: '0.5em', lineHeight: 1.3 }}>{children}</h2>,
  h3: ({ children }) => <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#e8e8e8', marginTop: '1em', marginBottom: '0.5em', lineHeight: 1.3 }}>{children}</h3>,
  a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#4fa3e3', textDecoration: 'none' }}>{children}</a>,
}

interface Props {
  value: string
  onChange?: (value: string) => void
  language?: string | null
  readOnly?: boolean
  isPro?: boolean
  itemType?: string
}

const MIN_HEIGHT = 120
const MAX_HEIGHT = 400
const LINE_HEIGHT = 19
const PADDING = 24

export default function CodeEditor({ value, onChange, language, readOnly = false, isPro, itemType }: Props) {
  const { copied, copy } = useCopyToClipboard()
  const [activeTab, setActiveTab] = useState<'code' | 'explain'>('code')
  const [explanation, setExplanation] = useState<string | null>(null)
  const [explaining, setExplaining] = useState(false)
  const { preferences } = useEditorPreferences()

  useEffect(() => {
    setExplanation(null)
    setActiveTab('code')
  }, [value])

  const height = useMemo(() => {
    const lines = value ? value.split('\n').length : 1
    return Math.min(Math.max(lines * LINE_HEIGHT + PADDING, MIN_HEIGHT), MAX_HEIGHT)
  }, [value])

  async function handleExplain() {
    if (!value) return
    setExplaining(true)
    const result = await explainCode({
      content: value,
      itemType: itemType ?? 'snippet',
      language: language ?? undefined,
    })
    setExplaining(false)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    setExplanation(result.data.explanation)
    setActiveTab('explain')
  }

  const monacoLanguage = language?.toLowerCase() ?? 'plaintext'
  const showExplainControls = readOnly

  return (
    <div className="rounded-lg border border-[#3c3c3c] overflow-hidden">
      <EditorToolbar
        leftSlot={
          explanation ? (
            <>
              <EditorTabButton active={activeTab === 'code'} onClick={() => setActiveTab('code')}>Code</EditorTabButton>
              <EditorTabButton active={activeTab === 'explain'} onClick={() => setActiveTab('explain')}>Explain</EditorTabButton>
            </>
          ) : (
            <>
              <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <div className="h-3 w-3 rounded-full bg-[#28c840]" />
            </>
          )
        }
        rightSlot={
          <>
            {language && <span className="text-[11px] text-[#858585] font-mono">{language}</span>}
            {showExplainControls && (
              <ProAiButton
                isPro={isPro ?? false}
                loading={explaining}
                onClick={handleExplain}
                label="Explain"
                loadingLabel="Explaining…"
                title="Explain this code with AI"
              />
            )}
            <button
              type="button"
              onClick={() => copy(value)}
              className="flex items-center gap-1 text-[11px] text-[#858585] hover:text-[#cccccc] transition-colors"
              title="Copy to clipboard"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </>
        }
      />

      {/* Explain tab */}
      {activeTab === 'explain' && explanation && (
        <div
          style={{ minHeight: MIN_HEIGHT, maxHeight: MAX_HEIGHT }}
          className="overflow-y-auto bg-[#1e1e1e] px-4 py-3"
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>
            {explanation}
          </ReactMarkdown>
        </div>
      )}

      {/* Code tab / Monaco Editor */}
      {activeTab === 'code' && (
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
      )}
    </div>
  )
}

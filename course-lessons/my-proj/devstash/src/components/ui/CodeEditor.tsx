'use client'

import dynamic from 'next/dynamic'
import { useState, useMemo, useEffect } from 'react'
import { Copy, Check, Sparkles, Loader2, Crown } from 'lucide-react'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useEditorPreferences } from '@/contexts/EditorPreferencesContext'
import { explainCode } from '@/actions/ai'
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
  h1: ({ children }) => <h1 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#e8e8e8', marginTop: '1em', marginBottom: '0.5em', lineHeight: 1.3 }}>{children}</h1>,
  h2: ({ children }) => <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#e8e8e8', marginTop: '1em', marginBottom: '0.5em', lineHeight: 1.3 }}>{children}</h2>,
  h3: ({ children }) => <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#e8e8e8', marginTop: '1em', marginBottom: '0.5em', lineHeight: 1.3 }}>{children}</h3>,
  p: ({ children }) => <p style={{ marginBottom: '0.75em', fontSize: '0.875rem', color: '#cccccc', lineHeight: 1.6 }}>{children}</p>,
  a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#4fa3e3', textDecoration: 'none' }}>{children}</a>,
  strong: ({ children }) => <strong style={{ fontWeight: 700, color: '#e8e8e8' }}>{children}</strong>,
  em: ({ children }) => <em style={{ fontStyle: 'italic' }}>{children}</em>,
  code: ({ children, className }) => {
    const isBlock = className?.startsWith('language-')
    if (isBlock) return <code style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.8125rem', color: '#cccccc' }}>{children}</code>
    return <code style={{ background: '#2a2a2a', border: '1px solid #3c3c3c', borderRadius: 3, padding: '0.1em 0.4em', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.8125rem', color: '#ce9178' }}>{children}</code>
  },
  pre: ({ children }) => <pre style={{ background: '#1a1a1a', border: '1px solid #3c3c3c', borderRadius: 6, padding: '0.75rem 1rem', overflowX: 'auto', marginBottom: '0.75em' }}>{children}</pre>,
  ul: ({ children }) => <ul style={{ paddingLeft: '1.5rem', marginBottom: '0.75em', listStyleType: 'disc', color: '#cccccc', fontSize: '0.875rem' }}>{children}</ul>,
  ol: ({ children }) => <ol style={{ paddingLeft: '1.5rem', marginBottom: '0.75em', listStyleType: 'decimal', color: '#cccccc', fontSize: '0.875rem' }}>{children}</ol>,
  li: ({ children }) => <li style={{ marginBottom: '0.25em' }}>{children}</li>,
  blockquote: ({ children }) => <blockquote style={{ borderLeft: '3px solid #4fa3e3', paddingLeft: '0.875rem', marginLeft: 0, marginBottom: '0.75em', color: '#858585', fontStyle: 'italic' }}>{children}</blockquote>,
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
  const [copied, setCopied] = useState(false)
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

  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    })
  }

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
      {/* macOS-style title bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#2d2d2d] border-b border-[#3c3c3c]">
        <div className="flex items-center gap-1.5">
          {explanation ? (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('code')}
                className={`text-[11px] px-2 py-0.5 rounded transition-colors ${
                  activeTab === 'code'
                    ? 'bg-[#3c3c3c] text-[#cccccc]'
                    : 'text-[#858585] hover:text-[#cccccc]'
                }`}
              >
                Code
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('explain')}
                className={`text-[11px] px-2 py-0.5 rounded transition-colors ${
                  activeTab === 'explain'
                    ? 'bg-[#3c3c3c] text-[#cccccc]'
                    : 'text-[#858585] hover:text-[#cccccc]'
                }`}
              >
                Explain
              </button>
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <div className="h-3 w-3 rounded-full bg-[#28c840]" />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          {language && (
            <span className="text-[11px] text-[#858585] font-mono">{language}</span>
          )}
          {showExplainControls && (
            isPro ? (
              <button
                type="button"
                onClick={handleExplain}
                disabled={explaining}
                className="flex items-center gap-1 text-[11px] text-[#858585] hover:text-[#cccccc] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Explain this code with AI"
              >
                {explaining
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Sparkles className="h-3.5 w-3.5" />
                }
                {explaining ? 'Explaining…' : 'Explain'}
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="flex items-center gap-1 text-[11px] text-[#858585] opacity-50 cursor-not-allowed"
                title="AI features require Pro subscription"
              >
                <Crown className="h-3.5 w-3.5" />
                Explain
              </button>
            )
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

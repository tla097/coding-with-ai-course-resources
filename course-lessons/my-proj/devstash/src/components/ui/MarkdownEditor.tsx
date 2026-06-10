'use client'

import { useState, useMemo, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import type { Components } from 'react-markdown'
import { BASE_MD_COMPONENTS } from '@/lib/markdown-components'
import { optimizePrompt } from '@/actions/ai'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'
import { EditorToolbar } from '@/components/ui/EditorToolbar'
import { EditorTabButton } from '@/components/ui/EditorTabButton'
import { ProAiButton } from '@/components/ui/ProAiButton'

interface Props {
  value: string
  onChange?: (value: string) => void
  readOnly?: boolean
  isPro?: boolean
  itemType?: string
  onUseOptimized?: (text: string) => void
}

const MIN_HEIGHT = 120
const MAX_HEIGHT = 400

const MD_COMPONENTS: Components = {
  ...BASE_MD_COMPONENTS,
  h1: ({ children }) => <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#e8e8e8', marginTop: '1.25em', marginBottom: '0.5em', lineHeight: 1.3 }}>{children}</h1>,
  h2: ({ children }) => <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#e8e8e8', marginTop: '1.25em', marginBottom: '0.5em', lineHeight: 1.3 }}>{children}</h2>,
  h3: ({ children }) => <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#e8e8e8', marginTop: '1.25em', marginBottom: '0.5em', lineHeight: 1.3 }}>{children}</h3>,
  h4: ({ children }) => <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#e8e8e8', marginTop: '1.25em', marginBottom: '0.5em', lineHeight: 1.3 }}>{children}</h4>,
  h5: ({ children }) => <h5 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e8e8e8', marginTop: '1.25em', marginBottom: '0.5em', lineHeight: 1.3 }}>{children}</h5>,
  h6: ({ children }) => <h6 style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#858585', marginTop: '1.25em', marginBottom: '0.5em', lineHeight: 1.3 }}>{children}</h6>,
  a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#4fa3e3', textDecoration: 'none' }} onMouseOver={e => (e.currentTarget.style.textDecoration = 'underline')} onMouseOut={e => (e.currentTarget.style.textDecoration = 'none')}>{children}</a>,
  table: ({ children }) => <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0.75em', fontSize: '0.8125rem' }}>{children}</table>,
  th: ({ children }) => <th style={{ background: '#2d2d2d', color: '#e8e8e8', fontWeight: 600, padding: '0.4rem 0.75rem', border: '1px solid #3c3c3c', textAlign: 'left' }}>{children}</th>,
  td: ({ children }) => <td style={{ padding: '0.4rem 0.75rem', border: '1px solid #3c3c3c', color: '#cccccc' }}>{children}</td>,
  hr: () => <hr style={{ border: 'none', borderTop: '1px solid #3c3c3c', margin: '1em 0' }} />,
  img: ({ src, alt }) => <img src={src} alt={alt} style={{ maxWidth: '100%', borderRadius: 4 }} />,
}

export default function MarkdownEditor({ value, onChange, readOnly = false, isPro, itemType, onUseOptimized }: Props) {
  const [tab, setTab] = useState<'write' | 'preview'>(readOnly ? 'preview' : 'write')
  const [activeTab, setActiveTab] = useState<'original' | 'optimized'>('original')
  const [optimized, setOptimized] = useState<string | null>(null)
  const [optimizing, setOptimizing] = useState(false)
  const { copied, copy } = useCopyToClipboard()

  useEffect(() => {
    setOptimized(null)
    setActiveTab('original')
  }, [value])

  const textareaHeight = useMemo(() => {
    const lines = value ? value.split('\n').length : 1
    const estimated = lines * 22 + 24
    return Math.min(Math.max(estimated, MIN_HEIGHT), MAX_HEIGHT)
  }, [value])

  async function handleOptimize() {
    if (!value) return
    setOptimizing(true)
    const result = await optimizePrompt({ content: value })
    setOptimizing(false)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    setOptimized(result.data.optimized)
    setActiveTab('optimized')
  }

  const showOptimizeControls = readOnly && itemType === 'prompt'
  const displayValue = activeTab === 'optimized' && optimized ? optimized : value

  return (
    <div className="rounded-lg border border-[#3c3c3c] overflow-hidden">
      <EditorToolbar
        leftSlot={
          <>
            {!readOnly && (
              <>
                <EditorTabButton active={tab === 'write'} onClick={() => setTab('write')}>Write</EditorTabButton>
                <EditorTabButton active={tab === 'preview'} onClick={() => setTab('preview')}>Preview</EditorTabButton>
              </>
            )}
            {readOnly && optimized ? (
              <>
                <EditorTabButton active={activeTab === 'original'} onClick={() => setActiveTab('original')}>Original</EditorTabButton>
                <EditorTabButton active={activeTab === 'optimized'} onClick={() => setActiveTab('optimized')}>Optimized</EditorTabButton>
              </>
            ) : readOnly ? (
              <span className="text-[11px] text-[#858585]">Preview</span>
            ) : null}
          </>
        }
        rightSlot={
          <>
            {showOptimizeControls && (
              <ProAiButton
                isPro={isPro ?? false}
                loading={optimizing}
                onClick={handleOptimize}
                label="Optimize"
                loadingLabel="Optimizing…"
                title="Optimize this prompt with AI"
              />
            )}
            {activeTab === 'optimized' && optimized && onUseOptimized && (
              <button
                type="button"
                onClick={() => onUseOptimized(optimized)}
                className="flex items-center gap-1 text-[11px] text-[#858585] hover:text-[#cccccc] transition-colors"
                title="Use the optimized prompt"
              >
                Use this
              </button>
            )}
            <button
              type="button"
              onClick={() => copy(activeTab === 'optimized' && optimized ? optimized : value)}
              className="flex items-center gap-1 text-[11px] text-[#858585] hover:text-[#cccccc] transition-colors"
              title="Copy to clipboard"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </>
        }
      />

      {/* Write tab */}
      {!readOnly && tab === 'write' && (
        <textarea
          value={value}
          onChange={e => onChange?.(e.target.value)}
          placeholder="Write markdown…"
          style={{ height: textareaHeight, minHeight: MIN_HEIGHT, maxHeight: MAX_HEIGHT }}
          className="w-full resize-none bg-[#1e1e1e] px-4 py-3 text-sm text-[#cccccc] placeholder-[#555] outline-none font-mono leading-relaxed overflow-y-auto"
        />
      )}

      {/* Preview / Original / Optimized tab */}
      {(readOnly || tab === 'preview') && (
        <div
          style={{ minHeight: MIN_HEIGHT, maxHeight: MAX_HEIGHT }}
          className="overflow-y-auto bg-[#1e1e1e] px-4 py-3"
        >
          {displayValue ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>
              {displayValue}
            </ReactMarkdown>
          ) : (
            <p className="text-sm text-[#555] italic">Nothing to preview.</p>
          )}
        </div>
      )}
    </div>
  )
}

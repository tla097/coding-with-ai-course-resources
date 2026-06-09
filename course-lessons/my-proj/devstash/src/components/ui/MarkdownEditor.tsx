'use client'

import { useState, useMemo, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Copy, Check, Sparkles, Loader2, Crown } from 'lucide-react'
import { toast } from 'sonner'
import type { Components } from 'react-markdown'
import { optimizePrompt } from '@/actions/ai'

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

// Inline styles for markdown elements — bypasses Tailwind CSS processing entirely
const MD_COMPONENTS: Components = {
  h1: ({ children }) => <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#e8e8e8', marginTop: '1.25em', marginBottom: '0.5em', lineHeight: 1.3 }}>{children}</h1>,
  h2: ({ children }) => <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#e8e8e8', marginTop: '1.25em', marginBottom: '0.5em', lineHeight: 1.3 }}>{children}</h2>,
  h3: ({ children }) => <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#e8e8e8', marginTop: '1.25em', marginBottom: '0.5em', lineHeight: 1.3 }}>{children}</h3>,
  h4: ({ children }) => <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#e8e8e8', marginTop: '1.25em', marginBottom: '0.5em', lineHeight: 1.3 }}>{children}</h4>,
  h5: ({ children }) => <h5 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e8e8e8', marginTop: '1.25em', marginBottom: '0.5em', lineHeight: 1.3 }}>{children}</h5>,
  h6: ({ children }) => <h6 style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#858585', marginTop: '1.25em', marginBottom: '0.5em', lineHeight: 1.3 }}>{children}</h6>,
  p: ({ children }) => <p style={{ marginBottom: '0.75em', fontSize: '0.875rem', color: '#cccccc', lineHeight: 1.6 }}>{children}</p>,
  a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#4fa3e3', textDecoration: 'none' }} onMouseOver={e => (e.currentTarget.style.textDecoration = 'underline')} onMouseOut={e => (e.currentTarget.style.textDecoration = 'none')}>{children}</a>,
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
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setOptimized(null)
    setActiveTab('original')
  }, [value])

  const textareaHeight = useMemo(() => {
    const lines = value ? value.split('\n').length : 1
    const estimated = lines * 22 + 24
    return Math.min(Math.max(estimated, MIN_HEIGHT), MAX_HEIGHT)
  }, [value])

  function handleCopy() {
    const text = activeTab === 'optimized' && optimized ? optimized : value
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    })
  }

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
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#2d2d2d] border-b border-[#3c3c3c]">
        <div className="flex items-center gap-1.5">
          {!readOnly && (
            <>
              <button
                type="button"
                onClick={() => setTab('write')}
                className={`text-[11px] px-2 py-0.5 rounded transition-colors ${
                  tab === 'write'
                    ? 'bg-[#3c3c3c] text-[#cccccc]'
                    : 'text-[#858585] hover:text-[#cccccc]'
                }`}
              >
                Write
              </button>
              <button
                type="button"
                onClick={() => setTab('preview')}
                className={`text-[11px] px-2 py-0.5 rounded transition-colors ${
                  tab === 'preview'
                    ? 'bg-[#3c3c3c] text-[#cccccc]'
                    : 'text-[#858585] hover:text-[#cccccc]'
                }`}
              >
                Preview
              </button>
            </>
          )}
          {readOnly && optimized ? (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('original')}
                className={`text-[11px] px-2 py-0.5 rounded transition-colors ${
                  activeTab === 'original'
                    ? 'bg-[#3c3c3c] text-[#cccccc]'
                    : 'text-[#858585] hover:text-[#cccccc]'
                }`}
              >
                Original
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('optimized')}
                className={`text-[11px] px-2 py-0.5 rounded transition-colors ${
                  activeTab === 'optimized'
                    ? 'bg-[#3c3c3c] text-[#cccccc]'
                    : 'text-[#858585] hover:text-[#cccccc]'
                }`}
              >
                Optimized
              </button>
            </>
          ) : readOnly ? (
            <span className="text-[11px] text-[#858585]">Preview</span>
          ) : null}
        </div>
        <div className="flex items-center gap-2.5">
          {showOptimizeControls && (
            isPro ? (
              <button
                type="button"
                onClick={handleOptimize}
                disabled={optimizing}
                className="flex items-center gap-1 text-[11px] text-[#858585] hover:text-[#cccccc] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Optimize this prompt with AI"
              >
                {optimizing
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Sparkles className="h-3.5 w-3.5" />
                }
                {optimizing ? 'Optimizing…' : 'Optimize'}
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="flex items-center gap-1 text-[11px] text-[#858585] opacity-50 cursor-not-allowed"
                title="AI features require Pro subscription"
              >
                <Crown className="h-3.5 w-3.5" />
                Optimize
              </button>
            )
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
            onClick={handleCopy}
            className="flex items-center gap-1 text-[11px] text-[#858585] hover:text-[#cccccc] transition-colors"
            title="Copy to clipboard"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

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

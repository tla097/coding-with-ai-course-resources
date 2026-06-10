import type { Components } from 'react-markdown'

export const BASE_MD_COMPONENTS: Components = {
  p: ({ children }) => <p style={{ marginBottom: '0.75em', fontSize: '0.875rem', color: '#cccccc', lineHeight: 1.6 }}>{children}</p>,
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

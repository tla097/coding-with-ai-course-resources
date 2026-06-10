import { Code2, Sparkles, Search, Terminal, FileText, Monitor } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const features = [
  {
    icon: Code2,
    title: 'Code Snippets',
    desc: 'Store reusable code with syntax highlighting. Instantly copy to clipboard. Supports all languages.',
    color: '#3b82f6',
  },
  {
    icon: Sparkles,
    title: 'AI Prompts',
    desc: 'Save and organize your best prompts. AI-enhanced suggestions to optimize and improve them.',
    color: '#f59e0b',
  },
  {
    icon: Search,
    title: 'Instant Search',
    desc: 'Full-text search across all items, tags, and types. Find anything in milliseconds with Ctrl+K.',
    color: '#a855f7',
  },
  {
    icon: Terminal,
    title: 'Commands',
    desc: 'Never forget a CLI command again. Store shell scripts, Docker commands, and one-liners.',
    color: '#06b6d4',
  },
  {
    icon: FileText,
    title: 'Files & Docs',
    desc: 'Upload context files, PDFs, and documents. Keep project references organized and accessible.',
    color: '#64748b',
    pro: true,
  },
  {
    icon: Monitor,
    title: 'Collections',
    desc: 'Group items into projects or topics. One item can belong to multiple collections.',
    color: '#6366f1',
  },
]

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything a developer needs</h2>
          <p className="text-muted-foreground text-lg">Seven item types, one unified hub. Find anything in seconds.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc, color, pro }) => (
            <div
              key={title}
              className="rounded-xl border border-border bg-card p-6 hover:border-border/80 transition-colors"
              style={{ '--accent-color': color } as Record<string, string>}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                style={{ background: color + '22', color }}
              >
                <Icon size={20} />
              </div>
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                {title}
                {pro && (
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">Pro</Badge>
                )}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

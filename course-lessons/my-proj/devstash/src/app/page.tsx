import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Code2, Sparkles, Search, Terminal, FileText, Monitor } from 'lucide-react'
import Navbar from '@/components/marketing/Navbar'
import HeroVisual from '@/components/marketing/HeroVisual'
import PricingSection from '@/components/marketing/PricingSection'

export default async function HomePage() {
  const session = await auth()
  if (session) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* ── Hero Text ────────────────────────────────────────────── */}
      <section className="pt-32 pb-16 text-center">
        <div className="max-w-6xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-4 py-1.5 text-sm text-muted-foreground mb-6">
            Developer Knowledge Hub
          </div>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
            Stop Losing Your<br />
            <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
              Developer Knowledge
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            Your snippets live in VS Code. Prompts scattered in chat history. Commands buried in terminal.<br className="hidden md:block" />
            Links lost in browser tabs. DevStash brings it all together in one fast, searchable hub.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className={cn(buttonVariants({ size: 'lg' }))}>
              Get Started Free
            </Link>
            <a href="#features" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}>
              See Features
            </a>
          </div>
        </div>
      </section>

      {/* ── Hero Visual ──────────────────────────────────────────── */}
      <section className="py-12">
        <HeroVisual />
      </section>

      {/* ── Features Grid ────────────────────────────────────────── */}
      <section id="features" className="py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything a developer needs</h2>
            <p className="text-muted-foreground text-lg">Seven item types, one unified hub. Find anything in seconds.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
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
            ].map(({ icon: Icon, title, desc, color, pro }) => (
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

      {/* ── AI Section ───────────────────────────────────────────── */}
      <section className="py-24 border-t border-border">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm text-amber-400 mb-6">
                ✨ Pro Feature
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">AI-powered knowledge management</h2>
              <p className="text-muted-foreground text-lg mb-8">
                Let AI do the heavy lifting. Auto-tag, explain, and optimize your developer knowledge.
              </p>
              <ul className="space-y-5">
                {[
                  {
                    title: 'Auto-tag suggestions',
                    desc: 'AI analyzes content and suggests relevant tags automatically',
                  },
                  {
                    title: 'AI Summary',
                    desc: "Get a short summary of any item's content at a glance",
                  },
                  {
                    title: 'Explain This Code',
                    desc: 'Plain-English explanations for snippets and commands',
                  },
                  {
                    title: 'Prompt Optimizer',
                    desc: 'Rewrite and improve your AI prompts for better results',
                  },
                ].map(item => (
                  <li key={item.title} className="flex items-start gap-3">
                    <span className="mt-0.5 text-green-500 text-lg leading-none">✓</span>
                    <div>
                      <div className="font-medium">{item.title}</div>
                      <div className="text-sm text-muted-foreground">{item.desc}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right — code editor mockup */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Titlebar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-3 text-xs text-muted-foreground font-mono">useDebounce.ts</span>
              </div>
              {/* Code */}
              <pre className="font-mono text-xs leading-relaxed p-5 overflow-x-auto text-foreground">
                <span className="text-blue-400">import</span>
                <span className="text-foreground"> {'{ '}</span>
                <span className="text-cyan-400">useState</span>
                <span className="text-foreground">, </span>
                <span className="text-cyan-400">useEffect</span>
                <span className="text-foreground"> {'}'} </span>
                <span className="text-blue-400">from</span>
                <span className="text-green-400"> &apos;react&apos;</span>
                {'\n\n'}
                <span className="text-blue-400">export function</span>
                <span className="text-yellow-400"> useDebounce</span>
                <span className="text-foreground">{'<'}</span>
                <span className="text-cyan-300">T</span>
                <span className="text-foreground">{'>'}</span>
                <span className="text-foreground">{'('}</span>
                {'\n'}
                <span className="text-foreground">{'  '}</span>
                <span className="text-orange-300">value</span>
                <span className="text-foreground">: </span>
                <span className="text-cyan-300">T</span>
                <span className="text-foreground">,</span>
                {'\n'}
                <span className="text-foreground">{'  '}</span>
                <span className="text-orange-300">delay</span>
                <span className="text-foreground">: </span>
                <span className="text-cyan-300">number</span>
                {'\n'}
                <span className="text-foreground">{'): '}</span>
                <span className="text-cyan-300">T</span>
                <span className="text-foreground">{' {'}</span>
                {'\n'}
                <span className="text-foreground">{'  '}</span>
                <span className="text-blue-400">const</span>
                <span className="text-foreground"> [</span>
                <span className="text-orange-300">debounced</span>
                <span className="text-foreground">, </span>
                <span className="text-orange-300">setDebounced</span>
                <span className="text-foreground">] =</span>
                {'\n'}
                <span className="text-foreground">{'    '}</span>
                <span className="text-yellow-400">useState</span>
                <span className="text-foreground">{'<'}</span>
                <span className="text-cyan-300">T</span>
                <span className="text-foreground">{'>'}</span>
                <span className="text-foreground">{'('}</span>
                <span className="text-orange-300">value</span>
                <span className="text-foreground">{')'}</span>
                {'\n\n'}
                <span className="text-foreground">{'  '}</span>
                <span className="text-yellow-400">useEffect</span>
                <span className="text-foreground">{'(() => {'}</span>
                {'\n'}
                <span className="text-foreground">{'    '}</span>
                <span className="text-blue-400">const</span>
                <span className="text-foreground"> </span>
                <span className="text-orange-300">timer</span>
                <span className="text-foreground"> = </span>
                <span className="text-yellow-400">setTimeout</span>
                <span className="text-foreground">{'(() =>'}</span>
                {'\n'}
                <span className="text-foreground">{'      '}</span>
                <span className="text-yellow-400">setDebounced</span>
                <span className="text-foreground">{'('}</span>
                <span className="text-orange-300">value</span>
                <span className="text-foreground">{')'}</span>
                <span className="text-foreground">, </span>
                <span className="text-orange-300">delay</span>
                <span className="text-foreground">{')'}</span>
                {'\n'}
                <span className="text-foreground">{'    '}</span>
                <span className="text-blue-400">return</span>
                <span className="text-foreground"> {'() =>'} </span>
                <span className="text-yellow-400">clearTimeout</span>
                <span className="text-foreground">{'('}</span>
                <span className="text-orange-300">timer</span>
                <span className="text-foreground">{')'}</span>
                {'\n'}
                <span className="text-foreground">{'  '}</span>
                <span className="text-foreground">{'}, ['}</span>
                <span className="text-orange-300">value</span>
                <span className="text-foreground">, </span>
                <span className="text-orange-300">delay</span>
                <span className="text-foreground">{'])'}</span>
                {'\n\n'}
                <span className="text-foreground">{'  '}</span>
                <span className="text-blue-400">return</span>
                <span className="text-foreground"> </span>
                <span className="text-orange-300">debounced</span>
                {'\n'}
                <span className="text-foreground">{'}'}</span>
              </pre>
              {/* AI tags strip */}
              <div className="border-t border-border px-5 py-3 bg-muted/20 flex items-center gap-3 flex-wrap">
                <span className="text-xs text-amber-400">✨ AI Generated Tags</span>
                {['react', 'hooks', 'typescript', 'debounce', 'performance'].map(tag => (
                  <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────── */}
      <PricingSection />

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-purple-500/5 pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to organize your knowledge?</h2>
          <p className="text-muted-foreground text-lg mb-10">
            Join developers who&apos;ve stopped losing their best work to scattered tools.
          </p>
          <Link href="/register" className={cn(buttonVariants({ size: 'lg' }))}>
            Get Started Free →
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-4 py-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <a href="#" className="flex items-center gap-2 font-bold text-lg mb-3">
              <span>⚡</span><span>DevStash</span>
            </a>
            <p className="text-sm text-muted-foreground">
              The developer knowledge hub for snippets, prompts, commands, and more.
            </p>
          </div>
          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Changelog</a></li>
            </ul>
          </div>
          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
            </ul>
          </div>
          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border">
          <div className="max-w-6xl mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} DevStash. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

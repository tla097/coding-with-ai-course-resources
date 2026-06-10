import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import HeroVisual from '@/components/marketing/HeroVisual'

export default function HeroSection() {
  return (
    <>
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

      <section className="py-12">
        <HeroVisual />
      </section>
    </>
  )
}

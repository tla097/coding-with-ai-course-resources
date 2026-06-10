import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function CtaSection() {
  return (
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
  )
}

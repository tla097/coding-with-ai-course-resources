'use client'

import { useState } from 'react'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export default function PricingSection() {
  const [yearly, setYearly] = useState(false)

  return (
    <section id="pricing" className="py-24">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, honest pricing</h2>
          <p className="text-muted-foreground text-lg mb-8">Start free. Upgrade when you need more.</p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-4">
            <span className={`text-sm font-medium transition-colors ${!yearly ? 'text-foreground' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <button
              role="switch"
              aria-checked={yearly}
              aria-label="Toggle between monthly and yearly billing"
              onClick={() => setYearly(!yearly)}
              className={`relative w-11 h-6 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                yearly ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-background shadow transition-transform ${
                  yearly ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-sm font-medium transition-colors flex items-center gap-2 ${yearly ? 'text-foreground' : 'text-muted-foreground'}`}>
              Yearly
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">Save 25%</Badge>
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Free card */}
          <div className="rounded-2xl border border-border bg-card p-8 flex flex-col">
            <div className="mb-6">
              <div className="text-lg font-semibold mb-4">Free</div>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground mb-1">/ forever</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {[
                { text: '50 items',                                    check: true },
                { text: '3 collections',                               check: true },
                { text: 'Snippets, prompts, commands, notes, links',   check: true },
                { text: 'Full-text search',                            check: true },
                { text: 'File & image uploads',                        check: false },
                { text: 'AI features',                                 check: false },
                { text: 'Export data',                                 check: false },
              ].map(item => (
                <li key={item.text} className="flex items-start gap-3 text-sm">
                  <span className={`mt-0.5 text-base leading-none ${item.check ? 'text-green-500' : 'text-muted-foreground/50'}`}>
                    {item.check ? '✓' : '✗'}
                  </span>
                  <span className={item.check ? 'text-foreground' : 'text-muted-foreground'}>{item.text}</span>
                </li>
              ))}
            </ul>

            <Link href="/register" className={cn(buttonVariants({ variant: 'outline' }), 'w-full justify-center')}>
              Get Started Free
            </Link>
          </div>

          {/* Pro card */}
          <div className="rounded-2xl border-2 border-primary bg-card p-8 flex flex-col relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground px-4 py-1">Most Popular</Badge>
            </div>

            <div className="mb-6">
              <div className="text-lg font-semibold mb-4">Pro</div>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-bold">{yearly ? '$6' : '$8'}</span>
                <span className="text-muted-foreground mb-1">/ month</span>
              </div>
              {yearly && (
                <p className="text-sm text-muted-foreground mt-1">Billed $72/year</p>
              )}
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {[
                'Unlimited items',
                'Unlimited collections',
                'All item types including files & images',
                'AI auto-tagging & summaries',
                'AI code explanation',
                'Prompt optimizer',
                'Export (JSON / ZIP)',
              ].map(text => (
                <li key={text} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 text-base leading-none text-green-500">✓</span>
                  <span className="text-foreground">{text}</span>
                </li>
              ))}
            </ul>

            <Link href="/register" className={cn(buttonVariants(), 'w-full justify-center')}>
              Start Pro Trial
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Crown } from 'lucide-react'

const FREE_FEATURES = [
  { text: '50 items', check: true },
  { text: '3 collections', check: true },
  { text: 'Snippets, prompts, commands, notes, links', check: true },
  { text: 'Full-text search', check: true },
  { text: 'File & image uploads', check: false },
  { text: 'AI features', check: false },
  { text: 'Export data', check: false },
]

const PRO_FEATURES = [
  'Unlimited items',
  'Unlimited collections',
  'All item types including files & images',
  'AI auto-tagging & summaries',
  'AI code explanation',
  'Prompt optimizer',
  'Export (JSON / ZIP)',
]

export default function UpgradePage() {
  const [yearly, setYearly] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleUpgrade(priceId: string) {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error('Failed to start checkout')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const priceId = yearly
    ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY!
    : process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY!

  return (
    <div className="max-w-3xl mx-auto py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-3">Upgrade to Pro</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Unlock unlimited items, file uploads, AI features, and exports.
        </p>

        <div className="inline-flex items-center gap-4">
          <span className={`text-sm font-medium transition-colors ${!yearly ? 'text-foreground' : 'text-muted-foreground'}`}>
            Monthly
          </span>
          <button
            role="switch"
            aria-checked={yearly}
            aria-label="Toggle between monthly and yearly billing"
            onClick={() => setYearly(!yearly)}
            className={`relative w-11 h-6 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${yearly ? 'bg-primary' : 'bg-muted'}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-background shadow transition-transform ${yearly ? 'translate-x-5' : 'translate-x-0'}`}
            />
          </button>
          <span className={`text-sm font-medium transition-colors flex items-center gap-2 ${yearly ? 'text-foreground' : 'text-muted-foreground'}`}>
            Yearly
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">Save 25%</Badge>
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Free card */}
        <div className="rounded-2xl border border-border bg-card p-8 flex flex-col">
          <div className="mb-6">
            <div className="text-lg font-semibold mb-4">Free</div>
            <div className="flex items-end gap-1">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-muted-foreground mb-1">/ forever</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Your current plan</p>
          </div>

          <ul className="space-y-3 mb-8 flex-1">
            {FREE_FEATURES.map(item => (
              <li key={item.text} className="flex items-start gap-3 text-sm">
                <span className={`mt-0.5 text-base leading-none ${item.check ? 'text-green-500' : 'text-muted-foreground/50'}`}>
                  {item.check ? '✓' : '✗'}
                </span>
                <span className={item.check ? 'text-foreground' : 'text-muted-foreground'}>{item.text}</span>
              </li>
            ))}
          </ul>

          <Button variant="outline" className="w-full" disabled>
            Current Plan
          </Button>
        </div>

        {/* Pro card */}
        <div className="rounded-2xl border-2 border-primary bg-card p-8 flex flex-col relative">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
            <Badge className="bg-primary text-primary-foreground px-4 py-1">Most Popular</Badge>
          </div>

          <div className="mb-6">
            <div className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" />
              Pro
            </div>
            <div className="flex items-end gap-1">
              <span className="text-4xl font-bold">{yearly ? '$6' : '$8'}</span>
              <span className="text-muted-foreground mb-1">/ month</span>
            </div>
            {yearly && (
              <p className="text-sm text-muted-foreground mt-1">Billed $72/year</p>
            )}
          </div>

          <ul className="space-y-3 mb-8 flex-1">
            {PRO_FEATURES.map(text => (
              <li key={text} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 text-base leading-none text-green-500">✓</span>
                <span className="text-foreground">{text}</span>
              </li>
            ))}
          </ul>

          <Button
            className="w-full"
            onClick={() => handleUpgrade(priceId)}
            disabled={loading}
          >
            {loading ? 'Loading...' : yearly ? 'Upgrade — $72/year' : 'Upgrade — $8/month'}
          </Button>
        </div>
      </div>
    </div>
  )
}

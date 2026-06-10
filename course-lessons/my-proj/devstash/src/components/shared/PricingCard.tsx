'use client'

import { Crown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { FREE_FEATURES, PRO_FEATURES } from '@/lib/constants'

interface Props {
  plan: 'free' | 'pro'
  yearly: boolean
  cta: React.ReactNode
  subtitle?: string
}

export function PricingCard({ plan, yearly, cta, subtitle }: Props) {
  if (plan === 'free') {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 flex flex-col">
        <div className="mb-6">
          <div className="text-lg font-semibold mb-4">Free</div>
          <div className="flex items-end gap-1">
            <span className="text-4xl font-bold">$0</span>
            <span className="text-muted-foreground mb-1">/ forever</span>
          </div>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
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

        {cta}
      </div>
    )
  }

  return (
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
        {yearly && <p className="text-sm text-muted-foreground mt-1">Billed $72/year</p>}
      </div>

      <ul className="space-y-3 mb-8 flex-1">
        {PRO_FEATURES.map(text => (
          <li key={text} className="flex items-start gap-3 text-sm">
            <span className="mt-0.5 text-base leading-none text-green-500">✓</span>
            <span className="text-foreground">{text}</span>
          </li>
        ))}
      </ul>

      {cta}
    </div>
  )
}

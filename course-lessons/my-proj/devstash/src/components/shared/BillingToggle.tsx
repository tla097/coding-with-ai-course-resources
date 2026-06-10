'use client'

import { Badge } from '@/components/ui/badge'

interface Props {
  yearly: boolean
  onChange: (yearly: boolean) => void
}

export function BillingToggle({ yearly, onChange }: Props) {
  return (
    <div className="inline-flex items-center gap-4">
      <span className={`text-sm font-medium transition-colors ${!yearly ? 'text-foreground' : 'text-muted-foreground'}`}>
        Monthly
      </span>
      <button
        role="switch"
        aria-checked={yearly}
        aria-label="Toggle between monthly and yearly billing"
        onClick={() => onChange(!yearly)}
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
  )
}

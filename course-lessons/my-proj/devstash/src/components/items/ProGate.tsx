'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Crown, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface ProGateProps {
  type: string
  color: string
}

export default function ProGate({ type, color }: ProGateProps) {
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

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex items-center gap-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-md"
          style={{ backgroundColor: `${color}20` }}
        >
          <Lock className="h-5 w-5" style={{ color }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight capitalize flex items-center gap-2">
            {type}
            <Badge variant="secondary" className="text-xs font-medium">
              <Crown className="w-3 h-3 mr-1" />
              Pro
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground">Available on the Pro plan</p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 gap-6 text-center">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: `${color}15` }}
        >
          <Crown className="h-8 w-8" style={{ color }} />
        </div>
        <div className="space-y-2 max-w-sm">
          <h2 className="text-lg font-semibold">Upgrade to unlock {type}</h2>
          <p className="text-sm text-muted-foreground">
            File and image storage is a Pro feature. Upgrade to upload, organise, and access your files directly in DevStash.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button
            size="sm"
            onClick={() => handleUpgrade(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY!)}
            disabled={loading}
          >
            Upgrade Monthly — $8/mo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleUpgrade(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY!)}
            disabled={loading}
          >
            Upgrade Yearly — $72/yr
            <span className="ml-2 text-xs text-emerald-400">Save 25%</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

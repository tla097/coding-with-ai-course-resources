'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Crown, ExternalLink } from 'lucide-react'
import { redirectToCheckout, redirectToBillingPortal } from '@/lib/stripe-client'

interface BillingSectionProps {
  isPro: boolean
  hasStripeCustomer: boolean
}

export default function BillingSection({ isPro, hasStripeCustomer }: BillingSectionProps) {
  const [loading, setLoading] = useState(false)

  async function handleUpgrade(priceId: string) {
    setLoading(true)
    try {
      await redirectToCheckout(priceId)
    } finally {
      setLoading(false)
    }
  }

  async function handleManageBilling() {
    setLoading(true)
    try {
      await redirectToBillingPortal()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Plan & Billing</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your subscription and billing details.
          </p>
        </div>
        <Badge variant={isPro ? 'default' : 'secondary'}>
          {isPro ? (
            <span className="flex items-center gap-1">
              <Crown className="w-3 h-3" /> Pro
            </span>
          ) : (
            'Free'
          )}
        </Badge>
      </div>

      {isPro ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            You have access to all Pro features — unlimited items, file uploads, AI features, and exports.
          </p>
          {hasStripeCustomer && (
            <Button variant="outline" size="sm" onClick={handleManageBilling} disabled={loading}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Manage Subscription
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Free plan: up to 50 items and 3 collections. Upgrade to Pro for unlimited everything, file uploads, AI features, and exports.
          </p>
          <div className="flex flex-wrap gap-3">
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
      )}
    </div>
  )
}

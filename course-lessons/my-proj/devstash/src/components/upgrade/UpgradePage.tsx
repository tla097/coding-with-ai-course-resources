'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { BillingToggle } from '@/components/shared/BillingToggle'
import { PricingCard } from '@/components/shared/PricingCard'
import { redirectToCheckout } from '@/lib/stripe-client'

export default function UpgradePage() {
  const [yearly, setYearly] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleUpgrade(priceId: string) {
    setLoading(true)
    try {
      await redirectToCheckout(priceId)
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
        <BillingToggle yearly={yearly} onChange={setYearly} />
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <PricingCard
          plan="free"
          yearly={yearly}
          subtitle="Your current plan"
          cta={
            <Button variant="outline" className="w-full" disabled>
              Current Plan
            </Button>
          }
        />
        <PricingCard
          plan="pro"
          yearly={yearly}
          cta={
            <Button
              className="w-full"
              onClick={() => handleUpgrade(priceId)}
              disabled={loading}
            >
              {loading ? 'Loading...' : yearly ? 'Upgrade — $72/year' : 'Upgrade — $8/month'}
            </Button>
          }
        />
      </div>
    </div>
  )
}

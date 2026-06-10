'use client'

import { useState } from 'react'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { BillingToggle } from '@/components/shared/BillingToggle'
import { PricingCard } from '@/components/shared/PricingCard'

export default function PricingSection() {
  const [yearly, setYearly] = useState(false)

  return (
    <section id="pricing" className="py-24">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, honest pricing</h2>
          <p className="text-muted-foreground text-lg mb-8">Start free. Upgrade when you need more.</p>
          <BillingToggle yearly={yearly} onChange={setYearly} />
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          <PricingCard
            plan="free"
            yearly={yearly}
            cta={
              <Link href="/register" className={cn(buttonVariants({ variant: 'outline' }), 'w-full justify-center')}>
                Get Started Free
              </Link>
            }
          />
          <PricingCard
            plan="pro"
            yearly={yearly}
            cta={
              <Link href="/register" className={cn(buttonVariants(), 'w-full justify-center')}>
                Start Pro Trial
              </Link>
            }
          />
        </div>
      </div>
    </section>
  )
}

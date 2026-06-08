# Stripe Integration — Phase 2: Webhooks, Feature Gating & UI

## Overview

Build the actual payment flow on top of Phase 1's infrastructure. This phase adds the Stripe webhook handler (the source of truth for subscription status), the checkout and billing portal API routes, and the billing section on the settings page.

**Prerequisite:** Phase 1 must be complete and merged. `session.user.isPro` must be available before starting this phase.

## Scope

**In scope:**
- Stripe webhook handler (`checkout.session.completed`, subscription updated/deleted)
- Checkout session API route
- Billing portal API route
- `BillingSection` settings component (upgrade buttons + manage subscription)
- Settings page update (add billing section, handle `?upgrade=success` toast)
- `.env` variable renames for client-accessible price IDs

**Not in scope:**
- File/image upload Pro gating (separate feature — R2 integration)
- AI feature Pro gating (separate feature — AI integration)
- Export Pro gating (separate feature — export)

---

## Requirements

- Stripe webhook signature must be verified before processing — reject unsigned requests with 400
- Webhook handler must be idempotent — processing the same event twice must not corrupt data
- The webhook path must NOT be behind the auth proxy (Stripe sends raw POST, no session cookie)
- Checkout creates a Stripe Customer on first checkout, reuses it on subsequent checkouts
- After successful checkout, redirect to `/settings?upgrade=success` and show a success toast
- Billing portal is only available to users who have a `stripeCustomerId`
- Price IDs sent from the client must be validated server-side against the env vars — reject unknown price IDs

---

## Environment Variable Changes

**Rename** these two existing keys so they are accessible client-side (needed by `BillingSection`):

```
# Before (server-only, never accessible in browser)
STRIPE_PRICE_ID_MONTHLY=price_xxx
STRIPE_PRICE_ID_YEARLY=price_xxx

# After (accessible in browser via process.env)
NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY=price_xxx
NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY=price_xxx
```

**Add** the webhook secret (get from Stripe Dashboard → Webhooks):

```
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Already present — no change:**

```
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

The secret key and webhook secret must never be `NEXT_PUBLIC_`.

---

## Files to Create

### `src/app/api/webhooks/stripe/route.ts`

The authoritative source of `isPro` updates. Handles three events:

- `checkout.session.completed` — subscription created via checkout → set `isPro = true`
- `customer.subscription.updated` — plan changed or payment failed → sync `isPro` with subscription status
- `customer.subscription.deleted` — cancellation finalised → set `isPro = false`

```typescript
import { NextRequest } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return Response.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    )
  } catch {
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break

        const userId = session.metadata?.userId
        if (!userId) break

        await prisma.user.update({
          where: { id: userId },
          data: {
            isPro: true,
            stripeSubscriptionId: session.subscription as string,
          },
        })
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customer = await stripe.customers.retrieve(subscription.customer as string)
        if (customer.deleted) break

        const userId = (customer as Stripe.Customer).metadata?.userId
        if (!userId) break

        const isActive =
          subscription.status === 'active' || subscription.status === 'trialing'

        await prisma.user.update({
          where: { id: userId },
          data: {
            isPro: isActive,
            stripeSubscriptionId: subscription.id,
          },
        })
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customer = await stripe.customers.retrieve(subscription.customer as string)
        if (customer.deleted) break

        const userId = (customer as Stripe.Customer).metadata?.userId
        if (!userId) break

        await prisma.user.update({
          where: { id: userId },
          data: {
            isPro: false,
            stripeSubscriptionId: null,
          },
        })
        break
      }
    }
  } catch {
    return Response.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return Response.json({ received: true })
}
```

**Verify the webhook path is not middleware-protected:** `src/proxy.ts` currently protects `/dashboard/:path*`, `/profile`, `/settings`, `/favorites`. The path `/api/webhooks/stripe` does not match any of those — no change needed to `proxy.ts`.

---

### `src/app/api/stripe/checkout/route.ts`

Creates a Stripe Checkout session. Creates a Stripe Customer on the user's first checkout and stores `stripeCustomerId` for reuse.

```typescript
import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { priceId } = await req.json()

  // Validate price ID server-side — never trust the client
  const validPriceIds = [
    process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY,
    process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY,
  ]
  if (!priceId || !validPriceIds.includes(priceId)) {
    return Response.json({ error: 'Invalid price' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, stripeCustomerId: true },
  })

  if (!user?.email) {
    return Response.json({ error: 'User not found' }, { status: 404 })
  }

  let customerId = user.stripeCustomerId

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: session.user.id },
    })
    customerId = customer.id
    await prisma.user.update({
      where: { id: session.user.id },
      data: { stripeCustomerId: customerId },
    })
  }

  const origin = req.headers.get('origin') ?? process.env.NEXTAUTH_URL ?? ''

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/settings?upgrade=success`,
    cancel_url: `${origin}/settings?upgrade=cancelled`,
    metadata: { userId: session.user.id },
  })

  return Response.json({ url: checkoutSession.url })
}
```

---

### `src/app/api/stripe/portal/route.ts`

Opens the Stripe Customer Portal for subscription management (cancel, update payment method).

```typescript
import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  })

  if (!user?.stripeCustomerId) {
    return Response.json({ error: 'No billing account found' }, { status: 404 })
  }

  const origin = req.headers.get('origin') ?? process.env.NEXTAUTH_URL ?? ''

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${origin}/settings`,
  })

  return Response.json({ url: portalSession.url })
}
```

---

### `src/components/settings/BillingSection.tsx`

Client component. Shows:
- Free users: current plan badge, item/collection limits summary, two upgrade buttons (monthly/yearly)
- Pro users: Pro badge, feature summary, "Manage Subscription" button (if `stripeCustomerId` exists)

```typescript
'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Crown, ExternalLink } from 'lucide-react'

interface BillingSectionProps {
  isPro: boolean
  hasStripeCustomer: boolean
}

export default function BillingSection({ isPro, hasStripeCustomer }: BillingSectionProps) {
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

  async function handleManageBilling() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error('Failed to open billing portal')
      }
    } catch {
      toast.error('Something went wrong')
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
```

---

## Files to Modify

### `src/app/(dashboard)/settings/page.tsx`

Three changes:
1. Accept `searchParams` to detect `?upgrade=success`
2. Fetch `isPro` and `stripeCustomerId` from DB
3. Render `BillingSection` above the Danger Zone, and a client component that fires a toast on `upgrade=success`

```typescript
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import BillingSection from '@/components/settings/BillingSection'
import UpgradeToast from '@/components/settings/UpgradeToast'
// ... other existing imports

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ upgrade?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/sign-in')

  const [profile, billing] = await Promise.all([
    getProfileData(session.user.id),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isPro: true, stripeCustomerId: true },
    }),
  ])

  const params = await searchParams

  return (
    <div className="space-y-6 max-w-2xl">
      {/* ... existing heading ... */}

      {params.upgrade === 'success' && <UpgradeToast />}

      <EditorPreferencesForm />

      <BillingSection
        isPro={billing?.isPro ?? false}
        hasStripeCustomer={!!billing?.stripeCustomerId}
      />

      {profile.hasPassword && <ChangePasswordForm />}

      {/* ... existing Danger Zone ... */}
    </div>
  )
}
```

---

### `src/components/settings/UpgradeToast.tsx` (new small client component)

A mount-effect component that fires a toast once on render — keeps the settings page a server component.

```typescript
'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'

export default function UpgradeToast() {
  useEffect(() => {
    toast.success('Welcome to Pro! All features are now unlocked.')
  }, [])

  return null
}
```

---

## Stripe Dashboard Setup

### 1. Create Products & Prices (test mode)

1. Dashboard → **Products** → **Add product**: `DevStash Pro`
2. Add recurring price: `$8.00 / month` → copy the `price_xxx` ID → `NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY`
3. Add recurring price: `$72.00 / year` → copy the `price_xxx` ID → `NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY`

### 2. Configure Webhook

1. Dashboard → **Developers** → **Webhooks** → **Add endpoint**
2. URL: `https://your-domain.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy **Signing secret** → `STRIPE_WEBHOOK_SECRET`

### 3. Configure Customer Portal

1. Dashboard → **Settings** → **Billing** → **Customer portal**
2. Enable: Cancel subscriptions, Update payment method
3. Save

---

## Testing

### Stripe CLI Setup (required for webhook testing)

```bash
# Install Stripe CLI (Windows)
scoop install stripe

# Log in
stripe login

# Forward webhooks to local dev server
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

The CLI prints a webhook signing secret (`whsec_...`) — use this as `STRIPE_WEBHOOK_SECRET` for local development (different from the Dashboard secret).

### Webhook Tests

Use `stripe trigger` to fire events without going through checkout:

```bash
# Test subscription activated
stripe trigger checkout.session.completed

# Test subscription cancelled
stripe trigger customer.subscription.deleted

# Test subscription updated (e.g. payment failure → past_due)
stripe trigger customer.subscription.updated
```

**Verify after each trigger:**
- Check the DB: `SELECT "isPro", "stripeSubscriptionId" FROM users WHERE email = '...'`
- Reload `/settings` — plan badge should update
- Stripe CLI terminal shows `200 OK` for the webhook delivery

### Checkout Flow Tests

Use Stripe test cards:

| Card number | Result |
|---|---|
| `4242 4242 4242 4242` | Payment succeeds |
| `4000 0000 0000 0002` | Card declined |
| `4000 0025 0000 3155` | 3D Secure required |

**Steps:**
1. Sign in as free user → go to `/settings`
2. Click **Upgrade Monthly** → redirected to Stripe Checkout
3. Enter test card `4242 4242 4242 4242`, any future expiry, any CVC
4. Complete checkout → redirected to `/settings?upgrade=success`
5. Verify success toast appears
6. Verify plan badge shows **Pro**
7. Verify item/collection creation limits are lifted

### Billing Portal Tests

1. Sign in as Pro user → go to `/settings`
2. Click **Manage Subscription** → Stripe portal opens
3. Cancel subscription from portal
4. Return to DevStash → trigger the webhook manually with `stripe trigger customer.subscription.deleted` (portal cancellation may schedule end-of-period — CLI trigger tests immediate cancellation)
5. Reload `/settings` → plan badge shows **Free**

### Invalid Price ID Test

Send a direct POST to the checkout route with a bogus price ID — must return 400:

```bash
curl -X POST http://localhost:3000/api/stripe/checkout \
  -H "Content-Type: application/json" \
  -d '{"priceId":"price_fake"}' \
  -b "your-session-cookie"
```

### Build & Test

```
npm run build
npm test
```

No new unit tests in Phase 2 — webhook and checkout routes require real Stripe API calls or Stripe's test helpers (not covered by the Vitest unit test suite). Manual testing via Stripe CLI covers these paths.

---

## Notes

### Why no unit tests in Phase 2

The webhook handler, checkout route, and portal route all make live Stripe API calls that can't be meaningfully faked with Vitest mocks — the `stripe.webhooks.constructEvent()` signature check alone requires a real HMAC verification. Stripe's own test infrastructure (CLI triggers + test mode) is the correct test harness for these paths.

If integration tests are added later, use `stripe-mock` (an official Stripe-maintained HTTP mock server).

### Idempotency note

`checkout.session.completed` and `customer.subscription.updated` can both fire for the same subscription (checkout creates the subscription, which then fires an `updated` event too). The DB update is idempotent — writing the same `isPro = true` twice is safe.

### Pro users set manually in DB

During development, `isPro` is often set directly in the DB without a Stripe customer. `BillingSection` handles this: Pro users without a `stripeCustomerId` see the Pro badge and features summary but not the "Manage Subscription" button (there's no Stripe portal session to create).

### Future Pro gating (not in this phase)

When file uploads (R2), AI features, and export are implemented, add an `isPro` check at the start of each relevant server action or route handler:

```typescript
if (!session.user.isPro) {
  return { success: false as const, error: 'Pro subscription required.' }
}
```

# Stripe Subscription Integration Plan

## Overview

Integrate Stripe subscriptions for DevStash Pro ($8/month, $72/year). The User model already has `isPro`, `stripeCustomerId`, and `stripeSubscriptionId` fields — the schema is ready. The work is connecting the payment flow, enforcing limits, and surfacing plan status in the UI.

---

## Current State

| Area | Status |
|---|---|
| User schema (`isPro`, `stripeCustomerId`, `stripeSubscriptionId`) | ✅ Ready |
| Stripe env vars | ✅ Keys present, webhook secret empty |
| Free tier enforcement (item/collection limits) | ❌ Not implemented |
| Pro gating (file/image types, AI) | ❌ Not implemented |
| Session includes `isPro` | ❌ Only `id` in session |
| Checkout flow | ❌ Does not exist |
| Webhook handler | ❌ Does not exist |
| Settings billing section | ❌ Does not exist |

---

## Files to Create

### 1. `src/lib/stripe.ts` — Stripe Client Singleton

```typescript
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
  typescript: true,
})
```

---

### 2. `src/app/api/stripe/checkout/route.ts` — Create Checkout Session

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

  if (
    priceId !== process.env.STRIPE_PRICE_ID_MONTHLY &&
    priceId !== process.env.STRIPE_PRICE_ID_YEARLY
  ) {
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

### 3. `src/app/api/stripe/portal/route.ts` — Stripe Billing Portal

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

### 4. `src/app/api/webhooks/stripe/route.ts` — Stripe Webhook Handler

This is the core integration point. It updates `isPro` and Stripe IDs when subscriptions change.

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

**Important:** Route Handlers on `/api/webhooks/stripe` must NOT be wrapped by auth middleware. Stripe sends raw POST requests without a session cookie. Verify this in `src/proxy.ts` — the webhook path is not in the protected routes list, so it's already fine.

---

### 5. `src/components/settings/BillingSection.tsx` — Settings Billing UI

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Crown, ExternalLink } from 'lucide-react'

interface BillingSectionProps {
  isPro: boolean
  hasStripeCustomer: boolean
}

export default function BillingSection({ isPro, hasStripeCustomer }: BillingSectionProps) {
  const router = useRouter()
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
            <><Crown className="w-3 h-3 mr-1" /> Pro</>
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
            Free plan: 50 items, 3 collections. Upgrade to Pro for unlimited everything.
          </p>
          <div className="flex gap-3">
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

**Note:** Price IDs used in the client component must be prefixed `NEXT_PUBLIC_` since they are exposed to the browser. The secret key and webhook secret must never be `NEXT_PUBLIC_`.

---

## Files to Modify

### 1. `src/auth.ts` — Add `isPro` to JWT and Session

**Problem:** The session currently only contains `user.id`. After a Stripe webhook sets `isPro = true` in the database, the session won't reflect the change until the JWT is refreshed.

**Solution:** Sync `isPro` from the database on every JWT validation (per the research note — `trigger === "update"` is unreliable for webhook-driven changes).

**Specific change — add to `callbacks`:**

```typescript
callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.sub = user.id
    }

    // Always sync isPro from database to catch webhook updates
    if (token.sub) {
      const dbUser = await prisma.user.findUnique({
        where: { id: token.sub },
        select: { isPro: true },
      })
      token.isPro = dbUser?.isPro ?? false
    }

    return token
  },
  session({ session, token }) {
    if (token.sub && session.user) {
      session.user.id = token.sub
    }
    if (token.isPro !== undefined && session.user) {
      session.user.isPro = token.isPro as boolean
    }
    return session
  },
},
```

This adds one small DB query per session validation (not per request — only on token refresh). After a webhook sets `isPro = true`, a page reload picks up the new status.

---

### 2. `src/types/next-auth.d.ts` — Add `isPro` to Session Types

```typescript
import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      isPro: boolean
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    isPro?: boolean
  }
}
```

---

### 3. `src/actions/items.ts` — Enforce 50-Item Free Tier Limit

Add a count check before creating an item. Import `getItemCount` (already exists in the DB layer):

```typescript
export async function createItem(data: z.input<typeof createItemSchema>) {
  const session = await auth()
  if (!session?.user?.id) return { success: false as const, error: 'Not authenticated.' }

  const parsed = createItemSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false as const, error: z.flattenError(parsed.error).fieldErrors }
  }

  // Enforce free tier item limit
  if (!session.user.isPro) {
    const count = await getItemCount(session.user.id)
    if (count >= FREE_TIER_ITEM_LIMIT) {
      return {
        success: false as const,
        error: `Free plan limit reached (${FREE_TIER_ITEM_LIMIT} items). Upgrade to Pro for unlimited items.`,
        limitReached: 'items' as const,
      }
    }
  }

  // ... rest of existing implementation
}
```

**Add to `src/lib/constants.ts`:**

```typescript
export const FREE_TIER_ITEM_LIMIT = 50
export const FREE_TIER_COLLECTION_LIMIT = 3
```

---

### 4. `src/actions/collections.ts` — Enforce 3-Collection Free Tier Limit

Add a count check before creating a collection. Import `getCollectionCount` (already exists):

```typescript
export async function createCollection(data: CreateCollectionInput) {
  const session = await auth()
  if (!session?.user?.id) return { success: false as const, error: 'Not authenticated.' }

  const parsed = createCollectionSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false as const, error: z.flattenError(parsed.error).fieldErrors }
  }

  // Enforce free tier collection limit
  if (!session.user.isPro) {
    const count = await getCollectionCount(session.user.id)
    if (count >= FREE_TIER_COLLECTION_LIMIT) {
      return {
        success: false as const,
        error: `Free plan limit reached (${FREE_TIER_COLLECTION_LIMIT} collections). Upgrade to Pro for unlimited collections.`,
        limitReached: 'collections' as const,
      }
    }
  }

  // ... rest of existing implementation
}
```

---

### 5. `src/app/(dashboard)/settings/page.tsx` — Add Billing Section

Add `BillingSection` above the Danger Zone. The settings page already fetches session — pass `isPro` and `hasStripeCustomer` as props:

```typescript
import BillingSection from '@/components/settings/BillingSection'

// In the page component, fetch billing data:
const billingData = await prisma.user.findUnique({
  where: { id: session.user.id },
  select: { isPro: true, stripeCustomerId: true },
})

// In JSX, add above Danger Zone:
<BillingSection
  isPro={billingData?.isPro ?? false}
  hasStripeCustomer={!!billingData?.stripeCustomerId}
/>
```

**Also handle the `?upgrade=success` query param** — show a toast when returning from checkout:

```typescript
// In a client wrapper or directly in the page if converted to a client component,
// detect searchParams.upgrade === 'success' and show a toast.
```

Because `/settings` is a server component, the simplest approach is to check `searchParams` server-side and pass a flag to a client component:

```typescript
export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ upgrade?: string }>
}) {
  const params = await searchParams
  // pass params.upgrade to a client component that shows the toast
}
```

---

### 6. `.env` / `.env.example` — Add Missing Stripe Variables

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY=price_...
NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY=price_...
```

**Note:** `STRIPE_PRICE_ID_MONTHLY` and `STRIPE_PRICE_ID_YEARLY` must become `NEXT_PUBLIC_` so the client-side `BillingSection` component can reference them in the upgrade buttons. The secret key and webhook secret must remain server-only (no `NEXT_PUBLIC_` prefix).

---

### 7. `src/proxy.ts` — No Changes Needed

The webhook path `/api/webhooks/stripe` is not in the protected route matcher — Stripe can POST to it without authentication. Verify this stays true.

If a future middleware pattern changes to block all `/api/` routes, add an explicit exclusion:

```typescript
// Ensure /api/webhooks/* is never redirected
```

---

## Stripe Dashboard Setup

### Step 1: Create Products and Prices

1. Go to **Stripe Dashboard → Products → Add Product**
2. Create product: `DevStash Pro`
   - Add price: **$8.00 / month** (recurring, monthly) → copy `price_xxx` → `NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY`
   - Add price: **$72.00 / year** (recurring, annual) → copy `price_xxx` → `NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY`

### Step 2: Configure Webhook

1. Go to **Stripe Dashboard → Developers → Webhooks → Add endpoint**
2. Endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
   - For local development: use Stripe CLI → `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
3. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy **Signing secret** → `STRIPE_WEBHOOK_SECRET`

### Step 3: Configure Customer Portal

1. Go to **Stripe Dashboard → Settings → Billing → Customer Portal**
2. Enable: Cancel subscriptions, Update payment method
3. Configure branding (logo, colors)
4. Save — the portal is now accessible via the billing portal API

### Step 4: Test Mode Keys

- Use test mode keys (`sk_test_`, `pk_test_`) during development
- Switch to live keys (`sk_live_`, `pk_live_`) for production
- Test cards: `4242 4242 4242 4242` (success), `4000 0000 0000 0002` (decline)

---

## Implementation Order

Work in this sequence to keep the app functional at each step:

1. **Install Stripe package**
   ```
   npm install stripe
   ```

2. **Create `src/lib/stripe.ts`** — singleton client

3. **Update `src/types/next-auth.d.ts`** — add `isPro` to session/JWT types

4. **Update `src/auth.ts`** — sync `isPro` in JWT callback

5. **Add constants** to `src/lib/constants.ts` — `FREE_TIER_ITEM_LIMIT`, `FREE_TIER_COLLECTION_LIMIT`

6. **Create webhook handler** — `src/app/api/webhooks/stripe/route.ts`
   - Test with Stripe CLI before proceeding

7. **Create checkout route** — `src/app/api/stripe/checkout/route.ts`

8. **Create portal route** — `src/app/api/stripe/portal/route.ts`

9. **Create `BillingSection` component** — `src/components/settings/BillingSection.tsx`

10. **Update settings page** — add `BillingSection`, handle `?upgrade=success` toast

11. **Enforce item limit** — modify `createItem` server action

12. **Enforce collection limit** — modify `createCollection` server action

13. **Update `.env` variables** — rename price IDs to `NEXT_PUBLIC_`, add webhook secret

14. **Run build and fix any TypeScript errors** — especially `session.user.isPro` usages

---

## Testing Checklist

### Webhook Tests (Stripe CLI)
- [ ] `checkout.session.completed` → `isPro` set to `true` in DB
- [ ] `customer.subscription.updated` (status: `canceled`) → `isPro` set to `false`
- [ ] `customer.subscription.deleted` → `isPro` set to `false`, `stripeSubscriptionId` cleared
- [ ] Invalid webhook signature returns 400
- [ ] Missing `userId` metadata is handled gracefully (no crash)

### Checkout Flow
- [ ] Clicking "Upgrade Monthly" redirects to Stripe Checkout
- [ ] Clicking "Upgrade Yearly" redirects to Stripe Checkout
- [ ] After successful payment, redirect to `/settings?upgrade=success`
- [ ] Success toast appears on settings page after redirect
- [ ] After cancel, redirect to `/settings?upgrade=cancelled`
- [ ] `stripeCustomerId` is created and stored on first checkout
- [ ] Second checkout reuses existing `stripeCustomerId`

### Session Sync
- [ ] After webhook sets `isPro = true`, page reload shows Pro badge in settings
- [ ] After webhook sets `isPro = false`, page reload shows Free badge

### Billing Portal
- [ ] "Manage Subscription" button opens Stripe portal (Pro users only)
- [ ] Cancelling subscription via portal triggers webhook → user becomes Free

### Free Tier Enforcement
- [ ] Creating item #51 as a Free user returns error toast
- [ ] Creating collection #4 as a Free user returns error toast
- [ ] Pro users can create unlimited items and collections
- [ ] Error message mentions upgrading to Pro

### Settings Page
- [ ] Free user sees plan badge "Free" and upgrade buttons
- [ ] Pro user sees plan badge "Pro" and "Manage Subscription" button
- [ ] Pro user without `stripeCustomerId` (manually set in DB) sees no manage button

### Build
- [ ] `npm run build` passes with no TypeScript errors
- [ ] `npm test` passes — update existing action tests to mock `isPro` on session

---

## Notes

### Why Always-Sync `isPro` in JWT

The standard NextAuth v5 pattern is to use `trigger === "update"` in the JWT callback to refresh session data after calling `useSession().update()`. However, Stripe webhooks update `isPro` in the database without any client-initiated session update — the client doesn't know the webhook fired. The always-sync approach reads `isPro` from the database on every token refresh, guaranteeing the session stays current after a webhook. The cost is one extra DB read per token validation (not per request), which is acceptable given the app's scale.

### Pro Gating for File/Image Types

The sidebar already shows "PRO" badges on file and image item types. When implementing file uploads (a separate feature), add an `isPro` check in:
- The `createItem` server action — reject `contentType: FILE` for free users
- The file upload API route — check `session.user.isPro` before generating presigned URLs

### AI Feature Gating

When AI endpoints are implemented (`/api/ai/tags`, `/api/ai/explain`, etc.), add this guard at the start of each handler:

```typescript
const session = await auth()
if (!session?.user?.isPro) {
  return Response.json({ error: 'Pro subscription required' }, { status: 403 })
}
```

### Export Feature Gating

Export is a Pro-only feature. Gate it the same way — check `session.user.isPro` in the export server action or API route before generating the ZIP/JSON.

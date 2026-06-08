# Stripe Integration — Phase 1: Core Infrastructure

## Overview

Lay the groundwork for Stripe subscriptions without touching the payment flow yet. This phase installs the Stripe library, wires `isPro` into the session, creates the reusable usage-limits module, and enforces the free tier limits in the two creation server actions.

Phase 2 builds on top of this by adding the webhook handler, checkout/portal API routes, and billing UI.

## Scope

**In scope:**
- Stripe package installation
- Stripe client singleton
- Session type extension (`isPro` on `session.user`)
- JWT always-sync of `isPro` from DB
- Free tier constants
- `src/lib/usage-limits.ts` module with unit tests
- Free tier enforcement in `createItem` and `createCollection`

**Not in scope (Phase 2):**
- Stripe webhook handler
- Checkout or billing portal API routes
- `BillingSection` settings UI
- `.env` price ID renames

---

## Requirements

- Session must expose `isPro: boolean` so server actions can read it without an extra DB query
- `isPro` must stay in sync after a webhook updates it (always-sync pattern in JWT callback)
- Free users must be blocked from creating more than 50 items or 3 collections
- The limit-checking logic must live in a dedicated, testable module — not inlined in each action
- Unit tests cover all limit-check branches

---

## Files to Create

### `src/lib/stripe.ts`

Stripe client singleton — needed by both phases.

```typescript
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
  typescript: true,
})
```

---

### `src/lib/usage-limits.ts`

Reusable limit-checking module. Accepts `isPro` as a parameter (already on the session) to avoid an extra DB query when the caller already has it. Falls back to a DB lookup for cases where only `userId` is available.

```typescript
import { prisma } from '@/lib/prisma'
import { FREE_TIER_ITEM_LIMIT, FREE_TIER_COLLECTION_LIMIT } from '@/lib/constants'

export type LimitCheckResult =
  | { allowed: true }
  | { allowed: false; error: string; limitReached: 'items' | 'collections' }

export async function checkItemLimit(userId: string, isPro: boolean): Promise<LimitCheckResult> {
  if (isPro) return { allowed: true }

  const count = await prisma.item.count({ where: { userId } })
  if (count >= FREE_TIER_ITEM_LIMIT) {
    return {
      allowed: false,
      error: `Free plan limit reached (${FREE_TIER_ITEM_LIMIT} items). Upgrade to Pro for unlimited items.`,
      limitReached: 'items',
    }
  }
  return { allowed: true }
}

export async function checkCollectionLimit(userId: string, isPro: boolean): Promise<LimitCheckResult> {
  if (isPro) return { allowed: true }

  const count = await prisma.collection.count({ where: { userId } })
  if (count >= FREE_TIER_COLLECTION_LIMIT) {
    return {
      allowed: false,
      error: `Free plan limit reached (${FREE_TIER_COLLECTION_LIMIT} collections). Upgrade to Pro for unlimited collections.`,
      limitReached: 'collections',
    }
  }
  return { allowed: true }
}
```

---

### `src/__tests__/lib/usage-limits.test.ts`

Test all branches. Mock `@/lib/prisma` and `@/lib/constants`.

**Scenarios to cover:**

| Scenario | `isPro` | `count` | Expected |
|---|---|---|---|
| Pro user — items | `true` | any | `{ allowed: true }`, no DB call |
| Pro user — collections | `true` | any | `{ allowed: true }`, no DB call |
| Free user, below item limit | `false` | 49 | `{ allowed: true }` |
| Free user, at item limit | `false` | 50 | `{ allowed: false, limitReached: 'items' }` |
| Free user, above item limit | `false` | 51 | `{ allowed: false, limitReached: 'items' }` |
| Free user, below collection limit | `false` | 2 | `{ allowed: true }` |
| Free user, at collection limit | `false` | 3 | `{ allowed: false, limitReached: 'collections' }` |
| Free user, above collection limit | `false` | 4 | `{ allowed: false, limitReached: 'collections' }` |

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkItemLimit, checkCollectionLimit } from '@/lib/usage-limits'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    item: { count: vi.fn() },
    collection: { count: vi.fn() },
  },
}))

vi.mock('@/lib/constants', () => ({
  FREE_TIER_ITEM_LIMIT: 50,
  FREE_TIER_COLLECTION_LIMIT: 3,
}))

import { prisma } from '@/lib/prisma'

describe('checkItemLimit', () => {
  beforeEach(() => vi.clearAllMocks())

  it('allows Pro users without querying DB', async () => {
    const result = await checkItemLimit('user_1', true)
    expect(result.allowed).toBe(true)
    expect(prisma.item.count).not.toHaveBeenCalled()
  })

  it('allows free users below the limit', async () => {
    vi.mocked(prisma.item.count).mockResolvedValue(49)
    const result = await checkItemLimit('user_1', false)
    expect(result.allowed).toBe(true)
  })

  it('blocks free users at the limit', async () => {
    vi.mocked(prisma.item.count).mockResolvedValue(50)
    const result = await checkItemLimit('user_1', false)
    expect(result.allowed).toBe(false)
    if (!result.allowed) {
      expect(result.limitReached).toBe('items')
      expect(result.error).toMatch(/50 items/)
    }
  })

  it('blocks free users above the limit', async () => {
    vi.mocked(prisma.item.count).mockResolvedValue(75)
    const result = await checkItemLimit('user_1', false)
    expect(result.allowed).toBe(false)
  })
})

describe('checkCollectionLimit', () => {
  beforeEach(() => vi.clearAllMocks())

  it('allows Pro users without querying DB', async () => {
    const result = await checkCollectionLimit('user_1', true)
    expect(result.allowed).toBe(true)
    expect(prisma.collection.count).not.toHaveBeenCalled()
  })

  it('allows free users below the limit', async () => {
    vi.mocked(prisma.collection.count).mockResolvedValue(2)
    const result = await checkCollectionLimit('user_1', false)
    expect(result.allowed).toBe(true)
  })

  it('blocks free users at the limit', async () => {
    vi.mocked(prisma.collection.count).mockResolvedValue(3)
    const result = await checkCollectionLimit('user_1', false)
    expect(result.allowed).toBe(false)
    if (!result.allowed) {
      expect(result.limitReached).toBe('collections')
      expect(result.error).toMatch(/3 collections/)
    }
  })

  it('blocks free users above the limit', async () => {
    vi.mocked(prisma.collection.count).mockResolvedValue(5)
    const result = await checkCollectionLimit('user_1', false)
    expect(result.allowed).toBe(false)
  })
})
```

---

## Files to Modify

### `src/types/next-auth.d.ts`

Add `isPro` to the `Session` type and `JWT` interface:

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

### `src/auth.ts`

Replace the existing `callbacks` block. Add an async `jwt` callback that reads `isPro` from the DB on every token refresh. Keep the `session` callback extended to pass `isPro` through.

```typescript
callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.sub = user.id
    }

    // Always sync isPro from DB — catches webhook-driven updates without requiring
    // a client-triggered session.update() call
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

Add `import { prisma } from '@/lib/prisma'` at the top of `src/auth.ts` if not already present.

---

### `src/lib/constants.ts`

Add the two free tier limits:

```typescript
export const FREE_TIER_ITEM_LIMIT = 50
export const FREE_TIER_COLLECTION_LIMIT = 3
```

---

### `src/actions/items.ts`

Import `checkItemLimit` and call it after auth, before the DB create:

```typescript
import { checkItemLimit } from '@/lib/usage-limits'

export async function createItem(data: z.input<typeof createItemSchema>) {
  const session = await auth()
  if (!session?.user?.id) return { success: false as const, error: 'Not authenticated.' }

  const parsed = createItemSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false as const, error: z.flattenError(parsed.error).fieldErrors }
  }

  const limitCheck = await checkItemLimit(session.user.id, session.user.isPro)
  if (!limitCheck.allowed) {
    return { success: false as const, error: limitCheck.error, limitReached: limitCheck.limitReached }
  }

  // ... rest unchanged
}
```

**Update existing `createItem` unit tests** — add `isPro: false` (and `isPro: true` for Pro cases) to the mocked session object so they still pass.

---

### `src/actions/collections.ts`

Import `checkCollectionLimit` and call it after auth, before the DB create:

```typescript
import { checkCollectionLimit } from '@/lib/usage-limits'

export async function createCollection(data: CreateCollectionInput) {
  const session = await auth()
  if (!session?.user?.id) return { success: false as const, error: 'Not authenticated.' }

  const parsed = createCollectionSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false as const, error: z.flattenError(parsed.error).fieldErrors }
  }

  const limitCheck = await checkCollectionLimit(session.user.id, session.user.isPro)
  if (!limitCheck.allowed) {
    return { success: false as const, error: limitCheck.error, limitReached: limitCheck.limitReached }
  }

  // ... rest unchanged
}
```

**Update existing `createCollection` unit tests** — add `isPro: false` to the mocked session.

---

## Package Installation

```
npm install stripe
```

---

## Testing

### Unit tests

```
npm test
```

Expected: all pre-existing tests still pass + 8 new tests in `usage-limits.test.ts`.

Tests for `createItem` and `createCollection` that mock the session must be updated to include `isPro: false` on the session user object — otherwise TypeScript will error and the tests will fail.

### Manual verification

1. Sign in as a free user (seed user has `isPro = false` by default)
2. Create items up to 50 → item 51 should show an error toast
3. Create collections up to 3 → collection 4 should show an error toast
4. Manually set `isPro = true` in the database (`UPDATE users SET "isPro" = true WHERE email = '...'`)
5. Reload page — session should now reflect `isPro: true` (JWT always-sync)
6. Verify unlimited creation works

### Build

```
npm run build
```

TypeScript must not error on `session.user.isPro` usages after the type extension.

---

## Notes

- The `stripe` package is installed in Phase 1 even though no Stripe API calls are made yet — `src/lib/stripe.ts` will be needed in Phase 2 and installing it now keeps the phases clean
- The JWT always-sync pattern adds one `prisma.user.findUnique` per token refresh. Token refreshes happen when the JWT is about to expire (default 30 days in NextAuth v5), not on every request — this is acceptable overhead
- `isPro` defaults to `false` in the Prisma schema, so the `?? false` fallback in the JWT callback is just defensive coding

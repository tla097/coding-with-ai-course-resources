# DevStash — Codebase Audit Report

**Date:** 10/06/2026  
**Scope:** Full codebase security, performance, and code quality review  
**Stack:** Next.js 16, React 19, TypeScript, NextAuth v5, Prisma 7, Neon PostgreSQL, Supabase Storage, Google GenAI, Stripe, Upstash Redis, Tailwind CSS v4

---

## Summary

| Severity | Total | Fixed | Outstanding |
|---|---|---|---|
| HIGH | 5 | 5 ✅ | 0 |
| MEDIUM | 6 | 6 ✅ | 0 |
| LOW | 6 | 6 ✅ | 0 |

---

## HIGH — Security ✅ All Fixed (10/06/2026)

**1. JWT `isPro` re-queried on every session read** ✅ Fixed
- File: `src/auth.ts`
- DB fetch for `isPro` was running unconditionally on every `jwt()` invocation. Moved inside `if (user)` so it only runs at sign-in. `token.isPro as boolean` replaced with `token.isPro === true`.

**2. Stripe webhook trusts `metadata.userId` without cross-checking `stripeCustomerId`** ✅ Fixed
- File: `src/app/api/webhooks/stripe/route.ts`
- `checkout.session.completed` now looks up the user and asserts `session.customer === user.stripeCustomerId` before granting Pro. On first checkout (where `stripeCustomerId` is null) the check is skipped and the ID is stored.

**3. `x-forwarded-for` leftmost IP is trivially spoofable** ✅ Fixed
- File: `src/lib/rate-limit.ts`
- `getIpFromHeaders` now uses the rightmost `x-forwarded-for` value (appended by the proxy, not the client). Also prefers `cf-connecting-ip` and `x-real-ip` when present.

**4. `deleteAccount` has no server-side re-authentication** ✅ Fixed
- Files: `src/actions/profile.ts`, `src/components/profile/DeleteAccountButton.tsx`, `src/app/(dashboard)/settings/page.tsx`
- Server action now requires a `confirmation` argument. Credentials users must supply their current password (verified with bcrypt). OAuth users must type their email address. UI collects the value before calling the action.

**5. HTML injection in email templates via unsanitised `name`** ✅ Fixed
- File: `src/lib/email.ts`
- `escapeHtml()` helper added; applied to `name` in `sendVerificationEmail`. Escapes `&`, `<`, `>`, `"`, `'`.

---

## MEDIUM — Security & Performance

**6. Credentials `authorize` does not enforce `emailVerified`**
- File: `src/auth.ts`
- A valid email/password returns a JWT regardless of whether `emailVerified` is set. The dashboard redirect guard is UI-only — a user can obtain a valid session and call API routes directly while unverified.
- Fix: Add `if (!user.emailVerified) return null` in `authorize`, conditioned on `DISABLE_EMAIL_VERIFICATION !== 'true'`.

**7. `updateItem` / `toggleItemFavorite` / `toggleItemPin` — TOCTOU ownership pattern**
- File: `src/lib/db/items.ts`
- Ownership check (`findFirst({ where: { id, userId } })`) followed by update (`{ where: { id } }`) — the update omits `userId`. Safe today but fragile. Future refactors could skip the pre-check and silently allow cross-user writes.
- Fix: Collapse to a single `update({ where: { id, userId }, data: ... })`.

**8. `verifyEmail` page performs DB writes during Server Component render**
- File: `src/app/(auth)/verify-email/page.tsx`
- `prisma.user.update` and `prisma.verificationToken.deleteMany` run during page rendering. A double render produces a confusing "invalid or already used" error on the second render.
- Fix: Move token verification logic to a Server Action or Route Handler.

**9. `getSearchData` loads every item with full content on every dashboard page load**
- File: `src/lib/db/search.ts`
- `prisma.item.findMany({ where: { userId } })` has no `take` limit and selects full `content` (`@db.Text`) fields for all items, then slices to 100 chars. Transfers megabytes per navigation for power users.
- Fix: Add `take: 500` cap; select only `id`, `title`, and a short preview. Long-term: server-side search.

**10. `getCollectionById` / `getAllCollections` compute stats in JS from full item joins**
- File: `src/lib/db/collections.ts`
- `collectionInclude` fetches every `ItemCollection` join row with full `itemType` data to compute `itemCount` and `dominantType` in Node.js.
- Fix: Use `_count: { select: { items: true } }` for the count. Use a `groupBy` query for dominant type.

**11. `getSidebarData` runs a deep join chain on every page load just to compute a display colour**
- File: `src/lib/db/sidebar.ts`
- Last 10 collections fetched with `items → item → itemType` chain on every dashboard layout render, purely to determine a single colour per collection.
- Fix: Pre-compute `dominantColor` as a stored column updated on item mutation, or use a `groupBy` aggregate.

---

## LOW — Code Duplication & Configuration

**12. `LANGUAGES` array duplicated verbatim in two components**
- Files: `src/components/items/NewItemDialog.tsx` ~line 35, `src/components/items/ItemDrawer.tsx` ~line 44
- 24-entry language list copy-pasted in both files. Any change must be made twice.
- Fix: Extract to `src/lib/constants.ts` or `src/lib/languages.ts`.

**13. Item type classification constants duplicated in same two files**
- Files: `src/components/items/NewItemDialog.tsx` ~line 62, `src/components/items/ItemDrawer.tsx` ~line 94
- `CONTENT_TYPES`, `LANGUAGE_TYPES`, `CODE_EDITOR_TYPES`, `MARKDOWN_EDITOR_TYPES` are identical in both.
- Fix: Same shared constants module as above.

**14. `formatBytes` utility duplicated**
- Files: `src/components/items/FileUpload.tsx` ~line 19, `src/components/items/ItemDrawer.tsx` ~line 101
- Identical 3-line helper in two files.
- Fix: Move to `src/lib/utils.ts`.

**15. `MD_COMPONENTS` markdown styles partially duplicated**
- Files: `src/components/ui/CodeEditor.tsx` ~line 61, `src/components/ui/MarkdownEditor.tsx` ~line 24
- `MarkdownEditor` has a superset of `CodeEditor`'s `MD_COMPONENTS`. The shared base is copy-pasted.
- Fix: Extract shared base to `src/lib/markdown-components.tsx`; `MarkdownEditor` extends it.

**16. `stripe.ts` falls back to a placeholder string instead of failing at startup**
- File: `src/lib/stripe.ts`
- `process.env.STRIPE_SECRET_KEY || 'placeholder_key_not_set'` silently initialises a broken Stripe client. Misconfiguration only surfaces at the first API call.
- Fix: `if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not set')`

**17. `resend.ts` passes `undefined` to the Resend constructor**
- File: `src/lib/resend.ts`
- If `RESEND_AI_KEY` is absent, `undefined` is passed silently. Every email send fails at call time rather than at startup.
- Fix: Add a startup guard matching the Stripe recommendation.

---

*Report generated from automated codebase scan + Context7 best-practices review.*

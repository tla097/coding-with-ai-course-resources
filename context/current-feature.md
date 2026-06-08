# Current Feature: UI Fixes from Accessibility and Quality Review

## Status

Completed

## Goals

### Critical
- Add `<Label htmlFor>` elements to all auth form inputs (sign-in and register pages) — placeholders alone fail WCAG 1.3.1
- Increase favorite star button touch target on ItemCard to meet WCAG minimum (44×44px)
- Make ItemCard keyboard accessible: add `role="button"`, `tabIndex={0}`, and `onKeyDown` handler

### High
- Fix Navbar transparent background at scroll-zero — apply base `bg-background` regardless of scroll state
- Add DevStash logo and home link to auth layout so branding appears on sign-in/register pages
- Add `aria-label` to sidebar toggle button in TopBar
- Fix mobile topbar overflow — collapse search bar to icon on small screens
- Add `aria-hidden` and remove from tab order when sidebar is collapsed (`w-0`)
- Fix AlertDialog delete trigger in ItemDrawer — replace invalid `render=` prop with correct Radix `asChild` pattern

### Medium
- Show hero "chaos" visual on mobile (currently `hidden md:flex`) or replace with mobile-appropriate layout
- Fix misleading "Favorite Collections" stat — use a dedicated count query instead of filtering capped recent collections
- Add empty state with CTA to dashboard Collections section when user has no collections
- Add empty state to dashboard Recent Items section when array is empty
- Add "Create" CTA to items list view empty state (currently just "No {type} yet." with no action)
- Add `aria-pressed` / `aria-selected` to type selector buttons in NewItemDialog (color alone is insufficient)
- Isolate Delete Account in a "Danger Zone" card with red border on settings page

### Low / Polish
- Add `aria-label` to pricing toggle switch (`PricingSection.tsx`)
- Add `scroll-behavior: smooth` to `<html>` for anchor links (`#features`, `#pricing`)
- Add GitHub OAuth button to register page (parity with sign-in)
- Add minimum password length hint on register form
- Fix SSR hydration layout shift when stored `sidebarOpen` differs from default
- Make profile page editable (name field at minimum)
- Add `<html lang="en">` to root layout
- Add per-page `<title>` metadata to dashboard pages (Dashboard, Snippets, Prompts, etc.)
- Replace `role="link"` + div on CollectionCard with `<Link>` wrapper for real link semantics
- Remove `font-mono` from favorites page empty state instructional copy
- Add distinct icon for "Updated" date in ItemDrawer detail section (currently same `Calendar` icon as "Created")

## Notes

All issues identified by a UI subagent code review of the DevStash codebase. No Playwright browser session was used — all findings are from static code analysis. Fixes should be applied across these files:

- `src/app/(auth)/layout.tsx` — branding
- `src/app/(auth)/sign-in/page.tsx` — input labels
- `src/app/(auth)/register/page.tsx` — input labels, GitHub button, password hint
- `src/app/(dashboard)/dashboard/page.tsx` — stat fix, empty states
- `src/app/(dashboard)/items/[type]/page.tsx` — empty state CTA
- `src/app/(dashboard)/profile/page.tsx` — editable name
- `src/app/(dashboard)/settings/page.tsx` — danger zone card
- `src/app/(dashboard)/favorites/page.tsx` — remove font-mono from copy
- `src/app/layout.tsx` — lang attribute, metadata
- `src/components/layout/Navbar.tsx` — scroll-zero background
- `src/components/layout/TopBar.tsx` — aria-label, mobile search collapse
- `src/components/layout/Sidebar.tsx` — aria-hidden when collapsed
- `src/components/layout/DashboardShell.tsx` — SSR hydration fix
- `src/components/dashboard/ItemCard.tsx` — keyboard access, star button size
- `src/components/dashboard/CollectionCard.tsx` — Link wrapper
- `src/components/items/ItemDrawer.tsx` — AlertDialog fix, date icon
- `src/components/items/NewItemDialog.tsx` — aria-pressed on type selector
- `src/components/marketing/Navbar.tsx` — transparent background fix
- `src/components/marketing/HeroVisual.tsx` — mobile visibility
- `src/components/marketing/PricingSection.tsx` — aria-label on toggle

## History

<!-- Keep this updated. Earliest to latest -->
01/06/2026 09:00 - Updated tailwind files
01/06/2026 09:30 - Created src/lib/mock-data.ts with mockUser, mockItemTypes, mockCollections, and mockItems for dashboard UI development
01/06/2026 10:00 - Started Dashboard UI Phase 1
01/06/2026 11:00 - Completed Dashboard UI Phase 1: ShadCN initialized, /dashboard route, dark mode, top bar with centered search, sidebar and main placeholders
01/06/2026 12:00 - Started Dashboard UI Phase 2
01/06/2026 14:00 - Completed Dashboard UI Phase 2: collapsible sidebar with item type links, favorites/recent collections, user avatar area, and mobile drawer support
01/06/2026 15:00 - Started Dashboard UI Phase 3
01/06/2026 17:00 - Completed Dashboard UI Phase 3: stats cards, recent collections grid, pinned items section, and 10 recent items section
02/06/2026 09:00 - Started Database Setup: Prisma 7 + Neon PostgreSQL
02/06/2026 09:30 - Completed Database Setup: schema, initial migration applied via Neon serverless WebSocket, Prisma client generated, build passing
02/06/2026 10:00 - Started Seed Data: prisma/seed.ts
02/06/2026 10:30 - Implemented seed script: demo user, 7 system item types, 5 collections, 14 items; installed bcryptjs + @prisma/adapter-neon + tsx; build passing
02/06/2026 11:00 - Completed Seed Data: seed ran successfully (18 items), seed config moved to prisma.config.ts (Prisma 7 requirement)
02/06/2026 11:20 - Started Dashboard Collections: created feature/dashboard-collections branch
02/06/2026 11:30 - Implemented: src/lib/db/collections.ts, updated CollectionCard.tsx (real types, colored left border, type icons), updated dashboard/page.tsx (async, fetches from DB); build passing
02/06/2026 11:40 - Fixed Prisma connection: switched prisma.ts from PrismaPg (TCP) to PrismaNeon WebSocket adapter; added cross-env to npm scripts for NODE_EXTRA_CA_CERTS
02/06/2026 12:00 - Completed Dashboard Collections: real DB data showing in dashboard collections grid
02/06/2026 12:10 - Started Dashboard Items: created feature/dashboard-items branch
02/06/2026 12:20 - Completed Dashboard Items: created src/lib/db/items.ts, updated ItemCard.tsx (real DB types, tag objects), updated dashboard/page.tsx (parallel DB fetches, no mock data); build passing
02/06/2026 13:00 - Started Stats & Sidebar: created feature/stats-sidebar branch
02/06/2026 13:30 - Implemented: src/lib/db/sidebar.ts (getSidebarData), DashboardShell.tsx (client shell extracted from layout), updated layout.tsx (server component, fetches sidebar data), updated Sidebar.tsx (real DB item types + collections, colored circles for recents, "View all collections" link); build passing
02/06/2026 13:35 - Fixed: sidebar item type counts now always display (show 0 when no items instead of hiding the count)
02/06/2026 16:15 - Started Add Pro Badge to Sidebar: created feature/add-pro-badge-sidebar branch
02/06/2026 16:20 - Implemented: installed ShadCN Badge component, updated Sidebar.tsx to show PRO badge on file and image types; build passing
02/06/2026 16:20 - Updated Sidebar.tsx to sort pro types (file, image) to the bottom of the types list
02/06/2026 16:25 - Completed Add Pro Badge to Sidebar: PRO badge on file and image types, pro types sorted to bottom; merged to main
03/06/2026 10:00 - Started Codebase Scan Fixes: created fix/codebase-scan-fixes branch
03/06/2026 10:30 - Completed Codebase Scan Fixes: 10 findings addressed (3 HIGH, 3 MEDIUM, 4 LOW); build passing; merged to main
03/06/2026 12:00 - Started Auth Setup: created feature/auth-setup-nextauth-github branch
03/06/2026 12:15 - Implemented: installed next-auth@beta + @auth/prisma-adapter; created src/auth.config.ts (edge config), src/auth.ts (Prisma adapter + JWT), src/app/api/auth/[...nextauth]/route.ts, src/proxy.ts (dashboard protection), src/types/next-auth.d.ts (Session type); build passing
03/06/2026 12:25 - Completed Auth Setup: NextAuth v5 + GitHub OAuth wired, /dashboard/* protected by proxy redirect; merged to main
03/06/2026 13:00 - Started Auth Credentials: created feature/auth-credentials-email-password branch
03/06/2026 13:30 - Completed Auth Credentials: Credentials provider added (split pattern), POST /api/auth/register with bcrypt hashing, email/password sign-in working; merged to main
03/06/2026 14:00 - Started Auth UI: created feature/auth-ui-signin-register-signout branch
03/06/2026 14:20 - Completed Auth UI: custom /sign-in and /register pages, UserAvatar component (image or initials), sidebar user area with real session data and sign-out dropdown, auto sign-in after registration with welcome toast; merged to main
03/06/2026 16:20 - Completed Email Verification: Resend integration, 24h token stored in VerificationToken table, /verify-email page, dashboard blocks unverified users, sign-in shows verified banner; merged to main
03/06/2026 16:35 - Completed Email Verification Toggle: DISABLE_EMAIL_VERIFICATION env variable bypasses verification — registration auto-signs user in and redirects to dashboard; dashboard guard skipped; merged to main
03/06/2026 17:00 - Completed Forgot Password: /forgot-password and /reset-password pages, Server Actions for request/reset, tokens stored in VerificationToken with password-reset: prefix and 1-hour expiry, Resend email, "Forgot password?" link on sign-in page; merged to main
03/06/2026 17:00 - Completed Profile Page: /profile route with user info, usage stats (total items, collections, per-type breakdown), change password form (credentials users only), delete account with two-step confirmation; merged to main
04/06/2026 13:00 - Started Rate Limiting for Auth: created feature/rate-limiting-auth branch
04/06/2026 14:30 - Completed Rate Limiting for Auth: src/lib/rate-limit.ts (Upstash sliding window, fail-open), login rate limited in proxy (5/15min IP+email), register (3/1h IP), forgot-password (3/1h IP), reset-password (5/15min IP), resend-verification endpoint created (3/15min IP+email), resend button on verify-email page; merged to main
04/06/2026 15:45 - Completed Items List View: src/app/(dashboard)/items/[type]/page.tsx (dynamic route, server component, notFound for unknown types, 2-col grid, empty state), getItemsByType added to src/lib/db/items.ts; merged to main
04/06/2026 16:05 - Completed Three-Column Items List View: items/[type] grid updated to lg:grid-cols-3 (1 col mobile, 2 tablet, 3 desktop), max-w-5xl widened to max-w-6xl; merged to main
04/06/2026 16:25 - Completed Item Drawer: shadcn Sheet drawer opens on ItemCard click, fetches full item via GET /api/items/[id] with auth check; skeleton loading state; action bar (Favorite, Pin, Copy, Edit, Delete); detail sections (description, content, URL, tags, collections, dates); ItemsWithDrawer client wrapper manages state on server component pages; unit tests for getItemById; merged to main
04/06/2026 16:40 - Completed Item Drawer Edit Mode: pencil button toggles inline edit form; title/description/tags for all types; content/language/URL shown per type; Save/Cancel replace action bar; updateItem server action (Zod v4 validated, ownership checked, { success, data, error } pattern); updateItem DB query (disconnect-all/connect-or-create tags); router.refresh() on save; 12 unit tests; merged to main
04/06/2026 16:55 - Completed Item Delete: trash icon in drawer opens Shadcn AlertDialog confirmation; deleteItem server action (ownership checked, { success, error } pattern); deleteItem DB query; sonner toast on success/failure; drawer closes and router.refresh() after delete; 9 unit tests; merged to main
08/06/2026 12:00 - Completed UI Accessibility and Quality Fixes: 36 issues addressed across auth pages, dashboard, items, layout, marketing, and profile; added EditNameForm component and updateName server action; getFavoriteCollectionCount DB query; CollectionCard stretched-link pattern; build passing; merged to main

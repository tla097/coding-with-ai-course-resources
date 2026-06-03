# Current Feature: Email Verification

## Status
In Progress

## Goals
- After a user registers with email/password, send a verification email via Resend
- Email contains a unique, time-limited verification link (`/verify-email?token=...`)
- Clicking the link marks the user's `emailVerified` field in the database
- Unverified users are redirected to a `/verify-email` pending page when they try to access `/dashboard`
- Already-verified users and OAuth users are unaffected
- Show a toast/message on the register page confirming the email was sent
- Show a success message on the verify page after the token is confirmed

## Notes
- Resend API key is in `.env` as `RESEND_AI_KEY`
- Use the existing `VerificationToken` model (`identifier`, `token`, `expires`) — already in schema and migrated
- Use the existing `emailVerified` field on the `User` model
- Token should expire after 24 hours
- After successful verification, redirect user to `/dashboard`
- OAuth users (GitHub) have `emailVerified` set by NextAuth automatically — skip verification for them
- Use Resend's Node.js SDK (`resend` package)
- Send from a sensible from address (e.g. `noreply@devstash.app` or configure via Resend dashboard)
- The `/api/auth/register` route must create the token and trigger the email after creating the user
- New route needed: `GET /api/auth/verify-email?token=...` to validate the token and update the user
- New page needed: `/verify-email` — shows pending message or success/error state based on query params

## History
<!-- Keep this updated. Earliest to Latest. Format: DD/MM/YYYY HH:MM -->
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
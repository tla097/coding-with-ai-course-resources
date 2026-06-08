# Current Feature: Favourite Toggle Button

## Status
In Progress

## Goals
- Favourite toggle button on ItemCard that toggles `isFavorite` on the item with visual filled/outline star state
- Favourite toggle button in ItemDrawer action bar that toggles `isFavorite` on the item with visual filled/outline star state
- Favourite toggle button on CollectionCard that toggles `isFavorite` on the collection with visual filled/outline star state
- Favourite toggle button on the collection page (/collections/[id]) header area that toggles `isFavorite` on the collection
- `toggleItemFavorite` server action in src/actions/items.ts (auth check, ownership check, { success, data, error } pattern)
- `toggleCollectionFavorite` server action in src/actions/collections.ts (auth check, ownership check, { success, data, error } pattern)
- Toast notification on success/failure
- router.refresh() after toggle to sync all views including sidebar favorites list
- Unit tests for both server actions

## Notes
- `isFavorite Boolean @default(false)` already exists on both Item and Collection models — no migration needed
- CollectionActions component and ItemDrawer already have placeholder Favourite buttons — audit current state before implementing
- Drawer already listed Favorite in the action bar per history (04/06/2026 16:25), CollectionActions had a Favorite button per history (05/06/2026 15:15) — check if these are wired up or placeholders
- Use a Star icon (filled vs outline) to indicate favorited state
- Button should be visually distinct (yellow/amber fill when active)

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
04/06/2026 17:10 - Completed Item Create: Dialog UI component (base-ui/dialog), NewItemDialog with type selector (snippet/prompt/command/note/link) and conditional fields, createItem server action (Zod v4, auth check, URL/TEXT contentType), createItem DB query (connect-or-create tags); toast + close + router.refresh() on success; 12 unit tests; merged to main
04/06/2026 17:30 - Completed Code Editor (Monaco): CodeEditor component (src/components/ui/CodeEditor.tsx) with macOS window dots, copy button, language label, fluid height (120-400px), themed scrollbar; replaces Textarea in ItemDrawer and NewItemDialog for snippet/command types; notes/prompts keep Textarea; merged to main
05/06/2026 13:20 - Completed Markdown Editor: MarkdownEditor component (src/components/ui/MarkdownEditor.tsx) with Write/Preview tabs, copy button, readonly mode, GFM rendering via react-markdown + remark-gfm; inline styles used for markdown elements (Tailwind v4 drops non-@layer CSS from globals.css); replaces Textarea in ItemDrawer and NewItemDialog for note/prompt types; merged to main
05/06/2026 14:10 - Completed Collection Create: NewCollectionDialog component (src/components/collections/NewCollectionDialog.tsx) with name/description fields, createCollection server action (src/actions/collections.ts, Zod v4, auth check), createCollection DB query added to src/lib/db/collections.ts (user-scoped), wired into TopBar replacing placeholder button, toast on success/failure, router.refresh() on save; 10 unit tests; merged to main
05/06/2026 14:35 - Completed Add Item to Collections: CollectionPicker component (src/components/items/CollectionPicker.tsx), multi-select picker added to NewItemDialog and ItemDrawer edit mode, collectionIds added to createItem/updateItem schemas and DB queries (createMany on create, deleteMany+createMany sync on update), allCollections threaded via SidebarData for create flow, getCollectionList fetched per-page for drawer edit flow; 14 unit tests added; merged to main
05/06/2026 14:45 - Completed Dashboard Title Navigation: TopBar.tsx title span replaced with Next.js Link to /dashboard; merged to main
05/06/2026 15:05 - Completed Collections Pages: /collections page (getAllCollections + CollectionCard grid), /collections/[id] page (getCollectionById + getItemsByCollection + ItemsWithDrawer grid); mapCollectionStats/collectionInclude extracted to remove duplication; 14 unit tests; merged to main
05/06/2026 15:15 - Completed Collection Actions & Card Dropdowns: CollectionActions component (Edit/Delete/Favorite buttons) on /collections/[id], EditCollectionDialog (name/description, updateCollection server action), DeleteCollectionDialog (confirmation, deletes collection only — items kept via cascade join cleanup), CollectionCard converted to client component with 3-dots dropdown (Edit/Delete/Favorite), card click navigates; updateCollection and deleteCollection added to actions and DB layer; 16 unit tests; merged to main
05/06/2026 15:35 - Fixed Delete Collection Redirect: CollectionActions.tsx redirectAfterDelete changed from /collections to /dashboard; merged to main
05/06/2026 15:50 - Completed Global Search / Command Palette: cmdk palette opens on Ctrl+K/Cmd+K and TopBar click; fuzzy search across items and collections; grouped results with type icon and item count; item selection opens ItemDrawer; collection selection navigates to /collections/[id]; search data pre-fetched in layout; 10 unit tests; merged to main
05/06/2026 16:15 - Completed Pagination: src/lib/constants.ts (ITEMS_PER_PAGE=21, COLLECTIONS_PER_PAGE=21, DASHBOARD_COLLECTIONS_LIMIT=6, DASHBOARD_RECENT_ITEMS_LIMIT=10); getItemsByTypePaginated and getItemsByCollectionPaginated (skip/take); Pagination component (numbered links, prev/next, ellipsis); /items/[type] and /collections/[id] paginated via searchParams; dashboard uses limit constants with accurate collection count stat; 10 unit tests; merged to main
05/06/2026 16:35 - Completed Settings Page: /settings route (protected), Settings link added to sidebar user dropdown, ChangePasswordForm and DeleteAccountButton moved from /profile to /settings; proxy.ts updated to protect /settings; merged to main
08/06/2026 10:15 - Completed Editor Preferences Settings: editorPreferences JSON column on User model (migration applied), EditorPreferencesContext with auto-save, EditorPreferencesForm (font size, tab size, theme dropdowns; word wrap, minimap toggles) added to /settings, Monaco editor reads preferences live (monokai and github-dark themes registered); 12 unit tests; merged to main
08/06/2026 12:00 - Started Favorites Page: created feature/favorites-page branch
08/06/2026 10:45 - Completed Favorites Page: /favorites route (protected), getFavoriteItems + getFavoriteCollections DB queries (updatedAt desc), FavoritesView compact monospace list (type icon/badge/date rows, two sections with counts), ItemDrawer on item click, collection rows navigate to /collections/[id], empty state, star icon in TopBar, 10 unit tests; merged to main

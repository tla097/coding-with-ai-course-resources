# Current Feature
Stats & Sidebar — Replace mock data with real DB data

## Status
In Progress

## Goals
- Display stats pertaining to database data, keeping the current design/layout
- Display item types in sidebar with their icons, linking to /items/[typename]
- Add "View all collections" link under the collections list that goes to /collections
- Keep the star icons for favorite collections but for recents, each collection should show a colored circle based on the most-used item type in that collection
- Create src/lib/db/stats.ts and add the database functions

## Notes
- Spec: context/features/stats-sidebar-spec.md
- Reference: src/lib/db/collections.ts

## History
<!-- Keep this updated. Earliest to Latest. Format: DD/MM/YYYY HH:MM -->
02/06/2026 13:00 - Started Stats & Sidebar: created feature/stats-sidebar branch
02/06/2026 13:30 - Implemented: src/lib/db/sidebar.ts (getSidebarData), DashboardShell.tsx (client shell extracted from layout), updated layout.tsx (server component, fetches sidebar data), updated Sidebar.tsx (real DB item types + collections, colored circles for recents, "View all collections" link); build passing
02/06/2026 13:35 - Fixed: sidebar item type counts now always display (show 0 when no items instead of hiding the count)
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
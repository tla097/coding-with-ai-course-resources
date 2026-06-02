# Current Feature
Database Setup — Prisma ORM + Neon PostgreSQL

## Status
Completed

## Goals
- Install and configure Prisma 7 with Neon PostgreSQL (serverless)
- Create initial schema based on data models in context/project-overview.md
- Include NextAuth v5 models (Account, Session, VerificationToken)
- Add appropriate indexes and cascade deletes
- Create initial migration using `prisma migrate dev`
- Set up Prisma client singleton in src/lib/prisma.ts

## Notes
- Spec: context/features/database-spec.md
- Prisma 7 breaking changes applied: generator uses `"prisma-client"`, output is mandatory, `url` removed from datasource block
- Import path is `@/generated/prisma/client` (not `@prisma/client`)
- `prisma.config.ts` at project root handles datasource URL and dotenv loading for CLI
- Corporate firewall blocks port 5432 — initial migration applied via `@neondatabase/serverless` WebSocket (port 443)
- For all Prisma CLI commands set `NODE_EXTRA_CA_CERTS` to `DorsetSoftware-Root-CA.crt`
- Future migrations: use the same WebSocket approach (a `scripts/apply-migration.mjs` pattern)

## History
<!-- Keep this updated. Earliest to Latest -->
01/06/2026 - Updated tailwind files  
01/06/2026 - Created src/lib/mock-data.ts with mockUser, mockItemTypes, mockCollections, and mockItems for dashboard UI development  
01/06/2026 - Started Dashboard UI Phase 1
01/06/2026 - Completed Dashboard UI Phase 1: ShadCN initialized, /dashboard route, dark mode, top bar with centered search, sidebar and main placeholders
01/06/2026 - Started Dashboard UI Phase 2
01/06/2026 - Completed Dashboard UI Phase 2: collapsible sidebar with item type links, favorites/recent collections, user avatar area, and mobile drawer support
01/06/2026 - Started Dashboard UI Phase 3
01/06/2026 - Completed Dashboard UI Phase 3: stats cards, recent collections grid, pinned items section, and 10 recent items section
02/06/2026 - Started Database Setup: Prisma 7 + Neon PostgreSQL
02/06/2026 - Completed Database Setup: schema, initial migration applied via Neon serverless WebSocket, Prisma client generated, build passing
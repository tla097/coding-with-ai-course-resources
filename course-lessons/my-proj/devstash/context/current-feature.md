# Current Feature
Seed Data — prisma/seed.ts

## Status
Completed

## Goals
- Create prisma/seed.ts script to populate the database with sample data
- Create demo user (demo@devstash.io, bcryptjs-hashed password, 12 rounds)
- Seed 7 system ItemTypes (snippet, prompt, command, note, file, image, link)
- Seed 5 collections with realistic items:
  - React Patterns (3 snippets)
  - AI Workflows (3 prompts)
  - DevOps (1 snippet, 1 command, 2 links)
  - Terminal Commands (4 commands)
  - Design Resources (4 links)

## Notes
- Spec: context/features/seed-spec.md
- Use bcryptjs (not bcrypt) — 12 salt rounds
- Icons are Lucide React component names (strings stored in DB)
- All system ItemTypes have isSystem: true and no userId
- Links must use real URLs (not placeholder)
- Run with: `NODE_EXTRA_CA_CERTS=DorsetSoftware-Root-CA.crt npx prisma db seed`
- Seed command is configured in `prisma.config.ts` under `migrations.seed` (Prisma 7 — not package.json)
- Set `NODE_EXTRA_CA_CERTS` to `DorsetSoftware-Root-CA.crt` for all Prisma CLI commands

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
02/06/2026 - Started Seed Data: prisma/seed.ts
02/06/2026 - Implemented seed script: demo user, 7 system item types, 5 collections, 14 items; installed bcryptjs + @prisma/adapter-neon + tsx; build passing
02/06/2026 - Completed Seed Data: seed ran successfully (18 items), seed config moved to prisma.config.ts (Prisma 7 requirement)
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Devstash
A developer knowledge hub for snippets, commands, prompts, notes, files, images, links and custom types.

## ⚠️ Critical: Next.js 16 Breaking Changes

This project runs **Next.js 16**, which differs significantly from prior versions. Before writing any code involving routing, caching, data fetching, or navigation:

1. Read the relevant guide in `node_modules/next/dist/docs/` (the docs are embedded in the package)
2. Key guides: `01-app/01-getting-started/` covers layouts, data fetching, mutations, route handlers
3. Heed all deprecation notices — APIs and conventions may not match training data

Notable differences to be aware of:
- For instant client-side navigations: export `unstable_instant` from the route in addition to using Suspense (see `docs/01-app/02-guides/instant-navigation.mdx`)
- Route Handlers use native Web `Request`/`Response` APIs (not `NextApiRequest`/`NextApiResponse`)
- Server Functions/Actions use `'use server'` directive — always verify auth inside every Server Function since they are reachable via direct POST

## Context files
Read the following to get the full context of the project:

- @context/project-overview.md
- @context/coding-standards.md
- @context/ai-interaction.md
- @context/current-feature.md

## Commands

- `npm run dev` — dev server at http://localhost:3000
- `npm run build` — production build (fix all errors before committing)
- `npm run start` — production server
- `npm run lint` — ESLint

## Architecture

**App Router only** — no Pages Router. All routes live under `src/app/`.

Planned directory structure (build these out as features are added):

```
src/
  app/              # Routes and layouts (App Router)
    api/            # Route Handlers (webhooks, file uploads, third-party)
  actions/          # Server Actions/Functions (mutations, form submissions)
  components/       # UI components, organized by feature
  lib/              # Utilities, Prisma client, auth config
  types/            # TypeScript interfaces and types
```

**When to use Server Actions vs Route Handlers:** Use Server Actions for form submissions and mutations. Use Route Handlers for webhooks, file uploads with progress, and endpoints needed by external clients.

## Tailwind CSS v4

**Do not** create `tailwind.config.ts` or `tailwind.config.js`. Configuration uses the `@theme` directive in `src/app/globals.css`:

```css
@import "tailwindcss";

@theme {
  --color-primary: oklch(50% 0.2 250);
}
```

## Path Aliases

`@/*` maps to `./src/*` — use this for all internal imports.

## Key Dependencies (planned, not yet installed)

- **Database**: Neon PostgreSQL + Prisma ORM — use `prisma migrate dev` for schema changes
- **Auth**: NextAuth v5 — email + GitHub OAuth
- **UI**: shadcn/ui components
- **Validation**: Zod for all external input
- **AI**: OpenAI gpt-5-nano

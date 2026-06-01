# DevStash — Project Overview

> **One fast, searchable, AI-enhanced hub for all dev knowledge & resources.**

---

## Table of Contents

1. [Problem & Vision](#1-problem--vision)
2. [Target Users](#2-target-users)
3. [Tech Stack](#3-tech-stack)
4. [Features](#4-features)
5. [Data Models (Prisma Schema)](#5-data-models-prisma-schema)
6. [Architecture](#6-architecture)
7. [Item Types Reference](#7-item-types-reference)
8. [URL Structure](#8-url-structure)
9. [UI/UX Guidelines](#9-uiux-guidelines)
10. [Monetization](#10-monetization)
11. [AI Features](#11-ai-features)
12. [Dev Notes & Conventions](#12-dev-notes--conventions)

---

## 1. Problem & Vision

Developers context-switch constantly because their knowledge lives everywhere:

| Where things end up | What lives there |
|---|---|
| VS Code / Notion | Code snippets |
| AI chat history | Prompts & system messages |
| Nested project folders | Context files |
| Browser bookmarks | Useful links & docs |
| Random `.txt` files | Commands & one-liners |
| GitHub Gists | Project templates |
| Bash history | Terminal commands |

**DevStash** fixes this with a single, fast, keyboard-friendly hub — think Raycast meets Notion, built specifically for developers.

---

## 2. Target Users

| User | Primary Need |
|---|---|
| **Everyday Developer** | Fast access to snippets, prompts, commands, links |
| **AI-first Developer** | Store & organize prompts, contexts, system messages, workflows |
| **Content Creator / Educator** | Code blocks, explanations, course notes |
| **Full-stack Builder** | Patterns, boilerplates, API examples |

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) + [React 19](https://react.dev/) |
| **Language** | TypeScript |
| **Database** | [Neon](https://neon.tech/) (serverless Postgres) |
| **ORM** | [Prisma 7](https://www.prisma.io/docs) — migrations only, never `db push` |
| **Auth** | [NextAuth v5](https://authjs.dev/) — email/password + GitHub OAuth |
| **File Storage** | [Cloudflare R2](https://developers.cloudflare.com/r2/) |
| **AI** | [OpenAI](https://platform.openai.com/docs) `gpt-4o-mini` model |
| **CSS** | [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| **Caching** | Redis (optional, evaluate when needed) |
| **Rendering** | SSR pages with dynamic components; API routes for backend needs |

---

## 4. Features

### A. Items & Item Types

Items are the core unit of DevStash. Each has a **type** that controls its display, icon, and color.

**System types** (built-in, not user-editable):

| Type | Content Kind | Pro Only |
|---|---|---|
| `snippet` | Text (code) | No |
| `prompt` | Text | No |
| `note` | Text (markdown) | No |
| `command` | Text (terminal) | No |
| `link` | URL | No |
| `file` | File upload | ✅ Yes |
| `image` | File upload | ✅ Yes |

- Items open in a **quick-access drawer** — fast to create and retrieve
- Users can create **custom types** (Pro, coming later)

---

### B. Collections

- Users group items into named collections (e.g. `React Patterns`, `Interview Prep`, `Context Files`)
- An item can belong to **multiple collections** via a join table
- Collections have a `defaultTypeId` for new empty collections
- URL pattern: `/collections/:id`

---

### C. Search

Full-text search across:
- Item **title**
- Item **content**
- **Tags**
- **Type**

---

### D. Authentication

- Email/password sign-in
- GitHub OAuth
- Powered by NextAuth v5

---

### E. General Features

- ⭐ Favorites for items and collections
- 📌 Pin items to top
- 🕐 Recently used items
- 📥 Import code from a file
- ✍️ Markdown editor for text-type items
- 📎 File upload for `file` / `image` types
- 📤 Export data (JSON / ZIP) — Pro
- 🌙 Dark mode by default, light mode optional
- 🗂️ Add/remove items to/from multiple collections
- 🔍 View which collections an item belongs to

---

## 5. Data Models (Prisma Schema)

> ⚠️ **Convention:** Always use Prisma migrations. Never run `prisma db push` in any environment.

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Auth (NextAuth v5) ───────────────────────────────────────────────────────

model User {
  id                    String    @id @default(cuid())
  name                  String?
  email                 String?   @unique
  emailVerified         DateTime?
  image                 String?
  password              String?   // hashed, null for OAuth users
  isPro                 Boolean   @default(false)
  stripeCustomerId      String?   @unique
  stripeSubscriptionId  String?   @unique
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  accounts    Account[]
  sessions    Session[]
  items       Item[]
  collections Collection[]
  itemTypes   ItemType[]   // user-created custom types

  @@map("users")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}

// ─── Item Types ───────────────────────────────────────────────────────────────

model ItemType {
  id       String  @id @default(cuid())
  name     String  // "snippet", "prompt", "command", etc.
  icon     String  // Lucide icon name e.g. "Code", "Sparkles"
  color    String  // Hex color e.g. "#3b82f6"
  isSystem Boolean @default(false)

  userId String? // null for system types
  user   User?   @relation(fields: [userId], references: [id], onDelete: Cascade)

  items       Item[]
  collections Collection[] @relation("DefaultType")

  @@map("item_types")
}

// ─── Items ────────────────────────────────────────────────────────────────────

model Item {
  id          String   @id @default(cuid())
  title       String
  description String?
  language    String?  // e.g. "typescript", "python" — for code highlighting

  // Content — one of these will be populated depending on type
  contentType ContentType @default(TEXT)
  content     String?     @db.Text  // text/markdown content
  url         String?               // for link types
  fileUrl     String?               // Cloudflare R2 URL
  fileName    String?               // original filename
  fileSize    Int?                  // bytes

  isFavorite Boolean  @default(false)
  isPinned   Boolean  @default(false)
  lastUsedAt DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  itemTypeId String
  itemType   ItemType @relation(fields: [itemTypeId], references: [id])

  tags        Tag[]            @relation("ItemTags")
  collections ItemCollection[]

  @@map("items")
}

enum ContentType {
  TEXT
  FILE
  URL
}

// ─── Collections ─────────────────────────────────────────────────────────────

model Collection {
  id          String  @id @default(cuid())
  name        String
  description String?
  isFavorite  Boolean @default(false)

  defaultTypeId String?
  defaultType   ItemType? @relation("DefaultType", fields: [defaultTypeId], references: [id])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  items ItemCollection[]

  @@map("collections")
}

// ─── Join Table: Items ↔ Collections ─────────────────────────────────────────

model ItemCollection {
  itemId       String
  collectionId String
  addedAt      DateTime @default(now())

  item       Item       @relation(fields: [itemId], references: [id], onDelete: Cascade)
  collection Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)

  @@id([itemId, collectionId])
  @@map("item_collections")
}

// ─── Tags ─────────────────────────────────────────────────────────────────────

model Tag {
  id   String @id @default(cuid())
  name String @unique

  items Item[] @relation("ItemTags")

  @@map("tags")
}
```

---

## 6. Architecture

```
devstash/
├── app/                          # Next.js App Router
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   ├── layout.tsx            # Sidebar + main layout
│   │   ├── page.tsx              # Home / recent items
│   │   ├── items/
│   │   │   └── [type]/           # /items/snippets, /items/commands, etc.
│   │   ├── collections/
│   │   │   └── [id]/
│   │   └── search/
│   └── api/
│       ├── auth/[...nextauth]/
│       ├── items/
│       ├── collections/
│       ├── upload/               # R2 file uploads
│       └── ai/                   # AI feature endpoints
│
├── components/
│   ├── ui/                       # shadcn/ui primitives
│   ├── items/
│   │   ├── ItemCard.tsx
│   │   ├── ItemDrawer.tsx        # Quick-access drawer
│   │   └── ItemForm.tsx
│   ├── collections/
│   │   └── CollectionCard.tsx
│   └── layout/
│       ├── Sidebar.tsx
│       └── SearchBar.tsx
│
├── lib/
│   ├── prisma.ts                 # Prisma client singleton
│   ├── auth.ts                   # NextAuth config
│   ├── r2.ts                     # Cloudflare R2 client
│   └── openai.ts                 # OpenAI client
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/               # All DB changes via migrations only
│
└── types/
    └── index.ts                  # Shared TypeScript types
```

### Request Flow

```
Browser → Next.js App Router
              │
              ├── Server Components  →  Prisma  →  Neon (Postgres)
              ├── API Routes         →  Prisma  →  Neon (Postgres)
              │                      →  R2 (files)
              │                      →  OpenAI (AI features)
              └── NextAuth           →  Neon (sessions/accounts)
```

---

## 7. Item Types Reference

| Type | Icon (Lucide) | Color | Hex | Route |
|---|---|---|---|---|
| Snippet | `Code` | Blue | `#3b82f6` | `/items/snippets` |
| Prompt | `Sparkles` | Purple | `#8b5cf6` | `/items/prompts` |
| Command | `Terminal` | Orange | `#f97316` | `/items/commands` |
| Note | `StickyNote` | Yellow | `#fde047` | `/items/notes` |
| File | `File` | Gray | `#6b7280` | `/items/files` |
| Image | `Image` | Pink | `#ec4899` | `/items/images` |
| Link | `Link` | Emerald | `#10b981` | `/items/links` |

> **Pro only:** `file` and `image` types require an active Pro subscription. During development, all users can access all types.

---

## 8. URL Structure

```
/                             → Dashboard (recent + pinned items)
/items/:type                  → Filtered view by type (e.g. /items/snippets)
/collections                  → All collections grid
/collections/:id              → Single collection view
/search?q=...                 → Search results
/settings                     → User settings, plan, export
/login
/register
```

---

## 9. UI/UX Guidelines

### Layout

```
┌─────────────────────────────────────────────────────┐
│  [DevStash]                          🔍  ⚙️  Avatar  │
├──────────────┬──────────────────────────────────────┤
│  SIDEBAR     │  MAIN CONTENT                        │
│              │                                      │
│  Item Types  │  Collections Grid                    │
│  ─ Snippets  │  ┌──────────┐  ┌──────────┐         │
│  ─ Prompts   │  │Collection│  │Collection│  ...     │
│  ─ Commands  │  └──────────┘  └──────────┘         │
│  ─ Notes     │                                      │
│  ─ Links     │  Items                               │
│              │  ┌────────┐ ┌────────┐ ┌────────┐   │
│  Collections │  │ Item   │ │ Item   │ │ Item   │   │
│  ─ React...  │  └────────┘ └────────┘ └────────┘   │
│  ─ Python... │                                      │
│              │                                      │
│  [+ New]     │                                      │
└──────────────┴──────────────────────────────────────┘
```

- **Sidebar** is collapsible; becomes a drawer on mobile
- **Collection cards** are color-coded by the dominant item type they contain
- **Item cards** have a colored left border matching their type color
- **Item drawer** slides in from the right on click — fast to create and view

### Design Principles

- Dark mode by default; light mode available
- References: [Notion](https://notion.so), [Linear](https://linear.app), [Raycast](https://raycast.com)
- Clean typography, generous whitespace, subtle borders and shadows
- Syntax highlighting on all code blocks (snippet, command types)

### Screenshots
Refer to screenshots below as a base for the dasboard design. It does not need to be exact - use as a reference.

devstash\context\screenshots\dashboard-ui-main.png  
devstash\context\screenshots\dashboard-ui-drawer.png

### Micro-interactions

- Smooth drawer open/close transitions
- Hover states on all cards
- Toast notifications for CRUD actions
- Loading skeletons while data fetches

---

## 10. Monetization

### Free Tier

| Limit | Value |
|---|---|
| Total items | 50 |
| Collections | 3 |
| Item types | All except `file` and `image` |
| AI features | ❌ None |
| File uploads | ❌ None |
| Export | ❌ None |

### Pro Tier — $8/month or $72/year

| Feature | Included |
|---|---|
| Items | Unlimited |
| Collections | Unlimited |
| File & image uploads | ✅ |
| Custom item types | ✅ (coming later) |
| AI auto-tagging | ✅ |
| AI code explanation | ✅ |
| AI prompt optimizer | ✅ |
| Export (JSON / ZIP) | ✅ |
| Priority support | ✅ |

> **Dev note:** Pro gating is scaffolded from the start (`isPro` on User model), but all features are unlocked for all users during development.

Stripe fields on the `User` model: `stripeCustomerId`, `stripeSubscriptionId`.

---

## 11. AI Features

All AI features are **Pro only** and powered by `gpt-4o-mini` via the OpenAI API.

| Feature | Description | Endpoint |
|---|---|---|
| **Auto-tag suggestions** | Suggest relevant tags based on item content | `POST /api/ai/tags` |
| **AI Summary** | Short summary of the item's content | `POST /api/ai/summary` |
| **Explain This Code** | Plain-English explanation of a snippet or command | `POST /api/ai/explain` |
| **Prompt Optimizer** | Rewrite and improve an AI prompt | `POST /api/ai/optimize-prompt` |

---

## 12. Dev Notes & Conventions

### Database

- ✅ Use `prisma migrate dev` for local development
- ✅ Use `prisma migrate deploy` for production
- ❌ Never use `prisma db push` in any environment
- All schema changes must go through a named migration

### Prisma Client

```ts
// lib/prisma.ts — singleton pattern for Next.js
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ["query"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

### Environment Variables

```env
# Database
DATABASE_URL=

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=

# OpenAI
OPENAI_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

### Free Tier Enforcement

Check item/collection counts server-side in API routes before creation:

```ts
// Example: enforce 50-item limit for free users
const itemCount = await prisma.item.count({ where: { userId } });
if (!user.isPro && itemCount >= 50) {
  return Response.json({ error: "Free plan limit reached" }, { status: 403 });
}
```

### File Uploads (R2)

- Generate a presigned PUT URL server-side
- Client uploads directly to R2
- Store the resulting public URL in `item.fileUrl`
- Only allow `file` and `image` item types for Pro users

---

*Last updated: June 2026*

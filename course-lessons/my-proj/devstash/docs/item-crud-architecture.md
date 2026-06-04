# Item CRUD Architecture

Design for the unified create/read/update/delete system for all 7 item types.

---

## Principles

- **One action file** for all item mutations (`src/actions/items.ts`)
- **One query file** for all item data fetching (`src/lib/db/items.ts`, already exists — extend it)
- **One dynamic route** for all item list pages (`src/app/(dashboard)/items/[type]/page.tsx`)
- **Type-specific rendering lives in components**, not in actions or queries
- All mutations follow the existing `{ success, data?, error? }` return pattern (see `src/actions/profile.ts`)
- All queries are called directly from server components, not through API routes

---

## File Structure

```
src/
  actions/
    items.ts              # create, update, delete, toggleFavorite, togglePin

  lib/db/
    items.ts              # getItemsByType, getItemById, getPinnedItems,
                          # getRecentItems, getItemStats  (last 3 already exist)

  app/(dashboard)/
    items/
      [type]/
        page.tsx          # server component — fetches items by type, renders list

  components/
    items/
      ItemCard.tsx        # already exists in dashboard/ — move or keep, reference here
      ItemDrawer.tsx      # right-side drawer — detail view + edit form
      ItemForm.tsx        # create/edit form — adapts fields by contentType
      ItemList.tsx        # list + empty state wrapper
      content/
        TextContent.tsx   # renders content field (code block / markdown by type)
        FileContent.tsx   # renders file download link + metadata
        LinkContent.tsx   # renders URL with favicon preview
```

---

## `/items/[type]` Routing

The sidebar generates links as `/items/${type.name}s` (e.g. `/items/snippets`, `/items/commands`).

The dynamic segment `[type]` captures the plural slug. The page resolves it back to the singular type name for the DB query:

```
/items/snippets  →  type.name = "snippet"
/items/prompts   →  type.name = "prompt"
/items/commands  →  type.name = "command"
/items/notes     →  type.name = "note"
/items/files     →  type.name = "file"
/items/images    →  type.name = "image"
/items/links     →  type.name = "link"
```

The page strips the trailing `s` (or uses a static lookup map) to derive the singular name, then queries:

```ts
// src/app/(dashboard)/items/[type]/page.tsx
const typeName = params.type.replace(/s$/, '')  // "snippets" → "snippet"
const items = await getItemsByType(userId, typeName)
```

An unknown slug returns a 404 via `notFound()`.

---

## Actions: `src/actions/items.ts`

Single `'use server'` file. All mutations authenticate via `auth()` before touching the database.

### `createItem(data)`

Accepts a union input validated by Zod — the required fields differ by `contentType`:

| ContentType | Required fields |
|-------------|-----------------|
| `TEXT`      | `title`, `itemTypeId`, `content` |
| `URL`       | `title`, `itemTypeId`, `url` |
| `FILE`      | `title`, `itemTypeId`, `fileUrl`, `fileName`, `fileSize` |

All types accept optional: `description`, `language`, `tags[]`.

Enforces free-tier item limit (50) before insert.

Returns `{ success: true, data: { id } }` or `{ success: false, error }`.

### `updateItem(id, data)`

Same shape as `createItem` minus `itemTypeId` (type is immutable after creation). Verifies `userId` ownership before update.

### `deleteItem(id)`

Verifies ownership. Cascades to `item_collections` and `ItemTags` via DB constraints.

### `toggleFavorite(id)`

Flips `isFavorite`. Verifies ownership.

### `togglePin(id)`

Flips `isPinned`. Verifies ownership.

---

## Queries: `src/lib/db/items.ts` (extensions)

Add to the existing file:

### `getItemsByType(userId, typeName, opts?)`

Fetches all items for a user filtered by `itemType.name`. Returns the full item including `content`, `url`, `fileUrl`, `fileName`, `fileSize`, `language` — the full payload needed to render the drawer.

```ts
export interface ItemFull extends ItemWithType {
  content: string | null
  language: string | null
  fileUrl: string | null
  fileName: string | null
  fileSize: number | null
}
```

Supports optional `opts.orderBy` (`createdAt` | `updatedAt` | `lastUsedAt`) and `opts.limit`.

### `getItemById(userId, id)`

Returns a single `ItemFull` by ID, scoped to `userId` (returns `null` if not owned).

The existing `ItemWithType` interface (used by `ItemCard`) stays as-is for list views that don't need content.

---

## Component Responsibilities

### `src/app/(dashboard)/items/[type]/page.tsx`

Server component. Responsibilities:
- Resolve `params.type` to a type name; call `notFound()` for unknown slugs
- Fetch `ItemFull[]` via `getItemsByType`
- Fetch the matching `ItemType` record (for the page header color/icon)
- Render `<ItemList>` with items; pass the type metadata

### `ItemList`

Client component. Responsibilities:
- Render the list of `<ItemCard>` entries
- Show empty state when no items exist
- Open `<ItemDrawer>` on card click, passing the selected item
- House the "New item" button that opens an empty drawer

### `ItemCard` (existing, in `src/components/dashboard/`)

Already handles icon, color, title, description, tags, favorite/pin badges. No changes needed for list display — the existing shape covers it.

### `ItemDrawer`

Client component (sheet/drawer from shadcn/ui). Responsibilities:
- Display full item detail (title, description, content area, tags)
- Render the appropriate `<TextContent>`, `<FileContent>`, or `<LinkContent>` based on `item.contentType`
- Switch to edit mode in the same drawer (toggle view ↔ form)
- Call `deleteItem` action with confirmation
- Call `toggleFavorite` / `togglePin` actions from toolbar buttons

### `ItemForm`

Client component. Used inside the drawer for both create and edit. Responsibilities:
- Shared fields: title, description, tags
- Conditionally render the type-specific field group based on `contentType`:
  - `TEXT`: textarea for `content` + optional `language` select (for snippet/command)
  - `URL`: URL input for `url`
  - `FILE`: file upload input (triggers R2 presigned PUT, then stores `fileUrl`/`fileName`/`fileSize`)
- Call `createItem` or `updateItem` action on submit
- Display validation errors inline

### Content sub-components (`components/items/content/`)

Stateless display-only components:

| Component | Used for | Renders |
|-----------|----------|---------|
| `TextContent` | snippet, command | Syntax-highlighted code block (Shiki or similar); `language` prop drives the grammar |
| `TextContent` | prompt, note | Rendered markdown |
| `FileContent` | file, image | Image `<img>` or file download link + size badge |
| `LinkContent` | link | Clickable URL with external-link icon; optional OG preview |

The drawer passes `item.contentType` to decide which to mount — no switch logic in the drawer itself, just a map:

```ts
const CONTENT_COMPONENTS = {
  TEXT: TextContent,
  FILE: FileContent,
  URL: LinkContent,
}
```

---

## Type-specific Logic Rule

> **Type-specific display logic belongs in components, never in actions or queries.**

Actions and queries treat all items uniformly — they don't branch on type name. Only the components (primarily `ItemForm` and the content sub-components) inspect `contentType` or `itemType.name` to adjust their UI.

This keeps mutations simple and testable, and makes adding a new type a component-only change.

---

## Free-Tier Enforcement

Checked in `createItem` action (server-side):

```ts
const count = await prisma.item.count({ where: { userId } })
if (!user.isPro && count >= 50) {
  return { success: false, error: 'Free plan limit reached (50 items).' }
}
```

Pro gating for `file` and `image` types:

```ts
if (['file', 'image'].includes(itemTypeName) && !user.isPro) {
  return { success: false, error: 'File and image types require a Pro plan.' }
}
```

Both checks happen before any insert.

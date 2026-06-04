# Item Types

DevStash has 7 built-in system item types. All are stored in the `item_types` table with `isSystem: true`. Two types (`file`, `image`) are Pro-only.

---

## Types

### snippet

| Field   | Value      |
|---------|------------|
| Icon    | `Code`     |
| Color   | `#3b82f6`  |
| Color name | Blue    |
| Content | `TEXT`     |
| Pro only | No       |
| Route   | `/items/snippets` |

**Purpose:** Reusable code blocks. The primary content type for developers storing patterns, utilities, and boilerplate.

**Key fields used:**
- `content` — the code text (`@db.Text`)
- `language` — e.g. `"typescript"`, `"python"` — drives syntax highlighting
- `description` — summary of what the snippet does
- `tags` — for search/filtering

---

### prompt

| Field   | Value       |
|---------|-------------|
| Icon    | `Sparkles`  |
| Color   | `#8b5cf6`   |
| Color name | Purple   |
| Content | `TEXT`      |
| Pro only | No        |
| Route   | `/items/prompts` |

**Purpose:** AI prompt templates and system messages. Stored as plain text with optional structure (e.g. numbered instructions, placeholders like `[PASTE CODE HERE]`).

**Key fields used:**
- `content` — the prompt text (`@db.Text`)
- `description` — brief summary of the prompt's intent
- `tags` — for categorisation
- `isPinned` — commonly set for frequently-used prompts

---

### command

| Field   | Value       |
|---------|-------------|
| Icon    | `Terminal`  |
| Color   | `#f97316`   |
| Color name | Orange   |
| Content | `TEXT`      |
| Pro only | No        |
| Route   | `/items/commands` |

**Purpose:** Terminal commands and one-liners. Similar to snippet but intended for shell/CLI usage rather than source code.

**Key fields used:**
- `content` — the command string (`@db.Text`)
- `description` — what the command does
- `language` — optionally set (e.g. `"bash"`, `"shell"`)
- `isPinned` — common for frequently-run commands

---

### note

| Field   | Value        |
|---------|--------------|
| Icon    | `StickyNote` |
| Color   | `#fde047`    |
| Color name | Yellow    |
| Content | `TEXT`       |
| Pro only | No         |
| Route   | `/items/notes` |

**Purpose:** Freeform text and markdown notes. Unlike snippet/command, notes are not code — they hold prose, documentation drafts, and explanations.

**Key fields used:**
- `content` — markdown text (`@db.Text`)
- `description` — optional summary
- `tags`

---

### file

| Field   | Value    |
|---------|----------|
| Icon    | `File`   |
| Color   | `#6b7280` |
| Color name | Gray  |
| Content | `FILE`   |
| Pro only | **Yes** |
| Route   | `/items/files` |

**Purpose:** Uploaded files stored in Cloudflare R2. For context files, PDFs, ZIPs, and any non-image binary.

**Key fields used:**
- `fileUrl` — public R2 URL of the uploaded file
- `fileName` — original filename as uploaded
- `fileSize` — size in bytes
- `contentType` — always `FILE`
- `description` — optional note about the file's contents

---

### image

| Field   | Value    |
|---------|----------|
| Icon    | `Image`  |
| Color   | `#ec4899` |
| Color name | Pink  |
| Content | `FILE`   |
| Pro only | **Yes** |
| Route   | `/items/images` |

**Purpose:** Uploaded images stored in Cloudflare R2. Screenshots, diagrams, reference images.

**Key fields used:**
- `fileUrl` — public R2 URL of the uploaded image
- `fileName` — original filename
- `fileSize` — size in bytes
- `contentType` — always `FILE`
- `description` — optional caption or context

---

### link

| Field   | Value     |
|---------|-----------|
| Icon    | `Link`    |
| Color   | `#10b981` |
| Color name | Emerald |
| Content | `URL`     |
| Pro only | No       |
| Route   | `/items/links` |

**Purpose:** Bookmarked URLs — documentation sites, tools, references, and resources.

**Key fields used:**
- `url` — the destination URL
- `contentType` — always `URL`
- `description` — what the link points to
- `isFavorite` — commonly set for key reference docs

---

## Summaries

### Content classification

| ContentType | Types |
|-------------|-------|
| `TEXT` | snippet, prompt, note, command |
| `FILE` | file, image |
| `URL` | link |

The `ContentType` enum on `Item.contentType` determines which content field is populated:
- `TEXT` → `content` (and optionally `language`)
- `FILE` → `fileUrl`, `fileName`, `fileSize`
- `URL` → `url`

### Shared properties

All item types share these fields regardless of content classification:

| Field | Purpose |
|-------|---------|
| `id` | CUID primary key |
| `title` | Display name |
| `description` | Optional one-line summary |
| `userId` | Owner |
| `itemTypeId` | Foreign key to `item_types` |
| `isFavorite` | Star toggle |
| `isPinned` | Pin to top |
| `lastUsedAt` | Tracks recency |
| `createdAt` / `updatedAt` | Timestamps |
| `tags` | Many-to-many via `ItemTags` |
| `collections` | Many-to-many via `ItemCollection` |

### Display differences

| Aspect | TEXT types | FILE types | URL type |
|--------|-----------|------------|----------|
| Primary display | `content` with optional syntax highlighting | File preview / download link | Clickable URL |
| `language` used | Yes (snippet, command) | No | No |
| Drawer body | Code block or markdown renderer | File info + download | URL preview / favicon |
| Icon bg | 20% opacity hex color (`${color}20`) | Same | Same |

### Pro gating

`file` and `image` require `user.isPro = true`. In the UI, these types display a **PRO** badge in the sidebar and are sorted to the bottom of the type list. During development all types are accessible to all users regardless of `isPro`.

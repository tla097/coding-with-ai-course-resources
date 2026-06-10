# Refactoring Opportunities

Findings from codebase scan on 10/06/2026. Items marked ✅ are complete.

---

## HIGH Impact

### 1. ✅ `ItemDrawer.tsx` — 786-line component doing five different jobs

**File:** `src/components/items/ItemDrawer.tsx`

The component mixes data fetching, 8+ async/mutation handlers, read-view JSX, edit-form JSX, and a skeleton sub-component.

**Extracted:**
- `useItemDrawer` hook (`src/hooks/useItemDrawer.ts`) — all state + 9 handler functions
- `ItemDrawerReadView` (`src/components/items/ItemDrawerReadView.tsx`) — read-mode JSX
- `ItemDrawerEditForm` (`src/components/items/ItemDrawerEditForm.tsx`) — edit-mode JSX
- `ItemDrawerActionBar` (`src/components/items/ItemDrawerActionBar.tsx`) — button bar
- `DrawerSkeleton` (`src/components/items/DrawerSkeleton.tsx`) — skeleton component

---

### 2. ✅ Duplicated AI + tag logic across `NewItemDialog.tsx` and `ItemDrawer.tsx`

**Files:** `src/components/items/NewItemDialog.tsx`, `src/components/items/ItemDrawer.tsx`

`handleGenerateDescription`, `handleSuggestTags`, `handleAcceptTag`, `handleDismissTag` and the tags field JSX were near-identical in both files.

**Extracted:**
- `useAiTagSuggestions` hook (`src/hooks/useAiTagSuggestions.ts`)
- `useAiDescription` hook (`src/hooks/useAiDescription.ts`)
- `TagsField` component (`src/components/items/TagsField.tsx`)

---

### 3. ✅ `NewItemDialog.tsx` — type-driven field rendering buries the form in one giant component

**File:** `src/components/items/NewItemDialog.tsx`

Six conditionally-rendered field sections sit inside a component that also owns open/close state, form state, AI state, and submission logic.

**Extracted:**
- `ItemFormFields` (`src/components/items/ItemFormFields.tsx`) — accepts form state + AI callbacks, renders all conditional fields (title, description, language, content, URL, file upload, tags, collections)

---

### 4. ✅ `app/page.tsx` — five marketing sections with no separation

**File:** `src/app/page.tsx` (346 lines)

Hero, features grid, AI features section, CTA, and footer are all inline. `PricingSection` and `HeroVisual` are already extracted; the rest is not.

**Extracted:**
- `HeroSection` (`src/components/marketing/HeroSection.tsx`) — hero text + HeroVisual wrapper
- `FeaturesSection` (`src/components/marketing/FeaturesSection.tsx`) — features grid; `features` array defined at module level
- `AiFeaturesSection` (`src/components/marketing/AiFeaturesSection.tsx`) — AI features list + `AiCodeMockup` (`src/components/marketing/AiCodeMockup.tsx`)
- `CtaSection` (`src/components/marketing/CtaSection.tsx`) — CTA banner
- `MarketingFooter` (`src/components/marketing/Footer.tsx`) — site footer

---

## MEDIUM Impact

### 5. ✅ `CodeEditor.tsx` and `MarkdownEditor.tsx` — duplicate toolbar pattern

**Files:** `src/components/ui/CodeEditor.tsx`, `src/components/ui/MarkdownEditor.tsx`

Both render a near-identical dark toolbar (macOS dots, tab row, AI action + Copy buttons). The "Pro-gated AI button" pattern is copy-pasted in both files.

**Extract:**
- `EditorToolbar` (`src/components/ui/EditorToolbar.tsx`) — shared `bg-[#2d2d2d]` header shell with `leftSlot` / `rightSlot` props
- `EditorTabButton` (`src/components/ui/EditorTabButton.tsx`) — repeated `text-[11px] px-2 py-0.5 rounded` tab button
- `ProAiButton` (`src/components/ui/ProAiButton.tsx`) — Pro-gated button (active Sparkles vs disabled Crown)
- `useCopyToClipboard` hook (`src/hooks/useCopyToClipboard.ts`) — `copied` state + `setTimeout` reset, duplicated in both editors and several other places

---

### 6. ✅ `UpgradePage.tsx` duplicates pricing cards from `PricingSection.tsx`

**Files:** `src/components/upgrade/UpgradePage.tsx`, `src/components/marketing/PricingSection.tsx`

Free/Pro pricing cards, feature lists, and billing toggle are structurally identical in both files. `FREE_FEATURES` and `PRO_FEATURES` arrays are defined separately in each.

**Extract:**
- Move `FREE_FEATURES` and `PRO_FEATURES` arrays to `src/lib/constants.ts`
- `PricingCard` (`src/components/shared/PricingCard.tsx`) — shared card component used by both
- `BillingToggle` (`src/components/shared/BillingToggle.tsx`) — monthly/yearly switch with "Save 25%" badge

---

### 7. ✅ `lib/db/items.ts` — `itemDetail` select shape repeated three times

**File:** `src/lib/db/items.ts`

`getItemById`, `updateItem`, and `createItem` each specified an identical 14-field Prisma `select` object inline.

**Extracted:**
- `itemDetailSelect` constant defined once at module level, referenced in all three queries

---

### 8. ✅ `actions/ai.ts` — auth + pro-check + rate-limit preamble repeated in every function

**File:** `src/actions/ai.ts`

Every exported function performs the same four-step prologue: auth check, Pro check, schema parse, rate limit check. Content sanitisation (`.trim().slice(0, MAX).replace(...)`) is also repeated in three of the four functions.

**Extract (internal to file, no new file needed):**
- `sanitiseContent(raw: string): string` helper
- `requireProUser()` helper — handles auth + Pro check, returns session or typed error

---

## LOW Impact

### 9. `HeroVisual.tsx` — 110-line `useEffect` mixes physics, resize, and event binding

**File:** `src/components/marketing/HeroVisual.tsx` (lines 24–149)

Single `useEffect` initialises particles, defines resize handler, defines the per-frame `step` function (repel physics + boundary bounce + canvas rendering), and registers three event listeners.

**Extract:**
- `useParticleAnimation` hook (`src/hooks/useParticleAnimation.ts`) — accepts `canvasRef` and `mouseRef`, owns the full `useEffect`
- Within the hook, split `step` into a `drawParticle(ctx, p)` helper

---

### 10. `FavoritesView.tsx` — sort state duplicated for items and collections

**File:** `src/components/favorites/FavoritesView.tsx` (lines 62–115)

`handleItemSort` / `handleColSort` are structurally identical. The `useMemo` sort logic follows the same toggle-direction pattern for both sections.

**Extract:**
- `useSortState` hook (`src/hooks/useSortState.ts`) — generic hook: `useSortState<K>(defaultKey, defaultDir?)` returning `{ key, dir, toggle }`

---

### 11. `DashboardShell.tsx` — sidebar persistence and keyboard shortcut inline

**File:** `src/components/layout/DashboardShell.tsx` (lines 35–57)

`useLayoutEffect` for sidebar persistence and `useEffect` for `Ctrl+K` shortcut are simple enough to extract.

**Extract:**
- `usePersistentBoolean` hook (`src/hooks/usePersistentBoolean.ts`) — boolean state backed by `localStorage`
- Keyboard shortcut logic into a generic `useKeyboardShortcut` hook

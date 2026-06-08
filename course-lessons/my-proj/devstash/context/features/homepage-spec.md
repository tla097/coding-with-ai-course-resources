# Marketing Homepage

## Overview

Build the marketing homepage at `src/app/page.tsx` based on the prototype at `prototypes/homepage/`. Authenticated users should be redirected to `/dashboard`. The page is a public, statically rendered marketing page — no auth required.

## Architecture

The page is a server component (`src/app/page.tsx`) that composes a mix of server and client child components. Only sections with interactivity need `'use client'`.

| Section | Component | Type | Reason |
|---|---|---|---|
| Navbar | `Navbar.tsx` | Client | Scroll-based background, mobile menu toggle |
| Hero Text | Inline in page | Server | Static content |
| Hero Visual | `HeroVisual.tsx` | Client | Canvas animation, mouse repel effect |
| Features Grid | Inline in page | Server | Static content |
| AI Section | Inline in page | Server | Static content |
| Pricing | `PricingSection.tsx` | Client | Monthly/yearly toggle state |
| CTA | Inline in page | Server | Static content |
| Footer | Inline in page | Server | Static content |

## File Structure

```
src/
  app/
    page.tsx                          # Homepage (server, auth redirect)
  components/
    marketing/
      Navbar.tsx                      # Sticky nav, scroll bg, mobile menu
      HeroVisual.tsx                  # Chaos canvas + arrow + dashboard mockup
      PricingSection.tsx              # Pricing cards with monthly/yearly toggle
```

## Requirements

### Auth Redirect

Check session at the top of `page.tsx`. If authenticated, `redirect('/dashboard')`.

### Navbar (`Navbar.tsx`) — Client

- Sticky top, adds background + shadow on scroll (no bg when at top of page)
- Logo: `⚡ DevStash` — links to `#` (top of page)
- Nav links: "Features" → `#features`, "Pricing" → `#pricing` (smooth scroll)
- "Sign In" ghost button → `/sign-in`
- "Get Started" primary button → `/register`
- Mobile: hamburger toggles a dropdown with all nav links + CTA buttons
- Use Tailwind only — no ShadCN components needed here

### Hero Text — Server

- Badge: "Developer Knowledge Hub"
- Headline: "Stop Losing Your Developer Knowledge" with gradient on second line
- Subtext: matches prototype copy
- "Get Started Free" primary button → `/register`
- "See Features" outline button → `#features`

### Hero Visual (`HeroVisual.tsx`) — Client

- Three-column layout: chaos box → animated arrow → dashboard mockup
- Chaos box: canvas animating labelled bubbles (Snippets, Prompts, Commands, Notes, Links, Files) that bounce and repel from mouse cursor
- Arrow: pulsing SVG arrow between panels
- Dashboard mockup: static HTML/CSS replica of the prototype's mock sidebar + cards — use Tailwind classes, no canvas
- Responsive: stacks vertically on mobile, hides chaos box on small screens

### Features Grid — Server

Six feature cards in a responsive grid (2 cols tablet, 3 cols desktop):

| Feature | Icon (Lucide) | Accent Color |
|---|---|---|
| Code Snippets | `Code2` | `#3b82f6` |
| AI Prompts | `Sparkles` | `#f59e0b` |
| Instant Search | `Search` | `#a855f7` |
| Commands | `Terminal` | `#06b6d4` |
| Files & Docs | `FileText` | `#64748b` — add Pro badge |
| Collections | `Monitor` | `#6366f1` |

Section id: `features`.

### AI Section — Server

Two-column layout (stacks on mobile):
- Left: "✨ Pro Feature" pill, heading, sub-copy, 4 checklist items (Auto-tag, AI Summary, Explain This Code, Prompt Optimizer)
- Right: code editor mockup — macOS window dots, filename `useDebounce.ts`, syntax-highlighted code block (`<pre>` with Tailwind `font-mono`), AI tags strip at bottom

Use the same code snippet from the prototype. Syntax coloring via inline `<span>` classes (matches prototype approach — no external highlighter needed here).

### Pricing (`PricingSection.tsx`) — Client

Section id: `pricing`.

- Monthly/yearly toggle (controlled state)
- Free card: $0/forever, feature list with check/cross icons, "Get Started Free" outline button → `/register`
- Pro card: highlighted with "Most Popular" badge
  - Monthly: $8/month
  - Yearly: $6/month (billed $72/year) — show "Save 25%" badge on yearly label
  - "Start Pro Trial" primary button → `/register`
- Feature lists match the prototype exactly

### CTA Section — Server

- Heading + subtext from prototype
- "Get Started Free →" primary button → `/register`
- Subtle gradient/accent background to distinguish from surrounding sections

### Footer — Server

- Brand column: logo + tagline
- Three link columns: Product (Features `#features`, Pricing `#pricing`, Changelog `#`), Company (About `#`, Blog `#`, Contact `#`), Legal (Privacy `#`, Terms `#`)
- Bottom bar: copyright with current year via `new Date().getFullYear()`

## Styling Guidelines

- Dark background matching the rest of the app (`bg-background`)
- Section padding: `py-20` or `py-24`
- Max content width: `max-w-6xl mx-auto px-4`
- Primary buttons: use ShadCN `Button` (default variant)
- Ghost/outline buttons: ShadCN `Button` (`ghost` / `outline` variant)
- Pro badge: ShadCN `Badge` with amber/yellow styling
- Gradient text on hero headline: CSS `bg-gradient-to-r` + `bg-clip-text text-transparent`
- Fade-in-up animations: use Tailwind `animate-` or a simple CSS keyframe in `globals.css` — keep it minimal

## References

- `prototypes/homepage/index.html`
- `prototypes/homepage/styles.css`
- `prototypes/homepage/script.js`
- `context/project-overview.md` — item types, colors, URL structure

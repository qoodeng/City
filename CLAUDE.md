# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What Is This?

C.I.T.Y. (Christian's Issue Tracker Yellow) — a Linear-like issue tracker for solo use with a black and yellow crash test dummy theme. Runs as a Next.js web app and optionally as an Electron desktop app.

## Tech Stack

- **Next.js 16** (App Router) + TypeScript + React 19
- **Tailwind CSS v4** (`@theme inline` in globals.css, NOT tailwind.config.ts)
- **shadcn/ui** (components in `src/components/ui/` — do not edit manually)
- **SQLite** + **Drizzle ORM** via `better-sqlite3` (WAL mode, `city.db` at project root)
- **zustand** for client state with optimistic updates
- **nuqs** for URL-synced filter state
- **@dnd-kit** for drag-and-drop board view
- **TipTap** for rich text editing
- **Electron** for optional desktop packaging

## Commands

```bash
pnpm dev              # Start dev server (localhost:3000)
pnpm build            # Production build
pnpm lint             # ESLint
pnpm db:push          # Push schema changes to SQLite (drizzle-kit push)
pnpm db:seed          # Seed default labels + counter row
pnpm db:studio        # Open Drizzle Studio

# Testing
pnpm test             # Run vitest unit tests (single run)
pnpm test:watch       # Run vitest in watch mode
pnpm test:coverage    # Run vitest with coverage
pnpm test -- src/lib/stores/__tests__/issue-store.test.ts   # Run a single test file
pnpm test:e2e         # Run Playwright e2e tests (starts dev server automatically)
pnpm test:e2e:ui      # Playwright with interactive UI

# Electron
pnpm electron:dev     # Dev server + Electron shell
pnpm dist             # Build Electron distributable (scripts/build-electron.sh)
```

## Path Alias

`@/*` maps to `./src/*`

## Architecture

### Database

- Schema in `src/lib/db/schema.ts` — 5 tables: `projects`, `issues`, `labels`, `issue_labels` (junction), `counters`
- FTS5 virtual table `issues_fts` for full-text search on issue title/description, kept in sync via triggers
- Issue numbering: atomic counter in `counters` table, incremented inside a transaction
- DB singleton in `src/lib/db/index.ts` with WAL mode + foreign keys pragma

### API Routes

- Next.js 16 route params are `Promise<{ id: string }>` — must `await params`
- Issues enriched with labels + project at the API level (not via Drizzle relations)
- Parallel DB queries with `Promise.all()` wherever possible
- Allowlisted fields in PATCH to prevent arbitrary writes
- Soft-delete pattern: `restore/` routes for issues, projects, and labels
- `search/` route uses FTS5 for full-text issue search
- `dashboard/` route aggregates stats for the dashboard view
- `batch/` route for bulk issue operations

### Stores (zustand)

- **issue-store**: Optimistic updates — saves prev state, applies change, reverts on API failure
- **ui-store**: sidebarCollapsed, commandPaletteOpen, createIssueDialogOpen, viewMode, selectedIssueIds, focusedIssueId
- **label-store** / **project-store**: Standard CRUD
- **undo-store**: Capped stack (50 entries, 10min expiry) for undo across create/update/delete on any entity
- **sync-store**: Tracks pending API request count + last error for sync status indicator
- **keyboard-store**: Key buffer with 500ms timeout for vim-style multi-key sequences + last action repeat

### Client Components

- Heavy components (`IssueBoard`, `RichTextEditor`) use `next/dynamic` with `ssr: false`
- nuqs hooks require `<Suspense>` boundary wrapping the page component
- `optimizePackageImports` in next.config.ts for lucide-react and @dnd-kit

### Enums

- **Status**: backlog, todo, in_progress, done, cancelled
- **Priority**: urgent, high, medium, low, none

### Theme

- Tailwind v4 custom theme via `@theme inline` in `src/app/globals.css`
- Colors: `city-yellow` (#FFD700), `city-black` (#0A0A0A), surfaces (#1A1A1A, #1F1F1F, #2A2A2A)
- Hazard stripe CSS patterns for decorative accents

## Testing

### Unit Tests (Vitest + jsdom)

- Test setup in `src/test/setup.ts` — mocks `next/navigation`, `next/dynamic`, and `sonner`
- `src/test/db.ts`: `createTestDb()` / `cleanupTestDb()` — creates isolated temp SQLite databases (including FTS5 tables and triggers) for API route tests
- `src/test/api-helpers.ts`: `createRequest()`, `createParams()`, `parseResponse()` — helpers for testing Next.js API route handlers directly
- `src/test/render.tsx` / `test-wrapper.tsx` — custom render with providers for component tests
- API tests import route handlers and call them with `createRequest`/`createParams`, using a test DB injected via module mock
- Component tests use `@testing-library/react` + `@testing-library/user-event`

### E2E Tests (Playwright)

- Test files in `e2e/` directory
- Auto-starts dev server on localhost:3000
- Chromium only, HTML reporter

## React Performance Rules

Follow these when writing or modifying React/Next.js code. Prioritized by impact.

### CRITICAL — Eliminate Waterfalls
- **Always `Promise.all()`** for independent async operations in API routes and server code
- **Start promises early, await late** — if you know `projectId` from the request body, don't wait for another query to start the project fetch
- **Defer `await`** past early-return branches — don't fetch data before checking if you even need it

### CRITICAL — Bundle Size
- **`next/dynamic` with `ssr: false`** for heavy components (editors, charts, board)
- **`optimizePackageImports`** in next.config.ts for barrel-heavy libs (lucide-react, @dnd-kit)
- **Defer non-critical libs** (analytics, logging) — load after hydration

### HIGH — Zustand Selectors
- **Never subscribe to a full array** just to derive a scalar — use `useStore((s) => s.items.filter(...).length)` returning a primitive
- **Use `useStore((s) => s.someAction)`** to get a single stable function instead of destructuring the whole store
- **Unmount heavy subscribers** — if a component only needs store data when visible (e.g. command palette), split into wrapper + inner so the inner unmounts and unsubscribes when hidden
- **Selector returns must be referentially stable** — primitives (number, string, boolean) are safe; new objects/arrays trigger re-renders unless using `useShallow`

### MEDIUM — Rendering
- **`content-visibility: auto`** on repeated list items with known height (`contain-intrinsic-size`)
- **Hoist static JSX** (loading skeletons, empty states) to module-level `const` to avoid re-creation
- **Wrap animated SVGs** in a `<div>` — apply `animate-spin`/transforms to the wrapper, not the `<svg>`, for GPU acceleration
- **Explicit conditionals** — use ternary `count > 0 ? <X/> : null` not `count && <X/>` (avoids rendering `0`)

### LOW — JS Micro-optimizations
- **Index Maps** — build `new Map(items.map(i => [i.id, i]))` for repeated lookups instead of `.find()` in loops
- **Combine iterations** — one `for` loop instead of chained `.filter().filter().map()`
- **`toSorted()`** not `.sort()` — never mutate arrays from props/state

## Gotchas

- `better-sqlite3` needs `pnpm.onlyBuiltDependencies` in package.json
- Tailwind v4 uses `@theme inline` directive, NOT `tailwind.config.ts`
- nuqs pages need `<Suspense>` boundaries or you get hydration errors
- Don't edit files in `src/components/ui/` — those are shadcn-managed
- Next.js `output: "standalone"` is set in next.config.ts for Electron packaging

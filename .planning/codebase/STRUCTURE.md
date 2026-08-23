# Codebase Structure

**Analysis Date:** 2026-08-23

## Directory Layout

```
ow2countdown/
├── src/
│   ├── routes/                  # SvelteKit file-based routing
│   │   ├── (app)/               # Layout group for main app routes
│   │   │   ├── +layout.svelte   # App layout with header/footer
│   │   │   ├── +page.svelte     # Homepage (event list)
│   │   │   ├── about/           # About page
│   │   │   ├── admin/           # Admin-only routes (protected)
│   │   │   ├── event/
│   │   │   │   ├── new/         # Create event form
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── [slug]/  # Event detail page
│   │   │   │   │   ├── edit/    # Edit event form
│   │   │   │   │   └── destroy/ # Delete event action
│   │   │   ├── login/           # Login page
│   │   │   ├── logout/          # Logout action
│   │   │   └── privacy-policy/  # Privacy policy page
│   │   ├── api/                 # API routes (REST endpoints)
│   │   │   ├── events/+server.ts    # GET all events (with filters)
│   │   │   ├── event/[id]/+server.ts # GET single event
│   │   ├── discord/+server.ts   # Discord webhook redirect
│   │   ├── feed.xml/+server.ts  # RSS feed generator
│   │   ├── sitemap.xml/+server.ts # XML sitemap for SEO
│   │   ├── +layout.server.ts    # Root server layout (auth)
│   │   └── +error.svelte        # Error page
│   │
│   ├── lib/                     # Reusable code & components
│   │   ├── client.ts            # Supabase browser client
│   │   ├── db.ts                # Supabase server client
│   │   ├── types.d.ts           # Type definitions
│   │   ├── database.types.ts    # Supabase-generated DB types
│   │   ├── webVitals.ts         # Vercel analytics integration
│   │   ├── components/          # Reusable Svelte components
│   │   │   ├── _timer.svelte    # Countdown timer display
│   │   │   ├── _copy_time_*.svelte # Time-to-clipboard utilities
│   │   │   ├── _progress_bar.svelte # Event progress visualization
│   │   │   ├── _dropdown*.svelte # Dropdown UI components
│   │   │   ├── event/
│   │   │   │   └── _form.svelte # Event CRUD form (new/edit)
│   │   │   ├── form/
│   │   │   │   └── Tags.svelte  # Tag input component
│   │   │   └── markdown/        # Markdown renderers
│   │   │       ├── Heading.svelte
│   │   │       ├── Image.svelte
│   │   │       └── OW2CLink.svelte
│   │   ├── svgs/                # SVG icon components
│   │   │   ├── OW2CountdownLogo.svelte
│   │   │   ├── DiscordIcon.svelte
│   │   │   └── GitHubIcon.svelte
│   │   └── utils/               # Utility functions
│   │       ├── event_helpers.ts    # Event slug, date logic
│   │       ├── string_helpers.ts   # Markdown parsing
│   │       ├── date_format_helpers.ts # Discord timestamps, etc.
│   │       └── WidthLimiter.svelte   # Responsive width component
│   │
│   ├── stores/                  # Svelte reactive stores
│   │   └── dates.ts             # Event list store with polling logic
│   │
│   ├── app.d.ts                 # TypeScript app types
│   ├── hooks.server.ts          # SvelteKit server middleware
│   └── app.css                  # Global styles (Tailwind)
│
├── static/                      # Static assets (robots.txt, etc.)
│
├── .planning/                   # Codebase documentation
│   └── codebase/
│
├── package.json                 # Node dependencies
├── svelte.config.js             # SvelteKit config
├── vite.config.js               # Vite build config
├── tsconfig.json                # TypeScript config
├── tailwind.config.cjs          # Tailwind CSS config
├── postcss.config.cjs           # PostCSS config
├── .eslintrc.cjs                # ESLint config
├── .npmrc                       # Yarn workspace config
├── .nvmrc                       # Node version requirement
└── README.md                    # Project documentation
```

## Directory Purposes

**`src/routes/`:**
- Purpose: File-based routing (SvelteKit pattern)
- Contains: Pages (.svelte), API endpoints (+server.ts), server loaders/actions (+page.server.ts, +layout.server.ts)
- Key files: `+page.svelte` (pages), `+server.ts` (API handlers), `+page.server.ts` (form actions)

**`src/routes/(app)/`:**
- Purpose: Layout group for authenticated app routes
- Contains: All user-facing pages with shared header/footer layout
- Key files: `+layout.svelte` (shared UI), navigation links to home/about/admin

**`src/routes/api/`:**
- Purpose: REST API endpoints
- Contains: GET/POST handlers for event CRUD
- Key files: `events/+server.ts` (list), `event/[id]/+server.ts` (detail)

**`src/lib/`:**
- Purpose: Reusable, non-route code
- Contains: Components, utilities, stores, type definitions
- Key files: `components/`, `stores/dates.ts`, `utils/`

**`src/lib/components/`:**
- Purpose: Reusable Svelte UI components
- Contains: Timer display, dropdowns, forms, markdown renderers
- Organization: Prefixed with `_` for internal utilities; subdirs for categories (event, form, markdown, svgs)

**`src/lib/utils/`:**
- Purpose: Pure functions and helpers
- Contains: Date logic, string manipulation, DOM utilities
- Key patterns: All exported as named functions; no side effects

**`src/stores/`:**
- Purpose: Svelte reactive state containers
- Contains: Single `dates.ts` store with polling and backoff logic
- Pattern: Writable stores with custom methods

## Key File Locations

**Entry Points:**
- `src/routes/+layout.server.ts`: Root server layout, auth setup
- `src/routes/(app)/+layout.svelte`: App layout, header/footer, navigation
- `src/routes/(app)/+page.svelte`: Homepage with event list

**Configuration:**
- `svelte.config.js`: SvelteKit adapter (Vercel)
- `vite.config.js`: Build config, SSR settings, env vars
- `tsconfig.json`: TypeScript config
- `tailwind.config.cjs`: CSS utility classes

**Core Logic:**
- `src/lib/db.ts`: Supabase server client
- `src/lib/client.ts`: Supabase browser client
- `src/stores/dates.ts`: Event list store, polling logic
- `src/lib/utils/event_helpers.ts`: Event manipulation (slug, date, state)

**Testing:**
- No test files found; testing framework not configured

## Naming Conventions

**Files:**
- Routes: `+page.svelte` (pages), `+page.server.ts` (server actions), `+layout.svelte` (layouts), `+server.ts` (API endpoints), `+error.svelte` (error page)
- Components: Leading underscore for internal utility components (`_timer.svelte`, `_dropdown.svelte`); no prefix for page-level components
- Utilities: Snake_case in TypeScript (`event_helpers.ts`), camelCase in functions (`eventEffectiveDate()`)
- API routes: Plural for collections (`/api/events`), singular for resources (`/api/event/[id]`)

**Directories:**
- Route groups: Parentheses for layout grouping (`(app)`, no URL segment)
- Dynamic routes: Brackets for parameters (`[id]`, `[slug]`)
- Component categories: Plural when containing multiple related components (`components/`, `svgs/`)
- Feature grouping: `event/`, `form/`, `markdown/` subdirs organize related components

**Variables & Functions:**
- camelCase: Functions (`eventEffectiveDate()`, `entriesToEventObject()`), variables (`displayDates`, `timeRemainingInSeconds`)
- CONSTANT_CASE: Env vars (`PUBLIC_SUPABASE_URL`, `SUPABASE_TABLE_NAME`), API constants (`MIN_BACKOFF`, `MAX_PAGE_SIZE`)
- Types: PascalCase (`CountdownDate`, `CountdownDateContainer`)

## Where to Add New Code

**New Feature (e.g., Event Tags System):**
- Primary code: `src/lib/components/form/Tags.svelte` (component), `src/lib/utils/string_helpers.ts` (parsing)
- Page updates: `src/routes/(app)/event/[id]/[slug]/+page.svelte` (display tags)
- API updates: `src/routes/api/events/+server.ts` (filter by tags)
- Form updates: `src/lib/components/event/_form.svelte` (tag input)
- Store updates: `src/stores/dates.ts` if state management needed

**New Component/Module:**
- Implementation: `src/lib/components/[category]/ComponentName.svelte` (Svelte) or `src/lib/utils/helper.ts` (TypeScript)
- If internal utility: Prefix with underscore (`_componentName.svelte`)
- If feature-specific: Create subdirectory under `components/` (e.g., `components/notifications/`)

**Utilities:**
- Shared helpers: `src/lib/utils/` (one file per concern: `event_helpers.ts`, `string_helpers.ts`, `date_format_helpers.ts`)
- Constants: Declare at top of `+server.ts` files or centralize in utils

**API Endpoints:**
- New resource: `src/routes/api/[resource]/+server.ts`
- New action: `src/routes/api/[resource]/[id]/+server.ts` with method checks (`GET`, `POST`, etc.)
- Filters & pagination: Pass via search params, extract in handler with `request.url.searchParams`

**New Page:**
- Page content: `src/routes/(app)/[path]/+page.svelte`
- Server-side logic: `src/routes/(app)/[path]/+page.server.ts`
- Layout overrides: `src/routes/(app)/[path]/+layout.svelte` if custom layout needed

**Server Middleware:**
- Global hooks: Add to `src/hooks.server.ts` via `sequence()`
- Route guards: Create `+layout.server.ts` at appropriate level (e.g., `src/routes/(app)/admin/+layout.server.ts`)

## Special Directories

**`.planning/codebase/`:**
- Purpose: Codebase documentation (generated by GSD mapper)
- Generated: Yes (created by `/gsd-map-codebase`)
- Committed: Yes (tracked in git)

**`.svelte-kit/`:**
- Purpose: SvelteKit build artifacts and generated types
- Generated: Yes (built by SvelteKit)
- Committed: No (in .gitignore)

**`node_modules/`:**
- Purpose: Installed npm dependencies
- Generated: Yes (from package.json)
- Committed: No (in .gitignore)

**`static/`:**
- Purpose: Static assets served at root (robots.txt, favicon, etc.)
- Generated: No
- Committed: Yes

**`.vercel/`:**
- Purpose: Vercel deployment configuration
- Generated: Yes (by Vercel CLI or web dashboard)
- Committed: Yes (contains deployment settings, not secrets)

## Import Path Aliases

SvelteKit provides `$lib/` alias resolving to `src/lib/`.

**Usage:**
- `import { dates } from "$lib/stores/dates"` (store)
- `import type { CountdownDate } from "$lib/types"` (type)
- `import Timer from "$lib/components/_timer.svelte"` (component)

No custom path aliases configured; all imports use `$lib/` or relative paths.

---

*Structure analysis: 2026-08-23*

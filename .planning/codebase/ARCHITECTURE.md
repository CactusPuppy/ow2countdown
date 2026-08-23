<!-- refreshed: 2026-08-23 -->
# Architecture

**Analysis Date:** 2026-08-23

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                          Browser (Client)                                │
│  Pages, Components, Stores (`src/routes/`, `src/lib/components/`)       │
│  State: Svelte stores for countdown data                                │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                ┌──────────────────┼──────────────────┐
                │                  │                  │
                ▼                  ▼                  ▼
         ┌────────────┐      ┌────────────┐     ┌─────────┐
         │ API Route  │      │ Supabase   │     │Analytics│
         │ /api/*     │      │Auth + DB   │     │ (Vercel)│
         │`src/routes│      │ SSR Client │     │         │
         │/api/*`    │      │  & Server  │     │         │
         └────────────┘      └────────────┘     └─────────┘
                │                  │
                └──────────────────┼──────────────────┐
                                   │                  │
                            ┌──────▼──────┐    ┌─────▼────┐
                            │   Supabase   │    │ Vercel   │
                            │  PostgreSQL  │    │Deployment│
                            │  upcoming-   │    │  & Hosting│
                            │   events     │    │          │
                            │   table      │    │          │
                            └──────────────┘    └──────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| **Router/Pages** | Request handling, layout, data loading | `src/routes/` |
| **Server Actions** | Form submission, data mutation | `+page.server.ts`, `+layout.server.ts` |
| **API Routes** | REST endpoints for data fetch/push | `src/routes/api/` |
| **Stores** | Client-side state management | `src/stores/dates.ts` |
| **Components** | Reusable UI building blocks | `src/lib/components/` |
| **Utils** | Date, string, event logic helpers | `src/lib/utils/` |
| **Auth** | Supabase authentication setup | `src/hooks.server.ts`, `src/lib/client.ts`, `src/lib/db.ts` |
| **Feed/Sitemap** | XML generation for RSS/SEO | `src/routes/feed.xml/`, `src/routes/sitemap.xml/` |

## Pattern Overview

**Overall:** Server-Side Rendering (SSR) with client-side interactivity using SvelteKit's hybrid approach.

**Key Characteristics:**
- Authentication via Supabase with session-based cookie handling
- Server-rendered HTML for SEO and initial page load
- Client-side store for real-time countdown updates
- API routes for CRUD operations with server-side validation
- Form actions for handling data mutations
- Parameterized routes for event detail pages and admin screens

## Layers

**Presentation Layer:**
- Purpose: Render UI and handle user interaction
- Location: `src/routes/`, `src/lib/components/`
- Contains: Svelte pages, layouts, and components
- Depends on: Stores, utils, server data
- Used by: Browser

**Data Access Layer:**
- Purpose: Fetch and cache event data, manage state
- Location: `src/stores/dates.ts`, `src/routes/+page.svelte`
- Contains: Svelte stores with backoff retry logic
- Depends on: API routes
- Used by: Presentation layer

**API Layer:**
- Purpose: RESTful endpoints for data operations
- Location: `src/routes/api/`
- Contains: GET/POST/PUT/DELETE handlers
- Depends on: Supabase client
- Used by: Client stores, pages, server actions

**Server Layer:**
- Purpose: Authentication, form processing, authorization
- Location: `src/hooks.server.ts`, `src/routes/+page.server.ts`, `src/routes/(app)/event/*/+page.server.ts`
- Contains: Middleware, route guards, form actions
- Depends on: Supabase server client
- Used by: SvelteKit framework

**Database Layer:**
- Purpose: Persistent data storage
- Location: Supabase PostgreSQL (remote)
- Contains: `upcoming-events` table with event metadata
- Depends on: Nothing (external)
- Used by: API layer, server layer

## Data Flow

### Primary Request Path (Homepage Load)

1. **Initial Page Request** (`src/routes/(app)/+layout.svelte`)
   - Server renders layout, injects auth context via `+layout.server.ts`
   - Supabase hook creates session-aware client

2. **Component Mounting** (`src/routes/(app)/+page.svelte`)
   - `onMount()` calls `dates.requestUpdate()` to fetch initial events

3. **Data Fetch** (`src/stores/dates.ts` → `/api/events`)
   - Client calls GET `/api/events` with optional filters
   - Server queries Supabase table `upcoming-events`
   - Returns array of `CountdownDate` objects

4. **Store Update**
   - Data stored in reactive Svelte store
   - Component reactivity triggers UI render
   - Timer interval updates countdown display every 100ms

### Event CRUD Flow

**Create:**
1. User navigates to `/event/new` (requires auth)
2. Form rendered with `EventForm.svelte` and optional localStorage draft
3. Form submit → `+page.server.ts` action
4. Action validates title, processes form data via `entriesToEventObject()`
5. Supabase insert with user context
6. Redirect to event detail page

**Read:**
1. User accesses `/event/[id]/[slug]`
2. Page load calls `/api/event/[id]` for event data
3. Slug validated against title slug; redirect if mismatch
4. Event rendered in detail component

**Update:**
1. Authorized user accesses `/event/[id]/edit`
2. Form prefilled with event data via `setEventData()`
3. Form submit → `+page.server.ts` action
4. Action updates event in Supabase
5. Redirect to event detail

**Delete:**
1. Authorized user accesses `/event/[id]/destroy`
2. Confirmation form → action
3. Action deletes from Supabase
4. Redirect to homepage

### Secondary Flow: State Polling & Backoff

1. `updateDates()` checks for new/updated events every 60s (on success)
2. On error, backoff increases 10→15→30→60s with variance
3. `nextAttemptMarker` displays countdown to next retry
4. `updateLocked` prevents concurrent requests

**State Management:**
- Homepage store (`dates.ts`) holds array of events
- `.errored` flag indicates fetch failure state
- Backoff algorithm uses exponential increase with jitter

## Key Abstractions

**CountdownDate:**
- Purpose: Type-safe event representation
- Examples: `src/lib/types.d.ts`, `src/lib/database.types.ts`
- Pattern: TypeScript interface mapping Supabase table row

**Event Helpers:**
- Purpose: Reusable event logic (slug generation, date comparison)
- Examples: `src/lib/utils/event_helpers.ts`
- Pattern: Pure functions (`titleToSlug()`, `eventEffectiveDate()`, `isEventHappeningNow()`)

**Svelte Stores:**
- Purpose: Reactive state container with subscribe pattern
- Examples: `src/stores/dates.ts`
- Pattern: Writable store with custom `requestUpdate()` method

**Route Guards:**
- Purpose: Enforce authentication for protected routes
- Examples: `src/hooks.server.ts` (authGuard), `src/routes/(app)/admin/+layout.server.ts`
- Pattern: Middleware checking `event.locals.user`

**Form Actions:**
- Purpose: Handle POST data without API calls
- Examples: `src/routes/(app)/event/new/+page.server.ts`
- Pattern: SvelteKit `Actions` export with form data processing

## Entry Points

**Root Entry:**
- Location: `src/routes/+layout.server.ts`
- Triggers: Every request
- Responsibilities: Load user session, set up Supabase context

**App Layout:**
- Location: `src/routes/(app)/+layout.svelte`
- Triggers: Navigation to any route in `(app)` group
- Responsibilities: Render header, footer, auth UI, web vitals tracking

**Homepage:**
- Location: `src/routes/(app)/+page.svelte`
- Triggers: GET `/` or `/event`
- Responsibilities: Display event list, polling, countdown updates

**API Entry Points:**
- `/api/events` — GET event list with filters
- `/api/event/[id]` — GET single event
- `/discord` — GET Discord webhook redirect
- `/feed.xml` — GET RSS feed
- `/sitemap.xml` — GET XML sitemap

## Architectural Constraints

- **Threading:** Single-threaded event loop (JavaScript). Polling handled via `setInterval()` and `setTimeout()`.
- **Global state:** Supabase auth session stored in cookies and event.locals; dates store is module-level singleton.
- **Circular imports:** None detected; clear parent-child dependency in routes hierarchy.
- **Client-server:** Form actions run server-side; stores run client-side; SSR handles both.
- **Date handling:** All dates stored as ISO strings; `date-fns` for manipulation; client displays in user timezone.
- **Backoff limits:** Exponential backoff capped at 60s; prevents API hammering on outages.

## Anti-Patterns

### Tightly Coupled Test Data

**What happens:** Events are queried directly from production Supabase table in preview/dev deployments.
**Why it's wrong:** Test queries may return stale production data; no test isolation.
**Do this instead:** Use environment-based table selection or separate test database credentials via `.env.local`.

### Missing Validation on Update

**What happens:** `+page.server.ts` edit action validates title but doesn't validate date format before Supabase insert.
**Why it's wrong:** Invalid ISO strings fail at database layer with cryptic errors.
**Do this instead:** Pre-validate date format with `parseISO()` in `entriesToEventObject()` before DB call.

### Unhandled Client-Side Promise Rejections

**What happens:** `updateDates()` in `dates.ts` catches fetch errors but relies on `.catch()` without explicit error boundaries in components.
**Why it's wrong:** Component may reference `$dates.errored` after it's cleared, leading to UI glitches.
**Do this instead:** Add explicit error state machine in store (e.g., "loading" | "success" | "error").

## Error Handling

**Strategy:** Try-catch at API boundary; error flags in stores for UI feedback.

**Patterns:**
- API errors throw SvelteKit `error()` with status code
- Server actions return `fail()` with 4xx code
- Store .catch() sets `.errored` flag for UI display
- Supabase errors logged to console; generic message shown to user

## Cross-Cutting Concerns

**Logging:** `console.log()` and `console.error()` in stores; browser DevTools access.

**Validation:** 
- Title required in form actions
- Date format validated by `parseISO()` throwing
- Priority integer parsed with fallback to 0

**Authentication:** 
- Supabase auth via SSR cookie flow
- Session validated on every request via `safeGetSession()`
- Protected routes redirect unauthenticated users to `/` or `/login`

---

*Architecture analysis: 2026-08-23*

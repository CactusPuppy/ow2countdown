# External Integrations

**Analysis Date:** 2026-08-23

## APIs & External Services

**Database & Backend:**
- Supabase PostgreSQL - Primary data storage for events
  - SDK/Client: `@supabase/supabase-js` 2.52.0, `@supabase/ssr` 0.6.1
  - Configuration: `src/lib/db.ts` (server client), `src/lib/client.ts` (browser client)
  - Authentication: JWT-based session auth via cookies

**Analytics & Monitoring:**
- Vercel Analytics - Web performance metrics tracking
  - SDK/Client: `@vercel/analytics` 2.0.1
  - Integration: `src/routes/+layout.ts` (injectAnalytics), `src/lib/webVitals.ts` (Core Web Vitals)
  - Endpoint: `https://vitals.vercel-analytics.com/v1/vitals`
  - Environment: `VERCEL_ANALYTICS_ID`

**Community:**
- Discord - Community server redirect
  - Purpose: Link to project's Discord server
  - Endpoint: `https://discord.gg/Gesga8VwbK`
  - Implementation: `src/routes/discord/+server.ts` (HTTP redirect)

## Data Storage

**Databases:**
- Supabase PostgreSQL
  - Connection: Configured via `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` (public), `SUPABASE_SERVICE_KEY` (private)
  - Client: `@supabase/supabase-js` with `createClient()` for server, `createBrowserClient()` for browser
  - Table: Configurable via `SUPABASE_TABLE_NAME` environment variable
  - Authentication: Email/password via Supabase Auth, session managed in cookies

**File Storage:**
- Local filesystem only - No cloud file storage integration detected

**Caching:**
- HTTP cache headers only - Cache-Control: max-age=60 on API responses (`src/routes/api/events/+server.ts`, `src/routes/api/event/[id]/+server.ts`)

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (email/password)
  - Implementation: Server-side session validation in `src/hooks.server.ts`
  - Method: JWT tokens stored in cookies, validated on every request
  - User retrieval: `event.locals.safeGetSession()` ensures JWT is valid before returning user
  - Protected routes: Redirect to `/auth` for unauthenticated access to `/private/*` paths

## Monitoring & Observability

**Error Tracking:**
- None detected - Errors thrown but not centrally tracked

**Logs:**
- Console logging only - `console` used for client-side logging in some components

**Metrics:**
- Vercel Web Analytics - Tracks Core Web Vitals (CLS, FCP, LCP, TTFB, INP)
- Collection via: `src/lib/webVitals.ts` using `web-vitals` library

## CI/CD & Deployment

**Hosting:**
- Vercel (via `@sveltejs/adapter-vercel`)
- Serverless functions for API routes

**CI Pipeline:**
- None detected (no GitHub Actions, Circle CI, Travis CI configs)
- Manual deployment via Vercel

**Build Steps:**
- `yarn build` - Vite build with Vercel adapter optimization

## Environment Configuration

**Required env vars:**
- Public:
  - `PUBLIC_SUPABASE_URL` - Supabase project URL
  - `PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (safe for browser)
  - `VERCEL_ANALYTICS_ID` - Optional analytics ID (empty string if not provided)

- Private (server-side only):
  - `SUPABASE_SERVICE_KEY` - Service role key with admin permissions
  - `SUPABASE_TABLE_NAME` - Name of the events table in Supabase

**Secrets location:**
- `.env.local` file (not committed to git, `.gitignore` prevents exposure)
- In Vercel dashboard for production deployment

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- None detected - Events are fetched via HTTP GET requests only

## API Endpoints

**REST API (internal):**
- `GET /api/events` - List all events with filtering/pagination
  - Query parameters: `v` (version), `order_by`, `order_direction`, `page`, `page_size`, `include_past`
  - Returns: JSON array (v1) or paginated response with metadata (v2)
  - Cache: 60 seconds

- `GET /api/event/[id]` - Get single event by ID
  - Returns: JSON event object
  - Cache: 60 seconds

**Static Feeds:**
- `GET /feed.xml` - RSS/XML feed of events (`src/routes/feed.xml/+server.ts`)
  - Uses Supabase to fetch events, formats as XML via `jstoxml`

- `GET /sitemap.xml` - XML sitemap (`src/routes/sitemap.xml/+server.ts`)
  - Uses Supabase to fetch all events, generates sitemap URLs

## Data Flow

**Authentication:**
1. User logs in via Supabase Auth (email/password)
2. Session token stored in browser cookies
3. Server validates token on every request via `event.locals.safeGetSession()`
4. User context available in `event.locals.user`

**Event Data Retrieval:**
1. Client fetches via `GET /api/events` or `GET /api/event/[id]`
2. Server queries Supabase PostgreSQL using service key
3. Results cached for 60 seconds via HTTP headers
4. JSON response returned to client

**Event Creation/Updates:**
1. Authenticated user submits form
2. Server route handler calls Supabase client methods (`.insert()`, `.update()`, `.delete()`)
3. Service key used for write operations
4. Response sent back to client

---

*Integration audit: 2026-08-23*

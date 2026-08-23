# Codebase Concerns

**Analysis Date:** 2026-08-23

## Security Issues

### Critical: Missing Event Ownership Authorization

**Risk:** Any authenticated user can edit or delete ANY event in the database

**Files:** 
- `src/routes/(app)/event/[id]/edit/+page.server.ts` (lines 6-33)
- `src/routes/(app)/event/[id]/destroy/+page.server.ts` (lines 6-23)

**Current implementation:** Both routes only check `if (!user)` but do not verify the user owns the event before performing update/delete operations.

**Root cause:** The database schema in `src/lib/database.types.ts` defines the `upcoming-events` table without a `user_id` or `owner` field. This makes ownership tracking impossible.

**Impact:** 
- Any authenticated admin user can modify or delete any event created by any other admin
- No audit trail of who made changes to which events
- Data integrity cannot be guaranteed

**Recommendation:** 
1. Add `user_id` and `created_by` columns to the `upcoming-events` table
2. Implement Supabase Row Level Security (RLS) policies to enforce ownership
3. Verify user ownership before allowing update/delete operations:
   ```typescript
   const { data: eventData } = await supabase
     .from(SUPABASE_TABLE_NAME)
     .select('user_id')
     .eq('id', event.params.id)
     .single();
   
   if (eventData?.user_id !== user.id) {
     return fail(403, { error: "Forbidden" });
   }
   ```

### API Query Injection Risk

**Risk:** Potential SQL injection through unsanitized query parameters

**Files:** `src/routes/api/events/+server.ts` (lines 58-84)

**Current implementation:** The `orderDirection` parameter is parsed but only checked against "desc" to default to "asc":
```typescript
const orderDirection = searchParams.get("order_direction") === "desc" ? "desc" : "asc";
```

**Issues:**
- While the Supabase client likely prevents SQL injection, the validation is weak
- `orderBy` parameter is validated against whitelist but `orderDirection` is not
- Could be more explicit about what values are accepted

**Recommendation:** Add explicit validation:
```typescript
const SUPPORTED_ORDER_DIRECTIONS = ["asc", "desc"];
const orderDirection = SUPPORTED_ORDER_DIRECTIONS.includes(
  searchParams.get("order_direction")
) ? searchParams.get("order_direction") : "asc";
```

## Tech Debt

### Routing Configuration Mismatch

**Issue:** Auth guard references non-existent routes

**Files:** `src/hooks.server.ts` (lines 69-75)

**Current code:**
```typescript
if (!event.locals.user && event.url.pathname.startsWith("/private")) {
  redirect(303, "/auth");
}

if (event.locals.user && event.url.pathname === "/auth") {
  redirect(303, "/private");
}
```

**Problem:** The routes referenced (`/private`, `/auth`) don't exist in the codebase. The actual routes are:
- `/admin` - Admin dashboard
- `/login` - Login page

This means the redirect logic never executes as intended.

**Impact:** Authentication flow may not redirect users as expected

**Fix approach:** Update the routes to match actual application routes:
```typescript
if (!event.locals.user && event.url.pathname.startsWith("/admin")) {
  redirect(303, "/login");
}

if (event.locals.user && event.url.pathname === "/login") {
  redirect(303, "/");
}
```

### Number Parsing Without NaN Validation

**Issue:** Unvalidated number parsing can produce NaN values

**Files:** `src/routes/api/events/+server.ts` (lines 61-71)

**Current code:**
```typescript
let version = Number.parseInt(searchParams.get("v"), 10);
version = SUPPORTED_VERSIONS.includes(version) ? version : DEFAULT_VERSION;

let pageNum = Number.parseInt(searchParams.get("page"), 10) || 1;
pageSize = (pageSize < 1 || pageSize > MAX_PAGE_SIZE) ? DEFAULT_PAGE_SIZE : pageSize;
```

**Problem:**
- `Number.parseInt()` returns `NaN` when parsing fails
- `NaN` is not in `SUPPORTED_VERSIONS` array, so it gets defaulted (correct by accident)
- But comparison operations on `NaN` can behave unexpectedly: `NaN < 1` is `false`

**Recommendation:** Add explicit NaN checks:
```typescript
let version = Number.parseInt(searchParams.get("v"), 10);
version = !isNaN(version) && SUPPORTED_VERSIONS.includes(version) 
  ? version 
  : DEFAULT_VERSION;

let pageNum = Number.parseInt(searchParams.get("page"), 10);
pageNum = isNaN(pageNum) || pageNum < 1 ? 1 : pageNum;
```

### Weak Form Data Validation

**Issue:** Form input validation doesn't properly guard against null/undefined values

**Files:** 
- `src/routes/(app)/event/new/+page.server.ts` (line 14-16)
- `src/routes/(app)/event/[id]/edit/+page.server.ts` (line 15-17)

**Current code:**
```typescript
const title = data.get("title");
if (title.toString().length == 0) {
  return fail(400, { error: "Title is required" });
}
```

**Problem:**
- `data.get("title")` can return `null` or a `FormDataEntryValue` (string or File)
- Calling `.toString()` on `null` produces the string `"null"` with length 4
- This doesn't actually validate that a title was provided

**Recommendation:** Use proper type guards:
```typescript
const title = data.get("title");
if (typeof title !== "string" || title.trim().length === 0) {
  return fail(400, { error: "Title is required" });
}
```

### Unsafe Type Casting

**Issue:** TypeScript type casts without runtime validation

**Files:**
- `src/routes/(app)/event/new/+page.server.ts` (line 31)
- `src/stores/dates.ts` (line 91)

**Examples:**
```typescript
// Event creation - assumes returnedData[0] exists and is valid
const returnedEvent = <CountdownDate>returnedData[0];

// Date store - assumes data is correct shape
const result = <Partial<CountdownDate>>Object.fromEntries(...);
```

**Problem:** No runtime checks that data actually matches the expected type structure

**Recommendation:** Add validation:
```typescript
if (!returnedData || returnedData.length === 0) {
  return fail(500, { error: "Failed to retrieve created event" });
}
const returnedEvent = returnedData[0];
if (!returnedEvent.id) {
  return fail(500, { error: "Invalid event data returned" });
}
```

## Code Quality Issues

### Large Components

**Issue:** Several components exceed 200 lines and handle multiple responsibilities

**Files and sizes:**
- `src/routes/(app)/event/[id]/[slug]/+page.svelte` (301 lines) - Event detail page with timer, markdown rendering, metadata management
- `src/routes/(app)/admin/events/+page.svelte` (193 lines) - Admin event list with editing UI
- `src/lib/components/event/_form.svelte` (196 lines) - Event creation/edit form with local storage, tags

**Impact:** 
- Difficult to test individual features
- Hard to reuse form or display logic
- Future modifications become riskier

**Refactoring recommendations:**
- Extract timer logic into a separate component
- Extract markdown display utilities
- Break the form into smaller sub-components (TitleField, DateField, TagsField, etc.)

### Generic Error Messages

**Issue:** Error responses don't provide useful debugging information

**Files:**
- `src/routes/api/events/+server.ts` (line 39)
- `src/routes/sitemap.xml/+server.ts` (line 15)
- `src/routes/feed.xml/+server.ts` (line 21)

**Current patterns:**
```typescript
if (err) throw error(500, "Database error");
if (err) throw error(500, "Internal Server Error");
```

**Problem:** These messages don't indicate what failed (query, connection, validation, etc.)

**Recommendation:** Log detailed error information server-side, return generic message to client:
```typescript
if (err) {
  console.error("Database error fetching events:", err);
  throw error(500, "Failed to fetch events");
}
```

## Missing Features

### No Authorization Audit Trail

**Issue:** No way to track who created or modified events

**Files:** `src/lib/database.types.ts` (database schema)

**Problem:** The database schema lacks:
- `user_id` or `created_by` field
- `updated_by` field
- `updated_at` timestamp (only `created_at` exists)

**Impact:** Cannot answer questions like:
- Who created this event?
- When was this event last modified?
- Which admin made changes?

**Recommendation:** Update database schema to include:
```sql
ALTER TABLE "upcoming-events" 
ADD COLUMN created_by UUID REFERENCES auth.users(id),
ADD COLUMN updated_by UUID REFERENCES auth.users(id),
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
```

### No Input Sanitization Configuration

**Issue:** While markdown is sanitized via `sanitize-html`, the configuration is minimal

**Files:** `src/lib/utils/string_helpers.ts` (line 9)

**Current configuration:**
```typescript
sanitizeHtml(marked.parse(markdownString ?? ""), {
  allowedTags: [],
  allowedAttributes: {}
})
```

**Gap:** This configuration strips ALL HTML, including safe formatting. For plaintext conversion this is correct, but when displaying markdown (via SvelteMarkdown component), there's no explicit sanitization visible.

**Recommendation:** Verify that SvelteMarkdown's custom renderers (Image, Heading, OW2CLink) properly escape/validate all output.

## Performance Considerations

### Hard-coded Analytics Endpoint

**Issue:** Analytics URL is hard-coded in source

**Files:** `src/lib/webVitals.ts` (line 3)

**Current:**
```typescript
const vitalsURL = "https://vitals.vercel-analytics.com/v1/vitals";
```

**Problem:** Cannot be changed without code modification or environment configuration

**Recommendation:** Move to environment variable:
```typescript
const vitalsURL = import.meta.env.VITE_ANALYTICS_URL || 
  "https://vitals.vercel-analytics.com/v1/vitals";
```

## Testing Gaps

**Missing test coverage for:**
- Authorization checks (ownership validation)
- Form input validation edge cases
- API parameter validation and boundary conditions
- Error handling paths in all routes
- Number parsing edge cases (NaN, negative numbers, very large numbers)

---

*Concerns audit: 2026-08-23*

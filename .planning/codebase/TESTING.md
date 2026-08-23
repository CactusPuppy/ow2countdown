# Testing Patterns

**Analysis Date:** 2026-08-23

## Test Framework

**Status:** No testing framework currently configured

**Overview:**
- No test files found in the codebase
- No test framework installed (Jest, Vitest, etc.)
- No testing libraries in `package.json` devDependencies
- No test configuration files (`jest.config.js`, `vitest.config.ts`, etc.)

**Checked locations:**
- `/src/**/*.test.ts`, `/src/**/*.spec.ts` - no files found
- `package.json` - no test scripts or testing dependencies
- Root directory - no Jest or Vitest config files

## Test File Organization

**Current state:**
- No established test structure
- No test directory pattern

**Recommended pattern (if tests are added):**
- Co-locate tests with source files: `src/lib/utils/event_helpers.test.ts` next to `src/lib/utils/event_helpers.ts`
- Or create parallel test structure: `src/__tests__/` with matching directory layout
- Test file naming: `*.test.ts` (preferred) or `*.spec.ts`

## Test Structure

**No existing tests to reference**

**If implementing tests, follow SvelteKit conventions:**
- Use async/await for async operations
- Test handlers: `import { GET, POST } from '+server'`
- Mock event objects: `{ locals, params, url, cookies }`
- Test Svelte components with component testing library (when added)

## Mocking

**No mocking patterns established**

**Observed dependencies that would need mocking (if tests added):**
- Supabase client: `@supabase/supabase-js`, `@supabase/ssr`
- Environment variables: Mock `$env/static/public` and `$env/static/private`
- fetch API: Mock for API endpoint tests
- localStorage: Mock for browser storage tests (see `src/lib/components/event/_form.svelte`)

**Recommendation for future implementation:**
- Mock Supabase responses in server route tests (`/src/routes/api/**/*.test.ts`)
- Mock fetch for store tests (`src/stores/dates.test.ts`)
- Use environment mocking for client/server configuration tests

## Fixtures and Factories

**No test fixtures or factories exist**

**Recommended pattern (if tests added):**
- Create test fixtures for `CountdownDate` type in `src/__tests__/fixtures/countdown-dates.ts`
- Example fixture structure:
  ```typescript
  export const mockCountdownDate: CountdownDate = {
    id: 1,
    title: "Test Event",
    date: "2025-12-25T00:00:00Z",
    end_date: null,
    description: "Test description",
    group: "Test Group",
    priority: 1,
    tags: "test,fixture",
    updated_by: "test-user",
    updated_at: new Date().toISOString(),
  };
  ```

## Coverage

**Requirements:** No coverage requirements enforced

**Current state:**
- No coverage tools configured
- No `.nyc_config.js` or coverage configuration
- No coverage reports

**Recommendation (if testing is added):**
- Configure coverage thresholds in test config when framework is chosen
- Target: 70%+ coverage for critical paths
  - API endpoints in `src/routes/api/`
  - Store logic in `src/stores/`
  - Utility functions in `src/lib/utils/`

## Test Types

**Unit Tests (not currently present):**
- Should test utility functions:
  - `src/lib/utils/event_helpers.ts` - date calculations, event state logic
  - `src/lib/utils/string_helpers.ts` - markdown parsing and sanitization
  - `src/lib/utils/date_format_helpers.ts` - date formatting

**Integration Tests (not currently present):**
- API endpoint integration: `src/routes/api/events/+server.ts`, `src/routes/api/event/[id]/+server.ts`
- Supabase query integration
- Form data flow: component → store → API

**E2E Tests (not currently present):**
- Not configured; would require Playwright or Cypress
- Could test: event creation flow, countdown display, filtering

## Common Patterns

**If tests are added, use these patterns:**

**Async Testing:**
```typescript
// SvelteKit server route test
export const GET: RequestHandler = async (request) => { ... }

// Test pattern (when implemented):
it("should fetch events successfully", async () => {
  const response = await GET(mockRequest);
  const data = await response.json();
  expect(data).toHaveLength(0);
});
```

**Error Testing:**
```typescript
// Observed pattern in code:
if (err) throw error(500, "Database error");

// Test pattern (when implemented):
it("should throw 500 on database error", async () => {
  mockSupabase.from.mockRejectedValueOnce(new Error("DB error"));
  expect(() => GET(mockRequest)).rejects.toThrow();
});
```

**Promise/Store Testing:**
```typescript
// Observed pattern (src/stores/dates.ts):
return getDates().then(result => {
  update(() => result);
  // ...
}).catch(error => {
  console.error(error);
  // ...
});

// Test pattern (when implemented):
it("should handle fetch errors gracefully", async () => {
  global.fetch = jest.fn().mockRejectedValueOnce(new Error("Network error"));
  const result = await dates.requestUpdate();
  // Assert error state
});
```

**Svelte Component Testing:**
```typescript
// When component testing library is added (e.g., @testing-library/svelte):
import { render, screen } from "@testing-library/svelte";
import Timer from "$lib/components/_timer.svelte";

it("renders timer with correct values", () => {
  render(Timer, {
    props: {
      start: new Date(),
      end: new Date(Date.now() + 3600000),
      id: 1
    }
  });
  expect(screen.getByText(/hours/)).toBeInTheDocument();
});
```

## Recommended Setup (for future implementation)

**Framework choice:** Vitest recommended for SvelteKit projects
- Reason: Fast, ESM-first, good Svelte support

**Configuration needed:**
1. Add `vitest` and `@vitest/ui` to devDependencies
2. Create `vitest.config.ts` in project root
3. Add test script to `package.json`: `"test": "vitest"`
4. Optional: Add `@testing-library/svelte` for component testing
5. Optional: Add `jsdom` for DOM testing

**File structure to create:**
```
src/
├── __tests__/
│   ├── fixtures/
│   │   └── countdown-dates.ts
│   └── setup.ts
├── lib/
│   ├── utils/
│   │   └── event_helpers.test.ts
│   └── components/
│       └── _timer.test.ts
└── routes/
    └── api/
        └── events/
            └── +server.test.ts
```

---

*Testing analysis: 2026-08-23*

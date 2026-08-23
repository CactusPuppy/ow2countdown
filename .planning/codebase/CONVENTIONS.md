# Coding Conventions

**Analysis Date:** 2026-08-23

## Naming Patterns

**Files:**
- Svelte components: lowercase with underscore prefix for internal/private components: `_timer.svelte`, `_spinner.svelte`
- Svelte pages/routes: use SvelteKit naming: `+page.svelte`, `+layout.svelte`, `+server.ts`
- TypeScript utilities: lowercase with descriptive names: `event_helpers.ts`, `string_helpers.ts`, `date_format_helpers.ts`
- Type definition files: `*.types.ts` suffix for database types

**Functions:**
- camelCase for all function names: `titleToSlug()`, `isEventHappeningNow()`, `eventEffectiveDate()`
- Exported functions are standard camelCase: `markdownToPlaintext()`, `entriesToEventObject()`
- Private/internal functions use same camelCase (no underscore prefix unlike components)

**Variables:**
- camelCase for local variables and function parameters: `diffInSeconds`, `timerValues`, `additionalDelay`
- Svelte reactive variables use `$state()` in Svelte 5: `let title = $state("")`
- Database field names use snake_case: `end_date`, `updated_at`, `updated_by`
- Form field names match database column names: `name="end_date"` not `name="endDate"`

**Types:**
- PascalCase for type names: `CountdownDate`, `CountdownDateContainer`, `RequestHandler`
- Import type annotations with `type` keyword: `import type { CountdownDate } from "$lib/types"`
- Interface/namespace names in global scope: `namespace App { interface Locals {...} }`

**Constants:**
- UPPER_SNAKE_CASE for module-level constants: `SECONDS_IN_A_DAY`, `MIN_BACKOFF`, `MAX_BACKOFF`, `DEFAULT_VERSION`, `SUPPORTED_ORDER_BY`
- Exported constants follow same pattern: `AUTO_SAVE_KEY = "ow2countdown_new_event_draft"`

## Code Style

**Formatting:**
- 2-space indentation (configured in ESLint)
- No automatic formatter (Prettier not configured); ESLint handles style
- Semicolons required (ESLint enforced)
- Always use quotes (ESLint configured)

**Linting:**
- Tool: ESLint 9.31.0
- Config location: `.eslintrc.cjs`
- Parser: `@typescript-eslint/parser`
- Key settings:
  - Extends `eslint:recommended` and `plugin:@typescript-eslint/recommended`
  - Svelte processor for `.svelte` files via `svelte3/svelte3`
  - Source type: ES modules
  - Target: ES2020 + browser environment
- Run linting: `npm run lint`

**TypeScript:**
- Strict type annotations required
- Use `type` keyword for imports of types only: `import type { Database } from "$lib/database.types"`
- Define types in `$lib/types.ts` and global types in `src/app.d.ts`
- Database types auto-generated in `$lib/database.types.ts` from Supabase schema

## Import Organization

**Order (observed pattern):**
1. External library imports (e.g., `date-fns`, `@supabase/ssr`, `svelte`)
2. Framework imports (e.g., `@sveltejs/kit`, `svelte/animate`, `svelte/transition`)
3. Type imports (marked with `import type`)
4. Internal component imports with path aliases
5. Internal function/utility imports

**Path Aliases:**
- `$lib/` - maps to `src/lib/` for internal library code
- `$env/static/public` - public environment variables
- `$env/static/private` - private environment variables
- Relative paths used for co-located imports (`./_timer.svelte`)

**Example from codebase:**
```typescript
import { createServerClient } from "@supabase/ssr";  // external
import { type Handle, redirect } from "@sveltejs/kit";  // framework
import { sequence } from "@sveltejs/kit/hooks";  // framework submodule
import {
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY,
} from "$env/static/public";  // env variables
import { eventEffectiveDate } from "$lib/utils/event_helpers";  // internal utilities
```

## Error Handling

**HTTP Endpoints (server routes):**
- Use `throw error(status, message)` from `@sveltejs/kit`: `throw error(500, "Database error")`
- Early exit pattern: check error and throw immediately
- Pattern from `src/routes/api/events/+server.ts`:
  ```typescript
  if (err) throw error(500, "Database error");
  if (data.length <= 0) throw error(404, "Not found");
  ```

**Client-side code:**
- Use try-catch for localStorage operations with `console.warn` logging:
  ```typescript
  try {
    const saved = localStorage.getItem(AUTO_SAVE_KEY);
    // ... process
  } catch (error) {
    console.warn("Failed to load form data from localStorage:", error);
  }
  ```
- Return null or empty values for missing data: `return { user: null }`
- Defensive null checks in comparisons: `if (!event || !event.date) { ... }`

**Store operations:**
- Promise-based error handling with `.catch()`: `.catch(error => { console.error(error); ... })`
- Mark stores with error state: `result.errored = true`

## Logging

**Framework:** No dedicated logging library; uses `console.warn()` and `console.error()`

**Patterns:**
- Warnings for non-critical issues: `console.warn("Failed to load form data from localStorage:", error)`
- Errors for critical issues: `console.error(error)` in store failure handlers
- No info/debug logging in production code observed

## Comments

**When to Comment:**
- Explain business logic or non-obvious decisions: `// if there is no order by, use the default sort of priority and date which is used by the homepage`
- Explain data transformations: `// REMOVE STATUS MESSAGES` (in regex)
- Explain workarounds or complex conditional logic

**Block Comments:**
- Multi-line JSDoc/TSDoc comments for functions with complex behavior:
  ```typescript
  /**
   * Requests an update to the dates container if the most recent request was not too recent.
   * @returns The date at which a new request can be made, or -1 if a request is being processed
   */
  ```
- Detailed comments on setup/configuration: SvelteKit hooks and middleware

**Avoid over-commenting:**
- Self-documenting code (clear function/variable names) preferred
- Simple assignments or obvious operations don't need comments
- Comments should explain "why", not "what"

## Function Design

**Size:**
- Keep functions focused on a single responsibility
- Utility functions typically 5-30 lines
- Svelte component scripts vary based on complexity
- Server endpoint handlers typically 20-50 lines

**Parameters:**
- Use typed function signatures: `function isEventHappeningNow(event: CountdownDate, now?: Date)`
- Optional parameters marked with `?`: `now?: Date`
- Use default parameters sparingly; favor null checks
- Destructure object parameters when cleaner: `const { supabase } = request.locals`

**Return Values:**
- Explicit return types on exported functions: `export const GET: RequestHandler = async (request) => { ... }`
- Early returns for error conditions reduce nesting
- Return objects/arrays over multiple out parameters
- Promise returns annotated: `Promise<CountdownDate[]>`

## Module Design

**Exports:**
- Named exports preferred: `export const dates = createDates()`
- Export functions at module level: `export function markdownToPlaintext(...) { ... }`
- Default exports used for SvelteKit routes (implicit)
- Type exports marked with `type`: `export type CountdownDate = Database["public"]["Tables"]["upcoming-events"]["Row"]`

**Barrel Files:**
- Not heavily used; prefer direct imports
- Component imports use relative paths: `import Timer from "$lib/components/_timer.svelte"`

## Svelte Component Conventions

**Script sections:**
- Use `<script lang="ts">` for TypeScript support
- Export props with `export let`: `export let start: Date; export let id: Number;`
- Use Svelte 5 runes: `let title = $state("")`, `$effect(saveToLocalStorage)`
- Reactive declarations: `$: diffInSeconds = Math.max(0, differenceInSeconds(...))`
- Use `bind:value` for two-way binding on form inputs

**Props and snippets:**
- Component props use destructuring in Svelte 5: `const { event, submitButton }: { event?: CountdownDate; submitButton: Snippet } = $props()`
- Snippets for complex rendering: `{@render submitButton()}`

**Styling:**
- Use Scoped styles in `<style>` blocks (Svelte default)
- Apply Tailwind classes directly in markup: `class="flex justify-center gap-12"`
- Custom CSS for complex styling or animations
- Dark mode support with `dark:` prefix: `dark:bg-zinc-800`, `dark:text-gray-600`
- Define custom CSS classes in style block when needed: `.screenreader-only { ... }`

**Transitions and animations:**
- Import from `svelte/transition`: `import { fade, fly } from "svelte/transition"`
- Use directives: `in:fade`, `out:fly`, `animate:flip`
- Specify duration and delay: `in:fade="{{ duration: 500, delay: i * 100 + additionalDelay }}"`

## Form Handling

**Form inputs:**
- Use semantic HTML: `<input type="datetime-local">`, `<textarea>`, `<label>`
- Bind inputs to reactive variables: `bind:value={title}`
- Bind form names to match database fields: `name="end_date"`
- Add `required` attribute to mandatory fields
- Use `id` attributes on all form controls matching label `for` attribute

**Data transformations:**
- Store form data in local state before submission
- Convert form data to objects: `Object.fromEntries(Array.from(entries))`
- Validate and clean data in utility functions (see `entriesToEventObject()`)
- localStorage integration for draft saving in new event forms

---

*Convention analysis: 2026-08-23*

# OW2 Countdown — Tags System

## What This Is

OW2 Countdown is a public web app that tracks upcoming and ongoing Overwatch 2 events (game modes, in-game promotions, esports, Twitch Drops, etc.) with live countdown timers. It exposes a versioned public REST API that external partners consume for event data. This milestone adds a tags system so users can visually distinguish events and filter for the ones they care about, both in the app and via the API.

## Core Value

Give players a reliable, at-a-glance view of what Overwatch 2 events are happening now and next — and let them quickly find the events they actually care about via tags, in the app and through the API.

## Requirements

### Validated

- ✓ Users can view a homepage list of upcoming/ongoing events with live countdown timers — existing
- ✓ Authenticated admins can create, edit, and delete events via form UI — existing
- ✓ Public REST API (v1/v2) exposes event data with pagination, ordering, and past-event filtering — existing
- ✓ RSS feed and XML sitemap are generated for syndication/SEO — existing
- ✓ Supabase session-based auth gates admin actions — existing

### Active

- [ ] Events can have one or more freeform text tags (chip-input UI, already scaffolded as `Tags.svelte`)
- [ ] Event cards visually distinguish tags as chips — neutral style by default, with per-tag color overrides (e.g. "Twitch Drops" = purple)
- [ ] Users can filter the homepage event list by one or more tags via a dedicated filter panel (AND semantics — event must match all selected tags)
- [ ] External API consumers can filter events by tag via a new `tags` query param on the existing `/api/events` endpoint (AND semantics), without breaking existing v1/v2 behavior
- [ ] Event tags are stored in a normalized `tags` + `event_tags` join table schema (replacing the current comma-delimited string column), migrating existing data without loss
- [ ] Tag color overrides live in the `tags` table, editable via direct DB access

### Out of Scope

- Tag autocomplete / curated tag picker — freeform entry is sufficient for now; revisit if duplicate/typo tags (e.g. "esport" vs "esports") become a real problem
- Tag management admin UI (CRUD screen for the `tags` table) — direct DB edits suffice given low expected change frequency
- Tag-based notifications/subscriptions (e.g. "notify me on new Twitch Drops events") — separate feature, not needed for this milestone

## Context

- Work is already in progress on branch `feat/actual-tags-system`: a `Tags.svelte` chip-input component (`src/lib/components/form/Tags.svelte`), a `splitTags()` helper (`src/lib/utils/event_helpers.ts`), the event form wired to the new component, and a stubbed (currently empty) tags block in `src/routes/_event_card.svelte`.
- Codebase mapped in `.planning/codebase/` (ARCHITECTURE.md, STACK.md, STRUCTURE.md, CONVENTIONS.md, INTEGRATIONS.md, TESTING.md, CONCERNS.md) as of 2026-08-23.
- Stack: SvelteKit 2 / Svelte 5, TailwindCSS 4, Supabase (Postgres + auth), deployed on Vercel.
- Events currently persist in a single Supabase table (`upcoming-events`) with `tags` as a nullable comma-delimited string column.
- The public API is versioned (`?v=1`/`?v=2` query param) specifically to keep external partner integrations stable across changes — any tag-filtering addition must preserve that compatibility.

## Constraints

- **Tech stack**: SvelteKit 2 + Svelte 5 + Supabase + TailwindCSS 4 — new work must fit the existing architecture, no new frameworks.
- **API compatibility**: Existing v1/v2 API consumers (external partners) must not break; tag filtering is added as a new query param on the current endpoint rather than a version bump.
- **Data migration**: Existing comma-delimited `tags` data must be migrated into the new `tags`/`event_tags` schema without data loss.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Tag storage: `tags` + `event_tags` join table (not a `text[]` column) | Normalized schema gives a natural home for color overrides and clean filter queries | — Pending |
| Tag color overrides set via direct DB edit, no admin UI | Change frequency is low; UI investment not justified yet | — Pending |
| API tag filter added as new `tags` query param on existing `/api/events` endpoint, no version bump | Additive, backward-compatible change for external partners | — Pending |
| Multi-tag filtering uses AND semantics (app and API) | Matches expected "narrow the results" mental model | — Pending |
| Freeform tag entry retained for now; curation/autocomplete deferred | Ships faster; avoids solving a duplicate-tag problem that may not materialize | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-08-23 after initialization*

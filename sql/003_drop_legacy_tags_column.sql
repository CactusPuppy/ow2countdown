-- Phase 1: Tag Data Foundation & Admin Authoring
-- Drops the legacy comma-delimited `tags` column from `upcoming_events_staging`
-- now that plan 01-02 has migrated every legacy value into public.tags /
-- public.event_tags and plan 01-03 has moved every application read/write
-- path onto the normalized schema.
--
-- ============================================================================
-- THIS OPERATION IS IRREVERSIBLE.
--
-- Once this statement runs, the original comma-delimited tag text is gone
-- from the live database. Recovering it afterwards requires restoring a
-- database backup taken beforehand — no application code path can
-- repopulate this column. Whether a suitable backup exists is a property
-- of the Supabase project, not of this repository, and cannot be asserted
-- from here.
--
-- DO NOT RUN THIS FILE until `scripts/verify-tag-migration.mjs` has passed
-- against this same database (per D-06/D-08, sql/002_migrate_legacy_tags.sql).
-- ============================================================================
--
-- Applied by hand per D-07 (sql/README.md). Written with `if exists` so a
-- repeated application is a no-op rather than an error (D-06's cited
-- reversibility note refers to data recovery, not to re-running this file).
--
-- Uses `upcoming_events_staging` as the concrete events-table identifier
-- for this environment (see sql/README.md for how to retarget).

alter table public.upcoming_events_staging
  drop column if exists tags;

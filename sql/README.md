# SQL Migrations

This repository has no migration tooling and no CI/CD (D-05/D-07). Schema
changes are plain SQL files applied by hand against the Supabase project's
SQL Editor (or `psql`, if you prefer) — there is no automated apply step.

## Run order

Apply files in numeric filename order:

1. `001_tags_schema.sql` — creates the `tags` and `event_tags` tables, the
   case-insensitive unique index on tag names, RLS policies, and the
   `save_event` transactional write function.
2. `002_...` (future) — one-time migration of legacy comma-delimited
   `tags` data into the normalized schema (plan 01-02).
3. `003_...` (future) — drops the legacy `tags` column from
   `upcoming_events_staging` once the migration is verified (plan 01-04).

## How to apply

1. Open the Supabase project dashboard → SQL Editor.
2. Paste the full contents of the file and run it.
3. Confirm it reports success with no errors.

Every statement in these files is written to be safely re-runnable
(`create table if not exists`, `create index if not exists`,
`create or replace function`, drop-then-create for policies), so a partial
or repeated application is safe.

## Environment-specific identifier

The one identifier you may need to change when targeting a different
Supabase project/environment is the events table name. In this repo it is
`upcoming_events_staging` (the value of the `SUPABASE_TABLE_NAME` env var
for the current environment) — `src/lib/database.types.ts` still labels the
table `"upcoming-events"` for historical reasons, but the live table is
`upcoming_events_staging`. If your environment's table has a different
name, replace every occurrence of `upcoming_events_staging` in these SQL
files before running them.

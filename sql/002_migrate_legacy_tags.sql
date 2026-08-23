-- Phase 1: Tag Data Foundation & Admin Authoring
-- One-time backfill of the legacy `tags` text column on
-- upcoming_events_staging into the normalized public.tags / public.event_tags
-- schema created by sql/001_tags_schema.sql.
--
-- Applied by hand per D-07 (sql/README.md). This migration only INSERTs into
-- tags/event_tags -- it does not modify or drop the legacy `tags` column.
-- The column is retired in a later migration (plan 01-04), once this one has
-- verified clean.
--
-- Parse rule: normalize-unwrap, the option selected in 01-02-PLAN.md's Task 1
-- decision checkpoint. See that plan's <data_reality> census for why a
-- literal comma-split (the letter of D-05) would corrupt 23 of the 24 rows
-- that actually carry tag text -- the legacy column is overwhelmingly
-- JSON-array-shaped, not comma-delimited, and two rows use typographic
-- (curly) quotes that are not valid JSON.
--
--   1. Replace typographic quotes (U+201C “ and U+201D ”) with a straight
--      double quote (").
--   2. btrim whitespace from the result.
--   3. Strip a leading '[' and a trailing ']' only when BOTH are present,
--      leaving a comma-delimited inner string. Values with no brackets
--      (the one genuinely bare comma-delimited row) pass through unchanged.
--   4. Split the inner string on comma.
--   5. btrim whitespace from each element, then btrim the straight double
--      quote character from each element. Postgres btrim's second argument
--      is a character set, so trimming whitespace and quotes is two
--      applications, not one.
--   6. Discard elements that are empty after trimming.
--
-- Safely re-runnable: every insert below uses ON CONFLICT DO NOTHING, so a
-- second application of this file changes no counts.

begin;

with legacy as (
  select
    id as event_id,
    tags as raw_tags
  from public.upcoming_events_staging
  where tags is not null
    and btrim(tags) <> ''
),
normalized as (
  select
    event_id,
    -- Steps 1-3: normalize quotes, trim, unwrap matched brackets.
    case
      when left(btrim(replace(replace(raw_tags, '“', '"'), '”', '"')), 1) = '['
       and right(btrim(replace(replace(raw_tags, '“', '"'), '”', '"')), 1) = ']'
      then substring(
             btrim(replace(replace(raw_tags, '“', '"'), '”', '"'))
             from 2
             for length(btrim(replace(replace(raw_tags, '“', '"'), '”', '"'))) - 2
           )
      else btrim(replace(replace(raw_tags, '“', '"'), '”', '"'))
    end as inner_text
  from legacy
),
parsed as (
  select
    event_id,
    -- Steps 4-6: split on comma, trim whitespace then quote characters from
    -- each element, drop anything empty after trimming.
    nullif(btrim(btrim(elem, ' '), '"'), '') as tag_name
  from normalized,
       regexp_split_to_table(inner_text, ',') as elem
),
distinct_names as (
  select distinct tag_name
  from parsed
  where tag_name is not null
)

-- Insert distinct tag names. The ON CONFLICT target matches the
-- tags_name_lower_key unique index created in sql/001_tags_schema.sql, so a
-- name already present (case-insensitively) is left untouched -- D-02's
-- first-entered-casing rule.
insert into public.tags (name)
select tag_name
from distinct_names
on conflict (lower(name)) do nothing;

-- Link each event to every tag parsed from its legacy value.
insert into public.event_tags (event_id, tag_id)
select distinct p.event_id, t.id
from parsed p
join public.tags t on lower(t.name) = lower(p.tag_name)
where p.tag_name is not null
on conflict do nothing;

commit;

-- ============================================================================
-- D-08 Verification query (intentionally NOT part of the migration
-- transaction above -- run it separately, after commit).
-- ============================================================================
-- For every event whose legacy `tags` column is neither null nor blank,
-- compares the number of tag names parsed from that column against the
-- number of event_tags rows now present for that event. A correct, complete
-- migration returns ZERO rows from this query. Any row returned identifies
-- an event whose parsed tag count and stored event_tags count disagree --
-- treat that as a migration failure, not something to skip past.
with legacy as (
  select id as event_id, tags as raw_tags
  from public.upcoming_events_staging
  where tags is not null
    and btrim(tags) <> ''
),
normalized as (
  select
    event_id,
    case
      when left(btrim(replace(replace(raw_tags, '“', '"'), '”', '"')), 1) = '['
       and right(btrim(replace(replace(raw_tags, '“', '"'), '”', '"')), 1) = ']'
      then substring(
             btrim(replace(replace(raw_tags, '“', '"'), '”', '"'))
             from 2
             for length(btrim(replace(replace(raw_tags, '“', '"'), '”', '"'))) - 2
           )
      else btrim(replace(replace(raw_tags, '“', '"'), '”', '"'))
    end as inner_text
  from legacy
),
parsed as (
  select
    event_id,
    nullif(btrim(btrim(elem, ' '), '"'), '') as tag_name
  from normalized,
       regexp_split_to_table(inner_text, ',') as elem
),
expected_counts as (
  select event_id, count(*) filter (where tag_name is not null) as expected_count
  from parsed
  group by event_id
),
actual_counts as (
  select event_id, count(*) as actual_count
  from public.event_tags
  group by event_id
)
select
  e.event_id,
  e.expected_count,
  coalesce(a.actual_count, 0) as actual_count
from expected_counts e
left join actual_counts a on a.event_id = e.event_id
where e.expected_count <> coalesce(a.actual_count, 0);

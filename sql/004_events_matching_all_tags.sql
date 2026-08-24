-- Phase 4: Tag Filtering (API)
-- Creates the AND-matching read-only RPC backing the `?tags=` query param
-- on GET /api/events.
--
-- Decisions encoded:
--   D-02: AND-semantics-across-multiple-tags implemented as a Postgres RPC
--         (SECURITY DEFINER), following the save_event pattern, rather than
--         chained PostgREST filters.
--   D-03: The RPC is narrow — given a list of tag names, it returns only the
--         set of matching event ids (carries-all-selected). It does not take
--         order_by/include_past/page/page_size and does not return full rows.
--   D-05: Tag-name matching is case-insensitive, matching the existing
--         case-insensitive unique index on tags.name (tags_name_lower_key).
--   D-06: No existence-check against `tags` is performed — an unrecognized
--         name simply never joins and falls out through the HAVING clause.
--   D-08: The RPC defensively dedupes and case-folds its own input, so it is
--         correct even when called directly with raw/duplicate/blank
--         elements, independent of the API layer's own splitTags()+Set
--         cleanup.
--
-- Applied by hand per D-07 (sql/README.md). Uses `create or replace
-- function`, so this file is safely re-runnable.

create or replace function public.events_matching_all_tags(tag_names text[])
returns table(event_id bigint)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with wanted as (
    select distinct lower(trim(t)) as name
    from unnest(tag_names) as t
    where trim(t) <> ''
  )
  select et.event_id
  from public.event_tags et
  join public.tags tg on tg.id = et.tag_id
  join wanted w on w.name = lower(tg.name)
  group by et.event_id
  having count(distinct w.name) = (select count(*) from wanted)
$$;

-- Deliberate divergence from save_event's revoke-anon posture: this RPC
-- backs the unauthenticated public GET /api/events endpoint (only /private
-- paths are guarded in src/hooks.server.ts), and `tags`/`event_tags` already
-- carry `select` RLS policies open to `anon` (sql/001_tags_schema.sql), so
-- this RPC exposes nothing that is not already publicly queryable directly.
-- Do NOT "correct" this back to a revoke-anon grant.
revoke execute on function public.events_matching_all_tags(text[]) from public;
grant execute on function public.events_matching_all_tags(text[]) to anon;
grant execute on function public.events_matching_all_tags(text[]) to authenticated;
grant execute on function public.events_matching_all_tags(text[]) to service_role;

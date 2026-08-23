-- Phase 1: Tag Data Foundation & Admin Authoring
-- Creates the normalized tags/event_tags schema and the save_event
-- transactional write function.
--
-- Applied by hand per D-07 (sql/README.md). Every statement here is
-- written to be safely re-runnable so a partial or repeated application
-- does not error.
--
-- Uses `upcoming_events_staging` as the concrete events-table identifier
-- for this environment (see sql/README.md for how to retarget).

-- ============================================================================
-- Tables
-- ============================================================================

create table if not exists public.tags (
  id bigint generated always as identity primary key,
  name text not null,
  color text null,
  created_at timestamptz not null default now()
);

-- D-01/D-03: case-insensitive tag identity enforced at the DB level so
-- concurrent inserts of the same name (different casing) can't race past an
-- app-level check. This is the exact expression save_event's ON CONFLICT
-- clause targets below.
create unique index if not exists tags_name_lower_key on public.tags (lower(name));

create table if not exists public.event_tags (
  event_id bigint not null references public.upcoming_events_staging(id) on delete cascade,
  tag_id bigint not null references public.tags(id) on delete cascade,
  primary key (event_id, tag_id)
);

-- Supports the reverse lookup (tag -> events) Phase 3/4 filtering needs.
-- The composite PK above already covers event_id as its leading column.
create index if not exists event_tags_tag_id_idx on public.event_tags (tag_id);

-- ============================================================================
-- Row Level Security
-- ============================================================================
-- A raw `create table` does not enable RLS. Without this, both new tables
-- would be openly writable through the public PostgREST endpoint. Only
-- SELECT is granted here; writes reach these tables exclusively through
-- save_event (SECURITY DEFINER) or a service-key/direct-DB session.

alter table public.tags enable row level security;
alter table public.event_tags enable row level security;

drop policy if exists tags_select_all on public.tags;
create policy tags_select_all on public.tags
  for select
  to anon, authenticated
  using (true);

drop policy if exists event_tags_select_all on public.event_tags;
create policy event_tags_select_all on public.event_tags
  for select
  to anon, authenticated
  using (true);

-- ============================================================================
-- save_event: atomic event + tag write (D-09)
-- ============================================================================
-- NOTE ON PARAMETER ORDER: PostgreSQL requires that any parameter without a
-- default value must not follow a parameter that has one. `event_data` has
-- no default, so it is declared first; `event_id` and `tag_names` (which
-- have defaults) follow. This does not change the call site: supabase.rpc()
-- calls Postgres functions with named argument notation, so callers may
-- still pass `{ event_id, event_data, tag_names }` in any key order.

create or replace function public.save_event(
  event_data jsonb,
  event_id bigint default null,
  tag_names text[] default '{}'
)
returns public.upcoming_events_staging
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  saved_event public.upcoming_events_staging;
  current_row public.upcoming_events_staging;
  populated_row public.upcoming_events_staging;
  tag_name text;
  normalized_name text;
  resolved_tag_id bigint;
begin
  -- 1. Authorization guard: any authenticated user is admin (per
  --    PROJECT.md's auth model, no role field), and the service-role
  --    identity is admitted so trusted server-side/verifier callers can
  --    exercise this function directly.
  if auth.uid() is null and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Unauthorized' using errcode = '42501';
  end if;

  -- 2. Insert or update the event row.
  if event_id is null then
    populated_row := jsonb_populate_record(null::public.upcoming_events_staging, event_data);

    insert into public.upcoming_events_staging (
      date, title, description, "group", priority, end_date
    ) values (
      populated_row.date,
      populated_row.title,
      populated_row.description,
      populated_row."group",
      populated_row.priority,
      populated_row.end_date
    )
    returning * into saved_event;
  else
    select * into current_row from public.upcoming_events_staging where id = event_id;

    if not found then
      raise exception 'Event % not found', event_id using errcode = 'P0002';
    end if;

    -- Base on the CURRENT row so keys absent from event_data retain their
    -- stored values (preserves the existing partial-update semantics).
    populated_row := jsonb_populate_record(current_row, event_data);

    update public.upcoming_events_staging
    set
      date = populated_row.date,
      title = populated_row.title,
      description = populated_row.description,
      "group" = populated_row."group",
      priority = populated_row.priority,
      end_date = populated_row.end_date
    where id = event_id
    returning * into saved_event;
  end if;

  -- 3. Full replace (D-10): delete every event_tags row for this event,
  --    then re-insert. Table-qualify event_id here because it is also the
  --    name of this function's own parameter.
  delete from public.event_tags where event_tags.event_id = saved_event.id;

  -- 4. Upsert each tag and link it. ON CONFLICT DO NOTHING on both the tag
  --    insert and the event_tags insert implements D-02 (an existing tags
  --    row keeps its first-entered spelling and is never renamed) and
  --    naturally de-duplicates case-insensitive repeats within tag_names.
  foreach tag_name in array tag_names loop
    normalized_name := trim(tag_name);
    if normalized_name = '' then
      continue;
    end if;

    insert into public.tags (name)
    values (normalized_name)
    on conflict (lower(name)) do nothing;

    select id into resolved_tag_id
    from public.tags
    where lower(name) = lower(normalized_name)
    limit 1;

    insert into public.event_tags (event_id, tag_id)
    values (saved_event.id, resolved_tag_id)
    on conflict do nothing;
  end loop;

  -- 5. Return the saved row.
  return saved_event;
end;
$$;

-- Defense in depth: withhold EXECUTE from anonymous/public callers even
-- though the guard above already rejects them, then grant it back only to
-- the identities allowed by the guard.
revoke execute on function public.save_event(jsonb, bigint, text[]) from public;
revoke execute on function public.save_event(jsonb, bigint, text[]) from anon;
grant execute on function public.save_event(jsonb, bigint, text[]) to authenticated;
grant execute on function public.save_event(jsonb, bigint, text[]) to service_role;

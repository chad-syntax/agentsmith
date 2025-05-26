create extension if not exists pgcrypto;

create type public.roadmap_item_state as enum (
  'PROPOSED',
  'REJECTED',
  'PLANNED',
  'IN_PROGRESS',
  'CANCELLED',
  'COMPLETED'
);

create table roadmap_items (
  id               bigint primary key generated always as identity,
  creator_user_id  bigint not null references public.agentsmith_users(id),
  slug             text  not null unique,
  title            text  not null,
  body             text  not null,
  state            public.roadmap_item_state  not null default 'PROPOSED'::public.roadmap_item_state,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now(),
  upvote_count     integer default 0,
  avg_score        numeric(3,2) default 0.00
);

create index on roadmap_items (creator_user_id);
create index on roadmap_items (state);
create index on roadmap_items (avg_score desc, upvote_count desc);
create index roadmap_items_search_idx on roadmap_items using gin (to_tsvector('english', title || ' ' || body));

alter table roadmap_items enable row level security;

create policy "Public can view all roadmap items" on roadmap_items
  for select to anon using (true);
create policy "Authenticated users can view all roadmap items" on roadmap_items
  for select to authenticated using (true);
create policy "Users can create roadmap items for themselves" on roadmap_items
  for insert to authenticated with check (creator_user_id = public.agentsmith_user_id());
create policy "Users can update their own roadmap items" on roadmap_items
  for update to authenticated using (creator_user_id = public.agentsmith_user_id()) with check (creator_user_id = public.agentsmith_user_id());

create or replace function notify_on_state_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  _title text := format('Roadmap Item "%s" is now %s', new.title, new.state);
  _user_action text;
begin
  if old.state is distinct from new.state then
    insert into public.alerts (user_id, type, title, description, roadmap_item_id)
    select
      u.id as user_id,
      'ROADMAP_ITEM_STATE_CHANGED' as type,
      _title as title,
      format(
        'The roadmap item you %s, "%s", changed from %s to %s.',
        case when u.id = new.creator_user_id then 'created' else 'upvoted' end,
        new.title,
        old.state,
        new.state
      ) as description,
      new.id as roadmap_item_id
    from (
      select distinct user_id as id from public.roadmap_upvotes where roadmap_item_id = new.id
      union
      select new.creator_user_id as id
    ) u
    where not exists (
      select 1 from public.alerts a
      where a.user_id = u.id
        and a.type = 'ROADMAP_ITEM_STATE_CHANGED'
        and a.roadmap_item_id = new.id
        and a.created_at > now() - interval '5 minutes'
    );
  end if;
  return new;
end;
$$;

create trigger trg_alert_on_state_change
after update of state on roadmap_items
for each row execute function notify_on_state_change();

create or replace function search_roadmap_items(search_term text)
returns setof public.roadmap_items language sql stable set search_path = '' as $$
  select *
  from public.roadmap_items
  where to_tsvector('english', title || ' ' || body) @@ plainto_tsquery('english', search_term)
  order by ts_rank(to_tsvector('english', title || ' ' || body), plainto_tsquery('english', search_term)) desc;
$$;

create table roadmap_upvotes (
  id               bigint primary key generated always as identity,
  roadmap_item_id  bigint not null references roadmap_items(id) on delete cascade,
  user_id          bigint not null references public.agentsmith_users(id) on delete cascade,
  score            smallint not null check (score between 1 and 5),
  created_at       timestamptz default now(),
  updated_at       timestamptz default now(),
  unique (roadmap_item_id, user_id)
);

create index on roadmap_upvotes (user_id);
create index on roadmap_upvotes (roadmap_item_id);

alter table roadmap_upvotes enable row level security;

create policy "Users can view their own upvotes" on roadmap_upvotes
  for select to authenticated using (user_id = public.agentsmith_user_id());
create policy "Users can create, update, and delete their own upvotes" on roadmap_upvotes
  for all to authenticated using (user_id = public.agentsmith_user_id()) with check (user_id = public.agentsmith_user_id());

create or replace function refresh_roadmap_item_metrics()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.roadmap_items
  set   upvote_count = (select count(*) from public.roadmap_upvotes where roadmap_item_id = coalesce(new.roadmap_item_id, old.roadmap_item_id)),
        avg_score    = coalesce((select avg(score)::numeric(3,2) from public.roadmap_upvotes where roadmap_item_id = coalesce(new.roadmap_item_id, old.roadmap_item_id)), 0)
  where id = coalesce(new.roadmap_item_id, old.roadmap_item_id);
  return null;
end;
$$;

create trigger trg_refresh_metrics
after insert or update of score or delete on roadmap_upvotes
for each row execute function refresh_roadmap_item_metrics();

create table alerts (
  id               bigint primary key generated always as identity,
  uuid             uuid not null unique default gen_random_uuid(),
  user_id          bigint not null references public.agentsmith_users(id) on delete cascade,
  type             text not null,
  title            text not null,
  description      text,
  roadmap_item_id  bigint references roadmap_items(id) on delete set null,
  created_at       timestamptz default now() not null,
  read_at          timestamptz
);

create index on alerts (user_id, read_at nulls first, created_at desc);
create index on alerts (roadmap_item_id);
create index on alerts (type);

alter table alerts enable row level security;

create policy "Users can view their own alerts" on alerts
  for select to authenticated using (user_id = public.agentsmith_user_id());
create policy "Users can update their own alerts" on alerts
  for update to authenticated using (user_id = public.agentsmith_user_id()) with check (user_id = public.agentsmith_user_id());

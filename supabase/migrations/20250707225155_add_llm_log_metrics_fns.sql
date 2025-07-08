-- function to get aggregated metrics data with dynamic time buckets
create or replace function get_llm_log_metrics(
  arg_project_id integer,
  arg_start_date timestamp with time zone,
  arg_end_date timestamp with time zone,
  arg_model text default null,
  arg_provider text default null,
  arg_prompt_id integer default null,
  arg_source text default null,
  arg_group_by text default null
) returns table (
  bucket_timestamp timestamp with time zone,
  group_dimension text,
  total_tokens bigint,
  total_prompt_tokens bigint,
  total_completion_tokens bigint,
  total_cost numeric,
  avg_duration_ms numeric,
  request_count bigint
)
set search_path = ''
as $$
declare
  date_diff_days integer;
  bucket_interval interval;
begin
  -- check if user has access to this project
  if not public.has_project_access(arg_project_id) then
    raise exception 'Access denied: insufficient permissions for project %', arg_project_id;
  end if;
  
  -- calculate date difference in days
  date_diff_days := extract(epoch from (arg_end_date - arg_start_date)) / 86400;
  
  -- protect against queries that are too large (max 365 days)
  if date_diff_days > 365 then
    raise exception 'Date range cannot exceed 365 days. Requested: % days', date_diff_days;
  end if;
  
  -- determine bucket size based on date range
  if date_diff_days <= 3 then
    bucket_interval := interval '1 hour';
  elsif date_diff_days <= 7 then
    bucket_interval := interval '4 hours';
  elsif date_diff_days <= 30 then
    bucket_interval := interval '1 day';
  else
    bucket_interval := interval '1 week';
  end if;
  
  return query
  select
    extensions.time_bucket(bucket_interval, ll.created_at) as bucket_timestamp,
    case 
      when arg_group_by = 'model' then coalesce(ll.model, 'Unknown')
      when arg_group_by = 'provider' then coalesce(ll.provider, 'Unknown')
      when arg_group_by = 'prompt' then coalesce(p.name, 'Unknown')
      when arg_group_by = 'source' then coalesce(ll.source::text, 'Unknown')
      else 'All'
    end as group_dimension,
    coalesce(sum(ll.total_tokens), 0)::bigint as total_tokens,
    coalesce(sum(ll.prompt_tokens), 0)::bigint as total_prompt_tokens,
    coalesce(sum(ll.completion_tokens), 0)::bigint as total_completion_tokens,
    coalesce(sum(ll.cost_usd), 0)::numeric as total_cost,
    coalesce(avg(ll.duration_ms), 0)::numeric as avg_duration_ms,
    count(*)::bigint as request_count
  from public.llm_logs ll
  left join public.prompt_versions pv on ll.prompt_version_id = pv.id
  left join public.prompts p on pv.prompt_id = p.id
  where ll.project_id = arg_project_id
    and ll.created_at >= arg_start_date
    and ll.created_at <= arg_end_date
    and ll.end_time is not null -- only completed requests
    and (arg_model is null or ll.model = arg_model)
    and (arg_provider is null or ll.provider = arg_provider)
    and (arg_prompt_id is null or ll.prompt_version_id in (
      select pv2.id from public.prompt_versions pv2 where pv2.prompt_id = arg_prompt_id
    ))
    and (arg_source is null or ll.source = arg_source::public.llm_log_source)
  group by 
    extensions.time_bucket(bucket_interval, ll.created_at),
    case 
      when arg_group_by = 'model' then coalesce(ll.model, 'Unknown')
      when arg_group_by = 'provider' then coalesce(ll.provider, 'Unknown')
      when arg_group_by = 'prompt' then coalesce(p.name, 'Unknown')
      when arg_group_by = 'source' then coalesce(ll.source::text, 'Unknown')
      else 'All'
    end
  order by bucket_timestamp, group_dimension;
end;
$$ language plpgsql;

-- function to get available filter options for a project within date range
create or replace function get_llm_log_filter_options(
  arg_project_id integer,
  arg_start_date timestamp with time zone,
  arg_end_date timestamp with time zone
) returns table (
  models text[],
  providers text[],
  prompts jsonb,
  sources text[]
)
set search_path = ''
as $$
declare
  date_diff_days integer;
begin
  -- check if user has access to this project
  if not public.has_project_access(arg_project_id) then
    raise exception 'Access denied: insufficient permissions for project %', arg_project_id;
  end if;
  
  -- calculate date difference in days
  date_diff_days := extract(epoch from (arg_end_date - arg_start_date)) / 86400;
  
  -- protect against queries that are too large (max 90 days)
  if date_diff_days > 90 then
    raise exception 'Date range cannot exceed 90 days. Requested: % days', date_diff_days;
  end if;
  
  return query
  select
    array_agg(distinct ll.model) filter (where ll.model is not null) as models,
    array_agg(distinct ll.provider) filter (where ll.provider is not null) as providers,
    jsonb_agg(distinct jsonb_build_object('id', p.id, 'name', p.name)) filter (where p.id is not null) as prompts,
    array_agg(distinct ll.source::text) filter (where ll.source is not null) as sources
  from public.llm_logs ll
  left join public.prompt_versions pv on ll.prompt_version_id = pv.id
  left join public.prompts p on pv.prompt_id = p.id
  where ll.project_id = arg_project_id
    and ll.end_time is not null
    and ll.created_at >= arg_start_date
    and ll.created_at <= arg_end_date;
end;
$$ language plpgsql;

-- create indices for better performance on frequently queried columns
create index on public.llm_logs (project_id, created_at);
create index on public.llm_logs (model) where model is not null;
create index on public.llm_logs (provider) where provider is not null;
create index on public.llm_logs (source);
create index on public.llm_logs (end_time) where end_time is not null;

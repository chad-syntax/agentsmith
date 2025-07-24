-- Helper function to check if the organization is under or at its llm_logs limit (inclusive)
create or replace function is_under_llm_logs_limit(arg_project_id bigint)
returns boolean
language sql
security definer
set search_path = ''
as $$
with org as (
    select organization_id
    from public.projects
    where id = arg_project_id
),
llm_logs_limit as (
    select coalesce(t.llm_logs_limit, 1000) as limit
    from public.organizations o
    left join public.agentsmith_tiers t on t.id = o.agentsmith_tier_id
    where o.id = (select organization_id from org)
),
llm_logs_count as (
    select count(*) as count
    from public.llm_logs l
    inner join public.projects p on p.id = l.project_id
    where p.organization_id = (select organization_id from org)
    and l.created_at >= date_trunc('month', now())
)
select llm_logs_count.count < llm_logs_limit.limit
from llm_logs_count, llm_logs_limit;
$$;
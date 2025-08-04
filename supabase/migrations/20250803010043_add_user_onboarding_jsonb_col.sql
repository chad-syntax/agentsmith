alter table public.agentsmith_users add column onboarding jsonb;

create or replace function public.jsonb_deep_merge(a jsonb, b jsonb)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
    result jsonb;
begin
    select jsonb_object_agg(
        coalesce(e1.ka, e2.kb),
        case
            when e1.va is null then e2.vb
            when e2.vb is null then e1.va
            else e1.va || e2.vb
        end
    )
    into result
    from jsonb_each(a) as e1(ka, va)
    full join jsonb_each(b) as e2(kb, vb) on e1.ka = e2.kb;

    return result;
end;
$$;

create or replace function public.update_agentsmith_user_onboarding(arg_onboarding_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  var_user_id bigint;
  var_existing_onboarding jsonb;
  var_new_onboarding jsonb;
begin
  -- fetch user id from session
  select public.agentsmith_user_id() into var_user_id;

  -- fetch already existing onboarding data
  select coalesce(onboarding, '{}'::jsonb) from public.agentsmith_users where id = var_user_id into var_existing_onboarding;

  -- merge with new data
  var_new_onboarding := public.jsonb_deep_merge(var_existing_onboarding, arg_onboarding_data);

  -- update agentsmith_users table
  update public.agentsmith_users set onboarding = var_new_onboarding where id = var_user_id;

  -- return merged data
  return var_new_onboarding;
end;
$$;
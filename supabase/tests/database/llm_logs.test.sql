begin;

-- deallocate any prepared statements to reset the session
deallocate all;

-- format the output for tap testing
\pset format unaligned
\pset tuples_only true
\pset pager off

-- revert all changes on failure
\set ON_ERROR_ROLLBACK 1
\set ON_ERROR_STOP true

-- plan the number of tests
select plan(5);

-- helper function to get user ids
create or replace function get_test_user_id(test_email text) 
returns uuid
security definer
set search_path = ''
language plpgsql as $$
begin
    return (
        select id 
        from auth.users 
        where email = test_email
    );
end;
$$;

-- helper function to reset session
create or replace function reset_session()
returns void
language plpgsql as $$
begin
    perform set_config('request.jwt.claim.role', null, true);
    perform set_config('request.jwt.claim.sub', null, true);
    set role postgres;
end;
$$;

-- Helper function to set up test context
create or replace function set_auth_user(test_email text)
returns void
language plpgsql as $$
begin
    perform set_config('request.jwt.claim.role', 'authenticated', true);
    perform set_config('request.jwt.claim.sub', get_test_user_id(test_email)::text, true);
    set role authenticated;
end;
$$;

-- Helper function to create a test llm_log entry
create or replace function create_test_llm_log(
    p_project_id bigint,
    p_prompt_version_id bigint
) returns bigint
language plpgsql as $$
declare
    v_id bigint;
begin
    insert into llm_logs (
        project_id,
        prompt_version_id,
        prompt_variables,
        raw_input,
        raw_output,
        start_time,
        end_time
    ) values (
        p_project_id,
        p_prompt_version_id,
        '{"variable1": "value1"}'::jsonb,
        '{"input": "test input"}'::jsonb,
        '{"output": "test output"}'::jsonb,
        now(),
        now()
    ) returning id into v_id;
    
    return v_id;
end;
$$;

-- Reset session at start
select reset_session();

-- test 1: pro member can insert llm_logs for their projects
select set_auth_user('pro_member@example.com');

-- First, get a project and prompt_version that the pro member has access to
prepare get_pro_project_and_prompt_version as
select 
    p.id as project_id,
    pv.id as prompt_version_id
from projects p
join prompts pr on pr.project_id = p.id
join prompt_versions pv on pv.prompt_id = pr.id
join organizations o on o.id = p.organization_id
join organization_users ou on ou.organization_id = o.id
join agentsmith_users agu on agu.id = ou.user_id
where o.name = 'Pro Organization'
and agu.auth_user_id = get_test_user_id('pro_member@example.com')
limit 1;

prepare member_insert_llm_log as
insert into llm_logs (
    project_id,
    prompt_version_id,
    prompt_variables,
    raw_input,
    raw_output,
    start_time,
    end_time
)
select 
    p.id,
    pv.id,
    '{"variable1": "value1"}'::jsonb,
    '{"input": "test input"}'::jsonb,
    '{"output": "test output"}'::jsonb,
    now(),
    now()
from projects p
join prompts pr on pr.project_id = p.id
join prompt_versions pv on pv.prompt_id = pr.id
join organizations o on o.id = p.organization_id
join organization_users ou on ou.organization_id = o.id
join agentsmith_users agu on agu.id = ou.user_id
where o.name = 'Pro Organization'
and agu.auth_user_id = get_test_user_id('pro_member@example.com')
limit 1;

select lives_ok(
    'member_insert_llm_log',
    'pro member can insert llm_logs for their projects'
);

-- test 2: pro member can view llm_logs in their organization's projects
select isnt_empty(
    'select id from llm_logs limit 1',
    'pro member can view llm_logs in their organization''s projects'
);

-- test 3: pro member can update llm_logs for their projects
prepare member_update_llm_log as
update llm_logs
set raw_output = '{"output": "updated output"}'::jsonb
where id in (
    select l.id
    from llm_logs l
    join projects p on p.id = l.project_id
    join organizations o on o.id = p.organization_id
    join organization_users ou on ou.organization_id = o.id
    join agentsmith_users agu on agu.id = ou.user_id
    where o.name = 'Pro Organization'
    and agu.auth_user_id = get_test_user_id('pro_member@example.com')
    limit 1
);

select lives_ok(
    'member_update_llm_log',
    'pro member can update llm_logs for their projects'
);

-- test 4: pro member cannot delete llm_logs
-- First, get the ID of a log to attempt to delete
do $$
declare
    v_log_id bigint;
begin
    select l.id into v_log_id
    from llm_logs l
    join projects p on p.id = l.project_id
    join organizations o on o.id = p.organization_id
    join organization_users ou on ou.organization_id = o.id
    join agentsmith_users agu on agu.id = ou.user_id
    where o.name = 'Pro Organization'
    and agu.auth_user_id = get_test_user_id('pro_member@example.com')
    limit 1;
    
    -- Attempt to delete the log
    if v_log_id is not null then
        execute 'delete from llm_logs where id = ' || v_log_id;
    end if;
end;
$$;

-- Check if the record still exists (it should if delete is properly restricted)
select is(
    exists(
        select 1 
        from llm_logs l
        join projects p on p.id = l.project_id
        join organizations o on o.id = p.organization_id
        join organization_users ou on ou.organization_id = o.id
        join agentsmith_users agu on agu.id = ou.user_id
        where o.name = 'Pro Organization'
        and agu.auth_user_id = get_test_user_id('pro_member@example.com')
    ),
    true,
    'pro member cannot delete llm_logs'
);

-- test 5: user cannot view llm_logs from projects they don't have access to
-- First, create a log entry for a project the ee_member doesn't have access to
select reset_session();
-- We need postgres role here to create a record that would normally be created by a pro user
-- This is just for test setup purposes
set role postgres;

do $$
declare
    v_project_id bigint;
    v_prompt_version_id bigint;
    v_log_id bigint;
begin
    -- Get a Pro project that ee_member doesn't have access to
    select p.id, pv.id
    into v_project_id, v_prompt_version_id
    from projects p
    join prompts pr on pr.project_id = p.id
    join prompt_versions pv on pv.prompt_id = pr.id
    join organizations o on o.id = p.organization_id
    where o.name = 'Pro Organization'
    limit 1;
    
    if v_project_id is not null and v_prompt_version_id is not null then
        select create_test_llm_log(v_project_id, v_prompt_version_id) into v_log_id;
    end if;
end;
$$;

-- Test that ee_member cannot view the log from Pro organization
select set_auth_user('ee_member@example.com');

prepare get_pro_org_logs as
select l.id
from llm_logs l
join projects p on p.id = l.project_id
join organizations o on o.id = p.organization_id
where o.name = 'Pro Organization';

select is_empty(
    'get_pro_org_logs',
    'ee_member cannot view llm_logs from projects they don''t have access to'
);

-- finish the tests
select * from finish();

rollback; 
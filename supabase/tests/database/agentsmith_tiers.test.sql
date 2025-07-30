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
select plan(14);

-- helper function to get user ids
create or replace function get_test_user_id(test_email text) 
returns uuid
security definer
set search_path = ''
language plpgsql as $$
declare
    result_id uuid;
begin
    select id into result_id 
    from auth.users 
    where email = test_email
    limit 1;
    
    return result_id;
end;
$$;

-- helper function to get user ids and set up test context
create or replace function set_auth_user(test_email text)
returns void
language plpgsql as $$
declare
    user_id uuid;
begin
    user_id := get_test_user_id(test_email);
    perform set_config('request.jwt.claim.role', 'authenticated', true);
    perform set_config('request.jwt.claim.sub', user_id::text, true);
    set role authenticated;
end;
$$;

-- helper function to get agentsmith_user_id from email
create or replace function get_agentsmith_user_id_from_email(user_email text)
returns bigint
security definer
set search_path = public, pg_temp
language plpgsql as $$
declare
    user_id bigint;
begin
    select agu.id into user_id
    from agentsmith_users agu
    join auth.users u on u.id = agu.auth_user_id
    where u.email = user_email
    limit 1;
    
    return user_id;
end;
$$;

-- helper function to switch to postgres user (superuser) for debugging queries
create or replace function set_postgres_user()
returns void
language plpgsql as $$
begin
    reset role;
end;
$$;

-- helper function to get organization id from tier name
create or replace function get_org_id_by_tier(tier_name text)
returns bigint
language plpgsql as $$
declare
    org_id bigint;
begin
    select o.id into org_id
    from organizations o
    join agentsmith_tiers t on o.agentsmith_tier_id = t.id
    where t.name = tier_name
    limit 1;
    
    return org_id;
end;
$$;

-- helper function to get project id from its name (assumes unique names in test fixtures)
create or replace function get_project_id_by_name(project_name text)
returns bigint
security definer
set search_path = public, pg_temp
language plpgsql as $$
declare
    proj_id bigint;
begin
    select p.id into proj_id
    from public.projects p
    where p.name = project_name
    limit 1;

    return proj_id;
end;
$$;


create role test_user with login password 'password' bypassrls;
grant authenticated to test_user;

-- test 1: attempting to insert a user to a FREE tier org should fail since FREE tier is not allowed to have more than 1 user
set role test_user;
prepare add_user_to_free_org as
    insert into organization_users (organization_id, user_id, role)
    values (get_org_id_by_tier('Free'), get_agentsmith_user_id_from_email('pro_member@example.com'), 'MEMBER');

select throws_ok(
    'add_user_to_free_org',
    '23514',
    'attempting to insert a user to a FREE tier org should fail'
);
reset role;

-- test 2: attempting to insert a user to a PRO tier org should succeed
select set_auth_user('pro_admin@example.com');
prepare add_user_to_pro_org as
    insert into organization_users (organization_id, user_id, role)
    values (get_org_id_by_tier('Pro'), get_agentsmith_user_id_from_email('free@example.com'), 'MEMBER');

select lives_ok(
    'add_user_to_pro_org',
    'attempting to insert a user to a PRO tier org should succeed'
);

-- test 3: attempting to insert a user to an ENTERPRISE tier org should succeed
select set_auth_user('ee_admin@example.com');
prepare add_user_to_enterprise_org as
    insert into organization_users (organization_id, user_id, role)
    values (get_org_id_by_tier('Enterprise'), get_agentsmith_user_id_from_email('free@example.com'), 'MEMBER');

select lives_ok(
    'add_user_to_enterprise_org',
    'attempting to insert a user to an ENTERPRISE tier org should succeed'
);

-- test 4: attempting to insert a fourth user into a HOBBY tier org should fail since HOBBY tier is not allowed to have more than 3 users
select set_auth_user('hobby_admin@example.com');
-- first add a third user to the hobby org
set role test_user;
insert into organization_users (organization_id, user_id, role)
values (get_org_id_by_tier('Hobby'), get_agentsmith_user_id_from_email('free@example.com'), 'MEMBER');

-- now try to add a fourth user
prepare add_fourth_user_to_hobby_org as
    insert into organization_users (organization_id, user_id, role)
    values (get_org_id_by_tier('Hobby'), get_agentsmith_user_id_from_email('pro_admin@example.com'), 'MEMBER');

select throws_ok(
    'add_fourth_user_to_hobby_org',
    '23514',
    'attempting to insert a fourth user into a HOBBY tier org should fail'
);
reset role;
drop role if exists test_user;

-- test 6: attempting to insert a project into a PRO tier org should succeed
select set_auth_user('pro_admin@example.com');
prepare add_project_to_pro_org as
    insert into projects (organization_id, name, created_by)
    values (get_org_id_by_tier('Pro'), 'Pro Project', get_agentsmith_user_id_from_email('pro_admin@example.com'));

select lives_ok(
    'add_project_to_pro_org',
    'attempting to insert a project into a PRO tier org should succeed'
);

-- test 7: attempting to insert a project into an ENTERPRISE tier org should succeed
select set_auth_user('ee_admin@example.com');
prepare add_project_to_enterprise_org as
    insert into projects (organization_id, name, created_by)
    values (get_org_id_by_tier('Enterprise'), 'Enterprise Project', get_agentsmith_user_id_from_email('ee_admin@example.com'));

select lives_ok(
    'add_project_to_enterprise_org',
    'attempting to insert a project into an ENTERPRISE tier org should succeed'
);

-- test 8: attempting to insert a project into a HOBBY tier org should succeed
select set_auth_user('hobby_admin@example.com');
prepare add_project_to_hobby_org as
    insert into projects (organization_id, name, created_by)
    values (get_org_id_by_tier('Hobby'), 'Hobby Project', get_agentsmith_user_id_from_email('hobby_admin@example.com'));

select lives_ok(
    'add_project_to_hobby_org',
    'attempting to insert a project into a HOBBY tier org should succeed'
);

-- ----------------------------------------------------------------------
-- test 5: attempting to insert a project into a FREE tier org should fail
--        since FREE tier is not allowed to have more than 1 project
-----------------------------------------------------------------------
select set_auth_user('free@example.com');
prepare add_project_to_free_org as
    insert into projects (organization_id, name, created_by)
    values (get_org_id_by_tier('Free'), 'Another Free Project', get_agentsmith_user_id_from_email('free@example.com'));

select throws_ok(
    'add_project_to_free_org',
    'new row violates row-level security policy "Enforce project limit for organization tier" for table "projects"',
    'attempting to insert a project into a FREE tier org should fail'
);

-- ----------------------------------------------------------------------
-- test 9: attempting to insert a fourth project into a HOBBY tier org should fail
--        since HOBBY tier is not allowed to have more than 3 projects
-----------------------------------------------------------------------
select set_auth_user('hobby_admin@example.com');
prepare add_fourth_project_to_hobby_org as
    insert into projects (organization_id, name, created_by)
    values (get_org_id_by_tier('Hobby'), 'Hobby Project 4', get_agentsmith_user_id_from_email('hobby_admin@example.com'));

select throws_ok(
    'add_fourth_project_to_hobby_org',
    'new row violates row-level security policy "Enforce project limit for organization tier" for table "projects"',
    'attempting to insert a fourth project into a HOBBY tier org should fail'
);

-- ----------------------------------------------------------------------
-- Prompt limit tests setup ------------------------------------------------
-- ----------------------------------------------------------------------

-- Debug: Show current prompt count per project before setup
\echo 'Free project id (free user):'
select get_project_id_by_name('Free Project');

\echo 'Free project id (postgres user):'
select set_postgres_user();
select get_project_id_by_name('Free Project');
select set_auth_user('free@example.com');

\echo 'Prompt count for Free Project before extra inserts:'
select count(*) from prompts where project_id = get_project_id_by_name('Free Project');

\echo 'Prompt count for Hobby Project 1 before extra inserts:'
select count(*) from prompts where project_id = get_project_id_by_name('Hobby Project 1');

\echo 'Prompt count for Pro Project 1 before extra inserts:'
select count(*) from prompts where project_id = get_project_id_by_name('Pro Project 1');

-- Insert additional prompts for the FREE project so that it currently has 4 prompts
select set_postgres_user();

-- Insert prompts for Free project up to 3 extra prompts (total expected 4 with initial seed)
insert into prompts (project_id, name, slug)
select get_project_id_by_name('Free Project'),
       'Free Auto Prompt ' || gs,
       'free-auto-prompt-' || gs
from generate_series(1, (
    select greatest(0, 3 - (select count(*) from prompts where project_id = get_project_id_by_name('Free Project')))
)) as gs
on conflict do nothing;

-- Trim any extras so we have *exactly* 4 prompts
-- Clean up any extra prompts (>3 besides hello-world) by deleting their versions first, then the prompts
delete from prompt_versions pv
using prompts p
where pv.prompt_id = p.id
  and p.project_id = get_project_id_by_name('Free Project')
  and p.slug <> 'hello-world';

delete from prompts
where project_id = get_project_id_by_name('Free Project')
  and slug <> 'hello-world';

-- If still fewer than 4 (after cleanup), top-up to 4
-- Insert prompts 2-4 so we end with exactly 4 total
insert into prompts (project_id, name, slug)
select get_project_id_by_name('Free Project'),
       'Free Auto Prompt ' || gs,
       'free-auto-prompt-' || gs
from generate_series(2,4) as gs
on conflict do nothing;

select set_auth_user('free@example.com');

\echo 'Prompt count for Free Project after ensuring exactly 4 total prompts (incl. seeded Hello World):'
select count(*) from prompts where project_id = get_project_id_by_name('Free Project');

-- Insert additional prompts for a HOBBY project so that it currently has 99 prompts
select set_postgres_user();

insert into prompts (project_id, name, slug)
select get_project_id_by_name('Hobby Project 1'),
       'Hobby Prompt ' || gs,
       'hobby-prompt-' || gs
from generate_series(1, (
    select greatest(0, 99 - (select count(*) from prompts where project_id = get_project_id_by_name('Hobby Project 1')))
)) as gs;

select set_auth_user('hobby_admin@example.com');

\echo 'Prompt count for Hobby Project 1 after inserting up to 99 prompts:'

select count(*) from prompts where project_id = get_project_id_by_name('Hobby Project 1');

-- Insert additional prompts for a PRO project so that it currently has 100 prompts
select set_postgres_user();

insert into prompts (project_id, name, slug)
select get_project_id_by_name('Pro Project 1'),
       'Pro Prompt ' || gs,
       'pro-prompt-' || gs
from generate_series(1, (
    select greatest(0, 100 - (select count(*) from prompts where project_id = get_project_id_by_name('Pro Project 1')))
)) as gs;

select set_auth_user('pro_admin@example.com');

\echo 'Prompt count for Pro Project 1 after inserting up to 100 prompts:'

select count(*) from prompts where project_id = get_project_id_by_name('Pro Project 1');

-- ----------------------------------------------------------------------
-- test 11: attempting to insert a 5th prompt into a FREE tier project should succeed
-----------------------------------------------------------------------
select set_auth_user('free@example.com');
\echo 'Debug Free Project prompt count before 5th insert:'
select count(*) from prompts where project_id = get_project_id_by_name('Free Project');

\echo 'Debug is_under_prompt_limit for Free Project (before reset):'
select is_under_prompt_limit(get_project_id_by_name('Free Project'));

-- Reset to exactly 1 seeded prompt (hello-world)
select set_postgres_user();
delete from prompts
where project_id = get_project_id_by_name('Free Project')
  and slug <> 'hello-world';

-- Insert prompts 2-4 so total becomes 4
insert into prompts (project_id, name, slug)
select get_project_id_by_name('Free Project'),
       'Free Auto Prompt ' || gs,
       'free-auto-prompt-' || gs
from generate_series(2,4) as gs
on conflict do nothing;

select set_auth_user('free@example.com');
\echo 'Prompt count for Free Project after seeding to 4:'
select count(*) from prompts where project_id = get_project_id_by_name('Free Project');

prepare add_5th_prompt_to_free_project as
    insert into prompts (project_id, name, slug)
    values (get_project_id_by_name('Free Project'), 'Free Prompt 5', 'free-prompt-5');

select lives_ok(
    'add_5th_prompt_to_free_project',
    'attempting to insert a 5th prompt into a FREE tier project should succeed'
);
-- Note: if this block is skipped the above lives_ok is skipped, keeping the plan count correct.

-- ----------------------------------------------------------------------
-- test 10: attempting to insert a 6th prompt into a FREE tier project should fail
-----------------------------------------------------------------------
prepare add_6th_prompt_to_free_project as
    insert into prompts (project_id, name, slug)
    values (get_project_id_by_name('Free Project'), 'Free Prompt 6', 'free-prompt-6');

select throws_ok(
    'add_6th_prompt_to_free_project',
    'new row violates row-level security policy "Enforce prompt limit for organization tier" for table "prompts"',
    'attempting to insert a 6th prompt into a FREE tier project should fail'
);

-- ----------------------------------------------------------------------
-- test 13: attempting to insert a 100th prompt into a HOBBY tier project should succeed
-----------------------------------------------------------------------
select set_auth_user('hobby_admin@example.com');
prepare add_100th_prompt_to_hobby_project as
    insert into prompts (project_id, name, slug)
    values (get_project_id_by_name('Hobby Project 1'), 'Hobby Prompt 100', 'hobby-prompt-100');

select lives_ok(
    'add_100th_prompt_to_hobby_project',
    'attempting to insert a 100th prompt into a HOBBY tier project should succeed'
);

-- ----------------------------------------------------------------------
-- test 12: attempting to insert a 101st prompt into a HOBBY tier project should fail
-----------------------------------------------------------------------
prepare add_101st_prompt_to_hobby_project as
    insert into prompts (project_id, name, slug)
    values (get_project_id_by_name('Hobby Project 1'), 'Hobby Prompt 101', 'hobby-prompt-101');

select throws_ok(
    'add_101st_prompt_to_hobby_project',
    'new row violates row-level security policy "Enforce prompt limit for organization tier" for table "prompts"',
    'attempting to insert a 101st prompt into a HOBBY tier project should fail'
);

-- ----------------------------------------------------------------------
-- test 14: attempting to insert a 101st prompt into a PRO tier project should succeed (unlimited for practical purposes)
-----------------------------------------------------------------------
select set_auth_user('pro_admin@example.com');
prepare add_101st_prompt_to_pro_project as
    insert into prompts (project_id, name, slug)
    values (get_project_id_by_name('Pro Project 1'), 'Pro Prompt 101', 'pro-prompt-101');

select lives_ok(
    'add_101st_prompt_to_pro_project',
    'attempting to insert a 101st prompt into a PRO tier project should succeed'
);

select * from finish();

rollback; 
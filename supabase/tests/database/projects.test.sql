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
select plan(6);

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

-- Reset session at start
select reset_session();

-- test 1: pro member can view projects in their organization
select set_auth_user('pro_member@example.com');

select isnt_empty(
    'select name from projects where name like ''Pro Project%''',
    'pro member can view projects in their organization'
);

-- test 2: pro member cannot create projects
prepare member_create_project as
insert into projects (name, organization_id, created_by)
select 
    'Test Project',
    o.id,
    agu.id
from organizations o
cross join agentsmith_users agu
where o.name = 'Pro Organization'
and agu.auth_user_id = get_test_user_id('pro_member@example.com');

select throws_ok(
    'member_create_project',
    'new row violates row-level security policy for table "projects"',
    'pro member cannot create projects'
);

-- test 3: pro admin can create projects
select set_auth_user('pro_admin@example.com');

prepare admin_create_project as
insert into projects (name, organization_id, created_by)
select 
    'Test Project',
    o.id,
    agu.id
from organizations o
cross join agentsmith_users agu
where o.name = 'Pro Organization'
and agu.auth_user_id = get_test_user_id('pro_admin@example.com');

select lives_ok(
    'admin_create_project',
    'pro admin can create projects'
);

-- test 4: enterprise member can view enterprise projects
select set_auth_user('ee_member@example.com');

select isnt_empty(
    'select name from projects where name like ''Enterprise Project%''',
    'enterprise member can view enterprise projects'
);

-- test 5: pro admin can delete project and all related records
select set_auth_user('pro_admin@example.com');

-- Delete related records in order
delete from prompt_variables
where prompt_version_id in (
    select pv.id
    from prompt_versions pv
    join prompts p on p.id = pv.prompt_id
    join projects pr on pr.id = p.project_id
    where pr.name = 'Pro Project 1'
);

delete from prompt_versions
where prompt_id in (
    select p.id
    from prompts p
    join projects pr on pr.id = p.project_id
    where pr.name = 'Pro Project 1'
);

delete from prompts
where project_id in (
    select id from projects where name = 'Pro Project 1'
);

delete from global_contexts
where project_id in (
    select id from projects where name = 'Pro Project 1'
);

prepare delete_project as
delete from projects where name = 'Pro Project 1';

select lives_ok(
    'execute delete_project',
    'pro admin can delete project and all related records'
);

-- test 6: pro member cannot delete projects
select reset_session();
select set_auth_user('pro_member@example.com');

delete from projects where name = 'Pro Project 2';

select is(
    exists(select 1 from projects where name = 'Pro Project 2'),
    true,
    'pro member cannot delete projects'
);

-- finish the tests
select * from finish();

rollback;



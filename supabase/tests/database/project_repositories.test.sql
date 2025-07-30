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
select plan(9);

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

-- helper functions to get ids
create or replace function get_pro_admin_org_id()
returns bigint
security definer
set search_path = public, pg_temp
language plpgsql as $$
declare
    org_id bigint;
begin
    select o.id into org_id
    from organizations o
    join agentsmith_users agu on agu.id = o.created_by
    join auth.users u on u.id = agu.auth_user_id
    where u.email = 'pro_admin@example.com'
    limit 1;
    
    return org_id;
end;
$$;

create or replace function get_test_installation_id()
returns bigint
security definer
set search_path = public, pg_temp
language plpgsql as $$
declare
    install_id bigint;
begin
    select id into install_id
    from github_app_installations
    where organization_id = get_pro_admin_org_id()
    limit 1;
    
    return install_id;
end;
$$;

create or replace function get_pro_project_id()
returns bigint
security definer
set search_path = public, pg_temp
language plpgsql as $$
declare
    proj_id bigint;
begin
    select id into proj_id
    from projects
    where organization_id = get_pro_admin_org_id()
    limit 1;
    
    return proj_id;
end;
$$;

-- Reset session at start
select reset_session();

-- Set up test data as postgres
-- Ensure pro_member is part of pro organization
insert into organization_users (organization_id, user_id, role)
select 
    get_pro_admin_org_id(),
    agu.id,
    'MEMBER'
from agentsmith_users agu
join auth.users u on u.id = agu.auth_user_id
where u.email = 'pro_member@example.com'
on conflict (organization_id, user_id) do nothing;

-- Insert test data
insert into github_app_installations (
    organization_id,
    installation_id,
    status
)
select 
    get_pro_admin_org_id(),
    12345,
    'ACTIVE'
where not exists (
    select 1 from github_app_installations 
    where organization_id = get_pro_admin_org_id()
);

-- Insert test repository
insert into project_repositories (
    project_id,
    organization_id,
    github_app_installation_id,
    repository_id,
    repository_name,
    repository_full_name,
    repository_default_branch
)
select 
    get_pro_project_id(),
    get_pro_admin_org_id(),
    get_test_installation_id(),
    54321,
    'test-repo',
    'org/test-repo',
    'main'
where not exists (
    select 1 from project_repositories 
    where organization_id = get_pro_admin_org_id()
);

-- test 1: pro admin can view repositories
select set_auth_user('pro_admin@example.com');

select isnt_empty(
    'select * from project_repositories where organization_id = ' || get_pro_admin_org_id(),
    'pro admin can view project repositories'
);

-- test 2: pro member can view repositories
select set_auth_user('pro_member@example.com');

select isnt_empty(
    'select * from project_repositories where organization_id = ' || get_pro_admin_org_id(),
    'pro member can view project repositories'
);

-- test 3: pro member cannot create repositories
select set_auth_user('pro_member@example.com');

prepare member_create_repository as
insert into project_repositories (
    project_id,
    organization_id,
    github_app_installation_id,
    repository_id,
    repository_name,
    repository_full_name,
    repository_default_branch
)
select 
    get_pro_project_id(),
    get_pro_admin_org_id(),
    get_test_installation_id(),
    99999,
    'new-repo',
    'org/new-repo',
    'main';

select throws_ok(
    'member_create_repository',
    null,
    'pro member cannot create repositories'
);

-- test 4: pro admin can create repositories
select set_auth_user('pro_admin@example.com');

prepare admin_create_repository as
insert into project_repositories (
    project_id,
    organization_id,
    github_app_installation_id,
    repository_id,
    repository_name,
    repository_full_name,
    repository_default_branch
)
select 
    get_pro_project_id(),
    get_pro_admin_org_id(),
    get_test_installation_id(),
    99999,
    'new-repo',
    'org/new-repo',
    'main';

select lives_ok(
    'admin_create_repository',
    'pro admin can create repositories'
);

-- test 5: github_webhook role can view repositories
select reset_session();
set role github_webhook;

select isnt_empty(
    'select * from project_repositories',
    'github_webhook role can view repositories'
);

-- test 6: github_webhook role can update repositories
prepare webhook_update_repository as
update project_repositories 
set repository_name = 'updated-repo'
where organization_id = get_pro_admin_org_id();

select lives_ok(
    'webhook_update_repository',
    'github_webhook role can update repositories'
);

-- test 7: github_webhook role can create repositories
prepare webhook_create_repository as
insert into project_repositories (
    project_id,
    organization_id,
    github_app_installation_id,
    repository_id,
    repository_name,
    repository_full_name,
    repository_default_branch
)
select 
    get_pro_project_id(),
    get_pro_admin_org_id(),
    get_test_installation_id(),
    88888,
    'webhook-repo',
    'org/webhook-repo',
    'main';

select lives_ok(
    'webhook_create_repository',
    'github_webhook role can create repositories'
);

-- test 8: github_webhook role can delete repositories
prepare webhook_delete_repository as
delete from project_repositories 
where organization_id = get_pro_admin_org_id()
and repository_id = 99999;

select lives_ok(
    'webhook_delete_repository',
    'github_webhook role can delete repositories'
);

-- test 9: cannot create duplicate repository entries
select set_auth_user('pro_admin@example.com');

prepare duplicate_repository as
insert into project_repositories (
    project_id,
    organization_id,
    github_app_installation_id,
    repository_id,
    repository_name,
    repository_full_name,
    repository_default_branch
)
select 
    get_pro_project_id(),
    get_pro_admin_org_id(),
    get_test_installation_id(),
    54321, -- Same repository_id as in setup
    'test-repo-dupe',
    'org/test-repo-dupe',
    'main';

select throws_ok(
    'duplicate_repository',
    '23505', -- unique violation error code
    'duplicate key value violates unique constraint "project_repositories_github_app_installation_id_project_id__key"',
    'cannot create duplicate repository entry with same installation, project, and repository IDs'
);

-- finish the tests
select * from finish();

rollback;
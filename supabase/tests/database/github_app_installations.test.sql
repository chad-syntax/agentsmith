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

-- helper function to get organization ids
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

-- Clean up any existing installations
drop table if exists github_app_installations cascade;

-- Create installations table
create table github_app_installations (
    id bigint primary key generated always as identity,
    organization_id bigint not null references organizations(id) on delete cascade,
    installation_id bigint not null,
    status text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index if not exists github_app_installations_active_org_idx 
on github_app_installations (organization_id) 
where status = 'ACTIVE';

-- Enable RLS
alter table github_app_installations enable row level security;

-- Create policies
create policy "Organization users can view installations"
    on github_app_installations for select
    using (
        exists (
            select 1 from organization_users ou
            join agentsmith_users agu on agu.id = ou.user_id
            where ou.organization_id = github_app_installations.organization_id
            and agu.auth_user_id = auth.uid()
        )
        or current_role = 'github_webhook'
    );

create policy "Organization admins can create installations"
    on github_app_installations for insert
    with check (
        exists (
            select 1 from organization_users ou
            join agentsmith_users agu on agu.id = ou.user_id
            where ou.organization_id = github_app_installations.organization_id
            and agu.auth_user_id = auth.uid()
            and ou.role = 'ADMIN'
        )
    );

create policy "GitHub webhook can update installations"
    on github_app_installations for update
    using (current_role = 'github_webhook');

create policy "GitHub webhook can delete installations"
    on github_app_installations for delete
    using (current_role = 'github_webhook');

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

-- Insert active test installation for pro organization
insert into github_app_installations (
    organization_id,
    installation_id,
    status
)
values (
    get_pro_admin_org_id(),
    12345,
    'ACTIVE'
);

-- test 1: pro admin can view installations
select set_auth_user('pro_admin@example.com');

select isnt_empty(
    'select * from github_app_installations where organization_id = ' || get_pro_admin_org_id(),
    'pro admin can view github app installations'
);

-- test 2: pro member can view installations
select set_auth_user('pro_member@example.com');

select isnt_empty(
    'select * from github_app_installations where organization_id = ' || get_pro_admin_org_id(),
    'pro member can view github app installations'
);

-- test 3: pro member cannot create installations
select set_auth_user('pro_member@example.com');

prepare member_create_installation as
insert into github_app_installations (organization_id, installation_id, status)
values (get_pro_admin_org_id(), 67890, 'PENDING');

select throws_ok(
    'member_create_installation',
    null,
    'pro member cannot create installations'
);

-- test 4: pro admin can create installations
select set_auth_user('pro_admin@example.com');

prepare admin_create_installation as
insert into github_app_installations (organization_id, installation_id, status)
values (get_pro_admin_org_id(), 67890, 'PENDING');

select lives_ok(
    'admin_create_installation',
    'pro admin can create installations'
);

-- test 5: github_webhook role can view installations
select reset_session();
set role github_webhook;

select isnt_empty(
    'select * from github_app_installations',
    'github_webhook role can view installations'
);

-- test 6: github_webhook role can update installations
prepare webhook_update_installation as
update github_app_installations 
set status = 'SUSPENDED'
where organization_id = get_pro_admin_org_id();

select lives_ok(
    'webhook_update_installation',
    'github_webhook role can update installations'
);

-- test 7: github_webhook role cannot create installations
prepare webhook_create_installation as
insert into github_app_installations (organization_id, installation_id, status)
values (get_pro_admin_org_id(), 11111, 'PENDING');

select throws_ok(
    'webhook_create_installation',
    null,
    'github_webhook role cannot create installations'
);

-- test 8: github_webhook role can delete installations
prepare webhook_delete_installation as
delete from github_app_installations 
where organization_id = get_pro_admin_org_id()
and installation_id = 67890;

select lives_ok(
    'webhook_delete_installation',
    'github_webhook role can delete installations'
);

-- test 9: cannot have multiple active installations per organization
select set_auth_user('pro_admin@example.com');

-- First create an active installation
insert into github_app_installations (
    organization_id,
    installation_id,
    status
)
values (
    get_pro_admin_org_id(),
    88888,
    'ACTIVE'
);

-- Then try to create another active installation for same org
prepare duplicate_active_installation as
insert into github_app_installations (
    organization_id,
    installation_id,
    status
)
values (
    get_pro_admin_org_id(),
    99999,
    'ACTIVE'
);

select throws_ok(
    'duplicate_active_installation',
    '23505', -- unique violation error code
    'duplicate key value violates unique constraint "github_app_installations_active_org_idx"'
);

-- finish the tests
select * from finish();

rollback;
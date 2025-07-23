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

-- helper functions to get the organization ids
create or replace function get_free_user_org_id()
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
    where u.email = 'free@example.com'
    limit 1;
    
    return org_id;
end;
$$;

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

create or replace function get_user_id_from_email(user_email text)
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

-- helper function to count visible organizations for a user
create or replace function count_visible_orgs()
returns integer
language sql as $$
    select count(*)::integer from organizations;
$$;

-- update organization tiers to match test requirements
update organizations
set agentsmith_tier_id = (select id from agentsmith_tiers where name = 'Free')
where id = get_free_user_org_id();

update organizations
set agentsmith_tier_id = (select id from agentsmith_tiers where name = 'Pro')
where id = get_pro_admin_org_id();

-- ensure pro_member is part of pro_admin's organization with member role
insert into organization_users (organization_id, user_id, role)
select 
    get_pro_admin_org_id(), 
    get_user_id_from_email('pro_member@example.com'), 
    'MEMBER'
on conflict (organization_id, user_id) 
do update set role = 'MEMBER';

-- test 1: free user can view their organization
select reset_session();
select set_auth_user('free@example.com');
select cmp_ok(
    count_visible_orgs(), '>=', 1,
    'free user can view at least their organization'
);

-- test 2: pro admin can view their organization
select reset_session();
select set_auth_user('pro_admin@example.com');
select cmp_ok(
    count_visible_orgs(), '>=', 1,
    'pro admin can view at least their organization'
);

-- test 3: pro member can view their organization
select reset_session();
select set_auth_user('pro_member@example.com');
select cmp_ok(
    count_visible_orgs(), '>=', 1,
    'pro member can view at least their organization'
);

-- test 4: pro admin can add users
select reset_session();
select set_auth_user('pro_admin@example.com');
prepare add_user as 
    insert into organization_users (organization_id, user_id, role) 
    select get_pro_admin_org_id(), get_user_id_from_email('free@example.com'), 'MEMBER'
    on conflict (organization_id, user_id) 
    do update set role = 'MEMBER';

select lives_ok(
    'add_user',
    'pro admin can add users'
);

-- test 5: pro member has correct role
select reset_session();
select set_auth_user('pro_member@example.com');
select results_eq(
    $$select role::text from organization_users ou
    where ou.organization_id = get_pro_admin_org_id()
    and ou.user_id = (select id from agentsmith_users where auth_user_id = auth.uid())$$,
    array['MEMBER'],
    'pro member has correct role'
);

-- test 6: pro member cannot add users
select reset_session();
select set_auth_user('pro_member@example.com');
prepare member_add_user as
    insert into organization_users (organization_id, user_id, role) 
    select get_pro_admin_org_id(), get_user_id_from_email('free@example.com'), 'MEMBER';

select throws_ok(
    'member_add_user',
    null,
    'pro member cannot add users'
);

-- test 7: pro admin can remove users
select reset_session();
select set_auth_user('pro_admin@example.com');
prepare remove_user as
    delete from organization_users ou
    where ou.organization_id = get_pro_admin_org_id()
    and ou.user_id = get_user_id_from_email('pro_member@example.com');

select lives_ok(
    'remove_user',
    'pro admin can remove users'
);

-- re-add the user for future tests
insert into organization_users (user_id, organization_id, role) 
select get_user_id_from_email('pro_member@example.com'), get_pro_admin_org_id(), 'MEMBER'
on conflict (organization_id, user_id) 
do update set role = 'MEMBER';

-- test 8: pro admin can change user roles
select reset_session();
select set_auth_user('pro_admin@example.com');
prepare change_role as
    update organization_users ou
    set role = 'ADMIN' 
    where ou.organization_id = get_pro_admin_org_id()
    and ou.user_id = get_user_id_from_email('pro_member@example.com');

select lives_ok(
    'change_role',
    'pro admin can change user roles'
);

-- reset member role for the next test
update organization_users 
set role = 'MEMBER'
where organization_id = get_pro_admin_org_id()
and user_id = get_user_id_from_email('pro_member@example.com');

-- test 9: non-admin user cannot rename organization
select reset_session();
select set_auth_user('pro_member@example.com');

prepare rename_org_test as
    select rename_organization(
        (select uuid from organizations where id = get_pro_admin_org_id()),
        'Hacked Organization'
    );

select throws_ok(
    'rename_org_test',
    'User is not an organization admin',
    'non-admin user cannot rename organization'
);

-- clean up
rollback;

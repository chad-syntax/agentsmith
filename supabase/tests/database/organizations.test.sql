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
select plan(8);

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

-- Helper function to get user ids and set up test context
create or replace function set_auth_user(test_email text)
returns void
language plpgsql as $$
begin
    perform set_config('request.jwt.claim.role', 'authenticated', true);
    perform set_config('request.jwt.claim.sub', get_test_user_id(test_email)::text, true);
    set role authenticated;
end;
$$;

-- test 1: free user can only view their organization
select set_auth_user('free@example.com');
select results_eq(
    'select name from organizations',
    array['Free Organization'],
    'free user can only view their organization'
);

-- test 2: pro admin can view their organization
select set_auth_user('pro_admin@example.com');
select results_eq(
    'select name from organizations where name = ''Pro Organization''',
    array['Pro Organization'],
    'pro admin can view their organization'
);

-- test 3: pro member can view their organization
select set_auth_user('pro_member@example.com');
select results_eq(
    'select name from organizations where name = ''Pro Organization''',
    array['Pro Organization'],
    'pro member can view their organization'
);

-- test 4: pro admin can add users
select set_auth_user('pro_admin@example.com');
prepare add_user as 
    insert into organization_users (organization_id, user_id, role) 
    select o.id, agu.id, 'MEMBER'
    from organizations o
    cross join agentsmith_users agu
    where o.name = 'Pro Organization'
    and agu.auth_user_id = get_test_user_id('free@example.com');
select lives_ok(
    'add_user',
    'pro admin can add users'
);

-- test 5: pro member has correct role
select set_auth_user('pro_member@example.com');
select results_eq(
    $$select role::text from organization_users ou
    join organizations o on o.id = ou.organization_id
    where o.name = 'Pro Organization'
    and ou.user_id = (select id from agentsmith_users where auth_user_id = auth.uid())$$,
    array['MEMBER'],
    'pro member has correct role'
);

-- test 6: pro member cannot add users
select set_auth_user('pro_member@example.com');
prepare member_add_user as
    insert into organization_users (organization_id, user_id, role)
    select o.id, agu.id, 'MEMBER'
    from organizations o
    cross join agentsmith_users agu
    where o.name = 'Pro Organization'
    and agu.auth_user_id = get_test_user_id('free@example.com');
execute member_add_user;
select is_empty(
    $$select 1 from organization_users ou
    join agentsmith_users agu on agu.id = ou.user_id
    join organizations o on o.id = ou.organization_id
    where o.name = 'Pro Organization'
    and agu.auth_user_id = get_test_user_id('free@example.com')$$,
    'pro member cannot add users'
);

-- test 7: pro admin can remove users
select set_auth_user('pro_admin@example.com');
prepare remove_user as
delete from organization_users ou
using organizations o, agentsmith_users agu
where o.id = ou.organization_id
and agu.id = ou.user_id
and o.name = 'Pro Organization'
and agu.auth_user_id = get_test_user_id('pro_member@example.com');

select lives_ok(
    'remove_user',
    'pro admin can remove users'
);

-- test 8: pro admin can change user roles
select set_auth_user('pro_admin@example.com');
prepare change_role as
update organization_users ou
set role = 'ADMIN'
from organizations o, agentsmith_users agu
where o.id = ou.organization_id
and agu.id = ou.user_id
and o.name = 'Pro Organization'
and agu.auth_user_id = get_test_user_id('pro_member@example.com');

select lives_ok(
    'change_role',
    'pro admin can change user roles'
);

-- finish the tests
select * from finish();

rollback;

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

-- Debug: Check existing data
\echo 'Existing auth.users:'
select id, email from auth.users;

\echo 'Existing agentsmith_users:'
select * from agentsmith_users;

\echo 'Existing organizations:'
select * from organizations;

\echo 'Existing organization_users:'
select ou.*, au.auth_user_id, u.email 
from organization_users ou
join agentsmith_users au on au.id = ou.user_id
join auth.users u on u.id = au.auth_user_id;

-- plan the number of tests
select plan(19);

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

-- Helper function to switch to postgres user for verification
create or replace function set_postgres_user()
returns void
language plpgsql as $$
begin
    reset role;
end;
$$;

-- Helper function to get organization id for a user
create or replace function get_test_organization_id(test_email text)
returns bigint
security definer
set search_path = ''
language plpgsql as $$
declare
    org_id bigint;
begin
    select o.id into org_id
    from public.organizations o
    join public.organization_users ou on ou.organization_id = o.id
    join public.agentsmith_users au on au.id = ou.user_id
    where au.auth_user_id = public.get_test_user_id(test_email);
    return org_id;
end;
$$;

-- test 1: organization member can view organization keys
select set_auth_user('pro_member@example.com');

select isnt_empty(
    $$select key from organization_keys ok
    where ok.organization_id = get_test_organization_id('pro_member@example.com')
    and key = 'test-key-' || get_test_organization_id('pro_member@example.com')$$,
    'organization member can view organization keys'
);

-- test 1.1: organization admin can view organization keys
select set_auth_user('pro_admin@example.com');

select isnt_empty(
    $$select key from organization_keys ok
    where ok.organization_id = get_test_organization_id('pro_member@example.com')
    and key = 'test-key-' || get_test_organization_id('pro_member@example.com')$$,
    'organization admin can view organization keys'
);

-- test 2: non-member cannot view organization keys
select set_auth_user('free@example.com');
select is_empty(
    $$select key from organization_keys ok
    where ok.organization_id = get_test_organization_id('pro_member@example.com')$$,
    'non-member cannot view organization keys'
);

-- test 3: organization admin can insert key
select set_auth_user('pro_admin@example.com');
prepare insert_key as
select create_organization_key(
    arg_organization_id := get_test_organization_id('pro_admin@example.com'),
    arg_key := 'new-test-key',
    arg_value := 'new-test-key-secret',
    arg_description := 'Another test key'
);

select lives_ok(
    'insert_key',
    'organization admin can insert key'
);

-- verify key was actually created
select set_postgres_user();
select isnt_empty(
    $$select * from organization_keys
    where organization_id = get_test_organization_id('pro_admin@example.com')
    and key = 'new-test-key'$$,
    'organization admin should be able to insert key'
);

-- test 4: organization member (non-admin) cannot insert key
select set_auth_user('pro_member@example.com');
prepare insert_key_member as
select create_organization_key(
    arg_organization_id := get_test_organization_id('pro_member@example.com'),
    arg_key := 'member-test-key',
    arg_value := 'member-test-key-secret',
    arg_description := 'Member test key'
);

select lives_ok(
    'insert_key_member',
    'organization member attempt to insert key should not throw'
);

-- verify no key was actually created
select set_postgres_user();
select is_empty(
    $$select * from organization_keys
    where organization_id = get_test_organization_id('pro_member@example.com')
    and key = 'member-test-key'$$,
    'organization member should not be able to insert key'
);

-- test 5: organization admin can delete key
select set_auth_user('pro_admin@example.com');
prepare delete_key as
select delete_organization_key(
    arg_organization_id := get_test_organization_id('pro_admin@example.com'),
    arg_key_name := 'new-test-key'
);

select lives_ok(
    'delete_key',
    'organization admin can delete key'
);

-- verify key was actually deleted
select set_postgres_user();
select is_empty(
    $$select * from organization_keys
    where organization_id = get_test_organization_id('pro_admin@example.com')
    and key = 'new-test-key'$$,
    'organization admin should be able to delete key'
);

-- test 6-8: test RPC functions with member (non-admin) permissions
select set_auth_user('pro_member@example.com');

-- test 6: create_organization_key RPC function should fail for non-admin
prepare create_key_test as
select create_organization_key(
    arg_organization_id := get_test_organization_id('pro_member@example.com'),
    arg_key := 'api-key-test',
    arg_value := 'test-secret-value', 
    arg_description := 'Test API key'
);

select lives_ok(
    'create_key_test',
    'create_organization_key RPC function should not throw for non-admin'
);

-- verify no key was created
select set_postgres_user();
select is_empty(
    $$select * from organization_keys
    where organization_id = get_test_organization_id('pro_member@example.com')
    and key = 'api-key-test'$$,
    'non-admin should not be able to create key via RPC'
);

-- test 7: create key as admin for subsequent tests
select set_auth_user('pro_admin@example.com');
select create_organization_key(
    arg_organization_id := get_test_organization_id('pro_admin@example.com'),
    arg_key := 'admin-key-test',
    arg_value := 'test-secret-value',
    arg_description := 'Admin test key'
);

-- verify key was created
select set_postgres_user();
select isnt_empty(
    $$select * from organization_keys
    where organization_id = get_test_organization_id('pro_admin@example.com')
    and key = 'admin-key-test'$$,
    'admin should be able to create key for subsequent tests'
);

-- test 8: get_organization_vault_secret RPC function retrieves secret
select set_auth_user('pro_member@example.com');
prepare get_secret_test as
select get_organization_vault_secret(
    (select vault_secret_id 
     from organization_keys 
     where organization_id = get_test_organization_id('pro_admin@example.com')
     and key = 'admin-key-test')
) is not null as secret_found;

select results_eq(
    'get_secret_test',
    $$values (true)$$,
    'get_organization_vault_secret RPC function should return secret for member'
);

-- test 9: delete_organization_key RPC function should fail for non-admin
select set_auth_user('pro_member@example.com');
prepare delete_key_test as
select delete_organization_key(
    arg_organization_id := get_test_organization_id('pro_admin@example.com'),
    arg_key_name := 'admin-key-test'
);

select lives_ok(
    'delete_key_test',
    'delete_organization_key RPC function should not throw for non-admin'
);

-- verify key still exists
select set_postgres_user();
select isnt_empty(
    $$select * from organization_keys
    where organization_id = get_test_organization_id('pro_admin@example.com')
    and key = 'admin-key-test'$$,
    'non-admin should not be able to delete key via RPC'
);

-- test 10: admin can delete key
select set_auth_user('pro_admin@example.com');
select delete_organization_key(
    arg_organization_id := get_test_organization_id('pro_admin@example.com'),
    arg_key_name := 'admin-key-test'
);

select set_postgres_user();
select is_empty(
    $$select * from organization_keys
    where organization_id = get_test_organization_id('pro_admin@example.com')
    and key = 'admin-key-test'$$,
    'admin should be able to delete key'
);

-- test 11: verify that users cannot access secrets from organizations they don't belong to
-- First create a secret as admin
select set_auth_user('pro_admin@example.com');
select create_organization_key(
    arg_organization_id := get_test_organization_id('pro_admin@example.com'),
    arg_key := 'secure-secret-key',
    arg_value := 'top-secret-value',
    arg_description := 'Security test key'
);

-- Try to access as non-member
select set_auth_user('free@example.com');
select ok(
    get_organization_vault_secret(
        (select vault_secret_id 
         from organization_keys 
         where organization_id = get_test_organization_id('pro_admin@example.com')
         and key = 'secure-secret-key')
    ) is null,
    'Users should not be able to access secrets from organizations they do not belong to'
);

-- test 12: cleanup final test key
select set_auth_user('pro_admin@example.com');

-- verify key exists before deletion
select set_postgres_user();
select isnt_empty(
    $$select * from organization_keys
    where organization_id = get_test_organization_id('pro_admin@example.com')
    and key = 'secure-secret-key'$$,
    'key should exist before final deletion'
);

select delete_organization_key(
    arg_organization_id := get_test_organization_id('pro_admin@example.com'),
    arg_key_name := 'secure-secret-key'
);

-- verify key was deleted
select set_postgres_user();
select is_empty(
    $$select * from organization_keys
    where organization_id = get_test_organization_id('pro_admin@example.com')
    and key = 'secure-secret-key'$$,
    'key should be deleted in final test'
);

-- finish the tests
select * from finish();

rollback; 
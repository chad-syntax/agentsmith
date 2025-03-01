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
select plan(23);

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

-- Helper function to get the Pro Organization id
create or replace function get_pro_organization_id()
returns bigint
security definer
set search_path = ''
language plpgsql as $$
declare
    pro_org_id bigint;
begin
    select id into pro_org_id
    from public.organizations
    where name = 'Pro Organization'
    limit 1;
    return pro_org_id;
end;
$$;

-- Helper function to get the Enterprise Organization id
create or replace function get_enterprise_organization_id()
returns bigint
security definer
set search_path = ''
language plpgsql as $$
declare
    enterprise_org_id bigint;
begin
    select id into enterprise_org_id
    from public.organizations
    where name = 'Enterprise Organization'
    limit 1;
    return enterprise_org_id;
end;
$$;

-- test 1: organization member can view organization keys
select set_auth_user('pro_member@example.com');

select isnt_empty(
    $$select key from organization_keys ok
    where ok.organization_id = $$ || get_pro_organization_id() || $$
    and key = 'test-key-$$ || get_pro_organization_id() || $$'$$,
    'organization member can view organization keys'
);

-- test 1.1: organization admin can view organization keys
select set_auth_user('pro_admin@example.com');

select isnt_empty(
    $$select key from organization_keys ok
    where ok.organization_id = $$ || get_pro_organization_id() || $$
    and key = 'test-key-$$ || get_pro_organization_id() || $$'$$,
    'organization admin can view organization keys'
);

-- test 2: non-member cannot view organization keys
select set_auth_user('free@example.com');
select is_empty(
    $$select key from organization_keys ok
    where ok.organization_id = $$ || get_pro_organization_id(),
    'non-member cannot view organization keys'
);

-- test 3: organization admin can insert key
select set_auth_user('pro_admin@example.com');
prepare insert_key as
select create_organization_key(
    arg_organization_uuid := (select uuid from organizations where id = get_pro_organization_id()),
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
    where organization_id = $$ || get_pro_organization_id() || $$
    and key = 'new-test-key'$$,
    'organization admin should be able to insert key'
);

-- test 4: organization member (non-admin) cannot insert key
select set_auth_user('pro_member@example.com');
prepare insert_key_member_result as
select create_organization_key(
    arg_organization_uuid := (select uuid from organizations where id = get_pro_organization_id()),
    arg_key := 'member-test-key',
    arg_value := 'member-test-key-secret',
    arg_description := 'Member test key'
);

select results_eq(
    'insert_key_member_result',
    $$values ('{"success": false, "error": "user is not an organization admin"}'::jsonb)$$,
    'organization member should not be able to insert key'
);

-- verify no key was actually created
select set_postgres_user();
select is_empty(
    $$select * from organization_keys
    where organization_id = $$ || get_pro_organization_id() || $$
    and key = 'member-test-key'$$,
    'organization member should not be able to insert key'
);

-- test 5: organization admin can delete key
select set_auth_user('pro_admin@example.com');
prepare delete_key as
select delete_organization_key(
    arg_organization_uuid := (select uuid from organizations where id = get_pro_organization_id()),
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
    where organization_id = $$ || get_pro_organization_id() || $$
    and key = 'new-test-key'$$,
    'organization admin should be able to delete key'
);

-- test 6: create_organization_key RPC function should fail for non-admin
select set_auth_user('pro_member@example.com');

prepare create_key_test_result as
select create_organization_key(
    arg_organization_uuid := (select uuid from organizations where id = get_pro_organization_id()),
    arg_key := 'api-key-test',
    arg_value := 'test-secret-value', 
    arg_description := 'Test API key'
);

select results_eq(
    'create_key_test_result',
    $$values ('{"success": false, "error": "user is not an organization admin"}'::jsonb)$$,
    'create_organization_key RPC function should return error for non-admin'
);

-- Create key as admin for subsequent tests (not counted as a test)
select set_auth_user('pro_admin@example.com');
select create_organization_key(
    arg_organization_uuid := (select uuid from organizations where id = get_pro_organization_id()),
    arg_key := 'admin-key-test',
    arg_value := 'test-secret-value',
    arg_description := 'Admin test key'
);

-- verify key was created
select set_postgres_user();
select exists(
    select 1
    from organization_keys
    where organization_id = get_pro_organization_id()
    and key = 'admin-key-test'
) as admin_key_created;

-- test 7: get_organization_vault_secret RPC function retrieves secret
select set_auth_user('pro_admin@example.com');
select create_organization_key(
    arg_organization_uuid := (select uuid from organizations where id = get_pro_organization_id()),
    arg_key := 'secret-test-key',
    arg_value := 'secret-test-value',
    arg_description := 'Key for secret test'
);

select set_postgres_user();
select exists(
    select 1 from organization_keys
    where organization_id = get_pro_organization_id()
    and key = 'secret-test-key'
) as key_exists;

-- Get the vault_secret_id for testing
create or replace function get_test_vault_secret_id() returns uuid as $$
declare
    test_vault_id uuid;
begin
    select vault_secret_id into test_vault_id
    from organization_keys
    where organization_id = get_pro_organization_id()
    and key = 'secret-test-key';
    return test_vault_id;
end;
$$ language plpgsql;

select set_auth_user('pro_member@example.com');
prepare get_secret_test as
select get_organization_vault_secret(get_test_vault_secret_id()) is not null as secret_found;

select results_eq(
    'get_secret_test',
    $$values (true)$$,
    'get_organization_vault_secret RPC function should return secret for member'
);

-- test 8: delete_organization_key RPC function should fail for non-admin
select set_auth_user('pro_member@example.com');
prepare delete_key_test as
select delete_organization_key(
    arg_organization_uuid := (select uuid from organizations where id = get_pro_organization_id()),
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
    where organization_id = $$ || get_pro_organization_id() || $$
    and key = 'admin-key-test'$$,
    'non-admin should not be able to delete key via RPC'
);

-- test 9: admin can delete key
select set_auth_user('pro_admin@example.com');
select delete_organization_key(
    arg_organization_uuid := (select uuid from organizations where id = get_pro_organization_id()),
    arg_key_name := 'admin-key-test'
);

select set_postgres_user();
select is_empty(
    $$select * from organization_keys
    where organization_id = $$ || get_pro_organization_id() || $$
    and key = 'admin-key-test'$$,
    'admin should be able to delete key'
);

-- test 10: verify that users cannot access secrets from organizations they don't belong to
-- First create a secret as admin
select set_auth_user('pro_admin@example.com');
select create_organization_key(
    arg_organization_uuid := (select uuid from organizations where id = get_pro_organization_id()),
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
         where organization_id = get_pro_organization_id()
         and key = 'secure-secret-key')
    ) is null,
    'Users should not be able to access secrets from organizations they do not belong to'
);

-- Cleanup secured secret key (not counted as a test)
select set_auth_user('pro_admin@example.com');
select delete_organization_key(
    arg_organization_uuid := (select uuid from organizations where id = get_pro_organization_id()),
    arg_key_name := 'secure-secret-key'
);

-- test 11: duplicate key names should not be allowed
select set_auth_user('pro_admin@example.com');

-- First, create a key
select create_organization_key(
    arg_organization_uuid := (select uuid from organizations where id = get_pro_organization_id()),
    arg_key := 'duplicate-test-key',
    arg_value := 'duplicate-test-value',
    arg_description := 'Test key for duplicate check'
);

-- Now try to create another key with the same name
prepare duplicate_key_test as
select create_organization_key(
    arg_organization_uuid := (select uuid from organizations where id = get_pro_organization_id()),
    arg_key := 'duplicate-test-key',
    arg_value := 'another-test-value',
    arg_description := 'This should fail'
);

select throws_ok(
    'duplicate_key_test',
    '23505', -- unique violation
    'duplicate key value violates unique constraint "secrets_name_idx"',
    'Duplicate key names should not be allowed in the same organization'
);

-- Clean up the test key
select delete_organization_key(
    arg_organization_uuid := (select uuid from organizations where id = get_pro_organization_id()),
    arg_key_name := 'duplicate-test-key'
);

-- test 12: key name with null value should fail
select set_auth_user('pro_admin@example.com');
prepare null_value_key_test as
select create_organization_key(
    arg_organization_uuid := (select uuid from organizations where id = get_pro_organization_id()),
    arg_key := 'null-value-key',
    arg_value := null,
    arg_description := 'This should fail due to null value'
);

select throws_ok(
    'null_value_key_test',
    '23502',
    'null value in column "secret" of relation "secrets" violates not-null constraint',
    'Key with null value should not be allowed'
);

-- test 13: test behavior when trying to create a key for an organization that doesn't exist
select set_auth_user('pro_admin@example.com');
prepare invalid_org_key_test as
select create_organization_key(
    arg_organization_uuid := 'ffffffff-ffff-ffff-ffff-ffffffffffff',
    arg_key := 'invalid-org-key',
    arg_value := 'test-value',
    arg_description := 'This should fail due to invalid organization'
);

select lives_ok(
    'invalid_org_key_test',
    'Creating key for non-existent organization should handle gracefully'
);

-- Verify the result shows an error message
select results_eq(
    'invalid_org_key_test',
    $$values ('{"error": "user is not an organization admin", "success": false}'::jsonb)$$,
    'Creating key for non-existent organization should return error status'
);

-- test 14: test behavior when trying to delete a non-existent key
select set_auth_user('pro_admin@example.com');
prepare delete_nonexistent_key as
select delete_organization_key(
    arg_organization_uuid := (select uuid from organizations where id = get_pro_organization_id()),
    arg_key_name := 'key-that-does-not-exist'
);

select lives_ok(
    'delete_nonexistent_key',
    'Deleting non-existent key should not throw an error'
);

-- Verify that the result indicates no deletion occurred
prepare delete_nonexistent_key_result as
select delete_organization_key(
    arg_organization_uuid := (select uuid from organizations where id = get_pro_organization_id()),
    arg_key_name := 'key-that-does-not-exist'
);

select results_eq(
    'delete_nonexistent_key_result',
    $$values ('{"success": true, "message": "key not found, nothing to delete"}'::jsonb)$$,
    'Deleting non-existent key should return appropriate message'
);

-- test 15: member of one organization should not be able to view keys from another organization
-- First, create a key in the Enterprise Organization
select set_auth_user('ee_admin@example.com');
select create_organization_key(
    arg_organization_uuid := (select uuid from organizations where id = get_enterprise_organization_id()),
    arg_key := 'enterprise-key',
    arg_value := 'enterprise-secret',
    arg_description := 'Enterprise test key'
);

-- Try to access as a member of Pro Organization
select set_auth_user('pro_member@example.com');
select is_empty(
    $$select * from organization_keys
    where organization_id = $$ || get_enterprise_organization_id() || $$
    and key = 'enterprise-key'$$,
    'Pro organization member should not be able to view Enterprise organization keys'
);

-- Clean up the enterprise key
select set_auth_user('ee_admin@example.com');
select delete_organization_key(
    arg_organization_uuid := (select uuid from organizations where id = get_enterprise_organization_id()),
    arg_key_name := 'enterprise-key'
);

-- test 16: test that the 'description' parameter works correctly in create_organization_key
select set_auth_user('pro_admin@example.com');
select create_organization_key(
    arg_organization_uuid := (select uuid from organizations where id = get_pro_organization_id()),
    arg_key := 'description-test-key',
    arg_value := 'description-test-value',
    arg_description := 'This is a test description'
);

-- Verify that the description was stored correctly
select set_postgres_user();
select ok(
    exists(
        select 1 
        from vault.secrets s
        join public.organization_keys ok on ok.vault_secret_id = s.id
        where ok.organization_id = get_pro_organization_id()
        and ok.key = 'description-test-key'
        and s.description = 'This is a test description'
    ),
    'Key description should be stored correctly in vault.secrets'
);

-- Clean up
select set_auth_user('pro_admin@example.com');
select delete_organization_key(
    arg_organization_uuid := (select uuid from organizations where id = get_pro_organization_id()),
    arg_key_name := 'description-test-key'
);

-- finish the tests
select * from finish();

rollback; 
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

-- Helper function to create vault secret
create or replace function create_test_vault_secret()
returns uuid
security definer
set search_path = ''
language plpgsql as $$
declare
    secret_id uuid := '11111111-1111-1111-1111-111111111111'::uuid;
begin
    insert into vault.secrets (id, name, description, secret)
    values (
        secret_id,
        'test-key',
        'Test key for pro member',
        'test-key-secret'
    );
    return secret_id;
end;
$$;

-- test 1: user can view their own keys
select set_auth_user('pro_member@example.com');

-- Create initial key for pro member
insert into user_keys (user_id, key, vault_secret_id)
select 
    id,
    'test-key',
    create_test_vault_secret()
from agentsmith_users
where auth_user_id = auth.uid();

select isnt_empty(
    $$select key from user_keys uk
    where uk.user_id = (select id from agentsmith_users where auth_user_id = auth.uid())$$,
    'user can view their own keys'
);

-- test 2: user cannot view other users keys
select set_auth_user('free@example.com');
select is_empty(
    $$select key from user_keys uk
    where uk.user_id = (
        select id from agentsmith_users 
        where auth_user_id = get_test_user_id('pro_member@example.com')
    )$$,
    'user cannot view other users keys'
);

-- test 3: user can insert their own key
select set_auth_user('pro_member@example.com');
prepare insert_key as
insert into user_keys (user_id, key, vault_secret_id)
select 
    id,
    'new-test-key',
    '11111111-1111-1111-1111-111111111111'::uuid
from agentsmith_users
where auth_user_id = auth.uid();

select lives_ok(
    'insert_key',
    'user can insert their own key'
);

-- test 4: user can delete their own key
select set_auth_user('pro_member@example.com');
prepare delete_key as
delete from user_keys
where user_id = (select id from agentsmith_users where auth_user_id = auth.uid())
and key = 'new-test-key';

select lives_ok(
    'delete_key',
    'user can delete their own key'
);

-- NEW TESTS FOR RPC FUNCTIONS

-- test 5: create_user_key RPC function creates a key successfully
select set_auth_user('pro_member@example.com');
prepare create_key_test as
select 
    (result->>'success')::boolean as success,
    (result->>'vault_secret_id') is not null as has_vault_id
from (
    select create_user_key(
        arg_key := 'api-key-test',
        arg_value := 'test-secret-value', 
        arg_description := 'Test API key'
    ) as result
) subq;

select results_eq(
    'create_key_test',
    $$values (true, true)$$,
    'create_user_key RPC function should successfully create a key'
);

-- test 6: get_vault_secret RPC function retrieves the secret
select set_auth_user('pro_member@example.com');

prepare get_secret_test as
with key_data as (
    select vault_secret_id
    from user_keys
    where user_id = (select id from agentsmith_users where auth_user_id = auth.uid())
    and key = 'api-key-test'
    limit 1
)
select 
    (get_vault_secret(arg_vault_secret_id := vault_secret_id)->>'value') = 'test-secret-value' as secret_matches
from key_data;

select results_eq(
    'get_secret_test',
    $$values (true)$$,
    'get_vault_secret RPC function should retrieve the correct secret value'
);

-- test 7: delete_user_key RPC function deletes a key
select set_auth_user('pro_member@example.com');
prepare delete_key_test as
select 
    (result->>'success')::boolean as success
from (
    select delete_user_key(arg_key_name := 'api-key-test') as result
) subq;

select results_eq(
    'delete_key_test',
    $$values (true)$$,
    'delete_user_key RPC function should successfully delete a key'
);

-- test 8: get_vault_secret returns null for deleted key
select set_auth_user('pro_member@example.com');
prepare check_deleted_key as
select count(*) = 0 as key_deleted
from user_keys
where user_id = (select id from agentsmith_users where auth_user_id = auth.uid())
and key = 'api-key-test';

select results_eq(
    'check_deleted_key',
    $$values (true)$$,
    'Key should be deleted after calling delete_user_key'
);

-- test 9: verify that users cannot access secrets they don't own (security test)
-- First create a secret for the pro_member user
select set_auth_user('pro_member@example.com');

-- Create a temporary table to store the secret ID
create temporary table security_test_secret (
    vault_secret_id uuid
);

-- Create a secret and store its ID
with create_result as (
    select create_user_key(
        arg_key := 'secure-secret-key',
        arg_value := 'top-secret-value', 
        arg_description := 'Security test key'
    ) as result
)
insert into security_test_secret
select vault_secret_id
from user_keys
where user_id = (select id from agentsmith_users where auth_user_id = auth.uid())
and key = 'secure-secret-key';

-- Now switch to a different user and try to access the secret
select set_auth_user('free@example.com');

-- Using the correct pgTAP syntax to check for NULL
select ok(
    get_vault_secret(arg_vault_secret_id := (select vault_secret_id from security_test_secret)) IS NULL,
    'Users should not be able to access secrets that do not belong to them'
);

-- finish the tests
select * from finish();

rollback;


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
select plan(4);

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

-- finish the tests
select * from finish();

rollback;


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
select plan(2);

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

-- test 1: user can view their own record
select set_auth_user('free@example.com');
select results_eq(
    'select count(*)::text from agentsmith_users where auth_user_id = auth.uid()',
    array['1'],
    'user can view their own record'
);

-- test 2: user cannot view other users records
select set_auth_user('free@example.com');
select is_empty(
    $$select * from agentsmith_users 
    where auth_user_id = get_test_user_id('pro_member@example.com')$$,
    'user cannot view other users records'
);

-- finish the tests
select * from finish();

rollback;

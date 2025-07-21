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
select plan(5);

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

-- helper function to set up test context
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

-- test 3-6: inserting a new auth.users record creates associated records
select reset_session();
set role postgres;

-- create a test email variable
do $$
declare 
    test_email text := 'test_trigger_user@example.com';
    test_user_id uuid;
begin
    -- Skip creation if user already exists (to make tests idempotent)
    if not exists (select 1 from auth.users where email = test_email) then
        -- Insert the user following the pattern from the seeding file
        insert into auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            recovery_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) values (
            '00000000-0000-0000-0000-000000000000',
            uuid_generate_v4(),
            'authenticated',
            'authenticated',
            test_email,
            crypt('password123', gen_salt('bf')),
            current_timestamp,
            current_timestamp,
            current_timestamp,
            '{"provider":"email","providers":["email"]}',
            '{}',
            current_timestamp,
            current_timestamp,
            '',
            '',
            '',
            ''
        ) returning id into test_user_id;
        
        -- Also create the identity record
        insert into auth.identities (
            id,
            user_id,
            provider_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) values (
            uuid_generate_v4(),
            test_user_id,
            test_user_id,
            format('{"sub":"%s","email":"%s"}', test_user_id::text, test_email)::jsonb,
            'email',
            current_timestamp,
            current_timestamp,
            current_timestamp
        );
    end if;
end $$;

-- get the new user's id
create or replace function get_new_test_user_id()
returns uuid
language sql as $$
    select id from auth.users where email = 'test_trigger_user@example.com';
$$;

-- check that the agentsmith_user record was created
select ok(
    exists (
        select 1 from agentsmith_users 
        where auth_user_id = get_new_test_user_id()
    ),
    'agentsmith_user record is automatically created'
);

-- get the new agentsmith_user id
create or replace function get_new_agentsmith_user_id()
returns bigint
language sql as $$
    select id from agentsmith_users where auth_user_id = get_new_test_user_id();
$$;

-- Test same-organization access
select set_auth_user('pro_admin@example.com');
select results_eq(
    $$select count(*)::text from agentsmith_users au
    where exists (
        select 1 from organization_users ou1
        where ou1.user_id = au.id
        and exists (
            select 1 from organization_users ou2
            where ou2.organization_id = ou1.organization_id
            and ou2.user_id = (select id from agentsmith_users where auth_user_id = auth.uid())
        )
    )$$,
    array['2'],
    'user can view agentsmith_users records from same organization'
);

-- Test different-organization access
select set_auth_user('enterprise_admin@example.com');
select is_empty(
    $$select * from agentsmith_users au
    where au.auth_user_id = get_test_user_id('free@example.com')$$,
    'user cannot view agentsmith_users records from different organization'
);

-- finish the tests
select * from finish();

rollback;

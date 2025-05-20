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
select plan(3);

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

-- test 1: pro member can view global contexts in their projects
select set_auth_user('pro_member@example.com');
select isnt_empty(
    $$select gc.content from global_contexts gc
    join projects p on p.id = gc.project_id
    where p.name = 'Pro Project 1'$$,
    'pro member can view global contexts in their projects'
);

-- test 2: pro member can update global contexts
select set_auth_user('pro_member@example.com');
prepare update_global_context as
update global_contexts gc
set content = '{"updated": true}'::jsonb
from projects p
where p.id = gc.project_id
and p.name = 'Pro Project 1';

select lives_ok(
    'update_global_context',
    'pro member can update global contexts'
);

-- test 3: free user cannot view pro organization global contexts
select set_auth_user('free@example.com');
select is_empty(
    $$select gc.content from global_contexts gc
    join projects p on p.id = gc.project_id
    join organizations o on o.id = p.organization_id
    where o.name = 'Pro Organization'$$,
    'free user cannot view pro organization global contexts'
);

-- finish the tests
select * from finish();

rollback;


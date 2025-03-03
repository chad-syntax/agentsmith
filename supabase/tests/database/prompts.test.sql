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

-- test 1: pro member can view prompts in their projects
select set_auth_user('pro_member@example.com');
select isnt_empty(
    'select p.name from prompts p 
     join projects pr on p.project_id = pr.id 
     where pr.name like ''Pro Project%''',
    'pro member can view prompts in their projects'
);

-- test 2: pro member can create prompts
select set_auth_user('pro_member@example.com');
prepare member_create_prompt as
insert into prompts (project_id, name, slug, config)
select 
    id,
    'Test Prompt',
    'test-prompt',
    '{"models": ["openrouter/auto"], "temperature": 1.0}'
from projects 
where name = 'Pro Project 1';

select lives_ok(
    'member_create_prompt',
    'pro member can create prompts'
);

-- test 3: pro member can update prompts
select set_auth_user('pro_member@example.com');
prepare update_prompt as
update prompts
set name = 'Updated Prompt'
where name = 'Test Prompt'
and exists (
    select 1 from projects p
    where p.id = project_id
    and p.name = 'Pro Project 1'
);

select lives_ok(
    'update_prompt',
    'pro member can update prompts'
);

-- test 4: pro member can delete prompts
select set_auth_user('pro_member@example.com');
prepare delete_prompt as
delete from prompts
where name = 'Updated Prompt'
and exists (
    select 1 from projects p
    where p.id = project_id
    and p.name = 'Pro Project 1'
);

select lives_ok(
    'delete_prompt',
    'pro member can delete prompts'
);

-- finish the tests
select * from finish();

rollback;

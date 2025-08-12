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
insert into prompts (project_id, name, slug)
select 
    id,
    'Test Prompt',
    'test-prompt'
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

-- test 5: valid semver version should be accepted
select set_auth_user('pro_member@example.com');
prepare valid_semver as
with new_prompt as (
    insert into prompts (project_id, name, slug)
    select 
        id,
        'Test Prompt for Version',
        'test-prompt-for-version'
    from projects 
    where name = 'Pro Project 1'
    returning id
)
insert into prompt_versions (prompt_id, type, config, content, version, status)
select 
    id,
    'NON_CHAT',
    '{"test": true}'::jsonb,
    'test content',
    '1.0.0',
    'DRAFT'
from new_prompt;

select lives_ok(
    'valid_semver',
    'valid semver version 1.0.0 should be accepted'
);

-- test 6: valid semver with pre-release should be accepted
prepare valid_semver_prerelease as
with new_prompt as (
    insert into prompts (project_id, name, slug)
    select 
        id,
        'Test Prompt for Version Prerelease',
        'test-prompt-for-version-prerelease'
    from projects 
    where name = 'Pro Project 1'
    returning id
)
insert into prompt_versions (prompt_id, type, config, content, version, status)
select 
    id,
    'NON_CHAT',
    '{"test": true}'::jsonb,
    'test content',
    '1.0.0-alpha.1',
    'DRAFT'
from new_prompt;

select lives_ok(
    'valid_semver_prerelease',
    'valid semver version with pre-release 1.0.0-alpha.1 should be accepted'
);

-- test 7: valid semver with build metadata should be accepted
prepare valid_semver_build as
with new_prompt as (
    insert into prompts (project_id, name, slug)
    select 
        id,
        'Test Prompt for Version Build',
        'test-prompt-for-version-build'
    from projects 
    where name = 'Pro Project 1'
    returning id
)
insert into prompt_versions (prompt_id, type, config, content, version, status)
select 
    id,
    'NON_CHAT',
    '{"test": true}'::jsonb,
    'test content',
    '1.0.0+build.123',
    'DRAFT'
from new_prompt;

select lives_ok(
    'valid_semver_build',
    'valid semver version with build metadata 1.0.0+build.123 should be accepted'
);

-- test 8: invalid semver (missing patch) should be rejected
prepare invalid_semver_missing_patch as
with new_prompt as (
    insert into prompts (project_id, name, slug)
    select 
        id,
        'Test Prompt for Invalid Version',
        'test-prompt-for-invalid-version'
    from projects 
    where name = 'Pro Project 1'
    returning id
)
insert into prompt_versions (prompt_id, type, config, content, version, status)
select 
    id,
    'NON_CHAT',
    '{"test": true}'::jsonb,
    'test content',
    '1.0',
    'DRAFT'
from new_prompt;

select throws_ok(
    'invalid_semver_missing_patch',
    '23514',  -- PostgreSQL error code for check_violation
    'new row for relation "prompt_versions" violates check constraint "prompt_versions_version_check"',
    'invalid semver version 1.0 should be rejected'
);

-- test 9: invalid semver (leading v) should be rejected
prepare invalid_semver_leading_v as
with new_prompt as (
    insert into prompts (project_id, name, slug)
    select 
        id,
        'Test Prompt for Invalid Version V',
        'test-prompt-for-invalid-version-v'
    from projects 
    where name = 'Pro Project 1'
    returning id
)
insert into prompt_versions (prompt_id, type, config, content, version, status)
select 
    id,
    'NON_CHAT',
    '{"test": true}'::jsonb,
    'test content',
    'v1.0.0',
    'DRAFT'
from new_prompt;

select throws_ok(
    'invalid_semver_leading_v',
    '23514',  -- PostgreSQL error code for check_violation
    'new row for relation "prompt_versions" violates check constraint "prompt_versions_version_check"',
    'invalid semver version v1.0.0 should be rejected'
);

-- finish the tests
select * from finish();

rollback;

-- Hello World

-- 1. Create the dedicated role for GitHub webhook operations
create role github_webhook with nologin;

grant github_webhook to authenticator;
grant anon to github_webhook;

-- Grant usage on the schema to the new role
-- Adjust 'public' if your tables are in a different schema
grant usage on schema public to github_webhook;


-- 2. Create the Supabase Auth user for the GitHub Webhook
-- This user entity exists in Supabase Auth but will operate *as* the 'github_webhook'
-- role within the database when permissions are checked (typically via SET ROLE in backend logic).

-- Insert into auth.users
with inserted_user as (
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
    )
    select
        '00000000-0000-0000-0000-000000000000',
        uuid_generate_v4(),
        'authenticated',
        'authenticated', -- Standard Supabase role for authenticated users
        'github_webhooks@agentsmith.app',
        crypt(uuid_generate_v4()::text, gen_salt('bf')), -- Random UUID as password since we'll never log in directly
        current_timestamp,
        null, -- No recovery needed typically
        null, -- Not signed in yet
        '{"provider":"email","providers":["email"]}',
        '{"is_webhook_user": true}', -- Add custom metadata if useful
        current_timestamp,
        current_timestamp,
        '',
        '',
        '',
        ''
    returning id, email
)
-- Insert into auth.identities
insert into auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
)
select
    uuid_generate_v4(),
    iu.id,
    iu.id, -- provider_id often matches user_id for email provider
    format('{"sub":"%s","email":"%s"}', iu.id::text, iu.email)::jsonb,
    'email',
    current_timestamp, -- Or null if preferred, matching users table
    current_timestamp,
    current_timestamp
from inserted_user iu;


-- 3. Grant table permissions to the 'github_webhook' role

-- Grant SELECT and UPDATE on github_app_installations
grant select, update on table public.github_app_installations to github_webhook;

-- Grant SELECT and UPDATE on project_repositories
grant select, update on table public.project_repositories to github_webhook;

-- 4. Enable Row Level Security (RLS) on the tables
-- Ensures that the policies defined below are enforced.
alter table public.github_app_installations enable row level security;
alter table public.project_repositories enable row level security;

-- 5. Create RLS policies for the 'github_webhook' role

-- Policies for github_app_installations
create policy "Allow github_webhook select access on github_app_installations"
    on public.github_app_installations
    for select
    to github_webhook
    using (true); -- Allows selecting any row

create policy "Allow github_webhook update access on github_app_installations"
    on public.github_app_installations
    for update
    to github_webhook
    using (true) -- Allows updating any row (can be restricted further if needed)
    with check (true); -- Ensures updated rows still meet the `using` condition (trivial here)

-- Policies for project_repositories
create policy "Allow github_webhook select access on project_repositories"
    on public.project_repositories
    for select
    to github_webhook
    using (true); -- Allows selecting any row

create policy "Allow github_webhook update access on project_repositories"
    on public.project_repositories
    for update
    to github_webhook
    using (true) -- Allows updating any row
    with check (true);

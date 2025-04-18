create role github_webhook with nologin;

grant github_webhook to authenticator;
grant anon to github_webhook;

grant usage on schema public to github_webhook;

CREATE INDEX github_app_installations_status_idx ON public.github_app_installations USING btree (status);

CREATE INDEX github_app_installations_uuid_idx ON public.github_app_installations USING btree (uuid);

grant select on table "public"."github_app_installations" to "github_webhook";

grant update on table "public"."github_app_installations" to "github_webhook";

grant select on table "public"."project_repositories" to "github_webhook";

grant update on table "public"."project_repositories" to "github_webhook";

create policy "Allow github_webhook select access on github_app_installations"
on "public"."github_app_installations"
as permissive
for select
to github_webhook
using (true);


create policy "Allow github_webhook update access on github_app_installations"
on "public"."github_app_installations"
as permissive
for update
to github_webhook
using (true)
with check (true);


create policy "Allow github_webhook select access on project_repositories"
on "public"."project_repositories"
as permissive
for select
to github_webhook
using (true);


create policy "Allow github_webhook update access on project_repositories"
on "public"."project_repositories"
as permissive
for update
to github_webhook
using (true)
with check (true);

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
    uuid_generate_v4(),
    format('{"sub":"%s","email":"%s"}', iu.id::text, iu.email)::jsonb,
    'email',
    current_timestamp, -- Or null if preferred, matching users table
    current_timestamp,
    current_timestamp
from inserted_user iu;

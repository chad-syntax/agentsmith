create schema if not exists agentsmith_utils;

create or replace function agentsmith_utils.create_user(
  arg_email text,
  arg_password text
)
returns void
language plpgsql
security invoker set search_path = ''
as $$
declare
  new_user_id uuid;
begin
  if current_user <> 'postgres' then
    raise exception 'Only postgres user can run this function';
  end if;

  insert into
    auth.users (
      id,
      instance_id,
      role,
      aud,
      email,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      encrypted_password,
      created_at,
      updated_at,
      last_sign_in_at,
      email_confirmed_at,
      confirmation_sent_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    )
  values
    (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      arg_email,
      '{"provider":"email","providers":["email"]}',
      '{}',
      false,
      extensions.crypt(arg_password, extensions.gen_salt('bf')),
      now(),
      now(),
      now(),
      now(),
      now(),
      '',
      '',
      '',
      ''
    ) returning id into new_user_id;

  insert into
    auth.identities (
      id,
      provider_id,
      provider,
      user_id,
      identity_data,
      last_sign_in_at,
      created_at,
      updated_at
    )
  values
    (
      new_user_id,
      new_user_id,
      'email',
      new_user_id,
      json_build_object('sub', new_user_id),
      now(),
      now(),
      now()
    );
end;
$$;

create or replace function create_agentsmith_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  service_account_emails text[] := array['github_webhook@agentsmith.app'];
  var_agentsmith_user_id bigint;
  var_organization_id bigint;
begin
    -- Skip creation of default resources for service accounts
    if new.email = any(service_account_emails) then
        return new;
    end if;

    -- create the agentsmith_users record
    insert into public.agentsmith_users (auth_user_id, email)
    values (new.id, new.email)
    returning id into var_agentsmith_user_id;

    -- create the default organization
    insert into public.organizations (name, tier, created_by)
    values ('Default Organization', 'FREE', var_agentsmith_user_id)
    returning id into var_organization_id;

    -- create the default organization user
    insert into public.organization_users (organization_id, user_id, role)
    values (var_organization_id, var_agentsmith_user_id, 'ADMIN');

    -- create the default project
    insert into public.projects (organization_id, name, created_by)
    values (var_organization_id, 'Default Project', var_agentsmith_user_id);

    return new;
end;
$$;
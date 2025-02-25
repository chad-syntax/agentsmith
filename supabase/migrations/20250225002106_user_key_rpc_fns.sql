-- here is where we implement the rpc functions

-- create rpc function to retrieve a secret from the vault
create or replace function get_vault_secret(arg_vault_secret_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  var_result jsonb;
  var_secret_text text;
  var_auth_uid uuid;
begin
  -- get the current authenticated user
  var_auth_uid := (select auth.uid());
  
  -- only return the secret if the user owns it
  select s.decrypted_secret into var_secret_text
  from vault.decrypted_secrets s
  join public.user_keys uk on uk.vault_secret_id = s.id
  join public.agentsmith_users au on uk.user_id = au.id
  where s.id = arg_vault_secret_id
    and au.auth_user_id = var_auth_uid;
    
  -- convert the text to jsonb - handle null case
  if var_secret_text is not null then
    var_result := jsonb_build_object('value', var_secret_text);
  end if;
  
  return var_result;
end;
$$;

-- create rpc function to create a user key and vault entry
create or replace function create_user_key(
  arg_key text,
  arg_value text,
  arg_description text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  var_user_id int;
  var_new_vault_secret_id uuid;
  var_auth_uid uuid;
begin
  -- get the current authenticated user
  var_auth_uid := (select auth.uid());
  
  -- get the agentsmith_user id
  select id into var_user_id
  from public.agentsmith_users
  where auth_user_id = var_auth_uid;
  
  if var_user_id is null then
    return jsonb_build_object('success', false, 'error', 'user not found');
  end if;
  
  -- first create the vault entry
  insert into vault.secrets (secret, name, description)
  values (arg_value, arg_key, arg_description)
  returning id into var_new_vault_secret_id;
  
  -- now create the user_key entry
  insert into public.user_keys (user_id, key, vault_secret_id)
  values (var_user_id, arg_key, var_new_vault_secret_id);
  
  return jsonb_build_object('success', true, 'vault_secret_id', var_new_vault_secret_id);
end;
$$;

-- create rpc function to delete a user key
create or replace function delete_user_key(
  arg_key_name text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  var_user_id int;
  var_vault_secret_id uuid;
  var_auth_uid uuid;
begin
  -- get the current authenticated user
  var_auth_uid := (select auth.uid());
  
  -- get the agentsmith_user id
  select au.id into var_user_id
  from public.agentsmith_users au
  where au.auth_user_id = var_auth_uid;
  
  if var_user_id is null then
    return jsonb_build_object('success', false, 'error', 'user not found');
  end if;
  
  -- get the vault id for this key
  select uk.vault_secret_id into var_vault_secret_id
  from public.user_keys uk
  where uk.user_id = var_user_id and uk.key = arg_key_name;
  
  if var_vault_secret_id is null then
    -- key doesn't exist, nothing to delete
    return jsonb_build_object('success', true, 'message', 'key not found, nothing to delete');
  end if;
  
  -- delete the user key
  delete from public.user_keys
  where user_id = var_user_id and key = arg_key_name;
  
  -- delete the vault entry
  delete from vault.secrets
  where id = var_vault_secret_id;
  
  return jsonb_build_object('success', true);
end;
$$;
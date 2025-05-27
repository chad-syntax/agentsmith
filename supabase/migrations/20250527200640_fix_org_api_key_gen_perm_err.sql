-- create function to generate api key for new organizations
create or replace function generate_organization_api_key()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  var_new_vault_secret_id uuid;
  var_api_key text;
  var_api_key_hash text;
begin
  -- generate a random api key with prefix
  var_api_key := 'sdk_' || public.gen_random_alphanumeric(32);

  -- hash the api key
  var_api_key_hash := encode(extensions.digest(var_api_key, 'sha256'), 'hex');

  -- create the vault entry
  select vault.create_secret(
    var_api_key,
    'SDK_API_KEY__org__' || new.uuid,
    'SDK API Key for organization ' || new.uuid
  ) into var_new_vault_secret_id;
  

  -- create the organization_key entry
  insert into public.organization_keys (organization_id, key, vault_secret_id, key_hash)
  values (new.id, 'SDK_API_KEY', var_new_vault_secret_id, var_api_key_hash);

  return new;
end;
$$;
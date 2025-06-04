-- create rpc function to create an organization key and vault entry
create or replace function create_organization_key(
  arg_organization_uuid uuid,
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
  var_new_vault_secret_id uuid;
  var_auth_uid uuid;
  var_organization_id bigint;
  var_key_hash text;
begin
  -- get the current authenticated user
  var_auth_uid := (select auth.uid());

  -- get the organization id from the uuid
  select o.id into var_organization_id
  from public.organizations o
  where o.uuid = arg_organization_uuid;

  -- verify user is an admin of the organization
  if not public.is_organization_admin(var_organization_id) then
    return jsonb_build_object('success', false, 'error', 'user is not an organization admin');
  end if;

  -- first create the vault entry
  select vault.create_secret(arg_value, concat(arg_key, '__org__', arg_organization_uuid), arg_description)
  into var_new_vault_secret_id;

  -- hash the key
  var_key_hash := encode(extensions.digest(arg_value, 'sha256'), 'hex');

  -- now create the organization_key entry
  insert into public.organization_keys (organization_id, key, vault_secret_id, key_hash)
  values (var_organization_id, arg_key, var_new_vault_secret_id, var_key_hash);

  return jsonb_build_object('success', true, 'vault_secret_id', var_new_vault_secret_id);
end;
$$;
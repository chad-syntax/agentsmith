create or replace function create_organization_v2(arg_name text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  var_organization_uuid uuid;
  var_organization_id bigint;
  var_project_uuid uuid;
begin
    -- create the organization
    insert into public.organizations (name, created_by)
    values (arg_name, public.agentsmith_user_id())
    returning id, uuid into var_organization_id, var_organization_uuid;

    -- create an admin user for the organization
    insert into public.organization_users (organization_id, user_id, role)
    values (var_organization_id, public.agentsmith_user_id(), 'ADMIN');

    -- create a default project for the organization
    insert into public.projects (organization_id, name, created_by)
    values (var_organization_id, 'Default Project', public.agentsmith_user_id())
    returning uuid into var_project_uuid;

    return jsonb_build_object(
        'organization_uuid', var_organization_uuid,
        'project_uuid', var_project_uuid
    );
end;
$$;
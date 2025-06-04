create or replace function create_llm_log_entry(
    arg_project_uuid uuid,
    arg_version_uuid uuid,
    arg_variables jsonb,
    arg_raw_input jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
    v_project_id bigint;
    v_prompt_version_id bigint;
    v_organization_id bigint;
    v_organization_uuid uuid;
    v_new_log_uuid uuid;
begin
    -- Get project_id and organization_id from project_uuid
    select id, organization_id
    into v_project_id, v_organization_id
    from projects
    where uuid = arg_project_uuid;

    if v_project_id is null then
        raise exception 'Project not found for uuid %', arg_project_uuid;
    end if;

    -- Get organization_uuid from organization_id
    select uuid
    into v_organization_uuid
    from organizations
    where id = v_organization_id;

    if v_organization_uuid is null then
        raise exception 'Organization not found for id % (derived from project uuid %)', v_organization_id, arg_project_uuid;
    end if;

    -- Get prompt_version_id from version_uuid
    select id
    into v_prompt_version_id
    from prompt_versions
    where uuid = arg_version_uuid;

    if v_prompt_version_id is null then
        raise exception 'Prompt version not found for uuid %', arg_version_uuid;
    end if;

    -- Insert into llm_logs and get the new log's uuid
    insert into llm_logs (
        project_id,
        prompt_version_id,
        prompt_variables,
        raw_input,
        start_time
    )
    values (
        v_project_id,
        v_prompt_version_id,
        arg_variables,
        arg_raw_input,
        now()
    )
    returning uuid into v_new_log_uuid;

    -- Return the new log's uuid and the organization's uuid as a JSON object
    return jsonb_build_object('log_uuid', v_new_log_uuid, 'organization_uuid', v_organization_uuid);
end;
$$;

-- Generate 50,000 LLM log records with realistic data
do $$
declare
    all_project_ids bigint[];
    all_prompt_version_ids bigint[];
    all_temperatures numeric[];
    random_index integer;
    random_project_id bigint;
    random_prompt_version_id bigint;
    random_start_time timestamptz;
    random_end_time timestamptz;
    random_prompt_tokens integer;
    random_completion_tokens integer;
    random_total_tokens integer;
    random_source text;
    calculated_cost numeric;
    raw_input_json jsonb;
    raw_output_json jsonb;
    counter integer := 0;
    
    -- GPT-4o pricing: $2.50 per million input tokens, $10.00 per million output tokens
    input_cost_per_million constant numeric := 2.50;
    output_cost_per_million constant numeric := 10.00;
    
    -- List of possible models to rotate through
    models text[] := ARRAY[
        'openai/chatgpt-4o-latest',
        'openai/gpt-4o-mini',
        'openai/gpt-4o',
        'anthropic/claude-3-sonnet',
        'anthropic/claude-3-haiku'
    ];
    
    providers text[] := ARRAY[
        'OpenAI',
        'Anthropic'
    ];
    
    random_model text;
    random_provider text;
    random_temperature numeric;
begin
    -- Get all valid (project_id, prompt_version_id, temperature) combinations upfront
    -- Each index in the arrays represents the same logical combination
    select 
        array_agg(p.id order by p.id, pv.id),
        array_agg(pv.id order by p.id, pv.id),
        array_agg((pv.config->>'temperature')::numeric order by p.id, pv.id)
    into 
        all_project_ids,
        all_prompt_version_ids,
        all_temperatures
    from public.projects p
    join public.prompts pr on pr.project_id = p.id
    join public.prompt_versions pv on pv.prompt_id = pr.id;
    
    -- Generate 50,000 log records
    for counter in 1..50000 loop
        -- Select random index from our preloaded arrays
        random_index := 1 + floor(random() * array_length(all_project_ids, 1));
        random_project_id := all_project_ids[random_index];
        random_prompt_version_id := all_prompt_version_ids[random_index];
        random_temperature := all_temperatures[random_index];
        
        -- Generate random timestamps within the past year
        random_start_time := now() - interval '1 year' + (random() * interval '1 year');
        random_end_time := random_start_time + interval '1 second' + (random() * interval '59 seconds');
        
        -- Generate random token counts
        random_prompt_tokens := 100 + floor(random() * 900); -- 100-1000
        random_completion_tokens := 50 + floor(random() * 450); -- 50-500
        random_total_tokens := random_prompt_tokens + random_completion_tokens;
        
        -- Calculate cost in USD
        calculated_cost := round(
            (random_prompt_tokens::numeric / 1000000 * input_cost_per_million) +
            (random_completion_tokens::numeric / 1000000 * output_cost_per_million), 6
        );
        
        -- Random source
        random_source := case when random() < 0.5 then 'STUDIO' else 'SDK' end;
        
        -- Random model and provider
        random_model := models[1 + floor(random() * array_length(models, 1))];
        random_provider := case 
            when random_model like 'openai%' then 'OpenAI'
            when random_model like 'anthropic%' then 'Anthropic'
            else providers[1 + floor(random() * array_length(providers, 1))]
        end;
        
        -- Temperature already retrieved from preloaded array
        
        -- Build raw_input JSON
        raw_input_json := jsonb_build_object(
            'usage', jsonb_build_object('include', true),
            'models', jsonb_build_array('openrouter/auto'),
            'messages', jsonb_build_array(
                jsonb_build_object(
                    'role', 'user',
                    'content', 'Respond with the following:\n\n"Hello Bob, I am (the model you are)."\n\nex: "Hello John, I am o1-mini"'
                )
            ),
            'temperature', random_temperature
        );
        
        -- Build raw_output JSON
        raw_output_json := jsonb_build_object(
            'id', 'gen-' || extract(epoch from random_start_time)::bigint || '-' || substring(md5(random()::text), 1, 16),
            'model', random_model,
            'usage', jsonb_build_object(
                'cost', calculated_cost,
                'is_byok', false,
                'cost_details', jsonb_build_object('upstream_inference_cost', null),
                'total_tokens', random_total_tokens,
                'prompt_tokens', random_prompt_tokens,
                'completion_tokens', random_completion_tokens,
                'prompt_tokens_details', jsonb_build_object('cached_tokens', 0),
                'completion_tokens_details', jsonb_build_object('reasoning_tokens', 0)
            ),
            'object', 'chat.completion',
            'choices', jsonb_build_array(
                jsonb_build_object(
                    'index', 0,
                    'message', jsonb_build_object(
                        'role', 'assistant',
                        'content', 'Hello Bob, I am ' || random_model,
                        'refusal', null,
                        'reasoning', null
                    ),
                    'logprobs', null,
                    'finish_reason', 'stop',
                    'native_finish_reason', 'stop'
                )
            ),
            'created', extract(epoch from random_start_time)::bigint,
            'provider', random_provider,
            'system_fingerprint', 'fp_' || substring(md5(random()::text), 1, 10)
        );
        
        -- Insert the log record (manually populating inferred columns for seeding)
        insert into public.llm_logs (
            uuid,
            project_id,
            prompt_version_id,
            prompt_variables,
            raw_input,
            raw_output,
            start_time,
            end_time,
            source,
            prompt_tokens,
            completion_tokens,
            total_tokens,
            reasoning_tokens,
            cached_tokens,
            duration_ms,
            cost_usd,
            model,
            provider,
            tps,
            created_at,
            updated_at
        ) values (
            uuid_generate_v4(),
            random_project_id,
            random_prompt_version_id,
            '{"global": {}, "name": "Bob"}'::jsonb,
            raw_input_json,
            raw_output_json,
            random_start_time,
            random_end_time,
            random_source::llm_log_source,
            random_prompt_tokens,
            random_completion_tokens,
            random_total_tokens,
            0, -- reasoning_tokens (from prompt_tokens_details)
            0, -- cached_tokens (from completion_tokens_details)
            extract(epoch from (random_end_time - random_start_time)) * 1000, -- duration_ms
            calculated_cost,
            random_model,
            random_provider,
            case 
                when extract(epoch from (random_end_time - random_start_time)) > 0 
                then random_total_tokens / extract(epoch from (random_end_time - random_start_time))
                else 0
            end, -- tps (tokens per second)
            random_start_time, -- created_at (when record was initially created)
            random_end_time -- updated_at (when record was completed with output)
        );
        
        -- Output progress every 5000 records
        if counter % 5000 = 0 then
            raise notice 'Inserted % LLM log records', counter;
        end if;
    end loop;
    
    raise notice 'Successfully inserted 50,000 LLM log records';
end $$;

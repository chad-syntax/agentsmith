-- Fix division by zero in TPS calculation

create or replace function update_llm_log_metrics()
returns trigger as $$
declare temp_text text;
begin
  -- Only proceed if raw_output is being updated and is not null
  if new.raw_output is not null and (old.raw_output is null or old.raw_output != new.raw_output) then
    -- Extract tokens from usage object
    temp_text := new.raw_output->'usage'->>'prompt_tokens';
    if temp_text is not null then
        new.prompt_tokens := temp_text::integer;
    end if;
    temp_text := new.raw_output->'usage'->>'completion_tokens';
    if temp_text is not null then
        new.completion_tokens := temp_text::integer;
    end if;
    temp_text := new.raw_output->'usage'->>'total_tokens';
    if temp_text is not null then
        new.total_tokens := temp_text::integer;
    end if;
    temp_text := new.raw_output->'usage'->'completion_tokens_details'->>'reasoning_tokens';
    if temp_text is not null then
        new.reasoning_tokens := temp_text::integer;
    end if;
    temp_text := new.raw_output->'usage'->'prompt_tokens_details'->>'cached_tokens';
    if temp_text is not null then
        new.cached_tokens := temp_text::integer;
    end if;
    
    -- Extract cost and convert to USD (assuming cost is already in USD)
    temp_text := new.raw_output->'usage'->>'cost';
    if temp_text is not null then
        new.cost_usd := temp_text::numeric;
    end if;
    
    -- Extract model and provider (text, so null is fine)
    new.model := new.raw_output->>'model';
    new.provider := new.raw_output->>'provider';
    
    -- Calculate duration in milliseconds from start_time and end_time
    if new.start_time is not null and new.end_time is not null then
      new.duration_ms := extract(epoch from (new.end_time - new.start_time)) * 1000;
    end if;

    -- Calculate TPS
    if new.duration_ms is not null and new.duration_ms > 0 then
      new.tps := new.total_tokens::numeric / (new.duration_ms::numeric / 1000.0);
    else
      new.tps := null;
    end if;
  end if;
  
  return new;
end;
$$ language plpgsql;


-- Supabase stripe migrations included the replacement of this fn without the search_path =''
-- causing a supabase security audit warning >:(
create or replace function set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;
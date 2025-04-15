-- Functions
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

create or replace function gen_invite_code()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  var_invite_code text;
begin
    -- generate string of 6 random uppercase alphanumeric characters
    select upper(substr(md5(random()::text), 1, 6)) into var_invite_code;

    -- we continuously check if the invite code already exists until we find one that doesn't
    while exists (select 1 from public.organizations where invite_code = var_invite_code) loop
        select upper(substr(md5(random()::text), 1, 6)) into var_invite_code;
    end loop;

    -- once we find an invite code that doesn't exist, we return it
    return var_invite_code;
end;
$$;

-- Generate random alphanumeric string of specified length
create or replace function gen_random_alphanumeric(length integer)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
    chars text := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result text := '';
    i integer := 0;
begin
    if length < 0 then
        raise exception 'Negative string length not allowed';
    end if;
    
    for i in 1..length loop
        result := result || substr(chars, floor(random() * 62)::integer + 1, 1);
    end loop;
    
    return result;
end;
$$; 
-- Create vault secrets for each user
insert into vault.secrets (id, name, description, secret)
select 
    uuid_generate_v4(),
    'test-key-' || id,
    'Test key for ' || id,
    'sk_' || encode(gen_random_bytes(32), 'base64')
from agentsmith_users;

-- Create user key records linking users to their secrets
insert into user_keys (user_id, key, vault_id)
select
    au.id,
    vs.name,
    vs.id
from agentsmith_users au
cross join lateral (
    select id, name 
    from vault.secrets 
    where name = 'test-key-' || au.id
) vs;


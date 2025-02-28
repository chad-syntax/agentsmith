-- Create vault secrets for each organization
insert into vault.secrets (id, name, description, secret)
select 
    uuid_generate_v4(),
    'test-key-' || id,
    'Test key for organization ' || id,
    'sk_' || encode(gen_random_bytes(32), 'base64')
from organizations;

-- Create organization key records linking organizations to their secrets
insert into organization_keys (organization_id, key, vault_secret_id)
select
    o.id,
    vs.name,
    vs.id
from organizations o
cross join lateral (
    select id, name 
    from vault.secrets 
    where name = 'test-key-' || o.id
) vs;


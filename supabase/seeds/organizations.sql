-- Get user IDs and insert organizations in a single WITH clause
with user_ids as (
    select agu.id, au.email
    from agentsmith_users agu
    join auth.users au on au.id = agu.auth_user_id
    where au.email in ('free@example.com', 'pro_admin@example.com', 'pro_member@example.com', 
                      'ee_admin@example.com', 'ee_member@example.com')
),
org_ids as (
    insert into organizations (name, tier, created_by)
    values
        ('Free Organization', 'FREE', (select id from user_ids where email = 'free@example.com')),
        ('Pro Organization', 'PRO', (select id from user_ids where email = 'pro_admin@example.com')),
        ('Enterprise Organization', 'ENTERPRISE', (select id from user_ids where email = 'ee_admin@example.com'))
    returning id, tier
)
-- Create organization users
insert into organization_users (organization_id, user_id, role)
select 
    o.id,
    u.id,
    case
        when u.email = 'free@example.com' then 'ADMIN'::organization_user_role
        when u.email = 'pro_admin@example.com' then 'ADMIN'::organization_user_role
        when u.email = 'pro_member@example.com' then 'MEMBER'::organization_user_role
        when u.email = 'ee_admin@example.com' then 'ADMIN'::organization_user_role
        when u.email = 'ee_member@example.com' then 'MEMBER'::organization_user_role
    end as role
from org_ids o
join user_ids u on 
    (o.tier = 'FREE' and u.email = 'free@example.com') or
    (o.tier = 'PRO' and u.email in ('pro_admin@example.com', 'pro_member@example.com')) or
    (o.tier = 'ENTERPRISE' and u.email in ('ee_admin@example.com', 'ee_member@example.com'));
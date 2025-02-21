-- Get organization IDs
with org_ids as (
    select id, tier from organizations
    where name in ('Free Organization', 'Pro Organization', 'Enterprise Organization')
),
-- Get user IDs for project creators
user_ids as (
    select agu.id, au.email
    from agentsmith_users agu
    join auth.users au on au.id = agu.auth_user_id
    where au.email in ('free@example.com', 'pro_admin@example.com', 'ee_admin@example.com')
)
-- Create projects
insert into projects (name, organization_id, created_by)
select
    case
        when o.tier = 'FREE' then 'Free Project'
        when o.tier = 'PRO' and p.num = 1 then 'Pro Project 1'
        when o.tier = 'PRO' and p.num = 2 then 'Pro Project 2'
        when o.tier = 'ENTERPRISE' and p.num = 1 then 'Enterprise Project 1'
        when o.tier = 'ENTERPRISE' and p.num = 2 then 'Enterprise Project 2'
    end as name,
    o.id as organization_id,
    u.id as created_by
from org_ids o
cross join (select 1 as num union select 2) p
cross join user_ids u
where
    (o.tier = 'FREE' and p.num = 1 and u.email = 'free@example.com') or
    (o.tier = 'PRO' and u.email = 'pro_admin@example.com') or
    (o.tier = 'ENTERPRISE' and u.email = 'ee_admin@example.com');

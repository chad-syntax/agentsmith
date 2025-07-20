-- Get user IDs
with user_ids as (
    select agu.id, au.email
    from agentsmith_users agu
    join auth.users au on au.id = agu.auth_user_id
    where au.email in (
        'free@example.com', 'pro_admin@example.com', 'pro_member@example.com', 
        'ee_admin@example.com', 'ee_member@example.com', 'hobby_admin@example.com', 'hobby_member@example.com'
    )
),
-- Insert one organization per tier
orgs as (
    insert into organizations (name, created_by, agentsmith_tier_id)
    select
        t.name || ' Organization',
        (select id from user_ids where email = 
            case 
                when t.tier = 'FREE' then 'free@example.com'
                when t.tier = 'PRO' then 'pro_admin@example.com'
                when t.tier = 'ENTERPRISE' then 'ee_admin@example.com'
                when t.tier = 'HOBBY' then 'hobby_admin@example.com'
            end
        ),
        t.id
    from agentsmith_tiers t
    returning id, name
)
-- Create organization users based on their email
insert into organization_users (organization_id, user_id, role)
select
    (select id from orgs where name = 
        case
            when u.email like '%free%' then 'Free Organization'
            when u.email like '%hobby%' then 'Hobby Organization'
            when u.email like '%pro%' then 'Pro Organization'
            when u.email like '%ee%' then 'Enterprise Organization'
        end
    ),
    u.id,
    case
        when u.email like '%_admin@%' or u.email = 'free@example.com' then 'ADMIN'::organization_user_role
        else 'MEMBER'::organization_user_role
    end
from user_ids u;
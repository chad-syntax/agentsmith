-- Get project IDs
with project_ids as (
    select id from projects
    where name in ('Free Project', 'Pro Project 1', 'Pro Project 2', 
                  'Enterprise Project 1', 'Enterprise Project 2')
)
-- Create global contexts for each project
insert into global_contexts (project_id, content)
select 
    id as project_id,
    '{"lang": "en"}'::jsonb as content
from project_ids;

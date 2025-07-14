-- Insert the Hello World prompt for each project
insert into prompts (uuid, project_id, name, slug)
select 
    uuid_generate_v4(),
    id,
    'Hello World',
    'hello-world'
from public.projects;

-- Insert a prompt version for each prompt (v1.0.0)
insert into prompt_versions (
    uuid,
    prompt_id,
    config,
    content,
    version,
    status
)
select
    uuid_generate_v4(),
    id,
    '{"models": ["openrouter/auto"], "temperature": 1.0}',
    'Respond with the following:

"Hello {{ name }}, I am (the model you are)."

ex: "Hello John, I am o1-mini"',
    '1.0.0',
    'PUBLISHED'
from prompts;

-- Insert v2.0.0 prompt versions with temperature 0.75
insert into prompt_versions (
    uuid,
    prompt_id,
    config,
    content,
    version,
    status
)
select
    uuid_generate_v4(),
    id,
    '{"models": ["openrouter/auto"], "temperature": 0.75}',
    'Respond with the following:

"Hello {{ name }}, I am (the model you are)."

ex: "Hello John, I am o1-mini"',
    '2.0.0',
    'PUBLISHED'
from prompts;

-- Insert v3.0.0 prompt versions with temperature 0.5
insert into prompt_versions (
    uuid,
    prompt_id,
    config,
    content,
    version,
    status
)
select
    uuid_generate_v4(),
    id,
    '{"models": ["openrouter/auto"], "temperature": 0.5}',
    'Respond with the following:

"Hello {{ name }}, I am (the model you are)."

ex: "Hello John, I am o1-mini"',
    '3.0.0',
    'PUBLISHED'
from prompts;

-- Insert the name variable for each prompt version
insert into prompt_variables (
    prompt_version_id,
    name,
    type,
    required
)
select
    id,
    'name',
    'STRING',
    true
from prompt_versions;

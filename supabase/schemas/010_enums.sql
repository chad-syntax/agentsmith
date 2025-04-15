-- Enums
create type organization_tier as enum ('FREE', 'PRO', 'ENTERPRISE');
create type prompt_status as enum ('DRAFT', 'PUBLISHED', 'ARCHIVED');
create type variable_type as enum ('STRING', 'NUMBER', 'BOOLEAN', 'JSON');
create type organization_user_role as enum ('ADMIN', 'MEMBER'); 
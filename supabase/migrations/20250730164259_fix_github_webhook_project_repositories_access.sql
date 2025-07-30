grant insert on table public.project_repositories to github_webhook;
grant delete on table public.project_repositories to github_webhook;
grant select on table public.organizations to github_webhook;

create policy "Allow github_webhook insert access on project_repositories"
on public.project_repositories
as permissive
for insert
to github_webhook
with check (true);

create policy "Allow github_webhook delete access on project_repositories"
on public.project_repositories
as permissive
for delete
to github_webhook
using (true);

create policy "Allow github_webhook select access on organizations"
on public.organizations
as permissive
for select
to github_webhook
using (true);

alter table public.project_repositories
add unique (github_app_installation_id, repository_id);
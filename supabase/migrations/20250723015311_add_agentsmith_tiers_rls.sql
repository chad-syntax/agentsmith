alter table agentsmith_tiers enable row level security;

create policy "Allow authenticated select on agentsmith_tiers"
on agentsmith_tiers
as permissive
for select
to authenticated
using (true);

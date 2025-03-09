import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { routes } from '@/utils/routes';
import { AgentsmithServices } from '@/lib/AgentsmithServices';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ inviteCode: string }> }
) {
  const { inviteCode } = await params;

  const supabase = await createClient();

  const agentsmith = new AgentsmithServices({ supabase });

  // if the user is not logged in, redirect to the login page
  const { authUser } = await agentsmith.services.users.initialize();

  if (!authUser) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  const { data: organizationUuid, error } = await supabase.rpc(
    'join_organization',
    {
      arg_invite_code: inviteCode,
    }
  );

  if (error) {
    console.error(error);
    return NextResponse.redirect(
      new URL(routes.error('Failed to join organization'), request.url)
    );
  }

  return NextResponse.redirect(
    new URL(routes.studio.organization(organizationUuid), request.url)
  );
}

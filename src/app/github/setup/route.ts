import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { createClient } from '@/lib/supabase/server';
import { routes } from '@/utils/routes';
import { NextResponse } from 'next/server';

export const GET = async (request: Request) => {
  console.log('github callback invoked');
  console.log(
    'github callback query:',
    Object.fromEntries(new URL(request.url).searchParams)
  );

  const searchParams = new URL(request.url).searchParams;

  const organizationUuid = searchParams.get('state');
  const installationId = Number(searchParams.get('installation_id'));

  if (!organizationUuid || !installationId) {
    return new Response('Invalid parameters', { status: 400 });
  }

  const supabase = await createClient();

  const agentsmith = new AgentsmithServices({ supabase });

  try {
    await agentsmith.services.github.createInstallation({
      organizationUuid,
      installationId,
    });

    return NextResponse.redirect(
      new URL(routes.studio.organization(organizationUuid), request.url)
    );
  } catch (e) {
    console.error('Failed to create github installation', e);
    return NextResponse.redirect(
      new URL(
        routes.error(
          `Failed to create github installation: ${(<Error>e).message}`
        ),
        request.url
      )
    );
  }

  return new Response('ok');
};

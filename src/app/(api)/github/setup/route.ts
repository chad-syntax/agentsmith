import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { createClient } from '@/lib/supabase/server';
import { routes } from '@/utils/routes';
import { NextResponse } from 'next/server';

export const GET = async (request: Request) => {
  const searchParams = new URL(request.url).searchParams;

  const state = searchParams.get('state');
  const installationId = Number(searchParams.get('installation_id'));

  if (!state || !installationId) {
    return new Response('Invalid parameters', { status: 400 });
  }

  const supabase = await createClient();

  const { services, logger } = new AgentsmithServices({ supabase });

  try {
    const { organizationUuid, installationRecordUuid } = services.githubApp.decodeState(state);

    const { isValid, githubAppInstallationRecordId } = await services.githubApp.verifyInstallation({
      installationRecordUuid,
      installationId,
      organizationUuid,
    });

    if (!isValid || !githubAppInstallationRecordId) {
      return NextResponse.redirect(
        new URL(routes.error('Invalid Installation, please uninstall and try again'), request.url),
      );
    }

    await services.githubApp.createInstallationRepositories({
      githubAppInstallationRecordId,
      organizationUuid,
      installationId,
    });

    return NextResponse.redirect(
      new URL(routes.studio.organization(organizationUuid), request.url),
    );
  } catch (e) {
    logger.error('Failed to create github installation', e);
    return NextResponse.redirect(
      new URL(
        routes.error(`Failed to create github installation: ${(<Error>e).message}`),
        request.url,
      ),
    );
  }
};

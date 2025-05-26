import { NextResponse } from 'next/server';
import { ORGANIZATION_KEYS } from '@/app/constants';
import { AgentsmithServices } from '@/lib/AgentsmithServices';
import { createClient } from '@/lib/supabase/server';
import { routes } from '@/utils/routes';

type OpenrouterCallbackParams = Promise<{
  organizationUuid: string;
}>;

export async function GET(request: Request, { params }: { params: OpenrouterCallbackParams }) {
  const supabase = await createClient();

  const { services, logger } = new AgentsmithServices({ supabase });

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    const { organizationUuid } = await params;

    if (!code) {
      logger.error('/connect/openrouter: no code found');
      return NextResponse.redirect(
        new URL(routes.error('Failed to connect OpenRouter: No code provided'), request.url),
      );
    }

    if (!organizationUuid) {
      logger.error('/connect/openrouter: no organizationUuid found');
      return NextResponse.redirect(
        new URL(
          routes.error('Failed to connect OpenRouter: No organization ID provided'),
          request.url,
        ),
      );
    }

    const { authUser } = await services.users.getAuthUser();

    if (!authUser) {
      logger.error('/connect/openrouter: no user found');
      return NextResponse.redirect(
        new URL(routes.error('Failed to connect OpenRouter: Not authenticated'), request.url),
      );
    }

    // Get the code verifier from the organization's vault
    const { value: codeVerifier } = await services.vault.getOrganizationKeySecret(
      organizationUuid,
      ORGANIZATION_KEYS.OPENROUTER_CODE_VERIFIER,
    );

    if (!codeVerifier) {
      logger.error('/connect/openrouter: no code verifier found');
      return NextResponse.redirect(
        new URL(routes.error('Failed to connect OpenRouter: No code verifier found'), request.url),
      );
    }

    logger.info('/connect/openrouter: exchanging code for API key');
    const response = await fetch(routes.openrouter.authKeys, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        code_verifier: codeVerifier,
        code_challenge_method: 'S256',
      }),
    });

    if (!response.ok) {
      logger.error('/connect/openrouter: error fetching openrouter key', await response.text());
      return NextResponse.redirect(
        new URL(routes.error('Failed to connect OpenRouter: API error'), request.url),
      );
    }

    const openrouterResponse = await response.json();
    if (!openrouterResponse.key) {
      logger.error('/connect/openrouter: no key in response', openrouterResponse);
      return NextResponse.redirect(
        new URL(routes.error('Failed to connect OpenRouter: No API key in response'), request.url),
      );
    }

    // Store the API key in the vault
    const { success, error: vaultError } = await services.vault.createOrganizationKey({
      organizationUuid,
      key: ORGANIZATION_KEYS.OPENROUTER_API_KEY,
      value: openrouterResponse.key,
      description: `OpenRouter API Key for ${organizationUuid}`,
    });

    if (!success) {
      logger.error('/connect/openrouter: failed to save key to vault', vaultError);
      return NextResponse.redirect(
        new URL(routes.error('Failed to connect OpenRouter: Could not save API key'), request.url),
      );
    }

    logger.info('/connect/openrouter: successfully saved openrouter key');
    return NextResponse.redirect(new URL(routes.studio.home, request.url));
  } catch (error) {
    logger.error('/connect/openrouter: unexpected error', error);
    return NextResponse.redirect(
      new URL(routes.error('Failed to connect OpenRouter: Unexpected error'), request.url),
    );
  }
}

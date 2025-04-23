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

  const agentsmith = new AgentsmithServices({ supabase });

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    const { organizationUuid } = await params;

    if (!code) {
      console.error('/connect/openrouter: no code found');
      return NextResponse.redirect(
        new URL(routes.error('Failed to connect OpenRouter: No code provided'), request.url),
      );
    }

    if (!organizationUuid) {
      console.error('/connect/openrouter: no organizationUuid found');
      return NextResponse.redirect(
        new URL(
          routes.error('Failed to connect OpenRouter: No organization ID provided'),
          request.url,
        ),
      );
    }

    const { authUser } = await agentsmith.services.users.getAuthUser();

    if (!authUser) {
      console.error('/connect/openrouter: no user found');
      return NextResponse.redirect(
        new URL(routes.error('Failed to connect OpenRouter: Not authenticated'), request.url),
      );
    }

    // Get the code verifier from the organization's vault
    const { value: codeVerifier } = await agentsmith.services.vault.getOrganizationKeySecret(
      organizationUuid,
      ORGANIZATION_KEYS.OPENROUTER_CODE_VERIFIER,
    );

    if (!codeVerifier) {
      console.error('/connect/openrouter: no code verifier found');
      return NextResponse.redirect(
        new URL(routes.error('Failed to connect OpenRouter: No code verifier found'), request.url),
      );
    }

    console.log('/connect/openrouter: exchanging code for API key');
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
      console.error('/connect/openrouter: error fetching openrouter key', await response.text());
      return NextResponse.redirect(
        new URL(routes.error('Failed to connect OpenRouter: API error'), request.url),
      );
    }

    const openrouterResponse = await response.json();
    if (!openrouterResponse.key) {
      console.error('/connect/openrouter: no key in response', openrouterResponse);
      return NextResponse.redirect(
        new URL(routes.error('Failed to connect OpenRouter: No API key in response'), request.url),
      );
    }

    // Store the API key in the vault
    const { success, error: vaultError } = await agentsmith.services.vault.createOrganizationKey({
      organizationUuid,
      key: ORGANIZATION_KEYS.OPENROUTER_API_KEY,
      value: openrouterResponse.key,
      description: 'OpenRouter API Key',
    });

    if (!success) {
      console.error('/connect/openrouter: failed to save key to vault', vaultError);
      return NextResponse.redirect(
        new URL(routes.error('Failed to connect OpenRouter: Could not save API key'), request.url),
      );
    }

    console.log('/connect/openrouter: successfully saved openrouter key');
    return NextResponse.redirect(
      new URL(routes.studio.organization(organizationUuid), request.url),
    );
  } catch (error) {
    console.error('/connect/openrouter: unexpected error', error);
    return NextResponse.redirect(
      new URL(routes.error('Failed to connect OpenRouter: Unexpected error'), request.url),
    );
  }
}

import { NextResponse } from 'next/server';
import { ORGANIZATION_KEYS } from '@/app/constants';
import { createVaultService } from '@/lib/vault';
import { createClient } from '@/lib/supabase/server';

type OpenrouterCallbackParams = {
  organizationUuid: string;
};

export async function GET(
  request: Request,
  { params }: { params: OpenrouterCallbackParams }
) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    const { organizationUuid } = params;

    if (!code) {
      console.error('/connect/openrouter: no code found');
      return NextResponse.redirect(
        new URL(
          '/studio/account?message=Failed to connect OpenRouter: No code provided',
          request.url
        )
      );
    }

    if (!organizationUuid) {
      console.error('/connect/openrouter: no organizationUuid found');
      return NextResponse.redirect(
        new URL(
          '/studio/account?message=Failed to connect OpenRouter: No organization ID provided',
          request.url
        )
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.error('/connect/openrouter: no user found');
      return NextResponse.redirect(
        new URL(
          '/studio/account?message=Failed to connect OpenRouter: Not authenticated',
          request.url
        )
      );
    }

    // Get the code verifier from the organization's vault
    const vaultService = await createVaultService();
    const { value: codeVerifier } = await vaultService.getOrganizationKeySecret(
      organizationUuid,
      ORGANIZATION_KEYS.OPENROUTER_CODE_VERIFIER
    );

    if (!codeVerifier) {
      console.error('/connect/openrouter: no code verifier found');
      return NextResponse.redirect(
        new URL(
          '/studio/account?message=Failed to connect OpenRouter: No code verifier found',
          request.url
        )
      );
    }

    console.log('/connect/openrouter: exchanging code for API key');
    const response = await fetch('https://openrouter.ai/api/v1/auth/keys', {
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
      console.error(
        '/connect/openrouter: error fetching openrouter key',
        await response.text()
      );
      return NextResponse.redirect(
        new URL(
          '/studio/account?message=Failed to connect OpenRouter: API error',
          request.url
        )
      );
    }

    const openrouterResponse = await response.json();
    if (!openrouterResponse.key) {
      console.error(
        '/connect/openrouter: no key in response',
        openrouterResponse
      );
      return NextResponse.redirect(
        new URL(
          '/studio/account?message=Failed to connect OpenRouter: No API key in response',
          request.url
        )
      );
    }

    // Store the API key in the vault
    const { success, error: vaultError } =
      await vaultService.createOrganizationKey({
        organizationUuid,
        key: ORGANIZATION_KEYS.OPENROUTER_API_KEY,
        value: openrouterResponse.key,
        description: 'OpenRouter API Key',
      });

    if (!success) {
      console.error(
        '/connect/openrouter: failed to save key to vault',
        vaultError
      );
      return NextResponse.redirect(
        new URL(
          '/studio/account?message=Failed to connect OpenRouter: Could not save API key',
          request.url
        )
      );
    }

    console.log('/connect/openrouter: successfully saved openrouter key');
    return NextResponse.redirect(
      new URL(
        '/studio/account?message=Successfully connected OpenRouter',
        request.url
      )
    );
  } catch (error) {
    console.error('/connect/openrouter: unexpected error', error);
    return NextResponse.redirect(
      new URL(
        '/studio/account?message=Failed to connect OpenRouter: Unexpected error',
        request.url
      )
    );
  }
}

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Clipboard, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { P } from '@/components/typography';

type ApiKeyRevealProps = {
  organizationUuid: string;
  keyName: string;
};

export const ApiKeyReveal = (props: ApiKeyRevealProps) => {
  const { organizationUuid, keyName } = props;
  const [isRevealed, setIsRevealed] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const fetchApiKey = async () => {
    if (apiKey) {
      setIsRevealed(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Find the organization key
      const { data, error } = await supabase
        .from('organizations')
        .select('organization_keys!inner(key, vault_secret_id)')
        .eq('uuid', organizationUuid)
        .eq('organization_keys.key', keyName)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!data || !data.organization_keys || data.organization_keys.length === 0) {
        throw new Error('API key not found');
      }

      const vaultSecretId = data.organization_keys[0].vault_secret_id;

      // Get the secret from the vault
      const { data: secretData, error: secretError } = await supabase.rpc(
        'get_organization_vault_secret',
        {
          arg_vault_secret_id: vaultSecretId,
        },
      );

      if (secretError) {
        throw new Error(secretError.message);
      }

      if (!secretData || !(secretData as { value: string }).value) {
        throw new Error('API key not found in vault');
      }

      setApiKey((secretData as { value: string }).value);
      setIsRevealed(true);
    } catch (error) {
      console.error('Error fetching API key:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch API key');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevealToggle = () => {
    if (isRevealed) {
      setIsRevealed(false);
    } else {
      fetchApiKey();
    }
  };

  const copyToClipboard = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <div className="p-2 flex items-center border rounded bg-muted">
              <span className="font-mono text-sm flex-1">
                {isRevealed ? apiKey : 'sdk_••••••••••••••••••••••••••••••••'}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRevealToggle}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-current"></div>
                  ) : isRevealed ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                {apiKey && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={copyToClipboard}
                    className={isCopied ? 'text-green-500' : ''}
                  >
                    {isCopied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
        {error && <P className="text-sm text-red-500">{error}</P>}
      </div>
    </div>
  );
};

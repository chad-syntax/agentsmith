import { compareSemanticVersions } from './versioning';
import { IncludedPrompt } from '@/types/prompt-editor';

export const makePromptLoader =
  (includedPrompts: IncludedPrompt[]) => (slug: string, version: string | null) => {
    const includedPromptVersion =
      version !== null && version !== 'latest'
        ? includedPrompts.find(
            (ip) =>
              ip.prompt_versions.prompts.slug === slug && ip.prompt_versions.version === version,
          )
        : includedPrompts
            .filter((ip) => ip.prompt_versions.prompts.slug === slug)
            .sort((a, b) =>
              compareSemanticVersions(b.prompt_versions.version, a.prompt_versions.version),
            )?.[0];

    if (!includedPromptVersion) {
      throw new Error(`Included prompt ${slug}@${version} not found`);
    }

    return includedPromptVersion.prompt_versions.content;
  };

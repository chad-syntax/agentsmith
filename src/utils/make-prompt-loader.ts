import { GetPromptVersionByUuidResult } from '@/lib/PromptsService';
import { compareSemanticVersions } from './versioning';
import { IncludedPrompt } from '@/types/prompt-editor';

export const makePromptLoaderFromUI =
  (includedPrompts: IncludedPrompt[]) => (slug: string, version: string | null) => {
    const includedPromptVersion =
      version !== null && version !== 'latest'
        ? includedPrompts.find((ip) => ip.slug === slug && ip.version === version)
        : includedPrompts
            .filter((ip) => ip.slug === slug)
            .sort((a, b) => compareSemanticVersions(b.version, a.version))[0];

    if (!includedPromptVersion) {
      throw new Error(`Included prompt ${slug}@${version} not found`);
    }

    return includedPromptVersion.content;
  };

export const makePromptLoaderFromDB =
  (promptIncludes: NonNullable<GetPromptVersionByUuidResult>['prompt_includes']) =>
  (slug: string, version: string | null) => {
    const includedPromptVersion =
      version !== null && version !== 'latest'
        ? promptIncludes?.find(
            (pi) =>
              pi.prompt_versions.prompts.slug === slug && pi.prompt_versions.version === version,
          )?.prompt_versions
        : promptIncludes
            ?.filter((pi) => pi.prompt_versions.prompts.slug === slug)
            ?.sort((a, b) =>
              compareSemanticVersions(b.prompt_versions.version, a.prompt_versions.version),
            )?.[0]?.prompt_versions;

    if (!includedPromptVersion) {
      throw new Error(`Included prompt ${slug}@${version} not found`);
    }

    return includedPromptVersion.content;
  };

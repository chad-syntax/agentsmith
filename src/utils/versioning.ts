/**
 * Compare two semantic versions and return:
 * - 1 if version1 > version2
 * - 0 if version1 === version2
 * - -1 if version1 < version2
 */
export const compareSemanticVersions = (
  version1: string,
  version2: string
): number => {
  const v1Parts = version1.split('.').map(Number);
  const v2Parts = version2.split('.').map(Number);

  // Compare major version
  if (v1Parts[0] !== v2Parts[0]) {
    return v1Parts[0] > v2Parts[0] ? 1 : -1;
  }

  // Compare minor version
  if (v1Parts[1] !== v2Parts[1]) {
    return v1Parts[1] > v2Parts[1] ? 1 : -1;
  }

  // Compare patch version
  if (v1Parts[2] !== v2Parts[2]) {
    return v1Parts[2] > v2Parts[2] ? 1 : -1;
  }

  // Versions are equal
  return 0;
};

/**
 * Increment a semantic version based on the version type
 */
export const incrementVersion = (
  version: string,
  type: 'major' | 'minor' | 'patch'
): string => {
  const parts = version.split('.').map(Number);

  if (type === 'major') {
    return `${parts[0] + 1}.0.0`;
  } else if (type === 'minor') {
    return `${parts[0]}.${parts[1] + 1}.0`;
  } else {
    return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
  }
};

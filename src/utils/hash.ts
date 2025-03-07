import { createHash } from 'crypto';
/**
 * Hash text using SHA-256
 */
export function sha256Hash(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

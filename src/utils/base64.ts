/**
 * Encodes a string into Base64 format.
 * This function assumes the availability of the Buffer class, common in Node.js
 * or environments polyfilled/bundled for browsers.
 * Handles UTF-8 characters correctly.
 *
 * @param str The string to encode.
 * @returns The Base64 encoded string.
 * @throws {Error} if the Buffer API is not available.
 */
export function base64Encode(str: string): string {
  if (typeof Buffer === 'undefined') {
    // Consider adding a browser-based fallback using btoa and TextEncoder if needed
    // For example: return btoa(new TextEncoder().encode(str).reduce((data, byte) => data + String.fromCharCode(byte), ''));
    // However, the TextEncoder/Decoder approach with btoa/atob might be more complex than Buffer.
    // The current implementation relies on Buffer for simplicity and robustness, especially with UTF-8.
    console.error('Buffer API is required for base64Encode but is not available.');
    throw new Error('Buffer API not available for base64 encoding.');
  }
  return Buffer.from(str, 'utf8').toString('base64');
}

/**
 * Decodes a Base64 encoded string back into a regular string.
 * This function assumes the availability of the Buffer class, common in Node.js
 * or environments polyfilled/bundled for browsers.
 * Handles UTF-8 characters correctly.
 *
 * @param base64Str The Base64 string to decode.
 * @returns The original decoded string.
 * @throws {Error} if the Buffer API is not available.
 */
export function base64Decode(base64Str: string): string {
  if (typeof Buffer === 'undefined') {
    // Consider adding a browser-based fallback using atob and TextDecoder if needed
    // For example: return new TextDecoder().decode(Uint8Array.from(atob(base64Str), c => c.charCodeAt(0)));
    console.error('Buffer API is required for base64Decode but is not available.');
    throw new Error('Buffer API not available for base64 decoding.');
  }
  return Buffer.from(base64Str, 'base64').toString('utf8');
}

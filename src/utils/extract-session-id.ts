import { Session } from '@supabase/supabase-js';

export const extractSessionId = (session: Session | null): string | null => {
  if (session?.access_token) {
    try {
      const sessionTokenParts = session.access_token.split('.');
      if (sessionTokenParts.length >= 2) {
        const token = JSON.parse(Buffer.from(sessionTokenParts[1], 'base64').toString('ascii'));
        return token.session_id;
      }
    } catch {
      return null;
    }
  }
  return null;
};

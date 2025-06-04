import { defineConfig } from 'tsup';
import dotenv from 'dotenv';

const env = dotenv.config({ path: '../.env' }).parsed;

if (!env?.NEXT_PUBLIC_SUPABASE_URL || !env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error(
    'NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set, cannot build SDK',
  );
}

if (!env?.NEXT_PUBLIC_SITE_URL) {
  throw new Error('NEXT_PUBLIC_SITE_URL is not set, cannot build SDK');
}

export default defineConfig({
  entry: ['./index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  env: {
    NEXT_PUBLIC_SITE_URL: env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
});

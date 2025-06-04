import { defineConfig } from 'tsup';
import dotenv from 'dotenv';

// Load .env vars (but process.env already has them from the shell if set)
dotenv.config({ path: '../.env' });

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SITE_URL',
];

requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`${key} is not set, cannot build SDK`);
  }
});

export default defineConfig({
  entry: ['./index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL!,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  },
});

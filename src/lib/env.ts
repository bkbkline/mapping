import { validateEnv } from './schemas';

// Validate on import — warns but never crashes
if (typeof window === 'undefined') {
  validateEnv();
}

export const env = {
  MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'YOUR_MAPBOX_PUBLIC_TOKEN_HERE',
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_PROJECT_URL_HERE',
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE',
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'YOUR_VERCEL_APP_URL_HERE',
} as const;

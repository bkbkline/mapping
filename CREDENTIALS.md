# Credentials Guide

| Variable | Where to Find It | Which Files Use It | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_MAPBOX_TOKEN` | [mapbox.com](https://account.mapbox.com/access-tokens/) → Account → Tokens | All map components, geocoding proxy, isochrone proxy | Restrict to your domain in Mapbox dashboard |
| `NEXT_PUBLIC_SUPABASE_URL` | [Supabase Dashboard](https://supabase.com/dashboard) → Project → Settings → API → Project URL | `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, all API routes | Safe to expose publicly |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project → Settings → API → `anon` `public` key | `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts` | Safe to expose — RLS protects data |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project → Settings → API → `service_role` key | Edge Functions only (`supabase/functions/*`) | **NEVER expose to client-side code** |
| `NEXT_PUBLIC_APP_URL` | Your Vercel deployment URL (e.g., `https://land-intel.vercel.app`) | CORS config, OAuth callback URL, Edge Function render URLs | Set after first Vercel deploy |

## Setup Steps

### 1. Mapbox
1. Create account at [mapbox.com](https://mapbox.com)
2. Go to Account → Tokens → Create a token
3. Enable scopes: Styles (read), Tilesets (read/list), Geocoding, Isochrone
4. Set URL restrictions to your Vercel domain
5. Copy the token into `NEXT_PUBLIC_MAPBOX_TOKEN`

### 2. Supabase
1. Create project at [supabase.com](https://supabase.com)
2. Go to Settings → API
3. Copy Project URL → `NEXT_PUBLIC_SUPABASE_URL`
4. Copy `anon` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Copy `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
6. Run all migrations in `supabase/migrations/` via Supabase CLI or Dashboard SQL Editor
7. Enable Google OAuth: Authentication → Providers → Google → Enable, set redirect URL to `YOUR_VERCEL_APP_URL_HERE/auth/callback`

### 3. Vercel
1. Deploy via `vercel` CLI or GitHub integration
2. Set all environment variables in Vercel Dashboard → Settings → Environment Variables
3. Update `NEXT_PUBLIC_APP_URL` with the deployed URL
4. Update Mapbox token URL restrictions
5. Update Supabase Google OAuth redirect URL

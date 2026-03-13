# Land Intel Platform

Map-based land intelligence platform for industrial real estate professionals. Site selection, underwriting, and market analysis in a single GIS interface.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel (Frontend)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │ Next.js  │ │ Mapbox   │ │ Zustand  │ │ TanStack  │  │
│  │ App      │ │ GL JS    │ │ Store    │ │ Query     │  │
│  │ Router   │ │ v3       │ │          │ │           │  │
│  └────┬─────┘ └────┬─────┘ └──────────┘ └─────┬─────┘  │
│       │             │                          │        │
│  ┌────┴─────────────┴──────────────────────────┴─────┐  │
│  │              API Routes (/api/*)                   │  │
│  └────────────────────┬──────────────────────────────┘  │
└───────────────────────┼─────────────────────────────────┘
                        │
┌───────────────────────┼─────────────────────────────────┐
│                  Supabase (Backend)                      │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌─────────────────┐  │
│  │Postgres│ │ Auth   │ │Storage │ │ Edge Functions   │  │
│  │+PostGIS│ │        │ │        │ │ (Deno)           │  │
│  │+ RLS   │ │        │ │        │ │                  │  │
│  └────────┘ └────────┘ └────────┘ └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Features

- **Map Workspace** — Full Mapbox GL JS map with drawing tools, layer management, basemap switching
- **Layer System** — Upload GeoJSON/KML/Shapefile/CSV, connect WMS/WMTS/XYZ tile services, preset layer library
- **Draw & Annotate** — Polygon, rectangle, circle, line, point tools with measurements
- **Parcel Intelligence** — Parcel search by APN/address, zoning lookup, constraint detection
- **Industrial Scorecard** — Clear height, dock doors, truck court, rail access, and more
- **Feasibility Calculator** — Full development underwriting with NOI, cap rate, DSCR analysis
- **Collections & Kanban** — Organize parcels with pipeline status tracking
- **Drive Time Analysis** — Mapbox Isochrone API for 30/60/90 min drive time polygons
- **Constraint Mapping** — FEMA flood, wetlands, EPA superfund overlay with PostGIS intersection
- **Site Planning Tools** — Setback buffer, parking calculator, truck court depth, building area
- **Collaboration** — Real-time presence, cursor sharing, annotation sync
- **Export** — PDF maps, CSV/Excel data exports, GeoJSON/KML layer exports

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| Mapping | Mapbox GL JS v3 |
| Backend/DB | Supabase (Postgres + PostGIS + Auth + Storage + Realtime) |
| Deployment | Vercel (frontend) + Supabase (backend) |
| State | Zustand + TanStack Query |
| UI | shadcn/ui + Radix UI |

## Local Development Setup

### Prerequisites

- Node.js 18+
- npm 9+
- Supabase account
- Mapbox account

### 1. Clone and Install

```bash
git clone <repo-url>
cd land-intel
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials. See [CREDENTIALS.md](./CREDENTIALS.md) for where to find each value.

### 3. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run migrations in order via the SQL Editor:
   - `supabase/migrations/001_extensions.sql`
   - `supabase/migrations/002_core_tables.sql`
   - `supabase/migrations/003_indexes.sql`
   - `supabase/migrations/004_rls.sql`
   - `supabase/migrations/005_triggers.sql`
   - `supabase/migrations/006_storage.sql`
3. Create storage buckets: `layer-files`, `export-files`, `map-thumbnails`, `org-assets`
4. Enable Google OAuth in Authentication > Providers (optional)

### 4. Mapbox Setup

1. Create a token at [mapbox.com/account/access-tokens](https://account.mapbox.com/access-tokens/)
2. Enable scopes: Styles (read), Tilesets (read/list), Geocoding, Isochrone
3. Set URL restrictions to `localhost:3000` for dev, your Vercel domain for prod

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 6. Run Tests

```bash
# Unit tests
npm run test

# E2E tests
npx playwright install
npm run test:e2e
```

## Vercel Deployment

1. Push to GitHub
2. Import in Vercel Dashboard
3. Set environment variables in Vercel > Settings > Environment Variables
4. Deploy
5. Update `NEXT_PUBLIC_APP_URL` with the deployed URL
6. Update Mapbox token URL restrictions
7. Update Supabase Google OAuth redirect URL

## Loading Parcel Data

Parcels are stored in the `parcels` table with PostGIS geometry. To bulk load:

```sql
INSERT INTO parcels (apn, county, state_abbr, situs_address, owner_name, acreage, zoning, geometry)
VALUES (
  '123-456-789',
  'Los Angeles',
  'CA',
  '123 Industrial Blvd',
  'ABC Logistics LLC',
  24.3,
  'M-2',
  ST_GeomFromGeoJSON('{"type":"MultiPolygon","coordinates":[[...]]}')
);
```

Or use the Import Layer feature to upload GeoJSON/Shapefile with parcel data.

## Adding System Layer Presets

Add presets via Settings > Layer Presets, or insert directly:

```sql
INSERT INTO layer_presets (name, category, layer_config, is_public)
VALUES ('My WMS Layer', 'Infrastructure', '{"type":"wms","url":"https://..."}', true);
```

## Troubleshooting

| Issue | Solution |
|---|---|
| Map doesn't load | Check `NEXT_PUBLIC_MAPBOX_TOKEN` is set correctly |
| Auth redirect loop | Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| RLS blocks queries | Ensure user has a `profiles` record with `org_id` set |
| PostGIS functions fail | Run `001_extensions.sql` migration first |
| Storage upload fails | Create storage buckets manually in Supabase Dashboard |
| Google OAuth fails | Set redirect URL to `YOUR_APP_URL/auth/callback` in Supabase |

## Project Structure

```
land-intel/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/             # Auth pages (login, signup, reset)
│   │   ├── api/                # API route handlers
│   │   ├── app/                # Authenticated app pages
│   │   │   ├── dashboard/
│   │   │   ├── maps/
│   │   │   ├── collections/
│   │   │   ├── parcels/
│   │   │   ├── layers/
│   │   │   ├── exports/
│   │   │   └── settings/
│   │   └── auth/callback/
│   ├── components/
│   │   ├── map/                # Map workspace components
│   │   ├── parcels/            # Parcel profile components
│   │   ├── shared/             # Layout, nav, error boundary
│   │   └── ui/                 # shadcn/ui components
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utilities, Supabase client, constants
│   │   ├── calculations/       # Feasibility, measurements
│   │   ├── parsers/            # Coordinate, GeoJSON parsers
│   │   └── supabase/           # Supabase client (browser + server)
│   ├── store/                  # Zustand stores
│   └── types/                  # TypeScript types and Zod schemas
├── supabase/
│   ├── migrations/             # SQL migration files (001-006)
│   └── functions/              # Edge Functions (Deno)
├── tests/
│   ├── unit/                   # Vitest unit tests
│   └── e2e/                    # Playwright E2E tests
└── public/
```

# Land Intel Platform

Industrial real estate intelligence tool built as a single-page, three-panel map-centric application.

## Architecture

```
+----------------+---------------------------+----------------+
|  Left Panel    |     Center: Map           |  Right Panel   |
|  (320px)       |     Mapbox GL JS          |  (380px)       |
|                |                           |  (conditional) |
|  - Search      |  Floating toolbar         |                |
|  - Filters     |  Hover tooltips           |  - Parcel      |
|  - Layers      |  Click -> right panel     |  - Comps       |
|  - Projects    |  Draw/measure tools       |  - Notes       |
|  - Saved       |                           |  - Tags        |
|                |                           |  - Feasibility |
|  Collapsible   |                           |  - Zoning      |
+----------------+---------------------------+----------------+
```

Single route: `/app` -- everything lives in the three-panel shell.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Map**: Mapbox GL JS 3.20
- **Database**: Supabase (PostgreSQL + PostGIS + RLS)
- **State**: Zustand
- **Data Fetching**: TanStack React Query
- **UI**: shadcn/ui + Tailwind CSS
- **Geospatial**: Turf.js
- **Auth**: Supabase Auth

## Setup

### Prerequisites

- Node.js 18+
- Supabase project (with PostGIS extension)
- Mapbox account with access token

### Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Install & Run

```bash
npm install
npm run dev
```

### Supabase Setup

Run migrations in order:

```bash
supabase db push
```

Migrations cover:
- `001` - Extensions (PostGIS, uuid-ossp, pg_trgm)
- `002` - Core tables (orgs, profiles, maps, parcels, collections, etc.)
- `003` - Indexes (spatial GIST, trigram GIN, B-tree)
- `004` - Row-Level Security policies
- `005-006` - Additional schema
- `007` - Projects and project sites
- `008` - Comps and listings (with generated price columns)
- `009` - Reference layers (industrial parks, infrastructure, flood zones, zoning, land use)
- `010` - Drawings and imported datasets
- `011` - Tags, notes, saved searches
- `012` - RLS policies for all new tables

## Component Tree

```
AppShell
+-- LeftPanel
|   +-- LeftPanelHeader (section tabs)
|   +-- SearchSection (geocoder + parcel search)
|   +-- FilterSection (acreage, zoning, value, owner filters)
|   +-- LayerSection (layer toggles + opacity)
|   +-- ProjectSection (project CRUD + site list)
|   +-- SavedSection (saved searches)
+-- MapCanvas
|   +-- ParcelLayer (vector parcels with selection)
|   +-- CompLayer (clustered comp points)
|   +-- DrawingLayer (user annotations)
|   +-- MapTooltip (hover info)
|   +-- MapContextMenu (right-click actions)
+-- MapFloatingToolbar
|   +-- BasemapSwitcher
|   +-- DrawTools
|   +-- MeasureTools
+-- RightPanel
|   +-- ParcelDetailCard (full parcel info)
|   +-- ParcelActions (save, note, tag, export)
|   +-- CompAnalytics (comp stats + list)
|   +-- NotesPanel (CRUD notes)
|   +-- TagsPanel (tag management)
|   +-- FeasibilityPanel (development calculator)
|   +-- ZoningInfo (zoning detail)
+-- ImportDialog
+-- ExportDialog
```

## Features

- **Parcel Search**: Search by APN, address, or owner name with debounced results
- **Advanced Filters**: Acreage range, zoning codes, assessed value, flood zone, owner, county/state
- **Layer Management**: Toggle visibility and opacity for system and user layers
- **Projects**: Create projects, add parcels as sites, track status (prospect/active/under_contract/closed)
- **Comparable Sales**: View comps by parcel or radius with analytics (avg/median $/SF, $/acre)
- **Notes & Tags**: Attach notes and color-coded tags to parcels
- **Feasibility Calculator**: Development pro forma with NOI, return on cost, DSCR
- **Draw Tools**: Point, line, polygon, rectangle, circle drawing on map
- **Measure Tools**: Distance, area, and frontage measurement
- **Import**: CSV, GeoJSON, KML file upload with preview
- **Export**: CSV, GeoJSON, PNG screenshot, PDF map
- **Multi-select**: Select multiple parcels on map
- **Saved Searches**: Save and reload filter configurations
- **Basemap Switching**: Satellite, Streets, Light, Dark, Outdoors

## Deployment

### Vercel

```bash
vercel --prod
```

Set environment variables in Vercel dashboard. The app deploys at `mapping.vercel.app`.

## API Routes

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/projects` | GET, POST | List/create projects |
| `/api/projects/[id]` | GET, PATCH, DELETE | Single project CRUD |
| `/api/projects/[id]/sites` | GET, POST | Project site management |
| `/api/comps` | GET | Comps by parcel or radius |
| `/api/saved-searches` | GET, POST | Saved search management |
| `/api/notes` | GET, POST | Notes by parcel/project |
| `/api/tags` | GET, POST | Tag management |
| `/api/parcels/[id]/tags` | GET, POST, DELETE | Parcel tag associations |
| `/api/import` | POST | File import (multipart) |

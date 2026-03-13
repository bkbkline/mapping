-- Organizations
CREATE TABLE orgs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text UNIQUE NOT NULL,
  logo_url    text,
  settings    jsonb DEFAULT '{}',
  created_at  timestamptz DEFAULT now()
);

-- User profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email       text NOT NULL,
  full_name   text,
  avatar_url  text,
  role        text NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin','editor','viewer')),
  org_id      uuid REFERENCES orgs,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Maps
CREATE TABLE maps (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid REFERENCES orgs,
  owner_id     uuid REFERENCES profiles,
  title        text NOT NULL DEFAULT 'Untitled Map',
  description  text,
  center_lng   double precision NOT NULL DEFAULT -98.5,
  center_lat   double precision NOT NULL DEFAULT 39.8,
  zoom         numeric NOT NULL DEFAULT 4,
  basemap      text NOT NULL DEFAULT 'satellite-streets-v12',
  thumbnail_url text,
  share_mode   text NOT NULL DEFAULT 'private' CHECK (share_mode IN ('private','unlisted','public')),
  is_archived  boolean DEFAULT false,
  tags         text[] DEFAULT '{}',
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- Map layers
CREATE TABLE map_layers (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id         uuid REFERENCES maps ON DELETE CASCADE,
  name           text NOT NULL,
  layer_type     text NOT NULL CHECK (layer_type IN (
                   'geojson','wms','wmts','xyz_tile','mapbox_tileset',
                   'mapbox_style_layer','csv_points','kml','shapefile_converted'
                 )),
  source_config  jsonb NOT NULL,
  style_config   jsonb DEFAULT '{}',
  is_visible     boolean DEFAULT true,
  opacity        numeric DEFAULT 1.0 CHECK (opacity BETWEEN 0 AND 1),
  sort_order     integer DEFAULT 0,
  is_user_created boolean DEFAULT true,
  metadata       jsonb DEFAULT '{}',
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

-- Annotations (drawings on maps)
CREATE TABLE annotations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id         uuid REFERENCES maps ON DELETE CASCADE,
  owner_id       uuid REFERENCES profiles,
  geometry       geometry(Geometry, 4326) NOT NULL,
  geometry_type  text NOT NULL CHECK (geometry_type IN ('Point','LineString','Polygon','Circle','Rectangle')),
  label          text,
  notes          text,
  color          text DEFAULT '#F59E0B',
  stroke_width   numeric DEFAULT 2,
  fill_opacity   numeric DEFAULT 0.2,
  icon           text,
  media_urls     text[] DEFAULT '{}',
  measurement    jsonb,
  layer_id       uuid REFERENCES map_layers,
  is_deleted     boolean DEFAULT false,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

-- Parcels
CREATE TABLE parcels (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                uuid REFERENCES orgs,
  apn                   text,
  county                text,
  state_abbr            text,
  situs_address         text,
  owner_name            text,
  owner_mailing_address text,
  acreage               numeric,
  assessed_value        numeric,
  land_use_code         text,
  zoning                text,
  zoning_description    text,
  legal_description     text,
  geometry              geometry(MultiPolygon, 4326),
  raw_attributes        jsonb DEFAULT '{}',
  data_source           text,
  data_date             date,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

-- Collections (saved parcel sets)
CREATE TABLE collections (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid REFERENCES orgs,
  owner_id    uuid REFERENCES profiles,
  title       text NOT NULL,
  description text,
  tags        text[] DEFAULT '{}',
  share_mode  text NOT NULL DEFAULT 'private' CHECK (share_mode IN ('private','unlisted','public')),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Collection items (parcels in a collection)
CREATE TABLE collection_items (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id        uuid REFERENCES collections ON DELETE CASCADE,
  parcel_id            uuid REFERENCES parcels,
  external_parcel_ref  jsonb,
  status               text DEFAULT 'prospect' CHECK (status IN (
                         'prospect','active','under_contract','closed','rejected','on_hold'
                       )),
  tags                 text[] DEFAULT '{}',
  notes                text,
  custom_fields        jsonb DEFAULT '{}',
  added_at             timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

-- Layer presets (reusable layer configs)
CREATE TABLE layer_presets (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid REFERENCES orgs,
  name         text NOT NULL,
  category     text,
  layer_config jsonb NOT NULL,
  is_public    boolean DEFAULT false,
  sort_order   integer DEFAULT 0,
  created_at   timestamptz DEFAULT now()
);

-- Map sharing grants (explicit user access)
CREATE TABLE map_grants (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id     uuid REFERENCES maps ON DELETE CASCADE,
  user_id    uuid REFERENCES profiles ON DELETE CASCADE,
  can_edit   boolean DEFAULT false,
  granted_at timestamptz DEFAULT now(),
  UNIQUE(map_id, user_id)
);

-- Export jobs
CREATE TABLE exports (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid REFERENCES orgs,
  created_by   uuid REFERENCES profiles,
  export_type  text NOT NULL CHECK (export_type IN ('pdf_map','csv_parcels','xlsx_parcels','geojson','kml')),
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','complete','failed')),
  params       jsonb DEFAULT '{}',
  file_url     text,
  error_msg    text,
  created_at   timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Audit log
CREATE TABLE audit_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid REFERENCES orgs,
  user_id       uuid REFERENCES profiles,
  action        text NOT NULL,
  resource_type text,
  resource_id   uuid,
  metadata      jsonb DEFAULT '{}',
  created_at    timestamptz DEFAULT now()
);

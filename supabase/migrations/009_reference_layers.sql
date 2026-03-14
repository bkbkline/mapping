-- Reference/system layers
CREATE TABLE industrial_parks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  city TEXT,
  state TEXT,
  total_acres NUMERIC,
  available_acres NUMERIC,
  features TEXT[],
  geometry GEOMETRY(MultiPolygon, 4326),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE infrastructure_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_type TEXT NOT NULL CHECK (asset_type IN ('freeway', 'rail', 'port', 'airport', 'utility', 'pipeline')),
  name TEXT NOT NULL,
  description TEXT,
  geometry GEOMETRY(Geometry, 4326),
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE flood_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_code TEXT NOT NULL,
  zone_description TEXT,
  source TEXT,
  effective_date DATE,
  geometry GEOMETRY(MultiPolygon, 4326),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE zoning_districts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  jurisdiction TEXT NOT NULL,
  zone_code TEXT NOT NULL,
  zone_name TEXT,
  description TEXT,
  permitted_uses TEXT[],
  max_far NUMERIC,
  max_height NUMERIC,
  max_lot_coverage NUMERIC,
  geometry GEOMETRY(MultiPolygon, 4326),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE land_use (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  land_use_code TEXT NOT NULL,
  land_use_description TEXT,
  category TEXT,
  geometry GEOMETRY(MultiPolygon, 4326),
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_industrial_parks_geometry ON industrial_parks USING GIST(geometry);
CREATE INDEX idx_infrastructure_assets_geometry ON infrastructure_assets USING GIST(geometry);
CREATE INDEX idx_flood_zones_geometry ON flood_zones USING GIST(geometry);
CREATE INDEX idx_zoning_districts_geometry ON zoning_districts USING GIST(geometry);
CREATE INDEX idx_land_use_geometry ON land_use USING GIST(geometry);

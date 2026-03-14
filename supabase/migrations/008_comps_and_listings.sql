-- Comps and listings
CREATE TABLE comps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  parcel_id UUID REFERENCES parcels(id) ON DELETE SET NULL,
  address TEXT,
  sale_date DATE,
  sale_price NUMERIC,
  building_sf NUMERIC,
  land_sf NUMERIC,
  price_per_sf NUMERIC GENERATED ALWAYS AS (
    CASE WHEN building_sf > 0 THEN sale_price / building_sf END
  ) STORED,
  price_per_acre NUMERIC GENERATED ALWAYS AS (
    CASE WHEN land_sf > 0 THEN sale_price / (land_sf / 43560.0) END
  ) STORED,
  buyer TEXT,
  seller TEXT,
  zoning TEXT,
  property_type TEXT,
  clear_height NUMERIC,
  year_built INTEGER,
  notes TEXT,
  geometry GEOMETRY(Point, 4326),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  parcel_id UUID REFERENCES parcels(id) ON DELETE SET NULL,
  address TEXT,
  asking_price NUMERIC,
  building_sf NUMERIC,
  land_sf NUMERIC,
  price_per_sf NUMERIC GENERATED ALWAYS AS (
    CASE WHEN building_sf > 0 THEN asking_price / building_sf END
  ) STORED,
  price_per_acre NUMERIC GENERATED ALWAYS AS (
    CASE WHEN land_sf > 0 THEN asking_price / (land_sf / 43560.0) END
  ) STORED,
  listing_date DATE,
  broker TEXT,
  broker_phone TEXT,
  broker_email TEXT,
  property_type TEXT,
  zoning TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'sold', 'withdrawn')),
  geometry GEOMETRY(Point, 4326),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_comps_geometry ON comps USING GIST(geometry);
CREATE INDEX idx_comps_org_id ON comps(org_id);
CREATE INDEX idx_listings_geometry ON listings USING GIST(geometry);
CREATE INDEX idx_listings_org_id ON listings(org_id);

-- User drawings and imported datasets
CREATE TABLE drawings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  name TEXT,
  geometry GEOMETRY(Geometry, 4326),
  geometry_type TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  stroke_width NUMERIC DEFAULT 2,
  fill_opacity NUMERIC DEFAULT 0.3,
  measurement JSONB,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE imported_datasets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('csv', 'geojson', 'kml', 'shapefile')),
  feature_count INTEGER DEFAULT 0,
  geometry_type TEXT,
  geojson JSONB,
  original_filename TEXT,
  properties_schema JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_drawings_geometry ON drawings USING GIST(geometry);
CREATE INDEX idx_drawings_org_id ON drawings(org_id);
CREATE INDEX idx_drawings_project_id ON drawings(project_id);
CREATE INDEX idx_imported_datasets_org_id ON imported_datasets(org_id);

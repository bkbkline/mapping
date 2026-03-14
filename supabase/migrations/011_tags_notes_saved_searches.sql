-- Tags, notes, and saved searches
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6B7280',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE parcel_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parcel_id UUID NOT NULL REFERENCES parcels(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(parcel_id, tag_id)
);

CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  parcel_id UUID REFERENCES parcels(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE saved_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}',
  viewport JSONB,
  result_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tags_org_id ON tags(org_id);
CREATE INDEX idx_parcel_tags_parcel_id ON parcel_tags(parcel_id);
CREATE INDEX idx_parcel_tags_tag_id ON parcel_tags(tag_id);
CREATE INDEX idx_notes_parcel_id ON notes(parcel_id);
CREATE INDEX idx_notes_project_id ON notes(project_id);
CREATE INDEX idx_saved_searches_org_id ON saved_searches(org_id);

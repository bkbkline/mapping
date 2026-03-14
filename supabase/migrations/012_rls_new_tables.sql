-- RLS policies for all new tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE comps ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE industrial_parks ENABLE ROW LEVEL SECURITY;
ALTER TABLE infrastructure_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE flood_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoning_districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE land_use ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawings ENABLE ROW LEVEL SECURITY;
ALTER TABLE imported_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcel_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

-- Projects: org members can CRUD
CREATE POLICY "org_members_projects" ON projects
  FOR ALL USING (
    org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  );

-- Project sites: same as project
CREATE POLICY "org_members_project_sites" ON project_sites
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects WHERE org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Comps: org members
CREATE POLICY "org_members_comps" ON comps
  FOR ALL USING (
    org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  );

-- Listings: org members
CREATE POLICY "org_members_listings" ON listings
  FOR ALL USING (
    org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  );

-- Reference layers: readable by all authenticated users
CREATE POLICY "authenticated_read_industrial_parks" ON industrial_parks
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_read_infrastructure" ON infrastructure_assets
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_read_flood_zones" ON flood_zones
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_read_zoning" ON zoning_districts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_read_land_use" ON land_use
  FOR SELECT USING (auth.role() = 'authenticated');

-- Drawings: org members
CREATE POLICY "org_members_drawings" ON drawings
  FOR ALL USING (
    org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  );

-- Imported datasets: org members
CREATE POLICY "org_members_imported_datasets" ON imported_datasets
  FOR ALL USING (
    org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  );

-- Tags: org members
CREATE POLICY "org_members_tags" ON tags
  FOR ALL USING (
    org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  );

-- Parcel tags: if you can see the parcel, you can see its tags
CREATE POLICY "org_members_parcel_tags" ON parcel_tags
  FOR ALL USING (
    parcel_id IN (
      SELECT id FROM parcels WHERE org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Notes: org members
CREATE POLICY "org_members_notes" ON notes
  FOR ALL USING (
    org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  );

-- Saved searches: org members
CREATE POLICY "org_members_saved_searches" ON saved_searches
  FOR ALL USING (
    org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  );

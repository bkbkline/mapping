-- Enable RLS
ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE orgs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE maps            ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_layers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE annotations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcels         ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections     ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE layer_presets   ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_grants      ENABLE ROW LEVEL SECURITY;
ALTER TABLE exports         ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log       ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "profiles_select" ON profiles FOR SELECT
  USING (id = auth.uid() OR org_id IN (
    SELECT org_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Orgs
CREATE POLICY "orgs_select" ON orgs FOR SELECT
  USING (id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "orgs_update_admin" ON orgs FOR UPDATE
  USING (id IN (SELECT org_id FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Maps
CREATE POLICY "maps_select" ON maps FOR SELECT
  USING (
    share_mode = 'public'
    OR org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
    OR id IN (SELECT map_id FROM map_grants WHERE user_id = auth.uid())
  );
CREATE POLICY "maps_insert" ON maps FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid() AND role IN ('admin','editor')));
CREATE POLICY "maps_update" ON maps FOR UPDATE
  USING (owner_id = auth.uid() OR org_id IN (
    SELECT org_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));
CREATE POLICY "maps_delete" ON maps FOR DELETE
  USING (owner_id = auth.uid() OR org_id IN (
    SELECT org_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Map layers
CREATE POLICY "map_layers_select" ON map_layers FOR SELECT
  USING (map_id IN (SELECT id FROM maps));
CREATE POLICY "map_layers_insert" ON map_layers FOR INSERT
  WITH CHECK (map_id IN (SELECT id FROM maps WHERE owner_id = auth.uid() OR org_id IN (
    SELECT org_id FROM profiles WHERE id = auth.uid() AND role IN ('admin','editor')
  )));
CREATE POLICY "map_layers_update" ON map_layers FOR UPDATE
  USING (map_id IN (SELECT id FROM maps WHERE owner_id = auth.uid() OR org_id IN (
    SELECT org_id FROM profiles WHERE id = auth.uid() AND role IN ('admin','editor')
  )));
CREATE POLICY "map_layers_delete" ON map_layers FOR DELETE
  USING (map_id IN (SELECT id FROM maps WHERE owner_id = auth.uid() OR org_id IN (
    SELECT org_id FROM profiles WHERE id = auth.uid() AND role IN ('admin','editor')
  )));

-- Annotations
CREATE POLICY "annotations_select" ON annotations FOR SELECT
  USING (map_id IN (SELECT id FROM maps) AND is_deleted = false);
CREATE POLICY "annotations_insert" ON annotations FOR INSERT
  WITH CHECK (map_id IN (SELECT id FROM maps WHERE owner_id = auth.uid() OR org_id IN (
    SELECT org_id FROM profiles WHERE id = auth.uid() AND role IN ('admin','editor')
  )));
CREATE POLICY "annotations_update" ON annotations FOR UPDATE
  USING (map_id IN (SELECT id FROM maps WHERE owner_id = auth.uid() OR org_id IN (
    SELECT org_id FROM profiles WHERE id = auth.uid() AND role IN ('admin','editor')
  )));
CREATE POLICY "annotations_delete" ON annotations FOR DELETE
  USING (map_id IN (SELECT id FROM maps WHERE owner_id = auth.uid() OR org_id IN (
    SELECT org_id FROM profiles WHERE id = auth.uid() AND role IN ('admin','editor')
  )));

-- Parcels
CREATE POLICY "parcels_select" ON parcels FOR SELECT
  USING (org_id IS NULL OR org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "parcels_insert" ON parcels FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid() AND role IN ('admin','editor')));
CREATE POLICY "parcels_update" ON parcels FOR UPDATE
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid() AND role IN ('admin','editor')));
CREATE POLICY "parcels_delete" ON parcels FOR DELETE
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid() AND role IN ('admin','editor')));

-- Collections
CREATE POLICY "collections_select" ON collections FOR SELECT
  USING (
    share_mode = 'public'
    OR org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  );
CREATE POLICY "collections_insert" ON collections FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid() AND role IN ('admin','editor')));
CREATE POLICY "collections_update" ON collections FOR UPDATE
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid() AND role IN ('admin','editor')));
CREATE POLICY "collections_delete" ON collections FOR DELETE
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid() AND role IN ('admin','editor')));

-- Collection items
CREATE POLICY "collection_items_select" ON collection_items FOR SELECT
  USING (collection_id IN (SELECT id FROM collections));
CREATE POLICY "collection_items_insert" ON collection_items FOR INSERT
  WITH CHECK (collection_id IN (SELECT id FROM collections));
CREATE POLICY "collection_items_update" ON collection_items FOR UPDATE
  USING (collection_id IN (SELECT id FROM collections));
CREATE POLICY "collection_items_delete" ON collection_items FOR DELETE
  USING (collection_id IN (SELECT id FROM collections));

-- Layer presets
CREATE POLICY "layer_presets_select" ON layer_presets FOR SELECT
  USING (is_public = true OR org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "layer_presets_insert" ON layer_presets FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid() AND role IN ('admin','editor')));
CREATE POLICY "layer_presets_update" ON layer_presets FOR UPDATE
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid() AND role IN ('admin','editor')));
CREATE POLICY "layer_presets_delete" ON layer_presets FOR DELETE
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid() AND role IN ('admin','editor')));

-- Map grants
CREATE POLICY "map_grants_select" ON map_grants FOR SELECT
  USING (user_id = auth.uid() OR map_id IN (
    SELECT id FROM maps WHERE owner_id = auth.uid()
  ));
CREATE POLICY "map_grants_insert" ON map_grants FOR INSERT
  WITH CHECK (map_id IN (SELECT id FROM maps WHERE owner_id = auth.uid()));
CREATE POLICY "map_grants_update" ON map_grants FOR UPDATE
  USING (map_id IN (SELECT id FROM maps WHERE owner_id = auth.uid()));
CREATE POLICY "map_grants_delete" ON map_grants FOR DELETE
  USING (map_id IN (SELECT id FROM maps WHERE owner_id = auth.uid()));

-- Exports
CREATE POLICY "exports_select" ON exports FOR SELECT
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "exports_insert" ON exports FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Audit log
CREATE POLICY "audit_log_select" ON audit_log FOR SELECT
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "audit_log_insert" ON audit_log FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

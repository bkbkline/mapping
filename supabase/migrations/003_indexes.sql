CREATE INDEX parcels_geometry_idx       ON parcels USING GIST (geometry);
CREATE INDEX annotations_geometry_idx  ON annotations USING GIST (geometry);
CREATE INDEX parcels_apn_idx           ON parcels (apn);
CREATE INDEX parcels_state_county_idx  ON parcels (state_abbr, county);
CREATE INDEX parcels_address_trgm_idx  ON parcels USING GIN (situs_address gin_trgm_ops);
CREATE INDEX parcels_owner_trgm_idx    ON parcels USING GIN (owner_name gin_trgm_ops);
CREATE INDEX map_layers_map_id_idx     ON map_layers (map_id, sort_order);
CREATE INDEX annotations_map_id_idx   ON annotations (map_id) WHERE is_deleted = false;
CREATE INDEX audit_log_org_idx         ON audit_log (org_id, created_at DESC);

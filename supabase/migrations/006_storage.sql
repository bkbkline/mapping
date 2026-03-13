-- Storage buckets are created via Supabase Dashboard or client API
-- This file documents the required buckets:

-- Bucket: layer-files
--   Purpose: User-uploaded GeoJSON, KML, Shapefiles
--   Access: Private, signed URLs for download

-- Bucket: export-files
--   Purpose: Generated PDFs, CSVs, exports
--   Access: Private, signed URLs for download

-- Bucket: map-thumbnails
--   Purpose: Static map preview images
--   Access: Public read

-- Bucket: org-assets
--   Purpose: Organization logos, user avatars
--   Access: Public read

-- To create these buckets programmatically, run:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('layer-files', 'layer-files', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('export-files', 'export-files', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('map-thumbnails', 'map-thumbnails', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('org-assets', 'org-assets', true);

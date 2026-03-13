import { z } from 'zod';

export const envSchema = z.object({
  NEXT_PUBLIC_MAPBOX_TOKEN: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().or(z.string().min(1)),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().min(1),
});

export function validateEnv() {
  const result = envSchema.safeParse({
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });
  if (!result.success) {
    console.warn('⚠️ Missing or invalid environment variables:', result.error.flatten().fieldErrors);
    console.warn('Using placeholder values. Set real values before deploying.');
  }
  return result;
}

// API request schemas
export const createMapSchema = z.object({
  title: z.string().min(1).max(255).default('Untitled Map'),
  description: z.string().optional(),
  center_lng: z.number().min(-180).max(180).default(-98.5),
  center_lat: z.number().min(-90).max(90).default(39.8),
  zoom: z.number().min(0).max(22).default(4),
  basemap: z.string().default('satellite-streets-v12'),
});

export const updateMapSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  center_lng: z.number().min(-180).max(180).optional(),
  center_lat: z.number().min(-90).max(90).optional(),
  zoom: z.number().min(0).max(22).optional(),
  basemap: z.string().optional(),
  share_mode: z.enum(['private', 'unlisted', 'public']).optional(),
  is_archived: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

export const createLayerSchema = z.object({
  name: z.string().min(1).max(255),
  layer_type: z.enum([
    'geojson', 'wms', 'wmts', 'xyz_tile', 'mapbox_tileset',
    'mapbox_style_layer', 'csv_points', 'kml', 'shapefile_converted',
  ]),
  source_config: z.record(z.string(), z.unknown()),
  style_config: z.record(z.string(), z.unknown()).default({}),
  is_visible: z.boolean().default(true),
  opacity: z.number().min(0).max(1).default(1),
  sort_order: z.number().int().default(0),
  is_user_created: z.boolean().default(true),
});

export const updateLayerSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  source_config: z.record(z.string(), z.unknown()).optional(),
  style_config: z.record(z.string(), z.unknown()).optional(),
  is_visible: z.boolean().optional(),
  opacity: z.number().min(0).max(1).optional(),
  sort_order: z.number().int().optional(),
});

export const createAnnotationSchema = z.object({
  geometry: z.any(),
  geometry_type: z.enum(['Point', 'LineString', 'Polygon', 'Circle', 'Rectangle']),
  label: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  color: z.string().default('#F59E0B'),
  stroke_width: z.number().min(1).max(10).default(2),
  fill_opacity: z.number().min(0).max(1).default(0.2),
  layer_id: z.string().uuid().nullable().optional(),
  measurement: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const updateAnnotationSchema = z.object({
  label: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  color: z.string().optional(),
  stroke_width: z.number().min(1).max(10).optional(),
  fill_opacity: z.number().min(0).max(1).optional(),
  layer_id: z.string().uuid().nullable().optional(),
  geometry: z.any().optional(),
});

export const createCollectionSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  share_mode: z.enum(['private', 'unlisted', 'public']).default('private'),
});

export const updateCollectionSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  share_mode: z.enum(['private', 'unlisted', 'public']).optional(),
});

export const addCollectionItemSchema = z.object({
  parcel_id: z.string().uuid().optional(),
  external_parcel_ref: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(['prospect', 'active', 'under_contract', 'closed', 'rejected', 'on_hold']).default('prospect'),
  tags: z.array(z.string()).default([]),
  notes: z.string().nullable().optional(),
  custom_fields: z.record(z.string(), z.unknown()).default({}),
});

export const updateCollectionItemSchema = z.object({
  status: z.enum(['prospect', 'active', 'under_contract', 'closed', 'rejected', 'on_hold']).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().nullable().optional(),
  custom_fields: z.record(z.string(), z.unknown()).optional(),
});

export const parcelSearchSchema = z.object({
  query: z.string().optional(),
  apn: z.string().optional(),
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

export const shareUpdateSchema = z.object({
  share_mode: z.enum(['private', 'unlisted', 'public']).optional(),
  grants: z.array(z.object({
    email: z.string().email(),
    can_edit: z.boolean().default(false),
  })).optional(),
});

export const exportRequestSchema = z.object({
  export_type: z.enum(['pdf_map', 'csv_parcels', 'xlsx_parcels', 'geojson', 'kml']),
  params: z.record(z.string(), z.unknown()).default({}),
});

export const sanitizeHtml = (input: string): string => {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/on\w+\s*=\s*'[^']*'/gi, '')
    .replace(/<\/?(?:script|iframe|object|embed|form|input|button)\b[^>]*>/gi, '');
};

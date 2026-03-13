export type UserRole = 'admin' | 'editor' | 'viewer';
export type ShareMode = 'private' | 'unlisted' | 'public';
export type ParcelStatus = 'prospect' | 'active' | 'under_contract' | 'closed' | 'rejected' | 'on_hold';
export type ExportType = 'pdf_map' | 'csv_parcels' | 'xlsx_parcels' | 'geojson' | 'kml';
export type ExportStatus = 'pending' | 'processing' | 'complete' | 'failed';
export type GeometryType = 'Point' | 'LineString' | 'Polygon' | 'Circle' | 'Rectangle';

export type DrawTool =
  | 'pan'
  | 'polygon'
  | 'rectangle'
  | 'circle'
  | 'line'
  | 'point'
  | 'measure_distance'
  | 'measure_area'
  | 'buffer'
  | 'setback_buffer'
  | 'parking_calc'
  | 'truck_court'
  | 'building_area';

export type LayerType =
  | 'geojson'
  | 'wms'
  | 'wmts'
  | 'xyz_tile'
  | 'mapbox_tileset'
  | 'mapbox_style_layer'
  | 'csv_points'
  | 'kml'
  | 'shapefile_converted';

export type BasemapStyle =
  | 'satellite-streets-v12'
  | 'satellite-v9'
  | 'streets-v12'
  | 'outdoors-v12'
  | 'dark-v11'
  | 'light-v11';

export interface Org {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  settings: Record<string, unknown>;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  org_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface MapRecord {
  id: string;
  org_id: string | null;
  owner_id: string | null;
  title: string;
  description: string | null;
  center_lng: number;
  center_lat: number;
  zoom: number;
  basemap: BasemapStyle;
  thumbnail_url: string | null;
  share_mode: ShareMode;
  is_archived: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface MapLayer {
  id: string;
  map_id: string;
  name: string;
  layer_type: LayerType;
  source_config: Record<string, unknown>;
  style_config: Record<string, unknown>;
  is_visible: boolean;
  opacity: number;
  sort_order: number;
  is_user_created: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Annotation {
  id: string;
  map_id: string;
  owner_id: string | null;
  geometry: GeoJSON.Geometry;
  geometry_type: GeometryType;
  label: string | null;
  notes: string | null;
  color: string;
  stroke_width: number;
  fill_opacity: number;
  icon: string | null;
  media_urls: string[];
  measurement: Record<string, unknown> | null;
  layer_id: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface Parcel {
  id: string;
  org_id: string | null;
  apn: string | null;
  county: string | null;
  state_abbr: string | null;
  situs_address: string | null;
  owner_name: string | null;
  owner_mailing_address: string | null;
  acreage: number | null;
  assessed_value: number | null;
  land_use_code: string | null;
  zoning: string | null;
  zoning_description: string | null;
  legal_description: string | null;
  geometry: GeoJSON.MultiPolygon | null;
  raw_attributes: Record<string, unknown>;
  data_source: string | null;
  data_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Collection {
  id: string;
  org_id: string | null;
  owner_id: string | null;
  title: string;
  description: string | null;
  tags: string[];
  share_mode: ShareMode;
  created_at: string;
  updated_at: string;
}

export interface CollectionItem {
  id: string;
  collection_id: string;
  parcel_id: string | null;
  external_parcel_ref: Record<string, unknown> | null;
  status: ParcelStatus;
  tags: string[];
  notes: string | null;
  custom_fields: Record<string, unknown>;
  added_at: string;
  updated_at: string;
  parcel?: Parcel;
}

export interface LayerPreset {
  id: string;
  org_id: string | null;
  name: string;
  category: string | null;
  layer_config: Record<string, unknown>;
  is_public: boolean;
  sort_order: number;
  created_at: string;
}

export interface MapGrant {
  id: string;
  map_id: string;
  user_id: string;
  can_edit: boolean;
  granted_at: string;
}

export interface ExportRecord {
  id: string;
  org_id: string | null;
  created_by: string | null;
  export_type: ExportType;
  status: ExportStatus;
  params: Record<string, unknown>;
  file_url: string | null;
  error_msg: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface AuditLogEntry {
  id: string;
  org_id: string | null;
  user_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface MapViewport {
  center: [number, number];
  zoom: number;
  bearing: number;
  pitch: number;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  description?: string;
  duration?: number;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  meta?: Record<string, unknown>;
}

export interface IndustrialScorecard {
  clear_height: number | null;
  column_spacing: string | null;
  dock_doors: number | null;
  drive_in_doors: number | null;
  grade_level_doors: number | null;
  office_sf: number | null;
  total_building_sf: number | null;
  site_coverage: number | null;
  power: string | null;
  rail_access: boolean;
  truck_court_depth: number | null;
  year_built: number | null;
  sprinkler_system: 'ESFR' | 'CMDA' | 'Dry Pipe' | 'None' | null;
  construction_type: 'Tilt-up' | 'Pre-eng. Steel' | 'Masonry' | null;
  dock_levelers: boolean;
  cross_dock: boolean;
  trailer_parking_stalls: number | null;
  car_parking_stalls: number | null;
}

export interface FeasibilityInputs {
  land_cost: number;
  building_sf: number;
  construction_cost_psf: number;
  hard_cost_contingency: number;
  soft_costs: number;
  stabilized_rent_psf: number;
  vacancy_rate: number;
  cap_rate: number;
  loan_to_cost: number;
  interest_rate: number;
  loan_term: number;
}

export interface FeasibilityOutputs {
  total_hard_costs: number;
  total_project_cost: number;
  stabilized_noi: number;
  stabilized_value: number;
  return_on_cost: number;
  required_equity: number;
  max_loan: number;
  annual_debt_service: number;
  dscr: number;
  profit: number;
}

export interface SalesComp {
  id: string;
  address: string;
  sale_date: string;
  sale_price: number;
  building_sf: number;
  land_sf: number;
  price_psf: number;
  land_price_per_acre: number;
  zoning: string;
  clear_height: number;
  notes: string;
}

export interface ZoningLookupEntry {
  code: string;
  description: string;
  permitted_uses: string[];
  max_far: number | null;
  max_lot_coverage: number | null;
  min_setbacks: { front: number; rear: number; side: number } | null;
  max_height: number | null;
  industrial_compatibility: 'permitted' | 'conditional' | 'not_permitted';
}

export interface SystemLayerConfig {
  id: string;
  name: string;
  layer_type: LayerType;
  url: string;
  category: 'constraint' | 'infrastructure' | 'environmental' | 'reference';
  risk_color?: string;
}

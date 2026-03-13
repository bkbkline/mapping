import type { SystemLayerConfig, BasemapStyle } from '@/types';

export const BASEMAPS: { id: BasemapStyle; label: string }[] = [
  { id: 'satellite-streets-v12', label: 'Satellite Streets' },
  { id: 'satellite-v9', label: 'Satellite' },
  { id: 'streets-v12', label: 'Streets' },
  { id: 'outdoors-v12', label: 'Outdoors / Topo' },
  { id: 'dark-v11', label: 'Dark' },
  { id: 'light-v11', label: 'Light' },
];

export const SYSTEM_LAYERS: SystemLayerConfig[] = [
  {
    id: 'parcel-boundaries',
    name: 'Parcel Boundaries',
    layer_type: 'xyz_tile',
    url: 'YOUR_PARCEL_TILE_URL_HERE/{z}/{x}/{y}.pbf',
    category: 'reference',
  },
  {
    id: 'zoning',
    name: 'Zoning',
    layer_type: 'wms',
    url: 'YOUR_ZONING_WMS_URL_HERE',
    category: 'reference',
  },
  {
    id: 'fema-flood',
    name: 'FEMA Flood Zones',
    layer_type: 'wms',
    url: 'https://hazards.fema.gov/gis/nfhl/services/public/NFHL/MapServer/WMSServer',
    category: 'constraint',
    risk_color: '#EF4444',
  },
  {
    id: 'wetlands',
    name: 'Wetlands (NWI)',
    layer_type: 'wms',
    url: 'https://www.fws.gov/wetlands/arcgis/services/Wetlands/MapServer/WMSServer',
    category: 'environmental',
    risk_color: '#F97316',
  },
  {
    id: 'usgs-topo',
    name: 'USGS Topo',
    layer_type: 'xyz_tile',
    url: 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}',
    category: 'reference',
  },
  {
    id: 'epa-superfund',
    name: 'EPA Superfund Sites',
    layer_type: 'wms',
    url: 'YOUR_EPA_SUPERFUND_WMS_URL_HERE',
    category: 'constraint',
    risk_color: '#EF4444',
  },
  {
    id: 'rail-lines',
    name: 'Rail Lines',
    layer_type: 'xyz_tile',
    url: 'YOUR_RAIL_LINES_TILE_URL_HERE',
    category: 'infrastructure',
  },
  {
    id: 'power-lines',
    name: 'Power Lines',
    layer_type: 'xyz_tile',
    url: 'YOUR_POWER_LINES_TILE_URL_HERE',
    category: 'infrastructure',
  },
  {
    id: 'highways',
    name: 'Major Highways',
    layer_type: 'mapbox_style_layer',
    url: 'mapbox://mapbox.mapbox-streets-v8',
    category: 'infrastructure',
  },
];

export const CONSTRAINT_LAYERS: SystemLayerConfig[] = [
  {
    id: 'fema-100yr-flood',
    name: 'FEMA 100-yr Flood',
    layer_type: 'wms',
    url: 'https://hazards.fema.gov/gis/nfhl/services/public/NFHL/MapServer/WMSServer',
    category: 'constraint',
    risk_color: '#EF4444',
  },
  {
    id: 'wetlands-constraint',
    name: 'Wetlands',
    layer_type: 'wms',
    url: 'https://www.fws.gov/wetlands/arcgis/services/Wetlands/MapServer/WMSServer',
    category: 'constraint',
    risk_color: '#F97316',
  },
  {
    id: 'epa-superfund-constraint',
    name: 'EPA Superfund Sites',
    layer_type: 'wms',
    url: 'YOUR_EPA_SUPERFUND_WMS_URL_HERE',
    category: 'constraint',
    risk_color: '#EF4444',
  },
  {
    id: 'airport-noise',
    name: 'Airport Noise (65+ DNL)',
    layer_type: 'wms',
    url: 'YOUR_AIRPORT_NOISE_WMS_URL_HERE',
    category: 'constraint',
    risk_color: '#F97316',
  },
  {
    id: 'conservation-easements',
    name: 'Conservation Easements',
    layer_type: 'wms',
    url: 'YOUR_CONSERVATION_WMS_URL_HERE',
    category: 'constraint',
    risk_color: '#FBBF24',
  },
  {
    id: 'seismic-hazard',
    name: 'Seismic Hazard Zone',
    layer_type: 'wms',
    url: 'YOUR_SEISMIC_HAZARD_WMS_URL_HERE',
    category: 'constraint',
    risk_color: '#FBBF24',
  },
];

export const PARCEL_STATUS_COLORS: Record<string, string> = {
  prospect: '#3B82F6',
  active: '#10B981',
  under_contract: '#F59E0B',
  closed: '#6B7280',
  rejected: '#EF4444',
  on_hold: '#8B5CF6',
};

export const PARCEL_STATUS_LABELS: Record<string, string> = {
  prospect: 'Prospect',
  active: 'Active',
  under_contract: 'Under Contract',
  closed: 'Closed',
  rejected: 'Rejected',
  on_hold: 'On Hold',
};

export const INDUSTRIAL_USES = [
  'Warehouse',
  'Manufacturing',
  'Outdoor Storage',
  'Truck Terminal',
  'Data Center',
  'Flex/R&D',
  'Cold Storage',
  'Hazmat',
] as const;

export const LAYER_CATEGORIES = [
  'All',
  'Zoning',
  'Utilities',
  'Infrastructure',
  'Environmental',
  'Transportation',
  'Industrial',
  'Demographics',
  'Custom',
] as const;

export const DEFAULT_LAYER_PRESETS = [
  {
    name: 'FEMA Flood Zones',
    category: 'Environmental',
    layer_config: { type: 'wms', url: 'https://hazards.fema.gov/gis/nfhl/services/public/NFHL/MapServer/WMSServer', layers: '28' },
  },
  {
    name: 'NWI Wetlands',
    category: 'Environmental',
    layer_config: { type: 'wms', url: 'https://www.fws.gov/wetlands/arcgis/services/Wetlands/MapServer/WMSServer', layers: '0' },
  },
  {
    name: 'USGS Topographic',
    category: 'Infrastructure',
    layer_config: { type: 'xyz_tile', url: 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}' },
  },
  {
    name: 'US Census Roads',
    category: 'Transportation',
    layer_config: { type: 'wms', url: 'https://tigerweb.geo.census.gov/arcgis/services/TIGERweb/tigerWMS_Current/MapServer/WMSServer', layers: '2' },
  },
  {
    name: 'Rail Network',
    category: 'Transportation',
    layer_config: { type: 'xyz_tile', url: 'YOUR_RAIL_LINES_TILE_URL_HERE' },
  },
  {
    name: 'EPA Superfund',
    category: 'Environmental',
    layer_config: { type: 'wms', url: 'YOUR_EPA_SUPERFUND_WMS_URL_HERE' },
  },
  {
    name: 'Power Infrastructure',
    category: 'Utilities',
    layer_config: { type: 'xyz_tile', url: 'YOUR_POWER_LINES_TILE_URL_HERE' },
  },
  {
    name: 'Zoning Overlay',
    category: 'Zoning',
    layer_config: { type: 'wms', url: 'YOUR_ZONING_WMS_URL_HERE' },
  },
  {
    name: 'Parcel Boundaries',
    category: 'Infrastructure',
    layer_config: { type: 'xyz_tile', url: 'YOUR_PARCEL_TILE_URL_HERE/{z}/{x}/{y}.pbf' },
  },
  {
    name: 'Aerial Imagery',
    category: 'Infrastructure',
    layer_config: { type: 'mapbox_style_layer', url: 'mapbox://mapbox.satellite' },
  },
];

export const ACCENT_PALETTE = [
  '#F59E0B', '#EF4444', '#3B82F6', '#10B981', '#8B5CF6',
  '#EC4899', '#F97316', '#06B6D4', '#84CC16', '#6366F1',
];

declare module 'shpjs' {
  function shp(buffer: ArrayBuffer | string): Promise<GeoJSON.FeatureCollection>;
  export default shp;
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParcelSearchPayload {
  query?: string;    // free text search on situs_address, owner_name
  apn?: string;      // APN exact or fuzzy match
  bbox?: [number, number, number, number]; // [west, south, east, north]
  limit?: number;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  );
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const payload: ParcelSearchPayload = await req.json();
    const { query, apn, bbox, limit: requestedLimit } = payload;
    const limit = Math.min(requestedLimit || 20, 100);

    // Get user's org_id for RBAC filtering
    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .single();

    const orgId = profile?.org_id;

    // Build search using RPC calls that leverage pg_trgm and PostGIS
    // The search returns parcels that belong to the user's org OR are global (org_id IS NULL)
    if (apn) {
      // APN search: exact match first, then fuzzy
      const { data: results, error } = await supabase.rpc('search_parcels_by_apn', {
        search_apn: apn,
        user_org_id: orgId,
        result_limit: limit,
      });

      if (error) throw new Error(`APN search failed: ${error.message}`);

      return respondWithGeoJson(results || []);
    }

    if (bbox) {
      // BBox PostGIS intersection search
      const [west, south, east, north] = bbox;
      const { data: results, error } = await supabase.rpc('search_parcels_by_bbox', {
        bbox_west: west,
        bbox_south: south,
        bbox_east: east,
        bbox_north: north,
        user_org_id: orgId,
        result_limit: limit,
      });

      if (error) throw new Error(`BBox search failed: ${error.message}`);

      return respondWithGeoJson(results || []);
    }

    if (query) {
      // Trigram search on situs_address and owner_name
      const { data: results, error } = await supabase.rpc('search_parcels_by_text', {
        search_query: query,
        user_org_id: orgId,
        result_limit: limit,
      });

      if (error) throw new Error(`Text search failed: ${error.message}`);

      return respondWithGeoJson(results || []);
    }

    return new Response(
      JSON.stringify({ error: 'At least one of query, apn, or bbox is required' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ data: null, error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  function respondWithGeoJson(parcels: Record<string, unknown>[]) {
    const features = parcels.map((p) => ({
      type: 'Feature' as const,
      geometry: p.geometry || null,
      properties: {
        id: p.id,
        apn: p.apn,
        situs_address: p.situs_address,
        owner_name: p.owner_name,
        acreage: p.acreage,
        assessed_value: p.assessed_value,
        zoning: p.zoning,
        county: p.county,
        state_abbr: p.state_abbr,
      },
    }));

    const geojson = {
      type: 'FeatureCollection',
      features,
    };

    return new Response(
      JSON.stringify({ data: geojson, error: null }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

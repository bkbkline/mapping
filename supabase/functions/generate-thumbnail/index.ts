import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateThumbnailPayload {
  map_id: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const mapboxToken = Deno.env.get('MAPBOX_ACCESS_TOKEN')!;
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
    const payload: GenerateThumbnailPayload = await req.json();
    const { map_id } = payload;

    if (!map_id) {
      return new Response(JSON.stringify({ error: 'map_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch map record
    const { data: map, error: mapError } = await supabase
      .from('maps')
      .select('id, center_lng, center_lat, zoom, basemap, owner_id, org_id')
      .eq('id', map_id)
      .single();

    if (mapError || !map) {
      return new Response(JSON.stringify({ error: 'Map not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build Mapbox Static Images API URL
    // Format: https://api.mapbox.com/styles/v1/mapbox/{style}/static/{lng},{lat},{zoom}/{width}x{height}@2x
    const style = map.basemap || 'satellite-streets-v12';
    const lng = map.center_lng;
    const lat = map.center_lat;
    const zoom = Math.min(map.zoom, 22); // Mapbox static API max zoom
    const width = 600;
    const height = 400;

    const staticUrl = `https://api.mapbox.com/styles/v1/mapbox/${style}/static/${lng},${lat},${zoom}/${width}x${height}@2x?access_token=${mapboxToken}`;

    // Fetch the static image
    const imageResponse = await fetch(staticUrl);

    if (!imageResponse.ok) {
      throw new Error(`Mapbox API returned ${imageResponse.status}: ${await imageResponse.text()}`);
    }

    const imageBytes = new Uint8Array(await imageResponse.arrayBuffer());

    // Upload to storage
    const storagePath = `thumbnails/${map_id}.png`;

    const { error: uploadError } = await supabase.storage
      .from('map-thumbnails')
      .upload(storagePath, imageBytes, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    // Get public URL for the thumbnail
    const { data: publicUrlData } = supabase.storage
      .from('map-thumbnails')
      .getPublicUrl(storagePath);

    const thumbnailUrl = publicUrlData.publicUrl;

    // Update the map record with the thumbnail URL
    const { error: updateError } = await supabase
      .from('maps')
      .update({ thumbnail_url: thumbnailUrl })
      .eq('id', map_id);

    if (updateError) {
      throw new Error(`Failed to update map record: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({
        data: { thumbnail_url: thumbnailUrl },
        error: null,
      }),
      {
        status: 200,
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
});

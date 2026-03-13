import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExportDataPayload {
  type: 'csv' | 'xlsx' | 'geojson';
  collection_id?: string;
  parcel_ids?: string[];
  column_config: {
    columns: string[]; // which parcel columns to include
    include_custom_fields?: boolean;
  };
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
    const payload: ExportDataPayload = await req.json();
    const { type, collection_id, parcel_ids, column_config } = payload;

    if (!type || !['csv', 'xlsx', 'geojson'].includes(type)) {
      return new Response(JSON.stringify({ error: 'Invalid export type. Must be csv, xlsx, or geojson' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!collection_id && (!parcel_ids || parcel_ids.length === 0)) {
      return new Response(JSON.stringify({ error: 'collection_id or parcel_ids is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch parcels based on collection or direct IDs
    let parcels: Record<string, unknown>[] = [];

    if (collection_id) {
      // Fetch collection items with joined parcel data
      const { data: items, error: itemsError } = await supabase
        .from('collection_items')
        .select('*, parcel:parcels(*)')
        .eq('collection_id', collection_id);

      if (itemsError) throw new Error(`Failed to fetch collection items: ${itemsError.message}`);

      parcels = (items || [])
        .filter((item: Record<string, unknown>) => item.parcel !== null)
        .map((item: Record<string, unknown>) => {
          const parcel = item.parcel as Record<string, unknown>;
          // Merge collection item fields into the parcel record
          return {
            ...parcel,
            _status: item.status,
            _tags: item.tags,
            _notes: item.notes,
            _custom_fields: item.custom_fields,
          };
        });
    } else if (parcel_ids) {
      const { data: parcelData, error: parcelError } = await supabase
        .from('parcels')
        .select('*')
        .in('id', parcel_ids);

      if (parcelError) throw new Error(`Failed to fetch parcels: ${parcelError.message}`);
      parcels = parcelData || [];
    }

    if (parcels.length === 0) {
      return new Response(JSON.stringify({ error: 'No parcels found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Filter columns
    const columns = column_config.columns.length > 0
      ? column_config.columns
      : ['apn', 'situs_address', 'owner_name', 'acreage', 'zoning', 'assessed_value'];

    let fileContent: string;
    let contentType: string;
    let fileExtension: string;

    if (type === 'csv') {
      // Generate CSV
      const header = columns.join(',');
      const rows = parcels.map((p) =>
        columns.map((col) => {
          const val = p[col];
          if (val === null || val === undefined) return '';
          const str = String(val);
          // Escape CSV values containing commas or quotes
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        }).join(',')
      );
      fileContent = [header, ...rows].join('\n');
      contentType = 'text/csv';
      fileExtension = 'csv';
    } else if (type === 'geojson') {
      // Generate GeoJSON FeatureCollection
      const features = parcels.map((p) => {
        const properties: Record<string, unknown> = {};
        for (const col of columns) {
          properties[col] = p[col] ?? null;
        }
        return {
          type: 'Feature' as const,
          geometry: p.geometry || null,
          properties,
        };
      });
      fileContent = JSON.stringify({
        type: 'FeatureCollection',
        features,
      });
      contentType = 'application/geo+json';
      fileExtension = 'geojson';
    } else {
      // xlsx - generate as CSV for now; a full XLSX implementation would use
      // a library like SheetJS. The Next.js client can also handle the
      // conversion client-side.
      const header = columns.join('\t');
      const rows = parcels.map((p) =>
        columns.map((col) => String(p[col] ?? '')).join('\t')
      );
      fileContent = [header, ...rows].join('\n');
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      fileExtension = 'xlsx';
    }

    // Upload to storage
    const encoder = new TextEncoder();
    const fileBytes = encoder.encode(fileContent);
    const timestamp = Date.now();
    const fileName = `exports/${user.id}/${timestamp}_export.${fileExtension}`;

    const { error: uploadError } = await supabase.storage
      .from('exports')
      .upload(fileName, fileBytes, {
        contentType,
        upsert: true,
      });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    // Generate signed URL valid for 1 hour
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('exports')
      .createSignedUrl(fileName, 3600);

    if (signedUrlError || !signedUrlData) {
      throw new Error(`Failed to create signed URL: ${signedUrlError?.message}`);
    }

    return new Response(
      JSON.stringify({
        data: {
          file_url: signedUrlData.signedUrl,
          record_count: parcels.length,
          format: type,
        },
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

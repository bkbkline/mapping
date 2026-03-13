import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExportPdfPayload {
  map_id: string;
  viewport: { center: [number, number]; zoom: number; bearing: number; pitch: number };
  title: string;
  elements: string[]; // which UI elements to include: 'legend', 'scale', 'title', 'annotations'
  paper_size: 'letter' | 'legal' | 'tabloid' | 'a4' | 'a3';
  orientation: 'portrait' | 'landscape';
  dpi: 72 | 150 | 300;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Authenticate the calling user via their JWT
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

  let exportId: string | null = null;

  try {
    const payload: ExportPdfPayload = await req.json();
    const { map_id, viewport, title, elements, paper_size, orientation, dpi } = payload;

    if (!map_id) {
      return new Response(JSON.stringify({ error: 'map_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the user has access to this map
    const { data: mapData, error: mapError } = await supabase
      .from('maps')
      .select('id, org_id, owner_id, share_mode')
      .eq('id', map_id)
      .single();

    if (mapError || !mapData) {
      return new Response(JSON.stringify({ error: 'Map not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create export record with status 'pending'
    const { data: exportRecord, error: insertError } = await supabase
      .from('exports')
      .insert({
        org_id: mapData.org_id,
        created_by: user.id,
        export_type: 'pdf_map',
        status: 'pending',
        params: { map_id, viewport, title, elements, paper_size, orientation, dpi },
      })
      .select('id')
      .single();

    if (insertError || !exportRecord) {
      throw new Error(`Failed to create export record: ${insertError?.message}`);
    }

    exportId = exportRecord.id;

    // Update status to 'processing'
    await supabase
      .from('exports')
      .update({ status: 'processing' })
      .eq('id', exportId);

    // ---------------------------------------------------------------------------
    // PDF Generation Approach (Headless Chromium)
    // ---------------------------------------------------------------------------
    // In production, this function would:
    //
    // 1. Spin up a headless Chromium instance using a Deno-compatible library
    //    such as `astral` (https://deno.land/x/astral) or connect to a remote
    //    Chrome DevTools Protocol endpoint (e.g., Browserless.io).
    //
    // 2. Navigate to an internal "print-ready" route of the Next.js app, e.g.:
    //    `${APP_URL}/print/${map_id}?viewport=...&elements=...`
    //    This route renders the map at the requested viewport with the specified
    //    elements (legend, scale bar, title block, annotations).
    //
    // 3. Wait for the map tiles and all layers to fully load
    //    (await page.waitForSelector('.map-loaded')).
    //
    // 4. Call page.pdf({ format: paper_size, landscape: orientation === 'landscape' })
    //    to generate the PDF buffer.
    //
    // 5. Upload the PDF buffer to Supabase Storage (exports bucket).
    //
    // 6. Generate a signed URL for download.
    //
    // For now, we create a placeholder PDF and return a signed URL.
    // ---------------------------------------------------------------------------

    const placeholderContent = `%PDF-1.4 placeholder for map: ${title}`;
    const encoder = new TextEncoder();
    const pdfBytes = encoder.encode(placeholderContent);

    const fileName = `exports/${exportId}/${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from('exports')
      .upload(fileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Generate a signed URL valid for 1 hour
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('exports')
      .createSignedUrl(fileName, 3600);

    if (signedUrlError || !signedUrlData) {
      throw new Error(`Failed to create signed URL: ${signedUrlError?.message}`);
    }

    // Update export record to 'complete'
    await supabase
      .from('exports')
      .update({
        status: 'complete',
        file_url: signedUrlData.signedUrl,
        completed_at: new Date().toISOString(),
      })
      .eq('id', exportId);

    return new Response(
      JSON.stringify({
        data: {
          export_id: exportId,
          file_url: signedUrlData.signedUrl,
          status: 'complete',
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

    // Update export record to 'failed' if we have an ID
    if (exportId) {
      await supabase
        .from('exports')
        .update({
          status: 'failed',
          error_msg: message,
          completed_at: new Date().toISOString(),
        })
        .eq('id', exportId);
    }

    return new Response(
      JSON.stringify({ data: null, error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

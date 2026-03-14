import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single();

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const text = await file.text();
    const ext = file.name.split('.').pop()?.toLowerCase();

    let geojson: Record<string, unknown> | null = null;
    let fileType = 'geojson';
    let featureCount = 0;
    let geometryType: string | null = null;

    if (ext === 'geojson' || ext === 'json') {
      const parsed = JSON.parse(text);
      geojson = parsed;
      featureCount = parsed.features?.length || 0;
      geometryType = parsed.features?.[0]?.geometry?.type || null;
      fileType = 'geojson';
    } else if (ext === 'csv') {
      // Basic CSV parsing — client handles complex parsing
      fileType = 'csv';
      geojson = { type: 'FeatureCollection', features: [] };
    } else if (ext === 'kml') {
      fileType = 'kml';
      geojson = { type: 'FeatureCollection', features: [] };
    } else {
      return NextResponse.json({ error: `Unsupported file type: ${ext}` }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('imported_datasets')
      .insert({
        name: file.name.replace(/\.[^.]+$/, ''),
        file_type: fileType,
        feature_count: featureCount,
        geometry_type: geometryType,
        geojson,
        original_filename: file.name,
        owner_id: user.id,
        org_id: profile?.org_id,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to process file' }, { status: 500 });
  }
}

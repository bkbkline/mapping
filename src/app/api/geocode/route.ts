import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { env } from '@/lib/env';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('q');
    if (!query) {
      return NextResponse.json(
        { data: null, error: 'Query parameter "q" is required' },
        { status: 400 },
      );
    }

    const country = searchParams.get('country') || 'US';
    const limit = searchParams.get('limit') || '5';
    const types = searchParams.get('types') || 'address,place,poi';
    const proximity = searchParams.get('proximity');
    const bbox = searchParams.get('bbox');

    const mapboxUrl = new URL(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`,
    );
    mapboxUrl.searchParams.set('access_token', env.MAPBOX_TOKEN);
    mapboxUrl.searchParams.set('country', country);
    mapboxUrl.searchParams.set('limit', limit);
    mapboxUrl.searchParams.set('types', types);

    if (proximity) mapboxUrl.searchParams.set('proximity', proximity);
    if (bbox) mapboxUrl.searchParams.set('bbox', bbox);

    const response = await fetch(mapboxUrl.toString());

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { data: null, error: `Mapbox API error: ${response.status} ${errorText}` },
        { status: response.status },
      );
    }

    const result = await response.json();
    return NextResponse.json({ data: result.features, error: null });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

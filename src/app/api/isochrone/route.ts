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
    const lng = searchParams.get('lng');
    const lat = searchParams.get('lat');
    const profile = searchParams.get('profile') || 'driving';
    const contours_minutes = searchParams.get('contours_minutes') || searchParams.get('minutes') || '10';
    const polygons = searchParams.get('polygons') || 'true';

    if (!lng || !lat) {
      return NextResponse.json(
        { data: null, error: 'lng and lat query parameters are required' },
        { status: 400 },
      );
    }

    const validProfiles = ['driving', 'walking', 'cycling', 'driving-traffic'];
    if (!validProfiles.includes(profile)) {
      return NextResponse.json(
        { data: null, error: `Invalid profile. Must be one of: ${validProfiles.join(', ')}` },
        { status: 400 },
      );
    }

    const mapboxUrl = new URL(
      `https://api.mapbox.com/isochrone/v1/mapbox/${profile}/${lng},${lat}`,
    );
    mapboxUrl.searchParams.set('contours_minutes', contours_minutes);
    mapboxUrl.searchParams.set('polygons', polygons);
    mapboxUrl.searchParams.set('access_token', env.MAPBOX_TOKEN);

    const denoise = searchParams.get('denoise');
    const generalize = searchParams.get('generalize');
    if (denoise) mapboxUrl.searchParams.set('denoise', denoise);
    if (generalize) mapboxUrl.searchParams.set('generalize', generalize);

    const response = await fetch(mapboxUrl.toString());

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { data: null, error: `Mapbox API error: ${response.status} ${errorText}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json({ data, error: null });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

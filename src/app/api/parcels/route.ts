import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .single();

    if (!profile?.org_id) {
      return NextResponse.json({ data: null, error: 'No organization found' }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('query');
    const apn = searchParams.get('apn');
    const bbox = searchParams.get('bbox'); // "minLng,minLat,maxLng,maxLat"
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);

    // If bbox is provided, use PostGIS RPC
    if (bbox) {
      const coords = bbox.split(',').map(Number);
      if (coords.length !== 4 || coords.some(isNaN)) {
        return NextResponse.json(
          { data: null, error: 'Invalid bbox format. Expected: minLng,minLat,maxLng,maxLat' },
          { status: 400 },
        );
      }

      const [minLng, minLat, maxLng, maxLat] = coords;
      const { data: parcels, error } = await supabase.rpc('search_parcels_bbox', {
        p_org_id: profile.org_id,
        p_min_lng: minLng,
        p_min_lat: minLat,
        p_max_lng: maxLng,
        p_max_lat: maxLat,
        p_limit: limit,
      });

      if (error) {
        return NextResponse.json({ data: null, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ data: parcels, error: null, meta: { count: parcels?.length || 0 } });
    }

    // Text or APN search
    let dbQuery = supabase
      .from('parcels')
      .select('*')
      .eq('org_id', profile.org_id)
      .limit(limit);

    if (apn) {
      dbQuery = dbQuery.ilike('apn', `%${apn}%`);
    } else if (query) {
      dbQuery = dbQuery.or(
        `apn.ilike.%${query}%,situs_address.ilike.%${query}%,owner_name.ilike.%${query}%`,
      );
    }

    const { data: parcels, error } = await dbQuery;

    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: parcels, error: null, meta: { count: parcels?.length || 0 } });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

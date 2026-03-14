import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const parcelId = searchParams.get('parcel_id');
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const radius = searchParams.get('radius') || '3';

  if (parcelId) {
    const { data, error } = await supabase
      .from('comps')
      .select('*')
      .eq('parcel_id', parcelId)
      .order('sale_date', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  }

  if (lat && lng) {
    // Spatial query using PostGIS
    const { data, error } = await supabase.rpc('comps_within_radius', {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      radius_miles: parseFloat(radius),
    });
    if (error) {
      // Fallback to non-spatial query
      const { data: fallback, error: fallbackError } = await supabase
        .from('comps')
        .select('*')
        .order('sale_date', { ascending: false })
        .limit(50);
      if (fallbackError) return NextResponse.json({ error: fallbackError.message }, { status: 500 });
      return NextResponse.json({ data: fallback });
    }
    return NextResponse.json({ data });
  }

  // Default: return recent comps
  const { data, error } = await supabase
    .from('comps')
    .select('*')
    .order('sale_date', { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

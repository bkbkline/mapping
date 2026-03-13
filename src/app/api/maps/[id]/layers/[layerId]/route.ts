import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { updateLayerSchema } from '@/lib/schemas';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; layerId: string }> },
) {
  try {
    const { id, layerId } = await params;
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

    // Verify map belongs to org
    const { data: map } = await supabase
      .from('maps')
      .select('id')
      .eq('id', id)
      .eq('org_id', profile.org_id)
      .single();

    if (!map) {
      return NextResponse.json({ data: null, error: 'Map not found' }, { status: 404 });
    }

    const body = await req.json();
    const parsed = updateLayerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: 'Validation failed', meta: { issues: parsed.error.flatten().fieldErrors } },
        { status: 400 },
      );
    }

    const { data: layer, error } = await supabase
      .from('map_layers')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', layerId)
      .eq('map_id', id)
      .select()
      .single();

    if (error || !layer) {
      return NextResponse.json({ data: null, error: error?.message || 'Layer not found' }, { status: 404 });
    }

    return NextResponse.json({ data: layer, error: null });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; layerId: string }> },
) {
  try {
    const { id, layerId } = await params;
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

    const { data: map } = await supabase
      .from('maps')
      .select('id')
      .eq('id', id)
      .eq('org_id', profile.org_id)
      .single();

    if (!map) {
      return NextResponse.json({ data: null, error: 'Map not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('map_layers')
      .delete()
      .eq('id', layerId)
      .eq('map_id', id);

    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: { id: layerId }, error: null });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

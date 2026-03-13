import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { updateMapSchema } from '@/lib/schemas';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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

    const { data: map, error } = await supabase
      .from('maps')
      .select('*, map_layers(*)')
      .eq('id', id)
      .eq('org_id', profile.org_id)
      .single();

    if (error || !map) {
      return NextResponse.json({ data: null, error: error?.message || 'Map not found' }, { status: 404 });
    }

    return NextResponse.json({ data: map, error: null });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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

    const body = await req.json();
    const parsed = updateMapSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: 'Validation failed', meta: { issues: parsed.error.flatten().fieldErrors } },
        { status: 400 },
      );
    }

    const { data: map, error } = await supabase
      .from('maps')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('org_id', profile.org_id)
      .select()
      .single();

    if (error || !map) {
      return NextResponse.json({ data: null, error: error?.message || 'Map not found' }, { status: 404 });
    }

    return NextResponse.json({ data: map, error: null });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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

    const { data: map, error } = await supabase
      .from('maps')
      .update({ is_archived: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('org_id', profile.org_id)
      .select()
      .single();

    if (error || !map) {
      return NextResponse.json({ data: null, error: error?.message || 'Map not found' }, { status: 404 });
    }

    return NextResponse.json({ data: map, error: null });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

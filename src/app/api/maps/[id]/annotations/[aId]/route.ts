import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { updateAnnotationSchema } from '@/lib/schemas';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; aId: string }> },
) {
  try {
    const { id, aId } = await params;
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

    const body = await req.json();
    const parsed = updateAnnotationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: 'Validation failed', meta: { issues: parsed.error.flatten().fieldErrors } },
        { status: 400 },
      );
    }

    const { data: annotation, error } = await supabase
      .from('annotations')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', aId)
      .eq('map_id', id)
      .select()
      .single();

    if (error || !annotation) {
      return NextResponse.json({ data: null, error: error?.message || 'Annotation not found' }, { status: 404 });
    }

    return NextResponse.json({ data: annotation, error: null });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; aId: string }> },
) {
  try {
    const { id, aId } = await params;
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

    // Soft-delete
    const { data: annotation, error } = await supabase
      .from('annotations')
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq('id', aId)
      .eq('map_id', id)
      .select()
      .single();

    if (error || !annotation) {
      return NextResponse.json({ data: null, error: error?.message || 'Annotation not found' }, { status: 404 });
    }

    return NextResponse.json({ data: { id: aId }, error: null });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

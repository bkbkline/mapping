import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { updateCollectionItemSchema } from '@/lib/schemas';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; iId: string }> },
) {
  try {
    const { id, iId } = await params;
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

    // Verify collection belongs to org
    const { data: collection } = await supabase
      .from('collections')
      .select('id')
      .eq('id', id)
      .eq('org_id', profile.org_id)
      .single();

    if (!collection) {
      return NextResponse.json({ data: null, error: 'Collection not found' }, { status: 404 });
    }

    const body = await req.json();
    const parsed = updateCollectionItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: 'Validation failed', meta: { issues: parsed.error.flatten().fieldErrors } },
        { status: 400 },
      );
    }

    const { data: item, error } = await supabase
      .from('collection_items')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', iId)
      .eq('collection_id', id)
      .select('*, parcels(*)')
      .single();

    if (error || !item) {
      return NextResponse.json({ data: null, error: error?.message || 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ data: item, error: null });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; iId: string }> },
) {
  try {
    const { id, iId } = await params;
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

    const { data: collection } = await supabase
      .from('collections')
      .select('id')
      .eq('id', id)
      .eq('org_id', profile.org_id)
      .single();

    if (!collection) {
      return NextResponse.json({ data: null, error: 'Collection not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('collection_items')
      .delete()
      .eq('id', iId)
      .eq('collection_id', id);

    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: { id: iId }, error: null });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

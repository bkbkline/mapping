import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { addCollectionItemSchema } from '@/lib/schemas';

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

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = (page - 1) * limit;

    let query = supabase
      .from('collection_items')
      .select('*, parcels(*)', { count: 'exact' })
      .eq('collection_id', id)
      .order('added_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: items, error, count } = await query;

    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: items,
      error: null,
      meta: { total: count, page, limit },
    });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function POST(
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
    const parsed = addCollectionItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: 'Validation failed', meta: { issues: parsed.error.flatten().fieldErrors } },
        { status: 400 },
      );
    }

    const { data: item, error } = await supabase
      .from('collection_items')
      .insert({ ...parsed.data, collection_id: id })
      .select('*, parcels(*)')
      .single();

    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: item, error: null }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

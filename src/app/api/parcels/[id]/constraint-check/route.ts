import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { z } from 'zod';

const constraintCheckSchema = z.object({
  constraint_layers: z.array(z.string()).optional(),
  buffer_meters: z.number().min(0).max(50000).default(0),
});

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

    // Verify parcel belongs to org
    const { data: parcel } = await supabase
      .from('parcels')
      .select('id')
      .eq('id', id)
      .eq('org_id', profile.org_id)
      .single();

    if (!parcel) {
      return NextResponse.json({ data: null, error: 'Parcel not found' }, { status: 404 });
    }

    const body = await req.json();
    const parsed = constraintCheckSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: 'Validation failed', meta: { issues: parsed.error.flatten().fieldErrors } },
        { status: 400 },
      );
    }

    // Call PostGIS intersection check via Supabase RPC
    const { data: results, error } = await supabase.rpc('check_parcel_constraints', {
      p_parcel_id: id,
      p_constraint_layers: parsed.data.constraint_layers || [],
      p_buffer_meters: parsed.data.buffer_meters,
    });

    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: results, error: null });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

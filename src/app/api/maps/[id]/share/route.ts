import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { shareUpdateSchema } from '@/lib/schemas';

export async function GET(
  _req: NextRequest,
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

    const { data: map, error: mapError } = await supabase
      .from('maps')
      .select('id, share_mode')
      .eq('id', id)
      .eq('org_id', profile.org_id)
      .single();

    if (mapError || !map) {
      return NextResponse.json({ data: null, error: 'Map not found' }, { status: 404 });
    }

    const { data: grants, error: grantsError } = await supabase
      .from('map_grants')
      .select('*, profiles(email, full_name)')
      .eq('map_id', id);

    if (grantsError) {
      return NextResponse.json({ data: null, error: grantsError.message }, { status: 500 });
    }

    return NextResponse.json({
      data: { share_mode: map.share_mode, grants },
      error: null,
    });
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
    const parsed = shareUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: 'Validation failed', meta: { issues: parsed.error.flatten().fieldErrors } },
        { status: 400 },
      );
    }

    // Update share_mode if provided
    if (parsed.data.share_mode) {
      const { error } = await supabase
        .from('maps')
        .update({ share_mode: parsed.data.share_mode, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        return NextResponse.json({ data: null, error: error.message }, { status: 500 });
      }
    }

    // Update grants if provided
    if (parsed.data.grants) {
      // Remove existing grants
      await supabase.from('map_grants').delete().eq('map_id', id);

      if (parsed.data.grants.length > 0) {
        // Look up user IDs by email
        const emails = parsed.data.grants.map((g) => g.email);
        const { data: users } = await supabase
          .from('profiles')
          .select('id, email')
          .in('email', emails);

        if (users && users.length > 0) {
          const grantRows = parsed.data.grants
            .map((g) => {
              const targetUser = users.find((u) => u.email === g.email);
              if (!targetUser) return null;
              return {
                map_id: id,
                user_id: targetUser.id,
                can_edit: g.can_edit,
              };
            })
            .filter(Boolean);

          if (grantRows.length > 0) {
            const { error: insertError } = await supabase
              .from('map_grants')
              .insert(grantRows);

            if (insertError) {
              return NextResponse.json({ data: null, error: insertError.message }, { status: 500 });
            }
          }
        }
      }
    }

    // Return updated state
    const { data: updatedMap } = await supabase
      .from('maps')
      .select('share_mode')
      .eq('id', id)
      .single();

    const { data: updatedGrants } = await supabase
      .from('map_grants')
      .select('*, profiles(email, full_name)')
      .eq('map_id', id);

    return NextResponse.json({
      data: { share_mode: updatedMap?.share_mode, grants: updatedGrants },
      error: null,
    });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateRoleSchema = z.object({
  role: z.enum(['admin', 'editor', 'viewer']),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id, role')
      .eq('id', user.id)
      .single();

    if (!profile?.org_id) {
      return NextResponse.json({ data: null, error: 'No organization found' }, { status: 403 });
    }

    if (profile.role !== 'admin') {
      return NextResponse.json({ data: null, error: 'Only admins can update member roles' }, { status: 403 });
    }

    if (userId === user.id) {
      return NextResponse.json({ data: null, error: 'Cannot change your own role' }, { status: 400 });
    }

    const body = await req.json();
    const parsed = updateRoleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: 'Validation failed', meta: { issues: parsed.error.flatten().fieldErrors } },
        { status: 400 },
      );
    }

    const { data: member, error } = await supabase
      .from('profiles')
      .update({ role: parsed.data.role, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .eq('org_id', profile.org_id)
      .select('id, email, full_name, role')
      .single();

    if (error || !member) {
      return NextResponse.json({ data: null, error: error?.message || 'Member not found' }, { status: 404 });
    }

    return NextResponse.json({ data: member, error: null });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id, role')
      .eq('id', user.id)
      .single();

    if (!profile?.org_id) {
      return NextResponse.json({ data: null, error: 'No organization found' }, { status: 403 });
    }

    if (profile.role !== 'admin') {
      return NextResponse.json({ data: null, error: 'Only admins can remove members' }, { status: 403 });
    }

    if (userId === user.id) {
      return NextResponse.json({ data: null, error: 'Cannot remove yourself' }, { status: 400 });
    }

    // Remove member from org by setting org_id to null
    const { data: member, error } = await supabase
      .from('profiles')
      .update({ org_id: null, role: 'viewer', updated_at: new Date().toISOString() })
      .eq('id', userId)
      .eq('org_id', profile.org_id)
      .select('id, email')
      .single();

    if (error || !member) {
      return NextResponse.json({ data: null, error: error?.message || 'Member not found' }, { status: 404 });
    }

    return NextResponse.json({ data: { id: userId }, error: null });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

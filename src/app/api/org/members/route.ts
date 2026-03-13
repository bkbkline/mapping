import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { z } from 'zod';

const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'editor', 'viewer']).default('viewer'),
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest) {
  try {
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

    const { data: members, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url, role, created_at')
      .eq('org_id', profile.org_id)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: members, error: null });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
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
      return NextResponse.json({ data: null, error: 'Only admins can invite members' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = inviteMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: 'Validation failed', meta: { issues: parsed.error.flatten().fieldErrors } },
        { status: 400 },
      );
    }

    // Check if user already exists and belongs to another org
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, org_id')
      .eq('email', parsed.data.email)
      .single();

    if (existingProfile) {
      if (existingProfile.org_id === profile.org_id) {
        return NextResponse.json(
          { data: null, error: 'User is already a member of this organization' },
          { status: 409 },
        );
      }

      // Add existing user to org
      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update({ org_id: profile.org_id, role: parsed.data.role })
        .eq('id', existingProfile.id)
        .select('id, email, full_name, role')
        .single();

      if (error) {
        return NextResponse.json({ data: null, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ data: updatedProfile, error: null }, { status: 201 });
    }

    // Create invitation record for new user
    const { data: invitation, error } = await supabase
      .from('invitations')
      .insert({
        org_id: profile.org_id,
        email: parsed.data.email,
        role: parsed.data.role,
        invited_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: invitation, error: null }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

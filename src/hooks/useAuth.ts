'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const router = useRouter();
  const { user, profile, org, role, loading, setSession, clearSession, setLoading } = useAuthStore();
  const supabase = createClient();

  useEffect(() => {
    const getSession = async () => {
      setLoading(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        let orgData = null;
        if (profileData?.org_id) {
          const { data } = await supabase
            .from('orgs')
            .select('*')
            .eq('id', profileData.org_id)
            .single();
          orgData = data;
        }
        if (profileData) {
          setSession(authUser, profileData, orgData);
        }
      } else {
        clearSession();
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session?.user) {
          clearSession();
          return;
        }
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          let orgData = null;
          if (profileData?.org_id) {
            const { data } = await supabase
              .from('orgs')
              .select('*')
              .eq('id', profileData.org_id)
              .single();
            orgData = data;
          }
          if (profileData) {
            setSession(session.user, profileData, orgData);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, setSession, clearSession, setLoading]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    clearSession();
    router.push('/login');
  }, [supabase, clearSession, router]);

  return { user, profile, org, role, loading, signOut };
}

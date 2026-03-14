'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const router = useRouter();
  const { user, profile, org, role, loading, setSession, clearSession, setLoading } = useAuthStore();
  const supabase = createClient();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const getSession = async () => {
      setLoading(true);

      try {
        // Use getSession (reads cookies locally, no network call) instead of
        // getUser (network request that can hang/timeout)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (!session?.user || sessionError) {
          clearSession();
          return;
        }

        const authUser = session.user;

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (!profileData) {
          // User exists in auth but no profile row yet — still let the app render
          setLoading(false);
          return;
        }

        let orgData = null;
        if (profileData.org_id) {
          const { data } = await supabase
            .from('orgs')
            .select('*')
            .eq('id', profileData.org_id)
            .single();
          orgData = data;
        }

        setSession(authUser, profileData, orgData);
      } catch {
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
          } else {
            setLoading(false);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    clearSession();
    router.push('/login');
  }, [supabase, clearSession, router]);

  return { user, profile, org, role, loading, signOut };
}

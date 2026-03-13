import { create } from 'zustand';
import type { Profile, Org, UserRole } from '@/types';
import type { User } from '@supabase/supabase-js';

interface AuthStore {
  user: User | null;
  profile: Profile | null;
  org: Org | null;
  role: UserRole | null;
  loading: boolean;

  setSession: (user: User, profile: Profile, org: Org | null) => void;
  clearSession: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  profile: null,
  org: null,
  role: null,
  loading: true,

  setSession: (user, profile, org) =>
    set({ user, profile, org, role: profile.role, loading: false }),
  clearSession: () =>
    set({ user: null, profile: null, org: null, role: null, loading: false }),
  setLoading: (loading) => set({ loading }),
}));

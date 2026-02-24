import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { withTimeout } from '@/lib/api-helpers';

interface AuthState {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  checkUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAdmin: false,
  loading: true,
  checkUser: async () => {
    try {
      const { data: { session } } = await withTimeout(
        supabase.auth.getSession(),
        10000
      );
      const user = session?.user ?? null;
      let isAdmin = false;

      if (user) {
        try {
          const { data } = await withTimeout(
            supabase
              .from('admin_users')
              .select('id')
              .eq('id', user.id)
              .maybeSingle(),
            10000
          );
          if (data) isAdmin = true;
        } catch (error) {
          console.error('Error checking admin status:', error);
        }
      }

      set({ user, isAdmin, loading: false });

      supabase.auth.onAuthStateChange(async (_event, session) => {
        const user = session?.user ?? null;
        let isAdmin = false;

        if (user) {
          try {
            const { data } = await withTimeout(
              supabase
                .from('admin_users')
                .select('id')
                .eq('id', user.id)
                .maybeSingle(),
              10000
            );
            if (data) isAdmin = true;
          } catch (error) {
            console.error('Error checking admin status:', error);
          }
        }

        set({ user, isAdmin });
      });
    } catch (error) {
      console.error('Error checking user session:', error);
      set({ loading: false });
    }
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAdmin: false });
  },
}));

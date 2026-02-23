import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

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
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user ?? null;
      let isAdmin = false;

      if (user) {
        // Check if user is in admin_users table
        const { data } = await supabase
            .from('admin_users')
            .select('id')
            .eq('id', user.id)
            .single();
        if (data) isAdmin = true;
      }

      set({ user, isAdmin, loading: false });

      supabase.auth.onAuthStateChange(async (_event, session) => {
        const user = session?.user ?? null;
        let isAdmin = false;

        if (user) {
            const { data } = await supabase
                .from('admin_users')
                .select('id')
                .eq('id', user.id)
                .single();
            if (data) isAdmin = true;
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

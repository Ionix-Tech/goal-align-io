import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type AppRole = 'ceo' | 'pmo_manager' | 'project_member';

export function useUserRole() {
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      console.log('[useUserRole] No user found, setting role to null');
      setRole(null);
      setLoading(false);
      return;
    }

    console.log('[useUserRole] User found:', user.id);

    const fetchRole = async () => {
      try {
        console.log('[useUserRole] Fetching role for user:', user.id);
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        console.log('[useUserRole] Query result:', { data, error });

        if (error) {
          console.error('[useUserRole] Error fetching user role:', error);
          setRole(null);
        } else {
          console.log('[useUserRole] Role found:', data?.role);
          setRole(data?.role as AppRole);
        }
      } catch (error) {
        console.error('[useUserRole] Exception fetching user role:', error);
        setRole(null);
      } finally {
        console.log('[useUserRole] Loading complete, role:', role);
        setLoading(false);
      }
    };

    fetchRole();
  }, [user]);

  const isManager = true; // All users have full access
  
  return { role, loading, isManager };
}

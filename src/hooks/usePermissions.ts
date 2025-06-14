
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

export interface UserRole {
  id: string;
  user_id: string;
  organization_id: string | null;
  role: AppRole;
  created_at: string;
  updated_at: string;
}

export const usePermissions = (organizationId?: string) => {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setUserRoles([]);
      setLoading(false);
      return;
    }

    const fetchUserRoles = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', user.id);

        if (error) throw error;

        setUserRoles(data || []);
      } catch (err) {
        console.error('Error fetching user roles:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRoles();
  }, [user]);

  const hasPermission = async (permission: string, targetOrganizationId?: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('check_user_permission', {
        permission_to_check: permission,
        target_organization_id: targetOrganizationId || organizationId || null
      });

      if (error) {
        console.error('Error checking permission:', error);
        return false;
      }

      return data || false;
    } catch (err) {
      console.error('Error checking permission:', err);
      return false;
    }
  };

  const hasRole = (role: AppRole, targetOrganizationId?: string): boolean => {
    return userRoles.some(userRole => {
      if (role === 'SUPER_ADMIN') {
        return userRole.role === role && userRole.organization_id === null;
      }
      return userRole.role === role && userRole.organization_id === (targetOrganizationId || organizationId);
    });
  };

  const getHighestRole = (targetOrganizationId?: string): AppRole | null => {
    const relevantRoles = userRoles.filter(userRole => {
      if (userRole.role === 'SUPER_ADMIN') return userRole.organization_id === null;
      return userRole.organization_id === (targetOrganizationId || organizationId);
    });

    if (relevantRoles.length === 0) return null;

    // Role hierarchy (highest to lowest)
    const roleHierarchy: AppRole[] = ['SUPER_ADMIN', 'ORGANIZATION_ADMIN', 'MANAGER', 'ANALYST', 'VIEWER'];
    
    for (const role of roleHierarchy) {
      if (relevantRoles.some(r => r.role === role)) {
        return role;
      }
    }

    return null;
  };

  const isSuperAdmin = (): boolean => {
    return userRoles.some(role => role.role === 'SUPER_ADMIN' && role.organization_id === null);
  };

  const isOrganizationAdmin = (targetOrganizationId?: string): boolean => {
    return hasRole('ORGANIZATION_ADMIN', targetOrganizationId) || isSuperAdmin();
  };

  return {
    userRoles,
    loading,
    error,
    hasPermission,
    hasRole,
    getHighestRole,
    isSuperAdmin,
    isOrganizationAdmin,
  };
};
